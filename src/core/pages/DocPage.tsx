// Template for MDX pages (guides and legal).
import type React from 'react'
import { use, useMemo, type ComponentType } from 'react'
import { docPath, isGuide, loadDoc, loadedDoc, type Collection, type DocFrontmatter } from '@/core/content/docs'
import { pageH1 } from '@/core/content/h1'
import { formatDate, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { articleLd, seoHead } from '@/core/seo'
import { Breadcrumb, LCP, PathLink, trail } from './HubPage'

/** The breadcrumb of a doc page: shown by the page and written to its JSON-LD. */
const docCrumbs = (fm: DocFrontmatter, locale: Locale, path: string, collection: Collection) =>
  trail(locale, ...(collection === 'guides' ? [{ name: coreMessages[locale].page.guides, path: '/guides/' }] : []), { name: fm.title, path })

/** `locales`: every language the page exists in (for hreflang). */
export function docHead(fm: DocFrontmatter, locale: Locale, locales: readonly Locale[], path: string, collection: Collection) {
  const guide = isGuide(fm)
  return seoHead({
    title: fm.title,
    description: fm.description,
    path,
    locale,
    locales,
    type: guide ? 'article' : 'website',
    image: guide ? fm.ogImage : undefined,
    breadcrumb: docCrumbs(fm, locale, path, collection),
    jsonLd: guide ? [articleLd({ headline: pageH1(fm), description: fm.description, locale, path, datePublished: fm.published, dateModified: fm.updated, image: fm.ogImage })] : undefined,
  })
}

// Markdown links starting with "/" are default-language paths: render them as router links in the current language.
function mdxComponents(locale: Locale): Record<string, ComponentType<any>> {
  return {
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

export function DocPage({ collection, slug, fm, locale }: { collection: Collection; slug: string; fm: DocFrontmatter; locale: Locale }) {
  const l = coreMessages[locale].page
  // Loaded by the route loader on the server; the browser loads it itself while hydrating.
  const doc = loadedDoc(collection, locale, slug) ?? use(loadDoc(collection, locale, slug))
  const components = useMemo(() => mdxComponents(locale), [locale])
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={docCrumbs(fm, locale, docPath(collection, slug), collection)} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {pageH1(fm)}
      </h1>
      {isGuide(fm) && <p className="mt-3 text-lg text-muted-foreground">{fm.lede}</p>}
      <p className="mt-3 text-sm text-muted-foreground">
        {l.updated} <time dateTime={fm.updated}>{formatDate(locale, fm.updated)}</time>
      </p>
      <article className="prose mt-8">{doc && <doc.Component components={components} />}</article>
    </main>
  )
}
