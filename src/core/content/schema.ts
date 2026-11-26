// The content contract of every page type: zod schemas for the fields all pages share and for the
// tool, guide and legal files used today. Node only (pages.ts validates every content file with these
// at build time and throws an error naming the file and field), and the types below are what the app
// imports. Nothing in the app imports the schemas themselves, so zod stays out of the browser bundles.
import { z } from 'zod'
import type { Locale } from '../i18n.ts'
import { HUB_PAGE_SIZE } from './hubs.ts'

export const dateSchema = z
  .string()
  .refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), 'must be a date written YYYY-MM-DD')

/** ASCII kebab-case, the same in every language. */
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be ASCII kebab-case: lowercase letters, digits and single hyphens')

export const DEMAND_SOURCES = ['gsc', 'bing', 'autocomplete', 'dataforseo', 'serp-check', 'brand', 'none'] as const

/** Where the demand for a page's keyword was checked. `none` is for hub, about, legal and changelog pages only. */
export const demandSchema = z.strictObject({
  source: z.enum(DEMAND_SOURCES),
  note: z.string().min(1, 'say what was checked and what it showed'),
  checked: dateSchema,
})

export const faqSchema = z.array(z.tuple([z.string().min(1), z.string().min(1)]))

// Length rules count UTF-16 units, like scripts/test.mjs. A text with any CJK character uses the CJK limits.
const CJK = /[぀-ヿ㐀-鿿]/
export const isCjk = (s: string) => CJK.test(s)
/**
 * Display width: CJK characters and full-width punctuation count 2, everything else 1. Search results cut
 * titles by pixel width, so a mixed title like "Claude 能做视频吗？" is measured by width, not characters.
 */
const WIDE = /[\u1100-\u115f\u2e80-\u303f\u3040-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/
export const textWidth = (s: string) => [...s].reduce((w, c) => w + (WIDE.test(c) ? 2 : 1), 0)
/** Title width limit without the brand (see textWidth). */
export const TITLE_MAX_WIDTH = 60
/** Meta description length range. */
export const descriptionRange = (description: string): [min: number, max: number] => (isCjk(description) ? [50, 90] : [120, 160])

type Ctx = z.core.$RefinementCtx
const issue = (ctx: Ctx, path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message })

function checkText(t: { title: string; description: string; keyword?: string; h1?: string }, ctx: Ctx) {
  const width = textWidth(t.title)
  if (width > TITLE_MAX_WIDTH) issue(ctx, ['title'], `width ${width}, at most ${TITLE_MAX_WIDTH} (CJK counts 2; without the site name)`)
  const [min, top] = descriptionRange(t.description)
  if (t.description.length < min || t.description.length > top) issue(ctx, ['description'], `${t.description.length} characters, want ${min} to ${top}`)
  if (t.keyword) {
    const k = t.keyword.toLowerCase()
    if (!t.title.toLowerCase().includes(k)) issue(ctx, ['title'], `must contain the keyword "${t.keyword}"`)
    if (t.h1 && !t.h1.toLowerCase().includes(k)) issue(ctx, ['h1'], `must contain the keyword "${t.keyword}"`)
  }
}

function checkDemand(t: { demand: { source: string } }, ctx: Ctx) {
  if (t.demand.source === 'none') issue(ctx, ['demand', 'source'], '"none" is allowed only for hub, about, legal and changelog pages; record where the demand for this keyword was checked')
}

function checkDates(t: { published: string; updated: string }, ctx: Ctx) {
  if (t.updated < t.published) issue(ctx, ['updated'], `${t.updated} is before published (${t.published})`)
}

/** The fields of one language of an indexable page. */
const textFields = {
  /** The searched term this page targets. Unique per language across the site. */
  keyword: z.string().min(1),
  demand: demandSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  h1: z.string().min(1).optional(),
  /** One or two answer-first sentences. */
  lede: z.string().min(1),
  faq: faqSchema.optional(),
}

/** The fields that do not change with the language. */
const sharedFields = {
  published: dateSchema,
  updated: dateSchema,
  /** Author id (content/authors/<id>.json, added with the about and authors pages). */
  author: slugSchema.optional(),
  /** Open Graph image: absolute URL or a path on this site. */
  ogImage: z.string().min(1).optional(),
  related: z.array(slugSchema).optional(),
}

// Tool pages: content/tools/<slug>.json, shared fields at the top, one text block per language.

