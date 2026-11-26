import { createFileRoute } from '@tanstack/react-router'
import { requireUser } from '@/core/auth/session'
import { listTransactions } from '@/core/credits/ledger'
import { handle, HttpError, json } from '@/core/server/http'
import { SITE } from '../../../../site.config.ts'

export const Route = createFileRoute('/api/credits/transactions')({
  server: {
    handlers: {
      GET: handle(async ({ request }: { request: Request }) => {
        if (!SITE.accounts.enabled) throw new HttpError(404, 'Not found', 'not_found')
        const user = await requireUser(request)
        const rows = await listTransactions(user.id, 50)
        return json({
          items: rows.map((r) => ({
            id: r.id,
            availableDelta: r.availableDelta,
            frozenDelta: r.frozenDelta,
            type: r.type,
            sourceType: r.sourceType,
            sourceId: r.sourceId,
            availableAfter: r.availableAfter,
            createdAt: r.createdAt,
          })),
        })
      }),
    },
  },
})
