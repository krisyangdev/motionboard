import { createFileRoute } from '@tanstack/react-router'
import { listMockEmails } from '@/core/email/send'
import { flag } from '@/core/server/env'
import { handle, json } from '@/core/server/http'
import { SITE } from '../../../../site.config.ts'

// The last mock emails, newest first. Only exists with MOCK_EMAIL; the e2e test reads verification links here.
export const Route = createFileRoute('/api/mock/emails')({
  server: {
    handlers: {
      GET: handle(async () => {
        if (!SITE.accounts.enabled || !flag('MOCK_EMAIL')) return json({ error: 'Not found' }, { status: 404 })
        return json({ items: listMockEmails() })
      }),
    },
  },
})
