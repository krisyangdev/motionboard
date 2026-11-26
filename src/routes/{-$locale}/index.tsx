import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { organizationLd, seoHead, websiteLd } from '@/core/seo'
import { Home } from '@/site/home/Home'
import { SITE } from '../../../site.config.ts'

export const Route = createFileRoute('/{-$locale}/')({
  head: ({ params }) => {
    const l = paramLocale(params.locale)
    return seoHead({
      title: SITE.title[l],
      description: SITE.description[l],
      path: '/',
      locale: l,
      type: 'website',
      jsonLd: [websiteLd(l), organizationLd()],
    })
  },
  component: Home,
})
