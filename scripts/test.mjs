// Post-build checks for the prerendered static output. Run after `vite build`.
// Dependency-free: reads the assets dir, collects failures, exits 1 if any.
// Languages come from site.config.ts (through src/core/i18n.ts); nothing here is site specific.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { SITE, SITE_URL } from '../site.config.ts'
import { DEFAULT_LOCALE, DIR, HTML_LANG, LOCALES, PREFIXED_LOCALES, localizePath, pageUrl, stripLocale } from '../src/core/i18n.ts'
import { TITLE_MAX_WIDTH, textWidth } from '../src/core/content/schema.ts'
import { hubPagination, indexableLocales, isPrivatePath, messagesOf, pageLocales, sitePages } from '../src/core/pages.ts'
import { feedItems } from '../src/core/seo/feed.ts'
import { stampStatus } from '../src/core/seo/stamp.ts'
import { MAX_SITEMAP_URLS, newestDate, sitemapFiles, sitemapGroup } from '../src/core/seo/sitemaps.ts'
// Same value as ORG_ID in src/core/seo.ts (that module is bundler-only: extensionless imports).
const ORG_ID = `${SITE_URL}/about/#org`

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

// 1. sitemap.xml is an index of child sitemaps (one per page type or collection, see src/core/seo/sitemaps.ts) plus sitemap-video.xml
const sitemapIndex = read('sitemap.xml')
const indexChildren = all(/<sitemap>([\s\S]*?)<\/sitemap>/g, sitemapIndex).map((m) => ({ loc: m[1].match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1] ?? '', lastmod: m[1].match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/)?.[1] }))
const childNames = indexChildren.map((c) => stripOrigin(c.loc).slice(1))
const urlChildren = childNames.filter((n) => n !== 'sitemap-video.xml' && has(n))
const urlBlocksOf = (name) => all(/<url>([\s\S]*?)<\/url>/g, read(name)).map((m) => m[1])
const locOf = (b) => b.match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1]
const urlEntries = urlChildren.flatMap((name) => urlBlocksOf(name).map((block) => ({ name, block })))
const urlBlocks = urlEntries.map((e) => e.block)
const locs = urlBlocks.map(locOf).filter(Boolean)
const locSet = new Set(locs)
const isoDate = /^\d{4}-\d{2}-\d{2}$/
const pages = sitePages()
// The registry says which children exist: one per page type or collection with at least one indexable page, split at the URL limit.
const expectedChildren = [...sitemapFiles(pages).map((f) => f.name), ...(has('sitemap-video.xml') ? ['sitemap-video.xml'] : [])]
check('sitemap index', [null], () => {
  if (!/<sitemapindex\b[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/.test(sitemapIndex)) return 'sitemap.xml is not a <sitemapindex> with the sitemaps.org namespace'
  if (!/<\/sitemapindex>\s*$/.test(sitemapIndex) || all(/<sitemap>/g, sitemapIndex).length !== all(/<\/sitemap>/g, sitemapIndex).length) return 'sitemap.xml is not well formed'
  if (/<url>|<priority>|<changefreq>/.test(sitemapIndex)) return 'sitemap.xml lists URLs or has priority/changefreq'
  const bad = indexChildren.filter((c) => !c.loc.startsWith(`${SITE_URL}/sitemap`) || !c.loc.endsWith('.xml'))
  if (bad.length) return `child sitemaps not under ${SITE_URL}/: ${bad.map((c) => c.loc).join(', ')}`
  if (new Set(childNames).size !== childNames.length) return 'a child sitemap is listed twice'
  const missing = childNames.filter((n) => !has(n))
  if (missing.length) return `listed but not built: ${missing.join(', ')}`
  const want = [...expectedChildren].sort().join(', ')
  return [...childNames].sort().join(', ') === want ? '' : `children ${[...childNames].sort().join(', ')}, want ${want} (one per page type or collection, none empty)`
})
check('sitemap index lastmod', indexChildren.filter((c) => c.loc.slice(SITE_URL.length + 1) !== 'sitemap-video.xml'), (c) => {
  const name = c.loc.slice(SITE_URL.length + 1)
  const newest = newestDate(urlBlocksOf(name).map((b) => b.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]))
  return c.lastmod === newest ? '' : `${name}: index lastmod ${c.lastmod}, newest URL ${newest}`
})
check('sitemap children: well formed, not empty, within the URL limit, no priority/changefreq', urlChildren, (name) => {
  const xml = read(name)
  const n = urlBlocksOf(name).length
  if (!/^<\?xml\b/.test(xml) || !xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">')) return `${name}: no <?xml?> header or urlset namespaces`
  if (!/<\/urlset>\s*$/.test(xml) || all(/<url>/g, xml).length !== all(/<\/url>/g, xml).length || all(/<url>/g, xml).length !== n) return `${name}: not well formed`
  if (n === 0) return `${name}: empty (an empty child is not written)`
  if (n > MAX_SITEMAP_URLS) return `${name}: ${n} URLs, at most ${MAX_SITEMAP_URLS}`
  return /<priority>|<changefreq>/.test(xml) ? `${name}: has priority or changefreq (search engines ignore them)` : ''
})
check('sitemap urls: lastmod = the page\'s lastmod, child = the page\'s type', urlEntries, ({ name, block }) => {
  const loc = locOf(block)
  const page = pages.find((p) => p.path === stripLocale(stripOrigin(loc ?? '')))
  const lastmod = block.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/)?.[1]
  if (!lastmod || !isoDate.test(lastmod)) return `${loc}: no lastmod in YYYY-MM-DD (${lastmod ?? 'missing'}); extraPages need a lastmod`
  if (!page) return `${loc}: not a page of the site (sitePages())`
  if (page.lastmod !== lastmod) return `${loc}: lastmod ${lastmod}, the page says ${page.lastmod}`
  const group = sitemapGroup(page)
  return name === `sitemap-${group}.xml` || new RegExp(`^sitemap-${group}-\\d+\\.xml$`).test(name) ? '' : `${loc}: is in ${name}, want sitemap-${group}.xml`
})
check('sitemap not empty', [locs.length], (n) => (n > 0 ? '' : 'no <loc> found'))
const seenLocs = new Set()
check('sitemap urls listed once', locs, (l) => (seenLocs.has(l) ? `${l} is listed more than once` : (seenLocs.add(l), '')))
check('sitemap locs on site origin', locs, (l) => (l.startsWith(`${SITE_URL}/`) ? '' : `${l} is not under ${SITE_URL}`))
check('sitemap locs prerendered', locs, (l) => (pageExists(stripOrigin(l)) ? '' : `no page for ${l}`))

