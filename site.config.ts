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
  /** First entry is the default language, served at the root; the others live under /<lang>/. */
  languages: ['en', 'zh'],
  defaultLang: 'en',
  /** Home page <title> and meta description, per language. */
  title: { en: 'Site Template: React, TanStack and coss ui on Cloudflare', zh: '站点模板：React、TanStack 和 coss ui，跑在 Cloudflare 上' },
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
  social: { twitterCard: 'summary_large_image', twitter: '' },
  /** Extra origins allowed by the Content-Security-Policy, per directive. */
  csp: {
    script: [] as string[],
    connect: [] as string[],
    img: ['https:'] as string[],
    media: [] as string[],
    frame: [] as string[],
    form: [] as string[],
  },
} as const

export type Locale = (typeof SITE.languages)[number]
export const SITE_URL = `https://${SITE.domain}`
