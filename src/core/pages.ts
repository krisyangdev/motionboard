// The page list of the site: the one source for the sitemap, llms.txt, redirects and the video sitemap.
// Runs inside vite.config.ts and scripts/ at build time, so it is Node-only and imports no React.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE } from '../../site.config.ts'
import { DEFAULT_LOCALE, LOCALES, localizePath, missingCoreMessages, stripLocale, type Locale } from './i18n.ts'
import type { CoreMessages } from './messages/en.ts'
import type { ZodType } from 'zod'
import {
  aboutSchema,
  alternativesFileSchema,
  changelogFileSchema,
  compareSchema,
  galleryFileSchema,
  glossarySchema,
  guideSchema,
  hubFileSchema,
  legalSchema,
  parseContent,
  slugSchema,
  toolFileSchema,
  useCaseFileSchema,
  type AboutFrontmatter,
  type AlternativesFile,
  type AlternativesText,
  type ChangelogFile,
  type CompareFrontmatter,
  type GalleryFile,
  type GalleryText,
  type GlossaryFrontmatter,
  type GuideFrontmatter,
  type HubFile,
  type ItemFile,
  type LegalFrontmatter,
  type ToolFile,
  type UseCaseFile,
  type UseCaseText,
} from './content/schema.ts'
import { readItems, validateCollections, type Collection as ItemCollection } from './content/collections.ts'
import { pageH1 } from './content/h1.ts'
import { categoryHubId, CHANGELOG_PAGE_SIZE, CHANGELOG_PATH, HUB_PAGE_SIZE, hubPageCount, hubPagePath, itemPath, typedPath } from './content/hubs.ts'
import { selectRelated } from './content/related.ts'
import {
  aboutVerdict,
  alternativesText,
  alternativesVerdict,
  changelogVerdict,
  compareText,
  compareVerdict,
  DEFAULT_HUB_MIN_MEMBERS,
  duplicateReason,
  galleryText,
  galleryVerdict,
  glossaryText,
  glossaryVerdict,
  guideVerdict,
  hubVerdict,
  itemText,
  itemVerdict,
  legalVerdict,
  MIN,
  nearDuplicates,
  noindexShareError,
  relatedReason,
  toolVerdict,
  useCaseText,
  useCaseVerdict,
  USE_CASE_NEAR_DUPLICATE_JACCARD,
  type Verdict,
} from './seo/quality.ts'
import type { Crumb } from './seo.ts'
import { collections } from '../site/collections.ts'
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
  /** Collection id of an item page. */
  collection?: string
  /** Kind of the main media of an item page: it decides the JSON-LD (ImageObject or VideoObject). */
  media?: 'image' | 'video'
  /** Comparison and alternatives pages with one of our products next to third-party ones: the page carries the disclosure line (`data-disclosure`). */
  ours?: boolean
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

/** Folders of MDX pages in content/: content/<collection>/<lang>/<slug>.mdx. */
type Collection = 'guides' | 'legal' | 'about' | 'compare' | 'glossary'
const docSchemas = { guides: guideSchema, legal: legalSchema, about: aboutSchema, compare: compareSchema, glossary: glossarySchema }
type DocOf = { guides: GuideFrontmatter; legal: LegalFrontmatter; about: AboutFrontmatter; compare: CompareFrontmatter; glossary: GlossaryFrontmatter }

/** Validated frontmatter and the MDX body of content/<collection>/<lang>/<slug>.mdx. */
function readDoc<C extends Collection>(collection: C, l: Locale, slug: string): { fm: DocOf[C]; body: string } {
  const file = `content/${collection}/${l}/${slug}.mdx`
  parseContent(slugSchema, slug, file)
  const { data, body } = splitDoc(abs(file))
  return { fm: parseContent(docSchemas[collection], data, file) as DocOf[C], body }
}
const docExists = (collection: Collection, l: Locale, slug: string) => existsSync(abs('content', collection, l, `${slug}.mdx`))

/** Every MDX page of a collection by slug, with the languages that have it. */
function readDocs<C extends Collection>(collection: C) {
  const names = [...new Set(LOCALES.flatMap((l) => slugs(`content/${collection}/${l}`, '.mdx')))].sort()
  return new Map(names.map((slug) => [slug, perLocale((l) => (docExists(collection, l, slug) ? readDoc(collection, l, slug) : undefined))] as const))
}

