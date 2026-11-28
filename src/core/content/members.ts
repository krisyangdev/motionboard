// Lists of pages for hubs and related blocks. Only pages in the index are listed (noindex pages stay out of hubs and
// related lists, but remain reachable by their links). The lists carry descriptions, so they load on demand
// (virtual:content-lists, the collection module) and only route loaders call them; hub names come from the small
// every-page index.
import index from 'virtual:content-index'
import type { Locale } from '../i18n'
import { coreMessages } from '../messages'
import { loadCollection } from './collection'
import { itemPath, typedPath } from './hubs'
import { isIndexable } from './exists'

const loadLists = async () => (await import('virtual:content-lists')).default

/** A card in a hub or a related block: `href` is a default-language path. */
export type Entry = { title: string; description?: string; href: string }

/**
 * Indexable members of a hub in a language, by hub id: `tools` by slug, `guides` and `compare` newest first, `glossary` alphabetical, a collection id (its
 * items by slug) or `<collection>/<category>` (the items of that category).
 */
export async function members(hubId: string, l: Locale): Promise<Entry[]> {
  if (!['tools', 'guides', 'compare', 'glossary'].includes(hubId)) {
    const [id, category] = hubId.split('/')
    return itemEntries(id, l, (i) => !category || i.category.includes(category))
  }
  const index = await loadLists()
  if (hubId === 'tools') {
    return index.tools.filter((t) => isIndexable(l, `/tools/${t.slug}/`)).map((t) => ({ title: t.name[l] ?? t.slug, description: t.description[l], href: `/tools/${t.slug}/` }))
  }
  if (hubId === 'guides') {
    return index.docs.guides[l].filter((d) => isIndexable(l, `/guides/${d.slug}/`)).map((d) => ({ title: d.title, description: d.description, href: `/guides/${d.slug}/` }))
  }
  if (hubId === 'compare') {
    return index.docs.compare[l].filter((d) => isIndexable(l, typedPath('compare', d.slug))).map((d) => ({ title: d.title, description: d.description, href: typedPath('compare', d.slug) }))
  }
  if (hubId === 'glossary') {
    // The glossary index is one alphabetical list.
    return index.docs.glossary[l]
      .filter((d) => isIndexable(l, typedPath('glossary', d.slug)))
      .map((d) => ({ title: d.title, description: d.description, href: typedPath('glossary', d.slug) }))
      .sort((a, b) => a.title.localeCompare(b.title, l))
  }
  return []
}

/** Cards for the indexable items of a collection in a language, optionally filtered. */
async function itemEntries(collection: string, l: Locale, keep: (item: { slug: string; category: string[] }) => boolean = () => true): Promise<Entry[]> {
  return ((await loadCollection(collection))?.items ?? [])
    .filter((i) => keep(i) && i.locales.includes(l) && !i.noindex.includes(l))
    .map((i) => ({ title: i.name[l] ?? i.slug, description: i.description[l], href: itemPath(collection, i.slug) }))
}

/** Cards for the related items of an item in a language (selected at build time: explicit, same category, then shared tags). */
export async function relatedItemEntries(collection: string, slug: string, l: Locale): Promise<Entry[]> {
  const related = (await loadCollection(collection))?.items.find((i) => i.slug === slug)?.related[l] ?? []
  const byHref = new Map((await itemEntries(collection, l)).map((e) => [e.href, e]))
  return related.flatMap((r) => byHref.get(itemPath(collection, r)) ?? [])
}

/** Cards for the `related` slugs of a page: a slug is looked up in `order` (hub ids, first match wins); unknown and noindex slugs are skipped. */
export async function relatedEntries(slugs: readonly string[] | undefined, l: Locale, order: readonly string[]): Promise<Entry[]> {
  const lists = await Promise.all(order.map((c) => members(c, l)))
  return (slugs ?? []).flatMap((slug) => {
    for (const [k, c] of order.entries()) {
      const hit = lists[k].find((e) => e.href === `/${c}/${slug}/`)
      if (hit) return [hit]
    }
    return []
  })
}

/** Breadcrumb name of a hub in a language: tools, guides, compare and glossary from the core messages, a collection or category hub from its hub file. */
export function hubName(hubId: string, l: Locale): string {
  if (hubId === 'tools' || hubId === 'guides' || hubId === 'compare' || hubId === 'glossary') return coreMessages[l].page[hubId]
  return index.hubs[hubId]?.[l] ?? hubId
}

/** Category hub ids of a collection (`<collection>/<category>`) that exist in a language, for the links on the collection hub. */
export function subHubs(collection: string, l: Locale): Entry[] {
  return (index.categories[collection] ?? []).flatMap((cat) => {
    const name = index.hubs[`${collection}/${cat}`]?.[l]
    return name ? [{ title: name, href: `/${collection}/${cat}/` }] : []
  })
}