// A page exists only in the languages it has content for (no fallback), and its hreflang set is the languages the quality gate
// lets into the index plus x-default (a noindex language has no canonical or hreflang and is not in anyone's set).
const pageOfPath = (path) => pages.find((p) => p.path === stripLocale(path))
// Item pages from a collection (src/site/collections.ts). The collection checks below apply to them; a site's own item pages (extraPages) carry no collection.
const fromCollection = (p) => p?.type === 'item' && !!p.collection
const wantLangsOf = (page) => [...indexableLocales(page).map((l) => HTML_LANG[l]), 'x-default'].sort().join(',')

// 2a. the sitemap is exactly the indexable pages in their indexable languages: nothing noindex, nothing missing
const expectedLocs = pages.flatMap((p) => indexableLocales(p).map((l) => `${SITE_URL}${localizePath(l, p.path)}`))
check('sitemap = exactly the indexable pages', [...new Set([...expectedLocs, ...locs])], (l) =>
  locSet.has(l) && expectedLocs.includes(l) ? '' : locSet.has(l) ? `${l} is in the sitemap but is not an indexable page` : `${l} is an indexable page but is not in the sitemap`)

// 2b. hreflang alternates in the sitemap: one per language the page exists in plus x-default, all themselves in the sitemap
check('sitemap alternates', urlBlocks, (b) => {
  const links = tags('xhtml:link', b)
  const loc = locOf(b)
  const page = pageOfPath(stripOrigin(loc))
  if (!page) return `${loc}: not a page of the site (sitePages())`
  const wantLangs = wantLangsOf(page)
  if (links.length !== indexableLocales(page).length + 1) return `${loc}: ${links.length} alternates, want ${indexableLocales(page).length + 1}`
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
  const dir = html.match(/<html[^>]*\bdir="([^"]*)"/)?.[1]
  if (dir !== DIR[localeOfPath(path)]) errs.push(`dir ${dir}, want ${DIR[localeOfPath(path)]}`)
  const page = pageOfPath(path)
  const alts = tags('link', html).filter((t) => attr(t, 'rel') === 'alternate' && attr(t, 'hreflang'))
  if (!page) errs.push('not a page of the site (sitePages())')
  else if (alts.length !== indexableLocales(page).length + 1) errs.push(`${alts.length} hreflang links, want ${indexableLocales(page).length + 1}`)
  else if (alts.map((t) => attr(t, 'hreflang')).sort().join(',') !== wantLangsOf(page)) errs.push('hreflang set differs from the indexable languages of the page')
  for (const m of all(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g, html)) {
    try {
      JSON.parse(decode(m[1]))
    } catch {
      errs.push('invalid JSON-LD')
    }
  }
  const robots = attr(metas.find((t) => attr(t, 'name') === 'robots') ?? '', 'content') ?? ''
  if (/noindex/i.test(robots)) errs.push('noindex page is listed in the sitemap')
  return errs.length ? `${path}: ${errs.join('; ')}` : ''
})

