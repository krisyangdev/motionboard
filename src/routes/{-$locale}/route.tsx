import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { PREFIXED_LOCALES } from '@/core/i18n'

// The optional locale segment only accepts the prefixed languages, so /en/... and /fr/... are 404.
export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: ({ params }) => {
    if (params.locale !== undefined && !(PREFIXED_LOCALES as readonly string[]).includes(params.locale)) throw notFound()
  },
  component: Outlet,
})
