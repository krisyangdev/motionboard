// Deploy check: fetches the live home page with the user agents of the search and AI-search crawlers and expects 200.
// Cloudflare's "Block AI bots" (Security > Bots) answers these with 403 or a challenge, and then the site disappears from
// Bing, ChatGPT search, Perplexity and Claude search without any error on our side. Exits 1 naming each blocked agent.
// `node scripts/check-crawlers.mjs [--url https://example.com/]` (default: https://<SITE.domain>/). Run by `npm run deploy` after `cf deploy`.
import { SITE } from '../site.config.ts'

const at = process.argv.indexOf('--url')
const url = at === -1 ? `https://${SITE.domain}/` : process.argv[at + 1]
if (!url) {
  console.error('usage: node scripts/check-crawlers.mjs [--url <url>]')
  process.exit(1)
}

const BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const CRAWLERS = {
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'OAI-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  PerplexityBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  'Claude-SearchBot': 'Mozilla/5.0 (compatible; Claude-SearchBot/1.0; +https://www.anthropic.com)',
  Applebot: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)',
}

const status = async (ua) => {
  try {
    return (await fetch(url, { headers: { 'user-agent': ua }, signal: AbortSignal.timeout(20_000) })).status
  } catch (e) {
    return `error: ${e.message}`
  }
}

// A normal browser first: when it fails too, the site is down or unreachable and no crawler is to blame.
const base = await status(BROWSER)
if (base !== 200) {
  console.error(`!!! crawler check: ${url} answers ${base} to a normal browser; the site itself is not reachable, not a crawler block`)
  process.exit(1)
}

const blocked = []
for (const [name, ua] of Object.entries(CRAWLERS)) {
  const s = await status(ua)
  console.log(`${s === 200 ? 'ok  ' : 'FAIL'} ${name}: ${s}`)
  if (s !== 200) blocked.push(`${name} (${s})`)
}
if (blocked.length) {
  console.error(`!!! crawler check: ${url} blocks ${blocked.join(', ')}. Turn off Cloudflare "Block AI bots" (Security > Bots) and any WAF rule that matches these user agents.`)
  process.exit(1)
}
console.log(`crawler check: ${url} answers 200 to all ${Object.keys(CRAWLERS).length} crawlers`)
