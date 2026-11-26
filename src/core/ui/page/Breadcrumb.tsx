import { useLocale } from '@/core/locale'
import { coreMessages } from '@/core/messages'
import type { Locale } from '@/core/i18n'
import type { Crumb } from '@/core/seo'
import { PathLink } from './link'

/** Breadcrumb trail of a page in a language: home, then `items`, the page itself last. The same array goes to seoHead's `breadcrumb`. */
export const trail = (locale: Locale, ...items: Crumb[]): Crumb[] => [{ name: coreMessages[locale].page.home, path: '/' }, ...items]

/** The visible breadcrumb; `crumbs` is the whole trail from `trail()`, home first and the current page last (not a link). */
export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const locale = useLocale()
  return (
    <nav aria-label={coreMessages[locale].page.breadcrumb}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {crumbs.map((c, i) => (
          <li className="flex items-center gap-2" key={c.path}>
            {i > 0 && <span aria-hidden>›</span>}
            {i < crumbs.length - 1 ? (
              <PathLink className="hover:text-foreground hover:underline" locale={locale} path={c.path}>
                {c.name}
              </PathLink>
            ) : (
              <span aria-current="page">{c.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
