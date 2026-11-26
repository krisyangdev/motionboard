// Writes public/sitemap-video.xml: one <url> per recipe page and locale with the recipe film as a
// <video:video>, for Google video search, plus the launch-video-examples page with the Motionboard
// skill's three films. Reads src/data/terms.json, src/data/seo/<slug>.json and
// src/data/pages/launch-video-examples.json directly. Run before every dev server, build and deploy (see package.json); the file is generated.
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

// Showcase films of the Motionboard skill on the launch-video-examples page, one <video> each.
const showcasePage = readJson('src/data/pages/launch-video-examples.json')
const showcaseUrls = [
  { locale: 'en', prefix: '' },
  { locale: 'zh', prefix: '/zh' },
].map(({ locale, prefix }) => {
  const videos = showcasePage[locale].blocks
    .filter((b) => b.t === 'showcase')
    .flatMap((b) =>
      b.films
        .filter((f) => f.video.endsWith('-motionboard'))
        .map(
          (f) => `    <video:video>
      <video:thumbnail_loc>${MEDIA_URL}/${f.video}.jpg</video:thumbnail_loc>
      <video:title>${esc(locale === 'zh' ? `${b.product} 宣传片（Motionboard 技能）` : `${b.product} launch film by the Motionboard skill`)}</video:title>
      <video:description>${esc(b.story)}</video:description>
      <video:content_loc>${MEDIA_URL}/${f.video}.mp4</video:content_loc>
      <video:duration>${Math.round(f.dur)}</video:duration>
      <video:publication_date>${showcasePage.updated}</video:publication_date>
    </video:video>`,
        ),
    )
  return `  <url>
    <loc>${SITE_URL}${prefix}${showcasePage.path}</loc>
${videos.join('\n')}
  </url>`
})

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
urls.push(...showcaseUrls)

writeFileSync(
  join(ROOT, 'public/sitemap-video.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('\n')}
</urlset>
`,
)
console.log(`sitemap-video.xml: ${urls.length} urls`)
