import { createFileRoute } from '@tanstack/react-router'
import { requireUser } from '@/core/auth/session'
import { getBalance } from '@/core/credits/ledger'
import { handle, HttpError, json } from '@/core/server/http'
import { SITE } from '../../../site.config.ts'

export const Route = createFileRoute('/api/me')({
  server: {
    handlers: {
      GET: handle(async ({ request }: { request: Request }) => {
        if (!SITE.accounts.enabled) throw new HttpError(404, 'Not found', 'not_found')
        const user = await requireUser(request)
        return json({ user, balance: await getBalance(user.id) })
      }),
    },
  },
})
