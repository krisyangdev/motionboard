// The site password hook end to end through a real Better Auth sign-in (memory adapter): a user moved in
// from ShotFrames, whose account row holds a ShotFrames-format hash, signs in with the old password.
import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { describe, expect, it, vi } from 'vitest'

// ShotFrames' format: i2s-pbkdf2:<salt>:pbkdf2-sha256:<iterations>:<base64url PBKDF2-SHA256>.
// Fixture made with password 'correct-horse-battery'.
const FIXTURE = 'i2s-pbkdf2:Fx7aQ2mZ9kLp0wRt:pbkdf2-sha256:12000:Zsl15atqrR1ZaKkr9f_eiXT8y4PVSDPhDtNrOPovJJQ'

vi.mock('../../site/auth', () => {
  const enc = new TextEncoder()
  const derive = async (password: string, salt: string, iterations: number) => {
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations, hash: 'SHA-256' }, key, 256)
    return Buffer.from(bits).toString('base64url')
  }
  return {
    authSite: {
      password: {
        hash: async (password: string) => {
          const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
          return `i2s-pbkdf2:${salt}:pbkdf2-sha256:12000:${await derive(password, salt, 12000)}`
        },
        verify: async ({ hash, password }: { hash: string; password: string }) => {
          const m = hash.match(/^i2s-pbkdf2:(.+):pbkdf2-sha256:(\d+):(.+)$/)
          return Boolean(m) && (await derive(password, m![1], Number(m![2]))) === m![3]
        },
      },
    },
  }
})

describe('site password hasher', () => {
  it('signs in a user whose stored hash is in the site format, and only with the right password', async () => {
    const { passwordOptions } = await import('./password')
    const now = new Date()
    const db: Record<string, Record<string, unknown>[]> = {
      user: [{ id: 'usr_1', name: 'Old User', email: 'old@example.com', emailVerified: true, createdAt: now, updatedAt: now }],
      account: [{ id: 'acc_1', accountId: 'usr_1', providerId: 'credential', userId: 'usr_1', password: FIXTURE, createdAt: now, updatedAt: now }],
      session: [],
      verification: [],
    }
    const auth = betterAuth({
      secret: 'test-secret-test-secret-test-secret',
      baseURL: 'http://localhost:3000',
      database: memoryAdapter(db),
      emailAndPassword: { enabled: true, ...passwordOptions() },
    })
    const ok = await auth.api.signInEmail({ body: { email: 'old@example.com', password: 'correct-horse-battery' } })
    expect(ok.user.id).toBe('usr_1')
    await expect(auth.api.signInEmail({ body: { email: 'old@example.com', password: 'wrong-password-123' } })).rejects.toThrow()
  })
})
