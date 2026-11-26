import { createFileRoute, notFound } from '@tanstack/react-router'
import { docPath, loadDoc } from '@/core/content/docs'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { DocPage, docHead } from '@/core/pages/DocPage'

export const Route = createFileRoute('/{-$locale}/guides/$slug')({
  loader: async ({ params }) => {
    const doc = await loadDoc('guides', paramLocale(params.locale), params.slug)
    if (!doc) throw notFound()
    return doc.frontmatter
  },
  head: ({ loaderData, params }) => (loaderData ? docHead(loaderData, paramLocale(params.locale), docPath('guides', params.slug), 'guides') : {}),
  component: Guide,
})

function Guide() {
  const { slug } = Route.useParams()
  return <DocPage collection="guides" fm={Route.useLoaderData()} locale={useLocale()} slug={slug} />
}
