// The money path end to end on the local Worker with the mocks on:
// sign up → verify by email → signup credits → buy a pack (mock Dodo checkout, signed webhook) →
// credits arrive once (webhook replay ignored) → generate (credits held then committed) →
// a failing generation is refunded → admin signs in and adjusts credits (audited).
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

// Local: the .dev.vars.example value. Against the live demo: E2E_BASE_URL=… E2E_BOOTSTRAP_TOKEN=… npm run e2e
const BOOTSTRAP = process.env.E2E_BOOTSTRAP_TOKEN || 'dev-bootstrap-token'
const email = `e2e-${Date.now()}@example.com`
const password = 'correct-horse-battery'

async function balance(request: APIRequestContext) {
  const res = await request.get('/api/me')
  expect(res.ok()).toBeTruthy()
  return (await res.json()).balance as { available: number; frozen: number }
}

async function latestEmailLink(request: APIRequestContext, to: string) {
  const res = await request.get('/api/mock/emails', { headers: { 'x-bootstrap-token': BOOTSTRAP } })
  const { items } = (await res.json()) as { items: { to: string; text: string }[] }
  const mail = items.filter((m) => m.to === to).at(-1)
  expect(mail, `no email to ${to}`).toBeTruthy()
  const url = mail!.text.match(/https?:\/\/\S+/)?.[0]
  expect(url).toBeTruthy()
  return url!.replace(/^https?:\/\/[^/]+/, '')
}

// Pages hydrate after first paint (src/core/Scripts.tsx); interact only once React is running.
const hydrated = (page: Page) => page.locator('html[data-hydrated]').waitFor({ state: 'attached' })
async function open(page: Page, path: string) {
  await page.goto(path)
  await hydrated(page)
}

async function waitForBalance(page: Page, available: number) {
  await expect.poll(async () => (await balance(page.request)).available, { timeout: 20_000 }).toBe(available)
}

test('sign up, buy credits, generate, refund, admin adjust', async ({ page }) => {
  const signupCredits = 20 // SITE.accounts.signupCredits
  const pack = 100 // plans[0] (starter)
  const cost = 5 // demo-image

  // Sign up and verify.
  await open(page, '/signup/')
  await page.getByLabel(/name/i).fill('E2E Tester')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign up|create account/i }).click()
  await expect(page.getByText(/check your (inbox|email)/i)).toBeVisible()
  await open(page, await latestEmailLink(page.request, email))
  await page.waitForURL(/\/account\//)
  await hydrated(page)
  await waitForBalance(page, signupCredits)

  // Buy the starter pack through the mock Dodo checkout.
  await page.getByRole('button', { name: /buy/i }).first().click()
  await page.waitForURL(/\/api\/mock\/dodo\/checkout/)
  await page.getByRole('button', { name: /pay/i }).click()
  await page.waitForURL(/checkout=success/)
  await hydrated(page)
  await waitForBalance(page, signupCredits + pack)

  // Deliver the same payment webhook again: credits must not be granted twice.
  const orders = (await (await page.request.get('/api/orders')).json()).items as { id: string; status: string }[]
  expect(orders[0].status).toBe('paid')
  await page.request.post('/api/mock/dodo/pay', { form: { order: orders[0].id, outcome: 'succeeded' }, maxRedirects: 0 })
  await page.waitForTimeout(1500)
  expect((await balance(page.request)).available).toBe(signupCredits + pack)

  // Generate: credits are held, then committed when the job succeeds.
  await open(page, '/app/')
  await page.getByRole('textbox').fill('a quiet harbour at dawn')
  await page.getByRole('button', { name: /generate/i }).click()
  await expect(page.locator('img[src*="/api/files/"]').first()).toBeVisible({ timeout: 30_000 })
  await waitForBalance(page, signupCredits + pack - cost)
  expect((await balance(page.request)).frozen).toBe(0)

  // A failing generation ends refunded.
  await page.getByRole('textbox').fill('please fail')
  await page.getByRole('button', { name: /generate/i }).click()
  await expect(page.getByText(/refunded/i)).toBeVisible({ timeout: 60_000 })
  await waitForBalance(page, signupCredits + pack - cost)
  expect((await balance(page.request)).frozen).toBe(0)

  // Admin: bootstrap, sign in, adjust the user's credits.
  const adminEmail = 'admin@example.com'
  const adminPassword = `e2e-${crypto.randomUUID()}` // fresh per run, so no known admin password is left behind on the live demo
  const boot = await page.request.post('/api/admin/bootstrap', {
    headers: { 'x-bootstrap-token': BOOTSTRAP },
    data: { email: adminEmail, password: adminPassword },
  })
  expect(boot.ok()).toBeTruthy()
  await open(page, '/admin/login/')
  await page.getByLabel(/email/i).fill(adminEmail)
  await page.getByLabel(/password/i).fill(adminPassword)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL(/\/admin\/$/)
  await hydrated(page)
  const users = await (await page.request.get(`/api/admin/users?q=${encodeURIComponent(email)}`)).json()
  const userId = (users.items ?? users.users)[0].id as string
  const adjust = await page.request.post(`/api/admin/users/${userId}/credits`, { data: { delta: 10, reason: 'e2e goodwill credit' } })
  expect(adjust.ok()).toBeTruthy()
  const audit = await (await page.request.get('/api/admin/audit')).json()
  expect(JSON.stringify(audit)).toContain(userId)
})
