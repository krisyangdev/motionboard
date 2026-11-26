import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { HubPage, hubHead, loadHub } from '@/core/pages/HubPage'

// The hub of the symbols collection. A collection's routes are these four files: copy the folder and rename "symbols".
export const Route = createFileRoute('/{-$locale}/symbols/')({
  loader: ({ params }) => loadHub('symbols', params.locale, 1),
  head: ({ loaderData, params }) => (loaderData ? hubHead(loaderData, paramLocale(params.locale)) : {}),
  component: Hub,
})

function Hub() {
  return <HubPage data={Route.useLoaderData()} />
}
