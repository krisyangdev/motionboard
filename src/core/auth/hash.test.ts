import { describe, expect, it } from 'vitest'
import { hashPassword, needsRehash, SCRYPT, verifyPassword } from './hash'

const pbkdf2 = async (password: string, salt: string, iterations: number) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations, hash: 'SHA-256' }, key, 256)
  return Buffer.from(bits).toString('base64url')
}

describe('template password hasher', () => {
  it('stores scrypt parameters and verifies only the right password', async () => {
    const hash = await hashPassword('correct-horse-battery')
    const [prefix, n, r, p, salt, digest] = hash.split('$')
    expect([prefix, Number(n), Number(r), Number(p)]).toEqual(['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p])
    expect(salt.length).toBeGreaterThan(10)
    expect(digest).toHaveLength(43)
    expect(await verifyPassword({ hash, password: 'correct-horse-battery' })).toBe(true)
    expect(await verifyPassword({ hash, password: 'wrong' })).toBe(false)
    expect(needsRehash(hash)).toBe(false)
  })
  it('verifies older PBKDF2 hashes and marks them for rehash', async () => {
    const old = ['pbkdf2-sha256', 20_000, 'somesalt', await pbkdf2('pw-123456', 'somesalt', 20_000)].join('$')
    expect(await verifyPassword({ hash: old, password: 'pw-123456' })).toBe(true)
    expect(await verifyPassword({ hash: old, password: 'pw-1234567' })).toBe(false)
    expect(needsRehash(old)).toBe(true)
  })
  it('verifies scrypt hashes made with other parameters and marks them for rehash', async () => {
    const hash = await hashPassword('pw-123456')
    const [, , , , salt] = hash.split('$')
    const { scryptSync } = await import('node:crypto')
    const weaker = ['scrypt', 1024, 8, 1, salt, scryptSync('pw-123456', salt, 32, { N: 1024, r: 8, p: 1 }).toString('base64url')].join('$')
    expect(await verifyPassword({ hash: weaker, password: 'pw-123456' })).toBe(true)
    expect(needsRehash(weaker)).toBe(true)
  })
  it('rejects other formats and absurd parameters', async () => {
    expect(await verifyPassword({ hash: 'salt:hash', password: 'x' })).toBe(false)
    expect(await verifyPassword({ hash: ['pbkdf2-sha256', 100_000_000, 's', 'h'].join('$'), password: 'x' })).toBe(false)
    expect(await verifyPassword({ hash: ['scrypt', 1 << 20, 8, 1, 's', 'h'].join('$'), password: 'x' })).toBe(false)
    expect(await verifyPassword({ hash: '', password: 'x' })).toBe(false)
    expect(needsRehash('salt:hash')).toBe(false)
  })
})
