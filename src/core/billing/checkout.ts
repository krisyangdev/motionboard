// Creates a payment order and a hosted checkout for a credit pack. The order id travels in the
// checkout metadata so the webhook can find it. With MOCK_PAYMENTS the checkout is a local page.
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { planByCode } from '../../site/plans'
import type { SessionUser } from '../auth/session'
import { db, schema } from '../db'
import { rateLimit } from '../security/rate-limit'
import { HttpError } from '../server/http'
import { createId, nowIso } from '../server/ids'
import { trackServer } from '../server/track'
import { dodoClient, dodoProductId, isMockPayments, paymentMode } from './dodo'

/** Same-site path only, no query: it is appended to our own origin. */
export const returnPathSchema = z
  .string()
  .max(300)
  .regex(/^\/(?!\/)[A-Za-z0-9\-._~/]*$/, 'Invalid return path')

export const checkoutSchema = z.object({
  planCode: z.string().min(1).max(64),
  returnPath: returnPathSchema.default('/account/'),
})

export async function startCheckout(
  user: SessionUser,
  planCode: string,
  returnPath: string,
  origin: string,
): Promise<{ url: string; orderId: string }> {
  const plan = planByCode(planCode)
  if (!plan) throw new HttpError(400, 'Unknown plan', 'unknown_plan')
  if (plan.effect.kind !== 'credits') throw new HttpError(400, 'This plan cannot be bought yet', 'plan_not_available')
  if (!returnPathSchema.safeParse(returnPath).success) throw new HttpError(400, 'Invalid return path', 'bad_request')
  await rateLimit(`checkout:${user.id}`, 10, 3600)

  const d = db()
  const orderId = createId('ord')
  const credits = plan.effect.amount
  await d.insert(schema.paymentOrders).values({
    id: orderId,
    userId: user.id,
    provider: 'dodo',
    mode: paymentMode(),
    planCode: plan.code,
    credits,
    amountMinor: plan.price.amountMinor,
    currency: plan.price.currency,
    status: 'created',
    metadataJson: JSON.stringify({ return_path: returnPath, lang: user.locale }),
  })

  let url: string
  let sessionId: string | null = null
  try {
    if (isMockPayments()) {
      url = `/api/mock/dodo/checkout?order=${orderId}`
    } else {
      const session = await dodoClient().checkoutSessions.create({
        product_cart: [{ product_id: dodoProductId(plan), quantity: 1 }],
        customer: { email: user.email, name: user.name },
        return_url: `${origin}${returnPath}?checkout=success`,
        metadata: {
          order_id: orderId,
          user_id: user.id,
          plan_code: plan.code,
          amount_minor: String(plan.price.amountMinor),
          currency: plan.price.currency,
        },
      })
      if (!session.checkout_url) throw new HttpError(502, 'Payment provider did not return a checkout URL', 'checkout_url_missing')
      url = session.checkout_url
      sessionId = session.session_id
    }
  } catch (error) {
    await d.update(schema.paymentOrders).set({ status: 'failed', updatedAt: nowIso() }).where(eq(schema.paymentOrders.id, orderId))
    throw error
  }

  await d
    .update(schema.paymentOrders)
    .set({ status: 'checkout_started', providerSessionId: sessionId, checkoutUrl: url, updatedAt: nowIso() })
    .where(eq(schema.paymentOrders.id, orderId))

  trackServer('checkout_start', user.id, {
    plan: plan.code,
    amount: plan.price.amountMinor / 100,
    currency: plan.price.currency,
    credits,
    lang: user.locale,
  })
  return { url, orderId }
}
