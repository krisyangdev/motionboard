export type Locale = 'en' | 'zh'

// The one place for domain, brand name, languages, analytics key variable and social defaults.
// Imported by the app, vite.config.ts, cloudflare.config.ts and the scripts (Node strips the types).
export const SITE = {
  /** Value of the `site` property on every analytics event (shared PostHog project). */
  id: 'motionboard',
  name: 'Motionboard',
  domain: 'motionboard.app',
  /** Films and posters live in the R2 bucket behind this host. */
  mediaDomain: 'media.motionboard.app',
  languages: ['en', 'zh'],
  defaultLang: 'en',
  /** Name of the build-time env var that holds the PostHog project key. */
  posthogKeyEnv: 'VITE_POSTHOG_KEY',
  posthogHost: 'https://us.i.posthog.com',
  /** GitHub owner/repo */
  github: 'krisyangdev/motionboard',
  indexNowKey: '2635d416ece22f80c26589dcc5be6170',
  social: {
    ogType: 'website',
    twitterCard: 'summary_large_image',
  },
} as const

export const SITE_URL = `https://${SITE.domain}`
export const SITE_ID = SITE.id
export const POSTHOG_HOST = SITE.posthogHost
export const GITHUB_URL = `https://github.com/${SITE.github}`
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`
export const SKILL_INSTALL = `npx skills add ${SITE.github}`
// Films and posters live in the R2 bucket behind this host (source files in media/, uploaded with
// scripts/upload-media.sh). Workers static assets do not answer range requests, which Safari needs
// for video and seeking needs before a file is fully loaded; R2 does.
export const MEDIA_URL = `https://${SITE.mediaDomain}`

/** hreflang alternates: language tag and URL prefix of each language version */
export const ALT_LANGS = [
  { lang: 'en', prefix: '' },
  { lang: 'zh-CN', prefix: '/zh' },
]
/** hreflang links of an English path, with x-default; used by seo.ts and the sitemap in vite.config.ts */
export const alternateUrls = (path: string) => [
  ...ALT_LANGS.map((a) => ({ lang: a.lang, href: `${SITE_URL}${a.prefix}${path}` })),
  { lang: 'x-default', href: `${SITE_URL}${path}` },
]

// Brand copy
export const BRAND = {
  name: SITE.name,
  // <title>, H1 and meta description of the home page
  title: {
    en: 'Launch-Film Motion Graphics with Claude Code & Codex',
    zh: '用 Claude Code 和 Codex 做宣传片动效',
  },
  headline: {
    en: 'Launch-film motion graphics with Claude Code and Codex',
    zh: '用 Claude Code 和 Codex 做宣传片动效',
  },
  line: {
    en: 'A free HyperFrames skill and 38 shot recipes from Apple and Linear launch films, rebuilt in code. Copy one to your agent and make the same shot for your product.',
    zh: '免费的 HyperFrames skill 和 38 个镜头配方，拆自苹果、Linear 宣传片，用代码复刻。复制一条给你的 Agent，给你的产品做同款镜头。',
  },
}
/** Absolute URL for a path on this site or an already absolute URL. */
export const absolute = (url: string) => (url.startsWith('/') ? `${SITE_URL}${url}` : url)
