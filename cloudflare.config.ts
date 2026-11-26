// Site-owned: every site has its own Worker, database, bucket and queue.
// Secrets are not listed here except the required ones; set any secret with
// `cf workers secrets update` (names in src/core/server/env.ts and .dev.vars.example).
// It imports nothing from the app: the Cloudflare Vite plugin puts every file this config imports on Vite's
// fs.deny list, which breaks `npm run dev`. So the Worker name, domain and site name are repeated from
// site.config.ts; scripts/test.mjs checks they match.
import { bindings, defineConfig, triggers } from 'cf/config'

export default defineConfig({
  worker: {
    name: 'site-template',
    compatibilityDate: '2026-11-20',
    compatibilityFlags: ['nodejs_compat'],
    // fetch (TanStack Start) + queue + scheduled in one Worker.
    entrypoint: './src/server.ts',
    observability: { enabled: true },
    domains: ['template.krisyang.dev'],
    env: {
      DB: bindings.d1({ name: 'site-template', id: '28ab46c0-0d3e-4fbb-8b5e-8c79a83d7ce8' }),
      BUCKET: bindings.r2({ name: 'site-template-files' }),
      JOBS: bindings.queue<{ jobId: string }>({ name: 'site-template-jobs' }),
      // Declared as a secret only because local runs take values from .dev.vars for secrets alone (text
      // bindings cannot be overridden locally). Production value: https://<domain>, set with
      // `cf workers secrets update`.
      BETTER_AUTH_URL: bindings.secret(),
      BETTER_AUTH_SECRET: bindings.secret(),
      ADMIN_BOOTSTRAP_TOKEN: bindings.secret(),
      DODO_PAYMENTS_ENVIRONMENT: bindings.text('test_mode'),
      EMAIL_FROM: bindings.text('Site Template <noreply@template.krisyang.dev>'),
      // The template demo has no Dodo, Resend or model keys, so it runs on the local fakes.
      // A real site sets these to 'false' once its keys are in place.
      MOCK_PAYMENTS: bindings.text('true'),
      MOCK_EMAIL: bindings.text('true'),
      MOCK_GENERATION: bindings.text('true'),
    },
    triggers: [
      triggers.queue({ name: 'site-template-jobs', maxBatchSize: 1, maxBatchTimeout: 5, maxRetries: 3 }),
      // Refund stale credit holds, clear expired rate limits and admin sessions.
      triggers.scheduled({ schedule: '*/10 * * * *' }),
    ],
  },
})
