// The page list of the site: the one source for the sitemap, llms.txt, redirects and the video sitemap.
// Runs inside vite.config.ts and scripts/ at build time, so it is Node-only and imports no React.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE } from '../../site.config.ts'
import { LOCALES, localizePath, missingCoreMessages, stripLocale, type Locale } from './i18n.ts'
import type { CoreMessages } from './messages/en.ts'
import { guideSchema, legalSchema, parseContent, slugSchema, toolFileSchema, type GuideFrontmatter, type LegalFrontmatter, type ToolFile } from './content/schema.ts'
import type { Crumb } from './seo.ts'
import { extraPages, extraVideos, sitemapExclude } from '../site/pages.ts'

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

export type PageType =
  | 'home'
  | 'tool'
  | 'item'
  | 'hub'
  | 'guide'
  | 'compare'
  | 'alternatives'
  | 'glossary'
  | 'use-case'
  | 'gallery'
  | 'changelog'
  | 'about'
  | 'legal'

/**
 * A page of the site. It exists in a language only when it has a title there: no fallback to another
 * language, a missing translation means no page (no URL, no sitemap entry, no hreflang).
 */
export type SitePage = {
  /** Default-language path with leading and trailing slash. */
  path: string
  type: PageType
  title: Partial<Record<Locale, string>>
  description: Partial<Record<Locale, string>>
  /** The searched term the page targets, per language. Unique per language across the site. Hubs, legal pages and home have none yet. */
  keyword?: Partial<Record<Locale, string>>
  /** False for pages prerendered but kept out of the sitemap (`sitemapExclude`). */
  indexable: boolean
  /** Why the page is not indexable; set only then. */
  reasons?: string[]
  /** YYYY-MM-DD of the last content change: `updated` of the page, the newest member for a hub. */
  lastmod?: string
  /** Breadcrumb trail per language, home first, the page itself last; the same trail the page shows. None for the home page. */
  breadcrumb?: Partial<Record<Locale, Crumb[]>>
}

/** A page a site adds in src/site/pages.ts; the template fills in `indexable` and `reasons`. */
export type ExtraPage = Omit<SitePage, 'indexable' | 'reasons'>

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

/**
 * `key: value` lines between the leading `---` fences. A value is a quoted or plain string, or JSON when it starts
 * with `{` or `[` (nested values such as `demand` are written as one-line JSON, which is also valid YAML).
 */
function frontmatter(file: string): Record<string, unknown> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'))
  const out: Record<string, unknown> = {}
  for (const line of m?.[1].split(/\r?\n/) ?? []) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*?)\s*$/.exec(line)
    if (!kv) continue
    let v: unknown = kv[2]
    if (kv[2][0] === '{' || kv[2][0] === '[') {
      try {
        v = JSON.parse(kv[2])
      } catch {
        throw new Error(`${relative(ROOT, file)}: ${kv[1]}: not valid JSON on one line`)
      }
    } else if (kv[2].length > 1 && (kv[2][0] === '"' || kv[2][0] === "'") && kv[2].endsWith(kv[2][0])) {
      const q = kv[2][0]
      const inner = kv[2].slice(1, -1)
      v = q === '"' ? inner.replace(/\\(["\\])/g, '$1') : inner.replace(/''/g, "'")
    }
    out[kv[1]] = v
  }
  return out
}

const slugs = (dir: string, ext: string) =>
  existsSync(abs(dir)) ? readdirSync(abs(dir)).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length)).sort() : []

// Every content file is validated against src/core/content/schema.ts when it is read: a bad file stops the build with its path and field.

/** Every tool file, validated. */
function readTools(): Map<string, ToolFile> {
  const schema = toolFileSchema(LOCALES)
  return new Map(
    slugs('content/tools', '.json').map((slug) => {
      const file = `content/tools/${slug}.json`
      let data: unknown
      try {
        data = JSON.parse(readFileSync(abs(file), 'utf8'))
      } catch (e) {
        throw new Error(`${file}: invalid JSON: ${(e as Error).message}`)
      }
      const tool = parseContent(schema, data, file) as ToolFile
      if (tool.slug !== slug) throw new Error(`${file}: slug "${tool.slug}" must equal the file name "${slug}"`)
      return [slug, tool] as const
    }),
  )
}

