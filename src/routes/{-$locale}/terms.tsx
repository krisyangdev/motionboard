import { createFileRoute, notFound } from '@tanstack/react-router'
import { docLocales, docPath, loadDoc } from '@/core/content/docs'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { DocPage, docHead } from '@/core/pages/DocPage'

export const Route = createFileRoute('/{-$locale}/terms')({
  loader: async ({ params }) => {
    // The page exists only in languages that have its file: 404 otherwise, never another language's text.
    const doc = await loadDoc('legal', paramLocale(params.locale), 'terms')
    if (!doc) throw notFound()
    return { fm: doc.frontmatter, locales: docLocales('legal', 'terms') }
  },
  head: ({ loaderData, params }) => (loaderData ? docHead(loaderData.fm, paramLocale(params.locale), loaderData.locales, docPath('legal', 'terms'), 'legal') : {}),
  component: Uterms,
})

function Uterms() {
  return <DocPage collection="legal" fm={Route.useLoaderData().fm} locale={useLocale()} slug="terms" />
}
