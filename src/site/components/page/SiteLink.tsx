import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { localizePath } from '@/core/i18n'
import { useLocale } from '@/core/locale'

/** Internal link to a page given by its English path; other languages get their prefix.
 *  The paths come from the content JSON, not from the route types; the prerender crawl
 *  (failOnError) catches a dead one at build time. */
export function SiteLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const locale = useLocale()
  const [path, hash] = href.split('#')
  return (
    <Link to={localizePath(locale, path) as '/{-$locale}/'} hash={hash} className={className}>
      {children}
    </Link>
  )
}
