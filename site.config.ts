// The one place for everything that differs between sites: domain, name, languages, copy defaults,
// analytics, IndexNow key, CSP allowlist. Imported by the app, vite.config.ts, cloudflare.config.ts
// and scripts/ (Node strips the types), so keep it plain data with no imports.
// No domain or brand string is hard-coded anywhere else.
export const SITE = {
  /** Value of the `site` property on every analytics event (shared PostHog project "Sites"). */
  id: 'motionboard',
  name: 'Motionboard',
  domain: 'motionboard.app',
  /** Cloudflare Worker name. */
  worker: 'motionboard',
  /** Language codes from src/core/locale-data.ts. The default language is served at the root; the others live under /<code>/. */
  languages: ['en', 'zh'],
  /** One of `languages`. */
  defaultLang: 'en',
  /** Home page <title> and meta description, per language. */
  title: { en: 'Launch-Film Motion Graphics with Claude Code & Codex', zh: '用 Claude Code 和 Codex 做宣传片动效' },
  description: {
    en: 'A free HyperFrames skill and 58 shot recipes from Apple, Linear and Figma launch films, rebuilt in code. Copy one to your agent and make the same shot for your product.',
    zh: '免费的 HyperFrames skill 和 58 个镜头配方，拆自苹果、Linear、Figma 等公司的宣传片，用代码复刻。复制一条给你的 Agent，给你的产品做同款镜头。',
  },
  /** Default Open Graph image (absolute URL or a path under public/). */
  ogImage: 'https://media.motionboard.app/hero-film.jpg',
  /** Contact address shown on legal pages and in the footer; empty hides the footer link. */
  email: '',
  github: 'krisyangdev/motionboard',
  /** Build-time env var holding the PostHog project key; unset = events go to the console. */
  posthogKeyEnv: 'VITE_POSTHOG_KEY',
  posthogHost: 'https://us.i.posthog.com',
  /** 32 hex chars; public/<key>.txt must contain the same key. Empty = no IndexNow ping. */
  indexNowKey: '2635d416ece22f80c26589dcc5be6170',
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
  accounts: { enabled: false, signupCredits: 0 },
  social: { twitterCard: 'summary_large_image', twitter: '' },
  /** Extra origins allowed by the Content-Security-Policy, per directive. */
  csp: {
    script: ['https://challenges.cloudflare.com'] as string[],
    connect: [] as string[],
    img: ['https:'] as string[],
    media: ['https://media.motionboard.app'] as string[], // films and posters on MEDIA_URL (src/site/config.ts)
    frame: [] as string[],
    form: [] as string[],
  },
} as const

export type Locale = (typeof SITE.languages)[number]
export const SITE_URL = `https://${SITE.domain}`
