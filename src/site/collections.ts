// The collections of programmatic item pages this site has (spec §1.2). Node only (the build reads it): no `@/` aliases,
// no React. Recipe: "Add a collection" in AGENTS.md.
import { z } from 'zod'
import { defineCollection } from '../core/content/collections.ts'

export const collections = [
  // Demo: one page per group of Unicode symbols to copy and paste. Items are content/collections/symbols/<slug>.json.
  defineCollection({
    id: 'symbols',
    // Category hubs: content/hubs/symbols/<category>.json, at /symbols/<category>/.
    categories: ['decorative', 'practical'],
    data: z.strictObject({ symbols: z.array(z.string().min(1)) }),
    // A data block of 10 or more symbols counts as the item's main content when it has no image.
    dataEntries: (data) => data.symbols.length,
  }),
]
