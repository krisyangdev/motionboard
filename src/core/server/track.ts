// Server-side analytics: the sibling of src/core/track.ts, same `site` property and event names.
// PostHog /capture/ over fetch, fired through waitUntil so it never delays a response, never throws.
// Without POSTHOG_KEY it logs to the console. No IP, prompt text or file content is sent.
import { waitUntil } from 'cloudflare:workers'
import { appEnv } from './env'
import { SITE } from '../../../site.config.ts'

export type ServerEvent = 'signup' | 'checkout_start' | 'payment_success' | 'generate_request' | 'generate_result'
type Props = Record<string, string | number | boolean | null | undefined>

function send(body: Record<string, unknown>): void {
  try {
    const promise = fetch(`${SITE.posthogHost}/capture/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) console.warn('[track] rejected', response.status)
      })
      .catch((error) => console.warn('[track] failed', error instanceof Error ? error.message : String(error)))
    try {
      waitUntil(promise)
    } catch {
      // No request context (a test, or a finished request): the fetch still runs on its own.
    }
  } catch (error) {
    console.warn('[track] failed', error instanceof Error ? error.message : String(error))
  }
}

export function trackServer(event: ServerEvent, distinctId: string, props: Props = {}): void {
  const properties = { ...props, site: SITE.id, source: 'server', $process_person_profile: false, $geoip_disable: true }
  const key = appEnv().POSTHOG_KEY
  if (!key) {
    console.log('[track]', event, distinctId, JSON.stringify(properties))
    return
  }
  send({ api_key: key, event, distinct_id: distinctId, timestamp: new Date().toISOString(), properties })
}

/** One V8 stack line → PostHog raw frame. */
function parseFrame(line: string) {
  const match = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/.exec(line)
  if (!match) return null
  return {
    platform: 'web:javascript',
    function: match[1] ?? '?',
    filename: match[2],
    lineno: Number(match[3]),
    colno: Number(match[4]),
    in_app: !match[2]?.includes('node_modules'),
  }
}

export function captureServerException(error: unknown, extra: Record<string, string> = {}): void {
  try {
    const e = error instanceof Error ? error : new Error(String(error))
    const frames = (e.stack ?? '')
      .split('\n')
      .slice(1)
      .map(parseFrame)
      .filter((f) => f !== null)
      .reverse() // PostHog wants the oldest frame first
    const properties = {
      ...extra,
      site: SITE.id,
      source: 'server',
      $process_person_profile: false,
      $geoip_disable: true,
      $exception_list: [
        {
          type: e.name,
          value: e.message,
          mechanism: { handled: false, synthetic: false },
          stacktrace: { type: 'raw', frames },
        },
      ],
    }
    const key = appEnv().POSTHOG_KEY
    if (!key) {
      console.log('[track] $exception', e.name, e.message)
      return
    }
    send({ api_key: key, event: '$exception', distinct_id: 'server', timestamp: new Date().toISOString(), properties })
  } catch {
    // Reporting an error must never raise another one.
  }
}