// 3b. head checks that need the page type, the keyword or the JSON-LD (registry data from sitePages())
const ldTypes = (v) => (Array.isArray(v) ? v.flatMap(ldTypes) : v && typeof v === 'object' ? [...[v['@type']].flat().filter(Boolean), ...Object.values(v).flatMap(ldTypes)] : [])
const ldNodes = (v) => (Array.isArray(v) ? v.flatMap(ldNodes) : v && typeof v === 'object' ? [v, ...ldNodes(v['@graph'] ?? [])] : [])
const ldOf = (html) =>
  all(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g, html).flatMap((m) => {
    try {
      return [JSON.parse(decode(m[1]))]
    } catch {
      return [] // reported as invalid JSON-LD by the page head check
    }
  })
const titleOf = (html) => decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '').trim())
const unbranded = (t) => (t.endsWith(` \u00b7 ${SITE.name}`) ? t.slice(0, -` \u00b7 ${SITE.name}`.length) : t)
const metaContent = (html, key, value) => attr(tags('meta', html).find((t) => attr(t, key) === value) ?? '', 'content')

check('exactly one h1', sitemapPages, ({ path, html }) => {
  const n = all(/<h1[\s>]/g, html).length
  return n === 1 ? '' : `${path}: ${n} <h1> elements, want 1`
})

// The h1 contains the page's keyword (pages with a keyword: tools, guides, hubs).
const h1Text = (html) => decode((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '').replace(/<[^>]+>/g, '')).trim()
check('h1 contains the keyword', sitemapPages, ({ path, html }) => {
  const keyword = pageOfPath(path)?.keyword?.[localeOfPath(path)]
  if (!keyword) return ''
  return h1Text(html).toLowerCase().includes(keyword.toLowerCase()) ? '' : `${path}: h1 "${h1Text(html)}" does not contain the keyword "${keyword}"`
})

check('og:image is an absolute URL', sitemapPages, ({ path, html }) =>
  /^https?:\/\//.test(metaContent(html, 'property', 'og:image') ?? '') ? '' : `${path}: og:image missing or not an absolute URL`)

// Title length without the site name: 60 characters, 32 when CJK (the same limits as the content schema).
check('title length', sitemapPages, ({ path, html }) => {
  const t = unbranded(titleOf(html))
  return textWidth(t) <= TITLE_MAX_WIDTH ? '' : `${path}: title width is ${textWidth(t)} (${t}), at most ${TITLE_MAX_WIDTH} without the site name (CJK counts 2)`
})

// The first loop of 'page head' already rejects two pages with one title; descriptions get the same rule per language.
const descriptions = new Map()
check('description unique per language', sitemapPages, ({ path, html }) => {
  const key = `${localeOfPath(path)}|${metaContent(html, 'name', 'description') ?? ''}`
  const first = descriptions.get(key)
  if (first) return `${path}: same description as ${first}`
  descriptions.set(key, path)
  return ''
})

check('canonical is the page itself', prerendered.filter((p) => !p.is404), ({ path, html }) => {
  const canon = tags('link', html).filter((t) => attr(t, 'rel') === 'canonical').map((t) => attr(t, 'href'))
  return canon.every((c) => c === `${SITE_URL}${path}`) ? '' : `${path}: canonical ${canon.join(', ')} is not the page's own URL`
})

// FAQ stays visible content: no FAQPage in JSON-LD or microdata on any page.
check('no FAQPage markup', prerendered, ({ path, html }) =>
  ldOf(html).flatMap(ldTypes).includes('FAQPage') || /itemtype="[^"]*FAQPage/i.test(html) ? `${path}: FAQPage markup` : '')

