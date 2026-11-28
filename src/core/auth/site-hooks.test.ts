// The site auth hooks (src/site/auth.ts) through core auth(): a real Better Auth sign-up on a memory adapter shows the
// site's basePath and cookie prefix in use, the site's verification mail replacing the template's, the site plugin
// mounted, and afterUserCreated running after the template's signup grant.
import { memoryAdapter } from 'better-auth/adapters/memory'
import { describe, expect, it, vi } from 'vitest'

const calls = vi.hoisted(() => ({ verifyMail: [] as string[], created: [] as string[], grants: [] as string[], pluginHits: 0 }))
const store = vi.hoisted(() => ({ user: [], session: [], account: [], verification: [] }) as Record<string, Record<string, unknown>[]>)

vi.mock('cloudflare:workers', () => ({ env: {} }))
vi.mock('../server/env', () => ({
  appEnv: () => ({ BETTER_AUTH_URL: 'https://api.example.com', BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret' }),
  flag: () => false,
  dodoEnvironment: () => 'test_mode',
}))
vi.mock('better-auth/adapters/drizzle', () => ({ drizzleAdapter: () => memoryAdapter(store) }))
vi.mock('better-auth/tanstack-start', () => ({ tanstackStartCookies: () => ({ id: 'tanstack-start-cookies-stub' }) }))
vi.mock('../db', () => ({ db: () => ({}), schema: {} }))
vi.mock('../credits/ledger', () => ({ grant: async ({ userId }: { userId: string }) => void calls.grants.push(userId) }))
vi.mock('../server/track', () => ({ trackServer: () => {}, captureServerException: () => {} }))
vi.mock('../email/send', () => ({ sendEmail: async () => { throw new Error('template mail must not be sent') } }))
vi.mock('../../../site.config.ts', async (original) => {
  const real = (await original()) as { SITE: object }
  return { SITE: { ...real.SITE, accounts: { enabled: true, signupCredits: 50 } } }
})
vi.mock('../../site/auth', () => ({
  authSite: {
    basePath: '/auth/v2',
    cookiePrefix: 'mysite',
    trustedOrigins: ['https://app.example.com'],
    plugins: () => [
      {
        id: 'site-ping',
        endpoints: {},
        onRequest: async () => {
          calls.pluginHits++
        },
      },
    ],
    sendVerificationEmail: async ({ user }: { user: { email: string } }) => void calls.verifyMail.push(user.email),
    afterUserCreated: async (user: { id: string }) => {
      // the template's grant has already run
      expect(calls.grants).toContain(user.id)
      calls.created.push(user.id)
    },
  },
}))

describe('site auth hooks', () => {
  it('serves sign-up at the site basePath and runs the site hooks', async () => {
    const { auth } = await import('./server')
    const res = await auth().handler(
      new Request('https://api.example.com/auth/v2/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://app.example.com' },
        body: JSON.stringify({ email: 'new@example.com', password: 'correct-horse-battery', name: 'New' }),
      }),
    )
    expect(res.status).toBe(200)
    expect(store.user).toHaveLength(1)
    const id = store.user[0].id as string
    expect(calls.grants).toEqual([id])
    expect(calls.created).toEqual([id])
    expect(calls.verifyMail).toEqual(['new@example.com'])
    expect(calls.pluginHits).toBeGreaterThan(0)
  })

  it('does not answer at the template path, and names cookies with the site prefix', async () => {
    const { auth } = await import('./server')
    const moved = await auth().handler(new Request('https://api.example.com/api/auth/ok'))
    expect(moved.status).toBe(404)
    store.user[0].emailVerified = true
    const signIn = await auth().handler(
      new Request('https://api.example.com/auth/v2/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://app.example.com' },
        body: JSON.stringify({ email: 'new@example.com', password: 'correct-horse-battery' }),
      }),
    )
    expect(signIn.status).toBe(200)
    const cookies = signIn.headers.get('set-cookie') ?? ''
    expect(cookies).toContain('mysite.session_token=')
    expect(cookies).not.toContain('better-auth.')
  })
})
