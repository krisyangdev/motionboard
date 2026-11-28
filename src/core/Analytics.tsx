// Mounted once in the root route. Starts tracking, sends $pageview on every navigation (with prev_path, the in-site
// path before it, '' on a document's first pageview),
// reports uncaught errors and counts clicks on links marked data-cta="<target>".
import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { SITE } from '../../site.config.ts'
import { pageType } from '@/site/analytics'
import { localeOf, stripLocale } from './i18n'
import { captureException, initTracking, referrerType, setTrackingLang, track } from './track'

let inited = false
let landing = ''
let prev = ''

function init() {
  if (inited) return
  inited = true
  initTracking({ site: SITE.id, key: (import.meta.env as Record<string, string | undefined>)[SITE.posthogKeyEnv], host: SITE.posthogHost })
  addEventListener('error', (e) => captureException(e.error ?? e.message))
  addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => captureException(e.reason))
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element | null)?.closest?.('a[data-cta]')
      const to = a?.getAttribute('data-cta')
      if (to) track('cta_click', { page: location.pathname, to })
    },
    true,
  )
}

export function Analytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  useEffect(() => {
    init()
    if (pathname === prev) return // React's dev double effect
    setTrackingLang(localeOf(pathname))
    const first = !landing
    if (first) landing = pathname
    // $referrer stays the document's referrer on client-side navigations; prev_path names the in-site page before.
    const prev_path = first ? '' : prev
    prev = pathname
    track('$pageview', {
      page: pathname,
      page_type: pageType(stripLocale(pathname)),
      landing_page: landing,
      prev_path,
      referrer_type: first ? referrerType() : 'internal',
      device: matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop',
    })
  }, [pathname])
  return null
}
