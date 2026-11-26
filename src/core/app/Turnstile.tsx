import { useEffect, useRef } from 'react'

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading: Promise<void> | null = null

function loadScript() {
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      loading = null
      reject(new Error('Turnstile failed to load'))
    }
    document.head.appendChild(s)
  })
  return loading
}

/**
 * Cloudflare Turnstile widget. Renders nothing without a site key. The script loads on mount only.
 * A token works once: bump `resetKey` after using it to get a fresh one.
 */
export function Turnstile({
  siteKey,
  action,
  onToken,
  resetKey = 0,
}: {
  siteKey: string | null | undefined
  action: string
  onToken: (token: string | null) => void
  resetKey?: number
}) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const callback = useRef(onToken)
  callback.current = onToken

  useEffect(() => {
    if (!siteKey) return
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return
        widget.current = window.turnstile.render(box.current, {
          sitekey: siteKey,
          action,
          appearance: 'interaction-only',
          callback: (token: string) => callback.current(token),
          'expired-callback': () => callback.current(null),
          'error-callback': () => callback.current(null),
        })
      })
      .catch(() => callback.current(null))
    return () => {
      cancelled = true
      if (widget.current) window.turnstile?.remove(widget.current)
      widget.current = null
    }
  }, [siteKey, action])

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (widget.current) window.turnstile?.reset(widget.current)
  }, [resetKey])

  if (!siteKey) return null
  return <div ref={box} />
}
