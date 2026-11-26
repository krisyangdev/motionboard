import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/core/admin/auth'
import { listAudit, parsePage } from '@/core/admin/queries'
import { handle, json } from '@/core/server/http'

export const Route = createFileRoute('/api/admin/audit')({
  server: {
    handlers: {
      GET: handle(async ({ request }) => {
        await requireAdmin(request)
        return json(await listAudit(parsePage(new URL(request.url))))
      }),
    },
  },
})
