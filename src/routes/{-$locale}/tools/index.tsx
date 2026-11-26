import { createFileRoute, notFound } from '@tanstack/react-router'
import { hubLocales } from '@/core/content/exists'
import { loadTool, toolNames } from '@/core/content/tools'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { coreMessages } from '@/core/messages'
import { seoHead, breadcrumbLd } from '@/core/seo'
import { HubPage } from '@/core/pages/HubPage'

export const Route = createFileRoute('/{-$locale}/tools/')({
  loader: async ({ params }) => {
    const locale = paramLocale(params.locale)
    const names = toolNames(locale)
    // The hub exists only in languages that have at least one tool.
    if (!names.length) throw notFound()
    const pages = await Promise.all(names.map((t) => loadTool(t.slug, locale)))
    // Only the fields the list shows go into the page payload.
    const entries = pages.flatMap((p) => (p ? [{ title: p.name, description: p.text.description, href: `/tools/${p.slug}/` }] : []))
    return { entries, locales: hubLocales('tools') }
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return {}
    const locale = paramLocale(params.locale)
    const m = coreMessages[locale]
    return seoHead({
      title: m.hubs.tools.title,
      description: m.hubs.tools.description,
      path: '/tools/',
      locale,
      locales: loaderData.locales,
      type: 'website',
      jsonLd: [breadcrumbLd(locale, [[m.page.tools, '/tools/']])],
    })
  },
  component: Tools,
})

function Tools() {
  const { entries } = Route.useLoaderData()
  const m = coreMessages[useLocale()]
  return <HubPage crumb={m.page.tools} entries={entries} lede={m.hubs.tools.lede} title={m.hubs.tools.title} />
}
