import type { Block } from '@/data/content'
import { HERO_FILM } from '@/data/hero'
import { bySlug, media, recipePath, termName } from '@/data/terms'
import { plain } from '@/components/page/inline'
import { PAGES } from '@/data/pages'
import { IN_LANGUAGE, pageUrl, seoHead } from '@/lib/seo'
import { BRAND, MEDIA_URL, SITE_URL, type Locale } from '@/site.config'
import type { PageData } from '@/components/page/load'

const PUBLISHED = '2026-11-16'
const ORG = { '@type': 'Organization', name: BRAND.name, url: SITE_URL }

const films = (blocks: Block[]) => [...new Set(blocks.flatMap((b) => (b.t === 'films' ? b.slugs : [])))].filter((s) => bySlug[s])

export function contentHead(locale: Locale, { id, kind, path, updated, copy }: PageData) {
  const url = pageUrl(locale, path)
  const slugs = films(copy.blocks)
  const showcase = copy.blocks.find((b): b is Extract<Block, { t: 'showcase' }> => b.t === 'showcase')
  const image = slugs.length ? media(bySlug[slugs[0]], 'jpg') : showcase ? `${MEDIA_URL}/${showcase.films[0].video}.jpg` : HERO_FILM.cover
  const label = PAGES.find((p) => p.id === id)!.label[locale]
  const faq = copy.blocks.flatMap((b) => (b.t === 'faq' ? b.items : []))
  const crumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: BRAND.name, item: pageUrl(locale, '/') },
      { '@type': 'ListItem', position: 2, name: label, item: url },
    ],
  }
  const main =
    kind === 'hub'
      ? {
          '@type': 'CollectionPage',
          '@id': url,
          url,
          name: copy.h1,
          description: copy.description,
          inLanguage: IN_LANGUAGE[locale],
          isPartOf: { '@type': 'WebSite', name: BRAND.name, url: SITE_URL },
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
          inLanguage: IN_LANGUAGE[locale],
          datePublished: PUBLISHED,
          dateModified: updated,
          author: ORG,
          publisher: ORG,
          mainEntityOfPage: url,
        }
  return seoHead({
    title: copy.title,
    description: copy.description,
    path,
    lang: locale,
    type: 'article',
    image,
    jsonLd: [
      main,
      crumbs,
      ...(faq.length
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } })),
            },
          ]
        : []),
    ],
  })
}
