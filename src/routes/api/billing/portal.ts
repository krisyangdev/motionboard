import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/core/auth/server'
import { requireUser } from '@/core/auth/session'
import { hasDodoKey, isMockPayments } from '@/core/billing/dodo'
import { localizePath } from '@/core/i18n'
import { handle, HttpError, json } from '@/core/server/http'
import { SITE } from '../../../../site.config.ts'

// Dodo customer portal (invoices, payment methods). Mock mode has none, so it sends the user to the account page.
export const Route = createFileRoute('/api/billing/portal')({
  server: {
    handlers: {
      POST: handle(async ({ request }) => {
        if (!SITE.accounts.enabled) return json({ error: 'Not found' }, { status: 404 })
        const user = await requireUser(request)
        if (isMockPayments() || !hasDodoKey()) return json({ url: localizePath(user.locale, '/account/') })
        const portal = (await auth().api.dodoPortal({ headers: request.headers })) as { url?: string }
        if (!portal.url) throw new HttpError(502, 'Customer portal is not available', 'portal_unavailable')
        return json({ url: portal.url })
      }),
    },
  },
})
