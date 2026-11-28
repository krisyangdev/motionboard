// Head data of Motionboard's page types, on the template's seoHead() and JSON-LD helpers.
import { HTML_LANG, pageUrl, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { breadcrumbLd, organizationLd, seoHead, websiteLd } from '@/core/seo'
import type { PageData } from '@/site/components/page/load'
import { SITE, SITE_URL, MEDIA_URL } from '@/site/config'
import type { Block } from '@/site/data/content'
import { HERO_FILM } from '@/site/data/hero'
import { bySlug, media, recipePath, termName } from '@/site/data/terms'
import { messages } from '@/site/messages'

/** Date the guides were first published, for Article.datePublished */
const GUIDE_PUBLISHED = '2026-11-16'

export const homeHead = (locale: Locale) =>
  seoHead({
    title: SITE.title[locale],
    description: SITE.description[locale],
    path: '/',
    locale,
    type: 'website',
    image: HERO_FILM.cover,
    jsonLd: [websiteLd(locale), organizationLd()],
  })

export const savedHead = (locale: Locale) =>
  seoHead({ title: messages[locale].saved.title, description: SITE.description[locale], path: '/saved/', locale, noindex: true })

const films = (blocks: Block[]) => [...new Set(blocks.flatMap((b) => (b.t === 'films' ? b.slugs : [])))].filter((s) => bySlug[s])
const ORG = { '@type': 'Organization', name: SITE.name, url: SITE_URL }

/** Hub pages (a list of films) and guides. */
export function contentHead(locale: Locale, { kind, path, updated, copy }: PageData) {
  const url = pageUrl(locale, path)
  const slugs = films(copy.blocks)
  const showcase = copy.blocks.find((b): b is Extract<Block, { t: 'showcase' }> => b.t === 'showcase')
  const image = slugs.length ? media(bySlug[slugs[0]], 'jpg') : showcase ? `${MEDIA_URL}/${showcase.films[0].video}.jpg` : HERO_FILM.cover
  const main =
    kind === 'hub'
      ? {
          '@type': 'CollectionPage',
          '@id': url,
          url,
          name: copy.h1,
          description: copy.description,
          inLanguage: HTML_LANG[locale],
          isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE_URL },
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: slugs.map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: pageUrl(locale, recipePath(bySlug[s])),
              name: termName(bySlug[s], locale),
            })),
          },
        }
      : {
          '@type': 'Article',
          headline: copy.h1,
          description: copy.description,
          image,
          inLanguage: HTML_LANG[locale],
          datePublished: GUIDE_PUBLISHED,
          dateModified: updated,
          author: ORG,
          publisher: ORG,
          mainEntityOfPage: url,
        }
  return seoHead({
    title: copy.title,
    description: copy.description,
    path,
    locale,
    type: 'article',
    image,
    jsonLd: [main, breadcrumbLd(locale, [{ name: coreMessages[locale].page.home, path: '/' }, { name: copy.h1, path }])],
  })
}
