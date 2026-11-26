// Worker entry: TanStack Start answers fetch; the same Worker consumes the job queue and runs the cron.
// Static assets (prerendered pages, JS, CSS) are served before this code runs and get their headers
// from public/_headers; dynamic responses (API, account and admin pages) get the same security headers here.
import handler from '@tanstack/react-start/server-entry'
import { securityHeaders } from './core/headers'
import { handleCron } from './core/jobs/cron'
import { handleQueue } from './core/jobs/queue'
import type { JobMessage } from './core/server/env'

const SECURITY_HEADERS = Object.entries(securityHeaders())

export default {
  async fetch(request: Request): Promise<Response> {
    const response = await handler.fetch(request)
    // Responses from fetch() can have immutable headers; copy only when something is missing.
    if (SECURITY_HEADERS.every(([k]) => response.headers.has(k))) return response
    const out = new Response(response.body, response)
    for (const [k, v] of SECURITY_HEADERS) if (!out.headers.has(k)) out.headers.set(k, v)
    return out
  },
  async queue(batch: MessageBatch<JobMessage>): Promise<void> {
    await handleQueue(batch)
  },
  async scheduled(_controller: ScheduledController, _env: unknown, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleCron())
  },
}
