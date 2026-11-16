export type Locale = 'en' | 'zh'

// Brand and canonical host. Change the name or domain here only.
export const BRAND = {
  name: 'Motionboard',
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
export const SITE_URL = 'https://motionboard.app'
export const SITE_ID = 'motionboard'
export const POSTHOG_HOST = 'https://us.i.posthog.com'
export const GITHUB_URL = 'https://github.com/krisyangdev/motionboard'
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`
export const SKILL_INSTALL = 'npx skills add krisyangdev/motionboard'
// Films and posters live in the R2 bucket behind this host (source files in media/, uploaded with
// scripts/upload-media.sh). Workers static assets do not answer range requests, which Safari needs
// for video and seeking needs before a file is fully loaded; R2 does.
export const MEDIA_URL = 'https://media.motionboard.app'
/** Absolute URL for a path on this site or an already absolute URL. */
export const absolute = (url: string) => (url.startsWith('/') ? `${SITE_URL}${url}` : url)
