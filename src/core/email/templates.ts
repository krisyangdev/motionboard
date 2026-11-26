// Transactional email bodies: plain inline-styled HTML plus a text version, in the user's language (src/core/messages/<code>.ts).
import { DIR, HTML_LANG, type Locale } from '../i18n'
import { coreMessages } from '../messages'
import { SITE } from '../../../site.config.ts'

export type EmailContent = { subject: string; html: string; text: string }

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function layout(locale: Locale, heading: string, paragraphs: string[], action?: { label: string; url: string }, footer?: string) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#262626">${escapeHtml(p)}</p>`).join('')
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:12px 20px;border-radius:8px">${escapeHtml(action.label)}</a></p>` +
      `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#737373;word-break:break-all">${escapeHtml(action.url)}</p>`
    : ''
  const foot = footer ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#737373">${escapeHtml(footer)}</p>` : ''
  return (
    `<!doctype html><html lang="${HTML_LANG[locale]}" dir="${DIR[locale]}"><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">` +
    `<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">` +
    `<p style="margin:0 0 24px;font-size:14px;font-weight:600;color:#737373">${escapeHtml(SITE.name)}</p>` +
    `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#171717">${escapeHtml(heading)}</h1>` +
    body +
    button +
    foot +
    `</div></body></html>`
  )
}

function text(heading: string, paragraphs: string[], url?: string, footer?: string) {
  return [heading, '', ...paragraphs, ...(url ? ['', url] : []), ...(footer ? ['', footer] : [])].join('\n')
}

function linkEmail(kind: 'verify' | 'reset', locale: Locale, url: string): EmailContent {
  const c = coreMessages[locale].email[kind]
  const body = c.body(SITE.name)
  return {
    subject: c.subject(SITE.name),
    html: layout(locale, c.heading, body, { label: c.action, url }, c.footer),
    text: text(c.heading, body, url, c.footer),
  }
}

export const verifyEmail = (locale: Locale, url: string) => linkEmail('verify', locale, url)
export const resetPassword = (locale: Locale, url: string) => linkEmail('reset', locale, url)

/** `amount` is the formatted price, e.g. "$5.00". */
export function receipt(locale: Locale, { plan, credits, amount }: { plan: string; credits: number; amount: string }): EmailContent {
  const c = coreMessages[locale].email.receipt
  const body = c.body({ plan, amount, credits, contact: SITE.email })
  return { subject: c.subject(SITE.name, plan), html: layout(locale, c.heading, body), text: text(c.heading, body) }
}
