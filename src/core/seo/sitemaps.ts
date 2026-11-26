// Child sitemaps and the sitemap index, built from the page registry (`sitePages()`). Node only: scripts/generate.mjs
// writes the files, scripts/test.mjs and scripts/indexnow.mjs read the result.
//
// One child sitemap per page type or collection, so Search Console shows the indexed share of each type:
//   tool                    -> sitemap-tools.xml
//   guide                   -> sitemap-guides.xml
//   hub                     -> sitemap-hubs.xml  (hubs have their own file; page 1 only, pages 2 and up are never listed)
//   item with a collection  -> sitemap-<collection>.xml
//   item without one        -> sitemap-items.xml (a site's own item pages from `extraPages`)
//   everything else         -> sitemap-pages.xml (home, about, legal, compare, alternatives, glossary, use-case, gallery, changelog)
// A child with more than 45,000 URLs continues in sitemap-<name>-2.xml, -3.xml and so on. An empty child is not written.
// Every URL carries `lastmod` and the hreflang alternates of the head (the indexable languages plus x-default); no
// priority or changefreq. sitemap-video.xml is written by generate.mjs and listed in the index next to these.
import { SITE_URL } from '../../../site.config.ts'
import { alternateUrls, pageUrl } from '../i18n.ts'
import { indexableLocales, type SitePage } from '../pages.ts'

export const MAX_SITEMAP_URLS = 45_000

export type SitemapEntry = { loc: string; lastmod?: string; alternates: { lang: string; href: string }[] }
export type SitemapFile = { name: string; entries: SitemapEntry[] }

/** Names the template uses for its own children; a collection with one of these ids would share a file. */
const FIXED_GROUPS = ['tools', 'guides', 'hubs', 'items', 'pages', 'video']

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The child a page goes into: `tools`, `guides`, `hubs`, a collection id, `items` or `pages` (file `sitemap-<group>.xml`). */
export function sitemapGroup(p: Pick<SitePage, 'type' | 'collection'>): string {
  if (p.type === 'tool') return 'tools'
  if (p.type === 'guide') return 'guides'
  if (p.type === 'hub') return 'hubs'
  if (p.type === 'item') {
    if (!p.collection) return 'items'
    if (FIXED_GROUPS.includes(p.collection)) throw new Error(`collection id "${p.collection}" collides with sitemap-${p.collection}.xml; rename the collection (reserved: ${FIXED_GROUPS.join(', ')})`)
    return p.collection
  }
  return 'pages'
}

/** The newest of YYYY-MM-DD dates (they sort as text); undefined when there is none. */
export const newestDate = (dates: (string | undefined)[]): string | undefined => dates.filter((d): d is string => !!d).sort().at(-1)

/** Child sitemaps: one entry per indexable page and language, grouped by `sitemapGroup`, split at `max` URLs. */
export function sitemapFiles(pages: SitePage[], max = MAX_SITEMAP_URLS): SitemapFile[] {
  const groups = new Map<string, SitemapEntry[]>()
  for (const p of pages) {
    const indexable = indexableLocales(p)
    if (!indexable.length) continue
    const alternates = alternateUrls(p.path, indexable)
    const group = sitemapGroup(p)
    const entries = groups.get(group) ?? []
    for (const l of indexable) entries.push({ loc: pageUrl(l, p.path), lastmod: p.lastmod, alternates })
    groups.set(group, entries)
  }
  const collections = [...groups.keys()].filter((g) => !FIXED_GROUPS.includes(g)).sort()
  const order = ['tools', 'guides', 'hubs', ...collections, 'items', 'pages']
  return order.flatMap((group) => {
    const entries = groups.get(group) ?? []
    const files: SitemapFile[] = []
    for (let i = 0; i * max < entries.length; i++) files.push({ name: i === 0 ? `sitemap-${group}.xml` : `sitemap-${group}-${i + 1}.xml`, entries: entries.slice(i * max, (i + 1) * max) })
    return files
  })
}

export function sitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map(
    (e) => `  <url>
    <loc>${esc(e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}
${e.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${esc(a.lang)}" href="${esc(a.href)}"/>`).join('\n')}
  </url>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`
}

/** `sitemap.xml`: the index of the child sitemaps. `lastmod` of a child is the newest `lastmod` of its URLs. */
export function sitemapIndexXml(children: { name: string; lastmod?: string }[]): string {
  const items = children.map((c) => `  <sitemap>\n    <loc>${esc(`${SITE_URL}/${c.name}`)}</loc>${c.lastmod ? `\n    <lastmod>${c.lastmod}</lastmod>` : ''}\n  </sitemap>`)
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.join('\n')}
</sitemapindex>
`
}
