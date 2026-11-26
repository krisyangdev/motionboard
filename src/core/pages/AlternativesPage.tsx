// Template for an alternatives page (content/alternatives/<product>.json, spec §1.5).
// Order: breadcrumb, h1, lede, byline, disclosure, how we chose, the entries, sections, sources, FAQ.
import { notFound } from '@tanstack/react-router'
import { existingLocales, isSitePage, seoState } from '@/core/content/exists'
import { pageH1 } from '@/core/content/h1'
import { typedPath } from '@/core/content/hubs'
import { loadPageFile } from '@/core/content/pagefiles'
import type { AlternativesText } from '@/core/content/schema'
import { formatDate, paramLocale, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { articleLd, seoHead } from '@/core/seo'
import { Breadcrumb, trail } from '@/core/ui/page/Breadcrumb'
import { Byline } from '@/core/ui/page/Byline'
import { FaqList } from '@/core/ui/page/FaqList'
import { LCP, SiteLink } from '@/core/ui/page/link'
import { SourcesList } from '@/core/ui/page/SourcesList'
import { slots } from '@/site/slots'

export type Alternatives = { slug: string; published: string; updated: string; ogImage?: string; text: AlternativesText; locales: readonly Locale[] }

const alternativesPath = (slug: string) => typedPath('alternatives', slug)

const crumbs = (a: Alternatives, locale: Locale) => trail(locale, { name: pageH1(a.text), path: alternativesPath(a.slug) })

export function alternativesHead(a: Alternatives, locale: Locale) {
  const path = alternativesPath(a.slug)
  return seoHead({
    title: a.text.title,
    description: a.text.description,
    path,
    locale,
    ...seoState(path, locale),
    type: 'article',
    image: a.ogImage,
    breadcrumb: crumbs(a, locale),
    jsonLd: [articleLd({ headline: pageH1(a.text), description: a.text.description, locale, path, datePublished: a.published, dateModified: a.updated, image: a.ogImage })],
  })
}

/** Route loader: 404 when the language has no text for the page (never another language's text). */
export async function loadAlternativesPage(localeParam: string | undefined, slug: string): Promise<Alternatives> {
  const locale = paramLocale(localeParam)
  const path = alternativesPath(slug)
  if (!isSitePage(locale, path)) throw notFound()
  const file = await loadPageFile('alternatives', slug)
  const text = file?.[locale]
  if (!file || !text) throw notFound()
  return { slug, published: file.published, updated: file.updated, ogImage: file.ogImage, text, locales: existingLocales(path) }
}

const H2 = 'text-xl font-semibold tracking-tight'

export function AlternativesPage({ a, locale }: { a: Alternatives; locale: Locale }) {
  const l = coreMessages[locale].page
  const t = a.text
  const ctx = { type: 'alternatives', slug: a.slug, locale } as const
  const ours = t.entries.find((e) => e.relation === 'ours')
  const others = t.entries.filter((e) => e.relation === 'third-party')
  const checked = t.sources.map((s) => s.checked).sort()[0] ?? a.updated
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={crumbs(a, locale)} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {pageH1(t)}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{t.lede}</p>
      <Byline locale={locale} updated={a.updated} />
      {ours && others.length > 0 && (
        <p className="mt-2 text-sm text-muted-foreground" data-disclosure>
          {l.disclosure(ours.name, others.map((o) => o.name).join(', '), formatDate(locale, checked))}
        </p>
      )}
      {slots.afterLede?.(ctx)}
      <section className="mt-8">
        <h2 className={H2}>{l.criteria}</h2>
        <p className="mt-3 text-muted-foreground">{t.criteria}</p>
      </section>
      <ol className="mt-8 space-y-6">
        {t.entries.map((e) => (
          <li className="rounded-xl border bg-card p-4" key={e.name}>
            <h2 className="text-lg font-semibold tracking-tight">
              <SiteLink className="underline-offset-4 hover:underline" href={e.url} locale={locale}>
                {e.name}
              </SiteLink>
              {e.relation === 'ours' && <span className="ml-2 rounded-md bg-muted px-2 py-0.5 align-middle text-xs font-medium text-muted-foreground">{l.ours}</span>}
            </h2>
            <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div>
                <dt className="inline font-medium">{l.bestFor}: </dt>
                <dd className="inline text-muted-foreground">{e.bestFor}</dd>
              </div>
              <div>
                <dt className="inline font-medium">{l.price}: </dt>
                <dd className="inline text-muted-foreground">{e.price}</dd>
              </div>
            </dl>
            <p className="mt-3 text-muted-foreground">{e.notes}</p>
          </li>
        ))}
      </ol>
      {t.sections?.map((s) => (
        <section className="mt-12" key={s.h2}>
          <h2 className={H2}>{s.h2}</h2>
          <p className="mt-3 text-muted-foreground">{s.body}</p>
        </section>
      ))}
      <section className="mt-12">
        <h2 className={H2}>{l.sources}</h2>
        <SourcesList locale={locale} sources={t.sources} />
      </section>
      {t.faq && t.faq.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.faq}</h2>
          <FaqList items={t.faq} />
        </section>
      )}
      {slots.afterContent?.(ctx)}
    </main>
  )
}
