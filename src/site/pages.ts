// What the template's sitemap, llms.txt, _redirects, _headers and video sitemap generation takes from
// this site. Node only (imported by vite.config.ts and scripts/), so no `@/` aliases and no React.
// The lists derived from the recipes are written by scripts/site/recipes.mjs into src/site/data/gen/ before every
// dev start and build (npm predev / prebuild). The recipe pages and their films come from the recipes collection
// (content/collections/recipes, src/site/collections.ts): the template lists them, so they are not in pages.json
// or videos.json.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { ExtraPage, Video } from '../core/pages.ts'

const gen = (file: string) => fileURLToPath(new URL(`./data/gen/${file}`, import.meta.url))
const read = (file: string) => {
  if (!existsSync(gen(file))) throw new Error(`src/site/data/gen/${file} is missing: run \`npm run recipes\` (npm run dev and build do it for you)`)
  return readFileSync(gen(file), 'utf8')
}

/** Hub pages and guides. */
export const extraPages: ExtraPage[] = JSON.parse(read('pages.json'))

/** The showcase films of the launch-video-examples guide. */
export const extraVideos: Video[] = JSON.parse(read('videos.json'))

/** Old recipe files: /r/<old>.md -> /r/<new>.md. The page redirects come from content/renamed.json. */
export const extraRedirects: string[] = read('redirects.txt').split('\n').filter(Boolean)

/** The recipe files for agents are not search pages. */
export const extraHeaders: Record<string, Record<string, string>> = { '/r/*': { 'X-Robots-Tag': 'noindex' } }

/** Replaces the generated llms.txt: description, license, skill install and the recipe files. */
export const llmsTxt: string | undefined = read('llms.txt')

/** Default-language paths the prerender crawl finds through links but that stay out of the sitemap: the saved list, an in-page anchor and the recipe files. */
export const sitemapExclude: string[] = [
  '/saved/',
  '/#recipes',
  ...readdirSync(fileURLToPath(new URL('../../content/collections/recipes', import.meta.url)))
    .filter((f) => f.endsWith('.json'))
    .map((f) => `/r/${f.slice(0, -'.json'.length)}.md`),
]
