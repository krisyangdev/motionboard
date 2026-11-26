import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { CollectionPage, collectionPageHead, loadCollectionPage } from '@/core/pages/ItemPage'

// /symbols/<slug>/: an item, or the hub of a category when the slug is one.
export const Route = createFileRoute('/{-$locale}/symbols/$slug/')({
  loader: ({ params }) => loadCollectionPage('symbols', params.slug, params.locale),
  head: ({ loaderData, params }) => (loaderData ? collectionPageHead(loaderData, paramLocale(params.locale)) : {}),
  component: Page,
})

function Page() {
  return <CollectionPage data={Route.useLoaderData()} locale={useLocale()} />
}
