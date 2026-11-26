import { describe, expect, it } from 'vitest'
import { SITE, SITE_URL } from '../../site.config.ts'
import { DEFAULT_LOCALE, LOCALES, PREFIXED_LOCALES, pageUrl } from './i18n'
import { absolute, articleLd, breadcrumbLd, faqLd, organizationLd, seoHead, softwareAppLd, videoLd, websiteLd } from './seo'

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
    expect(alts.find((l) => l.hrefLang === 'x-default')?.href).toBe(pageUrl(DEFAULT_LOCALE, base.path))
  })
  it('uses the default og image, made absolute', () => {
    expect(metaOf(seoHead(base), 'property', 'og:image')).toBe(absolute(SITE.ogImage))
    expect(metaOf(seoHead({ ...base, image: 'https://cdn.example.com/a.png' }), 'property', 'og:image')).toBe('https://cdn.example.com/a.png')
  })
  it('noindex drops canonical and hreflang and adds the robots meta', () => {
    const head = seoHead({ ...base, noindex: true })
    expect(head.links).toEqual([])
    expect(metaOf(head, 'name', 'robots')).toBe('noindex')
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
})

describe('absolute', () => {
  it('prefixes site paths and keeps full URLs', () => {
    expect(absolute('/og.png')).toBe(`${SITE_URL}/og.png`)
    expect(absolute('https://x.test/a.png')).toBe('https://x.test/a.png')
  })
})

describe('JSON-LD helpers', () => {
  it('breadcrumbLd starts at home and numbers items from 1', () => {
    const b = breadcrumbLd(other, [['Tools', '/tools/'], ['Merge', '/tools/merge/']])
    expect(b['@type']).toBe('BreadcrumbList')
    expect(b.itemListElement.map((i) => i.position)).toEqual([1, 2, 3])
    expect(b.itemListElement[0]).toMatchObject({ name: SITE.name, item: pageUrl(other, '/') })
    expect(b.itemListElement[2].item).toBe(pageUrl(other, '/tools/merge/'))
  })
  it('faqLd builds Question and Answer nodes', () => {
    const f = faqLd([['Is it free?', 'Yes.']])
    expect(f['@type']).toBe('FAQPage')
    expect(f.mainEntity[0]).toEqual({ '@type': 'Question', name: 'Is it free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes.' } })
  })
  it('videoLd formats the duration as ISO 8601 and absolutises URLs', () => {
    const v = videoLd({ name: 'n', description: 'd', thumbnailUrl: '/t.jpg', contentUrl: 'https://v.test/a.mp4', uploadDate: '2026-01-01', duration: 95, locale: DEFAULT_LOCALE, path: '/tools/merge/' })
    expect(v).toMatchObject({ '@type': 'VideoObject', duration: 'PT95S', thumbnailUrl: `${SITE_URL}/t.jpg`, contentUrl: 'https://v.test/a.mp4' })
  })
  it('softwareAppLd, articleLd and websiteLd carry type, language and URL', () => {
    expect(softwareAppLd({ name: 'n', description: 'd', locale: other, path: '/tools/merge/' })).toMatchObject({ '@type': 'SoftwareApplication', url: pageUrl(other, '/tools/merge/') })
    const a = articleLd({ headline: 'h', description: 'd', locale: DEFAULT_LOCALE, path: '/guides/a/', datePublished: '2026-01-01' })
    expect(a).toMatchObject({ '@type': 'Article', dateModified: '2026-01-01', url: pageUrl(DEFAULT_LOCALE, '/guides/a/') })
    expect(websiteLd(DEFAULT_LOCALE)).toMatchObject({ '@type': 'WebSite', description: SITE.description[DEFAULT_LOCALE] })
  })
})