// JSON-LD types a page must carry, by page type (any one of each group). BreadcrumbList is checked below against the visible trail.
const LD_REQUIRED = {
  home: [['WebSite'], ['Organization']],
  tool: [['WebApplication']],
  guide: [['Article']],
  compare: [['Article']],
  alternatives: [['Article']],
  glossary: [['DefinedTerm']],
  about: [['Organization']],
}
check('JSON-LD types per page type', sitemapPages, ({ path, html }) => {
  const page = pageOfPath(path)
  if (!page) return ''
  const types = new Set(ldOf(html).flatMap(ldTypes))
  const missing = (LD_REQUIRED[page.type] ?? []).filter((any) => !any.some((t) => types.has(t))).map((any) => any.join(' or '))
  // An item page describes its main media: ImageObject for an image, VideoObject for a video, neither without media.
  if (fromCollection(page)) {
    for (const [kind, type] of [['image', 'ImageObject'], ['video', 'VideoObject']]) {
      if (page.media === kind && !types.has(type)) missing.push(type)
      if (page.media !== kind && types.has(type)) return `${path}: item page has ${type} but its main media is ${page.media ?? 'none'}`
    }
  }
  return missing.length ? `${path}: ${page.type} page lacks JSON-LD ${missing.join(', ')}` : ''
})

// The visible breadcrumb, the BreadcrumbList and the registry trail (sitePages()) are the same list.
check('breadcrumb: visible = JSON-LD = registry', sitemapPages, ({ path, html }) => {
  const page = pageOfPath(path)
  const l = localeOfPath(path)
  if (!page) return ''
  const trail = page.breadcrumb?.[l]
  const lists = ldOf(html).flatMap(ldNodes).filter((n) => [n['@type']].flat().includes('BreadcrumbList'))
  const label = messagesOf(l).page.breadcrumb
  const nav = all(/<nav\b[^>]*\baria-label="([^"]*)"[^>]*>([\s\S]*?)<\/nav>/g, html).find((m) => decode(m[1]) === label)
  if (!trail) return lists.length || nav ? `${path}: has a breadcrumb but the registry lists none (sitePages())` : ''
  if (lists.length !== 1) return `${path}: ${lists.length} BreadcrumbList nodes, want 1`
  if (!nav) return `${path}: no visible breadcrumb (<nav aria-label="${label}">)`
  const visible = all(/<li\b[^>]*>([\s\S]*?)<\/li>/g, nav[2]).map((m) => ({
    name: decode(m[1].replace(/<span[^>]*aria-hidden[^>]*>[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '')).trim(),
    href: m[1].match(/<a\b[^>]*\bhref="([^"]*)"/)?.[1],
  }))
  const ld = (lists[0].itemListElement ?? []).map((i) => ({ name: i.name, path: stripOrigin(i.item ?? '') }))
  const want = trail.map((c, i) => ({ name: c.name, path: i === trail.length - 1 ? path : localizePath(l, c.path) }))
  const show = (items) => items.map((i) => `${i.name} ${i.path ?? i.href ?? '(current)'}`).join(' > ')
  const sameAsWant = (items, pathOf) => items.length === want.length && items.every((it, i) => it.name === want[i].name && (i === want.length - 1 ? pathOf(it) === undefined || pathOf(it) === path : pathOf(it) === want[i].path))
  if (!sameAsWant(visible, (it) => it.href)) return `${path}: visible breadcrumb [${show(visible)}] differs from the registry [${show(want)}]`
  if (!sameAsWant(ld, (it) => it.path)) return `${path}: JSON-LD breadcrumb [${show(ld)}] differs from the registry [${show(want)}]`
  return ''
})

