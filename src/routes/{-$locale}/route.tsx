import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { PREFIXED_LOCALES } from '@/core/i18n'
import { StatsProvider } from '@/site/lib/stats'

// The optional locale segment only accepts the prefixed languages, so /en/... and /fr/... are 404.
// StatsProvider loads the like and copy counts once for every page under it.
export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: ({ params }) => {
    if (params.locale !== undefined && !(PREFIXED_LOCALES as readonly string[]).includes(params.locale)) throw notFound()
  },
  component: () => (
    <StatsProvider>
      <Outlet />
    </StatsProvider>
  ),
})
