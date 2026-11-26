// Lists of pages for hubs and related blocks, from the content index. Only pages in the index are listed
// (noindex pages stay out of hubs and related lists, but remain reachable by their links).
import index from 'virtual:content-index'
import type { Locale } from '../i18n'
import type { HubCollection } from './schema'
import { isIndexable } from './exists'

/** A card in a hub or a related block: `href` is a default-language path. */
export type Entry = { title: string; description?: string; href: string }

/** Indexable members of a hub in a language: tools by slug, guides newest first. */
export function members(collection: HubCollection, l: Locale): Entry[] {
  if (collection === 'tools') {
    return index.tools.filter((t) => isIndexable(l, `/tools/${t.slug}/`)).map((t) => ({ title: t.name[l] ?? t.slug, description: t.description[l], href: `/tools/${t.slug}/` }))
  }
  return index.docs.guides[l].filter((d) => isIndexable(l, `/guides/${d.slug}/`)).map((d) => ({ title: d.title, description: d.description, href: `/guides/${d.slug}/` }))
}

/** Cards for the `related` slugs of a page: a slug is looked up in `order` (collections, first match wins); unknown and noindex slugs are skipped. */
export function relatedEntries(slugs: readonly string[] | undefined, l: Locale, order: readonly HubCollection[]): Entry[] {
  return (slugs ?? []).flatMap((slug) => {
    for (const c of order) {
      const hit = members(c, l).find((e) => e.href === `/${c}/${slug}/`)
      if (hit) return [hit]
    }
    return []
  })
}
