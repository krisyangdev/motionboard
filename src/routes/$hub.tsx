import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '@/components/page/ContentPage'
import { contentHead } from '@/components/page/head'
import { loadContent } from '@/components/page/load'

export const Route = createFileRoute('/$hub')({
  loader: ({ params }) => loadContent('hub', 'en', params.hub),
  head: ({ loaderData }) => (loaderData ? contentHead('en', loaderData) : {}),
  component: HubRoute,
})

function HubRoute() {
  const data = Route.useLoaderData()
  return <ContentPage key={data.id} data={data} />
}
