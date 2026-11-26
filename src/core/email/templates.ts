// Transactional email bodies: plain inline-styled HTML plus a text version, English and Chinese.
import type { Locale } from '../i18n'
import { SITE } from '../../../site.config.ts'

export type EmailContent = { subject: string; html: string; text: string }

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function layout(heading: string, paragraphs: string[], action?: { label: string; url: string }, footer?: string) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#262626">${escapeHtml(p)}</p>`).join('')
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:12px 20px;border-radius:8px">${escapeHtml(action.label)}</a></p>` +
      `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#737373;word-break:break-all">${escapeHtml(action.url)}</p>`
    : ''
  const foot = footer ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#737373">${escapeHtml(footer)}</p>` : ''
  return (
    `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">` +
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

const COPY = {
  en: {
    verify: {
      subject: `Confirm your email for ${SITE.name}`,
      heading: 'Confirm your email',
      body: [`Thanks for signing up for ${SITE.name}. Confirm your email address to finish creating your account.`],
      action: 'Confirm email',
      footer: 'If you did not sign up, you can ignore this email.',
    },
    reset: {
      subject: `Reset your ${SITE.name} password`,
      heading: 'Reset your password',
      body: ['We received a request to reset your password. The link works once and expires in one hour.'],
      action: 'Choose a new password',
      footer: 'If you did not ask for this, you can ignore this email. Your password stays the same.',
    },
  },
  zh: {
    verify: {
      subject: `确认你在 ${SITE.name} 的邮箱`,
      heading: '确认邮箱',
      body: [`感谢注册 ${SITE.name}。请确认你的邮箱地址，完成账号创建。`],
      action: '确认邮箱',
      footer: '如果这不是你本人操作，请忽略这封邮件。',
    },
    reset: {
      subject: `重置你的 ${SITE.name} 密码`,
      heading: '重置密码',
      body: ['我们收到了重置密码的请求。链接只能使用一次，一小时内有效。'],
      action: '设置新密码',
      footer: '如果这不是你本人操作，请忽略这封邮件，密码不会改变。',
    },
  },
} satisfies Record<Locale, unknown>

function linkEmail(kind: 'verify' | 'reset', locale: Locale, url: string): EmailContent {
  const c = COPY[locale][kind]
  return {
    subject: c.subject,
    html: layout(c.heading, c.body, { label: c.action, url }, c.footer),
    text: text(c.heading, c.body, url, c.footer),
  }
}

export const verifyEmail = (locale: Locale, url: string) => linkEmail('verify', locale, url)
export const resetPassword = (locale: Locale, url: string) => linkEmail('reset', locale, url)

/** `amount` is the formatted price, e.g. "$5.00". */
export function receipt(locale: Locale, { plan, credits, amount }: { plan: string; credits: number; amount: string }): EmailContent {
  const zh = locale === 'zh'
  const subject = zh ? `${SITE.name} 付款收据：${plan}` : `Your ${SITE.name} receipt: ${plan}`
  const heading = zh ? '付款成功' : 'Payment received'
  const body = zh
    ? [`${plan}：${amount}`, `${credits} 点数已加到你的账户。`, `如有问题，请回复这封邮件或联系 ${SITE.email}。`]
    : [`${plan}: ${amount}`, `${credits} credits were added to your account.`, `Questions? Reply to this email or write to ${SITE.email}.`]
  return { subject, html: layout(heading, body), text: text(heading, body) }
}
