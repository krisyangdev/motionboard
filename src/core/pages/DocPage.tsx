// Template for MDX pages (guides and legal).
import type React from 'react'
import { use, useMemo, type ComponentType } from 'react'
import { loadDoc, loadedDoc, type Collection, type DocFrontmatter } from '@/core/content/docs'
import type { Locale } from '@/core/i18n'
import { articleLd, breadcrumbLd, seoHead } from '@/core/seo'
import { Breadcrumb, formatDate, labels, LCP, PathLink } from './HubPage'

export function docHead(fm: DocFrontmatter, locale: Locale, path: string, collection: Collection) {
  const guide = collection === 'guides'
  return seoHead({
    title: fm.title,
    description: fm.description,
    path,
    locale,
    type: guide ? 'article' : 'website',
    jsonLd: guide
      ? [
          articleLd({ headline: fm.title, description: fm.description, locale, path, datePublished: fm.date, dateModified: fm.updated }),
          breadcrumbLd(locale, [[labels[locale].guides, '/guides/'], [fm.title, path]]),
        ]
      : undefined,
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
  const l = labels[locale]
  // Loaded by the route loader on the server; the browser loads it itself while hydrating.
  const doc = loadedDoc(collection, locale, slug) ?? use(loadDoc(collection, locale, slug))
  const components = useMemo(() => mdxComponents(locale), [locale])
  const crumb = collection === 'guides' ? [{ label: l.guides, path: '/guides/' }, { label: fm.title }] : [{ label: fm.title }]
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb items={crumb} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {fm.title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {fm.updated ? l.updated : l.published} <time dateTime={fm.updated ?? fm.date}>{formatDate(fm.updated ?? fm.date, locale)}</time>
      </p>
      <article className="prose mt-8">{doc && <doc.Component components={components} />}</article>
    </main>
  )
}
