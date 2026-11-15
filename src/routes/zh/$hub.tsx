import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '@/components/page/ContentPage'
import { contentHead } from '@/components/page/head'
import { loadContent } from '@/components/page/load'

export const Route = createFileRoute('/zh/$hub')({
  loader: ({ params }) => loadContent('hub', 'zh', params.hub),
  head: ({ loaderData }) => (loaderData ? contentHead('zh', loaderData) : {}),
  component: HubRoute,
})

function HubRoute() {
  const data = Route.useLoaderData()
  return <ContentPage key={data.id} data={data} />
}
