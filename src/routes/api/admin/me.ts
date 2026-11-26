import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/core/admin/auth'
import { handle, json } from '@/core/server/http'

export const Route = createFileRoute('/api/admin/me')({
  server: {
    handlers: {
      GET: handle(async ({ request }) => json({ admin: await requireAdmin(request) })),
    },
  },
})
