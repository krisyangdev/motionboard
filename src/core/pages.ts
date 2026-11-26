// The page list of the site: the one source for the sitemap, llms.txt, redirects and the video sitemap.
// Runs inside vite.config.ts and scripts/ at build time, so it is Node-only and imports no React.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE } from '../../site.config.ts'
import { DEFAULT_LOCALE, LOCALES, type Locale } from './i18n.ts'
import { extraPages, extraVideos } from '../site/pages.ts'

export type SitePage = {
  /** Default-language path with leading and trailing slash. */
  path: string
  title: Record<Locale, string>
  description: Record<Locale, string>
}

/** A text that may differ per language; a plain string is used for every language. */
export type Localized = string | Record<Locale, string>

export type Video = {
  /** Default-language path of the page that shows the video; several videos may share one page. */
  path: string
  title: Localized
  description: Localized
  thumbnail: string
  content: string
  duration: number
  uploadDate: string
}

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const abs = (...p: string[]) => join(ROOT, ...p)

const readJson = <T>(p: string, fallback: T): T => {
  const file = abs(p)
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : fallback
}

/** `key: value` lines between the leading `---` fences; quoted or unquoted values. */
function frontmatter(file: string): Record<string, string> {
  if (!existsSync(file)) return {}
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'))
  const out: Record<string, string> = {}
  for (const line of m?.[1].split(/\r?\n/) ?? []) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*?)\s*$/.exec(line)
    if (!kv) continue
    let v = kv[2]
    if (v.length > 1 && (v[0] === '"' || v[0] === "'") && v.endsWith(v[0])) {
      const q = v[0]
      v = v.slice(1, -1)
      v = q === '"' ? v.replace(/\\(["\\])/g, '$1') : v.replace(/''/g, "'")
    }
    out[kv[1]] = v
  }
  return out
}

const slugs = (dir: string, ext: string) =>
  existsSync(abs(dir)) ? readdirSync(abs(dir)).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length)).sort() : []

/** Builds a per-locale record from a function; locales without a value fall back to the default language. */
function perLocale(get: (l: Locale) => string | undefined): Record<Locale, string> {
  const fallback = get(DEFAULT_LOCALE) ?? ''
  return Object.fromEntries(LOCALES.map((l) => [l, get(l) || fallback])) as Record<Locale, string>
}

const HUBS: Record<string, { title: Record<string, string>; description: Record<string, string> }> = {
  '/tools/': {
    title: { en: 'Tools', zh: '工具' },
    description: { en: 'All tools.', zh: '全部工具。' },
  },
  '/guides/': {
    title: { en: 'Guides', zh: '指南' },
    description: { en: 'All guides.', zh: '全部指南。' },
  },
}

const hub = (path: string): SitePage => ({
  path,
  title: perLocale((l) => HUBS[path].title[l] ?? HUBS[path].title.en),
  description: perLocale((l) => HUBS[path].description[l] ?? HUBS[path].description.en),
})

const mdxPage = (path: string, file: (l: Locale) => string, fallbackTitle: string): SitePage => ({
  path,
  title: perLocale((l) => frontmatter(file(l)).title || (l === DEFAULT_LOCALE ? fallbackTitle : undefined)),
  description: perLocale((l) => frontmatter(file(l)).description),
})

export function sitePages(): SitePage[] {
  const pages: SitePage[] = [{ path: '/', title: perLocale((l) => SITE.title[l]), description: perLocale((l) => SITE.description[l]) }]

  // Built-in sections exist only when the site has content for them.
  const toolSlugs = slugs('content/tools', '.json')
  const guideSlugs = slugs(`content/guides/${DEFAULT_LOCALE}`, '.mdx')
  if (toolSlugs.length) pages.push(hub('/tools/'))

  for (const slug of toolSlugs) {
    const tool = readJson<Record<string, any>>(`content/tools/${slug}.json`, {})
    pages.push({
      path: `/tools/${slug}/`,
      title: perLocale((l) => tool[l]?.title ?? tool.name?.[l]),
      description: perLocale((l) => tool[l]?.description),
    })
  }

  if (guideSlugs.length) pages.push(hub('/guides/'))
  for (const slug of guideSlugs) {
    pages.push(mdxPage(`/guides/${slug}/`, (l) => abs('content/guides', l, `${slug}.mdx`), slug))
  }

  if (existsSync(abs('content/legal', DEFAULT_LOCALE, 'privacy.mdx'))) {
    pages.push(mdxPage('/privacy/', (l) => abs('content/legal', l, 'privacy.mdx'), 'Privacy Policy'))
  }
  if (existsSync(abs('content/legal', DEFAULT_LOCALE, 'terms.mdx'))) {
    pages.push(mdxPage('/terms/', (l) => abs('content/legal', l, 'terms.mdx'), 'Terms of Service'))
  }

  pages.push(...extraPages)
  return pages
}

/** content/renamed.json: default-language `{ "/old/": "/new/" }` pairs. */
export const readRenamed = (): Record<string, string> => readJson('content/renamed.json', {})

/** content/videos.json plus the site's own list (`extraVideos` in src/site/pages.ts): videos for the video sitemap. */
export const readVideos = (): Video[] => [...readJson<Video[]>('content/videos.json', []), ...extraVideos]

export type ContentIndex = {
  tools: { slug: string; name: Record<Locale, string> }[]
  docs: Record<'guides' | 'legal', Record<Locale, { slug: string; title: string; description: string; date: string; updated?: string }[]>>
}

/**
 * Names and frontmatter of every content file, served to the app as `virtual:content-index`
 * (vite.config.ts). Lists and sibling links read this small index, so a page chunk never bundles
 * the full text of every other page.
 */
export function contentIndex(): ContentIndex {
  const tools = slugs('content/tools', '.json').map((slug) => ({ slug, name: readJson<Record<string, any>>(`content/tools/${slug}.json`, {}).name }))
  const docs = {} as ContentIndex['docs']
  for (const collection of ['guides', 'legal'] as const) {
    docs[collection] = {} as ContentIndex['docs']['guides']
    for (const l of LOCALES) {
      docs[collection][l] = slugs(`content/${collection}/${l}`, '.mdx')
        .map((slug) => {
          const fm = frontmatter(abs('content', collection, l, `${slug}.mdx`))
          return { slug, title: fm.title ?? slug, description: fm.description ?? '', date: fm.date ?? '', ...(fm.updated ? { updated: fm.updated } : {}) }
        })
        .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
    }
  }
  return { tools, docs }
}