// Item pages: Home > collection > category > name. The levels between home and the name are hub pages that exist in that language
// (the collection hub, then the primary category hub); the visible = JSON-LD = registry check above makes every level a link.
const hubExists = (path, l) => pages.some((p) => p.path === path && p.type === 'hub' && pageLocales(p).includes(l))
check('item breadcrumb: Home > collection > category > name', sitemapPages.filter((p) => fromCollection(pageOfPath(p.path))), ({ path }) => {
  const page = pageOfPath(path)
  const l = localeOfPath(path)
  const hub = `/${page.collection}/`
  const levels = (page.breadcrumb?.[l] ?? []).map((c) => c.path).slice(1, -1)
  if (hubExists(hub, l) && levels[0] !== hub) return `${path}: the breadcrumb lacks the collection level ${hub}`
  if (levels.length > 2) return `${path}: ${levels.length} levels between Home and the item, want at most 2 (collection, category)`
  if (levels.length === 2 && !(levels[1].startsWith(hub) && hubExists(levels[1], l))) return `${path}: category level ${levels[1]} is not a hub page`
  return ''
})

// A year in a title is for guide and compare pages and must be the year of the page's `updated` (= lastmod).
check('year in title = updated year', sitemapPages, ({ path, html }) => {
  const years = unbranded(titleOf(html)).match(/\b(?:19|20)\d{2}\b/g)
  if (!years) return ''
  const page = pageOfPath(path)
  if (!page || !['guide', 'compare'].includes(page.type)) return `${path}: a year in the title is allowed only on guide and compare pages`
  const updated = page.lastmod?.slice(0, 4)
  return years.every((y) => y === updated) ? '' : `${path}: title year ${years.join(', ')} differs from the updated year ${updated}`
})

// 3c. the about page defines the Organization node that every page's graph points at (ORG_ID, /about/#org in the default language)
const aboutPages = prerendered.filter((p) => pageOfPath(p.path)?.type === 'about')
check('Organization node lives on the about page', [null], () => {
  const own = aboutPages.find((p) => p.path === localizePath(LOCALES[0], '/about/'))
  if (!own) return `no about page at ${localizePath(LOCALES[0], '/about/')}: ${ORG_ID} points nowhere`
  return ''
})
check('about page Organization node', aboutPages, ({ path, html }) => {
  const orgs = ldOf(html).flatMap(ldNodes).filter((n) => [n['@type']].flat().includes('Organization') && n['@id'] === ORG_ID)
  if (orgs.length !== 1) return `${path}: ${orgs.length} Organization nodes with @id ${ORG_ID}, want 1`
  const o = orgs[0]
  const missing = ['name', 'url', 'logo', ...(SITE.email ? ['email'] : [])].filter((k) => !o[k])
  return missing.length ? `${path}: Organization node lacks ${missing.join(', ')}` : ''
})

// 3d. pages 2 and up of a paginated hub: prerendered, never in the sitemap, self-canonical (or noindex where the hub is),
// linked from the page before, and with a numbered title
const pagedUrls = new Set(hubPagination().flatMap((p) => p.locales.map((l) => localizePath(l, p.path))))
const pagedPairs = hubPagination().flatMap((p) => p.locales.map((l) => ({ ...p, l, url: localizePath(l, p.path) })))
check('hub pagination pages', pagedPairs, (p) => {
  const page = prerendered.find((x) => x.path === p.url)
  if (!page) return `${p.url}: not prerendered`
  const errs = []
  if (locSet.has(`${SITE_URL}${p.url}`)) errs.push('is in the sitemap')
  const canon = tags('link', page.html).filter((t) => attr(t, 'rel') === 'canonical').map((t) => attr(t, 'href'))
  if (p.noindex.includes(p.l)) {
    const robots = attr(tags('meta', page.html).find((t) => attr(t, 'name') === 'robots') ?? '', 'content') ?? ''
    if (!/noindex/i.test(robots)) errs.push('hub is noindex but the page has no noindex')
    if (canon.length) errs.push('noindex page has a canonical')
  } else if (canon.length !== 1 || canon[0] !== `${SITE_URL}${p.url}`) errs.push(`canonical ${canon.join(', ') || '(none)'} is not its own URL`)
  if (!new RegExp(`\\b${p.n}\\b`).test(unbranded(titleOf(page.html)))) errs.push(`title has no page number ${p.n}`)
  const before = prerendered.find((x) => x.path === localizePath(p.l, p.n === 2 ? p.hub : `${p.hub}page/${p.n - 1}/`))
  if (!before || !all(/\shref="([^"]*)"/g, before.html).some((m) => decode(m[1]) === p.url)) errs.push('is not linked with <a href> from the previous page')
  return errs.length ? `${p.url}: ${errs.join('; ')}` : ''
})

