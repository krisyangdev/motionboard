import { describe, expect, it } from 'vitest'
import { aboutSchema, guideSchema, hubFileSchema, legalSchema, parseContent, toolFileSchema } from './schema'

const demand = { source: 'serp-check', note: 'Page 1 shows tools of the same kind.', checked: '2026-11-26' }
const text = {
  keyword: 'word counter',
  demand,
  title: 'Word Counter: count words and characters',
  description: 'Paste your text to count words, characters and reading time instantly. Runs in your browser, so nothing you type is uploaded or stored.',
  lede: 'Paste text to see the counts.',
}
const tool = { slug: 'word-counter', tool: 'word-counter', published: '2026-11-26', updated: '2026-11-26', en: text }
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
  it('require a tool id: a page without a working tool is a guide', () => {
    expect(message(() => parseContent(toolFileSchema(['en']), { ...tool, tool: null }, 't.json'))).toContain('tool:')
  })
  it('accept tool examples, limits and at most three sections', () => {
    const section = { h2: 'When to use it', body: 'Use it for limits.' }
    const full = { ...text, examples: [{ input: 'a b', output: '2 words', caption: 'Two words.' }], limits: 'Plain text only.', sections: [section] }
    expect(() => parseContent(toolFileSchema(['en']), { ...tool, en: full }, 't.json')).not.toThrow()
    expect(message(() => parseContent(toolFileSchema(['en']), { ...tool, en: { ...full, sections: [section, section, section, section] } }, 't.json'))).toContain('en.sections')
  })
  it('accept a hub with `none` demand and check its intro, page size and FAQ length', () => {
    const hubText = { ...text, keyword: 'free online tools', title: 'Free online tools for text', demand: { ...demand, source: 'none' }, intro: 'What is in the set.' }
    const hub = { collection: 'tools', published: '2026-11-26', updated: '2026-11-26', en: hubText }
    expect(() => parseContent(hubFileSchema(['en']), hub, 'h.json')).not.toThrow()
    expect(message(() => parseContent(hubFileSchema(['en']), { ...hub, pageSize: 61 }, 'h.json'))).toContain('pageSize')
    expect(message(() => parseContent(hubFileSchema(['en']), { ...hub, collection: 'items' }, 'h.json'))).toContain('collection')
    expect(message(() => parseContent(hubFileSchema(['en']), { ...hub, en: { ...hubText, faq: Array.from({ length: 6 }, (_, i) => [`q${i}`, 'a']) } }, 'h.json'))).toContain('en.faq')
  })
  it('accept an about page without a keyword and a legal page with noindex', () => {
    const about = { title: 'About Acme', description: text.description, lede: 'Who runs the site.', published: '2026-11-26', updated: '2026-11-26' }
    expect(() => parseContent(aboutSchema, about, 'a.mdx')).not.toThrow()
    expect(() => parseContent(legalSchema, { ...legal, noindex: true }, 'l.mdx')).not.toThrow()
  })
})
