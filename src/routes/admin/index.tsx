import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/core/app/api'
import { fmtMoney, fmtNumber, PageTitle, QueryError, StatusBadge } from '@/core/admin/ui'
import { seoHead } from '@/core/seo'
import { Card, CardPanel } from '@/core/ui/card'
import { Skeleton } from '@/core/ui/skeleton'

export const Route = createFileRoute('/admin/')({
  head: () => seoHead({ title: 'Admin', description: 'Site administration.', path: '/admin/', locale: 'en', noindex: true }),
  component: Dashboard,
})

type Stats = {
  users: number
  usersLast7Days: number
  paidOrders: { mode: string; currency: string; count: number; amountMinor: number }[]
  jobs: { status: string; count: number }[]
  credits: { granted: number; adjusted: number; spent: number }
}

const MODES = ['live_mode', 'test_mode', 'mock'] as const
const JOB_STATUSES = ['queued', 'running', 'succeeded', 'failed'] as const

function Stat({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardPanel className="flex flex-col gap-1 p-4">
        <div className="text-muted-foreground text-sm">{label}</div>
        <div className="font-semibold text-2xl tabular-nums">{children}</div>
      </CardPanel>
    </Card>
  )
}

function Dashboard() {
  const { data, error } = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api<Stats>('/api/admin/stats') })
  if (error) return <QueryError error={error} />

  const cell = (value: ReactNode) => (data ? value : <Skeleton className="h-8 w-16" />)
  const revenue = (mode: string) => {
    const rows = data?.paidOrders.filter((r) => r.mode === mode) ?? []
    if (!rows.length) return '0'
    return rows.map((r) => `${fmtMoney(r.amountMinor, r.currency)} (${r.count})`).join(', ')
  }

  return (
    <>
      <PageTitle>Dashboard</PageTitle>
      <div className="flex flex-col gap-6">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Users">{cell(data && fmtNumber(data.users))}</Stat>
          <Stat label="New users, 7 days">{cell(data && fmtNumber(data.usersLast7Days))}</Stat>
          <Stat label="Credits granted">{cell(data && fmtNumber(data.credits.granted))}</Stat>
          <Stat label="Credits spent">{cell(data && fmtNumber(data.credits.spent))}</Stat>
        </section>
        <section>
          <h2 className="mb-2 font-medium">Paid orders (revenue, count)</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {MODES.map((mode) => (
              <Stat key={mode} label={<StatusBadge status={mode} />}>
                <span className="text-lg">{cell(revenue(mode))}</span>
              </Stat>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-2 font-medium">Jobs</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {JOB_STATUSES.map((status) => (
              <Stat key={status} label={<StatusBadge status={status} />}>
                {cell(data && fmtNumber(data.jobs.find((j) => j.status === status)?.count ?? 0))}
              </Stat>
            ))}
          </div>
        </section>
        {data && data.credits.adjusted !== 0 ? (
          <p className="text-muted-foreground text-sm">Net admin adjustments: {fmtNumber(data.credits.adjusted)} credits.</p>
        ) : null}
      </div>
    </>
  )
}
