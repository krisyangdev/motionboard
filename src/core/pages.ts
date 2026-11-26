// The page list of the site: the one source for the sitemap, llms.txt, redirects and the video sitemap.
// Runs inside vite.config.ts and scripts/ at build time, so it is Node-only and imports no React.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE } from '../../site.config.ts'
import { LOCALES, localizePath, missingCoreMessages, stripLocale, type Locale } from './i18n.ts'
import type { CoreMessages } from './messages/en.ts'
import {
  aboutSchema,
  guideSchema,
  HUB_COLLECTIONS,
  hubFileSchema,
  legalSchema,
  parseContent,
  slugSchema,
  toolFileSchema,
  type AboutFrontmatter,
  type GuideFrontmatter,
  type HubCollection,
  type HubFile,
  type LegalFrontmatter,
  type ToolFile,
} from './content/schema.ts'
import { HUB_PAGE_SIZE, hubPageCount, hubPagePath } from './content/hubs.ts'
import { aboutVerdict, DEFAULT_HUB_MIN_MEMBERS, guideVerdict, hubVerdict, legalVerdict, toolVerdict, type Verdict } from './seo/quality.ts'
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
  /** False when the page is noindex in every language it exists in (quality gate or `sitemapExclude`). */
  indexable: boolean
  /** Why the page is noindex in some or all of its languages, `<lang>: <reason>`; set only then. */
  reasons?: string[]
  /**
   * Languages the page exists in but keeps out of the index (noindex meta, no canonical or hreflang, not in the
   * sitemap, llms.txt or hub lists), with the reasons. Set by the quality gate (src/core/seo/quality.ts).
   */
  noindex?: Partial<Record<Locale, string[]>>
  /** YYYY-MM-DD of the last content change: `updated` of the page, the newest member for a hub. */
  lastmod?: string
  /** Breadcrumb trail per language, home first, the page itself last; the same trail the page shows. None for the home page. */
  breadcrumb?: Partial<Record<Locale, Crumb[]>>
}

/** A page a site adds in src/site/pages.ts; the template fills in `indexable` and `reasons` (`noindex` is optional). */
export type ExtraPage = Omit<SitePage, 'indexable' | 'reasons'>

/** The languages a page exists in, in the order of `languages` in site.config.ts. */
export const pageLocales = (page: Pick<SitePage, 'title'>): Locale[] => LOCALES.filter((l) => !!page.title[l])

/** The languages a page exists in and may be indexed in: the ones in the sitemap, llms.txt and the hreflang set. */
export const indexableLocales = (page: Pick<SitePage, 'title' | 'noindex'>): Locale[] => pageLocales(page).filter((l) => !page.noindex?.[l])

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
function splitDoc(file: string): { data: Record<string, unknown>; body: string } {
  const src = readFileSync(file, 'utf8')
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src)
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
  return { data: out, body: m ? src.slice(m[0].length) : src }
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

type Collection = 'guides' | 'legal' | 'about'
const docSchemas = { guides: guideSchema, legal: legalSchema, about: aboutSchema }
type DocOf = { guides: GuideFrontmatter; legal: LegalFrontmatter; about: AboutFrontmatter }

/** Validated frontmatter and the MDX body of content/<collection>/<lang>/<slug>.mdx. */
function readDoc<C extends Collection>(collection: C, l: Locale, slug: string): { fm: DocOf[C]; body: string } {
  const file = `content/${collection}/${l}/${slug}.mdx`
  parseContent(slugSchema, slug, file)
  const { data, body } = splitDoc(abs(file))
  return { fm: parseContent(docSchemas[collection], data, file) as DocOf[C], body }
}
const docExists = (collection: Collection, l: Locale, slug: string) => existsSync(abs('content', collection, l, `${slug}.mdx`))

/** Every hub file (content/hubs/<collection>.json), validated. */
function readHubs(): Map<HubCollection, HubFile> {
  const schema = hubFileSchema(LOCALES)
  return new Map(
    slugs('content/hubs', '.json').map((name) => {
      const file = `content/hubs/${name}.json`
      let data: unknown
      try {
        data = JSON.parse(readFileSync(abs(file), 'utf8'))
      } catch (e) {
        throw new Error(`${file}: invalid JSON: ${(e as Error).message}`)
      }
      const hub = parseContent(schema, data, file) as HubFile
      if (!(HUB_COLLECTIONS as readonly string[]).includes(name) || hub.collection !== name) throw new Error(`${file}: the file name and "collection" must both be one of ${HUB_COLLECTIONS.join(', ')}`)
      return [hub.collection, hub] as const
    }),
  )
}

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

/** `seo.hubMinMembers` of site.config.ts, else the spec's 6: indexable members a hub needs to be indexable. */
const hubMinMembers = (): number => (SITE as { seo?: { hubMinMembers?: number } }).seo?.hubMinMembers ?? DEFAULT_HUB_MIN_MEMBERS

/**
 * A page of a paginated hub (/guides/page/2/): prerendered, self-canonical, never in the sitemap. It is noindex
 * only where the hub itself is. `locales` are the languages that have that page (their member count needs it).
 */
