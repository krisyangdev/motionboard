import { describe, expect, it } from 'vitest'
import type { SitePage } from '../pages'
import { stalePages } from './freshness'

const page = (path: string, type: SitePage['type'], lastmod?: string): SitePage => ({ path, type, title: { en: path }, description: { en: path }, indexable: true, lastmod })

describe('stalePages', () => {
  const today = '2026-11-27'
  it('flags comparison and alternatives pages after 180 days and guides after 365', () => {
    const stale = stalePages(
      [
        page('/compare/a-vs-b/', 'compare', '2026-05-01'),
        page('/alternatives/x/', 'alternatives', '2026-06-01'),
        page('/guides/old/', 'guide', '2025-11-01'),
        page('/guides/fresh/', 'guide', '2026-01-01'),
      ],
      today,
    )
    expect(stale.map((s) => s.path)).toEqual(['/guides/old/', '/compare/a-vs-b/'])
    expect(stale[1]).toMatchObject({ days: 210, limit: 180, updated: '2026-05-01' })
  })
  it('keeps a page exactly at the limit and ignores other types and undated pages', () => {
    expect(stalePages([page('/compare/a-vs-b/', 'compare', '2026-05-31')], today)).toEqual([])
    expect(stalePages([page('/tools/t/', 'tool', '2020-01-01'), page('/guides/g/', 'guide')], today)).toEqual([])
  })
})
