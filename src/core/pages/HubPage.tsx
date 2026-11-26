// List page template, plus the small pieces the other page templates share (breadcrumb, card grid, link).
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { localizePath, type Locale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { coreMessages } from '@/core/messages'
import type { Crumb } from '@/core/seo'

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

export type HubEntry = { title: string; description?: string; href: string }

export function CardGrid({ entries, locale }: { entries: HubEntry[]; locale: Locale }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {entries.map((e) => (
        <li key={e.href}>
          <PathLink
            className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground shadow-xs/5 transition-colors hover:bg-muted"
            locale={locale}
            path={e.href}
          >
            <span className="font-medium">{e.title}</span>
            {e.description && <span className="text-sm text-muted-foreground">{e.description}</span>}
          </PathLink>
        </li>
      ))}
    </ul>
  )
}

export function HubPage({ title, lede, entries, crumbs }: { title: string; lede: ReactNode; entries: HubEntry[]; crumbs: Crumb[] }) {
  const locale = useLocale()
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={crumbs} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{lede}</p>
      <div className="mt-8">
        <CardGrid entries={entries} locale={locale} />
      </div>
    </main>
  )
}
