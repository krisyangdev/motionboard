// What the template's sitemap, llms.txt, _redirects, _headers and video sitemap generation takes from
// this site. Node only (imported by vite.config.ts and scripts/), so no `@/` aliases and no React.
import type { SitePage, Video } from '../core/pages.ts'

/** Pages beyond the template's own (home, tools, guides, legal come from content/). Each is prerendered in every language it lists and goes in the sitemap and llms.txt. */
export const extraPages: SitePage[] = []

/** Videos for the video sitemap beyond content/videos.json. */
export const extraVideos: Video[] = []

/** Raw `_redirects` lines appended after the ones generated from content/renamed.json. */
export const extraRedirects: string[] = []

/** Extra `_headers` blocks, e.g. { '/r/*': { 'X-Robots-Tag': 'noindex' } }. */
export const extraHeaders: Record<string, Record<string, string>> = {}

/** Replaces the generated llms.txt when set. */
export const llmsTxt: string | undefined = undefined

/** Default-language paths that are prerendered but kept out of the sitemap (with and without trailing slash, every language). */
export const sitemapExclude: string[] = []
