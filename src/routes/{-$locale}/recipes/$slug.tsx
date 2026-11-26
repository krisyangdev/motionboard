import { createFileRoute } from '@tanstack/react-router'
import { paramLocale } from '@/core/i18n'
import { RecipePage } from '@/site/components/recipe/RecipePage'
import { loadRecipe, recipeHead } from '@/site/seo'

export const Route = createFileRoute('/{-$locale}/recipes/$slug')({
  loader: ({ params }) => loadRecipe(paramLocale(params.locale), params.slug),
  head: ({ loaderData, params }) => (loaderData ? recipeHead(paramLocale(params.locale), loaderData.term, loaderData.text) : {}),
  component: RecipeRoute,
})

function RecipeRoute() {
  const { term, text } = Route.useLoaderData()
  return <RecipePage key={term.slug} term={term} text={text} />
}
