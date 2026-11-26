import { createFileRoute, notFound } from '@tanstack/react-router'
import { docLocales, docPath, loadDoc } from '@/core/content/docs'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { DocPage, docHead } from '@/core/pages/DocPage'

export const Route = createFileRoute('/{-$locale}/guides/$slug')({
  loader: async ({ params }) => {
    // A guide without a file in this language does not exist here: 404, never another language's text.
    const doc = await loadDoc('guides', paramLocale(params.locale), params.slug)
    if (!doc) throw notFound()
    return { fm: doc.frontmatter, locales: docLocales('guides', params.slug) }
  },
  head: ({ loaderData, params }) => (loaderData ? docHead(loaderData.fm, paramLocale(params.locale), loaderData.locales, docPath('guides', params.slug), 'guides') : {}),
  component: Guide,
})

function Guide() {
  const { slug } = Route.useParams()
  return <DocPage collection="guides" fm={Route.useLoaderData().fm} locale={useLocale()} slug={slug} />
}
