// The one SEO head function: page data in, meta / canonical / hreflang / Open Graph / JSON-LD out.
// Every route's head() goes through seoHead(); the sitemap in vite.config.ts uses the same paths.
import { notFound } from '@tanstack/react-router'
import { OG_LOCALE } from '@/i18n'
import { bySlug, loadText } from '@/data/terms'
import { BRAND, SITE_URL, type Locale } from '@/site'

/** Absolute URL of a page; `path` is the English path, starting with a slash. */
export const pageUrl = (locale: Locale, path: string) => `${SITE_URL}${locale === 'zh' ? '/zh' : ''}${path}`

export const IN_LANGUAGE: Record<Locale, string> = { en: 'en', zh: 'zh-CN' }

/** hreflang alternates of an English path, also used for the sitemap */
export const alternates = (path: string) => [
  { hrefLang: 'en', href: pageUrl('en', path) },
  { hrefLang: 'zh-CN', href: pageUrl('zh', path) },
  { hrefLang: 'x-default', href: pageUrl('en', path) },
]

export type SeoPage = {
  /** full <title>; the brand is appended unless it already contains it */
  title: string
  description: string
  /** English path, leading and trailing slash */
  path: string
  lang: Locale
  type?: 'website' | 'article'
  /** absolute image URL for Open Graph and Twitter */
  image?: string
  /** absolute video URL for og:video */
  video?: string
  /** JSON-LD nodes; wrapped in one @graph */
  jsonLd?: object[]
  noindex?: boolean
}

export function seoHead(p: SeoPage) {
  const title = p.title.includes(BRAND.name) ? p.title : `${p.title} · ${BRAND.name}`
  const url = pageUrl(p.lang, p.path)
  const meta: Record<string, string>[] = [
    { title },
    { name: 'description', content: p.description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: p.description },
    { property: 'og:type', content: p.type ?? 'article' },
    { property: 'og:url', content: url },
    { property: 'og:locale', content: OG_LOCALE[p.lang] },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]
  if (p.image) meta.push({ property: 'og:image', content: p.image }, { name: 'twitter:image', content: p.image })
  if (p.video) meta.push({ property: 'og:video', content: p.video })
  if (p.noindex) meta.push({ name: 'robots', content: 'noindex' })
  return {
    meta,
    links: p.noindex
      ? []
      : [{ rel: 'canonical', href: url }, ...alternates(p.path).map((a) => ({ rel: 'alternate', ...a }))],
    scripts: p.jsonLd?.length
      ? [{ type: 'application/ld+json', children: JSON.stringify({ '@context': 'https://schema.org', '@graph': p.jsonLd }) }]
      : [],
  }
}

/** Route loader of the recipe pages: the term and its long text in the page locale. */
export const loadRecipe =
  (locale: Locale) =>
  async ({ params }: { params: { slug: string } }) => {
    const term = bySlug[params.slug]
    if (!term) throw notFound()
    return { term, text: await loadText(term.slug, locale) }
  }
