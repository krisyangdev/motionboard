import { useState, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { fmtDate, fmtNumber, Mono, PageTitle, PagedTable, UserLink } from '@/core/admin/ui'
import { seoHead } from '@/core/seo'
import { Badge } from '@/core/ui/badge'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'

export const Route = createFileRoute('/admin/users/')({
  head: () => seoHead({ title: 'Admin users', description: 'Site administration.', path: '/admin/users/', locale: 'en', noindex: true }),
  component: Users,
})

type UserRow = { id: string; email: string; name: string; emailVerified: boolean; createdAt: string; available: number; frozen: number }

function Users() {
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setQ(input.trim())
  }
  return (
    <>
      <PageTitle>Users</PageTitle>
      <PagedTable<UserRow>
        path="/api/admin/users"
        params={{ q }}
        head={['Email', 'Name', 'Verified', 'Available', 'Frozen', 'Joined', 'ID']}
        empty={q ? 'No users match' : 'No users yet'}
        toolbar={
          <form onSubmit={submit} className="flex max-w-md gap-2">
            <Input type="search" placeholder="Search by email" aria-label="Search by email" value={input} onChange={(e) => setInput(e.target.value)} />
            <Button type="submit">Search</Button>
          </form>
        }
        row={(u) => [
          <UserLink id={u.id} email={u.email} />,
          u.name,
          u.emailVerified ? <Badge variant="success">yes</Badge> : <Badge variant="secondary">no</Badge>,
          fmtNumber(u.available),
          fmtNumber(u.frozen),
          fmtDate(u.createdAt),
          <Mono>{u.id}</Mono>,
        ]}
      />
    </>
  )
}
