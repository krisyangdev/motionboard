import { useState, type FormEvent } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/app/api'
import { seoHead } from '@/core/seo'
import { Alert, AlertDescription } from '@/core/ui/alert'
import { Button } from '@/core/ui/button'
import { Card, CardPanel } from '@/core/ui/card'
import { Field, FieldLabel } from '@/core/ui/field'
import { Input } from '@/core/ui/input'

export const Route = createFileRoute('/admin/login')({
  head: () => seoHead({ title: 'Admin sign in', description: 'Site administration.', path: '/admin/login/', locale: 'en', noindex: true }),
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useMutation({
    mutationFn: () => api<{ admin: unknown }>('/api/admin/login', { method: 'POST', body: { email, password } }),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'me'], data)
      void navigate({ to: '/admin/' })
    },
  })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm items-center px-4">
      <Card className="w-full">
        <CardPanel>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <h1 className="font-semibold text-xl">Admin sign in</h1>
            {login.error ? (
              <Alert variant="error">
                <AlertDescription>{login.error.message}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" name="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input type="password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Button type="submit" loading={login.isPending}>
              Sign in
            </Button>
          </form>
        </CardPanel>
      </Card>
    </main>
  )
}
