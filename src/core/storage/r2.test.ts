import { describe, expect, it, vi } from 'vitest'

// r2.ts imports the Workers env; the pure key check does not need it.
vi.mock('../server/env', () => ({ appEnv: () => ({}) }))

const { isOwnedKey } = await import('./r2')

describe('isOwnedKey', () => {
  it('accepts keys under the user prefix', () => {
    expect(isOwnedKey('jobs/usr_1/job_2.svg', 'usr_1')).toBe(true)
  })
  it('rejects other users, traversal and odd paths', () => {
    expect(isOwnedKey('jobs/usr_2/job_2.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('jobs/usr_1/../usr_2/job.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('jobs/usr_1//job.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('jobs/usr_1/a\\b.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('jobs/usr_10/job.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('other/usr_1/job.svg', 'usr_1')).toBe(false)
    expect(isOwnedKey('jobs/a/b/job.svg', 'a/b')).toBe(false)
  })
})
