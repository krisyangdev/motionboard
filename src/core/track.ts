// Self-contained tracking. Events go straight to PostHog's capture endpoint (no SDK, no extra scripts).
// Cookieless: every event uses distinct_id `$posthog_cookieless` with `$cookieless_mode`, and PostHog replaces it
// with a server-side hash of daily salt + IP + host + user agent, so nothing is stored in the browser.
// No person profiles, no replay. Country comes from /cdn-cgi/trace (PostHog drops the IP of cookieless events),
// UTM and click-id params from the landing URL are kept in memory and sent on every event, and bot user agents send nothing.
// Without a key it logs to the console and sends nothing. No framework imports, so the file can be copied to any site.

type Dict = Record<string, string | number | boolean | undefined>

/** Browser events from the shared schema in ~/code/home/lines/sites.md. `lang` and `site` are added automatically. */
export type TrackEvent =
  | { event: '$pageview'; page: string; page_type: string; landing_page: string; referrer_type: string; device: string }
  | { event: 'tool_start'; tool: string; page: string }
  | { event: 'tool_result'; tool: string; page: string; ms: number; ok: boolean }
  | { event: 'upload'; tool: string; file_type: string; size_bucket: string }
  | { event: 'download'; tool: string; format: string }
  | { event: 'copy'; tool: string; what: string; page: string; recipe?: string }
  | { event: 'video_play'; recipe: string; page: string; trigger: 'auto' | 'click' }
  | { event: 'cta_click'; page: string; to: string }
  | { event: 'error'; page: string; endpoint: string; code: string }

export interface TrackingOptions {
  site: string
  /** PostHog project key; empty means console-only. */
  key?: string
  /** PostHog ingestion host, e.g. https://us.i.posthog.com */
  host: string
  /** Page language; defaults to <html lang>. */
  lang?: string
}

interface WireEvent {
  event: string
  distinct_id: string
  timestamp: string
  properties: Record<string, unknown>
}

let opts: TrackingOptions = { site: 'unknown', host: '' }
let queue: WireEvent[] = []
let ready = false
/** The first flush waits for the country lookup. */
let held = true
let bot = false
let campaign: Dict = {}
let countryProps: Dict = {}
let exceptionCount = 0
/** A crash loop must not flood the project. */
const MAX_EXCEPTIONS = 10
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|prerender|phantomjs|puppeteer|playwright|selenium|gtmetrix|inspectiontool/i
const CAMPAIGN_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'msclkid', 'ref']

export function initTracking(options: TrackingOptions): void {
  opts = { ...options }
  held = true
  campaign = {}
  countryProps = {}
  ready = document.readyState === 'complete'
  bot = BOT_UA.test(navigator.userAgent)
  if (!opts.key || bot) return
  const params = new URLSearchParams(location.search)
  for (const name of CAMPAIGN_PARAMS) {
    const value = params.get(name)
    if (value) campaign[name] = value
  }
  // Hold events until the page has loaded so analytics never competes with first paint; flush early if the page is hidden.
  if (ready) void lookupCountry()
  else {
    addEventListener(
      'load',
      () => {
        ready = true
        void lookupCountry()
      },
      { once: true },
    )
  }
  addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

/** Country from the edge (PostHog never sees the IP of cookieless events). Releases the held flush when it resolves or after 1500 ms. */
async function lookupCountry(): Promise<void> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 1500)
  try {
    const text = await (await fetch('/cdn-cgi/trace', { signal: controller.signal })).text()
    const code = /^loc=([A-Z]{2})$/m.exec(text)?.[1]
    if (code && code !== 'XX' && code !== 'T1') {
      countryProps = { $geoip_country_code: code, $geoip_country_name: new Intl.DisplayNames(['en'], { type: 'region' }).of(code) }
    }
  } catch {
    /* no country */
  } finally {
    clearTimeout(timer)
    held = false
    setTimeout(flush, 0)
  }
}

/** Update the language reported on later events (client-side navigation can change language without changing <html lang>). */
export function setTrackingLang(lang: string): void {
  opts.lang = lang
}

