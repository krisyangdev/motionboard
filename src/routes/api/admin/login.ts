import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { loginAdmin, sessionCookie, audit } from '@/core/admin/auth'
import { rateLimit } from '@/core/security/rate-limit'
import { handle, HttpError, json, readJson, requestIp } from '@/core/server/http'

const body = z.object({ email: z.string().trim().min(3).max(254), password: z.string().min(1).max(128) })

export const Route = createFileRoute('/api/admin/login')({
  server: {
    handlers: {
      POST: handle(async ({ request }) => {
        const ip = requestIp(request)
        await rateLimit(`admin-login:${ip}`, 10, 15 * 60)
        const input = await readJson(request, body)
        try {
          const { admin, token } = await loginAdmin(input)
          return json({ admin }, { headers: { 'set-cookie': sessionCookie(request, token) } })
        } catch (error) {
          if (error instanceof HttpError && error.status === 401) {
            await audit('anonymous', 'admin.login_failed', 'admin_user', undefined, { email: input.email.trim().toLowerCase(), ip })
          }
          throw error
        }
      }),
    },
  },
})
