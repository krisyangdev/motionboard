import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/core/app/AppShell'
import { Notice } from '@/core/app/AuthForm'
import { api, useRequireMe } from '@/core/app/api'
import { authClient } from '@/core/auth/client'
import { formatDate, formatNumber, localizePath, paramLocale, type Locale } from '@/core/i18n'
import { useCoreMessages, useLocale } from '@/core/locale'
import { coreMessages } from '@/core/messages'
import { PathLink } from '@/core/pages/HubPage'
import { seoHead } from '@/core/seo'
import { plans } from '@/site/plans'
import { Badge } from '@/core/ui/badge'
import { Button, buttonVariants } from '@/core/ui/button'
import { Card, CardPanel } from '@/core/ui/card'
import { Skeleton } from '@/core/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/ui/table'

export const Route = createFileRoute('/{-$locale}/account')({
  validateSearch: (s: Record<string, unknown>) => ({ checkout: s.checkout === 'success' || s.checkout === 'failed' ? s.checkout : undefined }),
  head: ({ params }) => {
    const locale = paramLocale(params.locale)
    return seoHead({ ...coreMessages[locale].app.seo.account, path: '/account/', locale, type: 'website', noindex: true })
  },
  component: () => (
    <AppShell>
      <Account />
    </AppShell>
  ),
})

type Order = { id: string; planCode: string; credits: number; amountMinor: number; currency: string; status: string; createdAt: string }
type Tx = { id: string; availableDelta: number; frozenDelta: number; type: string; sourceType: string; sourceId: string; availableAfter: number; createdAt: string }

const money = (l: Locale, minor: number, currency: string) => formatNumber(l, minor / 100, { style: 'currency', currency })
const when = (l: Locale, iso: string) => formatDate(l, iso, { dateStyle: 'medium', timeStyle: 'short' })
const signed = (l: Locale, n: number) => formatNumber(l, n, { signDisplay: 'exceptZero' })

const sectionTitle = 'mb-3 font-semibold text-lg tracking-tight'

