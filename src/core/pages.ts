// The page list of the site: the one source for the sitemap, llms.txt, redirects and the video sitemap.
// Runs inside vite.config.ts and scripts/ at build time, so it is Node-only and imports no React.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE } from '../../site.config.ts'
import { DEFAULT_LOCALE, LOCALES, localizePath, stripLocale, type Locale } from './i18n.ts'
import { extraPages } from '../site/pages.ts'

/**
 * Pages rendered per request, never prerendered or listed in the sitemap: accounts, the app, admin, API.
 * They answer with noindex. `robotsDisallow` also keeps crawlers out (login/signup stay crawlable so
 * crawlers can see their noindex, since every page links to them).
 */
export const PRIVATE_PATHS = ['/api/', '/admin/', '/account/', '/app/', '/login/', '/signup/', '/forgot-password/', '/reset-password/']
export const ROBOTS_DISALLOW = ['/api/', '/admin/', ...LOCALES.flatMap((l) => ['/account/', '/app/'].map((p) => localizePath(l, p)))]
export const isPrivatePath = (path: string) => {
  const p = stripLocale(path.endsWith('/') ? path : `${path}/`)
  return PRIVATE_PATHS.some((prefix) => p.startsWith(prefix))
}

export type SitePage = {
  /** Default-language path with leading and trailing slash. */
  path: string
  title: Record<Locale, string>
  description: Record<Locale, string>
}

export type Video = {
  path: string
  title: string
  description: string
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
  const pages: SitePage[] = [
    { path: '/', title: perLocale((l) => SITE.title[l]), description: perLocale((l) => SITE.description[l]) },
    hub('/tools/'),
  ]

  for (const slug of slugs('content/tools', '.json')) {
    const tool = readJson<Record<string, any>>(`content/tools/${slug}.json`, {})
    pages.push({
      path: `/tools/${slug}/`,
      title: perLocale((l) => tool[l]?.title ?? tool.name?.[l]),
      description: perLocale((l) => tool[l]?.description),
    })
  }

  pages.push(hub('/guides/'))
  for (const slug of slugs(`content/guides/${DEFAULT_LOCALE}`, '.mdx')) {
    pages.push(mdxPage(`/guides/${slug}/`, (l) => abs('content/guides', l, `${slug}.mdx`), slug))
  }

  pages.push(mdxPage('/privacy/', (l) => abs('content/legal', l, 'privacy.mdx'), 'Privacy Policy'))
  pages.push(mdxPage('/terms/', (l) => abs('content/legal', l, 'terms.mdx'), 'Terms of Service'))

  for (const path of extraPages) {
    pages.push({ path, title: perLocale(() => ''), description: perLocale(() => '') })
  }
  return pages
}

/** content/renamed.json: default-language `{ "/old/": "/new/" }` pairs. */
export const readRenamed = (): Record<string, string> => readJson('content/renamed.json', {})

/** content/videos.json: videos for the video sitemap. */
export const readVideos = (): Video[] => readJson('content/videos.json', [])

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
