import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { HomePage } from '@/site/components/home/HomePage'
import { homeHead } from '@/site/seo'

export const Route = createFileRoute('/{-$locale}/')({
  head: ({ params }) => homeHead(paramLocale(params.locale)),
  component: HomePage,
})
