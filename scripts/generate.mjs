// Writes the generated files in public/: robots.txt, _redirects, _headers, llms.txt, sitemap-video.xml.
// Run by the `prebuild` plugin in vite.config.ts on every build and dev start, or directly with
// `node scripts/generate.mjs`. The outputs are gitignored.
import { writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE, SITE_URL } from '../site.config.ts'
import { LOCALES, DEFAULT_LOCALE, HTML_LANG, localizePath, pageUrl } from '../src/core/i18n.ts'
import { ROBOTS_DISALLOW, sitePages, readRenamed, readVideos } from '../src/core/pages.ts'
import { headersFile } from '../src/core/headers.ts'
import { extraHeaders, extraRedirects, llmsTxt } from '../src/site/pages.ts'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PUBLIC = join(ROOT, 'public')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const abs = (u) => (/^https?:\/\//.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`)

export function generate() {
  mkdirSync(PUBLIC, { recursive: true })
  const out = (name, text) => writeFileSync(join(PUBLIC, name), text)
  const videos = readVideos()

  out(
    'robots.txt',
    [
      'User-agent: *',
      'Allow: /',
      ...ROBOTS_DISALLOW.map((p) => `Disallow: ${p}`),
      '',
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      ...(videos.length ? [`Sitemap: ${SITE_URL}/sitemap-video.xml`] : []),
      '',
    ].join('\n'),
  )

  // Renames apply to every language; both the slash and the no-slash form of the old path redirect.
  const redirects = []
  for (const [from, to] of Object.entries(readRenamed())) {
    for (const l of LOCALES) {
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
    const lines = sitePages().map((p) => {
      const title = p.title[DEFAULT_LOCALE] || p.path
      const desc = p.description[DEFAULT_LOCALE]
      return `- [${title}](${pageUrl(DEFAULT_LOCALE, p.path)})${desc ? `: ${desc}` : ''}`
    })
    out('llms.txt', `# ${SITE.name}\n\n> ${SITE.description[DEFAULT_LOCALE]}\n\n## Pages\n\n${lines.join('\n')}\n`)
  } else rmSync(join(PUBLIC, 'llms.txt'), { force: true })

  if (videos.length) {
    // One <url> per page and language; several videos on the same page share it. Titles and
    // descriptions may be per language.
    const text = (v, l) => (typeof v === 'string' ? v : (v[l] ?? v[DEFAULT_LOCALE]))
    const byPath = new Map()
    for (const v of videos) byPath.set(v.path, [...(byPath.get(v.path) ?? []), v])
    const urls = [...byPath].flatMap(([path, list]) =>
      LOCALES.map(
        (l) => `  <url>
    <loc>${esc(pageUrl(l, path))}</loc>
${list
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
      ),
    )
    out(
      'sitemap-video.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('\n')}
</urlset>
`,
    )
  } else rmSync(join(PUBLIC, 'sitemap-video.xml'), { force: true })

  console.log(`generate: ${sitePages().length} pages, ${redirects.length} redirects, ${videos.length} videos`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) generate()
