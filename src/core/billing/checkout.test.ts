// The hosted checkout Dodo is asked for: charged in the plan's currency with no currency picker, and both the
// return and cancel URLs carry the order id back to our own page.
import { describe, expect, it, vi } from 'vitest'

const created = vi.hoisted(() => [] as Record<string, unknown>[])
vi.mock('./dodo', () => ({
  isMockPayments: () => false,
  paymentMode: () => 'test_mode',
  dodoProductId: () => 'pdt_test',
  dodoClient: () => ({
    checkoutSessions: {
      create: async (body: Record<string, unknown>) => {
        created.push(body)
        return { checkout_url: 'https://test.checkout.dodopayments.com/s', session_id: 'cks_1' }
      },
    },
  }),
}))
vi.mock('../db', () => {
  const chain = { values: async () => {}, set: () => chain, where: async () => {} }
  return { db: () => ({ insert: () => chain, update: () => chain }), schema: { paymentOrders: { id: 'id' } } }
})
vi.mock('../security/rate-limit', () => ({ rateLimit: async () => {} }))
vi.mock('../server/track', () => ({ trackServer: () => {} }))

describe('startCheckout', () => {
  it('asks Dodo for a fixed-currency checkout that returns with the order id', async () => {
    const { startCheckout } = await import('./checkout')
    const user = { id: 'u1', email: 'buyer@example.com', name: 'Buyer', locale: 'en' } as never
    const { url, orderId } = await startCheckout(user, 'starter', '/account/', 'https://example.com')
    expect(url).toBe('https://test.checkout.dodopayments.com/s')
    const body = created[0]
    expect(body.billing_currency).toBe('USD')
    expect(body.feature_flags).toEqual({ allow_currency_selection: false })
    expect(body.return_url).toBe(`https://example.com/account/?checkout=success&order=${orderId}`)
    expect(body.cancel_url).toBe(`https://example.com/account/?checkout=cancelled&order=${orderId}`)
  })
})
