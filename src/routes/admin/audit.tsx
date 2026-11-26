import { createFileRoute } from '@tanstack/react-router'
import { Clip, fmtDate, Mono, PageTitle, PagedTable } from '@/core/admin/ui'
import { seoHead } from '@/core/seo'

export const Route = createFileRoute('/admin/audit')({
  head: () => seoHead({ title: 'Admin audit log', description: 'Site administration.', path: '/admin/audit/', locale: 'en', noindex: true }),
  component: Audit,
})

type AuditRow = {
  id: string
  actor: string
  actorEmail: string | null
  action: string
  targetType: string | null
  targetId: string | null
  metadataJson: string | null
  createdAt: string
}

function Audit() {
  return (
    <>
      <PageTitle>Audit log</PageTitle>
      <PagedTable<AuditRow>
        path="/api/admin/audit"
        head={['Time', 'Actor', 'Action', 'Target', 'Details']}
        row={(a) => [
          fmtDate(a.createdAt),
          a.actorEmail ?? a.actor,
          a.action,
          a.targetType ? <Mono>{a.targetType}{a.targetId ? ` ${a.targetId}` : ''}</Mono> : '-',
          <Clip text={a.metadataJson} width="max-w-96" />,
        ]}
      />
    </>
  )
}
