import { describe, expect, it } from 'vitest'
import { guideSchema, legalSchema, parseContent, toolFileSchema } from './schema'

const demand = { source: 'serp-check', note: 'Page 1 shows tools of the same kind.', checked: '2026-11-26' }
const text = {
  keyword: 'word counter',
  demand,
  title: 'Word Counter: count words and characters',
  description: 'Paste your text to count words, characters and reading time instantly. Runs in your browser, so nothing you type is uploaded or stored.',
  lede: 'Paste text to see the counts.',
}
const tool = { slug: 'word-counter', tool: null, published: '2026-11-26', updated: '2026-11-26', en: text }
const guide = { ...text, published: '2026-11-26', updated: '2026-11-26', kind: 'guide' }
const legal = { title: 'Privacy Policy', description: text.description, published: '2026-11-26', updated: '2026-11-26' }
const message = (fn: () => unknown) => {
  try {
    fn()
  } catch (e) {
    return (e as Error).message
  }
  return ''
}

describe('content schemas', () => {
  it('accept complete content', () => {
    expect(() => parseContent(toolFileSchema(['en']), tool, 'content/tools/word-counter.json')).not.toThrow()
    expect(() => parseContent(guideSchema, guide, 'content/guides/en/a.mdx')).not.toThrow()
    expect(() => parseContent(legalSchema, legal, 'content/legal/en/privacy.mdx')).not.toThrow()
  })
  it('name the file and the field of every problem', () => {
    const bad = { ...tool, updated: '26/11/2026', en: { ...text, keyword: 'case', demand: { ...demand, source: 'none' }, title: 'x'.repeat(61), oops: 1 } }
    const msg = message(() => parseContent(toolFileSchema(['en']), bad, 'content/tools/word-counter.json'))
    expect(msg).toContain('content/tools/word-counter.json')
    for (const field of ['updated:', 'en.title:', 'en.demand.source:', 'en:']) expect(msg).toContain(field)
  })
  it('require the keyword in the title and a description of the right length', () => {
    const msg = message(() => parseContent(guideSchema, { ...guide, title: 'Count things', description: 'Too short.' }, 'g.mdx'))
    expect(msg).toContain('title: must contain the keyword "word counter"')
    expect(msg).toContain('description: 10 characters, want 120 to 160')
  })
  it('use CJK limits for CJK text', () => {
    const zh = { ...guide, keyword: '字数统计', title: '字数统计：统计字数和阅读时间', description: '粘贴文本即可即时统计字数、字符数和预计阅读时间。全部在浏览器里完成，你输入的内容不会上传，也不会保存。' }
    expect(() => parseContent(guideSchema, zh, 'g.mdx')).not.toThrow()
  })
  it('ignore a language block the site does not list and accept a missing one', () => {
    expect(() => parseContent(toolFileSchema(['en', 'es']), { ...tool, zh: { broken: true } }, 't.json')).not.toThrow()
  })
  it('reject a missing demand record and an update before the publish date', () => {
    const { demand: _, ...noDemand } = guide
    expect(message(() => parseContent(guideSchema, noDemand, 'g.mdx'))).toContain('demand:')
    expect(message(() => parseContent(legalSchema, { ...legal, updated: '2026-01-01' }, 'l.mdx'))).toContain('updated:')
  })
})
