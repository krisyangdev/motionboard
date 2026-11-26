// Better Auth instance. Created per request: on Workers the env (D1 binding, secrets) belongs to the
// request, and building the instance is cheap. Handlers live at /api/auth/* (src/routes/api/auth/$.ts).
import { dodopayments, portal, webhooks, type DodoPaymentsPlugins } from '@dodopayments/better-auth'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { dodoClient, hasDodoKey, isMockPayments, webhookSecret } from '../billing/dodo'
import { handleDodoWebhook } from '../billing/webhooks'
import { grant } from '../credits/ledger'
import { db, schema } from '../db'
import { sendEmail } from '../email/send'
import { resetPassword, verifyEmail } from '../email/templates'
import { DEFAULT_LOCALE, isLocale, localizePath, type Locale } from '../i18n'
import { appEnv } from '../server/env'
import { captureServerException, trackServer } from '../server/track'
import { SITE } from '../../../site.config.ts'

// `locale` is an additional user field; Better Auth's hook types do not include it.
const localeOf = (user: object): Locale => {
  const locale = (user as { locale?: unknown }).locale
  return isLocale(locale) ? locale : DEFAULT_LOCALE
}

export function auth() {
  const env = appEnv()
  const hasKey = hasDodoKey()

  // The webhook endpoint always exists (mock mode signs with the local test secret); the portal needs a real key.
  const dodoUse: DodoPaymentsPlugins = [webhooks({ webhookKey: webhookSecret() ?? '', onPayload: handleDodoWebhook })]
  if (hasKey) dodoUse.push(portal())

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.BETTER_AUTH_URL],
    database: drizzleAdapter(db(), { provider: 'sqlite', schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification } }),
    user: {
      additionalFields: {
        role: { type: 'string', required: false, defaultValue: 'user', input: false },
        locale: { type: 'string', required: false, input: true },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({ to: user.email, ...resetPassword(localeOf(user), url) })
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const locale = localeOf(user)
        // Without a callbackURL from the sign-up form the link lands on the account page of the user's language.
        const link = new URL(url)
        if (!link.searchParams.get('callbackURL')) link.searchParams.set('callbackURL', localizePath(locale, '/account/'))
        await sendEmail({ to: user.email, ...verifyEmail(locale, link.toString()) })
      },
    },
    socialProviders:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
        : {},
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
    // In-memory per isolate: Better Auth's database storage needs a table our schema does not have.
    // Checkout and jobs use the D1 rate limiter. Dodo's webhooks come from a few IPs and must not be throttled.
    rateLimit: { enabled: true, storage: 'memory', customRules: { '/dodopayments/webhooks': false } },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const lang = localeOf(user)
            try {
              if (SITE.accounts.signupCredits > 0) {
                await grant({ userId: user.id, amount: SITE.accounts.signupCredits, type: 'grant', sourceType: 'signup', sourceId: user.id })
              }
            } catch (error) {
              // The account exists; the grant is idempotent, so it can be repeated by hand.
              captureServerException(error, { where: 'signup_grant', userId: user.id })
            }
            trackServer('signup', user.id, { lang })
          },
        },
      },
    },
    plugins: [
      dodopayments({ client: dodoClient(), createCustomerOnSignUp: !isMockPayments() && hasKey, use: dodoUse }),
      tanstackStartCookies(), // must stay last
    ],
  })
}
