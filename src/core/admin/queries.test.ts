// With a site jobs source (src/site/admin-jobs.ts) the admin's three job reads go to it and never touch the db `jobs` table.
import { describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ fromTables: [] as unknown[], calls: [] as string[] }))
const USER = vi.hoisted(() => ({ table: 'user' }))
const JOBS = vi.hoisted(() => ({ table: 'jobs', id: 'id', status: 'status', userId: 'userId', createdAt: 'createdAt' }))

// A chainable query stub that records which table each query reads from and resolves to no rows.
const chain = () => {
  let table: unknown
  const q: unknown = new Proxy(() => {}, {
    get: (_t, prop) => {
      // The user table returns one row so getUserDetail reaches its jobs section.
      if (prop === 'then') return (resolve: (v: unknown[]) => void) => resolve(table === USER ? [{ id: 'u1', createdAt: new Date(0) }] : [])
      if (prop === 'from') return (t: unknown) => ((table = t), state.fromTables.push(t), q)
      return () => q
    },
  })
  return q
}
vi.mock('cloudflare:workers', () => ({ env: {} }))
vi.mock('../db', () => ({
  db: () => ({ select: chain, ...{ then: undefined } }),
  schema: new Proxy({ jobs: JOBS, user: USER }, { get: (t, p) => (p in t ? (t as Record<string | symbol, unknown>)[p] : { table: String(p) }) }),
}))
vi.mock('../../site/admin-jobs', () => ({
  adminJobs: {
    statusCounts: async () => (state.calls.push('statusCounts'), [{ status: 'done', count: 3 }]),
    list: async (o: { limit: number; offset: number }) => (state.calls.push(`list:${o.limit}:${o.offset}`), { rows: [{ id: 'j1', userId: 'u1', kind: 'gen', status: 'done', cost: 2, error: null, createdAt: 0 }], total: 120 }),
    forUser: async (id: string, limit: number) => (state.calls.push(`forUser:${id}:${limit}`), [{ id: 'j1', userId: id, kind: 'gen', status: 'done', cost: 2, error: null, createdAt: 0 }]),
  },
}))

import { getStats, getUserDetail, listJobs } from './queries'

describe('admin queries with a site jobs source', () => {
  it('reads job status, the jobs list and a user\'s jobs from the site source', async () => {
    const stats = await getStats()
    expect(stats.jobs).toEqual([{ status: 'done', count: 3 }])

    const page = await listJobs(2)
    expect(page.items[0]).toMatchObject({ id: 'j1', email: null, attempts: 0, createdAt: '1970-01-01T00:00:00.000Z' })
    expect(page.hasMore).toBe(true)

    const detail = await getUserDetail('u1')
    expect(detail?.jobs).toEqual([{ id: 'j1', kind: 'gen', status: 'done', cost: 2, error: null, createdAt: '1970-01-01T00:00:00.000Z' }])

    expect(state.calls).toEqual(['statusCounts', 'list:50:50', 'forUser:u1:20'])
    expect(state.fromTables).not.toContain(JOBS)
  })
})
