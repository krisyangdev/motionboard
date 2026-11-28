// handleDodoWebhookRequest: a Dodo webhook at a site's own path is verified with the given secret before it reaches
// the order handler. A bad signature answers 401 and never reaches the database; a verified event that fails to
// process answers 500 so Dodo retries.
import { describe, expect, it, vi } from 'vitest'
import { mockPaymentPayload, signWebhook } from './mock'
import { handleDodoWebhookRequest } from './webhooks'

vi.mock('cloudflare:workers', () => ({ env: {} }))

const reached = vi.hoisted(() => ({ db: 0 }))
vi.mock('../db', () => ({
  db: () => {
    reached.db++
    throw new Error('database unavailable in this test')
  },
  schema: {},
}))

const SECRET = `whsec_${btoa('webhook-request-test-secret')}`
const payload = mockPaymentPayload(
  { id: 'ord_1', userId: 'usr_1', planCode: 'basic', productId: 'pdt_1', amountMinor: 499, currency: 'USD', email: 'a@example.com', name: 'A' },
  'succeeded',
)
const post = (body: string, headers: Record<string, string>) =>
  handleDodoWebhookRequest(new Request('https://api.example.com/payments/webhooks/dodo', { method: 'POST', body, headers }), SECRET)

describe('handleDodoWebhookRequest', () => {
  it('answers 401 on a signature made with another secret, without touching the database', async () => {
    const body = JSON.stringify(payload)
    const res = await post(body, signWebhook(`whsec_${btoa('another-secret-entirely')}`, body))
    expect(res.status).toBe(401)
    expect(reached.db).toBe(0)
  })

  it('answers 401 when the body was changed after signing', async () => {
    const body = JSON.stringify(payload)
    const res = await post(body.replace('499', '1'), signWebhook(SECRET, body))
    expect(res.status).toBe(401)
    expect(reached.db).toBe(0)
  })

  it('passes a correctly signed event to the order handler and answers 500 when it fails', async () => {
    const body = JSON.stringify(payload)
    const res = await post(body, signWebhook(SECRET, body))
    expect(reached.db).toBeGreaterThan(0)
    expect(res.status).toBe(500)
  })
})
