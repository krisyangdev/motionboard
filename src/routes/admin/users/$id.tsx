import { useState, type FormEvent, type ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/app/api'
import { Clip, DataTable, EmptyRow, fmtDate, fmtMoney, fmtNumber, Mono, PageTitle, QueryError, StatusBadge } from '@/core/admin/ui'
import { seoHead } from '@/core/seo'
import { Alert, AlertDescription } from '@/core/ui/alert'
import { Badge } from '@/core/ui/badge'
import { Button } from '@/core/ui/button'
import { Card, CardHeader, CardPanel, CardTitle } from '@/core/ui/card'
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPopup, DialogTitle } from '@/core/ui/dialog'
import { Field, FieldLabel } from '@/core/ui/field'
import { Input } from '@/core/ui/input'
import { Skeleton } from '@/core/ui/skeleton'
import { TableCell, TableRow } from '@/core/ui/table'

export const Route = createFileRoute('/admin/users/$id')({
  head: () => seoHead({ title: 'Admin user', description: 'Site administration.', path: '/admin/users/', locale: 'en', noindex: true }),
  component: UserDetail,
})

type Detail = {
  user: { id: string; email: string; name: string; emailVerified: boolean; role: string; locale: string | null; dodoCustomerId: string | null; createdAt: string }
  balance: { available: number; frozen: number }
  transactions: {
    id: string
    type: string
    sourceType: string
    sourceId: string
    availableDelta: number
    frozenDelta: number
    availableAfter: number
    frozenAfter: number
    metadataJson: string | null
    createdAt: string
  }[]
  orders: { id: string; mode: string; planCode: string; credits: number; amountMinor: number; currency: string; status: string; createdAt: string }[]
  jobs: { id: string; kind: string; status: string; cost: number; error: string | null; createdAt: string }[]
}

const signed = (n: number) => (n > 0 ? `+${fmtNumber(n)}` : fmtNumber(n))

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      {children}
    </Card>
  )
}

function UserDetail() {
  const { id } = Route.useParams()
  const { data, error } = useQuery({ queryKey: ['admin', 'user', id], queryFn: () => api<Detail>(`/api/admin/users/${id}`) })
  if (error) return <QueryError error={error} />
  if (!data) return <Skeleton className="h-64 w-full" />
  const { user, balance } = data

  return (
    <>
      <PageTitle action={<Link to="/admin/users/" className="text-muted-foreground text-sm underline-offset-4 hover:underline">All users</Link>}>{user.email}</PageTitle>
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Profile">
            <CardPanel className="p-4 pt-2">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Name</dt>
                <dd>{user.name}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="flex items-center gap-2 break-all">
                  {user.email}
                  {user.emailVerified ? <Badge variant="success">verified</Badge> : <Badge variant="secondary">unverified</Badge>}
                </dd>
                <dt className="text-muted-foreground">Joined</dt>
                <dd>{fmtDate(user.createdAt)}</dd>
                <dt className="text-muted-foreground">Language</dt>
                <dd>{user.locale ?? '-'}</dd>
                <dt className="text-muted-foreground">Role</dt>
                <dd>{user.role}</dd>
                <dt className="text-muted-foreground">Dodo customer</dt>
                <dd>{user.dodoCustomerId ? <Mono>{user.dodoCustomerId}</Mono> : '-'}</dd>
                <dt className="text-muted-foreground">ID</dt>
                <dd><Mono>{user.id}</Mono></dd>
              </dl>
            </CardPanel>
          </Section>
          <Section title="Credits">
            <CardPanel className="flex flex-col gap-4 p-4 pt-2">
              <div className="flex gap-8">
                <div>
                  <div className="text-muted-foreground text-sm">Available</div>
                  <div className="font-semibold text-2xl tabular-nums">{fmtNumber(balance.available)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Frozen</div>
                  <div className="font-semibold text-2xl tabular-nums">{fmtNumber(balance.frozen)}</div>
                </div>
              </div>
              <AdjustForm userId={user.id} email={user.email} />
            </CardPanel>
          </Section>
        </div>

        <Section title="Transactions">
          <DataTable head={['Time', 'Type', 'Source', 'Available', 'Frozen', 'Balance after', 'Details']}>
            {data.transactions.length === 0 ? (
              <EmptyRow cols={7} />
            ) : (
              data.transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{fmtDate(t.createdAt)}</TableCell>
                  <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                  <TableCell><Mono>{t.sourceType} {t.sourceId}</Mono></TableCell>
                  <TableCell className="tabular-nums">{signed(t.availableDelta)}</TableCell>
                  <TableCell className="tabular-nums">{signed(t.frozenDelta)}</TableCell>
                  <TableCell className="tabular-nums">{fmtNumber(t.availableAfter)} / {fmtNumber(t.frozenAfter)}</TableCell>
                  <TableCell><Clip text={t.metadataJson} /></TableCell>
                </TableRow>
              ))
            )}
          </DataTable>
        </Section>

        <Section title="Orders">
          <DataTable head={['Created', 'Plan', 'Credits', 'Amount', 'Mode', 'Status', 'ID']}>
            {data.orders.length === 0 ? (
              <EmptyRow cols={7} />
            ) : (
              data.orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{fmtDate(o.createdAt)}</TableCell>
                  <TableCell>{o.planCode}</TableCell>
                  <TableCell>{fmtNumber(o.credits)}</TableCell>
                  <TableCell>{fmtMoney(o.amountMinor, o.currency)}</TableCell>
                  <TableCell><StatusBadge status={o.mode} /></TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell><Mono>{o.id}</Mono></TableCell>
                </TableRow>
              ))
            )}
          </DataTable>
        </Section>

        <Section title="Jobs">
          <DataTable head={['Created', 'Kind', 'Status', 'Cost', 'Error', 'ID']}>
            {data.jobs.length === 0 ? (
              <EmptyRow cols={6} />
            ) : (
              data.jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>{fmtDate(j.createdAt)}</TableCell>
                  <TableCell>{j.kind}</TableCell>
                  <TableCell><StatusBadge status={j.status} /></TableCell>
                  <TableCell>{j.cost}</TableCell>
                  <TableCell><Clip text={j.error} /></TableCell>
                  <TableCell><Mono>{j.id}</Mono></TableCell>
                </TableRow>
              ))
            )}
          </DataTable>
        </Section>
      </div>
    </>
  )
}

