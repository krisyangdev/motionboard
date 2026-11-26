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
  /**
   * The page's breadcrumb trail, home first. It becomes the BreadcrumbList node; pass the same array to the
   * visible <Breadcrumb> so the two cannot differ.
   */
  breadcrumb?: Crumb[]
  /** JSON-LD nodes, wrapped in one @graph with the breadcrumb. Use the helpers below. Never FAQPage: the FAQ stays visible content only. */
  jsonLd?: object[]
  /** noindex,follow: no canonical or hreflang links, out of the sitemap, but crawlers still follow the links. */
  noindex?: boolean
}

/** One step of a breadcrumb trail: the name shown, and the default-language path it links to. */
export type Crumb = { name: string; path: string }

/** Absolute URL for a path on this site, or an already absolute URL. */
export const absolute = (url: string) => (url.startsWith('/') ? `${SITE_URL}${url}` : url)

export function seoHead(p: SeoPage) {
  const title = p.title.includes(SITE.name) ? p.title : `${p.title} · ${SITE.name}`
  const url = pageUrl(p.locale, p.path)
  const image = absolute(p.image ?? SITE.ogImage)
  const graph = [...(p.jsonLd ?? []), ...(p.breadcrumb?.length ? [breadcrumbLd(p.locale, p.breadcrumb)] : [])]
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
  if (p.noindex) meta.push({ name: 'robots', content: 'noindex,follow' })
  return {
    meta,
    links: p.noindex
      ? []
      : [
          { rel: 'canonical', href: url },
          ...alternateUrls(p.path, p.locales ?? LOCALES).map((a) => ({ rel: 'alternate', hrefLang: a.lang, href: a.href })),
        ],
    scripts: graph.length ? [{ type: 'application/ld+json', children: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }] : [],
  }
}

// JSON-LD helpers. Each returns one node for SeoPage.jsonLd.

/** Id of the site's Organization node. The home and about pages define it; other nodes point at it. */
export const ORG_ID = `${SITE_URL}/about/#org`
const orgRef = () => ({ '@type': 'Organization', '@id': ORG_ID, name: SITE.name })

/** `YYYY-MM-DD` as an ISO 8601 date with a time zone. */
const isoDate = (d: string) => `${d}T00:00:00+00:00`

export const websiteLd = (locale: Locale) => ({
  '@type': 'WebSite',
  name: SITE.name,
  url: pageUrl(locale, '/'),
  inLanguage: HTML_LANG[locale],
  description: SITE.description[locale],
  publisher: { '@id': ORG_ID },
})

export const organizationLd = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE.name,
  url: SITE_URL,
  ...(SITE.email ? { email: SITE.email } : {}),
  logo: absolute('/favicon.svg'),
})

/** BreadcrumbList from a trail (home first). seoHead writes it from SeoPage.breadcrumb. */
export const breadcrumbLd = (locale: Locale, crumbs: Crumb[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: pageUrl(locale, c.path),
  })),
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

/** The image is the page's main content (an item page). We are the creator; `license` is a URL, set only when we own the image. */
export const imageObjectLd = (i: { name: string; caption: string; contentUrl: string; license?: string; locale: Locale; path: string }) => ({
  '@type': 'ImageObject',
  name: i.name,
  caption: i.caption,
  contentUrl: absolute(i.contentUrl),
  creditText: SITE.name,
  creator: orgRef(),
  inLanguage: HTML_LANG[i.locale],
  url: pageUrl(i.locale, i.path),
  ...(i.license ? { license: i.license, acquireLicensePage: i.license } : {}),
})

export const webApplicationLd = (a: { name: string; description: string; locale: Locale; path: string; category?: string }) => ({
  '@type': 'WebApplication',
  name: a.name,
  description: a.description,
  applicationCategory: a.category ?? 'UtilitiesApplication',
  operatingSystem: 'Web',
  inLanguage: HTML_LANG[a.locale],
  url: pageUrl(a.locale, a.path),
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
})

/** `datePublished` and `dateModified` are the page's `published` and `updated` (YYYY-MM-DD), the same values the page shows. */
export const articleLd = (a: {
  headline: string
  description: string
  locale: Locale
  path: string
  datePublished: string
  dateModified: string
  /** Defaults to SITE.ogImage. */
  image?: string
}) => ({
  '@type': 'Article',
  headline: a.headline,
  description: a.description,
  inLanguage: HTML_LANG[a.locale],
  url: pageUrl(a.locale, a.path),
  image: absolute(a.image ?? SITE.ogImage),
  datePublished: isoDate(a.datePublished),
  dateModified: isoDate(a.dateModified),
  author: orgRef(),
  publisher: orgRef(),
})

/**
 * A glossary term: `description` is its definition. `inDefinedTermSet` is the glossary index URL when that page exists in
 * the language, else a named set (the index is built only with enough terms, so a URL would point at nothing).
 */
export const definedTermLd = (t: { name: string; description: string; locale: Locale; path: string; setName: string; setUrl?: string }) => ({
  '@type': 'DefinedTerm',
  name: t.name,
  description: t.description,
  inLanguage: HTML_LANG[t.locale],
  url: pageUrl(t.locale, t.path),
  inDefinedTermSet: t.setUrl ?? { '@type': 'DefinedTermSet', name: t.setName },
})
