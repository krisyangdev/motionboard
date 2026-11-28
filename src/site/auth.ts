// Site-owned auth hooks, read by src/core/auth/server.ts. Every field is optional; an empty object is the
// template's own behaviour. A site that moves an existing user base in (ShotFrames) uses them to keep its
// URLs, cookies and emails unchanged so users stay signed in.
//
// - password: { hash, verify } for a stored hash format other than the template's (src/core/auth/hash.ts).
//   Keep it cheap: Workers Free allows 10 ms CPU per request (PBKDF2-SHA256 at 12k-20k fits; 100k and scrypt do not).
// - basePath: where Better Auth answers (default /api/auth). The OAuth callback is <BETTER_AUTH_URL><basePath>/callback/<provider>.
// - cookiePrefix: cookie name prefix (default Better Auth's "better-auth").
// - trustedOrigins: origins allowed besides BETTER_AUTH_URL (e.g. other hosts of the same site).
// - account: Better Auth account options (linking, token encryption).
// - session: Better Auth session options (e.g. expiresIn; default 7 days).
// - plugins: extra Better Auth plugins, added before the template's own.
// - sendVerificationEmail: replaces the template's verification mail.
// - signupProps: extra properties for the template's `signup` event (e.g. first-touch attribution); they win over the template's.
// - afterUserCreated: runs after the template's signup grant and `signup` event.
import type { BetterAuthOptions, BetterAuthPlugin, User } from 'better-auth'
import type { Props } from '../core/server/track'

export type PasswordHasher = {
  hash: (password: string) => Promise<string>
  verify: (input: { hash: string; password: string }) => Promise<boolean>
}

export type AuthSite = {
  password?: PasswordHasher
  basePath?: string
  cookiePrefix?: string
  trustedOrigins?: string[]
  account?: BetterAuthOptions['account']
  session?: BetterAuthOptions['session']
  plugins?: () => BetterAuthPlugin[]
  sendVerificationEmail?: (data: { user: User; url: string; token: string }, request?: Request) => Promise<void>
  signupProps?: (user: User, request?: Request) => Props | Promise<Props>
  afterUserCreated?: (user: User) => Promise<void>
}

export const authSite: AuthSite = {}
