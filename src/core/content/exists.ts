// Which site pages exist in which language and which are indexable there, read from the content index
// (the registry of sitePages() in src/core/pages.ts, so one rule everywhere).
import index from 'virtual:content-index'
import { LOCALES, type Locale } from '../i18n'

/** Languages a site page (default-language path) exists in. A path that is not a site page counts as existing everywhere. */
export const existingLocales = (path: string): readonly Locale[] => index.pages[path]?.locales ?? LOCALES

/** Whether a default-language path exists in a language. A path that is not a site page is assumed to exist: the site owns it. */
export const pageExists = (l: Locale, path: string): boolean => existingLocales(path).includes(l)

/**
 * What seoHead needs for a site page in a language: whether it is noindex there, and the languages for its
 * hreflang set (the ones that exist and are indexable).
 */
export function seoState(path: string, l: Locale): { noindex: boolean; locales: readonly Locale[] } {
  const p = index.pages[path]
  return p ? { noindex: p.noindex.includes(l), locales: p.locales.filter((x) => !p.noindex.includes(x)) } : { noindex: false, locales: LOCALES }
}

/** Whether a site page is in the index in a language (it exists there and the quality gate let it in). */
export const isIndexable = (l: Locale, path: string): boolean => {
  const p = index.pages[path]
  return !!p && p.locales.includes(l) && !p.noindex.includes(l)
}