function readDoc<T>(schema: Parameters<typeof parseContent>[0], collection: 'guides' | 'legal', l: Locale, slug: string): T {
  const file = `content/${collection}/${l}/${slug}.mdx`
  parseContent(slugSchema, slug, file)
  return parseContent(schema, frontmatter(abs(file)), file) as T
}
const readGuide = (l: Locale, slug: string) => readDoc<GuideFrontmatter>(guideSchema, 'guides', l, slug)
const readLegal = (l: Locale, slug: string) => readDoc<LegalFrontmatter>(legalSchema, 'legal', l, slug)

/** Builds a per-locale record from a function; a language without a value has no entry (no fallback). */
function perLocale<T>(get: (l: Locale) => T | undefined): Partial<Record<Locale, T>> {
  return Object.fromEntries(LOCALES.map((l) => [l, get(l)] as const).filter(([, v]) => !!v))
}

// UI texts come from the core messages (src/core/messages/<code>.ts). This module also runs in plain Node
// (vite.config.ts, scripts/), where import.meta.glob does not exist, so the files are imported by path.
const messages = Object.fromEntries(
  await Promise.all(
    LOCALES.map(async (l) => {
      const file = new URL(`./messages/${l}.ts`, import.meta.url)
      if (!existsSync(file)) throw missingCoreMessages(l)
      return [l, ((await import(file.href)) as { default: CoreMessages }).default] as const
    }),
  ),
) as Record<Locale, CoreMessages>

/** The core UI strings of a language, for Node code (scripts/test.mjs); the app uses `coreMessages`. */
export const messagesOf = (l: Locale): CoreMessages => messages[l]

const newest = (dates: (string | undefined)[]) => dates.filter((d): d is string => !!d).sort().at(-1)

/** Keywords are unique per language across the site: two pages for one searched term compete with each other. */
function assertUniqueKeywords(pages: SitePage[]) {
  for (const l of LOCALES) {
    const seen = new Map<string, string>()
    for (const p of pages) {
      const k = p.keyword?.[l]?.trim().toLowerCase()
      if (!k) continue
      const other = seen.get(k)
      if (other) throw new Error(`keyword "${p.keyword?.[l]}" (${l}) is used by both ${other} and ${p.path}; give each page its own searched term`)
      seen.set(k, p.path)
    }
  }
}

