import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '@/components/page/ContentPage'
import { contentHead } from '@/components/page/head'
import { loadContent } from '@/components/page/load'

export const Route = createFileRoute('/zh/guides/$id')({
  loader: ({ params }) => loadContent('guide', 'zh', params.id),
  head: ({ loaderData }) => (loaderData ? contentHead('zh', loaderData) : {}),
  component: GuideRoute,
})

function GuideRoute() {
  const data = Route.useLoaderData()
  return <ContentPage key={data.id} data={data} />
}
