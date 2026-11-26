import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { HubPage, hubHead, loadHub } from '@/core/pages/HubPage'

export const Route = createFileRoute('/{-$locale}/tools/')({
  loader: ({ params }) => loadHub('tools', params.locale, 1),
  head: ({ loaderData, params }) => (loaderData ? hubHead(loaderData, paramLocale(params.locale)) : {}),
  component: Hub,
})

function Hub() {
  return <HubPage data={Route.useLoaderData()} />
}
