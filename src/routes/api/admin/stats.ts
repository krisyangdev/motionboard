import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/core/admin/auth'
import { getStats } from '@/core/admin/queries'
import { handle, json } from '@/core/server/http'

export const Route = createFileRoute('/api/admin/stats')({
  server: {
    handlers: {
      GET: handle(async ({ request }) => {
        await requireAdmin(request)
        return json(await getStats())
      }),
    },
  },
})
