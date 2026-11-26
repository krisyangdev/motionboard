import { describe, expect, it } from 'vitest'
import { aboutSchema, alternativesFileSchema, changelogFileSchema, compareSchema, galleryFileSchema, glossarySchema, guideSchema, hubFileSchema, legalSchema, parseContent, toolFileSchema, useCaseFileSchema } from './schema'

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
    const hub = { published: '2026-11-26', updated: '2026-11-26', en: hubText }
    expect(() => parseContent(hubFileSchema(['en']), hub, 'h.json')).not.toThrow()
    expect(message(() => parseContent(hubFileSchema(['en']), { ...hub, pageSize: 61 }, 'h.json'))).toContain('pageSize')
    expect(() => parseContent(hubFileSchema(['en']), { ...hub, en: { ...hubText, name: 'Tools' } }, 'h.json')).not.toThrow()
    expect(message(() => parseContent(hubFileSchema(['en']), { ...hub, en: { ...hubText, faq: Array.from({ length: 6 }, (_, i) => [`q${i}`, 'a']) } }, 'h.json'))).toContain('en.faq')
  })
  it('accept an about page without a keyword and a legal page with noindex', () => {
    const about = { title: 'About Acme', description: text.description, lede: 'Who runs the site.', published: '2026-11-26', updated: '2026-11-26' }
    expect(() => parseContent(aboutSchema, about, 'a.mdx')).not.toThrow()
    expect(() => parseContent(legalSchema, { ...legal, noindex: true }, 'l.mdx')).not.toThrow()
  })
})

