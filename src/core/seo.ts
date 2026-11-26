// The one SEO head function: page data in, meta / canonical / hreflang / Open Graph / JSON-LD out.
// Every route's head() goes through seoHead(); the sitemap (src/core/pages.ts) uses the same paths.
import { SITE, SITE_URL } from '../../site.config.ts'
import { alternateUrls, HTML_LANG, LOCALES, OG_LOCALE, pageUrl, type Locale } from './i18n'

export type SeoPage = {
  /** <title>; the site name is appended unless the title already contains it. */
  title: string
  description: string
  /** Default-language path, leading and trailing slash. */
  path: string
  locale: Locale
  /** Languages the page exists in (default: every language); hreflang links are written for these only. */
  locales?: readonly Locale[]
  type?: 'website' | 'article'
  /** Open Graph image: absolute URL or a path on this site. Defaults to SITE.ogImage. */
  image?: string
  /** Absolute video URL for og:video. */
  video?: string
  /** JSON-LD nodes, wrapped in one @graph. Use the helpers below. */
  jsonLd?: object[]
  /** noindex pages get no canonical or hreflang links and stay out of the sitemap. */
  noindex?: boolean
}

/** Absolute URL for a path on this site, or an already absolute URL. */
export const absolute = (url: string) => (url.startsWith('/') ? `${SITE_URL}${url}` : url)

export function seoHead(p: SeoPage) {
  const title = p.title.includes(SITE.name) ? p.title : `${p.title} · ${SITE.name}`
  const url = pageUrl(p.locale, p.path)
  const image = absolute(p.image ?? SITE.ogImage)
  const meta: Record<string, string>[] = [
    { title },
    { name: 'description', content: p.description },
    { property: 'og:site_name', content: SITE.name },
    { property: 'og:title', content: title },
    { property: 'og:description', content: p.description },
    { property: 'og:type', content: p.type ?? 'article' },
    { property: 'og:url', content: url },
    { property: 'og:locale', content: OG_LOCALE[p.locale] },
    { property: 'og:image', content: image },
    { name: 'twitter:card', content: SITE.social.twitterCard },
    { name: 'twitter:image', content: image },
  ]
  if (SITE.social.twitter) meta.push({ name: 'twitter:site', content: SITE.social.twitter })
  if (p.video) meta.push({ property: 'og:video', content: p.video })
  if (p.noindex) meta.push({ name: 'robots', content: 'noindex' })
  return {
    meta,
    links: p.noindex
      ? []
      : [
          { rel: 'canonical', href: url },
          ...alternateUrls(p.path, p.locales ?? LOCALES).map((a) => ({ rel: 'alternate', hrefLang: a.lang, href: a.href })),
        ],
    scripts: p.jsonLd?.length
      ? [{ type: 'application/ld+json', children: JSON.stringify({ '@context': 'https://schema.org', '@graph': p.jsonLd }) }]
      : [],
  }
}

// JSON-LD helpers. Each returns one node for SeoPage.jsonLd.

export const websiteLd = (locale: Locale) => ({
  '@type': 'WebSite',
  name: SITE.name,
  url: pageUrl(locale, '/'),
  inLanguage: HTML_LANG[locale],
  description: SITE.description[locale],
})

export const organizationLd = () => ({
  '@type': 'Organization',
  name: SITE.name,
  url: SITE_URL,
  email: SITE.email,
  logo: absolute('/favicon.svg'),
})

/** Breadcrumb from the home page; `items` are [name, default-language path] after home. */
export const breadcrumbLd = (locale: Locale, items: [name: string, path: string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [[SITE.name, '/'] as [string, string], ...items].map(([name, path], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item: pageUrl(locale, path),
  })),
})

export const faqLd = (faq: [question: string, answer: string][]) => ({
  '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
})

export const videoLd = (v: {
  name: string
  description: string
  thumbnailUrl: string
  contentUrl: string
  uploadDate: string
  /** seconds */
  duration: number
  locale: Locale
  path: string
}) => ({
  '@type': 'VideoObject',
  name: v.name,
  description: v.description,
  thumbnailUrl: absolute(v.thumbnailUrl),
  contentUrl: absolute(v.contentUrl),
  uploadDate: v.uploadDate,
  duration: `PT${v.duration}S`,
  inLanguage: HTML_LANG[v.locale],
  url: pageUrl(v.locale, v.path),
})

export const softwareAppLd = (a: { name: string; description: string; locale: Locale; path: string; category?: string }) => ({
  '@type': 'SoftwareApplication',
  name: a.name,
  description: a.description,
  applicationCategory: a.category ?? 'MultimediaApplication',
  operatingSystem: 'Web',
  url: pageUrl(a.locale, a.path),
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
})

export const articleLd = (a: { headline: string; description: string; locale: Locale; path: string; datePublished: string; dateModified?: string }) => ({
  '@type': 'Article',
  headline: a.headline,
  description: a.description,
  inLanguage: HTML_LANG[a.locale],
  url: pageUrl(a.locale, a.path),
  datePublished: a.datePublished,
  dateModified: a.dateModified ?? a.datePublished,
  author: { '@type': 'Organization', name: SITE.name },
})
