// Template for a glossary term (content/glossary/<lang>/<slug>.mdx, spec §1.6).
// Order: breadcrumb, h1, lede, byline, definition, body, example, try it, see also, FAQ.
import { use, useMemo } from 'react'
import { notFound } from '@tanstack/react-router'
import { loadDoc, loadedDoc } from '@/core/content/docs'
import { existingLocales, isSitePage, seoState } from '@/core/content/exists'
import { pageH1 } from '@/core/content/h1'
import { typedPath } from '@/core/content/hubs'
import type { GlossaryFrontmatter } from '@/core/content/schema'
import { pageUrl, paramLocale, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { mdxComponents } from '@/core/pages/DocPage'
import { definedTermLd, seoHead } from '@/core/seo'
import { Breadcrumb, trail } from '@/core/ui/page/Breadcrumb'
import { Byline } from '@/core/ui/page/Byline'
import { FaqList } from '@/core/ui/page/FaqList'
import { LCP, PathLink } from '@/core/ui/page/link'
import { slots } from '@/site/slots'

const glossaryPath = (slug: string) => typedPath('glossary', slug)

/** The breadcrumb: shown by the page and written to its JSON-LD (the Glossary level only where the index exists). */
const glossaryCrumbs = (fm: GlossaryFrontmatter, locale: Locale, slug: string) =>
  trail(locale, ...(isSitePage(locale, '/glossary/') ? [{ name: coreMessages[locale].page.glossary, path: '/glossary/' }] : []), { name: pageH1(fm), path: glossaryPath(slug) })

export function glossaryHead(fm: GlossaryFrontmatter, locale: Locale, slug: string) {
  const path = glossaryPath(slug)
  const l = coreMessages[locale].page
  return seoHead({
    title: fm.title,
    description: fm.description,
    path,
    locale,
    ...seoState(path, locale),
    type: 'website',
    image: fm.ogImage,
    breadcrumb: glossaryCrumbs(fm, locale, slug),
    jsonLd: [definedTermLd({ name: pageH1(fm), description: fm.definition, locale, path, setName: l.glossary, setUrl: isSitePage(locale, '/glossary/') ? pageUrl(locale, '/glossary/') : undefined })],
  })
}

/** Route loader: 404 when the language has no file (never another language's text). */
export async function loadGlossaryPage(localeParam: string | undefined, slug: string) {
  const locale = paramLocale(localeParam)
  const doc = await loadDoc('glossary', locale, slug)
  if (!doc) throw notFound()
  return { fm: doc.frontmatter, locales: existingLocales(glossaryPath(slug)) }
}

const H2 = 'text-xl font-semibold tracking-tight'

export function GlossaryPage({ slug, fm, locale }: { slug: string; fm: GlossaryFrontmatter; locale: Locale }) {
  const l = coreMessages[locale].page
  const doc = loadedDoc('glossary', locale, slug) ?? use(loadDoc('glossary', locale, slug))
  const components = useMemo(() => mdxComponents(locale), [locale])
  const ctx = { type: 'glossary', slug, locale } as const
  const list = 'mt-3 list-disc space-y-1 pl-5'
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={glossaryCrumbs(fm, locale, slug)} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {pageH1(fm)}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{fm.lede}</p>
      <Byline locale={locale} updated={fm.updated} />
      {slots.afterLede?.(ctx)}
      <section className="mt-8 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{l.definition}</h2>
        <p className="mt-2 text-lg">{fm.definition}</p>
      </section>
      <article className="prose mt-8">{doc && <doc.Component components={components} />}</article>
      <section className="mt-12">
        <h2 className={H2}>{l.example}</h2>
        <figure className="mt-4 rounded-xl border bg-card p-4">
          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm">{fm.example.text}</pre>
          <figcaption className="mt-3 text-sm text-muted-foreground">{fm.example.caption}</figcaption>
        </figure>
      </section>
      {fm.useIt.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.tryIt}</h2>
          <ul className={list}>
            {fm.useIt.map((u) => (
              <li key={u.path}>
                <PathLink className="text-brand underline underline-offset-4" locale={locale} path={u.path}>
                  {u.name}
                </PathLink>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="mt-12">
        <h2 className={H2}>{l.seeAlso}</h2>
        <ul className={list}>
          {fm.seeAlso.map((u) => (
            <li key={u.path}>
              <PathLink className="text-brand underline underline-offset-4" locale={locale} path={u.path}>
                {u.name}
              </PathLink>
            </li>
          ))}
        </ul>
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
