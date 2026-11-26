import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { UseCasePage, loadUseCasePage, useCaseHead } from '@/core/pages/UseCasePage'

// /for/<audience>/
export const Route = createFileRoute('/{-$locale}/for/$slug')({
  // A page without text in this language does not exist here: 404, never another language's text.
  loader: ({ params }) => loadUseCasePage(params.locale, params.slug),
  head: ({ loaderData, params }) => (loaderData ? useCaseHead(loaderData, paramLocale(params.locale)) : {}),
  component: UseCase,
})

function UseCase() {
  return <UseCasePage locale={useLocale()} u={Route.useLoaderData()} />
}
