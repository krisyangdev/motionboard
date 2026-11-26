import { appEnv } from '../server/env'
import { HttpError, requestIp } from '../server/http'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const failed = () => new HttpError(403, 'Security challenge failed', 'turnstile_failed')

/** Checks a Turnstile token for `action`. No TURNSTILE_SECRET_KEY configured = pass (local dev). */
export async function verifyTurnstile(request: Request, token: string | undefined, action: string): Promise<void> {
  const secret = appEnv().TURNSTILE_SECRET_KEY?.trim()
  if (!secret) return
  if (!token?.trim()) throw failed()

  const body = new FormData()
  body.set('secret', secret)
  body.set('response', token.trim())
  const ip = requestIp(request)
  if (ip !== 'unknown') body.set('remoteip', ip)

  let result: { success?: boolean; action?: string }
  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body })
    if (!response.ok) throw failed()
    result = await response.json()
  } catch {
    throw failed()
  }
  if (!result.success) throw failed()
  if (result.action && result.action !== action) throw failed()
}
