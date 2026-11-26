import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/core/app/AppShell'
import { AuthCard, authErrorMessage, linkClass, Notice, TextField } from '@/core/app/AuthForm'
import { authClient } from '@/core/auth/client'
import { paramLocale } from '@/core/i18n'
import { useCoreMessages, useLocale } from '@/core/locale'
import { coreMessages } from '@/core/messages'
import { PathLink } from '@/core/pages/HubPage'
import { seoHead } from '@/core/seo'
import { Button, buttonVariants } from '@/core/ui/button'
import { Form } from '@/core/ui/form'

export const Route = createFileRoute('/{-$locale}/reset-password')({
  // Better Auth sends the browser here with ?token=, or with ?error=INVALID_TOKEN when the link is bad.
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === 'string' ? s.token : undefined,
    error: typeof s.error === 'string' ? s.error : undefined,
  }),
  head: ({ params }) => {
    const locale = paramLocale(params.locale)
    return seoHead({ ...coreMessages[locale].app.seo.reset, path: '/reset-password/', locale, type: 'website', noindex: true })
  },
  component: () => (
    <AppShell>
      <ResetPassword />
    </AppShell>
  ),
})

function ResetPassword() {
  const m = useCoreMessages().app
  const locale = useLocale()
  const { token, error: linkError } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!token) return
    setBusy(true)
    setError(null)
    const { error } = await authClient.resetPassword({ newPassword: password, token })
    setBusy(false)
    if (error) setError(authErrorMessage(m, error))
    else setDone(true)
  }

  if (!token || linkError) {
    return (
      <AuthCard title={m.reset.title}>
        <Notice variant="error">{m.reset.invalid}</Notice>
        <PathLink className={linkClass} locale={locale} path="/forgot-password/">
          {m.reset.request}
        </PathLink>
      </AuthCard>
    )
  }

  if (done) {
    return (
      <AuthCard title={m.reset.title}>
        <Notice variant="success">{m.reset.done}</Notice>
        <PathLink className={buttonVariants()} locale={locale} path="/login/">
          {m.reset.login}
        </PathLink>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={m.reset.title}>
      <Form
        method="post"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <TextField label={m.reset.newPassword} type="password" name="password" autoComplete="new-password" required minLength={8} value={password} onValueChange={setPassword} />
        {error && <Notice variant="error">{error}</Notice>}
        <Button type="submit" loading={busy}>
          {m.reset.submit}
        </Button>
      </Form>
    </AuthCard>
  )
}
