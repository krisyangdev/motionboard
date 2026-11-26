// R2 keys and the Workers Free rules for R2: every upload is size-capped, and mock emails are pruned so the prefix stays small.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, string>()
const bucket = {
  put: vi.fn(async (key: string, body: string) => void store.set(key, body)),
  list: vi.fn(async ({ prefix }: { prefix: string }) => ({ objects: [...store.keys()].filter((k) => k.startsWith(prefix)).sort().map((key) => ({ key })) })),
  delete: vi.fn(async (keys: string[]) => keys.forEach((k) => store.delete(k))),
}
vi.mock('../server/env', () => ({ appEnv: () => ({ BUCKET: bucket }), flag: () => true }))

beforeEach(() => {
  store.clear()
  vi.clearAllMocks()
})

describe('isOwnedKey', () => {
  it('accepts keys under the user prefix', async () => {
    const { isOwnedKey } = await import('./r2')
    expect(isOwnedKey('jobs/usr_1/job_2.svg', 'usr_1')).toBe(true)
  })
  it('rejects other users, traversal and odd paths', async () => {
    const { isOwnedKey } = await import('./r2')
    expect(isOwnedKey('jobs/usr_2/job_2.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('jobs/usr_1/../usr_2/job.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('jobs/usr_1//job.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('jobs/usr_1/a\\b.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('jobs/usr_10/job.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('other/usr_1/job.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('jobs/a/b/job.svg', 'a/b')).toBe(false)
  })
})

describe('putObject', () => {
  it('writes an object up to MAX_OBJECT_BYTES and refuses a larger one without writing', async () => {
    const { putObject, MAX_OBJECT_BYTES } = await import('./r2')
    await putObject('jobs/u/a.txt', 'small', 'text/plain')
    expect(store.has('jobs/u/a.txt')).toBe(true)
    await expect(putObject('jobs/u/big.bin', new ArrayBuffer(MAX_OBJECT_BYTES + 1), 'application/octet-stream')).rejects.toThrow(/MAX_OBJECT_BYTES/)
    expect(store.has('jobs/u/big.bin')).toBe(false)
  })
})

describe('pruneMockEmails', () => {
  it('deletes mock emails older than a day in one call and keeps newer ones', async () => {
    const { pruneMockEmails } = await import('../email/send')
    const now = Date.parse('2026-11-27T12:00:00.000Z')
    store.set('mock-emails/2026-11-25T12:00:00.000Z-aaaa.json', '{}')
    store.set('mock-emails/2026-11-26T11:59:00.000Z-bbbb.json', '{}')
    store.set('mock-emails/2026-11-27T11:00:00.000Z-cccc.json', '{}')
    store.set('jobs/u/keep.svg', '<svg/>')
    expect(await pruneMockEmails(now)).toBe(2)
    expect(bucket.delete).toHaveBeenCalledTimes(1)
    expect([...store.keys()].sort()).toEqual(['jobs/u/keep.svg', 'mock-emails/2026-11-27T11:00:00.000Z-cccc.json'])
    expect(await pruneMockEmails(now)).toBe(0)
    expect(bucket.delete).toHaveBeenCalledTimes(1)
  })
})
