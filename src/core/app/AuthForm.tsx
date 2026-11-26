// Shared pieces of the sign-in, sign-up and password pages.
import type { ReactNode } from 'react'
import { Alert, AlertDescription } from '@/core/ui/alert'
import { Field, FieldLabel } from '@/core/ui/field'
import { Input, type InputProps } from '@/core/ui/input'
import type { CoreMessages } from '@/core/messages'

export const linkClass = 'text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground'

/** Centred narrow column with the page heading. */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
      <div className="mt-6 flex flex-col gap-4">{children}</div>
    </div>
  )
}

export function TextField({ label, ...input }: { label: string } & Omit<InputProps, 'size'>) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input {...input} />
    </Field>
  )
}

export function Notice({ variant, children }: { variant: 'error' | 'success' | 'info'; children: ReactNode }) {
  return (
    <Alert variant={variant}>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

type AuthError = { code?: string; status?: number } | null | undefined

/** Text for an error returned by the Better Auth client. */
export function authErrorMessage(m: CoreMessages['app'], error: AuthError): string {
  if (!error) return m.common.error
  if (error.status === 429) return m.authErrors.rateLimited
  const code = error.code ?? ''
  const key = Object.keys(m.authErrors).find((k) => code === k || code.startsWith(`${k}_`))
  return (key && m.authErrors[key]) || m.common.error
}

/** `?next=` target, accepted only when it is a path on this site. */
export function safeNext(next: string | undefined): string | null {
  return next && /^\/(?![/\\])/.test(next) ? next : null
}
