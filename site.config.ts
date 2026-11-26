// The one place for everything that differs between sites: domain, name, languages, copy defaults,
// analytics, IndexNow key, CSP allowlist. Imported by the app, vite.config.ts, cloudflare.config.ts
// and scripts/ (Node strips the types), so keep it plain data with no imports.
// No domain or brand string is hard-coded anywhere else.
export const SITE = {
  /** Value of the `site` property on every analytics event (shared PostHog project "Sites"). */
  id: 'site-template',
  name: 'Site Template',
  domain: 'template.krisyang.dev',
  /** Cloudflare Worker name. */
  worker: 'site-template',
  /** Language codes from src/core/locale-data.ts. The default language is served at the root; the others live under /<code>/. */
  languages: ['en', 'zh'],
  /** One of `languages`. */
  defaultLang: 'en',
  /** Home page <title> and meta description: one entry for every language in `languages`. */
  title: { en: 'Site Template: React, TanStack and coss ui on Cloudflare', zh: '站点模板：React、TanStack 和 coss ui' },
  description: {
    en: 'The starter every site is built from: prerendered pages, English and Chinese, SEO checks, analytics and fast first paint on Cloudflare Workers.',
    zh: '每个站点的起点：预渲染页面、中英双语、SEO 检查、统计和快速首屏，部署在 Cloudflare Workers 上。',
  },
  /** Default Open Graph image (absolute URL or a path under public/). */
  ogImage: '/og.png',
  /** Contact address shown on legal pages and in the footer. */
  email: 'hello@krisyang.dev',
  github: 'krisyangdev/site-template',
  /** Build-time env var holding the PostHog project key; unset = events go to the console. */
  posthogKeyEnv: 'VITE_POSTHOG_KEY',
  posthogHost: 'https://us.i.posthog.com',
  /** 32 hex chars; public/<key>.txt must contain the same key. Empty = no IndexNow ping. */
  indexNowKey: '',
  /** Write public/llms.txt from the page list (worth it only for sites coding agents read). */
  llmsTxt: true,
  /**
   * Quality gate knobs (src/core/seo/quality.ts). `hubMinMembers`: indexable members a hub needs to be indexable
   * (default 6). The demo has one tool and two guides, so it lowers it; a real site leaves the line out.
   * `maxNoindexShare`: the build fails when more than this share of a collection's items is noindex (default 0.2).
   * `allowTraining`: false makes robots.txt disallow the model-training crawlers (GPTBot, ClaudeBot, Google-Extended);
   * search and AI-search crawlers stay allowed either way (default true).
   */
  seo: { hubMinMembers: 1, maxNoindexShare: 0.2, allowTraining: true },
  /** Layer 1: sign-up, credits, payments, the app and /admin. Off = content-only site. */
  accounts: { enabled: true, signupCredits: 20 },
  social: { twitterCard: 'summary_large_image', twitter: '' },
  /** Extra origins allowed by the Content-Security-Policy, per directive. */
  csp: {
    script: ['https://challenges.cloudflare.com'] as string[],
    connect: [] as string[],
    img: ['https:'] as string[],
    media: [] as string[],
    frame: ['https://challenges.cloudflare.com'] as string[],
    form: ['https://checkout.dodopayments.com', 'https://test.checkout.dodopayments.com'] as string[],
  },
} as const

export type Locale = (typeof SITE.languages)[number]
export const SITE_URL = `https://${SITE.domain}`
