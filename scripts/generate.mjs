// Writes the generated files in public/: robots.txt, _redirects, _headers, llms.txt, sitemap.xml (the index) with its
// child sitemaps, sitemap-video.xml, feed.xml.
// Run by the `prebuild` plugin in vite.config.ts on every build and dev start, or directly with
// `node scripts/generate.mjs`. The outputs are gitignored.
import { writeFileSync, rmSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE, SITE_URL } from '../site.config.ts'
import { LOCALES, DEFAULT_LOCALE, localeMeta, localizePath, pageUrl } from '../src/core/i18n.ts'
import { ROBOTS_DISALLOW, indexableLocales, pageLocales, sitePages, readRenamed, readVideos } from '../src/core/pages.ts'
import { headersFile } from '../src/core/headers.ts'
import { feedItems, feedXml } from '../src/core/seo/feed.ts'
import { newestDate, sitemapFiles, sitemapIndexXml, sitemapXml } from '../src/core/seo/sitemaps.ts'
import { extraHeaders, extraRedirects, llmsTxt } from '../src/site/pages.ts'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PUBLIC = join(ROOT, 'public')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const abs = (u) => (/^https?:\/\//.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`)

export function generate() {
  mkdirSync(PUBLIC, { recursive: true })
  const out = (name, text) => writeFileSync(join(PUBLIC, name), text)
  const videos = readVideos()
  const pages = sitePages()
  // Languages a default-language path exists in (for redirects); a path that is not a site page counts as existing everywhere.
  const localesOf = (path) => {
    const page = pages.find((p) => p.path === path)
    return page ? pageLocales(page) : LOCALES
  }
  // Same, for pages that go into the index (llms.txt, video sitemap): the languages the quality gate lets in.
  const indexableLocalesOf = (path) => {
    const page = pages.find((p) => p.path === path)
    return page ? indexableLocales(page) : LOCALES
  }

  // Search and AI-search crawlers are allowed. `SITE.seo.allowTraining: false` keeps the model-training crawlers out.
  const TRAINING_BOTS = ['GPTBot', 'ClaudeBot', 'Google-Extended']
  out(
    'robots.txt',
    [
      'User-agent: *',
      'Allow: /',
      ...ROBOTS_DISALLOW.map((p) => `Disallow: ${p}`),
      '',
      ...(SITE.seo?.allowTraining === false ? [...TRAINING_BOTS.map((b) => `User-agent: ${b}`), 'Disallow: /', ''] : []),
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      ...(videos.length ? [`Sitemap: ${SITE_URL}/sitemap-video.xml`] : []),
      '',
    ].join('\n'),
  )

  // sitemap.xml is an index of one child per page type or collection (see src/core/seo/sitemaps.ts); every sitemap*.xml in public/ is generated.
  for (const f of readdirSync(PUBLIC)) if (/^sitemap.*\.xml$/.test(f)) rmSync(join(PUBLIC, f))
  const children = sitemapFiles(pages)
  for (const c of children) out(c.name, sitemapXml(c.entries))
  const indexChildren = children.map((c) => ({ name: c.name, lastmod: newestDate(c.entries.map((e) => e.lastmod)) }))

  // /feed.xml: RSS of the guides (and the other dated types) in the default language; linked from every page's head.
  // Hook (SEO step 5): /changelog/rss.xml from the changelog entries, written here with feedXml().
  out(
    'feed.xml',
    feedXml({ title: SITE.name, link: `${SITE_URL}/`, description: SITE.description[DEFAULT_LOCALE], language: localeMeta(DEFAULT_LOCALE).hreflang, self: `${SITE_URL}/feed.xml` }, feedItems(pages)),
  )

  // Renames apply to every language the new page exists in; both the slash and the no-slash form of the old path redirect.
  const redirects = []
  for (const [from, to] of Object.entries(readRenamed())) {
    for (const l of localesOf(to)) {
      const f = localizePath(l, from)
      redirects.push(`${f} ${localizePath(l, to)} 301`)
      if (f.length > 1 && f.endsWith('/')) redirects.push(`${f.slice(0, -1)} ${localizePath(l, to)} 301`)
    }
  }
  redirects.push(...extraRedirects)
  out('_redirects', redirects.length ? `${redirects.join('\n')}\n` : '')

  out('_headers', headersFile(extraHeaders))

  if (SITE.llmsTxt && llmsTxt) out('llms.txt', llmsTxt)
  else if (SITE.llmsTxt) {
    // One section per language, listing the indexable pages that exist in it, legal pages left out (the section title names the language when there are several).
    const sections = LOCALES.map((l) => {
      const lines = pages
        .filter((p) => p.type !== 'legal' && indexableLocales(p).includes(l))
        .map((p) => {
          const desc = p.description[l]
          return `- [${p.title[l]}](${pageUrl(l, p.path)})${desc ? `: ${desc}` : ''}`
        })
      return `## Pages${LOCALES.length > 1 ? ` (${localeMeta(l).name})` : ''}\n\n${lines.join('\n')}`
    })
    out('llms.txt', `# ${SITE.name}\n\n> ${SITE.description[DEFAULT_LOCALE]}\n\n${sections.join('\n\n')}\n`)
  } else rmSync(join(PUBLIC, 'llms.txt'), { force: true })

  if (videos.length) {
    // One <url> per page and language the page exists in; several videos on the same page share it. Titles and
    // descriptions may be per language; a video with no text in a language is left out of that language's entry.
    const text = (v, l) => (typeof v === 'string' ? v : v[l])
    const byPath = new Map()
    for (const v of videos) byPath.set(v.path, [...(byPath.get(v.path) ?? []), v])
    const urls = [...byPath].flatMap(([path, list]) =>
      indexableLocalesOf(path).flatMap((l) => {
        const shown = list.filter((v) => text(v.title, l) && text(v.description, l))
        if (!shown.length) return []
        return [
          `  <url>
    <loc>${esc(pageUrl(l, path))}</loc>
${shown
  .map(
    (v) => `    <video:video>
      <video:thumbnail_loc>${esc(abs(v.thumbnail))}</video:thumbnail_loc>
      <video:title>${esc(text(v.title, l))}</video:title>
      <video:description>${esc(text(v.description, l))}</video:description>
      <video:content_loc>${esc(abs(v.content))}</video:content_loc>
      <video:duration>${Math.round(v.duration)}</video:duration>
      <video:publication_date>${esc(v.uploadDate)}</video:publication_date>
    </video:video>`,
  )
  .join('\n')}
  </url>`,
        ]
      }),
    )
    indexChildren.push({ name: 'sitemap-video.xml', lastmod: newestDate([...byPath.keys()].map((path) => pages.find((p) => p.path === path)?.lastmod)) })
    out(
      'sitemap-video.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('\n')}
</urlset>
`,
    )
  }

  out('sitemap.xml', sitemapIndexXml(indexChildren))

  console.log(`generate: ${pages.length} pages in ${children.length} sitemaps, ${redirects.length} redirects, ${videos.length} videos`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) generate()
