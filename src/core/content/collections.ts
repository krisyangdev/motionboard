// Collections of programmatic item pages (spec §1.2): a site declares them in src/site/collections.ts with
// `defineCollection`; the items are content/collections/<id>/<slug>.json. Node only (pages.ts reads them at build time).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { z } from 'zod'
import type { Locale } from '../i18n.ts'
import { itemFileSchema, parseContent, slugSchema, type ItemFile } from './schema.ts'

/** URL segments the template or the app already uses: a collection id and a category cannot be one of them. */
export const RESERVED_SEGMENTS = ['tools', 'guides', 'about', 'privacy', 'terms', 'login', 'signup', 'account', 'app', 'admin', 'api', 'forgot-password', 'reset-password', 'page', 'assets', 'fonts']

export type Collection = {
  /** Folder in content/collections, the URL segment (/<id>/<slug>/) and the hub file content/hubs/<id>.json. */
  id: string
  /** Category hub ids: the hub of each is content/hubs/<id>/<category>.json at /<id>/<category>/. An item has one or more. */
  categories: readonly string[]
  /** Schema of the `data` of an item (zod). */
  data: z.ZodType
  /** Entries in an item's data block. A block of 10 or more counts as main content when the item has no media. Default 0. */
  dataEntries?: (data: any) => number
  /** Item-specific text inside `data`, counted by the text gate and the near-duplicate check. Default none. */
  dataText?: (data: any) => string
}

/** Declares a collection. `dataEntries` and `dataText` receive the parsed `data`, typed by `data`. */
export function defineCollection<S extends z.ZodType>(c: Omit<Collection, 'data' | 'dataEntries' | 'dataText'> & { data: S; dataEntries?: (data: z.infer<S>) => number; dataText?: (data: z.infer<S>) => string }): Collection {
  return c
}

/** Checks the declarations of a site; every message says what to change. */
export function validateCollections(collections: readonly Collection[]): void {
  const seen = new Set<string>()
  for (const c of collections) {
    const where = `src/site/collections.ts, collection "${c.id}"`
    parseContent(slugSchema, c.id, `${where}: id`)
    if (RESERVED_SEGMENTS.includes(c.id)) throw new Error(`${where}: "${c.id}" is a URL segment the template uses; choose another id`)
    if (seen.has(c.id)) throw new Error(`${where}: declared twice`)
    seen.add(c.id)
    if (c.categories.length === 0) throw new Error(`${where}: list at least one category (items link to their category hub)`)
    for (const cat of c.categories) {
      parseContent(slugSchema, cat, `${where}: category`)
      if (RESERVED_SEGMENTS.includes(cat)) throw new Error(`${where}: category "${cat}" is a URL segment the template uses`)
    }
    if (new Set(c.categories).size !== c.categories.length) throw new Error(`${where}: a category is listed twice`)
  }
}

const filled = (v: unknown) => typeof v === 'string' && v.trim() !== ''

/**
 * The languages of an item file that have their text block: `name`, `keyword` and a non-empty `body` must exist.
 * Anything less means the language has no page for this item (there is no fallback to another language), not an error.
 */
export const itemLocales = (raw: Record<string, unknown>, locales: readonly string[]): string[] =>
  locales.filter((l) => {
    const b = raw[l] as { name?: unknown; keyword?: unknown; body?: unknown } | undefined
    return !!b && typeof b === 'object' && filled(b.name) && filled(b.keyword) && Array.isArray(b.body) && b.body.length > 0
  })

/**
 * Every item of a collection, validated, by slug. A file that fails the schema stops the build with its path and
 * field; a language block that lacks name, keyword or body is dropped; an item with no language left is not a page.
 */
export function readItems(c: Collection, locales: readonly Locale[], root: string): Map<string, ItemFile> {
  const dir = join(root, 'content', 'collections', c.id)
  const names = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -'.json'.length)).sort() : []
  const schema = itemFileSchema(locales, c.categories, c.data)
  const items = new Map<string, ItemFile>()
  for (const slug of names) {
    const file = `content/collections/${c.id}/${slug}.json`
    let raw: Record<string, unknown>
    try {
      raw = JSON.parse(readFileSync(join(dir, `${slug}.json`), 'utf8'))
    } catch (e) {
      throw new Error(`${file}: invalid JSON: ${(e as Error).message}`)
    }
    const present = itemLocales(raw, locales)
    const cleaned = { ...raw }
    for (const l of locales) if (!present.includes(l)) delete cleaned[l]
    const item = parseContent(schema, cleaned, file) as unknown as ItemFile
    if (item.slug !== slug) throw new Error(`${file}: slug "${item.slug}" must equal the file name "${slug}"`)
    if (RESERVED_SEGMENTS.includes(slug) || c.categories.includes(slug)) throw new Error(`${file}: slug "${slug}" is a category or a reserved URL segment (/${c.id}/${slug}/ would clash)`)
    if (present.length) items.set(slug, item)
  }
  return items
}
