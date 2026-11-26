// Template for a comparison (content/compare/<lang>/<a>-vs-<b>.mdx, spec §1.5).
// Order: breadcrumb, h1, lede, byline, disclosure, short answer, table, body, pricing, sources, FAQ.
import { use, useMemo } from 'react'
import { notFound } from '@tanstack/react-router'
import { loadDoc, loadedDoc } from '@/core/content/docs'
import { existingLocales, isSitePage, seoState } from '@/core/content/exists'
import { pageH1 } from '@/core/content/h1'
import { typedPath } from '@/core/content/hubs'
import type { CompareFrontmatter } from '@/core/content/schema'
import { formatDate, paramLocale, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { mdxComponents } from '@/core/pages/DocPage'
import { articleLd, seoHead } from '@/core/seo'
import { Breadcrumb, trail } from '@/core/ui/page/Breadcrumb'
import { Byline } from '@/core/ui/page/Byline'
import { CompareTable } from '@/core/ui/page/CompareTable'
import { FaqList } from '@/core/ui/page/FaqList'
import { LCP } from '@/core/ui/page/link'
import { SourcesList } from '@/core/ui/page/SourcesList'
import { slots } from '@/site/slots'

const comparePath = (slug: string) => typedPath('compare', slug)

/** The breadcrumb: shown by the page and written to its JSON-LD (the Compare level only where the compare hub exists). */
const compareCrumbs = (fm: CompareFrontmatter, locale: Locale, slug: string) =>
  trail(locale, ...(isSitePage(locale, '/compare/') ? [{ name: coreMessages[locale].page.compare, path: '/compare/' }] : []), { name: pageH1(fm), path: comparePath(slug) })

export function compareHead(fm: CompareFrontmatter, locale: Locale, slug: string) {
  const path = comparePath(slug)
  return seoHead({
    title: fm.title,
    description: fm.description,
    path,
    locale,
    ...seoState(path, locale),
    type: 'article',
    image: fm.ogImage,
    breadcrumb: compareCrumbs(fm, locale, slug),
    jsonLd: [articleLd({ headline: pageH1(fm), description: fm.description, locale, path, datePublished: fm.published, dateModified: fm.updated, image: fm.ogImage })],
  })
}

/** Route loader: 404 when the language has no file (never another language's text). */
export async function loadComparePage(localeParam: string | undefined, slug: string) {
  const locale = paramLocale(localeParam)
  const doc = await loadDoc('compare', locale, slug)
  if (!doc) throw notFound()
  return { fm: doc.frontmatter, locales: existingLocales(comparePath(slug)) }
}

const H2 = 'text-xl font-semibold tracking-tight'

export function ComparePage({ slug, fm, locale }: { slug: string; fm: CompareFrontmatter; locale: Locale }) {
  const l = coreMessages[locale].page
  const doc = loadedDoc('compare', locale, slug) ?? use(loadDoc('compare', locale, slug))
  const components = useMemo(() => mdxComponents(locale), [locale])
  const ctx = { type: 'compare', slug, locale } as const
  const ours = fm.products.find((p) => p.relation === 'ours')
  const others = fm.products.filter((p) => p.relation === 'third-party')
  const checked = fm.sources.map((s) => s.checked).sort()[0] ?? fm.updated
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={compareCrumbs(fm, locale, slug)} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {pageH1(fm)}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{fm.lede}</p>
      <Byline locale={locale} updated={fm.updated} />
      {ours && others.length > 0 && (
        <p className="mt-2 text-sm text-muted-foreground" data-disclosure>
          {l.disclosure(ours.name, others.map((o) => o.name).join(', '), formatDate(locale, checked))}
        </p>
      )}
      {slots.afterLede?.(ctx)}
      <section className="mt-8 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{l.shortAnswer}</h2>
        <p className="mt-2">{fm.verdict}</p>
      </section>
      <CompareTable locale={locale} products={[fm.products[0].name, fm.products[1].name]} rows={fm.table} />
      <article className="prose mt-8">{doc && <doc.Component components={components} />}</article>
      {fm.pricing && (
        <section className="mt-12">
          <h2 className={H2}>{l.pricing}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{l.pricingAsOf(formatDate(locale, fm.pricing.asOf))}</p>
          <dl className="mt-3 space-y-1">
            {([fm.products[0], fm.products[1]] as const).map((p, i) => (
              <div className="flex flex-wrap gap-x-2" key={p.name}>
                <dt className="font-medium">{p.name}</dt>
                <dd className="text-muted-foreground">{i === 0 ? fm.pricing!.a : fm.pricing!.b}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <section className="mt-12">
        <h2 className={H2}>{l.sources}</h2>
        <SourcesList locale={locale} sources={fm.sources} />
      </section>
      {fm.faq && fm.faq.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.faq}</h2>
          <FaqList items={fm.faq} />
        </section>
      )}
      {slots.afterContent?.(ctx)}
    </main>
  )
}
