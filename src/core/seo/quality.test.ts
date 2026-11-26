import { describe, expect, it } from 'vitest'
import type { GuideFrontmatter, HubText, ItemText, ToolText } from '../content/schema'
import {
  aboutVerdict,
  duplicateReason,
  evidenceCount,
  guideVerdict,
  h2Count,
  hubVerdict,
  internalLinkCount,
  itemText,
  itemVerdict,
  jaccard,
  legalVerdict,
  nearDuplicates,
  noindexShareError,
  plainText,
  relatedReason,
  shingles,
  toolVerdict,
  wordCount,
} from './quality'

const demand = { source: 'serp-check' as const, note: 'checked', checked: '2026-11-26' }
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ')
const cjk = (n: number) => '字'.repeat(n)

const tool: ToolText = {
  keyword: 'word counter',
  demand,
  title: 'Word Counter: count words',
  description: 'x',
  lede: words(40),
  steps: [1, 2, 3].map((i) => ({ title: `Step ${i}`, body: words(30) })),
  sections: [{ h2: 'Use', body: words(40) }],
  examples: [{ input: 'a', output: 'b', caption: 'c' }],
  faq: [1, 2, 3, 4].map((i): [string, string] => [`Question ${i}?`, words(20)]),
}

describe('wordCount', () => {
  it('counts Latin words and CJK characters', () => {
    expect(wordCount('well-known fact, it is')).toBe(4)
    expect(wordCount('字数统计 word')).toBe(5)
  })
})

describe('toolVerdict', () => {
  it('passes a complete tool', () => {
    expect(toolVerdict(tool)).toEqual({ indexable: true, reasons: [] })
  })
  it('lists every missing minimum', () => {
    const v = toolVerdict({ ...tool, lede: 'Short.', steps: [tool.steps![0]], sections: undefined, examples: [], faq: [] })
    expect(v.indexable).toBe(false)
    expect(v.reasons.join('\n')).toMatch(/page text.*at least 250/)
    expect(v.reasons.join('\n')).toContain('steps: 1, want 3 to 4')
    expect(v.reasons.join('\n')).toContain('faq: 0 questions, at least 4')
    expect(v.reasons.join('\n')).toContain('examples: 0, at least 1')
  })
  it('uses the CJK minimum for CJK titles', () => {
    const zh = { ...tool, title: '字数统计', lede: cjk(100), steps: tool.steps!.map((s) => ({ ...s, body: cjk(50) })), sections: [{ h2: '用', body: cjk(100) }], faq: tool.faq!.map(([q]) => [q, cjk(30)] as [string, string]) }
    expect(toolVerdict({ ...zh, lede: cjk(10) }).reasons.join('\n')).toMatch(/at least 450/)
  })
})

const guide: GuideFrontmatter = { keyword: 'k', demand, title: 'A guide', description: 'x', lede: 'Lede.', published: '2026-11-26', updated: '2026-11-26', kind: 'guide' }
const body = `## One\n\n${words(300)} [a](/tools/a/) [b](/tools/b/)\n\n<Evidence caption="x">\n\ntable\n\n</Evidence>\n\n## Two\n\n${words(300)} [c](/tools/c/)\n`

describe('guideVerdict', () => {
  it('passes a guide with the minimum length, two H2s, three links and an Evidence block', () => {
    expect(guideVerdict(guide, body)).toEqual({ indexable: true, reasons: [] })
  })
  it('fails a short guide with no links, no H2s and no first-hand element', () => {
    const v = guideVerdict(guide, words(100))
    expect(v.reasons).toHaveLength(4)
  })
  it('does not count code blocks as text, headings or links', () => {
    const code = '```md\n## Heading\n[a](/x/) <img src="a.png">\n```\n'
    expect(h2Count(code)).toBe(0)
    expect(internalLinkCount(code)).toBe(0)
    expect(evidenceCount(code)).toBe(0)
    expect(wordCount(plainText(code))).toBe(0)
  })
  it('counts images and videos as first-hand elements, and external links as no internal link', () => {
    expect(evidenceCount('![shot](/a.png)')).toBe(1)
    expect(evidenceCount('<video src="/a.mp4" />')).toBe(1)
    expect(internalLinkCount('[x](https://example.com/) [y](//cdn.example.com/)')).toBe(0)
    expect(internalLinkCount('<a href="/tools/">t</a> [y](/guides/g/)')).toBe(2)
  })
})

