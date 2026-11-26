import { createFileRoute } from '@tanstack/react-router'
import { Clip, fmtDate, Mono, PageTitle, PagedTable, StatusBadge } from '@/core/admin/ui'
import { seoHead } from '@/core/seo'

export const Route = createFileRoute('/admin/webhooks')({
  head: () => seoHead({ title: 'Admin webhooks', description: 'Site administration.', path: '/admin/webhooks/', locale: 'en', noindex: true }),
  component: Webhooks,
})

type WebhookRow = {
  id: string
  provider: string
  providerEventId: string
  eventType: string
  providerPaymentId: string | null
  orderId: string | null
  status: string
  errorMessage: string | null
  createdAt: string
}

function Webhooks() {
  return (
    <>
      <PageTitle>Webhook events</PageTitle>
      <PagedTable<WebhookRow>
        path="/api/admin/webhooks"
        head={['Received', 'Event', 'Status', 'Order', 'Payment', 'Event ID', 'Error']}
        row={(w) => [
          fmtDate(w.createdAt),
          w.eventType,
          <StatusBadge status={w.status} />,
          w.orderId ? <Mono>{w.orderId}</Mono> : '-',
          w.providerPaymentId ? <Mono>{w.providerPaymentId}</Mono> : '-',
          <Mono>{w.providerEventId}</Mono>,
          <Clip text={w.errorMessage} />,
        ]}
      />
    </>
  )
}