function Account() {
  const m = useCoreMessages().app
  const locale = useLocale()
  const { checkout } = Route.useSearch()
  const qc = useQueryClient()
  const me = useRequireMe()
  const ready = !!me.data
  const orders = useQuery({ queryKey: ['orders'], queryFn: () => api<{ items: Order[] }>('/api/orders'), enabled: ready })
  const history = useQuery({ queryKey: ['transactions'], queryFn: () => api<{ items: Tx[] }>('/api/credits/transactions'), enabled: ready })

  // After a payment the webhook may land a moment later: refresh every 2 s for 10 s.
  useEffect(() => {
    if (checkout !== 'success') return
    const timer = setInterval(() => {
      for (const key of ['me', 'orders', 'transactions']) void qc.invalidateQueries({ queryKey: [key] })
    }, 2000)
    const stop = setTimeout(() => clearInterval(timer), 10_000)
    return () => {
      clearInterval(timer)
      clearTimeout(stop)
    }
  }, [checkout, qc])

  const buy = useMutation({
    mutationFn: (planCode: string) => api<{ url: string }>('/api/checkout', { method: 'POST', body: { planCode, returnPath: localizePath(locale, '/account/') } }),
    onSuccess: ({ url }) => location.assign(url),
  })
  const portal = useMutation({
    mutationFn: () => api<{ url: string }>('/api/billing/portal', { method: 'POST' }),
    onSuccess: ({ url }) => location.assign(url),
  })
  const signOut = useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: () => location.assign(localizePath(locale, '/login/')),
  })

  if (!me.data) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  const { user, balance } = me.data
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-semibold text-3xl tracking-tight">{m.account.title}</h1>
          <p className="mt-1 truncate text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" loading={signOut.isPending} onClick={() => signOut.mutate()}>
          {m.account.signOut}
        </Button>
      </div>

      {checkout === 'success' && (
        <div className="mt-6">
          <Notice variant="success">{m.account.checkoutSuccess}</Notice>
        </div>
      )}
      {checkout === 'failed' && (
        <div className="mt-6">
          <Notice variant="error">{m.account.checkoutFailed}</Notice>
        </div>
      )}

      <Card className="mt-6">
        <CardPanel className="flex flex-wrap items-end justify-between gap-4 py-5">
          <div className="flex gap-8">
            <div>
              <p className="text-muted-foreground text-sm">{m.account.available}</p>
              <p className="font-semibold text-4xl tabular-nums tracking-tight">{formatNumber(locale, balance.available)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{m.account.held}</p>
              <p className="font-semibold text-4xl text-muted-foreground tabular-nums tracking-tight">{formatNumber(locale, balance.frozen)}</p>
            </div>
          </div>
          <PathLink className={buttonVariants()} locale={locale} path="/app/">
            {m.account.openApp}
          </PathLink>
        </CardPanel>
      </Card>

      <section className="mt-10">
        <h2 className={sectionTitle}>{m.account.buy}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.code}>
              <CardPanel className="flex flex-col gap-4 py-5">
                <div>
                  <p className="font-medium">{plan.name[locale]}</p>
                  <p className="text-muted-foreground text-sm">{m.account.packCredits(plan.credits)}</p>
                </div>
                <p className="font-semibold text-2xl tabular-nums">{money(locale, plan.price.amountMinor, plan.price.currency)}</p>
                <Button loading={buy.isPending && buy.variables === plan.code} disabled={buy.isPending} onClick={() => buy.mutate(plan.code)}>
                  {m.account.buyButton}
                </Button>
              </CardPanel>
            </Card>
          ))}
        </div>
        {(buy.isError || portal.isError) && (
          <div className="mt-4">
            <Notice variant="error">{m.common.error}</Notice>
          </div>
        )}
        <div className="mt-4">
          <Button variant="outline" loading={portal.isPending} onClick={() => portal.mutate()}>
            {m.account.manage}
          </Button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className={sectionTitle}>{m.account.orders}</h2>
        <Card>
          {orders.data ? (
            orders.data.items.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{m.account.ordersCols.date}</TableHead>
                    <TableHead>{m.account.ordersCols.pack}</TableHead>
                    <TableHead>{m.account.ordersCols.amount}</TableHead>
                    <TableHead>{m.account.ordersCols.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.data.items.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="whitespace-nowrap">{when(locale, o.createdAt)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {plans.find((p) => p.code === o.planCode)?.name[locale] ?? o.planCode} · {formatNumber(locale, o.credits)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">{money(locale, o.amountMinor, o.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={o.status === 'paid' ? 'success' : o.status === 'failed' ? 'error' : 'outline'}>{m.account.orderStatus[o.status] ?? o.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="p-4 text-muted-foreground text-sm">{m.account.noOrders}</p>
            )
          ) : (
            <Skeleton className="h-24 w-full rounded-2xl" />
          )}
        </Card>
      </section>

      <section className="mt-10">
        <h2 className={sectionTitle}>{m.account.history}</h2>
        <Card>
          {history.data ? (
            history.data.items.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{m.account.historyCols.date}</TableHead>
                    <TableHead>{m.account.historyCols.type}</TableHead>
                    <TableHead className="text-right">{m.account.historyCols.change}</TableHead>
                    <TableHead className="text-right">{m.account.historyCols.balance}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.data.items.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{when(locale, t.createdAt)}</TableCell>
                      <TableCell className="whitespace-nowrap">{m.account.txTypes[t.sourceType] ?? m.account.txTypes[t.type] ?? t.type}</TableCell>
                      <TableCell className="text-right tabular-nums">{signed(locale, t.availableDelta)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(locale, t.availableAfter)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="p-4 text-muted-foreground text-sm">{m.account.noHistory}</p>
            )
          ) : (
            <Skeleton className="h-24 w-full rounded-2xl" />
          )}
        </Card>
      </section>
    </>
  )
}
