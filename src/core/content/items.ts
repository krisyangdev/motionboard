// Collection items: content/collections/<collection>/<slug>.json, one lazy chunk per item.
// An item exists in a language only when its JSON has a text block there (name, keyword, body); there is no fallback.
import type { Locale } from '../i18n'
import { loadCollection } from './collection'
import type { ItemText, Media } from './schema'

/** An item in one language. */
export type Item = {
  collection: string
  slug: string
  name: string
  text: ItemText
  media?: Media
  /** The collection's own data, validated at build time; the site's `itemData` slot renders it. */
  data: unknown
  category: string[]
  published: string
  updated: string
  ogImage?: string
  /** Every language the item exists in. */
  locales: Locale[]
  /** Languages it exists in but is kept out of the index (noindex). */
  noindex: Locale[]
}

/** The item in a language, or undefined when it has no text in that language. */
export async function loadItem(collection: string, slug: string, locale: Locale): Promise<Item | undefined> {
  const c = await loadCollection(collection)
  const entry = c?.items.find((i) => i.slug === slug)
  if (!c || !entry?.locales.includes(locale)) return undefined
  const file = await c.files[slug]?.()
  const text = file?.[locale]
  if (!file || !text) return undefined
  return { collection, slug, name: text.name, text, media: file.media, data: file.data, category: file.category, published: file.published, updated: file.updated, ogImage: file.ogImage, locales: entry.locales, noindex: entry.noindex }
}
