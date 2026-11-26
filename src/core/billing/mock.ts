// Local stand-in for the Dodo checkout, used when MOCK_PAYMENTS is on: a page with Pay and Fail
// buttons, and a Standard Webhooks signer so the real webhook endpoint verifies what the page sends.
import { Webhook } from 'standardwebhooks'
import { createId } from '../server/ids'

export type MockOrder = {
  id: string
  userId: string
  planCode: string
  productId: string
  amountMinor: number
  currency: string
  email: string
  name: string
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function mockCheckoutPage(order: { id: string; planName: string; amountLabel: string }): string {
  const form = (outcome: 'succeeded' | 'failed', label: string, primary: boolean) =>
    `<form method="post" action="/api/mock/dodo/pay" style="margin:0">` +
    `<input type="hidden" name="order" value="${escapeHtml(order.id)}">` +
    `<input type="hidden" name="outcome" value="${outcome}">` +
    `<button type="submit" data-testid="mock-${outcome}" style="font:inherit;font-weight:600;padding:10px 20px;border-radius:8px;cursor:pointer;` +
    (primary ? 'background:#171717;color:#fff;border:1px solid #171717' : 'background:#fff;color:#171717;border:1px solid #d4d4d4') +
    `">${label}</button></form>`
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex"><title>Test checkout</title></head>` +
    `<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#f5f5f5;color:#171717">` +
    `<main style="max-width:420px;margin:64px auto;background:#fff;border-radius:12px;padding:32px">` +
    `<h1 style="margin:0 0 8px;font-size:20px">Test checkout &middot; ${escapeHtml(order.planName)} &middot; ${escapeHtml(order.amountLabel)}</h1>` +
    `<p style="margin:0 0 24px;color:#737373;font-size:14px">Order ${escapeHtml(order.id)}. No real payment is made.</p>` +
    `<div style="display:flex;gap:12px">${form('succeeded', 'Pay', true)}${form('failed', 'Fail', false)}</div>` +
    `</main></body></html>`
  )
}

/** A payment webhook in the shape @dodopayments/core's verifyWebhookPayload accepts. */
export function mockPaymentPayload(order: MockOrder, outcome: 'succeeded' | 'failed') {
  const now = new Date().toISOString()
  return {
    business_id: 'bus_mock',
    type: outcome === 'succeeded' ? 'payment.succeeded' : 'payment.failed',
    timestamp: now,
    data: {
      payload_type: 'Payment',
      billing: { city: null, country: 'US', state: null, street: null, zipcode: null },
      brand_id: 'brand_mock',
      business_id: 'bus_mock',
      created_at: now,
      currency: order.currency,
      customer: { customer_id: `cus_mock_${order.userId}`, email: order.email, name: order.name },
      digital_products_delivered: outcome === 'succeeded',
      disputes: [],
      is_update_payment_method: false,
      metadata: { order_id: order.id, amount_minor: String(order.amountMinor), currency: order.currency },
      // Same id for both outcomes of one order, so pressing Pay twice is a duplicate delivery.
      payment_id: `pay_mock_${order.id}`,
      payment_provider: 'dodo',
      product_cart: [{ product_id: order.productId, quantity: 1 }],
      refunds: [],
      retry_attempt: 0,
      settlement_amount: order.amountMinor,
      settlement_currency: order.currency,
      status: outcome,
      total_amount: order.amountMinor,
    },
  }
}

/** Standard Webhooks headers for `body`, signed with `secret` ("whsec_…"). */
export function signWebhook(secret: string, body: string) {
  const id = createId('msg')
  const timestamp = new Date()
  return {
    'webhook-id': id,
    'webhook-timestamp': String(Math.floor(timestamp.getTime() / 1000)),
    'webhook-signature': new Webhook(secret).sign(id, timestamp, body),
  }
}
