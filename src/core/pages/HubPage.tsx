// List page template, plus the small pieces the other page templates share (breadcrumb, card grid, link, labels).
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { localizePath, type Locale } from '@/core/i18n'
import { useLocale } from '@/core/locale'

/** Spread onto the h1 so the browser reports it as the LCP candidate (not in React's intrinsic types). */
export const LCP = { elementtiming: 'lcp' }

export const labels = {
  en: { home: 'Home', tools: 'Tools', guides: 'Guides', updated: 'Updated', published: 'Published', howTo: 'How to use', faq: 'Frequently asked questions', moreTools: 'More tools' },
  zh: { home: '首页', tools: '工具', guides: '指南', updated: '更新于', published: '发布于', howTo: '使用方法', faq: '常见问题', moreTools: '更多工具' },
} satisfies Record<Locale, Record<string, string>>

/** YYYY-MM-DD as a long date, fixed to UTC so server and browser print the same text. */
export const formatDate = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))

/** Client-side link to a default-language path; the current language is applied here. */
export function PathLink({ path, locale, className, children }: { path: string; locale: Locale; className?: string; children: ReactNode }) {
  // The path is data (content files, MDX), so it cannot be checked against the route tree.
  return (
    <Link className={className} to={localizePath(locale, path) as '/{-$locale}/'}>
      {children}
    </Link>
  )
}

export function Breadcrumb({ items }: { items: { label: string; path?: string }[] }) {
  const locale = useLocale()
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {[{ label: labels[locale].home, path: '/' }, ...items].map((item, i, all) => (
          <li className="flex items-center gap-2" key={item.label}>
            {i > 0 && <span aria-hidden>›</span>}
            {item.path && i < all.length - 1 ? (
              <PathLink className="hover:text-foreground hover:underline" locale={locale} path={item.path}>
                {item.label}
              </PathLink>
            ) : (
              <span aria-current={i === all.length - 1 ? 'page' : undefined}>{item.label}</span>
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

export function HubPage({ title, lede, entries, crumb }: { title: string; lede: ReactNode; entries: HubEntry[]; crumb: string }) {
  const locale = useLocale()
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb items={[{ label: crumb }]} />
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
