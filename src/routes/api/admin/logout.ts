import { createFileRoute } from '@tanstack/react-router'
import { clearedSessionCookie, logoutAdmin, requireAdmin } from '@/core/admin/auth'
import { handle, json } from '@/core/server/http'

export const Route = createFileRoute('/api/admin/logout')({
  server: {
    handlers: {
      POST: handle(async ({ request }) => {
        const admin = await requireAdmin(request)
        await logoutAdmin(request, admin)
        return json({ ok: true }, { headers: { 'set-cookie': clearedSessionCookie(request) } })
      }),
    },
  },
})
