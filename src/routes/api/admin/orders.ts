import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/core/admin/auth'
import { listOrders, parsePage } from '@/core/admin/queries'
import { handle, json } from '@/core/server/http'

export const Route = createFileRoute('/api/admin/orders')({
  server: {
    handlers: {
      GET: handle(async ({ request }) => {
        await requireAdmin(request)
        return json(await listOrders(parsePage(new URL(request.url))))
      }),
    },
  },
})
