import { createFileRoute } from '@tanstack/react-router'
import { loadTool, toolNames } from '@/core/content/tools'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { seoHead, breadcrumbLd } from '@/core/seo'
import { HubPage, labels } from '@/core/pages/HubPage'

const copy = {
  en: { title: 'Free online tools', description: 'Free browser tools that run on your device: no sign-up, nothing to install, nothing uploaded.', lede: 'Free browser tools that run on your device. No sign-up, nothing to install.' },
  zh: { title: '免费在线工具', description: '在浏览器里直接使用的免费工具：无需注册，无需安装，内容不会上传。', lede: '在浏览器里直接使用的免费工具，无需注册，无需安装。' },
}

export const Route = createFileRoute('/{-$locale}/tools/')({
  loader: async ({ params }) => {
    const locale = paramLocale(params.locale)
    const pages = await Promise.all(toolNames().map((t) => loadTool(t.slug)))
    // Only the fields the list shows go into the page payload.
    return pages.flatMap((p) => (p ? [{ title: p.name[locale], description: p[locale].description, href: `/tools/${p.slug}/` }] : []))
  },
  head: ({ params }) => {
    const locale = paramLocale(params.locale)
    return seoHead({
      title: copy[locale].title,
      description: copy[locale].description,
      path: '/tools/',
      locale,
      type: 'website',
      jsonLd: [breadcrumbLd(locale, [[labels[locale].tools, '/tools/']])],
    })
  },
  component: Tools,
})

function Tools() {
  const entries = Route.useLoaderData()
  const locale = useLocale()
  return <HubPage crumb={labels[locale].tools} entries={entries} lede={copy[locale].lede} title={copy[locale].title} />
}
