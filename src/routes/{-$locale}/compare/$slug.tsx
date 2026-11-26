import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { ComparePage, compareHead, loadComparePage } from '@/core/pages/ComparePage'

export const Route = createFileRoute('/{-$locale}/compare/$slug')({
  // A comparison without a file in this language does not exist here: 404, never another language's text.
  loader: ({ params }) => loadComparePage(params.locale, params.slug),
  head: ({ loaderData, params }) => (loaderData ? compareHead(loaderData.fm, paramLocale(params.locale), params.slug) : {}),
  component: Compare,
})

function Compare() {
  const { slug } = Route.useParams()
  const { fm } = Route.useLoaderData()
  return <ComparePage fm={fm} locale={useLocale()} slug={slug} />
}
