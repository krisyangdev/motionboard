// Template for the changelog (content/changelog/changelog.json at /changelog/, spec §1.9): one page, newest entry first,
// each entry a <section id="<date>-<slug>"> with an H2, its date and bullets. 50 entries per page; more continue at
// /changelog/page/<n>/ (prerendered, self-canonical, never in the sitemap). RSS: /changelog/rss.xml.
import { notFound } from '@tanstack/react-router'
import { existingLocales, seoState } from '@/core/content/exists'
import { pageH1 } from '@/core/content/h1'
import { CHANGELOG_PAGE_SIZE, CHANGELOG_PATH, hubPageCount, hubPagePath, hubPageSlice } from '@/core/content/hubs'
import { loadPageFile } from '@/core/content/pagefiles'
import type { ChangelogText } from '@/core/content/schema'
import { formatDate, paramLocale, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { seoHead } from '@/core/seo'
import { Breadcrumb, trail } from '@/core/ui/page/Breadcrumb'
import { LCP } from '@/core/ui/page/link'
import { Pagination } from '@/core/ui/page/Pagination'
import { SITE } from '../../../site.config.ts'

export type Changelog = {
  updated: string
  ogImage?: string
  text: ChangelogText
  /** Page number, 1 = /changelog/. */
  n: number
  pages: number
  /** The entries shown on this page. */
  entries: ChangelogText['entries']
  locales: readonly Locale[]
  /** Languages for the hreflang set of this page: the indexable ones that have page `n`. */
  hreflang: readonly Locale[]
}

/** Route loader of page `n`: 404 when the language has no changelog or the page does not exist. */
export async function loadChangelog(localeParam: string | undefined, n: number): Promise<Changelog> {
  const locale = paramLocale(localeParam)
  const file = await loadPageFile('changelog', 'changelog')
  const text = file?.[locale]
  if (!file || !text) throw notFound()
  const pages = hubPageCount(text.entries.length, CHANGELOG_PAGE_SIZE)
  if (!Number.isInteger(n) || n < 1 || n > pages) throw notFound()
  const hreflang = seoState(CHANGELOG_PATH, locale).locales.filter((l) => hubPageCount(file[l]?.entries.length ?? 0, CHANGELOG_PAGE_SIZE) >= n)
  return { updated: file.updated, ogImage: file.ogImage, text, n, pages, entries: hubPageSlice(text.entries, n, CHANGELOG_PAGE_SIZE), locales: existingLocales(CHANGELOG_PATH), hreflang }
}

const crumbs = (c: Changelog, locale: Locale) =>
  trail(locale, { name: pageH1(c.text), path: CHANGELOG_PATH }, ...(c.n > 1 ? [{ name: coreMessages[locale].page.pageN(c.n), path: hubPagePath(CHANGELOG_PATH, c.n) }] : []))

export function changelogHead(c: Changelog, locale: Locale) {
  const suffix = c.n > 1 ? ` – ${coreMessages[locale].page.pageN(c.n)}` : ''
  const head = seoHead({
    title: `${c.text.title}${suffix}`,
    description: c.text.description,
    path: hubPagePath(CHANGELOG_PATH, c.n),
    locale,
    locales: c.hreflang,
    // A page of a noindex changelog is noindex as well.
    noindex: seoState(CHANGELOG_PATH, locale).noindex,
    type: 'website',
    image: c.ogImage,
    breadcrumb: crumbs(c, locale),
  })
  return { ...head, links: [...head.links, { rel: 'alternate', type: 'application/rss+xml', title: `${SITE.name}: ${pageH1(c.text)}`, href: `${CHANGELOG_PATH}rss.xml` }] }
}

export function ChangelogPage({ c, locale }: { c: Changelog; locale: Locale }) {
  const l = coreMessages[locale].page
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={crumbs(c, locale)} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {c.n > 1 ? `${pageH1(c.text)} – ${l.pageN(c.n)}` : pageH1(c.text)}
      </h1>
      {c.n === 1 && <p className="mt-3 text-lg text-muted-foreground">{c.text.lede}</p>}
      <p className="mt-3 text-sm text-muted-foreground">
        {l.updated} <time dateTime={c.updated}>{formatDate(locale, c.updated)}</time> ·{' '}
        <a className="underline underline-offset-4 hover:text-foreground" href={`${CHANGELOG_PATH}rss.xml`}>
          {l.rss}
        </a>
      </p>
      <div className="mt-8 space-y-10">
        {c.entries.map((e) => {
          const id = `${e.date}-${e.slug}`
          return (
            <section id={id} key={id}>
              <h2 className="text-xl font-semibold tracking-tight">
                <a className="hover:underline" href={`#${id}`}>
                  {e.title}
                </a>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <time dateTime={e.date}>{formatDate(locale, e.date)}</time>
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
                {e.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
      <Pagination hubPath={CHANGELOG_PATH} locale={locale} page={c.n} pages={c.pages} />
    </main>
  )
}
