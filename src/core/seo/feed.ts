// /feed.xml: an RSS 2.0 feed of the dated content in the default language, newest first. Node only (scripts/generate.mjs
// writes it, scripts/test.mjs checks it).
// Items are the indexable pages of FEED_TYPES; `pubDate` is the page's `lastmod` (`updated`), so a refreshed guide moves to the top.
// Hook for the changelog type (SEO step 5): add `changelog` to FEED_TYPES when each entry should be an item, or write
// /changelog/rss.xml from generate.mjs with `feedXml()` over the changelog entries.
import { DEFAULT_LOCALE, pageUrl } from '../i18n.ts'
import { indexableLocales, type SitePage } from '../pages.ts'

/** Page types that appear in the feed. */
export const FEED_TYPES: SitePage['type'][] = ['guide', 'compare', 'alternatives']
/** Newest items kept in the feed. */
export const FEED_LIMIT = 50

export type FeedItem = { title: string; link: string; description: string; date?: string }
export type FeedMeta = { title: string; link: string; description: string; language: string; self: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** RFC 822 date of a YYYY-MM-DD day (midnight UTC). */
export const rfc822 = (date: string) => new Date(`${date}T00:00:00Z`).toUTCString()

/** The feed items of the default language, newest first (undated last), at most FEED_LIMIT. */
export function feedItems(pages: SitePage[]): FeedItem[] {
  return pages
    .filter((p) => FEED_TYPES.includes(p.type) && indexableLocales(p).includes(DEFAULT_LOCALE))
    .map((p) => ({ path: p.path, title: p.title[DEFAULT_LOCALE]!, link: pageUrl(DEFAULT_LOCALE, p.path), description: p.description[DEFAULT_LOCALE] ?? '', date: p.lastmod }))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.path.localeCompare(b.path))
    .slice(0, FEED_LIMIT)
    .map(({ path: _path, ...item }) => item)
}

export function feedXml(meta: FeedMeta, items: FeedItem[]): string {
  const newest = items.find((i) => i.date)?.date
  const body = items.map(
    (i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.link)}</link>
      <guid isPermaLink="true">${esc(i.link)}</guid>${i.date ? `\n      <pubDate>${rfc822(i.date)}</pubDate>` : ''}
      <description>${esc(i.description)}</description>
    </item>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(meta.title)}</title>
    <link>${esc(meta.link)}</link>
    <description>${esc(meta.description)}</description>
    <language>${esc(meta.language)}</language>${newest ? `\n    <lastBuildDate>${rfc822(newest)}</lastBuildDate>` : ''}
    <atom:link href="${esc(meta.self)}" rel="self" type="application/rss+xml"/>
${body.join('\n')}
  </channel>
</rss>
`
}
