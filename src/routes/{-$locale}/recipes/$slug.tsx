import { createFileRoute, notFound } from '@tanstack/react-router'
import { loadItem } from '@/core/content/items'
import { relatedItemEntries } from '@/core/content/members'
import { paramLocale } from '@/core/i18n'
import { itemHead } from '@/core/pages/ItemPage'
import { RecipePage } from '@/site/components/recipe/RecipePage'
import { bySlug, order, recipeData } from '@/site/data/terms'

export const Route = createFileRoute('/{-$locale}/recipes/$slug')({
  loader: async ({ params }) => {
    const locale = paramLocale(params.locale)
    const term = bySlug[params.slug]
    const item = term && (await loadItem('recipes', params.slug, locale))
    if (!item) throw notFound()
    // Related recipes in site order; an entry's href is /recipes/<slug>/.
    const slugs = new Set(relatedItemEntries('recipes', params.slug, locale).map((e) => e.href.split('/')[2]))
    // The loader data is serialized into the page for hydration: keep only this language's recipe text.
    const data = recipeData(item)
    const trimmed = { ...item, data: { ...data, text: { [locale]: data.text[locale] } } }
    return { item: trimmed, term, related: order.filter((t) => slugs.has(t.slug)) }
  },
  head: ({ loaderData, params }) => (loaderData ? itemHead(loaderData.item, paramLocale(params.locale)) : {}),
  component: RecipeRoute,
})

function RecipeRoute() {
  const { item, term, related } = Route.useLoaderData()
  return <RecipePage key={term.slug} term={term} item={item} related={related} />
}
