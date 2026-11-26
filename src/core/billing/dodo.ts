// Dodo Payments client and the facts derived from env: mode, product ids, webhook secret.
import DodoPayments from 'dodopayments'
import type { Plan } from '../../site/plans'
import { appEnv, dodoEnvironment, flag } from '../server/env'
import { HttpError } from '../server/http'

/** Local test secret for signing and verifying mock webhooks ("whsec_" + base64, Standard Webhooks format). */
const MOCK_WEBHOOK_SECRET = `whsec_${btoa('site-template-local-mock-webhook-secret')}`

export const isMockPayments = () => flag('MOCK_PAYMENTS')
export const hasDodoKey = () => Boolean(appEnv().DODO_PAYMENTS_API_KEY)

/** Stored on payment_orders.mode. */
export const paymentMode = () => (isMockPayments() ? 'mock' : dodoEnvironment())

export const webhookSecret = (): string | undefined =>
  appEnv().DODO_PAYMENTS_WEBHOOK_SECRET || (isMockPayments() ? MOCK_WEBHOOK_SECRET : undefined)

/** Client on the configured key. Without a key (mock mode) it gets a placeholder and is never called. */
export const dodoClient = () =>
  new DodoPayments({ bearerToken: appEnv().DODO_PAYMENTS_API_KEY || 'mock-key', environment: dodoEnvironment() })

/** Product id of a plan in the current Dodo environment; empty ids mean the plan is not set up there. */
export function dodoProductId(plan: Plan): string {
  const id = plan.productId[dodoEnvironment()]
  if (!id) throw new HttpError(500, `Plan ${plan.code} has no Dodo product for ${dodoEnvironment()}`, 'payment_provider_not_configured')
  return id
}
