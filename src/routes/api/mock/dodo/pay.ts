import { eq } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/core/auth/server'
import { dodoEnvironment, isMockPayments, webhookSecret } from '@/core/billing/dodo'
import { mockPaymentPayload, signWebhook } from '@/core/billing/mock'
import { db, schema } from '@/core/db'
import { appEnv } from '@/core/server/env'
import { handle, HttpError, json } from '@/core/server/http'
import { planByCode } from '@/site/plans'
import { SITE } from '../../../../../site.config.ts'

// Builds a Dodo-shaped payment webhook for the order, signs it (Standard Webhooks) and hands it to the real
// webhook endpoint, so verification, the Dodo plugin and handleDodoWebhook all run exactly as in production.
export const Route = createFileRoute('/api/mock/dodo/pay')({
  server: {
    handlers: {
      POST: handle(async ({ request }) => {
        if (!SITE.accounts.enabled || !isMockPayments()) return json({ error: 'Not found' }, { status: 404 })
        const form = await request.formData()
        const orderId = String(form.get('order') ?? '')
        const outcome = form.get('outcome') === 'failed' ? 'failed' : 'succeeded'

        const d = db()
        const order = await d.query.paymentOrders.findFirst({ where: eq(schema.paymentOrders.id, orderId) })
        if (!order || order.mode !== 'mock') return json({ error: 'Not found' }, { status: 404 })
        const user = await d.query.user.findFirst({ where: eq(schema.user.id, order.userId) })
        const plan = planByCode(order.planCode)
        const secret = webhookSecret()
        if (!user || !plan || !secret) throw new HttpError(500, 'Mock order is incomplete', 'mock_incomplete')

        const body = JSON.stringify(
          mockPaymentPayload(
            {
              id: order.id,
              userId: user.id,
              planCode: order.planCode,
              productId: plan.productId[dodoEnvironment()] || 'pdt_mock',
              amountMinor: order.amountMinor,
              currency: order.currency,
              email: user.email,
              name: user.name,
            },
            outcome,
          ),
        )
        const origin = new URL(appEnv().BETTER_AUTH_URL).origin
        const delivery = await auth().handler(
          new Request(`${origin}/api/auth/dodopayments/webhooks`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...signWebhook(secret, body) },
            body,
          }),
        )
        if (!delivery.ok) throw new HttpError(502, `Webhook delivery failed (${delivery.status})`, 'webhook_failed')

        const returnPath = (JSON.parse(order.metadataJson ?? '{}') as { return_path?: string }).return_path ?? '/account/'
        return new Response(null, { status: 303, headers: { location: `${returnPath}?checkout=${outcome === 'succeeded' ? 'success' : 'failed'}` } })
      }),
    },
  },
})
