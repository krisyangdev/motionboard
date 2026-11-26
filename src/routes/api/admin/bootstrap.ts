import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { audit, provisionAdmin } from '@/core/admin/auth'
import { timingSafeEqual } from '@/core/admin/crypto'
import { rateLimit } from '@/core/security/rate-limit'
import { appEnv } from '@/core/server/env'
import { handle, HttpError, json, readJson, requestIp } from '@/core/server/http'

const body = z.object({ email: z.email().max(254), password: z.string().min(8).max(128) })

// Creates the first admin, or resets the password of an existing one. Needs the ADMIN_BOOTSTRAP_TOKEN secret.
export const Route = createFileRoute('/api/admin/bootstrap')({
  server: {
    handlers: {
      POST: handle(async ({ request }) => {
        const secret = appEnv().ADMIN_BOOTSTRAP_TOKEN
        if (!secret) throw new HttpError(404, 'Not found', 'not_found')
        await rateLimit(`admin-bootstrap:${requestIp(request)}`, 10, 60 * 60)
        if (!timingSafeEqual(request.headers.get('x-bootstrap-token') ?? '', secret)) throw new HttpError(403, 'Forbidden', 'forbidden')
        const input = await readJson(request, body)
        const { admin, created } = await provisionAdmin({ ...input, role: 'owner' })
        await audit('bootstrap', created ? 'admin.bootstrap_create' : 'admin.bootstrap_reset', 'admin_user', admin.id, { email: admin.email })
        return json({ admin, created }, { status: created ? 201 : 200 })
      }),
    },
  },
})
