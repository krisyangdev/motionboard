// The one SEO head function: page data in, meta / canonical / hreflang / Open Graph / JSON-LD out.
// Every route's head() goes through seoHead(); the sitemap in vite.config.ts uses the same paths.
import { notFound } from '@tanstack/react-router'
import { HERO_FILM } from '@/data/hero'
import { OG_LOCALE, STRINGS } from '@/i18n'
import { bySlug, loadText, media, recipePath, termName, type RecipeText, type Term } from '@/data/terms'
import { absolute, alternateUrls, BRAND, SITE, SITE_URL, type Locale } from '@/site.config'

/** Absolute URL of a page; `path` is the English path, starting with a slash. */
export const pageUrl = (locale: Locale, path: string) => `${SITE_URL}${locale === 'zh' ? '/zh' : ''}${path}`

export const IN_LANGUAGE: Record<Locale, string> = { en: 'en', zh: 'zh-CN' }

/** hreflang alternates of an English path, also used for the sitemap */
export const alternates = (path: string) => alternateUrls(path).map((a) => ({ hrefLang: a.lang, href: a.href }))

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
    { name: 'twitter:card', content: SITE.social.twitterCard },
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

/** Date the preview films were published, for VideoObject.uploadDate */
const FILM_UPLOAD_DATE = '2026-10-30'

export const homeHead = (locale: Locale) =>
  seoHead({
    title: BRAND.title[locale],
    description: BRAND.line[locale],
    path: '/',
    lang: locale,
    type: 'website',
    image: absolute(HERO_FILM.cover),
    jsonLd: [
      {
        '@type': 'WebSite',
        name: BRAND.name,
        url: pageUrl(locale, '/'),
        inLanguage: IN_LANGUAGE[locale],
        description: BRAND.line[locale],
      },
    ],
  })

export function recipeHead(locale: Locale, t: Term, text: RecipeText) {
  const path = recipePath(t)
  const url = pageUrl(locale, path)
  const name = termName(t, locale)
  const image = absolute(media(t, 'jpg'))
  const video = absolute(media(t, 'mp4'))
  const { title, description, faq } = text.seo
  return seoHead({
    title,
    description,
    path,
    lang: locale,
    image,
    video,
    jsonLd: [
      {
        '@type': 'VideoObject',
        name,
        description,
        thumbnailUrl: image,
        contentUrl: video,
        uploadDate: FILM_UPLOAD_DATE,
        duration: `PT${t.dur}S`,
        inLanguage: IN_LANGUAGE[locale],
        url,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: BRAND.name, item: pageUrl(locale, '/') },
          { '@type': 'ListItem', position: 2, name, item: url },
        ],
      },
    ],
  })
}

export const savedHead = (locale: Locale) =>
  seoHead({ title: STRINGS[locale].saved.title, description: BRAND.line[locale], path: '/saved/', lang: locale, noindex: true })
