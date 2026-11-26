import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { SavedPage } from '@/site/components/SavedPage'
import { savedHead } from '@/site/seo'

export const Route = createFileRoute('/{-$locale}/saved')({
  head: ({ params }) => savedHead(paramLocale(params.locale)),
  component: SavedPage,
})
