// Post-build checks for the prerendered static output. Run after `vite build`.
// Dependency-free: reads the assets dir, collects failures, exits 1 if any.
// Languages come from site.config.ts (through src/core/i18n.ts); nothing here is site specific.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { SITE, SITE_URL } from '../site.config.ts'
import { HTML_LANG, LOCALES, PREFIXED_LOCALES } from '../src/core/i18n.ts'

const root = new URL('..', import.meta.url).pathname
// Optional first argument: another assets directory (used to try the checks on a hand-made site).
const assets = process.argv[2] ? resolve(process.argv[2]) : join(root, '.cloudflare/output/v1/workers/default/assets')
const failures = []
const has = (f) => existsSync(join(assets, f))
const read = (f) => readFileSync(join(assets, f), 'utf8')
const all = (re, s) => [...s.matchAll(re)]
const stripOrigin = (u) => u.replace(/^https?:\/\/[^/]+/, '')
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  return m ? decode(m[1] ?? m[2]) : undefined
}
const tags = (name, html) => all(new RegExp(`<${name}\\b[^>]*>`, 'gi'), html).map((m) => m[0])
const pageExists = (p) => existsSync(join(assets, p.slice(1), 'index.html'))
const check = (name, items, fn) => {
  const before = failures.length
  for (const item of items) {
    const msg = fn(item)
    if (msg) failures.push(`[${name}] ${msg}`)
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} ${name}: ${items.length} checked, ${failures.length - before} failed`)
}

if (!has('sitemap.xml')) {
  console.error(`FAIL sitemap.xml not found in ${relative(root, assets)} (run the build first)`)
  process.exit(1)
}

// Every prerendered page (index.html in any folder, plus a 404.html) with its URL path.
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const f = join(dir, n)
    return statSync(f).isDirectory() ? walk(f) : [f]
  })
const prerendered = walk(assets)
  .map((f) => relative(assets, f))
  .filter((f) => f === '404.html' || f === 'index.html' || f.endsWith('/index.html'))
  // HTML copied from public/ (e.g. runnable example projects) is a static asset, not a prerendered page.
  .filter((f) => !existsSync(join(root, 'public', f)))
  .map((f) => ({ file: f, path: f === '404.html' ? '/404/' : `/${f.slice(0, -'index.html'.length)}`, is404: f === '404.html' || f === '404/index.html', html: read(f) }))

// 1. sitemap.xml
const sitemap = read('sitemap.xml')
const urlBlocks = all(/<url>([\s\S]*?)<\/url>/g, sitemap).map((m) => m[1])
const locOf = (b) => b.match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1]
const locs = urlBlocks.map(locOf).filter(Boolean)
const locSet = new Set(locs)
check('sitemap not empty', [locs.length], (n) => (n > 0 ? '' : 'no <loc> found'))
check('sitemap locs on site origin', locs, (l) => (l.startsWith(`${SITE_URL}/`) ? '' : `${l} is not under ${SITE_URL}`))
check('sitemap locs prerendered', locs, (l) => (pageExists(stripOrigin(l)) ? '' : `no page for ${l}`))

// 2. hreflang alternates in the sitemap: one per language plus x-default, all themselves in the sitemap
const wantLangs = [...LOCALES.map((l) => HTML_LANG[l]), 'x-default'].sort().join(',')
check('sitemap alternates', urlBlocks, (b) => {
  const links = tags('xhtml:link', b)
  const loc = locOf(b)
  if (links.length !== LOCALES.length + 1) return `${loc}: ${links.length} alternates, want ${LOCALES.length + 1}`
  const langs = links.map((h) => attr(h, 'hreflang')).sort().join(',')
  if (langs !== wantLangs) return `${loc}: hreflang set ${langs}, want ${wantLangs}`
  const hrefs = links.map((h) => attr(h, 'href'))
  const bad = hrefs.filter((h) => !locSet.has(h))
  if (bad.length) return `${loc}: alternate not in sitemap: ${bad.join(', ')}`
  return hrefs.includes(loc) ? '' : `${loc}: not among its own alternates`
})

// 3. head checks of every sitemap page
const sitemapPages = prerendered.filter((p) => locSet.has(`${SITE_URL}${p.path}`))
const titles = new Map()
const localeOfPath = (path) => PREFIXED_LOCALES.find((l) => path === `/${l}/` || path.startsWith(`/${l}/`)) ?? LOCALES[0]
check('page head', sitemapPages, ({ path, html }) => {
  const loc = `${SITE_URL}${path}`
  const errs = []
  const canon = tags('link', html).filter((t) => attr(t, 'rel') === 'canonical')
  if (canon.length !== 1) errs.push(`${canon.length} canonicals`)
  else if (attr(canon[0], 'href') !== loc) errs.push(`canonical ${attr(canon[0], 'href')} != sitemap loc`)
  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '').trim())
  if (!title) errs.push('empty title')
  else if (titles.has(title)) errs.push(`title duplicates ${titles.get(title)}`)
  else titles.set(title, path)
  const metas = tags('meta', html)
  const desc = attr(metas.find((t) => attr(t, 'name') === 'description') ?? '', 'content') ?? ''
  // A CJK character carries about two Latin characters of meaning; search results cut CJK snippets near 80-100.
  const [min, max] = /[\u3040-\u30ff\u3400-\u9fff]/.test(desc) ? [25, 110] : [50, 170]
  if (desc.length < min || desc.length > max) errs.push(`description length ${desc.length}`)
  const lang = html.match(/<html[^>]*\blang="([^"]*)"/)?.[1]
  const want = HTML_LANG[localeOfPath(path)]
  if (lang !== want) errs.push(`lang ${lang}, want ${want}`)
  const alts = tags('link', html).filter((t) => attr(t, 'rel') === 'alternate' && attr(t, 'hreflang'))
  if (alts.length !== LOCALES.length + 1) errs.push(`${alts.length} hreflang links, want ${LOCALES.length + 1}`)
  else if (alts.map((t) => attr(t, 'hreflang')).sort().join(',') !== wantLangs) errs.push('hreflang set differs from the configured languages')
  for (const m of all(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g, html)) {
    try {
      JSON.parse(decode(m[1]))
    } catch {
      errs.push('invalid JSON-LD')
    }
  }
  if (!attr(metas.find((t) => attr(t, 'property') === 'og:image') ?? '', 'content')) errs.push('missing og:image')
  const robots = attr(metas.find((t) => attr(t, 'name') === 'robots') ?? '', 'content') ?? ''
  if (/noindex/i.test(robots)) errs.push('noindex page is listed in the sitemap')
  return errs.length ? `${path}: ${errs.join('; ')}` : ''
})

// 4. prerendered pages outside the sitemap must not be indexable
const outside = prerendered.filter((p) => !locSet.has(`${SITE_URL}${p.path}`) && !p.is404)
check('pages outside sitemap are noindex', outside, ({ path, html }) => {
  const robots = tags('meta', html).find((t) => attr(t, 'name') === 'robots')
  return robots && /noindex/i.test(attr(robots, 'content') ?? '') ? '' : `${path} is not in the sitemap and has no noindex`
})

// 5. _redirects
const redirectLines = has('_redirects')
  ? read('_redirects').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  : []
const redirectSources = new Set(redirectLines.map((l) => l.split(/\s+/)[0]))
check('redirects', redirectLines, (line) => {
  const [from, to, code] = line.split(/\s+/)
  if (!from || !to || code !== '301') return `bad line (want "from to 301"): ${line}`
  // The target is a page or a static file (e.g. a renamed /r/<slug>.md).
  if (!pageExists(stripOrigin(to)) && !has(stripOrigin(to).slice(1))) return `target missing: ${line}`
  if (pageExists(from)) return `source still exists as a page: ${line}`
  return ''
})

// 6. internal links: every distinct link with the first page it was found on
const links = new Map()
for (const { path, html } of prerendered) {
  for (const m of all(/\shref="(\/[^"]*)"/g, html)) {
    const href = decode(m[1]).split('#')[0].split('?')[0]
    if (!href || href.startsWith('//') || /\.[a-z0-9]+$/i.test(href.split('/').pop())) continue
    if (!links.has(href)) links.set(href, path)
  }
}
check('internal links', [...links], ([href, from]) => {
  if (!href.endsWith('/')) return `link without trailing slash ${href} (on ${from})`
  return pageExists(href) || redirectSources.has(href) ? '' : `broken ${href} (on ${from})`
})

// 7. robots.txt
const robots = has('robots.txt') ? read('robots.txt') : ''
check('robots.txt', [null], () => {
  if (!robots) return 'robots.txt missing'
  if (/^Disallow:\s*\/\s*$/im.test(robots)) return 'robots.txt disallows everything'
  const files = ['sitemap.xml', ...(has('sitemap-video.xml') ? ['sitemap-video.xml'] : [])]
  const missing = files.filter((f) => !new RegExp(`^Sitemap:\\s*\\S*/${f.replace('.', '\\.')}\\s*$`, 'mi').test(robots))
  return missing.length ? `missing Sitemap line for ${missing.join(', ')}` : ''
})

// 8. sitemap-video.xml (optional)
if (has('sitemap-video.xml')) {
  const videoMap = read('sitemap-video.xml')
  const videoLocs = all(/<loc>\s*([^<]+?)\s*<\/loc>/g, videoMap).map((m) => m[1])
  const media = all(/<video:(?:content_loc|thumbnail_loc)>\s*([^<]+?)\s*<\/video:/g, videoMap).map((m) => m[1])
  check('video sitemap locs', videoLocs, (l) => (locSet.has(l) ? '' : `not in sitemap.xml: ${l}`))
  check('video sitemap media urls', media, (u) => (u.startsWith('https://') ? '' : `not https: ${u}`))
}

// 9. _headers and llms.txt
const headers = has('_headers') ? read('_headers') : ''
check('_headers', ['Content-Security-Policy', 'Strict-Transport-Security'], (h) => (headers.includes(h) ? '' : `_headers has no ${h}`))
if (SITE.llmsTxt) check('llms.txt', [null], () => (has('llms.txt') && read('llms.txt').trim() ? '' : 'llms.txt missing or empty'))

// 10. no local hosts
check('no localhost', prerendered, ({ path, html }) => (/localhost|127\.0\.0\.1/.test(html) ? `${path} mentions localhost/127.0.0.1` : ''))

// 11. performance guard: app JS is started by the boot loader after LCP, CSS is inlined
const moduleScript = /<script\b(?=[^>]*\btype="module")(?=[^>]*\bsrc=)[^>]*>/i
check('initial HTML starts no module script', prerendered, ({ path, html }) =>
  moduleScript.test(html) || /<link\b[^>]*\brel="modulepreload"/i.test(html) ? `${path} loads module JS in its initial HTML` : '')
check('initial HTML has no external stylesheet', prerendered, ({ path, html }) =>
  /<link\b[^>]*\brel="?stylesheet/i.test(html) ? `${path} links an external stylesheet` : '')

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n` + failures.map((f) => '  ' + f).join('\n'))
  process.exit(1)
}
console.log('\nall checks passed')