export type PagedHub = { path: string; hub: string; n: number; locales: Locale[]; noindex: Locale[] }

function build(): { pages: SitePage[]; paged: PagedHub[] } {
  const trail = (l: Locale, ...items: Crumb[]): Crumb[] => [{ name: messages[l].page.home, path: '/' }, ...items]
  const crumbs = (locales: Locale[], make: (l: Locale) => Crumb[]) => Object.fromEntries(locales.map((l) => [l, make(l)]))
  const pages: ExtraPage[] = []
  const noindexOf = (locales: Locale[], verdict: (l: Locale) => Verdict) => {
    const out: Partial<Record<Locale, string[]>> = {}
    for (const l of locales) {
      const v = verdict(l)
      if (!v.indexable) out[l] = v.reasons
    }
    return out
  }

  // Built-in sections exist only in the languages that have content for them.
  const tools = readTools()
  const toolName = (tool: ToolFile, l: Locale) => tool.name?.[l] || tool[l]!.title
  const toolLocales = (tool: ToolFile) => LOCALES.filter((l) => tool[l]?.title)
  const guideSlugs = [...new Set(LOCALES.flatMap((l) => slugs(`content/guides/${l}`, '.mdx')))].sort()
  const guides = new Map(guideSlugs.map((slug) => [slug, perLocale((l) => (docExists('guides', l, slug) ? readDoc('guides', l, slug) : undefined))]))
  const hubs = readHubs()

  // Members of each hub per language: all that exist, and the ones the quality gate lets into the index.
  const toolGate = new Map([...tools].map(([slug, t]) => [slug, noindexOf(toolLocales(t), (l) => toolVerdict(t[l]!))]))
  const guideGate = new Map([...guides].map(([slug, g]) => [slug, noindexOf(LOCALES.filter((l) => g[l]), (l) => guideVerdict(g[l]!.fm, g[l]!.body))]))
  const members = (collection: HubCollection, l: Locale) =>
    collection === 'tools'
      ? { all: [...tools].filter(([, t]) => t[l]?.title).length, indexable: [...tools].filter(([slug, t]) => t[l]?.title && !toolGate.get(slug)![l]).length }
      : { all: [...guides].filter(([, g]) => g[l]).length, indexable: [...guides].filter(([slug, g]) => g[l] && !guideGate.get(slug)![l]).length }
  const hubLocales = (collection: HubCollection) => LOCALES.filter((l) => hubs.get(collection)?.[l]?.title && members(collection, l).all > 0)
  // The breadcrumb level of a hub exists only in the languages that have the hub.
  const hubCrumb = (collection: HubCollection, l: Locale): Crumb[] => (hubLocales(collection).includes(l) ? [{ name: messages[l].page[collection], path: `/${collection}/` }] : [])

  const paged = new Map<string, PagedHub>()
  for (const [collection, hub] of hubs) {
    const hubPath = `/${collection}/`
    const locales = hubLocales(collection)
    if (!locales.length) continue
    const text = (l: Locale) => hub[l]!
    const noindex = noindexOf(locales, (l) => hubVerdict(text(l), members(collection, l).indexable, hubMinMembers()))
    const memberDates = collection === 'tools' ? [...tools.values()].map((t) => t.updated) : [...guides.values()].flatMap((g) => LOCALES.map((l) => g[l]?.fm.updated))
    pages.push({
      path: hubPath,
      type: 'hub',
      title: perLocale((l) => (locales.includes(l) ? text(l).title : undefined)),
      description: perLocale((l) => (locales.includes(l) ? text(l).description : undefined)),
      keyword: perLocale((l) => (locales.includes(l) ? text(l).keyword : undefined)),
      lastmod: newest([hub.updated, ...memberDates]),
      breadcrumb: crumbs(locales, (l) => trail(l, ...hubCrumb(collection, l))),
      noindex,
    })
    const size = hub.pageSize ?? HUB_PAGE_SIZE
    for (const l of locales) {
      for (let n = 2; n <= hubPageCount(members(collection, l).indexable, size); n++) {
        const path = hubPagePath(hubPath, n)
        const entry = paged.get(path) ?? { path, hub: hubPath, n, locales: [], noindex: [] }
        entry.locales.push(l)
        if (noindex[l]) entry.noindex.push(l)
        paged.set(path, entry)
      }
    }
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
      breadcrumb: crumbs(toolLocales(tool), (l) => trail(l, ...hubCrumb('tools', l), { name: toolName(tool, l), path })),
      noindex: toolGate.get(slug),
    })
  }

  for (const [slug, g] of guides) {
    const path = `/guides/${slug}/`
    pages.push({
      path,
      type: 'guide',
      title: perLocale((l) => g[l]?.fm.title),
      description: perLocale((l) => g[l]?.fm.description),
      keyword: perLocale((l) => g[l]?.fm.keyword),
      lastmod: newest(LOCALES.map((l) => g[l]?.fm.updated)),
      breadcrumb: crumbs(LOCALES.filter((l) => g[l]), (l) => trail(l, ...hubCrumb('guides', l), { name: g[l]!.fm.title, path })),
      noindex: guideGate.get(slug),
    })
  }

  for (const slug of ['privacy', 'terms']) {
    const path = `/${slug}/`
    const legal = perLocale((l) => (docExists('legal', l, slug) ? readDoc('legal', l, slug) : undefined))
    pages.push({
      path,
      type: 'legal',
      title: perLocale((l) => legal[l]?.fm.title),
      description: perLocale((l) => legal[l]?.fm.description),
      lastmod: newest(LOCALES.map((l) => legal[l]?.fm.updated)),
      breadcrumb: crumbs(LOCALES.filter((l) => legal[l]), (l) => trail(l, { name: legal[l]!.fm.title, path })),
      noindex: noindexOf(LOCALES.filter((l) => legal[l]), (l) => legalVerdict(legal[l]!.fm, legal[l]!.body)),
    })
  }

  const about = perLocale((l) => (docExists('about', l, 'about') ? readDoc('about', l, 'about') : undefined))
  pages.push({
    path: '/about/',
    type: 'about',
    title: perLocale((l) => about[l]?.fm.title),
    description: perLocale((l) => about[l]?.fm.description),
    lastmod: newest(LOCALES.map((l) => about[l]?.fm.updated)),
    breadcrumb: crumbs(LOCALES.filter((l) => about[l]), (l) => trail(l, { name: about[l]!.fm.title, path: '/about/' })),
    noindex: noindexOf(LOCALES.filter((l) => about[l]), (l) => aboutVerdict(about[l]!.fm, about[l]!.body)),
  })

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
  const all = [home, ...existing].map((p): SitePage => {
    const noindex: Partial<Record<Locale, string[]>> = { ...p.noindex }
    if (excluded.has(p.path)) for (const l of pageLocales(p)) noindex[l] = [...(noindex[l] ?? []), 'listed in sitemapExclude (src/site/pages.ts)']
    const out = Object.keys(noindex) as Locale[]
    if (!out.length) return { ...p, noindex: undefined, indexable: true }
    const reasons = out.flatMap((l) => noindex[l]!.map((r) => (LOCALES.length > 1 ? `${l}: ${r}` : r)))
    return { ...p, noindex, indexable: pageLocales(p).some((l) => !noindex[l]), reasons }
  })
  assertUniqueKeywords(all)
  return { pages: all, paged: [...paged.values()].sort((a, b) => a.hub.localeCompare(b.hub) || a.n - b.n) }
}