// 3e. collection items. Media is in the server HTML with alt text and size; an item that fails the quality gates is
// prerendered with noindex and is in no sitemap, no llms.txt and no hub list, while the indexable ones are all in the collection hub.
const itemPages = prerendered.filter((p) => fromCollection(pageOfPath(p.path)))
const mainOf = (html) => html.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? html
check('item media: alt, width and height; a video has a <source> in the HTML', itemPages, ({ path, html }) => {
  const page = pageOfPath(path)
  const main = mainOf(html)
  const errs = []
  for (const img of tags('img', main)) {
    const decorative = attr(img, 'aria-hidden') === 'true' && attr(img, 'alt') === ''
    if (!decorative && !attr(img, 'alt')?.trim()) errs.push(`<img ${attr(img, 'src')}> has no alt text`)
    if (!attr(img, 'width') || !attr(img, 'height')) errs.push(`<img ${attr(img, 'src')}> has no width and height`)
  }
  if (page.media === 'image' && !tags('img', main).length) errs.push('main media is an image but the page has no <img>')
  if (page.media === 'video') {
    const sources = tags('source', main).map((t) => attr(t, 'src'))
    if (!tags('video', main).length || !sources.length) errs.push('main media is a video but the HTML has no <video> with <source>')
    const contentUrls = ldOf(html).flatMap(ldNodes).filter((n) => [n['@type']].flat().includes('VideoObject')).map((n) => stripOrigin(n.contentUrl ?? ''))
    if (!contentUrls.every((u) => sources.includes(u))) errs.push('VideoObject contentUrl is not one of the <source> URLs')
  }
  return errs.length ? `${path}: ${errs.join('; ')}` : ''
})
const llmsText = has('llms.txt') ? read('llms.txt') : ''
const noindexItems = pages.filter(fromCollection).flatMap((p) => pageLocales(p).filter((l) => p.noindex?.[l]).map((l) => ({ page: p, l, url: localizePath(l, p.path) })))
const hubPagesOf = (collection, l) =>
  prerendered.filter((x) => (pageOfPath(x.path)?.type === 'hub' || pagedUrls.has(x.path)) && stripLocale(x.path).startsWith(`/${collection}/`) && localeOfPath(x.path) === l)
