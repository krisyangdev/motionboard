// Post-build checks for the prerendered static output. Run after `vite build`.
// Dependency-free: reads the assets dir, collects failures, exits 1 if any.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const assets = join(root, '.cloudflare/output/v0/workers/default/assets')
const failures = []
const read = (f) => readFileSync(join(assets, f), 'utf8')
const stripOrigin = (u) => u.replace(/^https?:\/\/[^/]+/, '')
const pathToFile = (p) => (p.endsWith('/') ? p.slice(1) + 'index.html' : p.slice(1))
const pageExists = (p) => {
  const f = join(assets, pathToFile(p))
  if (existsSync(f) && statSync(f).isFile()) return true
  const d = join(assets, p.slice(1), 'index.html')
  return existsSync(d)
}
const check = (name, items, fn) => {
  const before = failures.length
  for (const item of items) {
    const msg = fn(item)
    if (msg) failures.push(`[${name}] ${msg}`)
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} ${name}: ${items.length} checked, ${failures.length - before} failed`)
}
const all = (re, s) => [...s.matchAll(re)]

// 1. sitemap.xml
const sitemap = read('sitemap.xml')
const urlBlocks = all(/<url>([\s\S]*?)<\/url>/g, sitemap).map((m) => m[1])
const locs = urlBlocks.map((b) => b.match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1])
const locSet = new Set(locs)
const terms = JSON.parse(readFileSync(join(root, 'src/data/terms.json'), 'utf8')).length
const pageCount = readdirSync(join(root, 'src/data/pages')).filter((f) => f.endsWith('.json')).length
const expected = 2 * (1 + terms + pageCount)
check('sitemap count', [locs.length], (n) => (n === expected ? '' : `expected ${expected} URLs, found ${n}`))
check('sitemap locs exist', locs, (l) => (l && pageExists(stripOrigin(l)) ? '' : `no page for ${l}`))

// 2. hreflang alternates in sitemap
check('sitemap alternates', urlBlocks, (b) => {
  const hrefs = all(/<xhtml:link\b[^>]*>/g, b).map((m) => m[0])
  if (hrefs.length !== 3) return `${b.match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1]}: ${hrefs.length} alternates`
  const langs = hrefs.map((h) => h.match(/hreflang="([^"]+)"/i)?.[1]).sort().join(',')
  if (langs !== 'en,x-default,zh-CN') return `bad hreflang set ${langs}`
  const bad = hrefs.map((h) => h.match(/href="([^"]+)"/)?.[1]).filter((h) => !locSet.has(h))
  return bad.length ? `alternate not in sitemap: ${bad.join(', ')}` : ''
})

// 3. page head checks
const pages = locs.filter(Boolean).map((l) => ({ loc: l, path: stripOrigin(l) })).filter((p) => pageExists(p.path))
for (const p of pages) p.html = readFileSync(join(assets, p.path.slice(1), 'index.html'), 'utf8')
check('page head', pages, ({ loc, path, html }) => {
  const errs = []
  const canon = all(/<link[^>]*rel="canonical"[^>]*>/g, html)
  if (canon.length !== 1) errs.push(`${canon.length} canonicals`)
  else if (canon[0][0].match(/href="([^"]*)"/)?.[1] !== loc) errs.push('canonical != sitemap loc')
  if (!(html.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '').trim()) errs.push('empty title')
  const desc = html.match(/<meta[^>]*name="description"[^>]*>/)?.[0]?.match(/content="([^"]*)"/)?.[1] ?? ''
  if (desc.length < 50 || desc.length > 170) errs.push(`description length ${desc.length}`)
  const lang = html.match(/<html[^>]*\blang="([^"]*)"/)?.[1]
  const want = path === '/zh' || path.startsWith('/zh/') ? 'zh-CN' : 'en'
  if (lang !== want) errs.push(`lang ${lang}, want ${want}`)
  const alts = all(/<link[^>]*rel="alternate"[^>]*hreflang=/gi, html).length
  if (alts !== 3) errs.push(`${alts} hreflang alternates`)
  for (const m of all(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g, html)) {
    try { JSON.parse(m[1]) } catch { errs.push('invalid JSON-LD') }
  }
  return errs.length ? `${path}: ${errs.join('; ')}` : ''
})

// 4. internal links: every distinct page link, with the first page it was found on
const links = new Map()
for (const { path, html } of pages) {
  for (const m of all(/href="(\/[^"]*)"/g, html)) {
    const href = m[1].split('#')[0].split('?')[0]
    if (!href || href.startsWith('//') || /\.[a-z0-9]+$/i.test(href.split('/').pop())) continue
    if (!links.has(href)) links.set(href, path)
  }
}
check('internal links', [...links], ([href, from]) => (pageExists(href) ? '' : `broken ${href} (on ${from})`))

// 5. _redirects
const redirects = read('_redirects').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
check('redirects', redirects, (line) => {
  const [from, to, code] = line.split(/\s+/)
  if (!from || !to || code !== '301') return `bad line: ${line}`
  if (!pageExists(stripOrigin(to))) return `target missing: ${line}`
  if (pageExists(from)) return `source still exists as page: ${line}`
  return ''
})

// 6. sitemap-video.xml
const videoMap = read('sitemap-video.xml')
const videoLocs = all(/<loc>\s*([^<]+?)\s*<\/loc>/g, videoMap).map((m) => m[1])
const mediaUrls = all(/<video:(?:content_loc|thumbnail_loc)>\s*([^<]+?)\s*<\/video:/g, videoMap).map((m) => m[1])
check('video sitemap locs', videoLocs, (l) => (locSet.has(l) ? '' : `not in sitemap.xml: ${l}`))
check('video sitemap media urls', mediaUrls, (u) => (u.startsWith('https://') ? '' : `not https: ${u}`))

// 7. robots.txt
const robots = read('robots.txt')
check('robots sitemaps', ['sitemap.xml', 'sitemap-video.xml'], (f) =>
  new RegExp(`^Sitemap:\\s*\\S*/${f}\\s*$`, 'mi').test(robots) ? '' : `missing Sitemap line for ${f}`)

// 8. no local hosts
check('no localhost', pages, ({ path, html }) => (/localhost|127\.0\.0\.1/.test(html) ? `${path} mentions localhost/127.0.0.1` : ''))

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n` + failures.map((f) => '  ' + f).join('\n'))
  process.exit(1)
}
console.log('\nall checks passed')
