import { createFileRoute } from '@tanstack/react-router'
import { docPath } from '@/core/content/docs'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { DocPage, docHead, loadDocPage } from '@/core/pages/DocPage'

export const Route = createFileRoute('/{-$locale}/privacy')({
  // The page exists only in languages that have its file: 404 otherwise, never another language's text.
  loader: ({ params }) => loadDocPage('legal', params.locale, 'privacy'),
  head: ({ loaderData, params }) => (loaderData ? docHead(loaderData.fm, paramLocale(params.locale), docPath('legal', 'privacy'), 'legal') : {}),
  component: Uprivacy,
})

function Uprivacy() {
  const { fm, related } = Route.useLoaderData()
  return <DocPage collection="legal" fm={fm} locale={useLocale()} related={related} slug="privacy" />
}
