// Which built-in pages exist in which language, read from the content index (the same rule as sitePages() in src/core/pages.ts).
import index from 'virtual:content-index'
import { LOCALES, type Locale } from '../i18n'

/** Languages a built-in hub has entries in: the tools hub needs a tool, the guides hub a guide. */
export const hubLocales = (hub: 'tools' | 'guides'): Locale[] =>
  LOCALES.filter((l) => (hub === 'tools' ? index.tools.some((t) => t.locales.includes(l)) : index.docs.guides[l].length > 0))

/**
 * Whether a default-language path exists in a language, for the built-in pages (tools and guides hubs, privacy, terms).
 * Any other path is assumed to exist: the site owns those pages.
 */
export function pageExists(l: Locale, path: string): boolean {
  if (path === '/tools/') return hubLocales('tools').includes(l)
  if (path === '/guides/') return hubLocales('guides').includes(l)
  if (path === '/privacy/' || path === '/terms/') return index.docs.legal[l].some((d) => `/${d.slug}/` === path)
  return true
}
