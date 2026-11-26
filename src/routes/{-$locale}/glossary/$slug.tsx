import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { GlossaryPage, glossaryHead, loadGlossaryPage } from '@/core/pages/GlossaryPage'

export const Route = createFileRoute('/{-$locale}/glossary/$slug')({
  // A term without a file in this language does not exist here: 404, never another language's text.
  loader: ({ params }) => loadGlossaryPage(params.locale, params.slug),
  head: ({ loaderData, params }) => (loaderData ? glossaryHead(loaderData.fm, paramLocale(params.locale), params.slug) : {}),
  component: Glossary,
})

function Glossary() {
  const { slug } = Route.useParams()
  const { fm } = Route.useLoaderData()
  return <GlossaryPage fm={fm} locale={useLocale()} slug={slug} />
}
