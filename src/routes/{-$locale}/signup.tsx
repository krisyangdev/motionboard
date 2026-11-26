import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/core/app/AppShell'
import { AuthCard, authErrorMessage, linkClass, Notice, TextField } from '@/core/app/AuthForm'
import { messages } from '@/core/app/messages'
import { authClient } from '@/core/auth/client'
import { localizePath, paramLocale } from '@/core/i18n'
import { useLocale, useMessages } from '@/core/locale'
import { PathLink } from '@/core/pages/HubPage'
import { seoHead } from '@/core/seo'
import { Button } from '@/core/ui/button'
import { Form } from '@/core/ui/form'

export const Route = createFileRoute('/{-$locale}/signup')({
  head: ({ params }) => {
    const locale = paramLocale(params.locale)
    return seoHead({ ...messages[locale].seo.signup, path: '/signup/', locale, type: 'website', noindex: true })
  },
  component: () => (
    <AppShell>
      <Signup />
    </AppShell>
  ),
})

function Signup() {
  const m = useMessages(messages)
  const locale = useLocale()
  const account = localizePath(locale, '/account/')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [resent, setResent] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    // `locale` is a Better Auth additional field; the spread keeps it out of the client's inferred input type.
    const { error } = await authClient.signUp.email({ name, email, password, callbackURL: account, ...({ locale } as object) })
    setBusy(false)
    if (error) setError(authErrorMessage(m, error))
    else setSent(true)
  }

  async function resend() {
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL: account })
    if (error) setError(authErrorMessage(m, error))
    else setResent(true)
  }

  if (sent) {
    return (
      <AuthCard title={m.signup.doneTitle}>
        <p className="text-muted-foreground">{m.signup.done(email)}</p>
        {error && <Notice variant="error">{error}</Notice>}
        {resent && <Notice variant="success">{m.signup.resent}</Notice>}
        <Button variant="outline" onClick={() => void resend()}>
          {m.signup.resend}
        </Button>
        <PathLink className={linkClass} locale={locale} path="/login/">
          {m.common.back}
        </PathLink>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={m.signup.title}>
      <Form
        method="post"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <TextField label={m.common.name} name="name" autoComplete="name" required value={name} onValueChange={setName} />
        <TextField label={m.common.email} type="email" name="email" autoComplete="email" required value={email} onValueChange={setEmail} />
        <TextField label={m.common.password} type="password" name="password" autoComplete="new-password" required minLength={8} value={password} onValueChange={setPassword} />
        {error && <Notice variant="error">{error}</Notice>}
        <Button type="submit" loading={busy}>
          {m.signup.submit}
        </Button>
      </Form>
      <p className="text-center text-muted-foreground text-sm">
        {m.signup.haveAccount}{' '}
        <PathLink className="text-foreground underline underline-offset-4" locale={locale} path="/login/">
          {m.signup.login}
        </PathLink>
      </p>
    </AuthCard>
  )
}