/** One before/after pair (or a fact) of a tool page, with a caption. */
export const exampleSchema = z.strictObject({ input: z.string().min(1), output: z.string().min(1), caption: z.string().min(1) })
/** A prose block under its own H2. */
export const sectionSchema = z.strictObject({ h2: z.string().min(1), body: z.string().min(1) })

export const toolTextSchema = z
  .strictObject({
    ...textFields,
    steps: z.array(z.strictObject({ title: z.string().min(1), body: z.string().min(1) })).optional(),
    examples: z.array(exampleSchema).optional(),
    /** What the tool cannot do, file size and format limits, privacy. Stated truthfully. */
    limits: z.string().min(1).optional(),
    /** One to three prose blocks: use cases, when to use which option. */
    sections: z.array(sectionSchema).max(3).optional(),
  })
  .superRefine((t, ctx) => {
    checkText(t, ctx)
    checkDemand(t, ctx)
  })

const toolShape = {
  slug: slugSchema,
  /** Id of a widget in src/site/tools/index.ts. A page without a working tool is a guide. */
  tool: z.string().min(1),
  /** Short name used in breadcrumbs and lists, per language; defaults to the title. */
  name: z.record(z.string(), z.string().min(1)).optional(),
  ...sharedFields,
}

/** Schema of a tool file for these languages. A language block is optional: no block, no page in that language. */
export const toolFileSchema = (locales: readonly string[]) =>
  z.object({ ...toolShape, ...Object.fromEntries(locales.map((l) => [l, toolTextSchema.optional()])) }).superRefine(checkDates)

export type ToolText = z.infer<typeof toolTextSchema>
export type ToolFile = z.infer<z.ZodObject<typeof toolShape>> & Partial<Record<Locale, ToolText>>

// Guides: content/guides/<lang>/<slug>.mdx. Frontmatter values are single-line YAML; nested values (demand, sources, faq) are written as JSON.

export const guideSchema = z
  .strictObject({
    ...textFields,
    ...sharedFields,
    kind: z.enum(['guide', 'tutorial']),
    /** Third-party sources of the facts the guide states. */
    sources: z.array(z.strictObject({ label: z.string().min(1), url: z.url(), checked: dateSchema })).optional(),
  })
  .superRefine((fm, ctx) => {
    checkText(fm, ctx)
    checkDemand(fm, ctx)
    checkDates(fm, ctx)
  })

// Legal pages: content/legal/<lang>/<slug>.mdx. They target no keyword.

export const legalSchema = z
  .strictObject({
    title: z.string().min(1),
    description: z.string().min(1),
    published: dateSchema,
    updated: dateSchema,
    /** Keeps the page out of the sitemap and search results (the only way a legal page is noindex besides being empty). */
    noindex: z.boolean().optional(),
  })
  .superRefine((fm, ctx) => {
    checkText(fm, ctx)
    checkDates(fm, ctx)
  })

// About page: content/about/<lang>/about.mdx. Targets no keyword; the FAQ is site-wide (licence, privacy, pricing).

export const aboutSchema = z
  .strictObject({
    title: z.string().min(1),
    description: z.string().min(1),
    lede: z.string().min(1),
    faq: faqSchema.optional(),
    published: dateSchema,
    updated: dateSchema,
  })
  .superRefine((fm, ctx) => {
    checkText(fm, ctx)
    checkDates(fm, ctx)
  })

// Hub pages: content/hubs/<id>.json (tools, guides, a collection id) and content/hubs/<collection>/<category>.json, the page at /<id>/ that lists the members.

export const hubTextSchema = z
  .strictObject({
    ...textFields,
    /** Short name for breadcrumbs, default the h1. Tools and guides use the core messages instead. */
    name: z.string().min(1).optional(),
    /** What is in the set and how to choose. Shown on page 1. */
    intro: z.string().min(1),
    sections: z.array(sectionSchema).max(3).optional(),
    faq: faqSchema.max(5).optional(),
  })
  .superRefine(checkText)

const hubShape = {
  /** Members per page (default and maximum 60). */
  pageSize: z.number().int().min(1).max(HUB_PAGE_SIZE).optional(),
  published: dateSchema,
  updated: dateSchema,
}

/** Schema of a hub file for these languages. A language block is optional: no block, no hub in that language. */
export const hubFileSchema = (locales: readonly string[]) =>
  z.object({ ...hubShape, ...Object.fromEntries(locales.map((l) => [l, hubTextSchema.optional()])) }).superRefine(checkDates)

export type HubText = z.infer<typeof hubTextSchema>
export type HubFile = z.infer<z.ZodObject<typeof hubShape>> & Partial<Record<Locale, HubText>>

