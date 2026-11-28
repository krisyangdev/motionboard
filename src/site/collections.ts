// The collections of programmatic item pages this site has (spec §1.2). Node only (the build reads it): no `@/` aliases,
// no React. Recipe: "Add a collection" in AGENTS.md.
//
// recipes: content/collections/recipes/<slug>.json, one per effect, served at /recipes/<slug>/ by the site's own route
// (src/routes/{-$locale}/recipes/$slug.tsx renders RecipePage on the template's loadItem and itemHead). The category is the
// effect's position in a launch film. `data` holds what the recipe page and scripts/site/recipes.mjs need beyond the item
// text: the film id, the original samples and the long recipe text per language.
import { z } from 'zod'
import { defineCollection } from '../core/content/collections.ts'

const recipeText = z.strictObject({
  why: z.string().min(1),
  /** [label, value]; value may contain <code> markup */
  spec: z.array(z.tuple([z.string().min(1), z.string().min(1)])),
  prompt: z.string().min(1),
  /** how people describe the shot in their own words */
  says: z.array(z.string().min(1)),
  /** [other recipe's slug, how they differ] */
  vs: z.array(z.tuple([z.string().min(1), z.string().min(1)])),
})

const sample = z.strictObject({
  t: z.string().min(1),
  id: z.string().min(1),
  at: z.string().min(1),
  s: z.number().optional(),
  u: z.string().optional(),
  /** only link to the original (no self-hosted clip) */
  link: z.boolean().optional(),
})

export const recipes = defineCollection({
  id: 'recipes',
  categories: ['open', 'reveal', 'feature', 'bridge', 'close'],
  data: z.strictObject({
    n: z.number().int().positive(),
    cat: z.enum(['A', 'B', 'C', 'D', 'E']),
    star: z.boolean(),
    /** media file stem on MEDIA_URL and the source folder in skills/motionboard/source/ */
    video: z.string().min(1),
    samples: z.array(sample),
    text: z.strictObject({ en: recipeText, zh: recipeText }),
  }),
})

export const collections = [recipes]
