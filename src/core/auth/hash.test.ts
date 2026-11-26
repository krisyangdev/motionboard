import { describe, expect, it } from 'vitest'
import { hashPassword, ITERATIONS, verifyPassword } from './hash'

const pbkdf2 = async (password: string, salt: string, iterations: number) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations, hash: 'SHA-256' }, key, 256)
  return Buffer.from(bits).toString('base64url')
}

describe('template password hasher', () => {
  it('stores the iteration count and verifies only the right password', async () => {
    const hash = await hashPassword('correct-horse-battery')
    const [prefix, iter, salt, digest] = hash.split('$')
    expect([prefix, Number(iter)]).toEqual(['pbkdf2-sha256', ITERATIONS])
    expect(salt.length).toBeGreaterThan(10)
    expect(digest).toHaveLength(43)
    expect(await verifyPassword({ hash, password: 'correct-horse-battery' })).toBe(true)
    expect(await verifyPassword({ hash, password: 'wrong' })).toBe(false)
  })
  it('verifies a hash made with another iteration count', async () => {
    const old = ['pbkdf2-sha256', 1000, 'somesalt', await pbkdf2('pw-123456', 'somesalt', 1000)].join('$')
    expect(await verifyPassword({ hash: old, password: 'pw-123456' })).toBe(true)
  })
  it('rejects other formats and absurd iteration counts', async () => {
    expect(await verifyPassword({ hash: 'salt:hash', password: 'x' })).toBe(false)
    expect(await verifyPassword({ hash: ['pbkdf2-sha256', 100_000_000, 's', 'h'].join('$'), password: 'x' })).toBe(false)
    expect(await verifyPassword({ hash: '', password: 'x' })).toBe(false)
  })
})
