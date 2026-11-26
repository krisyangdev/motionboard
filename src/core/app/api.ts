// Browser-side API helper and the shared queries of the account pages.
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { localizePath, type Locale } from '@/core/i18n'
import { useLocale } from '@/core/locale'

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type ApiInit = { method?: string; body?: unknown; headers?: Record<string, string>; signal?: AbortSignal }

/** Same-origin JSON request. A non-2xx answer throws ApiError built from `{ error, code }`. */
export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { body, headers, ...rest } = init
  const res = await fetch(path, {
    ...rest,
    headers: { accept: 'application/json', ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null
  if (!res.ok) throw new ApiError(res.status, data?.code ?? 'error', data?.error ?? res.statusText)
  return data as T
}

export type Config = { google: boolean; turnstileSiteKey: string | null; mockPayments: boolean }
export type Me = {
  user: { id: string; email: string; name: string; emailVerified: boolean; locale: Locale }
  balance: { available: number; frozen: number }
}
export type Job = {
  id: string
  kind: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  cost: number
  error: string | null
  outputUrl: string | null
  createdAt: string
}

export const useConfig = () => useQuery({ queryKey: ['config'], queryFn: () => api<Config>('/api/config'), staleTime: Number.POSITIVE_INFINITY })

/** The signed-in user and balance; a 401 sends the browser to the login page and back here afterwards. */
export function useRequireMe() {
  const locale = useLocale()
  const query = useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/api/me') })
  const signedOut = query.error instanceof ApiError && query.error.status === 401
  useEffect(() => {
    if (signedOut) location.replace(`${localizePath(locale, '/login/')}?next=${encodeURIComponent(location.pathname + location.search)}`)
  }, [signedOut, locale])
  return { ...query, signedOut }
}