// Collection items (programmatic pages): content/collections/<collection>/<slug>.json, one file per item, one text block per
// language. The block exists in a language only when it has `name`, `keyword` and `body` (see itemLocales in collections.ts).

/** The item's main media. `src` and `poster` are paths on this site or absolute URLs; the alt text is `alt` of each language block. */
export const mediaSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('image'),
    src: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    /** URL of the licence, only when we own the image. */
    license: z.url().optional(),
  }),
  z.strictObject({
    kind: z.literal('video'),
    src: z.string().min(1),
    /** MIME type of `src`, default video/mp4. */
    mime: z.string().min(1).optional(),
    poster: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    /** Seconds. */
    duration: z.number().positive(),
  }),
])

export const ITEM_FAQ_MAX = 4

export const itemTextSchema = z
  .strictObject({
    ...textFields,
    /** The common searched name: H1, cards and breadcrumb. */
    name: z.string().min(1),
    /** Our own name for the item, shown as a sub-line only. */
    ownName: z.string().min(1).optional(),
    /** Item-specific prose: what it is, how to use or make it, why it works. */
    body: z.array(sectionSchema).min(1),
    /** Describes the main media; required when the item has media. */
    alt: z.string().min(1).max(125).optional(),
    faq: faqSchema.max(ITEM_FAQ_MAX).optional(),
  })
  .superRefine((t, ctx) => {
    checkText(t, ctx)
    checkDemand(t, ctx)
    // The H1 is `h1`, else the name; it must contain the keyword.
    if (!t.h1 && !t.name.toLowerCase().includes(t.keyword.toLowerCase())) issue(ctx, ['name'], `is the h1 and must contain the keyword "${t.keyword}"`)
  })

/** Schema of an item file. `data` is the collection's own schema; `categories` are its category hub ids. */
export const itemFileSchema = (locales: readonly string[], categories: readonly string[], data: z.ZodType) =>
  z
    .object({
      slug: slugSchema,
      category: z.array(z.string()).min(1),
      /** Free tags, used to pick related items after the same category. */
      tags: z.array(z.string().min(1)).optional(),
      media: mediaSchema.optional(),
      data,
      ...sharedFields,
      ...Object.fromEntries(locales.map((l) => [l, itemTextSchema.optional()])),
    })
    .superRefine((f, ctx) => {
      checkDates(f, ctx)
      f.category.forEach((c, i) => {
        if (!categories.includes(c)) issue(ctx, ['category', i], `"${c}" is not a category of this collection (${categories.join(', ') || 'none declared'})`)
      })
      for (const l of locales) {
        const block = (f as Record<string, { alt?: string } | undefined>)[l]
        if (f.media && block && !block.alt) issue(ctx, [l, 'alt'], 'required when the item has media: describe what the media shows')
      }
    })

export type ItemText = z.infer<typeof itemTextSchema>
export type Media = z.infer<typeof mediaSchema>
export type ItemFile = {
  slug: string
  category: string[]
  tags?: string[]
  media?: Media
  data: unknown
  published: string
  updated: string
  author?: string
  ogImage?: string
  related?: string[]
} & Partial<Record<Locale, ItemText>>

// Comparison, alternatives, glossary, use-case, gallery and changelog pages (spec §1.5 to §1.9). Same rules as the types
// above: a schema error stops the build with the file and field; content below the minimums of src/core/seo/quality.ts is built
// but noindex. None of them has `related`: their links are the ones in their own fields and in the copy.

/** A third-party source of the facts a page states, with the day it was checked. */
export const sourceSchema = z.strictObject({ label: z.string().min(1), url: z.url(), checked: dateSchema })
export const sourcesSchema = z.array(sourceSchema)

/** A product the page is about: `url` is its site (absolute) or, for our own product, a path on this site. */
export const productUrlSchema = z.string().refine((u) => /^\/(?!\/)/.test(u) || /^https:\/\/\S+$/.test(u), 'must be an https URL, or a path on this site starting with /')
export const RELATIONS = ['ours', 'third-party'] as const

/** A link to a page of this site (default-language path) or elsewhere, with its label. */
export const pathLinkSchema = z.strictObject({ name: z.string().min(1), path: z.string().regex(/^\/(?!\/).*\/$/, 'must be a default-language path with a leading and trailing slash, like /tools/word-counter/') })

const datedFields = { published: dateSchema, updated: dateSchema, ogImage: sharedFields.ogImage }

