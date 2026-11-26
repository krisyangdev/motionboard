// Tells IndexNow (Bing, Yandex and others) which URLs changed, after a deploy: sends every URL of
// the built sitemap. The key file public/<key>.txt is served at the site root and proves ownership.
// A failed ping must not fail a deploy, so this always exits 0, but it prints the failure loudly.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE } from '../site.config.ts'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SITEMAP = join(ROOT, '.cloudflare/output/v1/workers/default/assets/sitemap.xml')

try {
  const key = SITE.indexNowKey
  if (!key) console.log('IndexNow: skipped, SITE.indexNowKey is empty')
  else {
    if (!existsSync(join(ROOT, 'public', `${key}.txt`))) throw new Error(`public/${key}.txt does not exist`)
    const urlList = [...readFileSync(SITEMAP, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    if (!urlList.length) throw new Error(`no URLs in ${SITEMAP}`)

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: SITE.domain, key, keyLocation: `https://${SITE.domain}/${key}.txt`, urlList }),
    })
    // 200 and 202 both mean accepted
    if (res.ok) console.log(`IndexNow: HTTP ${res.status}, ${urlList.length} URLs submitted`)
    else console.error(`!!! IndexNow FAILED: HTTP ${res.status} ${await res.text()}`)
  }
} catch (e) {
  console.error(`!!! IndexNow FAILED: ${e.message}`)
}
