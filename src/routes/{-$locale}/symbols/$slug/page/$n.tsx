import { createFileRoute, notFound } from '@tanstack/react-router'
import { categoryHubId } from '@/core/content/hubs'
import { paramLocale } from '@/core/i18n'
import { HubPage, hubHead, loadHub } from '@/core/pages/HubPage'

// Page 2 and up of a category hub of the symbols collection (/symbols/<category>/page/<n>/).
export const Route = createFileRoute('/{-$locale}/symbols/$slug/page/$n')({
  loader: ({ params }) => {
    const n = Number(params.n)
    if (n < 2 || String(n) !== params.n) throw notFound()
    return loadHub(categoryHubId('symbols', params.slug), params.locale, n)
  },
  head: ({ loaderData, params }) => (loaderData ? hubHead(loaderData, paramLocale(params.locale)) : {}),
  component: HubPageN,
})

function HubPageN() {
  return <HubPage data={Route.useLoaderData()} />
}
