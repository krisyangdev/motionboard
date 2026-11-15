import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '@/components/page/ContentPage'
import { contentHead } from '@/components/page/head'
import { loadContent } from '@/components/page/load'

export const Route = createFileRoute('/guides/$id')({
  loader: ({ params }) => loadContent('guide', 'en', params.id),
  head: ({ loaderData }) => (loaderData ? contentHead('en', loaderData) : {}),
  component: GuideRoute,
})

function GuideRoute() {
  const data = Route.useLoaderData()
  return <ContentPage key={data.id} data={data} />
}
