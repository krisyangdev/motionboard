import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/core/app/AppShell'
import { AuthCard, authErrorMessage, linkClass, Notice, TextField } from '@/core/app/AuthForm'
import { authClient } from '@/core/auth/client'
import { localizePath, paramLocale } from '@/core/i18n'
import { useCoreMessages, useLocale } from '@/core/locale'
import { coreMessages } from '@/core/messages'
import { PathLink } from '@/core/pages/HubPage'
import { seoHead } from '@/core/seo'
import { Button } from '@/core/ui/button'
import { Form } from '@/core/ui/form'

export const Route = createFileRoute('/{-$locale}/forgot-password')({
  head: ({ params }) => {
    const locale = paramLocale(params.locale)
    return seoHead({ ...coreMessages[locale].app.seo.forgot, path: '/forgot-password/', locale, type: 'website', noindex: true })
  },
  component: () => (
    <AppShell>
      <ForgotPassword />
    </AppShell>
  ),
})

function ForgotPassword() {
  const m = useCoreMessages().app
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: `${location.origin}${localizePath(locale, '/reset-password/')}` })
    setBusy(false)
    if (error) setError(authErrorMessage(m, error))
    else setSent(true)
  }

  const back = (
    <PathLink className={linkClass} locale={locale} path="/login/">
      {m.common.back}
    </PathLink>
  )

  if (sent) {
    return (
      <AuthCard title={m.forgot.doneTitle}>
        <p className="text-muted-foreground">{m.forgot.done(email)}</p>
        {back}
      </AuthCard>
    )
  }

  return (
    <AuthCard title={m.forgot.title}>
      <Form
        method="post"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <TextField label={m.common.email} type="email" name="email" autoComplete="email" required value={email} onValueChange={setEmail} />
        {error && <Notice variant="error">{error}</Notice>}
        <Button type="submit" loading={busy}>
          {m.forgot.submit}
        </Button>
      </Form>
      {back}
    </AuthCard>
  )
}
