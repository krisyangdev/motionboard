import type { ReactNode } from 'react'
import { QueryProvider } from './QueryProvider'

// Wraps a page that fetches its data in the browser after hydration.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">{children}</main>
    </QueryProvider>
  )
}