const readJsonFile = (file: string): unknown => {
  try {
    return JSON.parse(readFileSync(abs(file), 'utf8'))
  } catch (e) {
    throw new Error(`${file}: invalid JSON: ${(e as Error).message}`)
  }
}

/** Every file of content/<dir>/*.json, validated, by slug (alternatives, use cases, galleries). */
function readJsonDir<T extends { slug: string }>(dir: string, schema: ZodType): Map<string, T> {
  return new Map(
    slugs(`content/${dir}`, '.json').map((slug) => {
      const file = `content/${dir}/${slug}.json`
      const page = parseContent(schema, readJsonFile(file), file) as T
      if (page.slug !== slug) throw new Error(`${file}: slug "${page.slug}" must equal the file name "${slug}"`)
      return [slug, page] as const
    }),
  )
}

/** content/changelog/changelog.json, or undefined when the site has no changelog. */
function readChangelogFile(): ChangelogFile | undefined {
  const file = 'content/changelog/changelog.json'
  return existsSync(abs(file)) ? (parseContent(changelogFileSchema(LOCALES), readJsonFile(file), file) as ChangelogFile) : undefined
}

/** Every hub file, validated, by hub id: content/hubs/<id>.json (tools, guides, a collection) and content/hubs/<collection>/<category>.json. */
function readHubs(validIds: readonly string[]): Map<string, HubFile> {
  const schema = hubFileSchema(LOCALES)
  const ids = [...slugs('content/hubs', '.json'), ...collections.flatMap((c) => slugs(`content/hubs/${c.id}`, '.json').map((name) => categoryHubId(c.id, name)))]
  return new Map(
    ids.map((id) => {
      const file = `content/hubs/${id}.json`
      let data: unknown
      try {
        data = JSON.parse(readFileSync(abs(file), 'utf8'))
      } catch (e) {
        throw new Error(`${file}: invalid JSON: ${(e as Error).message}`)
      }
      if (!validIds.includes(id)) throw new Error(`${file}: "${id}" is not a hub of this site; the hubs are ${validIds.join(', ')} (collections and categories are declared in src/site/collections.ts)`)
      return [id, parseContent(schema, data, file) as HubFile] as const
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

/** Titles and descriptions are unique per language: a repeated one is a duplicate page for the search engine. */
function assertUniqueTexts(pages: SitePage[]) {
  for (const field of ['title', 'description'] as const) {
    for (const l of LOCALES) {
      const seen = new Map<string, string>()
      for (const p of pages) {
        const t = p[field][l]?.trim().toLowerCase()
        if (!t) continue
        const other = seen.get(t)
        if (other) throw new Error(`${field} "${p[field][l]}" (${l}) is used by both ${other} and ${p.path}; write a ${field} for each page`)
        seen.set(t, p.path)
      }
    }
  }
}

type SeoKnobs = { seo?: { hubMinMembers?: number; maxNoindexShare?: number } }
/** Indexable members a hub needs: `seo.hubMinMembers` for every hub when the site sets it, else 6 (the glossary index 8). */
const hubMinFor = (hubId: string): number => (SITE as SeoKnobs).seo?.hubMinMembers ?? (hubId === 'glossary' ? MIN.hub.glossary : DEFAULT_HUB_MIN_MEMBERS)
/** `seo.maxNoindexShare` of site.config.ts, else 0.2: the share of a collection's items that may be noindex before the build fails. */
const maxNoindexShare = (): number => (SITE as SeoKnobs).seo?.maxNoindexShare ?? 0.2

/**
 * A page of a paginated hub (/guides/page/2/): prerendered, self-canonical, never in the sitemap. It is noindex
 * only where the hub itself is. `locales` are the languages that have that page (their member count needs it).
 */
export type PagedHub = { path: string; hub: string; n: number; locales: Locale[]; noindex: Locale[] }

/** An item of a collection with the quality verdict and the related items it has in each language it exists in. */
export type BuiltItem = {
  slug: string
  file: ItemFile
  /** Languages the item exists in. */
  locales: Locale[]
  /** Languages it is noindex in, with the reasons (the gates of src/core/seo/quality.ts). */
  noindex: Partial<Record<Locale, string[]>>
  /** Slugs of the 3 to 8 related items shown on the page, per language. */
  related: Partial<Record<Locale, string[]>>
}
export type BuiltCollection = { collection: ItemCollection; items: BuiltItem[] }

/**
 * Reads and gates the items of a collection. Per language: the gates that look at one item (text, media or data),
 * then near-duplicates (the later of two similar items fails, the earlier keeps its place), then related items, which
 * come from the items that passed the first two.
 */
function buildCollection(c: ItemCollection): BuiltCollection {
  const files = readItems(c, LOCALES, ROOT)
  for (const [slug, f] of files) {
    for (const r of f.related ?? []) if (!files.has(r)) throw new Error(`content/collections/${c.id}/${slug}.json: related "${r}" is not an item of "${c.id}"`)
  }
  const items: BuiltItem[] = [...files].map(([slug, file]) => ({ slug, file, locales: LOCALES.filter((l) => file[l]), noindex: {}, related: {} }))
  const forRelated = (i: BuiltItem) => ({ slug: i.slug, category: i.file.category, tags: i.file.tags ?? [] })
  for (const l of LOCALES) {
    const here = items.filter((i) => i.file[l])
    const facts = new Map(here.map((i) => [i.slug, { dataText: c.dataText?.(i.file.data) ?? '', hasMedia: !!i.file.media, dataEntries: c.dataEntries?.(i.file.data) ?? 0 }]))
    const reasons = new Map(here.map((i) => [i.slug, itemVerdict(i.file[l]!, facts.get(i.slug)!).reasons]))
    const oldestFirst = [...here].sort((a, b) => a.file.published.localeCompare(b.file.published) || a.slug.localeCompare(b.slug))
    const duplicates = nearDuplicates(oldestFirst.map((i) => ({ id: itemPath(c.id, i.slug), text: itemText(i.file[l]!, facts.get(i.slug)!.dataText) })))
    for (const i of here) {
      const d = duplicates.get(itemPath(c.id, i.slug))
      if (d) reasons.get(i.slug)!.push(duplicateReason(d))
    }
    const pool = here.filter((i) => reasons.get(i.slug)!.length === 0).map(forRelated)
    for (const i of here) {
      const related = selectRelated({ ...forRelated(i), related: i.file.related }, pool)
      i.related[l] = related
      const all = [...reasons.get(i.slug)!, relatedReason(related.length)].filter((r): r is string => !!r)
      if (all.length) i.noindex[l] = all
    }
  }
  return { collection: c, items }
}

type Gated<T> = Map<string, Partial<Record<Locale, T>>>

/**
 * The gates of a group of hand-written pages (compare, alternatives, glossary, use case, gallery), per language: the
 * verdict of each page, then near-duplicates across the pages of the group (the later `published` fails, the earlier
 * keeps its place). Returns the noindex reasons per page and language; a page with none is absent from its record.
 */
export function gateGroup<T>(
  group: Gated<T>,
  path: (slug: string) => string,
  check: { verdict: (t: T) => Verdict; text: (t: T) => string; published: (slug: string, l: Locale) => string; threshold?: number },
): Map<string, Partial<Record<Locale, string[]>>> {
  const threshold = check.threshold
  const out = new Map<string, Partial<Record<Locale, string[]>>>([...group.keys()].map((slug) => [slug, {}]))
  for (const l of LOCALES) {
    const here = [...group].flatMap(([slug, v]) => (v[l] ? [{ slug, t: v[l] as T }] : []))
    const reasons = new Map(here.map(({ slug, t }) => [slug, [...check.verdict(t).reasons]]))
    const oldestFirst = [...here].sort((a, b) => check.published(a.slug, l).localeCompare(check.published(b.slug, l)) || a.slug.localeCompare(b.slug))
    const duplicates = nearDuplicates(oldestFirst.map(({ slug, t }) => ({ id: path(slug), text: check.text(t) })), threshold)
    for (const { slug } of here) {
      const d = duplicates.get(path(slug))
      if (d) reasons.get(slug)!.push(duplicateReason(d, threshold))
      if (reasons.get(slug)!.length) out.get(slug)![l] = reasons.get(slug)!
    }
  }
  return out
}

type Built = {
  pages: SitePage[]
  paged: PagedHub[]
  collections: BuiltCollection[]
  /** Breadcrumb name of each collection and category hub, per language it exists in. */
  hubNames: Record<string, Partial<Record<Locale, string>>>
  /** Build errors for collections with too many noindex items (see noindexShareError). */
  shareErrors: string[]
}

function build(): Built {
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
  const compares = readDocs('compare')
  const glossaries = readDocs('glossary')
  const alternatives = readJsonDir<AlternativesFile>('alternatives', alternativesFileSchema(LOCALES))
  const useCases = readJsonDir<UseCaseFile>('use-cases', useCaseFileSchema(LOCALES))
  const galleries = readJsonDir<GalleryFile>('gallery', galleryFileSchema(LOCALES))
  const changelog = readChangelogFile()
  validateCollections(collections)
  const built = collections.map(buildCollection)
  const hubIds = ['tools', 'guides', 'compare', 'glossary', ...collections.flatMap((c) => [c.id, ...c.categories.map((cat) => categoryHubId(c.id, cat))])]
  const hubs = readHubs(hubIds)

  // Members of each hub per language: all that exist, and the ones the quality gate lets into the index.
  const toolGate = new Map([...tools].map(([slug, t]) => [slug, noindexOf(toolLocales(t), (l) => toolVerdict(t[l]!))]))
  const compareGate = gateGroup(compares, (s) => typedPath('compare', s), {
    verdict: (d) => compareVerdict(d.fm, d.body),
    text: (d) => compareText(d.fm, d.body),
    published: (s, l) => compares.get(s)![l]!.fm.published,
  })
  const glossaryGate = gateGroup(glossaries, (s) => typedPath('glossary', s), {
    verdict: (d) => glossaryVerdict(d.fm, d.body),
    text: (d) => glossaryText(d.fm, d.body),
    published: (s, l) => glossaries.get(s)![l]!.fm.published,
  })
  const perFile = <T,>(files: Map<string, { slug: string } & Partial<Record<Locale, T>>>): Gated<T> => new Map([...files].map(([slug, f]) => [slug, perLocale((l) => f[l])]))
  const alternativesGate = gateGroup(perFile<AlternativesText>(alternatives), (s) => typedPath('alternatives', s), {
    verdict: alternativesVerdict,
    text: alternativesText,
    published: (s) => alternatives.get(s)!.published,
  })
  const useCaseGate = gateGroup(perFile<UseCaseText>(useCases), (s) => typedPath('use-case', s), {
    verdict: useCaseVerdict,
    text: useCaseText,
    published: (s) => useCases.get(s)!.published,
    threshold: USE_CASE_NEAR_DUPLICATE_JACCARD,
  })
  const galleryGate = gateGroup(perFile<GalleryText>(galleries), (s) => typedPath('gallery', s), {
    verdict: galleryVerdict,
    text: galleryText,
    published: (s) => galleries.get(s)!.published,
  })
  const guideGate = new Map([...guides].map(([slug, g]) => [slug, noindexOf(LOCALES.filter((l) => g[l]), (l) => guideVerdict(g[l]!.fm, g[l]!.body))]))
  // The items of a collection hub, or of a category hub (`<collection>/<category>`).
  const hubItems = (hubId: string, l: Locale) => {
    const [id, category] = hubId.split('/')
    return (built.find((b) => b.collection.id === id)?.items ?? []).filter((i) => i.file[l] && (!category || i.file.category.includes(category)))
  }
  const members = (hubId: string, l: Locale) => {
    if (hubId === 'tools') return { all: [...tools].filter(([, t]) => t[l]?.title).length, indexable: [...tools].filter(([slug, t]) => t[l]?.title && !toolGate.get(slug)![l]).length }
    if (hubId === 'guides') return { all: [...guides].filter(([, g]) => g[l]).length, indexable: [...guides].filter(([slug, g]) => g[l] && !guideGate.get(slug)![l]).length }
    if (hubId === 'compare') return { all: [...compares].filter(([, c]) => c[l]).length, indexable: [...compares].filter(([slug, c]) => c[l] && !compareGate.get(slug)![l]).length }
    if (hubId === 'glossary') return { all: [...glossaries].filter(([, g]) => g[l]).length, indexable: [...glossaries].filter(([slug, g]) => g[l] && !glossaryGate.get(slug)![l]).length }
    const items = hubItems(hubId, l)
    return { all: items.length, indexable: items.filter((i) => !i.noindex[l]).length }
  }
  const hubLocales = (hubId: string) => LOCALES.filter((l) => hubs.get(hubId)?.[l]?.title && members(hubId, l).all > 0)
  const hubName = (hubId: string, l: Locale): string => {
    if (hubId === 'tools' || hubId === 'guides' || hubId === 'compare' || hubId === 'glossary') return messages[l].page[hubId]
    const text = hubs.get(hubId)![l]!
    return text.name ?? pageH1(text)
  }
  // The breadcrumb level of a hub exists only in the languages that have the hub.
  const hubCrumb = (hubId: string, l: Locale): Crumb[] => (hubLocales(hubId).includes(l) ? [{ name: hubName(hubId, l), path: `/${hubId}/` }] : [])
  // A category hub sits under its collection hub.
  const hubTrail = (hubId: string, l: Locale): Crumb[] => (hubId.includes('/') ? [...hubCrumb(hubId.split('/')[0], l), ...hubCrumb(hubId, l)] : hubCrumb(hubId, l))
  const hubMemberDates = (hubId: string): (string | undefined)[] => {
    if (hubId === 'tools') return [...tools.values()].map((t) => t.updated)
    if (hubId === 'guides') return [...guides.values()].flatMap((g) => LOCALES.map((l) => g[l]?.fm.updated))
    if (hubId === 'compare') return [...compares.values()].flatMap((c) => LOCALES.map((l) => c[l]?.fm.updated))
    if (hubId === 'glossary') return [...glossaries.values()].flatMap((g) => LOCALES.map((l) => g[l]?.fm.updated))
    return LOCALES.flatMap((l) => hubItems(hubId, l).map((i) => i.file.updated))
  }

  const paged = new Map<string, PagedHub>()
  for (const [hubId, hub] of hubs) {
    const hubPath = `/${hubId}/`
    const locales = hubLocales(hubId)
    if (!locales.length) continue
    const text = (l: Locale) => hub[l]!
    const noindex = noindexOf(locales, (l) => hubVerdict(text(l), members(hubId, l).indexable, hubMinFor(hubId)))
    pages.push({
      path: hubPath,
      type: 'hub',
      title: perLocale((l) => (locales.includes(l) ? text(l).title : undefined)),
      description: perLocale((l) => (locales.includes(l) ? text(l).description : undefined)),
      keyword: perLocale((l) => (locales.includes(l) ? text(l).keyword : undefined)),
      lastmod: newest([hub.updated, ...hubMemberDates(hubId)]),
      breadcrumb: crumbs(locales, (l) => trail(l, ...hubTrail(hubId, l))),
      noindex,
    })
    const size = hub.pageSize ?? HUB_PAGE_SIZE
    for (const l of locales) {
      for (let n = 2; n <= hubPageCount(members(hubId, l).indexable, size); n++) {
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

  for (const [slug, c] of compares) {
    const path = typedPath('compare', slug)
    if (!slug.includes('-vs-')) throw new Error(`content/compare/<lang>/${slug}.mdx: the slug must be <a>-vs-<b> (the page is /compare/<a>-vs-<b>/)`)
    pages.push({
      path,
      type: 'compare',
      title: perLocale((l) => c[l]?.fm.title),
      description: perLocale((l) => c[l]?.fm.description),
      keyword: perLocale((l) => c[l]?.fm.keyword),
      lastmod: newest(LOCALES.map((l) => c[l]?.fm.updated)),
      ours: LOCALES.some((l) => (c[l]?.fm.products ?? []).some((p) => p.relation === 'ours') && (c[l]?.fm.products ?? []).some((p) => p.relation === 'third-party')),
      breadcrumb: crumbs(LOCALES.filter((l) => c[l]), (l) => trail(l, ...hubCrumb('compare', l), { name: pageH1(c[l]!.fm), path })),
      noindex: compareGate.get(slug),
    })
  }

  for (const [slug, a] of alternatives) {
    const path = typedPath('alternatives', slug)
    const here = LOCALES.filter((l) => a[l])
    pages.push({
      path,
      type: 'alternatives',
      title: perLocale((l) => a[l]?.title),
      description: perLocale((l) => a[l]?.description),
      keyword: perLocale((l) => a[l]?.keyword),
      lastmod: a.updated,
      ours: here.some((l) => a[l]!.entries.some((e) => e.relation === 'ours') && a[l]!.entries.some((e) => e.relation === 'third-party')),
      breadcrumb: crumbs(here, (l) => trail(l, { name: pageH1(a[l]!), path })),
      noindex: alternativesGate.get(slug),
    })
  }

  for (const [slug, g] of glossaries) {
    const path = typedPath('glossary', slug)
    pages.push({
      path,
      type: 'glossary',
      title: perLocale((l) => g[l]?.fm.title),
      description: perLocale((l) => g[l]?.fm.description),
      keyword: perLocale((l) => g[l]?.fm.keyword),
      lastmod: newest(LOCALES.map((l) => g[l]?.fm.updated)),
      breadcrumb: crumbs(LOCALES.filter((l) => g[l]), (l) => trail(l, ...hubCrumb('glossary', l), { name: pageH1(g[l]!.fm), path })),
      noindex: glossaryGate.get(slug),
    })
  }

  for (const [slug, u] of useCases) {
    const path = typedPath('use-case', slug)
    const here = LOCALES.filter((l) => u[l])
    pages.push({
      path,
      type: 'use-case',
      title: perLocale((l) => u[l]?.title),
      description: perLocale((l) => u[l]?.description),
      keyword: perLocale((l) => u[l]?.keyword),
      lastmod: u.updated,
      breadcrumb: crumbs(here, (l) => trail(l, { name: pageH1(u[l]!), path })),
      noindex: useCaseGate.get(slug),
    })
  }

  for (const [slug, g] of galleries) {
    const path = typedPath('gallery', slug)
    const here = LOCALES.filter((l) => g[l])
    pages.push({
      path,
      type: 'gallery',
      title: perLocale((l) => g[l]?.title),
      description: perLocale((l) => g[l]?.description),
      keyword: perLocale((l) => g[l]?.keyword),
      lastmod: g.updated,
      breadcrumb: crumbs(here, (l) => trail(l, { name: pageH1(g[l]!), path })),
      noindex: galleryGate.get(slug),
    })
  }

  // The changelog is one page; entries beyond CHANGELOG_PAGE_SIZE continue at /changelog/page/<n>/ (like a hub's pages).
  if (changelog) {
    const here = LOCALES.filter((l) => changelog[l])
    const noindex = noindexOf(here, (l) => changelogVerdict(changelog[l]!))
    pages.push({
      path: CHANGELOG_PATH,
      type: 'changelog',
      title: perLocale((l) => changelog[l]?.title),
      description: perLocale((l) => changelog[l]?.description),
      keyword: perLocale((l) => changelog[l]?.keyword),
      lastmod: changelog.updated,
      breadcrumb: crumbs(here, (l) => trail(l, { name: pageH1(changelog[l]!), path: CHANGELOG_PATH })),
      noindex,
    })
    for (const l of here) {
      for (let n = 2; n <= hubPageCount(changelog[l]!.entries.length, CHANGELOG_PAGE_SIZE); n++) {
        const path = hubPagePath(CHANGELOG_PATH, n)
        const entry = paged.get(path) ?? { path, hub: CHANGELOG_PATH, n, locales: [], noindex: [] }
        entry.locales.push(l)
        if (noindex[l]) entry.noindex.push(l)
        paged.set(path, entry)
      }
    }
  }

  for (const { collection: c, items } of built) {
    for (const item of items) {
      const path = itemPath(c.id, item.slug)
      const f = item.file
      pages.push({
        path,
        type: 'item',
        collection: c.id,
        media: f.media?.kind,
        title: perLocale((l) => f[l]?.title),
        description: perLocale((l) => f[l]?.description),
        keyword: perLocale((l) => f[l]?.keyword),
        lastmod: f.updated,
        // Home, collection, primary category, the item; a level exists only in the languages that have that hub.
        breadcrumb: crumbs(item.locales, (l) => trail(l, ...hubCrumb(c.id, l), ...hubCrumb(categoryHubId(c.id, f.category[0]), l), { name: f[l]!.name, path })),
        noindex: Object.keys(item.noindex).length ? item.noindex : undefined,
      })
    }
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
  assertUniqueTexts(all)

  // The build fails when too many items of a collection are noindex: fix the data instead of shipping thousands of noindex URLs.
  const shareErrors = built.flatMap(({ collection: c, items }) =>
    LOCALES.flatMap((l) => {
      const here = items.filter((i) => i.file[l])
      const noindex = here.filter((i) => i.noindex[l]).map((i) => ({ path: itemPath(c.id, i.slug), reasons: i.noindex[l]! }))
      const error = noindexShareError(c.id, l, noindex, here.length, maxNoindexShare())
      return error ? [error] : []
    }),
  )
  const hubNames = Object.fromEntries(
    [...hubs.keys()].filter((id) => id.includes('/') || built.some((b) => b.collection.id === id)).map((id) => [id, Object.fromEntries(hubLocales(id).map((l) => [l, hubName(id, l)]))]),
  )
  return { pages: all, paged: [...paged.values()].sort((a, b) => a.hub.localeCompare(b.hub) || a.n - b.n), collections: built, hubNames, shareErrors }
}

/**
 * Every page of the site with its quality verdict per language (see SitePage). Throws when a collection has too many
 * noindex items (`seo.maxNoindexShare`); `skipShareCheck` returns the pages anyway (seo-report prints the error itself).
 */
export const sitePages = (opts: { skipShareCheck?: boolean } = {}): SitePage[] => {
  const b = build()
  if (b.shareErrors.length && !opts.skipShareCheck) throw new Error(b.shareErrors.join('\n\n'))
  return b.pages
}

/** The build errors of collections whose noindex share is above `seo.maxNoindexShare`, empty when all are within it. */
export const noindexShareErrors = (): string[] => build().shareErrors

/** Pages 2 and up of the paginated hubs; they are prerendered but not site pages (no sitemap, llms.txt or hreflang entry of their own). */
export const hubPagination = (): PagedHub[] => build().paged

/** content/renamed.json: default-language `{ "/old/": "/new/" }` pairs. */
export const readRenamed = (): Record<string, string> => readJson('content/renamed.json', {})

/** content/videos.json, the items whose main media is a video (uploadDate = the item's `published`), and the site's own list (`extraVideos` in src/site/pages.ts): videos for the video sitemap. */
export const readVideos = (): Video[] => [
  ...readJson<Video[]>('content/videos.json', []),
  ...build().collections.flatMap(({ collection: c, items }) =>
    items.flatMap((i) => {
      const m = i.file.media
      if (m?.kind !== 'video') return []
      return [{ path: itemPath(c.id, i.slug), title: perLocale((l) => i.file[l]?.name), description: perLocale((l) => i.file[l]?.lede), thumbnail: m.poster, content: m.src, duration: m.duration, uploadDate: i.file.published }]
    }),
  ),
  ...extraVideos,
]

/** An entry of the changelog for the feeds: `id` is the anchor on the page, `page` the page it is on. */
export type ChangelogFeedEntry = { id: string; date: string; title: string; items: string[]; page: number }

/** The entries of the changelog in the default language, newest first; none when the site has no changelog. */
export const changelogEntries = (): ChangelogFeedEntry[] =>
  (readChangelogFile()?.[DEFAULT_LOCALE]?.entries ?? []).map((e, i) => ({ id: `${e.date}-${e.slug}`, date: e.date, title: e.title, items: e.items, page: Math.floor(i / CHANGELOG_PAGE_SIZE) + 1 }))

export type DocIndexEntry = { slug: string; title: string; description: string; published: string; updated: string }

/** A collection item in its collection module: what cards, related lists and the item's own head need. */
export type ItemIndexEntry = {
  slug: string
  /** `name`, `description` and `related` cover only the languages the item exists in. */
  name: Partial<Record<Locale, string>>
  description: Partial<Record<Locale, string>>
  locales: Locale[]
  /** Languages the item exists in but is kept out of the index (noindex). */
  noindex: Locale[]
  category: string[]
  /** Slugs of the related items shown on the page, per language. */
  related: Partial<Record<Locale, string[]>>
}

/**
 * The part of the content registry every page loads (`virtual:content-index`): which pages exist and are indexable,
 * hub names and categories. It has no descriptions and no collection items, so it stays small however many items a
 * site has. Lists with descriptions load per page from `virtual:content-lists` and `virtual:content-collection/<id>`.
 */
export type ContentIndex = {
  /** Every site page except collection items, by default-language path: the languages it exists in and the ones kept out of the index (noindex). */
  pages: Record<string, { locales: Locale[]; noindex: Locale[] }>
  /** Breadcrumb name of each collection and category hub (hub id `<collection>` or `<collection>/<category>`), per language it exists in. */
  hubs: Record<string, Partial<Record<Locale, string>>>
  /** Category slugs by collection id. */
  categories: Record<string, string[]>
}

/** Tools and docs with their descriptions (`virtual:content-lists`), loaded by the pages that list them. */
export type ContentLists = {
  /** `name` and `description` cover only the languages the tool has text in. */
  tools: { slug: string; name: Partial<Record<Locale, string>>; description: Partial<Record<Locale, string>> }[]
  docs: Record<Collection, Record<Locale, DocIndexEntry[]>>
}

const pageState = (p: SitePage) => ({ locales: pageLocales(p), noindex: pageLocales(p).filter((l) => p.noindex?.[l]) })

export function contentIndex(): ContentIndex {
  const b = build()
  const pages = Object.fromEntries(b.pages.filter((p) => p.type !== 'item').map((p) => [p.path, pageState(p)]))
  const categories = Object.fromEntries(b.collections.map(({ collection: c }) => [c.id, [...c.categories]]))
  return { pages, hubs: b.hubNames, categories }
}

export function contentLists(): ContentLists {
  const tools = [...readTools()].flatMap(([slug, tool]) => {
    const locales = LOCALES.filter((l) => tool[l]?.title)
    const name = Object.fromEntries(locales.map((l) => [l, tool.name?.[l] || tool[l]!.title]))
    const description = Object.fromEntries(locales.map((l) => [l, tool[l]!.description]))
    return locales.length ? [{ slug, name, description }] : []
  })
  const docs = {} as ContentLists['docs']
  for (const collection of ['guides', 'legal', 'about', 'compare', 'glossary'] as const) {
    docs[collection] = {} as ContentLists['docs']['guides']
    for (const l of LOCALES) {
      docs[collection][l] = slugs(`content/${collection}/${l}`, '.mdx')
        .map((slug) => {
          const { fm } = readDoc(collection, l, slug)
          return { slug, title: fm.title, description: fm.description, published: fm.published, updated: fm.updated }
        })
        .sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug))
    }
  }
  return { tools, docs }
}

/** Collection ids that have items. */
export const collectionIds = (): string[] => build().collections.map(({ collection: c }) => c.id)

/** The items of one collection (`virtual:content-collection/<id>`), loaded by its item and hub pages. */
export function collectionItems(id: string): ItemIndexEntry[] {
  const b = build()
  const items = b.collections.find(({ collection: c }) => c.id === id)?.items ?? []
  const pages = new Map(b.pages.filter((p) => p.type === 'item').map((p) => [p.path, p]))
  return items.map((i) => {
    const page = pages.get(itemPath(id, i.slug))
    return {
      slug: i.slug,
      name: perLocale((l) => i.file[l]?.name),
      description: perLocale((l) => i.file[l]?.description),
      locales: i.locales,
      noindex: page ? pageState(page).noindex : [],
      category: i.file.category,
      related: i.related,
    }
  })
}
