import { createFileRoute } from '@tanstack/react-router'
import { docList } from '@/core/content/docs'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { breadcrumbLd, seoHead } from '@/core/seo'
import { HubPage, labels } from '@/core/pages/HubPage'

const copy = {
  en: { title: 'Guides', description: 'Step-by-step guides and practical notes, written for people who want the task done.', lede: 'Step-by-step guides and practical notes.' },
  zh: { title: '指南', description: '一步一步的操作指南和实用笔记，写给想把事情做完的人。', lede: '一步一步的操作指南和实用笔记。' },
}

export const Route = createFileRoute('/{-$locale}/guides/')({
  loader: ({ params }) => docList('guides', paramLocale(params.locale)).map((d) => ({ title: d.title, description: d.description, href: `/guides/${d.slug}/` })),
  head: ({ params }) => {
    const locale = paramLocale(params.locale)
    return seoHead({
      title: copy[locale].title,
      description: copy[locale].description,
      path: '/guides/',
      locale,
      type: 'website',
      jsonLd: [breadcrumbLd(locale, [[labels[locale].guides, '/guides/']])],
    })
  },
  component: Guides,
})

function Guides() {
  const entries = Route.useLoaderData()
  const locale = useLocale()
  return <HubPage crumb={labels[locale].guides} entries={entries} lede={copy[locale].lede} title={copy[locale].title} />
}
