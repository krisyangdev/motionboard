import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/core/admin/auth'
import { getUserDetail } from '@/core/admin/queries'
import { handle, HttpError, json } from '@/core/server/http'

export const Route = createFileRoute('/api/admin/users/$id/')({
  server: {
    handlers: {
      GET: handle(async ({ request, params }: { request: Request; params: { id: string } }) => {
        await requireAdmin(request)
        const detail = await getUserDetail(params.id)
        if (!detail) throw new HttpError(404, 'User not found', 'not_found')
        return json(detail)
      }),
    },
  },
})
