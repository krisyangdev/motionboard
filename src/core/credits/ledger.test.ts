// Runs the real ledger and rate limiter against an in-memory SQLite (node:sqlite) loaded from the
// project migration, behind a minimal D1 stand-in (prepare/bind/run/all/raw/batch with rollback).
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

const sqlite = new DatabaseSync(':memory:')
sqlite.exec(readFileSync(fileURLToPath(new URL('../../../migrations/0000_init.sql', import.meta.url)), 'utf8').replaceAll('--> statement-breakpoint', ''))

const exec = (sql: string, params: unknown[]) => {
  const stmt = sqlite.prepare(sql)
  if (/^\s*select|\sreturning\s/i.test(sql)) {
    return { success: true, results: stmt.all(...(params as never[])) as Record<string, unknown>[], meta: { changes: 0 } }
  }
  return { success: true, results: [], meta: { changes: Number(stmt.run(...(params as never[])).changes) } }
}

const prepare = (sql: string) => {
  const make = (params: unknown[]) => ({
    sql,
    params,
    bind: (...p: unknown[]) => make(p),
    run: async () => exec(sql, params),
    all: async () => exec(sql, params),
    raw: async () => exec(sql, params).results.map((row) => Object.values(row)),
  })
  return make([])
}

const fakeD1 = {
  prepare,
  // Like D1: the whole batch is one transaction, an error rolls everything back.
  batch: async (statements: { sql: string; params: unknown[] }[]) => {
    sqlite.exec('BEGIN')
    try {
      const results = statements.map((s) => exec(s.sql, s.params))
      sqlite.exec('COMMIT')
      return results
    } catch (error) {
      sqlite.exec('ROLLBACK')
      throw error
    }
  },
}

vi.mock('cloudflare:workers', () => ({ env: { DB: fakeD1 } }))

const ledger = await import('./ledger')
const { rateLimit } = await import('../security/rate-limit')

const USER = 'u1'
const balance = () => ledger.getBalance(USER)

/** Never negative, deltas add up to the account, last row records the current balance. */
function expectInvariants() {
  expect(sqlite.prepare('select * from credit_accounts where available < 0 or frozen < 0').all()).toEqual([])
  const sum = sqlite.prepare('select sum(available_delta) a, sum(frozen_delta) f from credit_transactions where user_id = ?').get(USER) as { a: number; f: number }
  const account = sqlite.prepare('select available, frozen from credit_accounts where user_id = ?').get(USER) as { available: number; frozen: number }
  expect(sum).toEqual({ a: account.available, f: account.frozen })
  const last = sqlite.prepare('select available_after a, frozen_after f from credit_transactions where user_id = ? order by rowid desc limit 1').get(USER) as { a: number; f: number }
  expect(last).toEqual({ a: account.available, f: account.frozen })
}

describe('credits ledger', () => {
  it('keeps balances correct and idempotent through grant, hold, commit, refund and adjust', async () => {
    const signup = { userId: USER, amount: 20, type: 'grant', sourceType: 'signup', sourceId: USER }
    expect(await ledger.grant(signup)).toEqual({ available: 20, frozen: 0 })
    expect(await ledger.grant(signup)).toEqual({ available: 20, frozen: 0 })
    expectInvariants()

    await expect(ledger.hold({ userId: USER, amount: 21, sourceType: 'job', sourceId: 'j0' })).rejects.toMatchObject({ status: 402, code: 'insufficient_credits' })
    expect(await balance()).toEqual({ available: 20, frozen: 0 })
    expect(sqlite.prepare('select count(*) c from credit_reservations').get()).toEqual({ c: 0 })

    const h1 = await ledger.hold({ userId: USER, amount: 5, sourceType: 'job', sourceId: 'j1' })
    expect(h1.balance).toEqual({ available: 15, frozen: 5 })
    const h2 = await ledger.hold({ userId: USER, amount: 5, sourceType: 'job', sourceId: 'j2' })
    expect(h2.balance).toEqual({ available: 10, frozen: 10 })
    expectInvariants()

    expect(await ledger.commit(h1.reservationId)).toEqual({ available: 10, frozen: 5 })
    expect(await ledger.commit(h1.reservationId)).toEqual({ available: 10, frozen: 5 })
    expect(await ledger.refund(h1.reservationId, 'late')).toEqual({ available: 10, frozen: 5 })
    expectInvariants()

    expect(await ledger.refund(h2.reservationId, 'job_failed')).toEqual({ available: 15, frozen: 0 })
    expect(await ledger.refund(h2.reservationId, 'again')).toEqual({ available: 15, frozen: 0 })
    expect(await ledger.commit(h2.reservationId)).toEqual({ available: 15, frozen: 0 })
    expectInvariants()

    expect(await ledger.adjust({ userId: USER, delta: -5, adminId: 'a1', reason: 'fix' })).toEqual({ available: 10, frozen: 0 })
    await expect(ledger.adjust({ userId: USER, delta: -11, adminId: 'a1', reason: 'too much' })).rejects.toMatchObject({ status: 400 })
    expect(await ledger.adjust({ userId: USER, delta: 10, adminId: 'a1', reason: 'bonus' })).toEqual({ available: 20, frozen: 0 })
    expectInvariants()

    // signup grant, 2 holds, commit, refund, 2 adjusts
    expect(await ledger.listTransactions(USER, 50)).toHaveLength(7)
  })

  it('never overspends under concurrent holds', async () => {
    await ledger.grant({ userId: USER, amount: 1, type: 'grant', sourceType: 'bonus', sourceId: 'concurrency' })
    expect(await balance()).toEqual({ available: 21, frozen: 0 })
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, i) => ledger.hold({ userId: USER, amount: 10, sourceType: 'job', sourceId: `c${i}` })),
    )
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(2)
    expect(await balance()).toEqual({ available: 1, frozen: 20 })
    expectInvariants()
  })
})

describe('rateLimit', () => {
  it('allows the limit, then 429, then resets after the window', async () => {
    for (let i = 0; i < 3; i++) await rateLimit('k', 3, 60)
    await expect(rateLimit('k', 3, 60)).rejects.toMatchObject({ status: 429, code: 'rate_limited' })
    sqlite.exec("update rate_limits set reset_at = 1 where key = 'k'")
    await rateLimit('k', 3, 60)
    expect(sqlite.prepare("select count from rate_limits where key = 'k'").get()).toEqual({ count: 1 })
  })
})
