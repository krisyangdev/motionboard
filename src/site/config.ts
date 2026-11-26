// Motionboard values beyond the template's site.config.ts. Plain data and no imports besides
// site.config.ts, so scripts (Node strips the types) and the app can both import it.
import { SITE, SITE_URL } from '../../site.config.ts'

export { SITE, SITE_URL }
export type { Locale } from '../../site.config.ts'

/** Films and posters live in the R2 bucket behind this host (source files in media/, uploaded with
 *  scripts/site/upload-media.sh). Workers static assets do not answer range requests, which Safari
 *  needs for video and seeking; R2 does. Keep in step with SITE.csp.media in site.config.ts. */
export const MEDIA_DOMAIN = 'media.motionboard.app'
export const MEDIA_URL = `https://${MEDIA_DOMAIN}`

export const GITHUB_URL = `https://github.com/${SITE.github}`
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`
export const SKILL_INSTALL = `npx skills add ${SITE.github}`

/** Brand copy: H1 and the line under it. The <title> and meta description of the home page are SITE.title and SITE.description. */
export const BRAND = {
  name: SITE.name,
  headline: {
    en: 'Launch-film motion graphics with Claude Code and Codex',
    zh: '用 Claude Code 和 Codex 做宣传片动效',
  },
}
