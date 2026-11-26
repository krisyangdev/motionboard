// Email through the Resend HTTP API (fetch, no SDK). With MOCK_EMAIL set or no API key, emails are
// logged and kept in memory instead (the e2e test reads verification links from GET /api/mock/emails).
import { appEnv, flag } from '../server/env'
import { SITE } from '../../../site.config.ts'

export type Email = { to: string; subject: string; html: string; text: string }
type MockEmail = Email & { at: string }

const MAX_MOCK_EMAILS = 20
const mockEmails: MockEmail[] = []

export const listMockEmails = () => [...mockEmails].reverse()

/** Throws when the provider rejects the email; callers that must not fail wrap it in try/catch. */
export async function sendEmail(email: Email): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM } = appEnv()
  if (flag('MOCK_EMAIL') || !RESEND_API_KEY) {
    console.log('[email]', email.to, email.subject, email.text)
    mockEmails.push({ ...email, at: new Date().toISOString() })
    if (mockEmails.length > MAX_MOCK_EMAILS) mockEmails.shift()
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
