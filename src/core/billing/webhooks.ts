// Dodo webhook handling, called by the @dodopayments/better-auth webhooks plugin after it has
// verified the signature. Port of ShotFrames handlePaymentWebhook: every event is recorded once
// (unique provider_event_id), a repeat of a finished event is acknowledged without doing anything,
// and a failure is rethrown so Dodo retries. Credits are granted through the idempotent ledger.
import { verifyWebhookPayload } from '@dodopayments/core/webhook'
import type { WebhookPayload } from '@dodopayments/core/schemas'
import { and, eq, inArray, isNull, ne, or, sql } from 'drizzle-orm'
import { planByCode } from '../../site/plans'
import { grant } from '../credits/ledger'
import { db, schema } from '../db'
import { sendEmail } from '../email/send'
import { receipt } from '../email/templates'
import { DEFAULT_LOCALE, formatNumber, isLocale, type Locale } from '../i18n'
import { createId, nowIso } from '../server/ids'
import { trackServer } from '../server/track'

type Order = typeof schema.paymentOrders.$inferSelect
type Data = Record<string, unknown>

const str = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : undefined)
const record = (v: unknown): Data => (typeof v === 'object' && v !== null ? (v as Data) : {})
const integer = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isInteger(n) ? n : undefined
}

/** One id per Dodo object and event type, so a redelivery maps to the same row. */
function eventId(payload: WebhookPayload, data: Data) {
  const object = str(data.refund_id) ?? str(data.payment_id) ?? str(data.subscription_id) ?? str(data.dispute_id)
  return `${object ?? new Date(payload.timestamp).toISOString()}:${payload.type}`
}

/**
 * A Dodo webhook received at a site's own path (the template's is the Better Auth plugin route): verifies the
 * Standard Webhooks signature with `secret`, then runs handleDodoWebhook. 401 on a bad signature; 500 when
 * handling fails, so Dodo retries.
 */
export async function handleDodoWebhookRequest(request: Request, secret: string): Promise<Response> {
  const body = await request.text()
  let payload: WebhookPayload
  try {
    payload = await verifyWebhookPayload({ webhookKey: secret, headers: Object.fromEntries(request.headers), body })
  } catch {
    return Response.json({ error: 'Invalid webhook signature', code: 'invalid_signature' }, { status: 401 })
  }
  try {
    await handleDodoWebhook(payload)
  } catch (error) {
    console.error('[billing] webhook failed', error instanceof Error ? error.message : String(error))
    return Response.json({ error: 'Webhook failed', code: 'webhook_failed' }, { status: 500 })
  }
  return Response.json({ received: true })
}

export async function handleDodoWebhook(payload: WebhookPayload): Promise<void> {
  const d = db()
  const data = record(payload.data)
  const providerEventId = eventId(payload, data)
  const paymentId = str(data.payment_id)

  await d
    .insert(schema.paymentWebhookEvents)
    .values({
      id: createId('pevt'),
      provider: 'dodo',
      providerEventId,
      eventType: payload.type,
      providerPaymentId: paymentId,
      status: 'received',
      payloadJson: JSON.stringify(payload),
    })
    .onConflictDoNothing({ target: schema.paymentWebhookEvents.providerEventId })
  const event = await d.query.paymentWebhookEvents.findFirst({ where: eq(schema.paymentWebhookEvents.providerEventId, providerEventId) })
  if (!event) throw new Error('Webhook event was not recorded')
  if (event.status === 'processed' || event.status === 'ignored') return // duplicate delivery

  const finish = (status: 'processed' | 'ignored' | 'failed', orderId: string | null, error?: string) =>
    d
      .update(schema.paymentWebhookEvents)
      .set({ status, errorMessage: error ?? null, orderId, updatedAt: nowIso() })
      .where(eq(schema.paymentWebhookEvents.id, event.id))

  let order: Order | undefined
  try {
    order = await findOrder(data)
    switch (payload.type) {
      case 'payment.succeeded':
        if (!order) throw new Error('Payment order was not found')
        await fulfill(order, data)
        break
      case 'payment.failed':
      case 'payment.cancelled':
        // A paid or refunded order never goes back to failed; an order already failed with this payment id is left alone (no rewrite of the same row).
        if (order) {
          const t = schema.paymentOrders
          const newPaymentId = paymentId ?? order.providerPaymentId
          await d
            .update(t)
            .set({ status: 'failed', providerPaymentId: newPaymentId, updatedAt: nowIso() })
            .where(
              and(
                eq(t.id, order.id),
                or(
                  inArray(t.status, ['created', 'checkout_started']),
                  and(eq(t.status, 'failed'), newPaymentId ? or(isNull(t.providerPaymentId), ne(t.providerPaymentId, newPaymentId)) : sql`0`),
                ),
              ),
            )
        }
        break
      case 'refund.succeeded':
        // Credits are not clawed back automatically; the admin sees the refunded order. A partial refund leaves the order paid.
        if (order && data.is_partial !== true) {
          await d
            .update(schema.paymentOrders)
            .set({ status: 'refunded', updatedAt: nowIso() })
            .where(and(eq(schema.paymentOrders.id, order.id), eq(schema.paymentOrders.status, 'paid')))
        }
        break
      default:
        await finish('ignored', order?.id ?? null)
        return
    }
    await finish('processed', order?.id ?? null)
  } catch (error) {
    await finish('failed', order?.id ?? null, error instanceof Error ? error.message : String(error))
    throw error
  }
}

