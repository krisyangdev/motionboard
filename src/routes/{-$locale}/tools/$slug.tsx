import { createFileRoute, notFound } from '@tanstack/react-router'
import { loadTool, toolNames } from '@/core/content/tools'
import { paramLocale } from '@/core/i18n'
import { useLocale } from '@/core/locale'
import { ToolPage, toolHead } from '@/core/pages/ToolPage'

export const Route = createFileRoute('/{-$locale}/tools/$slug')({
  loader: async ({ params }) => {
    const page = await loadTool(params.slug)
    if (!page) throw notFound()
    // The six tools after this one in slug order (wrapping around), so every tool gets inbound links.
    const all = toolNames()
    const at = all.findIndex((t) => t.slug === page.slug)
    const siblings = [...all.slice(at + 1), ...all.slice(0, at)].slice(0, 6)
    return { page, siblings }
  },
  head: ({ loaderData, params }) => (loaderData ? toolHead(loaderData.page, paramLocale(params.locale)) : {}),
  component: ToolRoute,
})

function ToolRoute() {
  const { page, siblings } = Route.useLoaderData()
  return <ToolPage locale={useLocale()} page={page} siblings={siblings} />
}
