import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from './api'

// One client per mount. Only the account pages mount it, so content pages never load react-query.
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // One retry for network and server errors; a 4xx answer will not change.
            retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status < 500),
            refetchOnWindowFocus: false,
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
