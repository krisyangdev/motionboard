import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { GalleryPage, galleryHead, loadGalleryPage } from '@/core/pages/GalleryPage'

export const Route = createFileRoute('/{-$locale}/gallery/$slug')({
  // A page without text in this language does not exist here: 404, never another language's text.
  loader: ({ params }) => loadGalleryPage(params.locale, params.slug),
  head: ({ loaderData, params }) => (loaderData ? galleryHead(loaderData, paramLocale(params.locale)) : {}),
  component: Gallery,
})

function Gallery() {
  return <GalleryPage g={Route.useLoaderData()} locale={useLocale()} />
}
