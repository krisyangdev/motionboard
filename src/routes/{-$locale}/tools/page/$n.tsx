import { createFileRoute, notFound } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { HubPage, hubHead, loadHub } from '@/core/pages/HubPage'

// Page 2 and up of the tools hub; /tools/page/1/ and non-canonical numbers (02, 2.0) are 404.
export const Route = createFileRoute('/{-$locale}/tools/page/$n')({
  loader: ({ params }) => {
    const n = Number(params.n)
    if (n < 2 || String(n) !== params.n) throw notFound()
    return loadHub('tools', params.locale, n)
  },
  head: ({ loaderData, params }) => (loaderData ? hubHead(loaderData, paramLocale(params.locale)) : {}),
  component: HubPageN,
})

function HubPageN() {
  return <HubPage data={Route.useLoaderData()} />
}
