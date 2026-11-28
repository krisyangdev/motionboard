import { useEffect } from 'react'
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/core/app/api'
import { QueryProvider } from '@/core/app/QueryProvider'
import { adminSite } from '../../site/admin'
import { cn } from '@/core/lib/utils'
import { Button, buttonVariants } from '@/core/ui/button'
import { Skeleton } from '@/core/ui/skeleton'

export const Route = createFileRoute('/admin')({
  component: () => (
    <QueryProvider>
      <AdminLayout />
    </QueryProvider>
  ),
})

type Me = { admin: { id: string; email: string; role: string } }

type NavItem = { to: string; label: string; exact?: boolean }

const NAV: NavItem[] = [
  { to: '/admin/', label: 'Dashboard', exact: true },
  { to: '/admin/users/', label: 'Users' },
  { to: '/admin/orders/', label: 'Orders' },
  { to: '/admin/jobs/', label: 'Jobs' },
  { to: '/admin/webhooks/', label: 'Webhooks' },
  { to: '/admin/audit/', label: 'Audit log' },
  // Site pages added through src/site/admin.ts.
  ...(adminSite.nav ?? []),
]

function AdminLayout() {
  const pathname = useLocation({ select: (l) => l.pathname })
  // The login page has no nav and must not redirect to itself.
  if (pathname.replace(/\/+$/, '') === '/admin/login') return <Outlet />
  return <Shell />
}

function Shell() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const me = useQuery({ queryKey: ['admin', 'me'], queryFn: () => api<Me>('/api/admin/me'), retry: false })
  const signedOut = me.error instanceof ApiError && me.error.status === 401
  useEffect(() => {
    if (signedOut) void navigate({ to: '/admin/login/', replace: true })
  }, [signedOut, navigate])

  const signOut = useMutation({
    mutationFn: () => api('/api/admin/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.clear()
      void navigate({ to: '/admin/login/' })
    },
  })

  return (
    <div className="min-h-screen md:grid md:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="border-b md:border-r md:border-b-0">
        <div className="flex flex-col gap-2 p-3 md:sticky md:top-0 md:h-screen md:gap-4 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Admin</span>
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              <span className="truncate text-muted-foreground text-sm">{me.data?.admin.email}</span>
              <Button variant="outline" size="sm" loading={signOut.isPending} onClick={() => signOut.mutate()}>
                Sign out
              </Button>
            </div>
          </div>
          <nav aria-label="Admin" className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] md:mx-0 md:px-0">
            <ul className="flex gap-1 md:flex-col">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeOptions={{ exact: !!item.exact }}
                    className={cn(buttonVariants({ variant: 'ghost' }), 'text-muted-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground md:w-full md:justify-start')}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto hidden flex-col gap-2 md:flex">
            {me.data ? <span className="truncate text-muted-foreground text-sm" title={me.data.admin.email}>{me.data.admin.email}</span> : <Skeleton className="h-4 w-full" />}
            <Button variant="outline" size="sm" loading={signOut.isPending} onClick={() => signOut.mutate()}>
              Sign out
            </Button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-6">{signedOut ? null : <Outlet />}</main>
    </div>
  )
}
