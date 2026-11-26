// Credits ledger on D1. Invariants: available and frozen never go negative, every balance change
// writes exactly one credit_transactions row, and the same change can never apply twice.
//
// D1 runs a batch as one transaction, but a statement that matches no rows does not abort it, and
// one statement cannot read another's result. So every change is ONE batch whose statements are
// all guarded by data the earlier statements wrote (a "marker" row inserted only when the guard
// held), never by application-side checks:
//   hold    reservation row is inserted only if available >= amount; the balance update and the
//           transaction row only run if that reservation row exists. changes === 0 on the
//           reservation insert means "not enough credits".
//   commit / refund  the reservation flips held -> committed/refunded; the transaction row is only
//           inserted if the reservation has that status AND no commit/refund transaction exists for
//           the source yet (so a repeat is a no-op); the balance update only runs if that
//           transaction row exists.
//   grant   the transaction row is inserted only if no (type, sourceType, sourceId) row exists yet
//           (the unique index backs this up); the balance update only runs if the row exists.
//   adjust  the transaction row is inserted only if the balance stays >= 0.
// The transaction row is inserted BEFORE the balance update and computes its own after-balances
// from the account row (INSERT ... SELECT), so available_after / frozen_after are exact.
import { and, desc, eq, exists, gte, notExists, sql, type SQL } from 'drizzle-orm'
import { db } from '../db'
import { creditAccounts, creditReservations, creditTransactions } from '../db/schema'
import { createId, nowIso } from '../server/ids'
import { HttpError } from '../server/http'

export type Balance = { available: number; frozen: number }

const changes = (result: unknown) => (result as D1Result).meta.changes

