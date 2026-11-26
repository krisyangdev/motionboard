import { createFileRoute } from '@tanstack/react-router'
import { appEnv, flag } from '@/core/server/env'
import { handle, json } from '@/core/server/http'
import { SITE } from '../../../site.config.ts'

// What the login and sign-up pages should show.
export const Route = createFileRoute('/api/config')({
  server: {
    handlers: {
      GET: handle(async () => {
        if (!SITE.accounts.enabled) return json({ error: 'Not found' }, { status: 404 })
        const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = appEnv()
        return json({
          google: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
          turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || null,
          mockPayments: flag('MOCK_PAYMENTS'),
        })
      }),
    },
  },
})
