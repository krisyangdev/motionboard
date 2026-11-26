// The collections of programmatic item pages this site has (spec §1.2). Node only (the build reads it): no `@/` aliases,
// no React. Recipe: "Add a collection" in AGENTS.md. Motionboard's recipes still use their own route and
// scripts/site/recipes.mjs; they move here later.
import type { defineCollection } from '../core/content/collections.ts'

export const collections: ReturnType<typeof defineCollection>[] = []
