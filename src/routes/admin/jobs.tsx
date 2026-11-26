import { createFileRoute } from '@tanstack/react-router'
import { Clip, fmtDate, Mono, PageTitle, PagedTable, StatusBadge, UserLink } from '@/core/admin/ui'
import { seoHead } from '@/core/seo'

export const Route = createFileRoute('/admin/jobs')({
  head: () => seoHead({ title: 'Admin jobs', description: 'Site administration.', path: '/admin/jobs/', locale: 'en', noindex: true }),
  component: Jobs,
})

type JobRow = {
  id: string
  userId: string
  email: string | null
  kind: string
  status: string
  cost: number
  attempts: number
  error: string | null
  createdAt: string
  updatedAt: string
}

function Jobs() {
  return (
    <>
      <PageTitle>Jobs</PageTitle>
      <PagedTable<JobRow>
        path="/api/admin/jobs"
        head={['Created', 'User', 'Kind', 'Status', 'Cost', 'Attempts', 'Error', 'ID']}
        row={(j) => [
          fmtDate(j.createdAt),
          <UserLink id={j.userId} email={j.email} />,
          j.kind,
          <StatusBadge status={j.status} />,
          j.cost,
          j.attempts,
          <Clip text={j.error} />,
          <Mono>{j.id}</Mono>,
        ]}
      />
    </>
  )
}
