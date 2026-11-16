// Writes public/sitemap-video.xml: one <url> per recipe page and locale with the recipe film as a
// <video:video>, for Google video search. Reads src/data/terms.json and src/data/seo/<slug>.json
// directly. Run before every dev server, build and deploy (see package.json); the file is generated.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MEDIA_URL, SITE_URL } from '../src/site.config.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// Date the films went online
const PUBLISHED = '2026-10-30'

const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'))
const terms = readJson('src/data/terms.json')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const urls = terms.flatMap((t) => {
  const seo = readJson(`src/data/seo/${t.slug}.json`)
  return [
    { locale: 'en', prefix: '' },
    { locale: 'zh', prefix: '/zh' },
  ].map(({ locale, prefix }) => `  <url>
    <loc>${SITE_URL}${prefix}/recipes/${t.slug}/</loc>
    <video:video>
      <video:thumbnail_loc>${MEDIA_URL}/${t.video}.jpg</video:thumbnail_loc>
      <video:title>${esc(seo[locale].name)}</video:title>
      <video:description>${esc(seo[locale].description)}</video:description>
      <video:content_loc>${MEDIA_URL}/${t.video}.mp4</video:content_loc>
      <video:duration>${Math.round(t.dur)}</video:duration>
      <video:publication_date>${PUBLISHED}</video:publication_date>
    </video:video>
  </url>`)
})

writeFileSync(
  join(ROOT, 'public/sitemap-video.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('\n')}
</urlset>
`,
)
console.log(`sitemap-video.xml: ${urls.length} urls`)
