// The signed-in user of a request, as the rest of the server sees it.
import { isLocale, type Locale } from '../i18n'
import { HttpError } from '../server/http'
import { auth } from './server'

export type SessionUser = { id: string; email: string; name: string; emailVerified: boolean; locale: Locale }

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const result = await auth().api.getSession({ headers: request.headers })
  if (!result) return null
  const { user } = result
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    locale: isLocale(user.locale) ? user.locale : 'en',
  }
}

export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getSessionUser(request)
  if (!user) throw new HttpError(401, 'Sign in required', 'unauthorized')
  return user
}