check('noindex items: noindex page, not in sitemap, llms.txt or hub lists', noindexItems, ({ page, l, url }) => {
  const own = prerendered.find((x) => x.path === url)
  if (!own) return `${url}: not prerendered`
  const errs = []
  const robots = attr(tags('meta', own.html).find((t) => attr(t, 'name') === 'robots') ?? '', 'content') ?? ''
  if (!/noindex/i.test(robots)) errs.push('no noindex meta')
  if (tags('link', own.html).some((t) => attr(t, 'rel') === 'canonical')) errs.push('has a canonical')
  if (locSet.has(`${SITE_URL}${url}`)) errs.push('is in a sitemap')
  if (llmsText.includes(`${SITE_URL}${url}`)) errs.push('is in llms.txt')
  for (const hub of hubPagesOf(page.collection, l)) if (all(/\shref="([^"]*)"/g, mainOf(hub.html)).some((m) => decode(m[1]) === url)) errs.push(`is listed on ${hub.path}`)
  return errs.length ? `${url}: ${errs.join('; ')}` : ''
})
const collectionIds = [...new Set(pages.filter(fromCollection).map((p) => p.collection))]
check('collection hub lists exactly the indexable items', collectionIds.flatMap((c) => LOCALES.map((l) => [c, l])), ([collection, l]) => {
  const items = pages.filter((p) => p.type === 'item' && p.collection === collection && indexableLocales(p).includes(l)).map((p) => localizePath(l, p.path))
  const hubs = hubPagesOf(collection, l).filter((x) => stripLocale(x.path) === `/${collection}/` || stripLocale(x.path).startsWith(`/${collection}/page/`))
  if (!hubs.length) return items.length ? `no hub page for ${collection} (${l}) but ${items.length} indexable items` : ''
  const listed = [...new Set(hubs.flatMap((h) => all(/\shref="([^"]*)"/g, mainOf(h.html)).map((m) => decode(m[1]))).filter((h) => items.includes(h) || pageOfPath(h)?.type === 'item'))]
  const extra = listed.filter((h) => !items.includes(h))
  const missing = items.filter((h) => !listed.includes(h))
  return extra.length || missing.length ? `${collection} (${l}): hub lists ${listed.length} items, want the ${items.length} indexable ones (extra: ${extra.join(', ') || 'none'}; missing: ${missing.join(', ') || 'none'})` : ''
})

// 4. prerendered pages outside the sitemap must not be indexable (pages 2 and up of a paginated hub are indexable but unlisted)
const outside = prerendered.filter((p) => !locSet.has(`${SITE_URL}${p.path}`) && !p.is404 && !pagedUrls.has(p.path))
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
  return isPrivatePath(href) || pageExists(href) || redirectSources.has(href) ? '' : `broken ${href} (on ${from})`
})

// 6b. values repeated in cloudflare.config.ts (it cannot import site.config.ts, see the comment there)
const cfConfig = readFileSync(join(root, 'cloudflare.config.ts'), 'utf8')
const esc = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
check('cloudflare.config.ts matches site.config.ts', [[`name: ${SITE.worker}`, `name:\\s*['"]${esc(SITE.worker)}['"]`], [`domains: [${SITE.domain}]`, `domains:\\s*\\[\\s*['"]${esc(SITE.domain)}['"]`], [`entrypoint: ./src/server.ts (security headers, accounts-off guard, queue, cron)`, `entrypoint:\\s*['"]\\./src/server\\.ts['"]`]], ([label, re]) =>
  new RegExp(re).test(cfConfig) ? '' : `cloudflare.config.ts lacks ${label}`)

// 7. robots.txt
const robots = has('robots.txt') ? read('robots.txt') : ''
check('robots.txt', [null], () => {
  if (!robots) return 'robots.txt missing'
  if (/^Disallow:\s*\/\s*$/im.test(robots)) return 'robots.txt disallows everything'
  const files = ['sitemap.xml', ...(has('sitemap-video.xml') ? ['sitemap-video.xml'] : [])]
  const missing = files.filter((f) => !new RegExp(`^Sitemap:\\s*\\S*/${f.replace('.', '\\.')}\\s*$`, 'mi').test(robots))
  if (missing.length) return `missing Sitemap line for ${missing.join(', ')}`
  // Training crawlers are blocked exactly when SITE.seo.allowTraining is false; search crawlers are never blocked.
  const blocked = ['GPTBot', 'ClaudeBot', 'Google-Extended'].filter((b) => new RegExp(`^User-agent:\\s*${b}\\s*$`, 'mi').test(robots))
  const wantBlocked = SITE.seo?.allowTraining === false ? ['GPTBot', 'ClaudeBot', 'Google-Extended'] : []
  if (blocked.join() !== wantBlocked.join()) return `robots.txt blocks training crawlers [${blocked.join(', ')}], SITE.seo.allowTraining wants [${wantBlocked.join(', ')}]`
  const search = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Applebot'].filter((b) => new RegExp(`^User-agent:\\s*${b}\\s*$`, 'mi').test(robots))
  return search.length ? `robots.txt has rules for search crawlers: ${search.join(', ')}` : ''
})

