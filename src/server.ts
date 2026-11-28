// Worker entry: TanStack Start answers fetch; the same Worker consumes the job queue and runs the cron.
// Static assets (prerendered pages, JS, CSS) are served before this code runs and get their headers
// from public/_headers; dynamic responses (API, account and admin pages) get the same security headers here.
import handler from '@tanstack/react-start/server-entry'
import { SITE } from '../site.config.ts'
import { securityHeaders } from './core/headers'
import { localeOf, localePrefix, stripLocale } from './core/i18n'
import { handleCron } from './core/jobs/cron'
import { handleQueue } from './core/jobs/queue'
import type { JobMessage } from './core/server/env'

const SECURITY_HEADERS = Object.entries(securityHeaders())

// Everything layer 1 serves. With SITE.accounts.enabled = false these answer 404 and the queue and cron
// do nothing, so a site without accounts (e.g. Motionboard) needs none of the account tables or bindings.
const ACCOUNT_PATHS = ['/admin/', '/account/', '/app/', '/login/', '/signup/', '/forgot-password/', '/reset-password/']
const ACCOUNT_API = ['admin', 'auth', 'billing', 'checkout', 'config', 'credits', 'files', 'generation', 'jobs', 'me', 'mock', 'orders']
function isAccountPath(pathname: string) {
  const path = stripLocale(pathname.endsWith('/') ? pathname : `${pathname}/`)
  return ACCOUNT_PATHS.some((p) => path.startsWith(p)) || ACCOUNT_API.some((p) => path.startsWith(`/api/${p}/`))
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    // Static files are served before this Worker runs, so a page path with a file extension that reaches it does not
    // exist: answer the 404 page directly (the router's trailing-slash rule would first 307 to "<path>/").
    const notFile = !url.pathname.startsWith('/api/') && /\.[^/]+$/.test(url.pathname)
    if (notFile || (!SITE.accounts.enabled && isAccountPath(url.pathname))) {
      if (url.pathname.startsWith('/api/')) return Response.json({ error: 'Not found', code: 'not_found' }, { status: 404 })
      // Render the site's own 404 page in the page's language.
      request = new Request(new URL(`${localePrefix(localeOf(url.pathname))}/__not-found__/`, url), { headers: request.headers })
    }
    const response = await handler.fetch(request)
    // Responses from fetch() can have immutable headers; copy only when something is missing.
    if (SECURITY_HEADERS.every(([k]) => response.headers.has(k))) return response
    const out = new Response(response.body, response)
    for (const [k, v] of SECURITY_HEADERS) if (!out.headers.has(k)) out.headers.set(k, v)
    return out
  },
  async queue(batch: MessageBatch<JobMessage>): Promise<void> {
    if (SITE.accounts.enabled) await handleQueue(batch)
  },
  async scheduled(_controller: ScheduledController, _env: unknown, ctx: ExecutionContext): Promise<void> {
    if (SITE.accounts.enabled) ctx.waitUntil(handleCron())
  },
}
