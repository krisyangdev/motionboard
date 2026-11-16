import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { initTracking, referrerType, track } from '@/lib/track'
import { SITE } from '@/site.config'

let inited = false
let landing = ''

function pageType(pathname: string) {
  const p = pathname.replace(/^\/zh(?=\/|$)/, '') || '/'
  if (p === '/') return 'home'
  if (p.startsWith('/recipes/')) return 'recipe'
  if (p.startsWith('/guides/')) return 'guide'
  if (p.startsWith('/saved')) return 'saved'
  return 'hub'
}

function init() {
  if (inited) return
  inited = true
  initTracking({ site: SITE.id, key: (import.meta.env as Record<string, string | undefined>)[SITE.posthogKeyEnv], host: SITE.posthogHost })
  addEventListener('error', (e) => {
    track('error', { page: location.pathname, endpoint: 'window', code: String(e.message).slice(0, 80) })
  })
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a) return
      if (a.hostname === 'github.com') track('cta_click', { page: location.pathname, to: 'github' })
      else if (a.hostname === 'skills.sh') track('cta_click', { page: location.pathname, to: 'skills.sh' })
    },
    true,
  )
}

export function Analytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  useEffect(() => {
    init()
    const first = !landing
    if (first) landing = pathname
    track('page_view', {
      page: pathname,
      page_type: pageType(pathname),
      landing_page: landing,
      referrer_type: first ? referrerType() : 'internal',
      device: matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop',
    })
  }, [pathname])
  return null
}
