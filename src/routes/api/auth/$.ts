import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/core/auth/server'
import { handle, json } from '@/core/server/http'
import { SITE } from '../../../../site.config.ts'

// Better Auth: sign-up, sign-in, verification, reset, Google, Dodo webhooks and portal.
const run = handle(async ({ request }: { request: Request }) => {
  if (!SITE.accounts.enabled) return json({ error: 'Not found' }, { status: 404 })
  return auth().handler(request)
})

export const Route = createFileRoute('/api/auth/$')({
  server: { handlers: { GET: run, POST: run } },
})
