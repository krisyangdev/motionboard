import { createFileRoute } from '@tanstack/react-router'
import { providers } from '@/site/generation'
import { handle, HttpError, json } from '@/core/server/http'
import { SITE } from '../../../../site.config.ts'

export const Route = createFileRoute('/api/generation/costs')({
  server: {
    handlers: {
      GET: handle(async ({ request: _request }: { request: Request }) => {
        if (!SITE.accounts.enabled) throw new HttpError(404, 'Not found', 'not_found')
        return json(Object.fromEntries(Object.entries(providers).map(([kind, provider]) => [kind, provider.cost({ prompt: '' })])))
      }),
    },
  },
})
