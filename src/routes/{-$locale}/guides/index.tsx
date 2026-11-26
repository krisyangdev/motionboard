import { createFileRoute, notFound } from '@tanstack/react-router'
import { hubLocales } from '@/core/content/exists'
import { docList } from '@/core/content/docs'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { coreMessages } from '@/core/messages'
import { breadcrumbLd, seoHead } from '@/core/seo'
import { HubPage } from '@/core/pages/HubPage'

export const Route = createFileRoute('/{-$locale}/guides/')({
  loader: ({ params }) => {
    const entries = docList('guides', paramLocale(params.locale)).map((d) => ({ title: d.title, description: d.description, href: `/guides/${d.slug}/` }))
    // The hub exists only in languages that have at least one guide.
    if (!entries.length) throw notFound()
    return { entries, locales: hubLocales('guides') }
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return {}
    const locale = paramLocale(params.locale)
    const m = coreMessages[locale]
    return seoHead({
      title: m.hubs.guides.title,
      description: m.hubs.guides.description,
      path: '/guides/',
      locale,
      locales: loaderData.locales,
      type: 'website',
      jsonLd: [breadcrumbLd(locale, [[m.page.guides, '/guides/']])],
    })
  },
  component: Guides,
})

function Guides() {
  const { entries } = Route.useLoaderData()
  const m = coreMessages[useLocale()]
  return <HubPage crumb={m.page.guides} entries={entries} lede={m.hubs.guides.lede} title={m.hubs.guides.title} />
}