function AdjustForm({ userId, email }: { userId: string; email: string }) {
  const queryClient = useQueryClient()
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  const amount = Number(delta)
  const adjust = useMutation({
    mutationFn: () => api(`/api/admin/users/${userId}/credits`, { method: 'POST', body: { delta: amount, reason: reason.trim() } }),
    onSuccess: async () => {
      setConfirming(false)
      setDone(`${signed(amount)} credits applied.`)
      setDelta('')
      setReason('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', '/api/admin/audit'] }),
      ])
    },
  })

  const review = (e: FormEvent) => {
    e.preventDefault()
    setDone(null)
    adjust.reset()
    if (!Number.isInteger(amount) || amount === 0) return setFormError('Enter a whole number other than 0. Use a negative number to remove credits.')
    if (reason.trim().length < 3 || reason.trim().length > 200) return setFormError('Reason must be 3 to 200 characters.')
    setFormError(null)
    setConfirming(true)
  }

  return (
    <form onSubmit={review} className="flex flex-col gap-3 border-t pt-4">
      <h3 className="font-medium text-sm">Adjust credits</h3>
      {formError ? <p className="text-destructive-foreground text-sm">{formError}</p> : null}
      {done ? (
        <Alert variant="success">
          <AlertDescription>{done}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <Field>
          <FieldLabel>Amount</FieldLabel>
          <Input type="number" inputMode="numeric" step={1} placeholder="50 or -50" value={delta} onChange={(e) => setDelta(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>Reason</FieldLabel>
          <Input maxLength={200} placeholder="Shown in the audit log" value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
      <Button type="submit" className="self-start">
        Review adjustment
      </Button>

      <Dialog open={confirming} onOpenChange={(open) => (adjust.isPending ? undefined : setConfirming(open))}>
        <DialogPopup showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Confirm adjustment</DialogTitle>
            <DialogDescription>
              {amount > 0 ? 'Add' : 'Remove'} {fmtNumber(Math.abs(amount))} credits {amount > 0 ? 'to' : 'from'} {email}. This is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-6 pb-6 text-sm">
            <div>
              <span className="text-muted-foreground">Reason: </span>
              {reason.trim()}
            </div>
            {adjust.error ? (
              <Alert variant="error">
                <AlertDescription>{adjust.error.message}</AlertDescription>
              </Alert>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={adjust.isPending} />}>Cancel</DialogClose>
            <Button variant={amount < 0 ? 'destructive' : 'default'} loading={adjust.isPending} onClick={() => adjust.mutate()}>
              Apply
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </form>
  )
}
