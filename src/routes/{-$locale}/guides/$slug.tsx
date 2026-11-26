import { createFileRoute } from '@tanstack/react-router'
import { docPath } from '@/core/content/docs'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { DocPage, docHead, loadDocPage } from '@/core/pages/DocPage'

export const Route = createFileRoute('/{-$locale}/guides/$slug')({
  // A guide without a file in this language does not exist here: 404, never another language's text.
  loader: ({ params }) => loadDocPage('guides', params.locale, params.slug),
  head: ({ loaderData, params }) => (loaderData ? docHead(loaderData.fm, paramLocale(params.locale), docPath('guides', params.slug), 'guides') : {}),
  component: Guide,
})

function Guide() {
  const { slug } = Route.useParams()
  const { fm, related } = Route.useLoaderData()
  return <DocPage collection="guides" fm={fm} locale={useLocale()} related={related} slug={slug} />
}
