import { describe, expect, it } from 'vitest'
import type { AlternativesText, ChangelogText, CompareFrontmatter, GalleryText, GlossaryFrontmatter, GuideFrontmatter, HubText, ItemText, ToolText, UseCaseText } from '../content/schema'
import {
  aboutVerdict,
  alternativesVerdict,
  changelogVerdict,
  compareVerdict,
  galleryVerdict,
  glossaryVerdict,
  useCaseVerdict,
  USE_CASE_NEAR_DUPLICATE_JACCARD,
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

const row = (i: number) => ({ factor: `Factor ${i}`, a: 'a', b: 'b', chooseIf: 'c' })
const source = (i: number) => ({ label: `S${i}`, url: `https://example.com/${i}`, checked: '2026-11-26' })
const compare: CompareFrontmatter = {
  keyword: 'a vs b',
  demand,
  title: 'A vs B',
  description: 'x',
  lede: words(30),
  published: '2026-11-26',
  updated: '2026-11-26',
  products: [{ name: 'A', url: '/a/', relation: 'ours' }, { name: 'B', url: 'https://example.com/', relation: 'third-party' }],
  verdict: words(40),
  table: [1, 2, 3, 4, 5, 6].map(row),
  sources: [1, 2, 3].map(source),
}

describe('compareVerdict', () => {
  it('passes 700 words, 6 table rows and 3 sources', () => {
    expect(compareVerdict(compare, words(640))).toEqual({ indexable: true, reasons: [] })
  })
  it('lists the text, the rows and the sources that fall short', () => {
    const v = compareVerdict({ ...compare, table: [row(1)], sources: [source(1)] }, words(100))
    expect(v.reasons.join('\n')).toMatch(/page text.*at least 700/)
    expect(v.reasons).toContain('table: 1 rows, at least 6')
    expect(v.reasons).toContain('sources: 1, at least 3')
  })
  it('uses the CJK minimum for CJK titles', () => {
    expect(compareVerdict({ ...compare, title: '对比' }, cjk(500)).reasons[0]).toMatch(/at least 1260/)
  })
})

const entry = (i: number, n = 45) => ({ name: `Tool ${i}`, url: 'https://example.com/', bestFor: 'quick checks', price: 'Not checked', relation: 'third-party' as const, notes: words(n) })
const alternatives: AlternativesText = {
  keyword: 'x alternatives',
  demand,
  title: '5 X Alternatives',
  description: 'x',
  lede: words(20),
  product: 'X',
  criteria: words(40),
  entries: [1, 2, 3, 4, 5].map((i) => entry(i, 110)),
  sources: [1, 2, 3].map(source),
}

describe('alternativesVerdict', () => {
  it('passes 5 entries of 40 words, 600 words and 3 sources', () => {
    expect(alternativesVerdict(alternatives)).toEqual({ indexable: true, reasons: [] })
  })
  it('names the entry whose notes are too short, and the other missing minimums', () => {
    const v = alternativesVerdict({ ...alternatives, entries: [entry(1), entry(2, 10), entry(3)], sources: [source(1)] })
    expect(v.reasons).toContain('entries: 3, at least 5')
    expect(v.reasons.join('\n')).toMatch(/entry "Tool 2": notes have 10 words, at least 40/)
    expect(v.reasons.join('\n')).not.toMatch(/entry "Tool 1"/)
    expect(v.reasons.join('\n')).toMatch(/page text.*at least 600/)
    expect(v.reasons).toContain('sources: 1, at least 3')
  })
})

const glossary: GlossaryFrontmatter = {
  keyword: 'dithering',
  demand,
  title: 'What is dithering?',
  description: 'x',
  lede: 'Lede.',
  published: '2026-11-26',
  updated: '2026-11-26',
  definition: words(50),
  example: { text: 'x', caption: 'y' },
  seeAlso: [1, 2, 3].map((i) => ({ name: `Term ${i}`, path: `/glossary/t${i}/` })),
  useIt: [{ name: 'Tool', path: '/tools/t/' }],
}

describe('glossaryVerdict', () => {
  it('passes a 40 to 60 word definition, 200 words, 3 see-also links and a tool', () => {
    expect(glossaryVerdict(glossary, words(160))).toEqual({ indexable: true, reasons: [] })
  })
  it('checks the definition length, the text, the links and the tool', () => {
    const v = glossaryVerdict({ ...glossary, definition: words(70), seeAlso: [], useIt: [] }, words(10))
    expect(v.reasons).toContain('definition: 70 words, want 40 to 60 (each CJK character counts as a word)')
    expect(v.reasons.join('\n')).toMatch(/definition and body: 80 words, at least 200/)
    expect(v.reasons).toContain('seeAlso: 0 links, at least 3')
    expect(v.reasons.join('\n')).toMatch(/useIt: 0 links, at least 1/)
    expect(glossaryVerdict({ ...glossary, definition: words(39) }, words(200)).reasons[0]).toMatch(/definition: 39 words/)
  })
  it('uses the CJK ranges', () => {
    const zh = { ...glossary, title: '什么是抖动', definition: cjk(90) }
    expect(glossaryVerdict(zh, cjk(300))).toEqual({ indexable: true, reasons: [] })
    expect(glossaryVerdict({ ...zh, definition: cjk(50) }, cjk(300)).reasons[0]).toMatch(/definition: 50 words, want 72 to 108/)
  })
})

const useCase: UseCaseText = {
  keyword: 'x for students',
  demand,
  title: 'X for students',
  description: 'x',
  lede: words(20),
  audience: 'Students',
  problems: [1, 2, 3].map((i) => ({ title: `P${i}`, body: words(40) })),
  workflow: [1, 2, 3].map((i) => ({ title: `S${i}`, body: words(40) })),
  examples: [1, 2, 3].map((i) => ({ name: `E${i}`, path: `/tools/e${i}/`, caption: words(25) })),
  cta: { name: 'Go', path: '/tools/t/' },
  faq: [1, 2, 3].map((i): [string, string] => [`Q${i}?`, words(20)]),
}

describe('useCaseVerdict', () => {
  it('passes 400 words and 3 examples with captions of 20 words', () => {
    expect(useCaseVerdict(useCase)).toEqual({ indexable: true, reasons: [] })
  })
  it('names the example whose caption is too short', () => {
    const v = useCaseVerdict({ ...useCase, examples: [{ ...useCase.examples[0], caption: words(5) }, ...useCase.examples.slice(1, 2)] })
    expect(v.reasons).toContain('examples: 2, at least 3')
    expect(v.reasons.join('\n')).toMatch(/example "E1": caption has 5 words, at least 20/)
  })
  it('is compared at a stricter near-duplicate threshold than other types', () => {
    expect(USE_CASE_NEAR_DUPLICATE_JACCARD).toBe(0.4)
  })
})

const gallery: GalleryText = {
  keyword: 'k',
  demand,
  title: 'Gallery',
  description: 'x',
  lede: 'Lede.',
  intro: words(85),
  entries: [1, 2, 3, 4, 5, 6].map((i) => ({ media: { kind: 'image' as const, src: `/g${i}.png`, width: 10, height: 10 }, alt: `Image ${i}`, title: `Entry ${i}`, caption: words(16) })),
}

describe('galleryVerdict', () => {
  it('passes an 80 word intro and 6 entries with captions of 15 words', () => {
    expect(galleryVerdict(gallery)).toEqual({ indexable: true, reasons: [] })
  })
  it('lists the intro, the entry count and the short captions', () => {
    const v = galleryVerdict({ ...gallery, intro: words(20), entries: [{ ...gallery.entries[0], caption: words(4) }] })
    expect(v.reasons.join('\n')).toMatch(/intro: 20 words, at least 80/)
    expect(v.reasons).toContain('entries: 1, at least 6')
    expect(v.reasons.join('\n')).toMatch(/entry "Entry 1": caption has 4 words, at least 15/)
  })
})

describe('changelogVerdict', () => {
  const log: ChangelogText = { keyword: 'k', demand, title: 'Changelog k', description: 'x', lede: 'x', entries: [{ date: '2026-11-26', slug: 'a', title: 'A', items: ['x'] }] }
  it('needs one entry', () => {
    expect(changelogVerdict(log).indexable).toBe(true)
    expect(changelogVerdict({ ...log, entries: [] }).reasons).toEqual(['entries: 0, at least 1'])
  })
})

