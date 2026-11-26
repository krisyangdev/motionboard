import { hubPagePath } from '@/core/content/hubs'
import type { Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { PathLink } from './link'

/**
 * Previous / next and numbered links of a paginated hub, all plain `<a href>` (they stay in the HTML).
 * `hubPath` is the hub's default-language path; page 1 is the hub itself.
 */
export function Pagination({ hubPath, page, pages, locale }: { hubPath: string; page: number; pages: number; locale: Locale }) {
  if (pages < 2) return null
  const l = coreMessages[locale].page
  const link = 'rounded-md border px-3 py-1.5 text-sm hover:bg-muted'
  return (
    <nav aria-label={l.pagination} className="mt-8">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <li>
            <PathLink className={link} locale={locale} path={hubPagePath(hubPath, page - 1)}>
              {l.previous}
            </PathLink>
          </li>
        )}
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            {n === page ? (
              <span aria-current="page" className="rounded-md border border-foreground px-3 py-1.5 text-sm font-medium">
                {n}
              </span>
            ) : (
              <PathLink className={link} locale={locale} path={hubPagePath(hubPath, n)}>
                {n}
              </PathLink>
            )}
          </li>
        ))}
        {page < pages && (
          <li>
            <PathLink className={link} locale={locale} path={hubPagePath(hubPath, page + 1)}>
              {l.next}
            </PathLink>
          </li>
        )}
      </ul>
    </nav>
  )
}
