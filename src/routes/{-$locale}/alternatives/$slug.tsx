import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { AlternativesPage, alternativesHead, loadAlternativesPage } from '@/core/pages/AlternativesPage'

export const Route = createFileRoute('/{-$locale}/alternatives/$slug')({
  // A page without text in this language does not exist here: 404, never another language's text.
  loader: ({ params }) => loadAlternativesPage(params.locale, params.slug),
  head: ({ loaderData, params }) => (loaderData ? alternativesHead(loaderData, paramLocale(params.locale)) : {}),
  component: Alternatives,
})

function Alternatives() {
  return <AlternativesPage a={Route.useLoaderData()} locale={useLocale()} />
}