/** The order id travels in the checkout metadata; the payment id and session id cover events that lack it (refunds). */
async function findOrder(data: Data): Promise<Order | undefined> {
  const d = db()
  const t = schema.paymentOrders
  const orderId = str(record(data.metadata).order_id)
  if (orderId) {
    const byId = await d.query.paymentOrders.findFirst({ where: eq(t.id, orderId) })
    if (byId) return byId
  }
  const sessionId = str(data.checkout_session_id)
  if (sessionId) {
    const bySession = await d.query.paymentOrders.findFirst({ where: eq(t.providerSessionId, sessionId) })
    if (bySession) return bySession
  }
  const paymentId = str(data.payment_id)
  if (paymentId) return d.query.paymentOrders.findFirst({ where: eq(t.providerPaymentId, paymentId) })
}

/** Checks the payment matches the order, grants the credits (idempotent), then marks the order paid. */
async function fulfill(order: Order, data: Data) {
  const plan = planByCode(order.planCode)
  const metadata = record(data.metadata)
  const paymentId = str(data.payment_id)
  if (!paymentId) throw new Error('Provider payment id is missing')

  // Same checks as ShotFrames: the amount and currency the order was created with, and our product in the cart.
  const amount = integer(metadata.amount_minor) ?? integer(data.total_amount)
  if (amount !== order.amountMinor) throw new Error(`Payment amount mismatch: expected ${order.amountMinor}, got ${amount ?? 'unknown'}`)
  const currency = str(metadata.currency) ?? str(data.currency)
  if (currency?.toUpperCase() !== order.currency.toUpperCase()) throw new Error(`Payment currency mismatch: expected ${order.currency}, got ${currency ?? 'unknown'}`)
  const expectedProduct = order.mode === 'mock' ? undefined : plan?.productId[order.mode as 'test_mode' | 'live_mode']
  const cart = Array.isArray(data.product_cart) ? data.product_cart.map((i) => str(record(i).product_id)) : []
  if (expectedProduct && cart.length > 0 && !cart.includes(expectedProduct)) throw new Error(`Payment product mismatch: expected ${expectedProduct}`)

  await grant({
    userId: order.userId,
    amount: order.credits,
    type: 'purchase',
    sourceType: 'payment_order',
    sourceId: order.id,
    metadata: { provider: order.provider, plan_code: order.planCode, provider_payment_id: paymentId, amount_minor: order.amountMinor, currency: order.currency },
  })

  const d = db()
  const t = schema.paymentOrders
  const paid = await d
    .update(t)
    .set({ status: 'paid', providerPaymentId: paymentId, updatedAt: nowIso() })
    .where(and(eq(t.id, order.id), inArray(t.status, ['created', 'checkout_started', 'failed'])))
    .returning({ id: t.id })
  if (paid.length === 0) return // already paid (redelivery) or refunded

  const meta = JSON.parse(order.metadataJson ?? '{}') as { lang?: string }
  const lang: Locale = isLocale(meta.lang) ? meta.lang : DEFAULT_LOCALE
  trackServer('payment_success', order.userId, {
    plan: order.planCode,
    amount: order.amountMinor / 100,
    currency: order.currency,
    credits: order.credits,
    mode: order.mode,
    lang,
  })
  await sendReceipt(order, plan?.name[lang] ?? order.planCode)
}

/** A failed receipt never fails the webhook: the payment is already recorded and credited. */
async function sendReceipt(order: Order, planName: string) {
  try {
    const user = await db().query.user.findFirst({ where: eq(schema.user.id, order.userId) })
    if (!user) return
    const locale: Locale = isLocale(user.locale) ? user.locale : DEFAULT_LOCALE
    const amount = formatNumber(locale, order.amountMinor / 100, { style: 'currency', currency: order.currency })
    await sendEmail({ to: user.email, ...receipt(locale, { plan: planName, credits: order.credits, amount }) })
  } catch (error) {
    console.warn('[email] receipt failed', error instanceof Error ? error.message : String(error))
  }
}
