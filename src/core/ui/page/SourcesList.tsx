import { formatDate, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'

/** Third-party sources of a page: label, link, date checked. */
export function SourcesList({ sources, locale }: { sources: readonly { label: string; url: string; checked: string }[]; locale: Locale }) {
  const l = coreMessages[locale].page
  return (
    <ul className="mt-4 space-y-2 text-sm">
      {sources.map((s) => (
        <li key={s.url}>
          <a className="text-brand underline underline-offset-4" href={s.url} rel="noopener" target="_blank">
            {s.label}
          </a>{' '}
          <span className="text-muted-foreground">
            ({l.checked} <time dateTime={s.checked}>{formatDate(locale, s.checked)}</time>)
          </span>
        </li>
      ))}
    </ul>
  )
}