function client(): Dict {
  const ua = navigator.userAgent
  const browser = /Edg\//.test(ua) ? 'Microsoft Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\/|FxiOS/.test(ua) ? 'Firefox' : /Chrome\/|CriOS/.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other'
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'Mac OS X' : /Linux/.test(ua) ? 'Linux' : 'Other'
  const device = /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'Tablet' : /Mobi|iPhone|iPod/.test(ua) ? 'Mobile' : 'Desktop'
  let refHost = '$direct'
  try {
    if (document.referrer) refHost = new URL(document.referrer).hostname
  } catch {
    /* keep $direct */
  }
  return {
    $lib: 'track.ts',
    $browser: browser,
    $os: os,
    $device_type: device,
    $current_url: location.href,
    $host: location.host,
    $pathname: location.pathname,
    $referrer: document.referrer || '$direct',
    $referring_domain: refHost,
    $screen_width: screen.width,
    $screen_height: screen.height,
    $viewport_width: innerWidth,
    $viewport_height: innerHeight,
    $raw_user_agent: ua,
    $cookieless_mode: true,
    $timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    $process_person_profile: false,
  }
}

function flush(): void {
  if (!queue.length) return
  const batch = queue.map((e) => ({ ...e, properties: { ...e.properties, ...countryProps } }))
  const body = JSON.stringify({ api_key: opts.key, batch })
  queue = []
  const url = `${opts.host}/batch/`
  try {
    if (navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))) return
  } catch {
    /* fall through to fetch */
  }
  fetch(url, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'text/plain' } }).catch(() => {})
}

function send(event: string, props: Record<string, unknown>): void {
  const payload = {
    ...props,
    lang: opts.lang ?? (document.documentElement.lang || 'en').slice(0, 2),
    site: opts.site,
  }
  if (!opts.key) {
    console.log('[track]', event, payload)
    ;((window as unknown as { __events?: unknown[] }).__events ??= []).push({ event, ...payload })
    return
  }
  if (bot) return
  queue.push({ event, distinct_id: '$posthog_cookieless', timestamp: new Date().toISOString(), properties: { ...client(), ...campaign, ...payload } })
  if (ready && !held) setTimeout(flush, 0)
}

export function track<E extends TrackEvent['event']>(event: E, props: Omit<Extract<TrackEvent, { event: E }>, 'event'>): void {
  send(event, props)
}

/** Chrome ("at fn (file:1:2)") and Firefox/Safari ("fn@file:1:2") stack lines to PostHog raw frames. */
function parseFrames(stack: string | undefined) {
  if (!stack) return []
  const frames = []
  for (const line of stack.split('\n')) {
    const m = line.match(/^\s*at (?:(.*?) \()?(.+?):(\d+):(\d+)\)?\s*$/) ?? line.match(/^(.*?)@(.+?):(\d+):(\d+)\s*$/)
    if (!m) continue
    frames.push({ function: m[1] || '?', filename: m[2], lineno: Number(m[3]), colno: Number(m[4]), platform: 'web:javascript', in_app: true })
  }
  return frames.reverse() // PostHog wants the oldest call first
}

/** Best-effort PostHog error tracking: sends a `$exception` event from any caught or uncaught error. */
export function captureException(error: unknown, extra?: Record<string, string>): void {
  try {
    if (exceptionCount++ >= MAX_EXCEPTIONS) return
    const err = error instanceof Error ? error : undefined
    const type = err?.name || 'Error'
    const value = (err?.message ?? (typeof error === 'string' ? error : JSON.stringify(error) ?? String(error))).slice(0, 500)
    send('$exception', {
      ...extra,
      page: location.pathname,
      $exception_message: value,
      $exception_type: type,
      $exception_list: [{ type, value, stacktrace: { type: 'raw', frames: parseFrames(err?.stack) } }],
    })
  } catch {
    /* error reporting must never throw */
  }
}

export function referrerType(): string {
  if (!document.referrer) return 'direct'
  let host = ''
  try {
    host = new URL(document.referrer).hostname
  } catch {
    return 'other'
  }
  if (host === location.hostname) return 'internal'
  if (/(^|\.)(google|bing|duckduckgo|yahoo|baidu|yandex|ecosia|brave)\./.test(host)) return 'search'
  if (/(^|\.)(facebook|instagram|twitter|x|t|reddit|tiktok|youtube|pinterest|linkedin|discord)\.(com|co|me|net|org)$/.test(host)) return 'social'
  return 'other'
}
