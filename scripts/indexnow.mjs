// Tells IndexNow (Bing, Yandex and others) which URLs changed, after a deploy: sends every URL of
// the built sitemap. The key file public/<key>.txt is served at the site root and proves ownership.
// A failed ping must not fail a deploy, so this always exits 0, but it prints the failure loudly.
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE } from '../src/site.config.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const HOST = SITE.domain
const SITEMAP = join(ROOT, '.cloudflare/output/v0/workers/default/assets/sitemap.xml')

try {
  const keyFile = readdirSync(join(ROOT, 'public')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))
  if (!keyFile) throw new Error('no IndexNow key file (<32 hex>.txt) in public/')
  const key = keyFile.replace('.txt', '')
  if (key !== SITE.indexNowKey) throw new Error(`public/${keyFile} does not match SITE.indexNowKey`)
  const urlList = [...readFileSync(SITEMAP, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  if (!urlList.length) throw new Error(`no URLs in ${SITEMAP}`)

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList }),
  })
  // 200 and 202 both mean accepted
  if (res.ok) console.log(`IndexNow: HTTP ${res.status}, ${urlList.length} URLs submitted`)
  else console.error(`!!! IndexNow FAILED: HTTP ${res.status} ${await res.text()}`)
} catch (e) {
  console.error(`!!! IndexNow FAILED: ${e.message}`)
}
