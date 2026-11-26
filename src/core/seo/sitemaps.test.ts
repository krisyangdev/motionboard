import { describe, expect, it } from 'vitest'
import { SITE_URL } from '../../../site.config.ts'
import { mockSite } from '../test-site'
import type { SitePage } from '../pages'

async function load() {
  await mockSite(['en', 'zh'])
  const sitemaps = await import('./sitemaps')
  const feed = await import('./feed')
  return { ...sitemaps, ...feed }
}

const page = (path: string, type: SitePage['type'], over: Partial<SitePage> = {}): SitePage => ({
  path,
  type,
  title: { en: path, zh: path },
  description: { en: `About ${path}`, zh: path },
  indexable: true,
  lastmod: '2026-11-01',
  ...over,
})

describe('sitemapGroup', () => {
  it('maps each page type or collection to one child', async () => {
    const { sitemapGroup } = await load()
    expect(sitemapGroup({ type: 'tool' })).toBe('tools')
    expect(sitemapGroup({ type: 'guide' })).toBe('guides')
    expect(sitemapGroup({ type: 'hub' })).toBe('hubs')
    expect(sitemapGroup({ type: 'item', collection: 'recipes' })).toBe('recipes')
    expect(sitemapGroup({ type: 'item' })).toBe('items')
    for (const type of ['home', 'about', 'legal', 'compare', 'alternatives', 'glossary', 'use-case', 'gallery', 'changelog'] as const) expect(sitemapGroup({ type })).toBe('pages')
  })
  it('rejects a collection whose id is a fixed child name', async () => {
    const { sitemapGroup } = await load()
    expect(() => sitemapGroup({ type: 'item', collection: 'tools' })).toThrow('sitemap-tools.xml')
  })
})

describe('sitemapFiles', () => {
  it('writes one file per used group, in a fixed order, and no empty file', async () => {
    const { sitemapFiles } = await load()
    const files = sitemapFiles([page('/', 'home'), page('/guides/a/', 'guide'), page('/tools/t/', 'tool'), page('/r/x/', 'item', { collection: 'r' }), page('/i/', 'item')])
    expect(files.map((f) => f.name)).toEqual(['sitemap-tools.xml', 'sitemap-guides.xml', 'sitemap-r.xml', 'sitemap-items.xml', 'sitemap-pages.xml'])
  })
  it('lists a URL per indexable language with the alternates of the head, and skips noindex languages and pages', async () => {
    const { sitemapFiles } = await load()
    const files = sitemapFiles([
      page('/guides/a/', 'guide'),
      page('/guides/b/', 'guide', { noindex: { zh: ['thin'] } }),
      page('/guides/c/', 'guide', { indexable: false, noindex: { en: ['thin'], zh: ['thin'] } }),
    ])
    const urls = files[0].entries
    expect(urls.map((e) => e.loc)).toEqual([`${SITE_URL}/guides/a/`, `${SITE_URL}/zh/guides/a/`, `${SITE_URL}/guides/b/`])
    expect(urls[0].alternates.map((a) => a.lang)).toEqual(['en', 'zh-CN', 'x-default'])
    expect(urls[2].alternates.map((a) => a.lang)).toEqual(['en', 'x-default'])
  })
  it('splits a child at the URL limit', async () => {
    const { sitemapFiles } = await load()
    const pages = Array.from({ length: 5 }, (_, i) => page(`/tools/t${i}/`, 'tool', { title: { en: 't' } }))
    const files = sitemapFiles(pages, 2)
    expect(files.map((f) => [f.name, f.entries.length])).toEqual([['sitemap-tools.xml', 2], ['sitemap-tools-2.xml', 2], ['sitemap-tools-3.xml', 1]])
  })
})

