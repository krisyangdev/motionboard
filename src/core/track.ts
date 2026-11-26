// Self-contained tracking. Events go straight to PostHog's capture endpoint (no SDK, no extra scripts).
// Stateless and cookieless: a random anonymous id per page load, nothing stored in the browser,
// no person profiles, no replay, no IP property. Without a key it logs to the console and sends nothing.
// No framework imports, so the file can be copied to any site.

type Dict = Record<string, string | number | boolean | undefined>

/** Browser events from the shared schema in ~/code/home/lines/sites.md. `lang` and `site` are added automatically. */
export type TrackEvent =
  | { event: 'page_view'; page: string; page_type: string; landing_page: string; referrer_type: string; device: string }
  | { event: 'tool_start'; tool: string; page: string }
  | { event: 'tool_result'; tool: string; page: string; ms: number; ok: boolean }
  | { event: 'upload'; tool: string; file_type: string; size_bucket: string }
  | { event: 'download'; tool: string; format: string }
  | { event: 'copy'; tool: string; what: string; page: string }
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
let anonId = ''
let queue: WireEvent[] = []
let ready = false
let exceptionCount = 0
/** A crash loop must not flood the project. */
const MAX_EXCEPTIONS = 10

export function initTracking(options: TrackingOptions): void {
  opts = { ...options }
  anonId = crypto.randomUUID()
  ready = document.readyState === 'complete'
  if (!opts.key) return
  // Hold events until the page has loaded so analytics never competes with first paint; flush early if the page is hidden.
  if (!ready) {
    addEventListener(
      'load',
      () => {
        ready = true
        setTimeout(flush, 0)
      },
      { once: true },
    )
  }
  addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
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
    $process_person_profile: false,
  }
}

function flush(): void {
  if (!queue.length) return
  const body = JSON.stringify({ api_key: opts.key, batch: queue })
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
  queue.push({ event, distinct_id: anonId, timestamp: new Date().toISOString(), properties: { ...client(), ...payload } })
  if (ready) setTimeout(flush, 0)
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
