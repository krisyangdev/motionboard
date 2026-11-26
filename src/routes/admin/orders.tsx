import { createFileRoute } from '@tanstack/react-router'
import { fmtDate, fmtMoney, fmtNumber, Mono, PageTitle, PagedTable, StatusBadge, UserLink } from '@/core/admin/ui'
import { seoHead } from '@/core/seo'

export const Route = createFileRoute('/admin/orders')({
  head: () => seoHead({ title: 'Admin orders', description: 'Site administration.', path: '/admin/orders/', locale: 'en', noindex: true }),
  component: Orders,
})

type OrderRow = {
  id: string
  userId: string
  email: string | null
  mode: string
  planCode: string
  credits: number
  amountMinor: number
  currency: string
  status: string
  providerPaymentId: string | null
  createdAt: string
}

function Orders() {
  return (
    <>
      <PageTitle>Orders</PageTitle>
      <PagedTable<OrderRow>
        path="/api/admin/orders"
        head={['Created', 'User', 'Plan', 'Credits', 'Amount', 'Mode', 'Status', 'Payment', 'ID']}
        row={(o) => [
          fmtDate(o.createdAt),
          <UserLink id={o.userId} email={o.email} />,
          o.planCode,
          fmtNumber(o.credits),
          fmtMoney(o.amountMinor, o.currency),
          <StatusBadge status={o.mode} />,
          <StatusBadge status={o.status} />,
          o.providerPaymentId ? <Mono>{o.providerPaymentId}</Mono> : '-',
          <Mono>{o.id}</Mono>,
        ]}
      />
    </>
  )
}
