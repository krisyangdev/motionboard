import { describe, expect, it } from 'vitest'
import { SITE, SITE_URL } from '../../site.config.ts'
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, PREFIXED_LOCALES, pageUrl } from './i18n'
import { mockSite } from './test-site'
import * as seoModule from './seo'
import { absolute, articleLd, breadcrumbLd, definedTermLd, imageObjectLd, ORG_ID, organizationLd, seoHead, videoLd, webApplicationLd, websiteLd } from './seo'

const other = PREFIXED_LOCALES[0]
const base = { title: 'Merge PDFs', description: 'Combine PDF files in your browser.', path: '/tools/merge/', locale: DEFAULT_LOCALE }
const metaOf = (head: ReturnType<typeof seoHead>, key: 'name' | 'property', value: string) => head.meta.find((m) => m[key] === value)?.content

describe('seoHead', () => {
  it('appends the site name to the title once', () => {
    expect(seoHead(base).meta[0].title).toBe(`Merge PDFs · ${SITE.name}`)
    expect(seoHead({ ...base, title: `Merge PDFs · ${SITE.name}` }).meta[0].title).toBe(`Merge PDFs · ${SITE.name}`)
  })
  it('mirrors title and description into Open Graph', () => {
    const head = seoHead(base)
    expect(metaOf(head, 'property', 'og:title')).toBe(head.meta[0].title)
    expect(metaOf(head, 'name', 'description')).toBe(base.description)
    expect(metaOf(head, 'property', 'og:description')).toBe(base.description)
  })
  it('sets canonical and the og:url to the localized page', () => {
    const head = seoHead({ ...base, locale: other })
    const url = pageUrl(other, base.path)
    expect(head.links.find((l) => l.rel === 'canonical')?.href).toBe(url)
    expect(metaOf(head, 'property', 'og:url')).toBe(url)
  })
  it('adds one hreflang link per language plus x-default', () => {
    const alts = seoHead(base).links.filter((l) => l.rel === 'alternate')
    expect(alts).toHaveLength(LOCALES.length + 1)
    expect(alts.find((l) => 'hrefLang' in l && l.hrefLang === 'x-default')?.href).toBe(pageUrl(DEFAULT_LOCALE, base.path))
  })
  it('writes hreflang only for the languages the page exists in', () => {
    const only = seoHead({ ...base, locales: [DEFAULT_LOCALE] }).links.filter((l) => l.rel === 'alternate')
    expect(only.map((l) => ('hrefLang' in l ? l.hrefLang : ''))).toEqual([HTML_LANG[DEFAULT_LOCALE], 'x-default'])
    const inOther = seoHead({ ...base, locale: other, locales: [other] })
    expect(inOther.links.find((l) => 'hrefLang' in l && l.hrefLang === 'x-default')?.href).toBe(pageUrl(other, base.path))
    expect(inOther.links.find((l) => l.rel === 'canonical')?.href).toBe(pageUrl(other, base.path))
  })
  it('uses the default og image, made absolute', () => {
    expect(metaOf(seoHead(base), 'property', 'og:image')).toBe(absolute(SITE.ogImage))
    expect(metaOf(seoHead({ ...base, image: 'https://cdn.example.com/a.png' }), 'property', 'og:image')).toBe('https://cdn.example.com/a.png')
  })
  it('noindex drops canonical and hreflang and adds the robots meta', () => {
    const head = seoHead({ ...base, noindex: true })
    expect(head.links).toEqual([])
    expect(metaOf(head, 'name', 'robots')).toBe('noindex,follow')
    expect(metaOf(seoHead(base), 'name', 'robots')).toBeUndefined()
  })
  it('serialises JSON-LD into one @graph script', () => {
    const head = seoHead({ ...base, jsonLd: [websiteLd(DEFAULT_LOCALE), organizationLd()] })
    expect(head.scripts).toHaveLength(1)
    expect(head.scripts[0].type).toBe('application/ld+json')
    const ld = JSON.parse(head.scripts[0].children)
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@graph'].map((n: { '@type': string }) => n['@type'])).toEqual(['WebSite', 'Organization'])
  })
  it('emits no script without JSON-LD', () => {
    expect(seoHead(base).scripts).toEqual([])
  })
  it('writes the breadcrumb trail as a BreadcrumbList node in the same @graph', () => {
    const crumbs = [{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools/' }, { name: 'Merge', path: base.path }]
    const head = seoHead({ ...base, locale: other, breadcrumb: crumbs, jsonLd: [articleLd({ headline: 'h', description: 'd', locale: other, path: base.path, datePublished: '2026-01-01', dateModified: '2026-02-01' })] })
    const graph = JSON.parse(head.scripts[0].children)['@graph']
    expect(graph.map((n: { '@type': string }) => n['@type'])).toEqual(['Article', 'BreadcrumbList'])
    expect(graph[1].itemListElement.map((i: { name: string; item: string }) => [i.name, i.item])).toEqual(crumbs.map((c) => [c.name, pageUrl(other, c.path)]))
  })
  it('never emits FAQPage', () => {
    expect('faqLd' in seoModule).toBe(false)
    const head = seoHead({ ...base, jsonLd: [websiteLd(DEFAULT_LOCALE), organizationLd(), webApplicationLd({ name: 'n', description: 'd', locale: DEFAULT_LOCALE, path: base.path })], breadcrumb: [{ name: 'Home', path: '/' }] })
    expect(head.scripts[0].children).not.toContain('FAQPage')
  })
})

describe('seoHead in a third language', () => {
  it('uses the og locale and hreflang of the registry and only the listed languages', async () => {
    await mockSite(['en', 'zh', 'es'])
    const seo = await import('./seo')
    const head = seo.seoHead({ ...base, locale: 'es' as never, locales: ['en', 'es'] as never })
    expect(metaOf(head, 'property', 'og:locale')).toBe('es_ES')
    expect(head.links.filter((l) => l.rel === 'alternate').map((l) => ('hrefLang' in l ? l.hrefLang : ''))).toEqual(['en', 'es', 'x-default'])
    expect(head.links.find((l) => l.rel === 'canonical')?.href).toBe(`${SITE_URL}/es/tools/merge/`)
  })
})

describe('absolute', () => {
  it('prefixes site paths and keeps full URLs', () => {
    expect(absolute('/og.png')).toBe(`${SITE_URL}/og.png`)
    expect(absolute('https://x.test/a.png')).toBe('https://x.test/a.png')
  })
})

describe('JSON-LD helpers', () => {
  it('breadcrumbLd numbers the trail from 1 and links each item in the page language', () => {
    const b = breadcrumbLd(other, [{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools/' }, { name: 'Merge', path: '/tools/merge/' }])
    expect(b['@type']).toBe('BreadcrumbList')
    expect(b.itemListElement.map((i) => i.position)).toEqual([1, 2, 3])
    expect(b.itemListElement[0]).toMatchObject({ name: 'Home', item: pageUrl(other, '/') })
    expect(b.itemListElement[2].item).toBe(pageUrl(other, '/tools/merge/'))
  })
  it('videoLd formats the duration as ISO 8601 and absolutises URLs', () => {
    const v = videoLd({ name: 'n', description: 'd', thumbnailUrl: '/t.jpg', contentUrl: 'https://v.test/a.mp4', uploadDate: '2026-01-01', duration: 95, locale: DEFAULT_LOCALE, path: '/tools/merge/' })
    expect(v).toMatchObject({ '@type': 'VideoObject', duration: 'PT95S', thumbnailUrl: `${SITE_URL}/t.jpg`, contentUrl: 'https://v.test/a.mp4' })
  })
  it('videoLd takes the upload date it is given, so each item can use its own published date', () => {
    const ld = (uploadDate: string) => videoLd({ name: 'n', description: 'd', thumbnailUrl: '/t.jpg', contentUrl: '/a.mp4', uploadDate, duration: 5, locale: DEFAULT_LOCALE, path: '/recipes/a/' })
    expect([ld('2026-01-01').uploadDate, ld('2026-02-03').uploadDate]).toEqual(['2026-01-01', '2026-02-03'])
  })
  it('imageObjectLd points at the image, credits the site and adds a licence only when given', () => {
    const base = { name: 'Heart symbols', caption: 'Three hearts', contentUrl: '/symbols/heart-symbols.svg', locale: other, path: '/symbols/heart-symbols/' }
    expect(imageObjectLd(base)).toMatchObject({
      '@type': 'ImageObject',
      contentUrl: `${SITE_URL}/symbols/heart-symbols.svg`,
      caption: 'Three hearts',
      creditText: SITE.name,
      creator: { '@id': ORG_ID },
      inLanguage: HTML_LANG[other],
      url: pageUrl(other, '/symbols/heart-symbols/'),
    })
    expect(imageObjectLd(base)).not.toHaveProperty('license')
    expect(imageObjectLd({ ...base, license: 'https://x.test/license' })).toMatchObject({ license: 'https://x.test/license' })
  })
  it('webApplicationLd carries type, language, price and URL', () => {
    expect(webApplicationLd({ name: 'n', description: 'd', locale: other, path: '/tools/merge/' })).toMatchObject({
      '@type': 'WebApplication',
      operatingSystem: 'Web',
      inLanguage: HTML_LANG[other],
      url: pageUrl(other, '/tools/merge/'),
      offers: { price: '0' },
    })
  })
  it('articleLd writes both dates with a time zone and points author and publisher at the Organization', () => {
    const a = articleLd({ headline: 'h', description: 'd', locale: DEFAULT_LOCALE, path: '/guides/a/', datePublished: '2026-01-01', dateModified: '2026-03-02' })
    expect(a).toMatchObject({
      '@type': 'Article',
      datePublished: '2026-01-01T00:00:00+00:00',
      dateModified: '2026-03-02T00:00:00+00:00',
      url: pageUrl(DEFAULT_LOCALE, '/guides/a/'),
      image: absolute(SITE.ogImage),
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
    })
  })
  it('organizationLd carries the shared @id and websiteLd points at it', () => {
    expect(ORG_ID).toBe(`${SITE_URL}/about/#org`)
    expect(organizationLd()).toMatchObject({ '@type': 'Organization', '@id': ORG_ID })
    expect(websiteLd(DEFAULT_LOCALE)).toMatchObject({ '@type': 'WebSite', description: SITE.description[DEFAULT_LOCALE], publisher: { '@id': ORG_ID } })
  })
})

describe('definedTermLd', () => {
  const term = { name: 'Word count', description: 'A word count is the number of words in a text.', locale: DEFAULT_LOCALE, path: '/glossary/word-count/', setName: 'Glossary' }
  it('describes the term with its definition and points at the glossary index when it exists', () => {
    const ld = definedTermLd({ ...term, setUrl: `${SITE_URL}/glossary/` })
    expect(ld).toMatchObject({ '@type': 'DefinedTerm', name: 'Word count', description: term.description, url: `${SITE_URL}/glossary/word-count/`, inDefinedTermSet: `${SITE_URL}/glossary/` })
  })
  it('names the set instead of a URL when the index page does not exist', () => {
    expect(definedTermLd(term).inDefinedTermSet).toEqual({ '@type': 'DefinedTermSet', name: 'Glossary' })
  })
})
