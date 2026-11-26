import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { ChangelogPage, changelogHead, loadChangelog } from '@/core/pages/ChangelogPage'

export const Route = createFileRoute('/{-$locale}/changelog/')({
  loader: ({ params }) => loadChangelog(params.locale, 1),
  head: ({ loaderData, params }) => (loaderData ? changelogHead(loaderData, paramLocale(params.locale)) : {}),
  component: Changelog,
})

function Changelog() {
  return <ChangelogPage c={Route.useLoaderData()} locale={useLocale()} />
}