// Comparison: content/compare/<lang>/<a>-vs-<b>.mdx at /compare/<a>-vs-<b>/. The body is MDX: one H2 per decision factor, then "When to pick a" and "When to pick b".
export const compareSchema = z
  .strictObject({
    ...textFields,
    ...datedFields,
    /** The two products: `a` and `b` of the table are the first and the second. */
    products: z.array(z.strictObject({ name: z.string().min(1), url: productUrlSchema, relation: z.enum(RELATIONS) })).length(2),
    /** Two or three sentences, shown under the H1 as the short answer. */
    verdict: z.string().min(1),
    /** One row per decision factor; `chooseIf` says when this factor should decide. */
    table: z.array(z.strictObject({ factor: z.string().min(1), a: z.string().min(1), b: z.string().min(1), chooseIf: z.string().min(1) })),
    /** Prices of the two products on `asOf`; only what a source states. */
    pricing: z.strictObject({ asOf: dateSchema, a: z.string().min(1), b: z.string().min(1) }).optional(),
    sources: sourcesSchema,
  })
  .superRefine((fm, ctx) => {
    checkText(fm, ctx)
    checkDemand(fm, ctx)
    checkDates(fm, ctx)
  })

// Alternatives: content/alternatives/<product>.json at /alternatives/<product>/, one text block per language.
export const altEntrySchema = z.strictObject({
  name: z.string().min(1),
  url: productUrlSchema,
  bestFor: z.string().min(1),
  /** Only what a source states; otherwise say it was not checked. */
  price: z.string().min(1),
  relation: z.enum(RELATIONS),
  notes: z.string().min(1),
})

export const alternativesTextSchema = z
  .strictObject({
    ...textFields,
    /** The product the visitor is leaving. */
    product: z.string().min(1),
    /** How the entries were judged. */
    criteria: z.string().min(1),
    entries: z.array(altEntrySchema),
    sections: z.array(sectionSchema).max(3).optional(),
    sources: sourcesSchema,
    faq: faqSchema.max(6).optional(),
  })
  .superRefine((t, ctx) => {
    checkText(t, ctx)
    checkDemand(t, ctx)
  })

export const alternativesFileSchema = (locales: readonly string[]) =>
  z.object({ slug: slugSchema, ...datedFields, ...Object.fromEntries(locales.map((l) => [l, alternativesTextSchema.optional()])) }).superRefine(checkDates)

// Glossary term: content/glossary/<lang>/<slug>.mdx at /glossary/<slug>/. The body is MDX: how it works, an example, common confusions.
export const glossarySchema = z
  .strictObject({
    ...textFields,
    ...datedFields,
    /** 40 to 60 words, self-contained, starts "<Term> is ...": the quotable answer. */
    definition: z.string().min(1),
    /** A text or code sample. */
    example: z.strictObject({ text: z.string().min(1), caption: z.string().min(1) }),
    /** Other terms or pages to read next (at least 3). */
    seeAlso: z.array(pathLinkSchema),
    /** Tools or items that do it (at least 1): "Try it: ...". */
    useIt: z.array(pathLinkSchema),
  })
  .superRefine((fm, ctx) => {
    checkText(fm, ctx)
    checkDemand(fm, ctx)
    checkDates(fm, ctx)
  })

// Use case: content/use-cases/<slug>.json at /for/<slug>/, one text block per language.
const titledBody = z.strictObject({ title: z.string().min(1), body: z.string().min(1) })

export const useCaseTextSchema = z
  .strictObject({
    ...textFields,
    audience: z.string().min(1),
    /** Exactly three, specific to this audience. */
    problems: z.array(titledBody).length(3),
    /** The steps of the audience's workflow. */
    workflow: z.array(titledBody).min(3).max(6),
    /** Tools or items to start with (at least 3), each with a caption that says what it does for this audience. */
    examples: z.array(z.strictObject({ name: z.string().min(1), path: pathLinkSchema.shape.path, caption: z.string().min(1) })),
    cta: pathLinkSchema,
    faq: faqSchema.min(3).max(6),
  })
  .superRefine((t, ctx) => {
    checkText(t, ctx)
    checkDemand(t, ctx)
  })

export const useCaseFileSchema = (locales: readonly string[]) =>
  z.object({ slug: slugSchema, ...datedFields, ...Object.fromEntries(locales.map((l) => [l, useCaseTextSchema.optional()])) }).superRefine(checkDates)

// Gallery: content/gallery/<slug>.json at /gallery/<slug>/, one text block per language. An entry has no URL of its own.
export const galleryEntrySchema = z.strictObject({
  media: mediaSchema,
  /** Describes the media (at most 125 characters). */
  alt: z.string().min(1).max(125),
  title: z.string().min(1),
  caption: z.string().min(1),
  facts: z.array(z.tuple([z.string().min(1), z.string().min(1)])).optional(),
  link: pathLinkSchema.optional(),
})

