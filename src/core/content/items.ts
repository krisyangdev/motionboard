// Collection items: content/collections/<collection>/<slug>.json, one lazy chunk per item.
// An item exists in a language only when its JSON has a text block there (name, keyword, body); there is no fallback.
import index from 'virtual:content-index'
import type { Locale } from '../i18n'
import type { ItemFile, ItemText, Media } from './schema'

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
}

const files = import.meta.glob<ItemFile>('/content/collections/*/*.json', { import: 'default' })

/** The item in a language, or undefined when it has no text in that language. */
export async function loadItem(collection: string, slug: string, locale: Locale): Promise<Item | undefined> {
  const entry = index.collections[collection]?.items.find((i) => i.slug === slug)
  if (!entry?.locales.includes(locale)) return undefined
  const file = await files[`/content/collections/${collection}/${slug}.json`]?.()
  const text = file?.[locale]
  if (!file || !text) return undefined
  return { collection, slug, name: text.name, text, media: file.media, data: file.data, category: file.category, published: file.published, updated: file.updated, ogImage: file.ogImage, locales: entry.locales }
}
