// What scripts/indexnow.mjs sends: the URLs whose `lastmod` changed since the last successful ping. Node only.
// The record is .indexnow-sent.json in the repo root (gitignored): `{ "<url>": "<lastmod>" }` for every URL pinged.

/** URL -> `lastmod` (empty when the sitemap gives none). */
export type UrlDates = Record<string, string>

/** URL and `lastmod` of every `<url>` of a child sitemap. */
export function parseSitemap(xml: string): UrlDates {
  const out: UrlDates = {}
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = /<loc>\s*([^<]+?)\s*<\/loc>/.exec(m[1])?.[1]
    if (loc) out[loc] = /<lastmod>\s*([^<]+?)\s*<\/lastmod>/.exec(m[1])?.[1] ?? ''
  }
  return out
}

/** The child sitemap URLs listed in a sitemap index. */
export function parseSitemapIndex(xml: string): string[] {
  return [...xml.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g)].flatMap((m) => /<loc>\s*([^<]+?)\s*<\/loc>/.exec(m[1])?.[1] ?? [])
}

/** URLs that are new or whose `lastmod` differs from the record. */
export function changedUrls(current: UrlDates, sent: UrlDates): string[] {
  return Object.keys(current).filter((url) => !(url in sent) || sent[url] !== current[url])
}

/**
 * The record after a ping: the URLs still in the sitemap, `submitted` ones at their current `lastmod`, the others as
 * recorded before (a URL whose ping failed stays changed). URLs no longer in the sitemap are dropped.
 */
export function nextRecord(current: UrlDates, sent: UrlDates, submitted: string[]): UrlDates {
  const ok = new Set(submitted)
  const out: UrlDates = {}
  for (const url of Object.keys(current).sort()) {
    if (ok.has(url)) out[url] = current[url]
    else if (url in sent) out[url] = sent[url]
  }
  return out
}

export const chunk = <T>(list: T[], size: number): T[][] => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size))
