import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { ContentPage } from '@/site/components/page/ContentPage'
import { loadContent } from '@/site/components/page/load'
import { PAGES } from '@/site/data/pages'
import { contentHead } from '@/site/seo'

// A hub page: /logo-animation/, /zh/transitions/ ... Other single-segment paths (/zh/, /saved/) are not hubs: the
// route declines them here, so they reach the home and saved routes instead of a 404.
export const Route = createFileRoute('/{-$locale}/$hub')({
  params: { parse: (p) => (PAGES.some((x) => x.kind === 'hub' && x.id === p.hub) ? p : false) },
  loader: ({ params }) => loadContent('hub', paramLocale(params.locale), params.hub),
  head: ({ loaderData, params }) => (loaderData ? contentHead(paramLocale(params.locale), loaderData) : {}),
  component: HubRoute,
})

function HubRoute() {
  const data = Route.useLoaderData()
  return <ContentPage key={data.id} data={data} />
}
