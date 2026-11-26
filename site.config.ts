// The one place for everything that differs between sites: domain, name, languages, brand colour,
// analytics, IndexNow key, feature switches. Imported by the app, vite.config.ts, cloudflare.config.ts
// and scripts/ (Node strips the types). No domain or brand string is hard-coded anywhere else.
export const SITE = {
  /** Value of the `site` property on every analytics event (shared PostHog project). */
  id: 'site-template',
  name: 'Site Template',
  domain: 'template.krisyang.dev',
  /** Cloudflare Worker name. */
  worker: 'site-template',
  languages: ['en', 'zh'],
  defaultLang: 'en',
  /** Contact address shown on legal pages. */
  email: 'hello@example.com',
  github: 'krisyangdev/site-template',
  /** Build-time env var holding the PostHog project key; unset = events go to the console. */
  posthogKeyEnv: 'VITE_POSTHOG_KEY',
  posthogHost: 'https://us.i.posthog.com',
  /** 32 hex chars; public/<key>.txt must exist. */
  indexNowKey: '',
  social: { twitterCard: 'summary_large_image', twitter: '' },
} as const

export type Locale = (typeof SITE.languages)[number]
export const SITE_URL = `https://${SITE.domain}`
