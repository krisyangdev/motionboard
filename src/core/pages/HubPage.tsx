// Template for a hub: the page at /<hub>/ that lists the hub's indexable members, 60 per page (or `pageSize` of the
// hub file); further pages live at /<hub>/page/<n>/ (route files `page/$n.tsx`). A hub id is `tools`, `guides`, a
// collection id or `<collection>/<category>`.
// Order: breadcrumb, h1, lede, intro, categories (collection hubs), members, pagination, sections, FAQ. Page 2 and up show only the members.
import { notFound } from '@tanstack/react-router'
import { existingLocales, isSitePage, pageExists, seoState } from '@/core/content/exists'
import { pageH1 } from '@/core/content/h1'
import { HUB_PAGE_SIZE, hubPageCount, hubPagePath, hubPageSlice } from '@/core/content/hubs'
import { hubName, members, subHubs, type Entry } from '@/core/content/members'
import type { HubFile, HubText } from '@/core/content/schema'
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

const hubFiles = import.meta.glob<HubFile>('/content/hubs/**/*.json', { import: 'default' })

export type HubData = {
  /** Hub id: `tools`, `guides`, a collection id or `<collection>/<category>`. */
  hub: string
  /** Page number, 1 = the hub itself. */
  n: number
  pages: number
  text: HubText
  /** The members shown on this page. */
  entries: Entry[]
  /** The category hubs of a collection hub (page 1 links them). */
  categories: Entry[]
  /** Languages the hub exists in (language switcher). */
  locales: readonly Locale[]
  /** Languages for the hreflang set of this page: the indexable ones that have page `n`. */
  hreflang: readonly Locale[]
}

const hubPath = (hub: string) => `/${hub}/`

/**
 * Route loader of a hub page. 404 when the hub does not exist in the language (no hub text or no member there)
 * or page `n` does not exist.
 */
export async function loadHub(hub: string, localeParam: string | undefined, n: number): Promise<HubData> {
  const locale = paramLocale(localeParam)
  const path = hubPath(hub)
  if (!pageExists(locale, path)) throw notFound()
  const file = await hubFiles[`/content/hubs/${hub}.json`]?.()
  const text = file?.[locale]
  if (!file || !text) throw notFound()
  const size = file.pageSize ?? HUB_PAGE_SIZE
  const all = await members(hub, locale)
  const pages = hubPageCount(all.length, size)
  if (!Number.isInteger(n) || n < 1 || n > pages) throw notFound()
  const indexed = seoState(path, locale).locales
  const counts = await Promise.all(indexed.map(async (l) => (l === locale ? all : await members(hub, l)).length))
  const hreflang = indexed.filter((_, k) => hubPageCount(counts[k], size) >= n)
  return { hub, n, pages, text, entries: hubPageSlice(all, n, size), categories: hub.includes('/') ? [] : subHubs(hub, locale), locales: existingLocales(path), hreflang }
}

/**
 * The breadcrumb of a hub page: shown by the page and written to its JSON-LD. A category hub sits under its collection
 * hub (where that exists in the language). Page 2 and up add a level for the page.
 */
const hubCrumbs = (hub: string, n: number, locale: Locale) => {
  const [collection] = hub.split('/')
  const up = hub.includes('/') && isSitePage(locale, hubPath(collection)) ? [{ name: hubName(collection, locale), path: hubPath(collection) }] : []
  const page = n > 1 ? [{ name: coreMessages[locale].page.pageN(n), path: hubPagePath(hubPath(hub), n) }] : []
  return trail(locale, ...up, { name: hubName(hub, locale), path: hubPath(hub) }, ...page)
}

export function hubHead(d: HubData, locale: Locale) {
  const suffix = d.n > 1 ? ` – ${coreMessages[locale].page.pageN(d.n)}` : ''
  return seoHead({
    title: `${d.text.title}${suffix}`,
    description: d.text.description,
    path: hubPagePath(hubPath(d.hub), d.n),
    locale,
    locales: d.hreflang,
    // A page of a noindex hub is noindex as well.
    noindex: seoState(hubPath(d.hub), locale).noindex,
    type: 'website',
    breadcrumb: hubCrumbs(d.hub, d.n, locale),
  })
}

const H2 = 'text-xl font-semibold tracking-tight'

export function HubPage({ data }: { data: HubData }) {
  const locale = useLocale()
  const { hub, n, pages, text, entries, categories } = data
  const ctx = { type: 'hub', locale } as const
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={hubCrumbs(hub, n, locale)} />
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
      {n === 1 && categories.length > 0 && (
        <section className="mt-8">
          <h2 className={H2}>{coreMessages[locale].page.categories}</h2>
          <div className="mt-4">
            <RelatedGrid entries={categories} locale={locale} />
          </div>
        </section>
      )}
      <div className="mt-8">
        <RelatedGrid card={slots.card} entries={entries} locale={locale} />
      </div>
      <Pagination hubPath={hubPath(hub)} locale={locale} page={n} pages={pages} />
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
