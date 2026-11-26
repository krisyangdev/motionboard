import { pageExists } from '@/core/content/exists'
import { formatDate, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { SITE } from '../../../../site.config.ts'
import { PathLink } from './link'

/** "By <site> · Updated <date>": for guides and other written pages, not for tools. The author is the site organization (links to /about/ when that page exists in the language). */
export function Byline({ locale, updated }: { locale: Locale; updated: string }) {
  const l = coreMessages[locale].page
  return (
    <p className="mt-3 text-sm text-muted-foreground">
      {l.by}{' '}
      {pageExists(locale, '/about/') ? (
        <PathLink className="underline-offset-4 hover:text-foreground hover:underline" locale={locale} path="/about/">
          {SITE.name}
        </PathLink>
      ) : (
        SITE.name
      )}{' '}
      · {l.updated} <time dateTime={updated}>{formatDate(locale, updated)}</time>
    </p>
  )
}
