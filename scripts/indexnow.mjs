// Tells IndexNow (Bing, Yandex and others) which URLs changed, after a deploy. It reads the built sitemaps and sends the
// URLs whose `lastmod` changed since the last successful ping (new URLs count as changed); `--all` sends every URL.
// .indexnow-sent.json in the repo root (gitignored) records what was sent; without it the first run is a full ping.
// The key file public/<key>.txt is served at the site root and proves ownership.
// A failed ping must not fail a deploy, so this always exits 0, but it prints the failure loudly.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE } from '../site.config.ts'
import { changedUrls, chunk, nextRecord, parseSitemap, parseSitemapIndex } from '../src/core/seo/indexnow.ts'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ASSETS = join(ROOT, '.cloudflare/output/v1/workers/default/assets')
const RECORD = join(ROOT, '.indexnow-sent.json')
// IndexNow accepts at most 10,000 URLs per request.
const BATCH = 10_000

try {
  const key = SITE.indexNowKey
  if (!key) console.log('IndexNow: skipped, SITE.indexNowKey is empty')
  else {
    if (!existsSync(join(ROOT, 'public', `${key}.txt`))) throw new Error(`public/${key}.txt does not exist`)

    // Every URL of the child sitemaps (the video sitemap lists the same pages).
    const index = readFileSync(join(ASSETS, 'sitemap.xml'), 'utf8')
    const current = {}
    for (const loc of parseSitemapIndex(index)) {
      const file = new URL(loc).pathname.slice(1)
      if (file === 'sitemap-video.xml') continue
      Object.assign(current, parseSitemap(readFileSync(join(ASSETS, file), 'utf8')))
    }
    if (!Object.keys(current).length) throw new Error(`no URLs in the sitemaps of ${ASSETS}`)

    let sent = {}
    if (existsSync(RECORD)) {
      try {
        sent = JSON.parse(readFileSync(RECORD, 'utf8'))
      } catch {
        console.error('IndexNow: .indexnow-sent.json is not valid JSON, sending every URL')
      }
    }
    const urls = process.argv.includes('--all') ? Object.keys(current) : changedUrls(current, sent)
    const mode = process.argv.includes('--all') ? 'all' : Object.keys(sent).length ? 'changed' : 'first run'

    if (!urls.length) console.log('IndexNow: no URL changed since the last ping, nothing sent')
    else {
      const submitted = []
      for (const urlList of chunk(urls, BATCH)) {
        const res = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'content-type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ host: SITE.domain, key, keyLocation: `https://${SITE.domain}/${key}.txt`, urlList }),
        })
        // 200 and 202 both mean accepted
        if (res.ok) {
          submitted.push(...urlList)
          console.log(`IndexNow: HTTP ${res.status}, ${urlList.length} URLs submitted (${mode})`)
        } else console.error(`!!! IndexNow FAILED: HTTP ${res.status} ${await res.text()}`)
      }
      writeFileSync(RECORD, `${JSON.stringify(nextRecord(current, sent, submitted), null, 2)}\n`)
    }
  }
} catch (e) {
  console.error(`!!! IndexNow FAILED: ${e.message}`)
}
