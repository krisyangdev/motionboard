import { notFound } from '@tanstack/react-router'
import type { PageCopy } from '@/data/content'
import { loadPage, PAGES, type PageKind } from '@/data/pages'
import type { Locale } from '@/site.config'

/** What a route hands to the page: the copy of one locale only, so the prerendered HTML carries one language. */
export type PageData = { id: string; kind: PageKind; path: string; updated: string; copy: PageCopy }

/** Route loader of the hub and guide pages: 404 unless the id is a page of that kind. */
export async function loadContent(kind: PageKind, locale: Locale, id: string): Promise<PageData> {
  const entry = PAGES.find((p) => p.id === id && p.kind === kind)
  if (!entry) throw notFound()
  const page = await loadPage(id)
  return { id, kind, path: page.path, updated: page.updated, copy: page[locale] }
}
