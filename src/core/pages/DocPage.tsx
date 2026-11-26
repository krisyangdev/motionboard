// Template for MDX pages: guides, the about page and legal pages.
// Guide order: breadcrumb, h1, lede, byline, body, sources, FAQ, related. About: breadcrumb, h1, lede, body, FAQ. Legal: breadcrumb, h1, date, body.
import type React from 'react'
import { use, useMemo, type ComponentType } from 'react'
import { notFound } from '@tanstack/react-router'
import { docPath, isGuide, loadDoc, loadedDoc, type DocCollection, type DocFrontmatter } from '@/core/content/docs'
import { existingLocales, pageExists, seoState } from '@/core/content/exists'
import { pageH1 } from '@/core/content/h1'
import { relatedEntries, type Entry } from '@/core/content/members'
import { formatDate, paramLocale, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { articleLd, organizationLd, seoHead } from '@/core/seo'
import { Breadcrumb, trail } from '@/core/ui/page/Breadcrumb'
import { Byline } from '@/core/ui/page/Byline'
import { Evidence } from '@/core/ui/page/Evidence'
import { FaqList } from '@/core/ui/page/FaqList'
import { LCP, PathLink } from '@/core/ui/page/link'
import { RelatedGrid } from '@/core/ui/page/RelatedGrid'
import { SourcesList } from '@/core/ui/page/SourcesList'
import { slots } from '@/site/slots'

/** The breadcrumb of a doc page: shown by the page and written to its JSON-LD (a guide's Guides level only where the hub exists). */
const docCrumbs = (fm: DocFrontmatter, locale: Locale, path: string, collection: DocCollection) =>
  trail(locale, ...(collection === 'guides' && pageExists(locale, '/guides/') ? [{ name: coreMessages[locale].page.guides, path: '/guides/' }] : []), { name: fm.title, path })

export function docHead(fm: DocFrontmatter, locale: Locale, path: string, collection: DocCollection) {
  const guide = isGuide(fm)
  return seoHead({
    title: fm.title,
    description: fm.description,
    path,
    locale,
    ...seoState(path, locale),
    type: guide ? 'article' : 'website',
    image: guide ? fm.ogImage : undefined,
    breadcrumb: docCrumbs(fm, locale, path, collection),
    jsonLd: guide
      ? [articleLd({ headline: pageH1(fm), description: fm.description, locale, path, datePublished: fm.published, dateModified: fm.updated, image: fm.ogImage })]
      : collection === 'about'
        ? [organizationLd()]
        : undefined,
  })
}

/** Route loader of a doc page: 404 when the language has no file (never another language's text). */
export async function loadDocPage(collection: DocCollection, localeParam: string | undefined, slug: string) {
  const locale = paramLocale(localeParam)
  const doc = await loadDoc(collection, locale, slug)
  if (!doc) throw notFound()
  const fm = doc.frontmatter
  // A guide's related block: its `related` slugs, guides first, then tools.
  const related = isGuide(fm) ? relatedEntries(fm.related, locale, ['guides', 'tools']) : []
  return { fm, related, locales: existingLocales(docPath(collection, slug)) }
}

// Markdown links starting with "/" are default-language paths: render them as router links in the current language.
export function mdxComponents(locale: Locale): Record<string, ComponentType<any>> {
  return {
    Evidence,
    a: ({ href = '', children, ...props }: React.ComponentProps<'a'>) =>
      href.startsWith('/') ? (
        <PathLink locale={locale} path={href}>
          {children}
        </PathLink>
      ) : (
        <a href={href} {...props}>
          {children}
        </a>
      ),
  }
}

const H2 = 'text-xl font-semibold tracking-tight'

export function DocPage({ collection, slug, fm, related, locale }: { collection: DocCollection; slug: string; fm: DocFrontmatter; related: Entry[]; locale: Locale }) {
  const l = coreMessages[locale].page
  // Loaded by the route loader on the server; the browser loads it itself while hydrating.
  const doc = loadedDoc(collection, locale, slug) ?? use(loadDoc(collection, locale, slug))
  const components = useMemo(() => mdxComponents(locale), [locale])
  const ctx = { type: collection === 'guides' ? 'guide' : collection, slug, locale } as const
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={docCrumbs(fm, locale, docPath(collection, slug), collection)} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {pageH1(fm)}
      </h1>
      {'lede' in fm && <p className="mt-3 text-lg text-muted-foreground">{fm.lede}</p>}
      {collection === 'guides' ? (
        <Byline locale={locale} updated={fm.updated} />
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {l.updated} <time dateTime={fm.updated}>{formatDate(locale, fm.updated)}</time>
        </p>
      )}
      {slots.afterLede?.(ctx)}
      <article className="prose mt-8">{doc && <doc.Component components={components} />}</article>
      {isGuide(fm) && fm.sources && fm.sources.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.sources}</h2>
          <SourcesList locale={locale} sources={fm.sources} />
        </section>
      )}
      {'faq' in fm && fm.faq && fm.faq.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.faq}</h2>
          <FaqList items={fm.faq} />
        </section>
      )}
      {slots.afterContent?.(ctx)}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.related}</h2>
          <div className="mt-4">
            <RelatedGrid card={slots.card} entries={related} locale={locale} />
          </div>
        </section>
      )}
    </main>
  )
}
