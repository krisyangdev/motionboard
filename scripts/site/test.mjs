// Motionboard's own checks of the built output, run after the template's scripts/test.mjs (npm test).
// Covers what is specific to this site: page counts, the video sitemap, redirects, the noindex header on
// the recipe files, the film <source> elements in the server HTML, config values repeated elsewhere, D1.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MEDIA_URL, SITE, SITE_URL } from '../../src/site/config.ts'

const root = new URL('../..', import.meta.url).pathname
const assets = join(root, '.cloudflare/output/v1/workers/default/assets')
const failures = []
const read = (f) => readFileSync(join(assets, f), 'utf8')
const json = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'))
const all = (re, s) => [...s.matchAll(re)]
const check = (name, items, fn) => {
  const before = failures.length
  for (const item of items) {
    const msg = fn(item)
    if (msg) failures.push(`[${name}] ${msg}`)
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} ${name}: ${items.length} checked, ${failures.length - before} failed`)
}

const terms = json('content/recipes/terms.json')
const pageFiles = readdirSync(join(root, 'content/pages')).filter((f) => f.endsWith('.json'))
const prefixes = ['', '/zh']

// 1. page counts: home + about + every recipe + every hub and guide, in both languages
// sitemap.xml is an index; the page URLs are in its child sitemaps (all but the video one)
const children = readdirSync(assets).filter((f) => /^sitemap-.+\.xml$/.test(f) && f !== 'sitemap-video.xml')
const locs = children.flatMap((f) => all(/<loc>\s*([^<]+?)\s*<\/loc>/g, read(f)).map((m) => m[1]))
const want = 2 * (2 + terms.length + pageFiles.length)
check('sitemap count', [locs.length], (n) => (n === want ? '' : `expected ${want} URLs, found ${n}`))
check('sitemap has no helper pages', locs, (l) => (/\/saved\/|#|\.md$/.test(l) ? `${l} should stay out of the sitemap` : ''))

// 2. video sitemap: one <video> per recipe and language, three showcase films on the launch-video-examples page
const videoMap = read('sitemap-video.xml')
const videoUrls = all(/<url>([\s\S]*?)<\/url>/g, videoMap).map((m) => m[1])
check('video sitemap count', [videoUrls.length], (n) => (n === 2 * (terms.length + 1) ? '' : `expected ${2 * (terms.length + 1)} URLs, found ${n}`))
check('video sitemap videos', videoUrls, (b) => {
  const loc = b.match(/<loc>([^<]+)<\/loc>/)[1]
  const n = all(/<video:video>/g, b).length
  const want = loc.endsWith('/guides/launch-video-examples/') ? 3 : 1
  return n === want ? '' : `${loc}: ${n} videos, want ${want}`
})
check('video sitemap language', terms.slice(0, 5), (t) => {
  const zh = videoUrls.find((b) => b.includes(`/zh/recipes/${t.slug}/`))
  const en = videoUrls.find((b) => b.includes(`${SITE_URL}/recipes/${t.slug}/`))
  const title = (b) => b?.match(/<video:title>([^<]*)<\/video:title>/)?.[1]
  return title(zh) && title(en) && title(zh) !== title(en) ? '' : `${t.slug}: titles are not per language`
})

// 3. redirects from content/renamed.json (every language, with and without slash) and the old recipe files
const redirects = new Set(read('_redirects').split('\n').map((l) => l.trim()))
const renamed = Object.entries(json('content/renamed.json'))
check('renamed pages redirect', renamed, ([from, to]) => {
  const miss = prefixes.flatMap((p) => {
    const t = to === '/' ? `${p}/` || '/' : `${p}${to}`
    return [`${p}${from} ${t} 301`, `${p}${from.slice(0, -1)} ${t} 301`].filter((l) => !redirects.has(l))
  })
  return miss.length ? `missing: ${miss.join(' | ')}` : ''
})
check('renamed recipe files redirect', renamed.filter(([from]) => from.startsWith('/recipes/') && from !== '/recipes/'), ([from, to]) => {
  const line = `/r/${from.split('/')[2]}.md /r/${to.split('/')[2]}.md 301`
  return redirects.has(line) ? '' : `missing: ${line}`
})

// 4. recipe files for agents exist and carry X-Robots-Tag: noindex
check('recipe md files', [...terms.map((t) => `r/${t.slug}.md`), 'r/index.md'], (f) => (existsSync(join(assets, f)) ? '' : `${f} missing`))
check('/r/* noindex header', [read('_headers')], (h) => (/^\/r\/\*\n\s+X-Robots-Tag: noindex$/m.test(h) ? '' : '_headers has no X-Robots-Tag: noindex block for /r/*'))

// 5. film <source> elements in the server HTML; the poster is the LCP element
const hasSource = (html, base) => html.includes(`src="${MEDIA_URL}/${base}.mp4"`) && html.includes(`src="${MEDIA_URL}/${base}-m.mp4"`)
check('recipe film in server HTML', terms.flatMap((t) => prefixes.map((p) => ({ t, p }))), ({ t, p }) => {
  const html = read(`${p ? `${p.slice(1)}/` : ''}recipes/${t.slug}/index.html`)
  if (!hasSource(html, t.video)) return `${p}/recipes/${t.slug}/ has no <source> for ${t.video}`
  return /<img[^>]*fetchPriority="high"[^>]*elementtiming="poster"/.test(html) ? '' : `${p}/recipes/${t.slug}/ has no poster with elementtiming`
})
check('hero film in server HTML', prefixes, (p) => {
  const html = read(`${p ? `${p.slice(1)}/` : ''}index.html`)
  if (!hasSource(html, 'hero-film')) return `${p || '/'} has no hero <source>`
  return /<img[^>]*fetchPriority="high"[^>]*elementtiming="poster"/.test(html) ? '' : `${p || '/'} hero poster has no elementtiming`
})

// 6. values repeated outside site.config.ts
const cf = readFileSync(join(root, 'cloudflare.config.ts'), 'utf8')
check('cloudflare.config.ts matches site.config.ts', [[`name: "${SITE.worker}"`], [`domains: ["${SITE.domain}"]`]], ([s]) => (cf.includes(s) ? '' : `cloudflare.config.ts lacks ${s}`))
check('CSP allows the media host', [read('_headers')], (h) => (new RegExp(`media-src[^;\\n]*${MEDIA_URL.replace(/\./g, '\\.')}`).test(h) ? '' : `media-src does not allow ${MEDIA_URL}`))
check('IndexNow key file', [SITE.indexNowKey], (k) => (existsSync(join(root, 'public', `${k}.txt`)) && readFileSync(join(root, 'public', `${k}.txt`), 'utf8').trim() === k ? '' : `public/${k}.txt missing or different`))
check('llms.txt lists the recipe files', [read('llms.txt')], (t) => (t.includes(`${SITE_URL}/r/index.md`) && terms.every((x) => t.includes(`/r/${x.slug}.md`)) ? '' : 'llms.txt misses recipe files'))

// 7. the D1 stats server functions are in the Worker bundle
const bundle = join(assets, '../bundle')
const bundled = existsSync(bundle) ? readdirSync(bundle, { recursive: true }).filter((f) => String(f).endsWith('.js')) : []
check('D1 stats in the Worker', [null], () => (bundled.some((f) => readFileSync(join(bundle, String(f)), 'utf8').includes('FROM stats')) ? '' : 'no "FROM stats" query in the Worker bundle'))

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n` + failures.map((f) => '  ' + f).join('\n'))
  process.exit(1)
}
console.log('\nall Motionboard checks passed')
