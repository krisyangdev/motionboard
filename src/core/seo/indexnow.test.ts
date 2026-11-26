import { describe, expect, it } from 'vitest'
import { changedUrls, chunk, nextRecord, parseSitemap, parseSitemapIndex } from './indexnow.ts'

const sitemap = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://a.test/one/</loc>
    <lastmod>2026-11-01</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="https://a.test/one/"/>
  </url>
  <url><loc>https://a.test/two/</loc></url>
</urlset>`

describe('parsing', () => {
  it('reads URL and lastmod of every <url>, empty when there is no lastmod', () => {
    expect(parseSitemap(sitemap)).toEqual({ 'https://a.test/one/': '2026-11-01', 'https://a.test/two/': '' })
  })
  it('reads the children of a sitemap index', () => {
    const index = '<sitemapindex><sitemap><loc>https://a.test/sitemap-tools.xml</loc><lastmod>2026-11-01</lastmod></sitemap><sitemap><loc>https://a.test/sitemap-video.xml</loc></sitemap></sitemapindex>'
    expect(parseSitemapIndex(index)).toEqual(['https://a.test/sitemap-tools.xml', 'https://a.test/sitemap-video.xml'])
  })
})

describe('changedUrls', () => {
  const current = { 'https://a.test/a/': '2026-11-02', 'https://a.test/b/': '2026-11-01', 'https://a.test/c/': '2026-11-03' }
  it('returns every URL when nothing was recorded (first run)', () => {
    expect(changedUrls(current, {})).toEqual(Object.keys(current))
  })
  it('returns new URLs and URLs whose lastmod changed, not the unchanged ones', () => {
    const sent = { 'https://a.test/a/': '2026-11-01', 'https://a.test/b/': '2026-11-01' }
    expect(changedUrls(current, sent)).toEqual(['https://a.test/a/', 'https://a.test/c/'])
  })
  it('returns nothing when every lastmod matches, and ignores URLs that left the sitemap', () => {
    expect(changedUrls(current, { ...current, 'https://a.test/gone/': '2026-01-01' })).toEqual([])
  })
})

describe('nextRecord', () => {
  const current = { 'https://a.test/a/': '2026-11-02', 'https://a.test/b/': '2026-11-01', 'https://a.test/c/': '2026-11-03' }
  it('records submitted URLs at their current lastmod and keeps the old value of the others', () => {
    const sent = { 'https://a.test/a/': '2026-11-01', 'https://a.test/b/': '2026-11-01' }
    expect(nextRecord(current, sent, ['https://a.test/c/'])).toEqual({ 'https://a.test/a/': '2026-11-01', 'https://a.test/b/': '2026-11-01', 'https://a.test/c/': '2026-11-03' })
  })
  it('leaves a URL whose ping failed as changed, and drops URLs that left the sitemap', () => {
    const sent = { 'https://a.test/a/': '2026-11-01', 'https://a.test/gone/': '2026-01-01' }
    const next = nextRecord(current, sent, [])
    expect(next).toEqual({ 'https://a.test/a/': '2026-11-01' })
    expect(changedUrls(current, next)).toEqual(Object.keys(current))
  })
})

describe('chunk', () => {
  it('splits a list into batches', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([], 2)).toEqual([])
  })
})
