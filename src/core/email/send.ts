// Email through the Resend HTTP API (fetch, no SDK). With MOCK_EMAIL set or no API key, emails are
// logged and stored in R2 under mock-emails/ instead (R2, so every isolate sees them; the e2e test reads
// verification links from GET /api/mock/emails, which needs the admin bootstrap token).
import { appEnv, flag } from '../server/env'
import { putObject } from '../storage/r2'
import { SITE } from '../../../site.config.ts'

export type Email = { to: string; subject: string; html: string; text: string }
type MockEmail = Email & { at: string }

const MOCK_PREFIX = 'mock-emails/'
/** Mock emails older than this are deleted by the cron, so the prefix never outgrows one list page. */
const MOCK_MAX_AGE_MS = 24 * 60 * 60 * 1000

/** The newest mock emails first (at most 50). Keys sort by time: mock-emails/<ISO time>-<random>.json */
export async function listMockEmails(): Promise<MockEmail[]> {
  const bucket = appEnv().BUCKET
  const { objects } = await bucket.list({ prefix: MOCK_PREFIX, limit: 1000 })
  const keys = objects.map((o) => o.key).sort().reverse().slice(0, 50)
  const items = await Promise.all(keys.map(async (key) => (await bucket.get(key))?.json<MockEmail>()))
  return items.filter((m): m is MockEmail => Boolean(m))
}

/** Deletes mock emails older than a day (one list and at most one delete call). Run by the cron. Returns the count. */
export async function pruneMockEmails(now = Date.now()): Promise<number> {
  const bucket = appEnv().BUCKET
  const { objects } = await bucket.list({ prefix: MOCK_PREFIX, limit: 1000 })
  const cutoff = new Date(now - MOCK_MAX_AGE_MS).toISOString()
  const old = objects.map((o) => o.key).filter((key) => key.slice(MOCK_PREFIX.length) < cutoff)
  if (old.length) await bucket.delete(old)
  return old.length
}

/** Throws when the provider rejects the email; callers that must not fail wrap it in try/catch. */
export async function sendEmail(email: Email): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM } = appEnv()
  if (flag('MOCK_EMAIL') || !RESEND_API_KEY) {
    console.log('[email]', email.to, email.subject, email.text)
    const at = new Date().toISOString()
    const key = `${MOCK_PREFIX}${at}-${crypto.randomUUID().slice(0, 8)}.json`
    await putObject(key, JSON.stringify({ ...email, at } satisfies MockEmail), 'application/json')
    return
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM || `${SITE.name} <${SITE.email}>`,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  })
  if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 300)}`)
}
