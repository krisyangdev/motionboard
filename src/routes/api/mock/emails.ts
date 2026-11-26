import { createFileRoute } from '@tanstack/react-router'
import { listMockEmails } from '@/core/email/send'
import { timingSafeEqual } from '@/core/admin/crypto'
import { appEnv, flag } from '@/core/server/env'
import { handle, json } from '@/core/server/http'
import { SITE } from '../../../../site.config.ts'

// The last mock emails, newest first. Only exists with MOCK_EMAIL, and only for callers holding the admin
// bootstrap token (they contain sign-in links); the e2e test reads verification links here.
export const Route = createFileRoute('/api/mock/emails')({
  server: {
    handlers: {
      GET: handle(async ({ request }) => {
        if (!SITE.accounts.enabled || !flag('MOCK_EMAIL')) return json({ error: 'Not found' }, { status: 404 })
        const token = appEnv().ADMIN_BOOTSTRAP_TOKEN
        if (!token || !timingSafeEqual(request.headers.get('x-bootstrap-token') ?? '', token)) return json({ error: 'Forbidden' }, { status: 403 })
        return json({ items: await listMockEmails() })
      }),
    },
  },
})
