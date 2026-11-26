import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { ContentPage } from '@/site/components/page/ContentPage'
import { loadContent } from '@/site/components/page/load'
import { contentHead } from '@/site/seo'

export const Route = createFileRoute('/{-$locale}/guides/$id')({
  loader: ({ params }) => loadContent('guide', paramLocale(params.locale), params.id),
  head: ({ loaderData, params }) => (loaderData ? contentHead(paramLocale(params.locale), loaderData) : {}),
  component: GuideRoute,
})

function GuideRoute() {
  const data = Route.useLoaderData()
  return <ContentPage key={data.id} data={data} />
}
