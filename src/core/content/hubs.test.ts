import { describe, expect, it } from 'vitest'
import { categoryHubId, CHANGELOG_PAGE_SIZE, CHANGELOG_PATH, HUB_PAGE_SIZE, hubPageCount, hubPagePath, hubPageSlice, itemPath, typedPath } from './hubs'

describe('hub pagination', () => {
  it('counts pages, at least one', () => {
    expect(hubPageCount(0, HUB_PAGE_SIZE)).toBe(1)
    expect(hubPageCount(60, 60)).toBe(1)
    expect(hubPageCount(61, 60)).toBe(2)
    expect(hubPageCount(3063, 60)).toBe(52)
  })
  it('page 1 is the hub itself, page n is /page/<n>/', () => {
    expect(hubPagePath('/prompts/', 1)).toBe('/prompts/')
    expect(hubPagePath('/prompts/', 2)).toBe('/prompts/page/2/')
  })
  it('slices the members of a page', () => {
    const all = [1, 2, 3, 4, 5]
    expect(hubPageSlice(all, 1, 2)).toEqual([1, 2])
    expect(hubPageSlice(all, 3, 2)).toEqual([5])
    expect(hubPageSlice(all, 4, 2)).toEqual([])
  })
})

describe('collection paths', () => {
  it('puts an item at /<collection>/<slug>/ and a category hub at /<collection>/<category>/', () => {
    expect(itemPath('symbols', 'heart-symbols')).toBe('/symbols/heart-symbols/')
    expect(categoryHubId('symbols', 'decorative')).toBe('symbols/decorative')
    expect(hubPagePath(`/${categoryHubId('symbols', 'decorative')}/`, 2)).toBe('/symbols/decorative/page/2/')
  })
})

describe('paths of the hand-written page types', () => {
  it('puts each type under its base', () => {
    expect(typedPath('compare', 'a-vs-b')).toBe('/compare/a-vs-b/')
    expect(typedPath('alternatives', 'x')).toBe('/alternatives/x/')
    expect(typedPath('glossary', 'dithering')).toBe('/glossary/dithering/')
    expect(typedPath('use-case', 'students')).toBe('/for/students/')
    expect(typedPath('gallery', 'cards')).toBe('/gallery/cards/')
  })
  it('continues the changelog at /changelog/page/<n>/ after 50 entries', () => {
    expect(hubPageCount(50, CHANGELOG_PAGE_SIZE)).toBe(1)
    expect(hubPageCount(51, CHANGELOG_PAGE_SIZE)).toBe(2)
    expect(hubPagePath(CHANGELOG_PATH, 2)).toBe('/changelog/page/2/')
  })
})

