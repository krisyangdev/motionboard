import { describe, expect, it } from 'vitest'
import { HUB_PAGE_SIZE, hubPageCount, hubPagePath, hubPageSlice } from './hubs'

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