/** Every page of the site with its quality verdict per language (see SitePage). */
export const sitePages = (): SitePage[] => build().pages

/** Pages 2 and up of the paginated hubs; they are prerendered but not site pages (no sitemap, llms.txt or hreflang entry of their own). */
export const hubPagination = (): PagedHub[] => build().paged

/** content/renamed.json: default-language `{ "/old/": "/new/" }` pairs. */
export const readRenamed = (): Record<string, string> => readJson('content/renamed.json', {})

/** content/videos.json plus the site's own list (`extraVideos` in src/site/pages.ts): videos for the video sitemap. */
export const readVideos = (): Video[] => [...readJson<Video[]>('content/videos.json', []), ...extraVideos]

export type DocIndexEntry = { slug: string; title: string; description: string; published: string; updated: string }

export type ContentIndex = {
  /** `name`, `description` and `locales` cover only the languages the tool has text in. */
  tools: { slug: string; name: Partial<Record<Locale, string>>; description: Partial<Record<Locale, string>>; locales: Locale[] }[]
  docs: Record<Collection, Record<Locale, DocIndexEntry[]>>
  /** Every site page by default-language path: the languages it exists in and the ones kept out of the index (noindex). */
  pages: Record<string, { locales: Locale[]; noindex: Locale[] }>
}

/**
 * Names and frontmatter of every content file, served to the app as `virtual:content-index`
 * (vite.config.ts). Lists, sibling links and the noindex state of each page read this small index, so a
 * page chunk never bundles the full text of every other page.
 */
export function contentIndex(): ContentIndex {
  const tools = [...readTools()].flatMap(([slug, tool]) => {
    const locales = LOCALES.filter((l) => tool[l]?.title)
    const name = Object.fromEntries(locales.map((l) => [l, tool.name?.[l] || tool[l]!.title]))
    const description = Object.fromEntries(locales.map((l) => [l, tool[l]!.description]))
    return locales.length ? [{ slug, name, description, locales }] : []
  })
  const docs = {} as ContentIndex['docs']
  for (const collection of ['guides', 'legal', 'about'] as const) {
    docs[collection] = {} as ContentIndex['docs']['guides']
    for (const l of LOCALES) {
      docs[collection][l] = slugs(`content/${collection}/${l}`, '.mdx')
        .map((slug) => {
          const { fm } = readDoc(collection, l, slug)
          return { slug, title: fm.title, description: fm.description, published: fm.published, updated: fm.updated }
        })
        .sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug))
    }
  }
  const pages = Object.fromEntries(sitePages().map((p) => [p.path, { locales: pageLocales(p), noindex: pageLocales(p).filter((l) => p.noindex?.[l]) }]))
  return { tools, docs, pages }
}