const hub: HubText = { keyword: 'k', demand, title: 'Hub', description: 'x', lede: 'Lede.', intro: words(60) }

describe('hubVerdict', () => {
  it('needs the minimum number of indexable members and an intro', () => {
    expect(hubVerdict(hub, 6)).toEqual({ indexable: true, reasons: [] })
    expect(hubVerdict(hub, 5).reasons).toEqual(['5 indexable members, at least 6'])
    expect(hubVerdict({ ...hub, intro: 'Short.' }, 6).reasons[0]).toMatch(/intro: 1 words, at least 50/)
  })
  it('takes the member minimum from the site', () => {
    expect(hubVerdict(hub, 1, 1).indexable).toBe(true)
  })
})

describe('aboutVerdict and legalVerdict', () => {
  const fm = { title: 'About', description: 'x', lede: 'Lede.', published: '2026-11-26', updated: '2026-11-26' }
  it('need a minimum of text', () => {
    expect(aboutVerdict(fm, words(160)).indexable).toBe(true)
    expect(aboutVerdict(fm, words(20)).indexable).toBe(false)
    expect(legalVerdict({ ...fm }, words(120)).indexable).toBe(true)
    expect(legalVerdict({ ...fm }, words(20)).indexable).toBe(false)
  })
  it('keeps a legal page out when the frontmatter says noindex', () => {
    expect(legalVerdict({ ...fm, noindex: true }, words(120)).reasons).toEqual(['noindex: true in the frontmatter'])
  })
})

const item: ItemText = {
  keyword: 'heart symbols',
  demand,
  name: 'Heart symbols',
  title: 'Heart Symbols: copy',
  description: 'x',
  lede: words(20),
  body: [{ h2: 'Pick one', body: words(40) }, { h2: 'Where it works', body: words(30) }],
}
const facts = { dataText: '', hasMedia: true, dataEntries: 0 }

describe('itemVerdict', () => {
  it('passes an item with enough own text and a media item', () => {
    expect(itemVerdict(item, facts)).toEqual({ indexable: true, reasons: [] })
  })
  it('counts lede, body, FAQ and data text, not the name or the alt text', () => {
    const thin = { ...item, lede: words(10), body: [{ h2: 'H', body: words(10) }], alt: words(200) }
    expect(itemVerdict(thin, facts).reasons[0]).toMatch(/item text.*: 21 words, at least 80/)
    expect(itemVerdict(thin, { ...facts, dataText: words(60) }).indexable).toBe(true)
    expect(itemVerdict({ ...thin, faq: [['q one?', words(60)]] }, facts).indexable).toBe(true)
    expect(itemText(item)).not.toContain(item.name)
  })
  it('uses 150 CJK characters for CJK titles', () => {
    const zh = { ...item, title: '爱心符号', lede: cjk(20), body: [{ h2: '用', body: cjk(100) }] }
    expect(itemVerdict(zh, facts).reasons[0]).toMatch(/at least 150/)
    expect(itemVerdict({ ...zh, body: [{ h2: '用', body: cjk(140) }] }, facts).indexable).toBe(true)
  })
  it('needs one media item or a data block of 10 entries', () => {
    expect(itemVerdict(item, { ...facts, hasMedia: false, dataEntries: 9 }).reasons).toEqual(['no image or video, and 9 data entries, want one media item or at least 10 entries'])
    expect(itemVerdict(item, { ...facts, hasMedia: false, dataEntries: 10 }).indexable).toBe(true)
  })
})

describe('relatedReason', () => {
  it('asks for 3 related items', () => {
    expect(relatedReason(2)).toBe('related: 2 items, at least 3')
    expect(relatedReason(3)).toBeUndefined()
  })
})

