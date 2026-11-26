import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/core/app/AppShell'
import { AuthCard, authErrorMessage, linkClass, Notice, safeNext, TextField } from '@/core/app/AuthForm'
import { useConfig } from '@/core/app/api'
import { messages } from '@/core/app/messages'
import { authClient } from '@/core/auth/client'
import { localizePath, paramLocale } from '@/core/i18n'
import { useLocale, useMessages } from '@/core/locale'
import { PathLink } from '@/core/pages/HubPage'
import { seoHead } from '@/core/seo'
import { Button } from '@/core/ui/button'
import { Form } from '@/core/ui/form'

export const Route = createFileRoute('/{-$locale}/login')({
  validateSearch: (s: Record<string, unknown>) => ({ next: typeof s.next === 'string' ? s.next : undefined }),
  head: ({ params }) => {
    const locale = paramLocale(params.locale)
    return seoHead({ ...messages[locale].seo.login, path: '/login/', locale, type: 'website', noindex: true })
  },
  component: () => (
    <AppShell>
      <Login />
    </AppShell>
  ),
})

function Login() {
  const m = useMessages(messages)
  const locale = useLocale()
  const { next } = Route.useSearch()
  const config = useConfig()
  const target = safeNext(next) ?? localizePath(locale, '/account/')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unverified, setUnverified] = useState(false)
  const [resent, setResent] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    setUnverified(false)
    setResent(false)
    const { error } = await authClient.signIn.email({ email, password, callbackURL: target })
    if (!error) {
      location.assign(target)
      return
    }
    setUnverified(error.code === 'EMAIL_NOT_VERIFIED')
    setError(authErrorMessage(m, error))
    setBusy(false)
  }

  async function resend() {
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL: target })
    if (error) setError(authErrorMessage(m, error))
    else setResent(true)
  }

  return (
    <AuthCard title={m.login.title}>
      <Form
        method="post"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <TextField label={m.common.email} type="email" name="email" autoComplete="email" required value={email} onValueChange={setEmail} />
        <TextField label={m.common.password} type="password" name="password" autoComplete="current-password" required value={password} onValueChange={setPassword} />
        {error && <Notice variant="error">{error}</Notice>}
        {resent && <Notice variant="success">{m.login.resent}</Notice>}
        {unverified && !resent && (
          <Button variant="outline" onClick={() => void resend()}>
            {m.login.resend}
          </Button>
        )}
        <Button type="submit" loading={busy}>
          {m.login.submit}
        </Button>
      </Form>
      {config.data?.google && (
        <>
          <p className="text-center text-muted-foreground text-sm">{m.login.or}</p>
          <Button variant="outline" onClick={() => void authClient.signIn.social({ provider: 'google', callbackURL: target })}>
            {m.login.google}
          </Button>
        </>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        <PathLink className={linkClass} locale={locale} path="/forgot-password/">
          {m.login.forgot}
        </PathLink>
        <span className="text-muted-foreground text-sm">
          {m.login.noAccount}{' '}
          <PathLink className="text-foreground underline underline-offset-4" locale={locale} path="/signup/">
            {m.login.signup}
          </PathLink>
        </span>
      </div>
    </AuthCard>
  )
}
