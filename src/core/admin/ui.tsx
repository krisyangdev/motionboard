// Shared pieces of the /admin pages: formatters, status badges, a paged table, error box.
import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, ApiError } from '@/core/app/api'
import { Alert, AlertDescription } from '@/core/ui/alert'
import { Badge, type BadgeProps } from '@/core/ui/badge'
import { Button } from '@/core/ui/button'
import { Card } from '@/core/ui/card'
import { Skeleton } from '@/core/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/ui/table'

export const fmtDate = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export const fmtMoney = (amountMinor: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amountMinor / 100)
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${currency}`
  }
}

export const fmtNumber = (n: number) => n.toLocaleString('en-US')

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  paid: 'success',
  succeeded: 'success',
  processed: 'success',
  committed: 'success',
  active: 'success',
  queued: 'warning',
  running: 'warning',
  created: 'warning',
  checkout_started: 'warning',
  received: 'warning',
  held: 'warning',
  failed: 'error',
  refunded: 'info',
  ignored: 'secondary',
  live_mode: 'success',
  test_mode: 'info',
  mock: 'secondary',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANT[status] ?? 'outline'}>{status.replace(/_/g, ' ')}</Badge>
}

export const Mono = ({ children, title }: { children: ReactNode; title?: string }) => (
  <span className="font-mono text-xs" title={title}>
    {children}
  </span>
)

/** One-line text cut to a width; the full text is in the tooltip. */
export const Clip = ({ text, width = 'max-w-64' }: { text: string | null; width?: string }) =>
  text ? (
    <span className={`block truncate ${width}`} title={text}>
      {text}
    </span>
  ) : (
    <span className="text-muted-foreground">-</span>
  )

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h1 className="font-semibold text-xl">{children}</h1>
      {action}
    </div>
  )
}

export function QueryError({ error }: { error: unknown }) {
  const expired = error instanceof ApiError && error.status === 401
  return (
    <Alert variant="error">
      <AlertDescription>
        {expired ? (
          <>
            Your session has expired. <Link to="/admin/login/" className="underline">Sign in again</Link>.
          </>
        ) : error instanceof Error ? (
          error.message
        ) : (
          'Something went wrong'
        )}
      </AlertDescription>
    </Alert>
  )
}

/** A table inside a card; wide tables scroll sideways inside the card. */
export function DataTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {head.map((h) => (
            <TableHead key={h}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
  )
}

export const EmptyRow = ({ cols, text = 'Nothing here yet' }: { cols: number; text?: string }) => (
  <TableRow>
    <TableCell colSpan={cols} className="py-6 text-center text-muted-foreground">
      {text}
    </TableCell>
  </TableRow>
)

type Page<T> = { items: T[]; page: number; pageSize: number; hasMore: boolean }

/** Paged list backed by `GET <path>?page=&…params`; `row` renders the cells of one item. */
export function PagedTable<T extends { id: string }>({
  path,
  params,
  head,
  row,
  toolbar,
  empty,
}: {
  path: string
  params?: Record<string, string>
  head: string[]
  row: (item: T) => ReactNode[]
  toolbar?: ReactNode
  empty?: string
}) {
  const [page, setPage] = useState(1)
  const qs = new URLSearchParams({ ...params, page: String(page) })
  const query = useQuery({
    queryKey: ['admin', path, params, page],
    queryFn: () => api<Page<T>>(`${path}?${qs}`),
    placeholderData: keepPreviousData,
  })
  // A new search starts on page 1.
  const key = JSON.stringify(params)
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      {query.error ? <QueryError error={query.error} /> : null}
      <Card className="overflow-hidden">
        {query.data ? (
          <DataTable head={head}>
            {query.data.items.length === 0 ? (
              <EmptyRow cols={head.length} text={empty} />
            ) : (
              query.data.items.map((item) => (
                <TableRow key={item.id}>
                  {row(item).map((cell, i) => (
                    <TableCell key={head[i]}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </DataTable>
        ) : query.error ? null : (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        )}
        {query.data && (page > 1 || query.data.hasMore) ? (
          <div className="flex items-center justify-between border-t px-3 py-2 text-muted-foreground text-sm">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span>Page {page}</span>
            <Button variant="outline" size="sm" disabled={!query.data.hasMore} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

export const UserLink = ({ id, email }: { id: string; email: string | null }) => (
  <Link to="/admin/users/$id/" params={{ id }} className="underline-offset-4 hover:underline">
    {email ?? id}
  </Link>
)
