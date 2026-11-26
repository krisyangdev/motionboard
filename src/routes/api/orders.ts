import { desc, eq } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'
import { requireUser } from '@/core/auth/session'
import { db, schema } from '@/core/db'
import { handle, json } from '@/core/server/http'
import { SITE } from '../../../site.config.ts'

export const Route = createFileRoute('/api/orders')({
  server: {
    handlers: {
      GET: handle(async ({ request }) => {
        if (!SITE.accounts.enabled) return json({ error: 'Not found' }, { status: 404 })
        const user = await requireUser(request)
        const t = schema.paymentOrders
        const rows = await db()
          .select({ id: t.id, planCode: t.planCode, credits: t.credits, amountMinor: t.amountMinor, currency: t.currency, status: t.status, createdAt: t.createdAt })
          .from(t)
          .where(eq(t.userId, user.id))
          .orderBy(desc(t.createdAt))
          .limit(50)
        return json({ items: rows })
      }),
    },
  },
})
