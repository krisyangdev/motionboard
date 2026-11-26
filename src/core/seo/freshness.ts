// Stale pages for `npm run seo-report` (spec §2.6): pages with third-party facts or prices (comparison, alternatives) need
// a check after 180 days, guides after 365. A refresh means checking the facts, prices and sources and editing them;
// a date bump without a content change is false freshness. Pure functions, Node only.
import type { SitePage } from '../pages.ts'

/** Days after which a page of this type is reported as stale. */
export const STALE_DAYS: Partial<Record<SitePage['type'], number>> = { compare: 180, alternatives: 180, guide: 365 }

export type StalePage = { path: string; type: SitePage['type']; updated: string; days: number; limit: number }

const DAY = 86_400_000

/** Pages whose `lastmod` (`updated`) is more than their type's limit before `today` (YYYY-MM-DD), oldest first. */
export function stalePages(pages: readonly SitePage[], today: string): StalePage[] {
  return pages
    .flatMap((p) => {
      const limit = STALE_DAYS[p.type]
      if (!limit || !p.lastmod) return []
      const days = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${p.lastmod}T00:00:00Z`)) / DAY)
      return days > limit ? [{ path: p.path, type: p.type, updated: p.lastmod, days, limit }] : []
    })
    .sort((a, b) => b.days - a.days || a.path.localeCompare(b.path))
}