export function sitePages(): SitePage[] {
  const trail = (l: Locale, ...items: Crumb[]): Crumb[] => [{ name: messages[l].page.home, path: '/' }, ...items]
  const crumbs = (locales: Locale[], build: (l: Locale) => Crumb[]) => Object.fromEntries(locales.map((l) => [l, build(l)]))
  const pages: ExtraPage[] = []

  // Built-in sections exist only in the languages that have content for them.
  const tools = readTools()
  const toolName = (tool: ToolFile, l: Locale) => tool.name?.[l] || tool[l]!.title
  const toolLocales = (tool: ToolFile) => LOCALES.filter((l) => tool[l]?.title)
  const guideSlugs = [...new Set(LOCALES.flatMap((l) => slugs(`content/guides/${l}`, '.mdx')))].sort()
  const guides = new Map(guideSlugs.map((slug) => [slug, perLocale((l) => (existsSync(abs('content/guides', l, `${slug}.mdx`)) ? readGuide(l, slug) : undefined))]))
  const hasTool = (l: Locale) => [...tools.values()].some((t) => t[l]?.title)
  const hasGuide = (l: Locale) => [...guides.values()].some((g) => g[l])

  if (tools.size) {
    pages.push({
      path: '/tools/',
      type: 'hub',
      title: perLocale((l) => (hasTool(l) ? messages[l].hubs.tools.title : undefined)),
      description: perLocale((l) => (hasTool(l) ? messages[l].hubs.tools.description : undefined)),
      lastmod: newest([...tools.values()].map((t) => t.updated)),
      breadcrumb: crumbs(LOCALES.filter(hasTool), (l) => trail(l, { name: messages[l].page.tools, path: '/tools/' })),
    })
  }
  for (const [slug, tool] of tools) {
    const path = `/tools/${slug}/`
    pages.push({
      path,
      type: 'tool',
      title: perLocale((l) => tool[l]?.title),
      description: perLocale((l) => tool[l]?.description),
      keyword: perLocale((l) => tool[l]?.keyword),
      lastmod: tool.updated,
      breadcrumb: crumbs(toolLocales(tool), (l) => trail(l, { name: messages[l].page.tools, path: '/tools/' }, { name: toolName(tool, l), path })),
    })
  }

  if (guides.size) {
    pages.push({
      path: '/guides/',
      type: 'hub',
      title: perLocale((l) => (hasGuide(l) ? messages[l].hubs.guides.title : undefined)),
      description: perLocale((l) => (hasGuide(l) ? messages[l].hubs.guides.description : undefined)),
      lastmod: newest([...guides.values()].flatMap((g) => LOCALES.map((l) => g[l]?.updated))),
      breadcrumb: crumbs(LOCALES.filter(hasGuide), (l) => trail(l, { name: messages[l].page.guides, path: '/guides/' })),
    })
  }
  for (const [slug, g] of guides) {
    const path = `/guides/${slug}/`
    pages.push({
      path,
      type: 'guide',
      title: perLocale((l) => g[l]?.title),
      description: perLocale((l) => g[l]?.description),
      keyword: perLocale((l) => g[l]?.keyword),
      lastmod: newest(LOCALES.map((l) => g[l]?.updated)),
      breadcrumb: crumbs(LOCALES.filter((l) => g[l]), (l) => trail(l, { name: messages[l].page.guides, path: '/guides/' }, { name: g[l]!.title, path })),
    })
  }

  for (const slug of ['privacy', 'terms']) {
    const path = `/${slug}/`
    const legal = perLocale((l) => (existsSync(abs('content/legal', l, `${slug}.mdx`)) ? readLegal(l, slug) : undefined))
    pages.push({
      path,
      type: 'legal',
      title: perLocale((l) => legal[l]?.title),
      description: perLocale((l) => legal[l]?.description),
      lastmod: newest(LOCALES.map((l) => legal[l]?.updated)),
      breadcrumb: crumbs(LOCALES.filter((l) => legal[l]), (l) => trail(l, { name: legal[l]!.title, path })),
    })
  }

  pages.push(...extraPages)
  // A page that exists in no language (no tool text, no file) is not a page.
  const existing = pages.filter((p) => pageLocales(p).length > 0)
  const home: ExtraPage = {
    path: '/',
    type: 'home',
    title: perLocale((l) => SITE.title[l]),
    description: perLocale((l) => SITE.description[l]),
    lastmod: newest(existing.map((p) => p.lastmod)),
  }
  const excluded = new Set(sitemapExclude)
  const all = [home, ...existing].map((p): SitePage =>
    excluded.has(p.path) ? { ...p, indexable: false, reasons: ['listed in sitemapExclude (src/site/pages.ts)'] } : { ...p, indexable: true },
  )
  assertUniqueKeywords(all)
  return all
}

/** content/renamed.json: default-language `{ "/old/": "/new/" }` pairs. */
export const readRenamed = (): Record<string, string> => readJson('content/renamed.json', {})

/** content/videos.json plus the site's own list (`extraVideos` in src/site/pages.ts): videos for the video sitemap. */
export const readVideos = (): Video[] => [...readJson<Video[]>('content/videos.json', []), ...extraVideos]

export type DocIndexEntry = { slug: string; title: string; description: string; published: string; updated: string }

export type ContentIndex = {
  /** `name` and `locales` cover only the languages the tool has text in. */
  tools: { slug: string; name: Partial<Record<Locale, string>>; locales: Locale[] }[]
  docs: Record<'guides' | 'legal', Record<Locale, DocIndexEntry[]>>
}

/**
 * Names and frontmatter of every content file, served to the app as `virtual:content-index`
 * (vite.config.ts). Lists and sibling links read this small index, so a page chunk never bundles
 * the full text of every other page.
 */
export function contentIndex(): ContentIndex {
  const tools = [...readTools()].flatMap(([slug, tool]) => {
    const locales = LOCALES.filter((l) => tool[l]?.title)
    const name = Object.fromEntries(locales.map((l) => [l, tool.name?.[l] || tool[l]!.title]))
    return locales.length ? [{ slug, name, locales }] : []
  })
  const docs = {} as ContentIndex['docs']
  for (const collection of ['guides', 'legal'] as const) {
    docs[collection] = {} as ContentIndex['docs']['guides']
    for (const l of LOCALES) {
      docs[collection][l] = slugs(`content/${collection}/${l}`, '.mdx')
        .map((slug) => {
          const fm = collection === 'guides' ? readGuide(l, slug) : readLegal(l, slug)
          return { slug, title: fm.title, description: fm.description, published: fm.published, updated: fm.updated }
        })
        .sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug))
    }
  }
  return { tools, docs }
}
