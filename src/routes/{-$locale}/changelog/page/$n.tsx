import { createFileRoute, notFound } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { ChangelogPage, changelogHead, loadChangelog } from '@/core/pages/ChangelogPage'

// Page 2 and up of the changelog; /changelog/page/1/ and non-canonical numbers (02, 2.0) are 404.
export const Route = createFileRoute('/{-$locale}/changelog/page/$n')({
  loader: ({ params }) => {
    const n = Number(params.n)
    if (n < 2 || String(n) !== params.n) throw notFound()
    return loadChangelog(params.locale, n)
  },
  head: ({ loaderData, params }) => (loaderData ? changelogHead(loaderData, paramLocale(params.locale)) : {}),
  component: ChangelogPageN,
})

function ChangelogPageN() {
  return <ChangelogPage c={Route.useLoaderData()} locale={useLocale()} />
}
