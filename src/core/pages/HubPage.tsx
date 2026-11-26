// Template for a hub: the page at /<collection>/ that lists the collection's indexable members, 60 per page
// (or `pageSize` of the hub file); further pages live at /<collection>/page/<n>/ (route files `page/$n.tsx`).
// Order: breadcrumb, h1, lede, intro, members, pagination, sections, FAQ. Page 2 and up show only the members.
import { notFound } from '@tanstack/react-router'
import { existingLocales, pageExists, seoState } from '@/core/content/exists'
import { pageH1 } from '@/core/content/h1'
import { HUB_PAGE_SIZE, hubPageCount, hubPagePath, hubPageSlice } from '@/core/content/hubs'
import { members, type Entry } from '@/core/content/members'
import type { HubCollection, HubFile, HubText } from '@/core/content/schema'
import { paramLocale, type Locale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { coreMessages } from '@/core/messages'
import { seoHead } from '@/core/seo'
import { Breadcrumb, trail } from '@/core/ui/page/Breadcrumb'
import { FaqList } from '@/core/ui/page/FaqList'
import { LCP } from '@/core/ui/page/link'
import { Pagination } from '@/core/ui/page/Pagination'
import { RelatedGrid } from '@/core/ui/page/RelatedGrid'
import { slots } from '@/site/slots'

// The account and sign-in pages (layer 1) import PathLink from here.
export { PathLink } from '@/core/ui/page/link'

const hubFiles = import.meta.glob<HubFile>('/content/hubs/*.json', { import: 'default' })

export type HubData = {
  collection: HubCollection
  /** Page number, 1 = the hub itself. */
  n: number
  pages: number
  text: HubText
  /** The members shown on this page. */
  entries: Entry[]
  /** Languages the hub exists in (language switcher). */
  locales: readonly Locale[]
  /** Languages for the hreflang set of this page: the indexable ones that have page `n`. */
  hreflang: readonly Locale[]
}

const hubPath = (collection: HubCollection) => `/${collection}/`

/**
 * Route loader of a hub page. 404 when the hub does not exist in the language (no hub text or no member there)
 * or page `n` does not exist.
 */
export async function loadHub(collection: HubCollection, localeParam: string | undefined, n: number): Promise<HubData> {
  const locale = paramLocale(localeParam)
  const path = hubPath(collection)
  if (!pageExists(locale, path)) throw notFound()
  const file = await hubFiles[`/content/hubs/${collection}.json`]?.()
  const text = file?.[locale]
  if (!file || !text) throw notFound()
  const size = file.pageSize ?? HUB_PAGE_SIZE
  const pages = hubPageCount(members(collection, locale).length, size)
  if (!Number.isInteger(n) || n < 1 || n > pages) throw notFound()
  const hreflang = seoState(path, locale).locales.filter((l) => hubPageCount(members(collection, l).length, size) >= n)
  return { collection, n, pages, text, entries: hubPageSlice(members(collection, locale), n, size), locales: existingLocales(path), hreflang }
}

/** The breadcrumb of a hub page: shown by the page and written to its JSON-LD. Page 2 and up add a level for the page. */
const hubCrumbs = (collection: HubCollection, n: number, locale: Locale) => {
  const m = coreMessages[locale].page
  return trail(locale, { name: m[collection], path: hubPath(collection) }, ...(n > 1 ? [{ name: m.pageN(n), path: hubPagePath(hubPath(collection), n) }] : []))
}

export function hubHead(d: HubData, locale: Locale) {
  const suffix = d.n > 1 ? ` – ${coreMessages[locale].page.pageN(d.n)}` : ''
  return seoHead({
    title: `${d.text.title}${suffix}`,
    description: d.text.description,
    path: hubPagePath(hubPath(d.collection), d.n),
    locale,
    locales: d.hreflang,
    // A page of a noindex hub is noindex as well.
    noindex: seoState(hubPath(d.collection), locale).noindex,
    type: 'website',
    breadcrumb: hubCrumbs(d.collection, d.n, locale),
  })
}

const H2 = 'text-xl font-semibold tracking-tight'

export function HubPage({ data }: { data: HubData }) {
  const locale = useLocale()
  const { collection, n, pages, text, entries } = data
  const ctx = { type: 'hub', locale } as const
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={hubCrumbs(collection, n, locale)} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {n > 1 ? `${pageH1(text)} – ${coreMessages[locale].page.pageN(n)}` : pageH1(text)}
      </h1>
      {n === 1 && (
        <>
          <p className="mt-3 text-lg text-muted-foreground">{text.lede}</p>
          {slots.afterLede?.(ctx)}
          <p className="mt-4 text-muted-foreground">{text.intro}</p>
        </>
      )}
      <div className="mt-8">
        <RelatedGrid card={slots.card} entries={entries} locale={locale} />
      </div>
      <Pagination hubPath={hubPath(collection)} locale={locale} page={n} pages={pages} />
      {n === 1 && (
        <>
          {text.sections?.map((s) => (
            <section className="mt-12" key={s.h2}>
              <h2 className={H2}>{s.h2}</h2>
              <p className="mt-3 text-muted-foreground">{s.body}</p>
            </section>
          ))}
          {text.faq && text.faq.length > 0 && (
            <section className="mt-12">
              <h2 className={H2}>{coreMessages[locale].page.faq}</h2>
              <FaqList items={text.faq} />
            </section>
          )}
          {slots.afterContent?.(ctx)}
        </>
      )}
    </main>
  )
}
