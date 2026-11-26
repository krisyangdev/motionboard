// The page list of the site: the one source for the sitemap, llms.txt, redirects and the video sitemap.
// Runs inside vite.config.ts and scripts/ at build time, so it is Node-only and imports no React.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE } from '../../site.config.ts'
import { LOCALES, localizePath, missingCoreMessages, stripLocale, type Locale } from './i18n.ts'
import type { CoreMessages } from './messages/en.ts'
import { extraPages, extraVideos } from '../site/pages.ts'

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

/**
 * A page of the site. It exists in a language only when it has a title there: no fallback to another
 * language, a missing translation means no page (no URL, no sitemap entry, no hreflang).
 */
export type SitePage = {
  /** Default-language path with leading and trailing slash. */
  path: string
  title: Partial<Record<Locale, string>>
  description: Partial<Record<Locale, string>>
}

/** The languages a page exists in, in the order of `languages` in site.config.ts. */
export const pageLocales = (page: Pick<SitePage, 'title'>): Locale[] => LOCALES.filter((l) => !!page.title[l])

/** A text that may differ per language; a plain string is used for every language. */
export type Localized = string | Partial<Record<Locale, string>>

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

/** Builds a per-locale record from a function; a language without a value has no entry (no fallback). */
function perLocale(get: (l: Locale) => string | undefined): Partial<Record<Locale, string>> {
  return Object.fromEntries(LOCALES.map((l) => [l, get(l)] as const).filter(([, text]) => !!text))
}

// Hub texts come from the core messages (src/core/messages/<code>.ts). This module also runs in plain Node
// (vite.config.ts, scripts/), where import.meta.glob does not exist, so the files are imported by path.
const hubTexts = Object.fromEntries(
  await Promise.all(
    LOCALES.map(async (l) => {
      const file = new URL(`./messages/${l}.ts`, import.meta.url)
      if (!existsSync(file)) throw missingCoreMessages(l)
      return [l, ((await import(file.href)) as { default: CoreMessages }).default.hubs] as const
    }),
  ),
) as Record<Locale, CoreMessages['hubs']>

/** A hub page (tools, guides) exists in the languages that have at least one entry. */
const hub = (path: '/tools/' | '/guides/', has: (l: Locale) => boolean): SitePage => {
  const key = path === '/tools/' ? 'tools' : 'guides'
  return {
    path,
    title: perLocale((l) => (has(l) ? hubTexts[l][key].title : undefined)),
    description: perLocale((l) => (has(l) ? hubTexts[l][key].description : undefined)),
  }
}

/** An MDX page exists in the languages that have its file. */
const mdxPage = (path: string, name: string, file: (l: Locale) => string): SitePage => ({
  path,
  title: perLocale((l) => (existsSync(file(l)) ? frontmatter(file(l)).title || name : undefined)),
  description: perLocale((l) => frontmatter(file(l)).description),
})

type ToolFile = Record<string, any>

export function sitePages(): SitePage[] {
  const pages: SitePage[] = [{ path: '/', title: perLocale((l) => SITE.title[l]), description: perLocale((l) => SITE.description[l]) }]

  // Built-in sections exist only in the languages that have content for them.
  const toolSlugs = slugs('content/tools', '.json')
  const tools = new Map(toolSlugs.map((slug) => [slug, readJson<ToolFile>(`content/tools/${slug}.json`, {})]))
  const guideSlugs = [...new Set(LOCALES.flatMap((l) => slugs(`content/guides/${l}`, '.mdx')))].sort()
  const hasTool = (l: Locale) => [...tools.values()].some((t) => t[l]?.title)
  const hasGuide = (l: Locale) => guideSlugs.some((slug) => existsSync(abs('content/guides', l, `${slug}.mdx`)))

  if (toolSlugs.length) pages.push(hub('/tools/', hasTool))
  for (const [slug, tool] of tools) {
    pages.push({
      path: `/tools/${slug}/`,
      title: perLocale((l) => tool[l]?.title),
      description: perLocale((l) => tool[l]?.description),
    })
  }

  if (guideSlugs.length) pages.push(hub('/guides/', hasGuide))
  for (const slug of guideSlugs) {
    pages.push(mdxPage(`/guides/${slug}/`, slug, (l) => abs('content/guides', l, `${slug}.mdx`)))
  }

  for (const [slug, name] of [['privacy', 'Privacy Policy'], ['terms', 'Terms of Service']] as const) {
    pages.push(mdxPage(`/${slug}/`, name, (l) => abs('content/legal', l, `${slug}.mdx`)))
  }

  pages.push(...extraPages)
  // A page that exists in no language (no tool text, no file) is not a page.
  return pages.filter((p) => pageLocales(p).length > 0)
}

/** content/renamed.json: default-language `{ "/old/": "/new/" }` pairs. */
export const readRenamed = (): Record<string, string> => readJson('content/renamed.json', {})

/** content/videos.json plus the site's own list (`extraVideos` in src/site/pages.ts): videos for the video sitemap. */
export const readVideos = (): Video[] => [...readJson<Video[]>('content/videos.json', []), ...extraVideos]

export type ContentIndex = {
  /** `name` and `locales` cover only the languages the tool has text in. */
  tools: { slug: string; name: Partial<Record<Locale, string>>; locales: Locale[] }[]
  docs: Record<'guides' | 'legal', Record<Locale, { slug: string; title: string; description: string; date: string; updated?: string }[]>>
}

/**
 * Names and frontmatter of every content file, served to the app as `virtual:content-index`
 * (vite.config.ts). Lists and sibling links read this small index, so a page chunk never bundles
 * the full text of every other page.
 */
export function contentIndex(): ContentIndex {
  const tools = slugs('content/tools', '.json').flatMap((slug) => {
    const tool = readJson<ToolFile>(`content/tools/${slug}.json`, {})
    const locales = LOCALES.filter((l) => tool[l]?.title)
    const name = Object.fromEntries(locales.map((l) => [l, tool.name?.[l] || tool[l].title]))
    return locales.length ? [{ slug, name, locales }] : []
  })
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
