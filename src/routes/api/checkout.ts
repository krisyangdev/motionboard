import { createFileRoute } from '@tanstack/react-router'
import { requireUser } from '@/core/auth/session'
import { checkoutSchema, startCheckout } from '@/core/billing/checkout'
import { appEnv } from '@/core/server/env'
import { handle, json, readJson } from '@/core/server/http'
import { SITE } from '../../../site.config.ts'

export const Route = createFileRoute('/api/checkout')({
  server: {
    handlers: {
      POST: handle(async ({ request }) => {
        if (!SITE.accounts.enabled) return json({ error: 'Not found' }, { status: 404 })
        const user = await requireUser(request)
        const input = await readJson(request, checkoutSchema)
        const { url } = await startCheckout(user, input.planCode, input.returnPath, new URL(appEnv().BETTER_AUTH_URL).origin)
        return json({ url })
      }),
    },
  },
})