describe('shingles and jaccard', () => {
  it('uses runs of 5 words for Latin text, ignoring case and punctuation', () => {
    expect([...shingles('One two three, four five six!')]).toEqual(['one two three four five', 'two three four five six'])
  })
  it('uses runs of 4 characters for CJK text, ignoring punctuation and spaces', () => {
    expect([...shingles('爱心符号，复制 粘贴')]).toEqual(['爱心符号', '心符号复', '符号复制', '号复制粘', '复制粘贴'])
  })
  it('keeps a text shorter than one shingle as one shingle, and an empty text as none', () => {
    expect([...shingles('Too short')]).toEqual(['too short'])
    expect(shingles('').size).toBe(0)
  })
  it('is |A and B| / |A or B|, and 0 for two empty sets', () => {
    expect(jaccard(new Set(['a', 'b', 'c']), new Set(['b', 'c', 'd']))).toBe(0.5)
    expect(jaccard(new Set(), new Set())).toBe(0)
  })
})

describe('nearDuplicates', () => {
  const base = 'the quick brown fox jumps over the lazy dog while the cat sleeps on the warm sofa all afternoon long'
  it('flags the later of two near-identical English texts, against the earlier one', () => {
    const found = nearDuplicates([
      { id: '/c/a/', text: base },
      { id: '/c/b/', text: `${base} today` },
      { id: '/c/c/', text: 'a completely different text about arrows, math signs and currency symbols that shares no run of words' },
    ])
    expect([...found.keys()]).toEqual(['/c/b/'])
    expect(found.get('/c/b/')?.of).toBe('/c/a/')
    expect(found.get('/c/b/')?.similarity).toBeGreaterThan(0.6)
    expect(duplicateReason(found.get('/c/b/')!)).toMatch(/^near-duplicate of \/c\/a\/ \(similarity 0\.\d\d/)
  })
  it('flags near-identical CJK texts', () => {
    const zh = '一键复制爱心符号，从细线条的空心爱心到实心爱心和粉色表情，点击方块即可复制，并说明哪些爱心适合用在简介和聊天里。'
    const found = nearDuplicates([
      { id: '/c/a/', text: zh },
      { id: '/c/b/', text: `${zh}好` },
      { id: '/c/c/', text: '数学符号包括比较、求和与集合，打印的数字要用真正的乘号和除号，而不是字母和斜杠。' },
    ])
    expect([...found.keys()]).toEqual(['/c/b/'])
  })
  it('passes texts that share some sentences but stay under 0.6', () => {
    const shared = 'tap a tile to copy the symbol and paste it into any app you like to use'
    const found = nearDuplicates([
      { id: '/c/a/', text: `${shared} then read how hearts are drawn by phones and which fonts include them in text mode today` },
      { id: '/c/b/', text: `${shared} then read about arrows and the logic they stand for in notes and slides for school` },
    ])
    expect(found.size).toBe(0)
  })
  it('compares only earlier items: with identical texts the first keeps its place', () => {
    const found = nearDuplicates([{ id: '/c/a/', text: base }, { id: '/c/b/', text: base }, { id: '/c/c/', text: base }])
    expect([...found.keys()]).toEqual(['/c/b/', '/c/c/'])
  })
})

describe('noindexShareError', () => {
  const noindex = [{ path: '/symbols/a/', reasons: ['no media', 'related: 1 items, at least 3'] }, { path: '/symbols/b/', reasons: ['thin'] }]
  it('names the collection, the language and each noindex item with its reasons when the share is above the limit', () => {
    const e = noindexShareError('symbols', 'en', noindex, 8, 0.2)!
    expect(e).toContain('collection "symbols" (en): 2 of 8 items are noindex (25%)')
    expect(e).toContain('seo.maxNoindexShare 0.2')
    expect(e).toContain('/symbols/a/: no media; related: 1 items, at least 3')
    expect(e).toContain('/symbols/b/: thin')
  })
  it('passes a share at or under the limit, and an empty collection', () => {
    expect(noindexShareError('symbols', 'en', noindex.slice(0, 1), 5, 0.2)).toBeUndefined()
    expect(noindexShareError('symbols', 'en', [], 0, 0.2)).toBeUndefined()
  })
  it('lists at most 25 items and says how many more', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ path: `/symbols/${i}/`, reasons: ['thin'] }))
    const e = noindexShareError('symbols', 'en', many, 40, 0.2)!
    expect(e).toContain('and 5 more')
    expect(e).not.toContain('/symbols/29/')
  })
})
