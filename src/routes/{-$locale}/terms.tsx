import { createFileRoute, notFound } from '@tanstack/react-router'
import { docPath, loadDoc } from '@/core/content/docs'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { DocPage, docHead } from '@/core/pages/DocPage'

export const Route = createFileRoute('/{-$locale}/terms')({
  loader: async ({ params }) => {
    const doc = await loadDoc('legal', paramLocale(params.locale), 'terms')
    if (!doc) throw notFound()
    return doc.frontmatter
  },
  head: ({ loaderData, params }) => (loaderData ? docHead(loaderData, paramLocale(params.locale), docPath('legal', 'terms'), 'legal') : {}),
  component: Terms,
})

function Terms() {
  return <DocPage collection="legal" fm={Route.useLoaderData()} locale={useLocale()} slug="terms" />
}
