// Security headers and the Cloudflare `_headers` file. Pure (imports only site.config), so the Worker
// can reuse securityHeaders() for dynamic responses.
import { SITE } from '../../site.config.ts'

const list = (...parts: (string | readonly string[])[]) => parts.flat().filter(Boolean).join(' ')

// 'unsafe-inline' scripts: TanStack inlines hydration scripts whose content differs per page.
const csp = () =>
  [
    "default-src 'self'",
    `script-src ${list("'self' 'unsafe-inline' https://static.cloudflareinsights.com", SITE.csp.script)}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${list("'self' data: blob:", SITE.csp.img)}`,
    "font-src 'self'",
    `connect-src ${list("'self'", SITE.posthogHost, 'https://cloudflareinsights.com', SITE.csp.connect)}`,
    `media-src ${list("'self' blob:", SITE.csp.media)}`,
    // Libraries that decode in a Worker often start it from a blob: URL (e.g. HEIC and WebAssembly decoders).
    "worker-src 'self' blob:",
    `frame-src ${list(SITE.csp.frame.length ? SITE.csp.frame : ["'none'"])}`,
    `form-action ${list("'self'", SITE.csp.form)}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ')

export const securityHeaders = (): Record<string, string> => ({
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': csp(),
})

const block = (pattern: string, headers: Record<string, string>) =>
  `${pattern}\n${Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n`

const IMMUTABLE = { 'Cache-Control': 'public, max-age=31536000, immutable' }

/** Text of public/_headers. `extra` adds one block per path pattern (a site's `extraHeaders`). */
export const headersFile = (extra: Record<string, Record<string, string>> = {}): string =>
  [
    block('/*', securityHeaders()),
    block('/assets/*', IMMUTABLE),
    block('/fonts/*', IMMUTABLE),
    ...Object.entries(extra).map(([pattern, headers]) => block(pattern, headers)),
  ].join('\n')