describe('sitemap XML', () => {
  it('has lastmod and hreflang links, and no priority or changefreq', async () => {
    const { sitemapFiles, sitemapXml, sitemapIndexXml, newestDate } = await load()
    const [file] = sitemapFiles([page('/tools/a&b/', 'tool')])
    const xml = sitemapXml(file.entries)
    expect(xml).toContain('<lastmod>2026-11-01</lastmod>')
    expect(xml).toContain('hreflang="x-default"')
    expect(xml).toContain('/tools/a&amp;b/')
    expect(xml).not.toMatch(/priority|changefreq/)
    const index = sitemapIndexXml([{ name: file.name, lastmod: newestDate(file.entries.map((e) => e.lastmod)) }, { name: 'sitemap-video.xml' }])
    expect(index).toContain('<sitemapindex')
    expect(index).toContain(`${SITE_URL}/sitemap-tools.xml`)
  })
})

describe('feed', () => {
  it('lists the indexable dated pages of the default language, newest first', async () => {
    const { feedItems, feedXml } = await load()
    const items = feedItems([
      page('/guides/old/', 'guide', { lastmod: '2026-01-01' }),
      page('/guides/new/', 'guide', { lastmod: '2026-11-20' }),
      page('/guides/zh-only/', 'guide', { title: { zh: 'x' } }),
      page('/guides/hidden/', 'guide', { indexable: false, noindex: { en: ['thin'], zh: ['thin'] } }),
      page('/tools/t/', 'tool'),
    ])
    expect(items.map((i) => i.link)).toEqual([`${SITE_URL}/guides/new/`, `${SITE_URL}/guides/old/`])
    const xml = feedXml({ title: 'T', link: `${SITE_URL}/`, description: 'D', language: 'en', self: `${SITE_URL}/feed.xml` }, items)
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<pubDate>Fri, 20 Nov 2026 00:00:00 GMT</pubDate>')
    expect(xml.indexOf('guides/new')).toBeLessThan(xml.indexOf('guides/old'))
  })
})

describe('feed with the changelog', () => {
  const entries = [
    { id: '2026-11-20-b', date: '2026-11-20', title: 'B', items: ['one', 'two'], page: 1 },
    { id: '2026-11-10-a', date: '2026-11-10', title: 'A', items: ['three'], page: 1 },
  ]
  const changelog = page('/changelog/', 'changelog')

  it('adds each entry of an indexable changelog with its anchor, merged with the pages by date', async () => {
    const { feedItems } = await load()
    const items = feedItems([page('/guides/g/', 'guide', { lastmod: '2026-11-15' }), changelog], entries)
    expect(items.map((i) => i.link)).toEqual([`${SITE_URL}/changelog/#2026-11-20-b`, `${SITE_URL}/guides/g/`, `${SITE_URL}/changelog/#2026-11-10-a`])
    expect(items[0]).toMatchObject({ title: 'B', description: 'one two', date: '2026-11-20' })
  })
  it('links an entry on page 2 to that page', async () => {
    const { changelogEntryUrl } = await load()
    expect(changelogEntryUrl({ id: '2026-01-01-x', page: 2 })).toBe(`${SITE_URL}/changelog/page/2/#2026-01-01-x`)
  })
  it('leaves the entries out when the changelog is noindex or missing in the default language', async () => {
    const { feedItems, changelogFeedItems } = await load()
    expect(feedItems([page('/changelog/', 'changelog', { indexable: false, noindex: { en: ['thin'], zh: ['thin'] } })], entries)).toEqual([])
    expect(changelogFeedItems([], entries)).toEqual([])
    expect(changelogFeedItems([page('/changelog/', 'changelog', { title: { zh: 'x' } })], entries)).toEqual([])
  })
  it('caps the feed at 50 items', async () => {
    const { feedItems } = await load()
    const many = Array.from({ length: 60 }, (_, i) => ({ id: `2026-01-${String(i).padStart(2, '0')}-x`, date: `2026-01-01`, title: `T${i}`, items: ['x'], page: 1 }))
    expect(feedItems([changelog], many)).toHaveLength(50)
  })
})

