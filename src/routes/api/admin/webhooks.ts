import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/core/admin/auth'
import { listWebhooks, parsePage } from '@/core/admin/queries'
import { handle, json } from '@/core/server/http'

export const Route = createFileRoute('/api/admin/webhooks')({
  server: {
    handlers: {
      GET: handle(async ({ request }) => {
        await requireAdmin(request)
        return json(await listWebhooks(parsePage(new URL(request.url))))
      }),
    },
  },
})
