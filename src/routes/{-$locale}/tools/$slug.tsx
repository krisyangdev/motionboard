import { createFileRoute, notFound } from '@tanstack/react-router'
import { relatedEntries, members } from '@/core/content/members'
import { loadTool } from '@/core/content/tools'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { ToolPage, toolHead, toolPath } from '@/core/pages/ToolPage'

export const Route = createFileRoute('/{-$locale}/tools/$slug')({
  loader: async ({ params }) => {
    const locale = paramLocale(params.locale)
    // A tool without text in this language does not exist here: 404, never another language's text.
    const page = await loadTool(params.slug, locale)
    if (!page) throw notFound()
    // The tool's `related` list when it has one, else the six tools after this one in slug order (wrapping around), so every tool gets inbound links.
    const all = members('tools', locale)
    const at = all.findIndex((t) => t.href === toolPath(page.slug))
    const next = at < 0 ? all : [...all.slice(at + 1), ...all.slice(0, at)]
    const siblings = page.related?.length ? relatedEntries(page.related, locale, ['tools']) : next.slice(0, 6)
    return { page, siblings, locales: page.locales }
  },
  head: ({ loaderData, params }) => (loaderData ? toolHead(loaderData.page, paramLocale(params.locale)) : {}),
  component: ToolRoute,
})

function ToolRoute() {
  const { page, siblings } = Route.useLoaderData()
  return <ToolPage locale={useLocale()} page={page} siblings={siblings} />
}
