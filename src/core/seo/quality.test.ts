import { describe, expect, it } from 'vitest'
import type { GuideFrontmatter, HubText, ToolText } from '../content/schema'
import { aboutVerdict, evidenceCount, guideVerdict, h2Count, hubVerdict, internalLinkCount, legalVerdict, plainText, toolVerdict, wordCount } from './quality'

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