describe('compare, alternatives, glossary, use-case, gallery and changelog schemas', () => {
  const dates = { published: '2026-11-26', updated: '2026-11-26' }
  const source = { label: 'Docs', url: 'https://example.com/docs', checked: '2026-11-26' }
  const product = (name: string, relation: string, url = 'https://example.com/') => ({ name, url, relation })
  const compare = {
    ...text,
    ...dates,
    keyword: 'a vs b',
    title: 'A vs B: which to pick',
    products: [product('A', 'ours', '/tools/a/'), product('B', 'third-party')],
    verdict: 'Pick A for speed.',
    table: [{ factor: 'Speed', a: 'Fast', b: 'Slower', chooseIf: 'You need speed.' }],
    sources: [source],
  }
  it('accept a comparison and require exactly two products with a relation, a verdict and sources', () => {
    expect(() => parseContent(compareSchema, compare, 'c.mdx')).not.toThrow()
    expect(message(() => parseContent(compareSchema, { ...compare, products: [product('A', 'ours')] }, 'c.mdx'))).toContain('products:')
    expect(message(() => parseContent(compareSchema, { ...compare, products: [product('A', 'ours'), product('B', 'rival')] }, 'c.mdx'))).toContain('products.1.relation')
    expect(message(() => parseContent(compareSchema, { ...compare, products: [product('A', 'ours'), product('B', 'third-party', 'http://example.com/')] }, 'c.mdx'))).toContain('products.1.url')
    const { sources: _s, ...none } = compare
    expect(message(() => parseContent(compareSchema, none, 'c.mdx'))).toContain('sources:')
    expect(message(() => parseContent(compareSchema, { ...compare, demand: { ...demand, source: 'none' } }, 'c.mdx'))).toContain('demand.source')
  })
  it('accept pricing only with a date', () => {
    expect(() => parseContent(compareSchema, { ...compare, pricing: { asOf: '2026-11-26', a: 'Free', b: 'See the vendor' } }, 'c.mdx')).not.toThrow()
    expect(message(() => parseContent(compareSchema, { ...compare, pricing: { a: 'Free', b: 'x' } }, 'c.mdx'))).toContain('pricing.asOf')
  })

  const entry = { name: 'X', url: 'https://example.com/', bestFor: 'Y', price: 'Not checked', relation: 'third-party', notes: 'Notes.' }
  const alt = { ...text, keyword: 'x alternatives', title: '5 X alternatives', product: 'X', criteria: 'How we chose.', entries: [entry], sources: [source] }
  it('accept alternatives per language and reject an entry without a price or relation', () => {
    const file = { slug: 'x', ...dates, en: alt }
    expect(() => parseContent(alternativesFileSchema(['en']), file, 'a.json')).not.toThrow()
    expect(message(() => parseContent(alternativesFileSchema(['en']), { ...file, en: { ...alt, entries: [{ ...entry, price: undefined, relation: 'friend' }] } }, 'a.json'))).toMatch(/en\.entries\.0\.price[\s\S]*en\.entries\.0\.relation/)
    expect(message(() => parseContent(alternativesFileSchema(['en']), { ...file, slug: 'X Y' }, 'a.json'))).toContain('slug:')
  })

  const glossary = { ...text, ...dates, keyword: 'dithering', title: 'What is dithering?', definition: 'Dithering is noise.', example: { text: 'x', caption: 'y' }, seeAlso: [{ name: 'T', path: '/glossary/t/' }], useIt: [{ name: 'Tool', path: '/tools/t/' }] }
  it('accept a glossary term and require site paths with a leading and trailing slash in its links', () => {
    expect(() => parseContent(glossarySchema, glossary, 'g.mdx')).not.toThrow()
    expect(message(() => parseContent(glossarySchema, { ...glossary, seeAlso: [{ name: 'T', path: 'glossary/t' }] }, 'g.mdx'))).toContain('seeAlso.0.path')
    expect(message(() => parseContent(glossarySchema, { ...glossary, useIt: [{ name: 'T', path: 'https://example.com/' }] }, 'g.mdx'))).toContain('useIt.0.path')
  })

  const titled = (n: string) => ({ title: n, body: 'Body.' })
  const useCase = {
    ...text,
    keyword: 'x for students',
    title: 'X for students',
    audience: 'Students',
    problems: [titled('a'), titled('b'), titled('c')],
    workflow: [titled('1'), titled('2'), titled('3')],
    examples: [{ name: 'T', path: '/tools/t/', caption: 'c' }],
    cta: { name: 'Go', path: '/tools/t/' },
    faq: [['q1', 'a'], ['q2', 'a'], ['q3', 'a']],
  }
  it('accept a use case with exactly three problems, 3 to 6 steps and 3 to 6 FAQ items', () => {
    const file = { slug: 'students', ...dates, en: useCase }
    expect(() => parseContent(useCaseFileSchema(['en']), file, 'u.json')).not.toThrow()
    expect(message(() => parseContent(useCaseFileSchema(['en']), { ...file, en: { ...useCase, problems: [titled('a')] } }, 'u.json'))).toContain('en.problems')
    expect(message(() => parseContent(useCaseFileSchema(['en']), { ...file, en: { ...useCase, workflow: [titled('1')] } }, 'u.json'))).toContain('en.workflow')
    expect(message(() => parseContent(useCaseFileSchema(['en']), { ...file, en: { ...useCase, faq: [['q', 'a']] } }, 'u.json'))).toContain('en.faq')
  })

  const image = { kind: 'image', src: '/a.png', width: 10, height: 10 }
  const gallery = { ...text, keyword: 'symbol card examples', title: 'Symbol card examples', intro: 'Intro.', entries: [{ media: image, alt: 'A card', title: 'T', caption: 'C' }] }
  it('accept a gallery and require alt text of at most 125 characters on every entry', () => {
    const file = { slug: 'cards', ...dates, en: gallery }
    expect(() => parseContent(galleryFileSchema(['en']), file, 'g.json')).not.toThrow()
    expect(message(() => parseContent(galleryFileSchema(['en']), { ...file, en: { ...gallery, entries: [{ ...gallery.entries[0], alt: '' }] } }, 'g.json'))).toContain('en.entries.0.alt')
    expect(message(() => parseContent(galleryFileSchema(['en']), { ...file, en: { ...gallery, entries: [{ ...gallery.entries[0], alt: 'x'.repeat(126) }] } }, 'g.json'))).toContain('en.entries.0.alt')
  })

  const log = { ...text, keyword: 'acme changelog', title: 'Acme changelog', demand: { ...demand, source: 'none' }, entries: [{ date: '2026-11-26', slug: 'b', title: 'B', items: ['x'] }, { date: '2026-11-20', slug: 'a', title: 'A', items: ['y'] }] }
  it('accept a changelog newest first with `none` demand, and reject a wrong order, a repeated id and a stale updated date', () => {
    const file = { published: '2026-11-01', updated: '2026-11-26', en: log }
    expect(() => parseContent(changelogFileSchema(['en']), file, 'c.json')).not.toThrow()
    const swapped = { ...log, entries: [...log.entries].reverse() }
    expect(message(() => parseContent(changelogFileSchema(['en']), { ...file, en: swapped }, 'c.json'))).toContain('en.entries.1.date: 2026-11-26 is newer than the entry before it')
    const twice = { ...log, entries: [log.entries[0], { ...log.entries[0] }] }
    expect(message(() => parseContent(changelogFileSchema(['en']), { ...file, en: twice }, 'c.json'))).toContain('"2026-11-26-b" is used by another entry')
    expect(message(() => parseContent(changelogFileSchema(['en']), { ...file, updated: '2026-11-25' }, 'c.json'))).toContain('updated: 2026-11-25 is before the newest en entry (2026-11-26)')
  })
})

