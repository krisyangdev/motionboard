// The content contract of every page type: zod schemas for the fields all pages share and for the
// tool, guide and legal files used today. Node only (pages.ts validates every content file with these
// at build time and throws an error naming the file and field), and the types below are what the app
// imports. Nothing in the app imports the schemas themselves, so zod stays out of the browser bundles.
import { z } from 'zod'
import type { Locale } from '../i18n.ts'

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
/** Title length limit without the brand. */
export const titleMax = (title: string) => (isCjk(title) ? 32 : 60)
/** Meta description length range. */
export const descriptionRange = (description: string): [min: number, max: number] => (isCjk(description) ? [50, 90] : [120, 160])

type Ctx = z.core.$RefinementCtx
const issue = (ctx: Ctx, path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message })

function checkText(t: { title: string; description: string; keyword?: string; h1?: string }, ctx: Ctx) {
  const max = titleMax(t.title)
  if (t.title.length > max) issue(ctx, ['title'], `${t.title.length} characters, at most ${max} (without the site name)`)
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

export const toolTextSchema = z
  .strictObject({ ...textFields, steps: z.array(z.strictObject({ title: z.string().min(1), body: z.string().min(1) })).optional() })
  .superRefine((t, ctx) => {
    checkText(t, ctx)
    checkDemand(t, ctx)
  })

const toolShape = {
  slug: slugSchema,
  /** Id of a widget in src/site/tools/index.ts, or null for a text-only page. */
  tool: z.string().min(1).nullable(),
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

export const legalSchema = z.strictObject({ title: z.string().min(1), description: z.string().min(1), published: dateSchema, updated: dateSchema }).superRefine((fm, ctx) => {
  checkText(fm, ctx)
  checkDates(fm, ctx)
})

export type GuideFrontmatter = z.infer<typeof guideSchema>
export type LegalFrontmatter = z.infer<typeof legalSchema>
/** Frontmatter of any MDX page. */
export type DocFrontmatter = GuideFrontmatter | LegalFrontmatter

/** Validates `data` and returns it typed. On failure throws one error with the file and every failing field. */
export function parseContent<S extends z.ZodType>(schema: S, data: unknown, file: string): z.infer<S> {
  const r = schema.safeParse(data)
  if (r.success) return r.data
  const lines = r.error.issues.map((i) => `  ${i.path.length ? i.path.join('.') : '(file)'}: ${i.message}`)
  throw new Error(`${file}: invalid content\n${lines.join('\n')}`)
}
