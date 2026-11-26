// Bindings and secrets of the Worker. Server code reads them with appEnv(); never process.env.
// Bindings are declared in cloudflare.config.ts; secrets are set with `cf workers secrets update`
// and locally in .dev.vars (see .dev.vars.example).
import { env } from 'cloudflare:workers'

export type JobMessage = { jobId: string }

export type AppEnv = {
  DB: D1Database
  BUCKET: R2Bucket
  JOBS: Queue<JobMessage>
  ASSETS: Fetcher
  /** Site origin, e.g. https://example.com (http://127.0.0.1:3000 locally). */
  BETTER_AUTH_URL: string
  BETTER_AUTH_SECRET: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  DODO_PAYMENTS_API_KEY?: string
  DODO_PAYMENTS_WEBHOOK_SECRET?: string
  DODO_PAYMENTS_ENVIRONMENT?: 'test_mode' | 'live_mode'
  RESEND_API_KEY?: string
  /** "Name <hello@example.com>" */
  EMAIL_FROM?: string
  TURNSTILE_SECRET_KEY?: string
  /** PostHog project key for server events (same "Sites" project as the browser). */
  POSTHOG_KEY?: string
  /** Header value that allows POST /api/admin/bootstrap to create or reset an admin. */
  ADMIN_BOOTSTRAP_TOKEN?: string
  /** 'true' = local fakes instead of the real service. */
  MOCK_PAYMENTS?: string
  MOCK_EMAIL?: string
  MOCK_GENERATION?: string
}

export const appEnv = () => env as unknown as AppEnv

/** A `MOCK_*` (or any 'true'/'false') var as a boolean. */
export const flag = (name: 'MOCK_PAYMENTS' | 'MOCK_EMAIL' | 'MOCK_GENERATION') => appEnv()[name] === 'true'

export const dodoEnvironment = () => appEnv().DODO_PAYMENTS_ENVIRONMENT ?? 'test_mode'
