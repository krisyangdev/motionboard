import { createFileRoute } from '@tanstack/react-router'
import { docPath } from '@/core/content/docs'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { DocPage, docHead, loadDocPage } from '@/core/pages/DocPage'

export const Route = createFileRoute('/{-$locale}/about')({
  // The page exists only in languages that have its file: 404 otherwise, never another language's text.
  loader: ({ params }) => loadDocPage('about', params.locale, 'about'),
  head: ({ loaderData, params }) => (loaderData ? docHead(loaderData.fm, paramLocale(params.locale), docPath('about', 'about'), 'about') : {}),
  component: About,
})

function About() {
  const { fm, related } = Route.useLoaderData()
  return <DocPage collection="about" fm={fm} locale={useLocale()} related={related} slug="about" />
}
