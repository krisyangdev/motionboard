import type { ReactNode } from 'react'
import type { Locale } from '@/core/i18n'
import type { Entry } from '@/core/content/members'
import { PathLink } from './link'

/** The default card of a grid. */
export function EntryCard({ entry, locale }: { entry: Entry; locale: Locale }) {
  return (
    <PathLink
      className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground shadow-xs/5 transition-colors hover:bg-muted"
      locale={locale}
      path={entry.href}
    >
      <span className="font-medium">{entry.title}</span>
      {entry.description && <span className="text-sm text-muted-foreground">{entry.description}</span>}
    </PathLink>
  )
}

/** A grid of cards (hub members, related pages). `card` replaces the default card (a site slot). */
export function RelatedGrid({ entries, locale, card }: { entries: Entry[]; locale: Locale; card?: (entry: Entry, locale: Locale) => ReactNode }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {entries.map((e) => (
        <li key={e.href}>{card ? card(e, locale) : <EntryCard entry={e} locale={locale} />}</li>
      ))}
    </ul>
  )
}
