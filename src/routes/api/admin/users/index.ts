import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/core/admin/auth'
import { listUsers, parsePage } from '@/core/admin/queries'
import { handle, json } from '@/core/server/http'

export const Route = createFileRoute('/api/admin/users/')({
  server: {
    handlers: {
      GET: handle(async ({ request }) => {
        await requireAdmin(request)
        const url = new URL(request.url)
        return json(await listUsers((url.searchParams.get('q') ?? '').trim().slice(0, 100), parsePage(url)))
      }),
    },
  },
})
