import { createFileRoute } from '@tanstack/react-router'
import { requireUser } from '@/core/auth/session'
import { handle, HttpError } from '@/core/server/http'
import { getObjectForUser } from '@/core/storage/r2'
import { SITE } from '../../../../site.config.ts'

const PREFIX = '/api/files/'

export const Route = createFileRoute('/api/files/$')({
  server: {
    handlers: {
      GET: handle(async ({ request }: { request: Request }) => {
        if (!SITE.accounts.enabled) throw new HttpError(404, 'Not found', 'not_found')
        const user = await requireUser(request)
        let key: string
        try {
          key = decodeURIComponent(new URL(request.url).pathname.slice(PREFIX.length))
        } catch {
          throw new HttpError(404, 'Not found', 'not_found')
        }
        const object = await getObjectForUser(key, user.id)
        if (!object) throw new HttpError(404, 'Not found', 'not_found')
        return new Response(object.body, {
          headers: {
            'content-type': object.httpMetadata?.contentType ?? 'application/octet-stream',
            'cache-control': 'private, max-age=3600',
            'x-content-type-options': 'nosniff',
            // Generated SVGs are user-influenced: no scripts, no external loads.
            'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
          },
        })
      }),
    },
  },
})