export const galleryTextSchema = z
  .strictObject({
    ...textFields,
    intro: z.string().min(1),
    entries: z.array(galleryEntrySchema),
    faq: faqSchema.max(5).optional(),
  })
  .superRefine((t, ctx) => {
    checkText(t, ctx)
    checkDemand(t, ctx)
  })

export const galleryFileSchema = (locales: readonly string[]) =>
  z.object({ slug: slugSchema, ...datedFields, ...Object.fromEntries(locales.map((l) => [l, galleryTextSchema.optional()])) }).superRefine(checkDates)

// Changelog: content/changelog/changelog.json at /changelog/, newest entry first. No separate blog (spec §1.9).
export const changelogEntrySchema = z.strictObject({
  date: dateSchema,
  /** ASCII kebab-case; the entry's anchor is `<date>-<slug>`. */
  slug: slugSchema,
  title: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
})

const { faq: _noFaq, ...changelogFields } = textFields

export const changelogTextSchema = z
  .strictObject({
    ...changelogFields,
    entries: z.array(changelogEntrySchema).min(1),
  })
  .superRefine((t, ctx) => {
    checkText(t, ctx)
    const ids = new Set<string>()
    t.entries.forEach((e, i) => {
      const id = `${e.date}-${e.slug}`
      if (ids.has(id)) issue(ctx, ['entries', i], `"${id}" is used by another entry`)
      ids.add(id)
      if (i > 0 && e.date > t.entries[i - 1].date) issue(ctx, ['entries', i, 'date'], `${e.date} is newer than the entry before it; list the newest entry first`)
    })
  })

export const changelogFileSchema = (locales: readonly string[]) =>
  z
    .object({ published: dateSchema, updated: dateSchema, ogImage: sharedFields.ogImage, ...Object.fromEntries(locales.map((l) => [l, changelogTextSchema.optional()])) })
    .superRefine((f, ctx) => {
      checkDates(f, ctx)
      for (const l of locales) {
        const newest = (f as Record<string, { entries: { date: string }[] } | undefined>)[l]?.entries[0]?.date
        if (newest && newest > f.updated) issue(ctx, ['updated'], `${f.updated} is before the newest ${l} entry (${newest}); run npm run stamp or set updated to the newest entry date`)
      }
    })

export type Source = z.infer<typeof sourceSchema>
export type PathLink = z.infer<typeof pathLinkSchema>
export type CompareFrontmatter = z.infer<typeof compareSchema>
export type GlossaryFrontmatter = z.infer<typeof glossarySchema>
export type AltEntry = z.infer<typeof altEntrySchema>
export type AlternativesText = z.infer<typeof alternativesTextSchema>
export type AlternativesFile = { slug: string; published: string; updated: string; ogImage?: string } & Partial<Record<Locale, AlternativesText>>
export type UseCaseText = z.infer<typeof useCaseTextSchema>
export type UseCaseFile = { slug: string; published: string; updated: string; ogImage?: string } & Partial<Record<Locale, UseCaseText>>
export type GalleryEntry = z.infer<typeof galleryEntrySchema>
export type GalleryText = z.infer<typeof galleryTextSchema>
export type GalleryFile = { slug: string; published: string; updated: string; ogImage?: string } & Partial<Record<Locale, GalleryText>>
export type ChangelogEntry = z.infer<typeof changelogEntrySchema>
export type ChangelogText = z.infer<typeof changelogTextSchema>
export type ChangelogFile = { published: string; updated: string; ogImage?: string } & Partial<Record<Locale, ChangelogText>>

export type GuideFrontmatter = z.infer<typeof guideSchema>
export type LegalFrontmatter = z.infer<typeof legalSchema>
export type AboutFrontmatter = z.infer<typeof aboutSchema>
/** Frontmatter of any MDX page. */
export type DocFrontmatter = GuideFrontmatter | LegalFrontmatter | AboutFrontmatter

/** Validates `data` and returns it typed. On failure throws one error with the file and every failing field. */
export function parseContent<S extends z.ZodType>(schema: S, data: unknown, file: string): z.infer<S> {
  const r = schema.safeParse(data)
  if (r.success) return r.data
  const lines = r.error.issues.map((i) => `  ${i.path.length ? i.path.join('.') : '(file)'}: ${i.message}`)
  throw new Error(`${file}: invalid content\n${lines.join('\n')}`)
}
