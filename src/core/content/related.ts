// Related items of a collection item (spec §1.2): the item's own `related` list when it has valid entries, else items of
// the same category, then the ones sharing the most tags. Pure; pages.ts runs it at build time and stores the result.

/** Most related items an item shows; the minimum is MIN.item.related in src/core/seo/quality.ts. */
export const RELATED_MAX = 8

export type RelatedItem = { slug: string; category: readonly string[]; tags: readonly string[] }

const shared = (a: readonly string[], b: readonly string[]) => a.filter((x) => b.includes(x)).length

/**
 * Slugs of the related items of `self`, best first. `pool` holds the items that may be shown (they exist in the
 * language and are not noindex); `self` itself in the pool is ignored. Items of another category with no tag in common are never picked.
 */
export function selectRelated(self: RelatedItem & { related?: readonly string[] }, pool: readonly RelatedItem[], max: number = RELATED_MAX): string[] {
  const others = pool.filter((p) => p.slug !== self.slug)
  const explicit = [...new Set(self.related ?? [])].filter((slug) => others.some((p) => p.slug === slug))
  if (explicit.length) return explicit.slice(0, max)
  const scored = others
    .map((p) => ({ slug: p.slug, sameCategory: shared(self.category, p.category) > 0, tags: shared(self.tags, p.tags) }))
    .filter((p) => p.sameCategory || p.tags > 0)
    .sort((a, b) => Number(b.sameCategory) - Number(a.sameCategory) || b.tags - a.tags || a.slug.localeCompare(b.slug))
  return scored.slice(0, max).map((p) => p.slug)
}
