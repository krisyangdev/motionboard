import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useLocale } from '@/lib/locale'

/** Internal link to a page given by its English path; Chinese pages get the /zh prefix.
 *  The paths come from the content JSON, not from the route types; the prerender crawl
 *  (failOnError) catches a dead one at build time. */
export function SiteLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const zh = useLocale() === 'zh'
  const [path, hash] = href.split('#')
  return (
    <Link to={(zh ? `/zh${path}` : path) as '/'} hash={hash} className={className}>
      {children}
    </Link>
  )
}
