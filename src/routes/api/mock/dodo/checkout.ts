import { eq } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'
import { isMockPayments } from '@/core/billing/dodo'
import { mockCheckoutPage } from '@/core/billing/mock'
import { db, schema } from '@/core/db'
import { isLocale } from '@/core/i18n'
import { handle, json } from '@/core/server/http'
import { planByCode } from '@/site/plans'
import { SITE } from '../../../../../site.config.ts'

// Local checkout page for MOCK_PAYMENTS: "pays" or "fails" the order through /api/mock/dodo/pay.
export const Route = createFileRoute('/api/mock/dodo/checkout')({
  server: {
    handlers: {
      GET: handle(async ({ request }) => {
        if (!SITE.accounts.enabled || !isMockPayments()) return json({ error: 'Not found' }, { status: 404 })
        const orderId = new URL(request.url).searchParams.get('order') ?? ''
        const order = await db().query.paymentOrders.findFirst({ where: eq(schema.paymentOrders.id, orderId) })
        if (!order || order.mode !== 'mock') return json({ error: 'Not found' }, { status: 404 })
        const lang = (JSON.parse(order.metadataJson ?? '{}') as { lang?: string }).lang
        const locale = isLocale(lang) ? lang : 'en'
        const amountLabel = new Intl.NumberFormat(locale, { style: 'currency', currency: order.currency }).format(order.amountMinor / 100)
        const planName = planByCode(order.planCode)?.name[locale] ?? order.planCode
        return new Response(mockCheckoutPage({ id: order.id, planName, amountLabel }), {
          headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
        })
      }),
    },
  },
})
