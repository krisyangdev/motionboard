import { describe, expect, it } from 'vitest'
import { RELATED_MAX, selectRelated, type RelatedItem } from './related'

const item = (slug: string, category: string[], tags: string[] = []): RelatedItem => ({ slug, category, tags })
const pool = [
  item('a', ['x'], ['t1', 't2']),
  item('b', ['x'], ['t1']),
  item('c', ['x']),
  item('d', ['y'], ['t1', 't2']),
  item('e', ['y'], ['t2']),
  item('f', ['y'], ['t9']),
]

describe('selectRelated', () => {
  it('takes the items of the same category first, then the ones that share tags, never itself', () => {
    expect(selectRelated(item('a', ['x'], ['t1', 't2']), pool)).toEqual(['b', 'c', 'd', 'e'])
  })
  it('ranks by the number of shared tags inside a group, then by slug', () => {
    const p = [item('self', ['x'], ['t1', 't2']), item('b', ['x'], ['t1']), item('a', ['x'], ['t1']), item('c', ['x'], ['t1', 't2'])]
    expect(selectRelated(p[0], p)).toEqual(['c', 'a', 'b'])
  })
  it('leaves out items of another category that share no tag', () => {
    expect(selectRelated(item('f', ['y'], ['t9']), pool)).toEqual(['d', 'e'])
    expect(selectRelated(item('z', ['q'], []), pool)).toEqual([])
  })
  it('uses the explicit list when it has valid entries, in its order', () => {
    expect(selectRelated({ ...item('a', ['x'], ['t1']), related: ['e', 'd', 'a', 'nope', 'e'] }, pool)).toEqual(['e', 'd'])
  })
  it('falls back to the automatic choice when no explicit entry is in the pool', () => {
    expect(selectRelated({ ...item('b', ['x']), related: ['nope'] }, pool)).toEqual(['a', 'c'])
  })
  it('returns at most 8', () => {
    const many = Array.from({ length: 20 }, (_, i) => item(`i${String(i).padStart(2, '0')}`, ['x']))
    expect(selectRelated(item('self', ['x']), many)).toHaveLength(RELATED_MAX)
    expect(selectRelated({ ...item('self', ['x']), related: many.map((m) => m.slug) }, many)).toHaveLength(RELATED_MAX)
  })
})
