import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { localizePath, type Locale } from '@/core/i18n'

/** Spread onto the h1 so the browser reports it as the LCP candidate (not in React's intrinsic types). */
export const LCP = { elementtiming: 'lcp' }

/** Client-side link to a default-language path; the current language is applied here. */
export function PathLink({ path, locale, className, children }: { path: string; locale: Locale; className?: string; children: ReactNode }) {
  // The path is data (content files, MDX), so it cannot be checked against the route tree.
  return (
    <Link className={className} to={localizePath(locale, path) as '/{-$locale}/'}>
      {children}
    </Link>
  )
}

/** A link from content data: a path on this site (starts with "/") becomes a router link in the current language, anything else an external link. */
export function SiteLink({ href, locale, className, children }: { href: string; locale: Locale; className?: string; children: ReactNode }) {
  return href.startsWith('/') ? (
    <PathLink className={className} locale={locale} path={href}>
      {children}
    </PathLink>
  ) : (
    <a className={className} href={href} rel="noopener" target="_blank">
      {children}
    </a>
  )
}