const positiveInt = (n: number, what: string) => {
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${what} must be a positive integer`)
}

const ensureAccount = (userId: string, now: string) =>
  db().insert(creditAccounts).values({ userId, available: 0, frozen: 0, updatedAt: now }).onConflictDoNothing()

/** Truthy when the transaction row `txId` was inserted by this batch. */
const txExists = (txId: string) =>
  exists(db().select({ one: sql`1` }).from(creditTransactions).where(eq(creditTransactions.id, txId)))

const reservationExists = (where: SQL | undefined) =>
  exists(db().select({ one: sql`1` }).from(creditReservations).where(where))

/** INSERT ... SELECT from the account row: runs only when `guard` holds and the account exists. */
function insertTx(t: {
  id: string
  userId: string
  availableDelta: number
  frozenDelta: number
  type: string
  sourceType: string
  sourceId: string
  availableAfter: SQL
  frozenAfter: SQL
  metadata: Record<string, unknown>
  now: string
  guard: SQL | undefined
}) {
  return db()
    .insert(creditTransactions)
    .select((qb) =>
      qb
        .select({
          id: sql<string>`${t.id}`,
          userId: sql<string>`${t.userId}`,
          availableDelta: sql<number>`${t.availableDelta}`,
          frozenDelta: sql<number>`${t.frozenDelta}`,
          type: sql<string>`${t.type}`,
          sourceType: sql<string>`${t.sourceType}`,
          sourceId: sql<string>`${t.sourceId}`,
          availableAfter: t.availableAfter,
          frozenAfter: t.frozenAfter,
          metadataJson: sql<string>`${JSON.stringify(t.metadata)}`,
          createdAt: sql<string>`${t.now}`,
        })
        .from(creditAccounts)
        .where(and(eq(creditAccounts.userId, t.userId), t.guard)),
    )
}

const applyDelta = (userId: string, txId: string, availableDelta: number, frozenDelta: number, now: string) =>
  db()
    .update(creditAccounts)
    .set({
      available: sql`${creditAccounts.available} + ${availableDelta}`,
      frozen: sql`${creditAccounts.frozen} + ${frozenDelta}`,
      updatedAt: now,
    })
    .where(and(eq(creditAccounts.userId, userId), txExists(txId)))

function isUniqueViolation(error: unknown): boolean {
  for (let e: unknown = error, i = 0; e && i < 5; i++, e = (e as { cause?: unknown }).cause) {
    if (String((e as { message?: unknown }).message ?? e).includes('UNIQUE constraint failed')) return true
  }
  return false
}

export async function getBalance(userId: string): Promise<Balance> {
  const row = await db()
    .select({ available: creditAccounts.available, frozen: creditAccounts.frozen })
    .from(creditAccounts)
    .where(eq(creditAccounts.userId, userId))
    .get()
  return row ?? { available: 0, frozen: 0 }
}

export async function listTransactions(userId: string, limit = 50) {
  return db()
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt), sql`rowid desc`)
    .limit(Math.min(Math.max(limit, 1), 200))
}

/** Adds credits. Idempotent on (type, sourceType, sourceId): a repeat returns the balance unchanged. */
export async function grant(input: {
  userId: string
  amount: number
  type: string
  sourceType: string
  sourceId: string
  metadata?: Record<string, unknown>
}): Promise<Balance> {
  const { userId, amount, type, sourceType, sourceId } = input
  positiveInt(amount, 'grant amount')
  const txId = createId('ctx')
  const now = nowIso()
  const sameSource = and(
    eq(creditTransactions.type, type),
    eq(creditTransactions.sourceType, sourceType),
    eq(creditTransactions.sourceId, sourceId),
  )
  try {
    await db().batch([
      ensureAccount(userId, now),
      insertTx({
        id: txId,
        userId,
        availableDelta: amount,
        frozenDelta: 0,
        type,
        sourceType,
        sourceId,
        availableAfter: sql`${creditAccounts.available} + ${amount}`,
        frozenAfter: sql`${creditAccounts.frozen}`,
        metadata: { amount, ...input.metadata },
        now,
        guard: notExists(db().select({ one: sql`1` }).from(creditTransactions).where(sameSource)),
      }),
      applyDelta(userId, txId, amount, 0, now),
    ])
  } catch (error) {
    // A concurrent identical grant won the unique index: the batch rolled back, nothing applied twice.
    if (!isUniqueViolation(error)) throw error
  }
  return getBalance(userId)
}

/** Moves `amount` from available to frozen and returns the reservation. 402 when the balance is too low. */
export async function hold(input: {
  userId: string
  amount: number
  sourceType: string
  sourceId: string
}): Promise<{ reservationId: string; balance: Balance }> {
  const { userId, amount, sourceType, sourceId } = input
  positiveInt(amount, 'hold amount')
  const reservationId = createId('res')
  const txId = createId('ctx')
  const now = nowIso()
  const reserved = reservationExists(eq(creditReservations.id, reservationId))

  const results = await db().batch([
    ensureAccount(userId, now),
    db()
      .insert(creditReservations)
      .select((qb) =>
        qb
          .select({
            id: sql<string>`${reservationId}`,
            userId: sql<string>`${userId}`,
            amount: sql<number>`${amount}`,
            status: sql<string>`'held'`,
            sourceType: sql<string>`${sourceType}`,
            sourceId: sql<string>`${sourceId}`,
            createdAt: sql<string>`${now}`,
            updatedAt: sql<string>`${now}`,
          })
          .from(creditAccounts)
          .where(and(eq(creditAccounts.userId, userId), gte(creditAccounts.available, amount))),
      ),
    insertTx({
      id: txId,
      userId,
      availableDelta: -amount,
      frozenDelta: amount,
      type: 'hold',
      sourceType,
      sourceId,
      availableAfter: sql`${creditAccounts.available} - ${amount}`,
      frozenAfter: sql`${creditAccounts.frozen} + ${amount}`,
      metadata: { amount, reservationId },
      now,
      guard: reserved,
    }),
    applyDelta(userId, txId, -amount, amount, now),
  ])
  if (changes(results[1]) !== 1) throw new HttpError(402, 'Not enough credits', 'insufficient_credits')
  return { reservationId, balance: await getBalance(userId) }
}

/** Flips a held reservation and books the matching transaction; a no-op unless the reservation is held. */
async function settle(reservationId: string, kind: 'commit' | 'refund', reason?: string): Promise<Balance> {
  const reservation = await db().select().from(creditReservations).where(eq(creditReservations.id, reservationId)).get()
  if (!reservation) throw new Error(`Reservation not found: ${reservationId}`)
  const { userId, amount, sourceType, sourceId } = reservation
  const status = kind === 'commit' ? 'committed' : 'refunded'
  const availableDelta = kind === 'refund' ? amount : 0
  const txId = createId('ctx')
  const now = nowIso()

  await db().batch([
    db()
      .update(creditReservations)
      .set({ status, updatedAt: now })
      .where(and(eq(creditReservations.id, reservationId), eq(creditReservations.status, 'held'))),
    insertTx({
      id: txId,
      userId,
      availableDelta,
      frozenDelta: -amount,
      type: kind,
      sourceType,
      sourceId,
      availableAfter: sql`${creditAccounts.available} + ${availableDelta}`,
      frozenAfter: sql`${creditAccounts.frozen} - ${amount}`,
      metadata: { amount, reservationId, ...(reason ? { reason } : {}) },
      now,
      guard: and(
        reservationExists(and(eq(creditReservations.id, reservationId), eq(creditReservations.status, status))),
        notExists(
          db()
            .select({ one: sql`1` })
            .from(creditTransactions)
            .where(
              and(
                eq(creditTransactions.type, kind),
                eq(creditTransactions.sourceType, sourceType),
                eq(creditTransactions.sourceId, sourceId),
              ),
            ),
        ),
      ),
    }),
    applyDelta(userId, txId, availableDelta, -amount, now),
  ])
  return getBalance(userId)
}

/** The held credits are spent: frozen decreases. No-op if the reservation is not held. */
export const commit = (reservationId: string) => settle(reservationId, 'commit')

/** The held credits return to available. No-op if the reservation is not held. */
export const refund = (reservationId: string, reason: string) => settle(reservationId, 'refund', reason)

/** Admin correction, positive or negative; available may not drop below 0. */
export async function adjust(input: { userId: string; delta: number; adminId: string; reason: string }): Promise<Balance> {
  const { userId, delta, adminId, reason } = input
  if (!Number.isInteger(delta) || delta === 0) throw new HttpError(400, 'Delta must be a non-zero integer', 'bad_request')
  const txId = createId('ctx')
  const now = nowIso()
  const results = await db().batch([
    ensureAccount(userId, now),
    insertTx({
      id: txId,
      userId,
      availableDelta: delta,
      frozenDelta: 0,
      type: 'adjust',
      sourceType: 'admin',
      // Every adjustment is its own event, so the id doubles as the unique source id.
      sourceId: txId,
      availableAfter: sql`${creditAccounts.available} + ${delta}`,
      frozenAfter: sql`${creditAccounts.frozen}`,
      metadata: { adminId, reason },
      now,
      guard: gte(sql`${creditAccounts.available} + ${delta}`, 0),
    }),
    applyDelta(userId, txId, delta, 0, now),
  ])
  if (changes(results[1]) !== 1) throw new HttpError(400, 'Balance cannot go below 0', 'bad_request')
  return getBalance(userId)
}