// 8. sitemap-video.xml (optional)
if (has('sitemap-video.xml')) {
  const videoMap = read('sitemap-video.xml')
  const videoLocs = all(/<loc>\s*([^<]+?)\s*<\/loc>/g, videoMap).map((m) => m[1])
  const media = all(/<video:(?:content_loc|thumbnail_loc)>\s*([^<]+?)\s*<\/video:/g, videoMap).map((m) => m[1])
  check('video sitemap locs', videoLocs, (l) => (locSet.has(l) ? '' : `not in the sitemaps: ${l}`))
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

// 12. /feed.xml: RSS 2.0 of the dated pages of the default language (guides), newest first, linked from every page's head
const feedXml = has('feed.xml') ? read('feed.xml') : ''
const feedBlocks = all(/<item>([\s\S]*?)<\/item>/g, feedXml).map((m) => m[1])
const feedTag = (xml, t) => decode(xml.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`))?.[1] ?? '').trim()
check('feed.xml: valid RSS 2.0, the dated pages of the default language, newest first', [null], () => {
  if (!feedXml) return 'feed.xml missing'
  if (!/^<\?xml\b/.test(feedXml) || !/<rss version="2\.0"/.test(feedXml) || !/<\/rss>\s*$/.test(feedXml) || all(/<item>/g, feedXml).length !== all(/<\/item>/g, feedXml).length) return 'feed.xml is not well formed RSS 2.0'
  const channel = feedXml.replace(/<item>[\s\S]*?<\/item>/g, '')
  for (const t of ['title', 'link', 'description', 'language']) if (!feedTag(channel, t)) return `the channel has no <${t}>`
  if (feedTag(channel, 'link') !== `${SITE_URL}/`) return `channel link ${feedTag(channel, 'link')}, want ${SITE_URL}/`
  const want = feedItems(pages).map((i) => i.link)
  const got = feedBlocks.map((b) => feedTag(b, 'link'))
  if (got.join() !== want.join()) return `items [${got.join(', ')}], want [${want.join(', ')}] (indexable guides in ${DEFAULT_LOCALE})`
  let last = Infinity
  for (const b of feedBlocks) {
    const link = feedTag(b, 'link')
    const page = pageOfPath(stripOrigin(link))
    if (!feedTag(b, 'title') || !feedTag(b, 'description') || feedTag(b, 'guid') !== link) return `${link}: item needs title, description and a guid equal to its link`
    if (!locSet.has(link) || link !== pageUrl(DEFAULT_LOCALE, page.path)) return `${link}: not an indexable URL of the default language`
    const date = Date.parse(feedTag(b, 'pubDate'))
    if (Number.isNaN(date) || date !== Date.parse(`${page.lastmod}T00:00:00Z`)) return `${link}: pubDate is not the page's lastmod ${page.lastmod}`
    if (date > last) return `${link}: not newest first`
    last = date
  }
  return ''
})
check('feed linked from the head', sitemapPages, ({ path, html }) =>
  tags('link', html).some((t) => attr(t, 'rel') === 'alternate' && attr(t, 'type') === 'application/rss+xml' && attr(t, 'href') === '/feed.xml') ? '' : `${path}: no <link rel="alternate" type="application/rss+xml" href="/feed.xml">`)

// 13. freshness: content/.hashes.json holds the hash of every content file (npm run stamp), so a content change cannot ship without a stamp decision
const stampState = stampStatus()
check('content hashes match content/.hashes.json (npm run stamp)', [...Object.keys(stampState.current), ...stampState.removed], (rel) => {
  if (stampState.changed.includes(rel)) return `${rel}: content changed since the last stamp. Run \`npm run stamp\` (sets \`updated\` to today), or \`npm run stamp -- --minor <slug>\` for a typo fix that keeps the date`
  if (stampState.added.includes(rel)) return `${rel}: no hash recorded. Run \`npm run stamp\``
  if (stampState.removed.includes(rel)) return `${rel}: recorded in content/.hashes.json but the file is gone. Run \`npm run stamp\``
  return ''
})

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n` + failures.map((f) => '  ' + f).join('\n'))
  process.exit(1)
}
console.log('\nall checks passed')
