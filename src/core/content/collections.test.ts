import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { defineCollection, itemLocales, RESERVED_SEGMENTS, validateCollections } from './collections'
import { itemFileSchema, parseContent } from './schema'

const demand = { source: 'serp-check', note: 'Page 1 shows pages of the same kind.', checked: '2026-11-26' }
const block = (name: string, keyword: string) => ({
  keyword,
  demand,
  name,
  title: `${name}: copy and paste`,
  description: 'Copy and paste these symbols with one tap. Each one comes with a note on where it works and where it does not display, so you can pick well.',
  lede: 'Tap a symbol to copy it.',
  body: [{ h2: 'Using them', body: 'Paste them anywhere text is allowed.' }],
  alt: 'Symbols in a row',
})
const data = z.strictObject({ symbols: z.array(z.string()) })
const file = { slug: 'heart-symbols', category: ['decorative'], published: '2026-11-26', updated: '2026-11-26', data: { symbols: ['♥'] }, en: block('Heart symbols', 'heart symbols') }
const schema = itemFileSchema(['en', 'zh'], ['decorative', 'practical'], data)
const message = (fn: () => unknown) => {
  try {
    fn()
  } catch (e) {
    return (e as Error).message
  }
  return ''
}

describe('itemLocales', () => {
  it('lists the languages whose block has a name, a keyword and a body', () => {
    expect(itemLocales({ en: block('A', 'a'), zh: block('B', 'b') }, ['en', 'zh'])).toEqual(['en', 'zh'])
  })
  it('leaves out a language with no block or with an incomplete one: that language has no page', () => {
    const { body: _b, ...noBody } = block('B', 'b')
    const { name: _n, ...noName } = block('C', 'c')
    expect(itemLocales({ en: block('A', 'a'), zh: noBody, es: noName }, ['en', 'zh', 'es', 'fr'])).toEqual(['en'])
    expect(itemLocales({ en: { ...block('A', 'a'), body: [] }, zh: { ...block('B', 'b'), keyword: ' ' } }, ['en', 'zh'])).toEqual([])
  })
})

describe('item schema', () => {
  it('accepts a complete item with a data block', () => {
    expect(() => parseContent(schema, file, 'content/collections/symbols/heart-symbols.json')).not.toThrow()
  })
  it('validates the data with the schema the site declared', () => {
    const msg = message(() => parseContent(schema, { ...file, data: { symbols: [1] } }, 'content/collections/symbols/heart-symbols.json'))
    expect(msg).toContain('content/collections/symbols/heart-symbols.json')
    expect(msg).toContain('data.symbols.0')
  })
  it('names an unknown category and lists the declared ones', () => {
    expect(message(() => parseContent(schema, { ...file, category: ['nope'] }, 'f.json'))).toContain('category.0: "nope" is not a category of this collection (decorative, practical)')
  })
  it('requires alt text in every language block when the item has media', () => {
    const media = { kind: 'image', src: '/symbols/h.svg', width: 640, height: 360 }
    const { alt: _a, ...noAlt } = file.en
    expect(message(() => parseContent(schema, { ...file, media, en: noAlt }, 'f.json'))).toContain('en.alt: required when the item has media')
    expect(() => parseContent(schema, { ...file, media }, 'f.json')).not.toThrow()
  })
  it('requires poster, size and duration of a video, and a size for an image', () => {
    const msg = message(() => parseContent(schema, { ...file, media: { kind: 'video', src: '/a.mp4' } }, 'f.json'))
    for (const field of ['media.poster', 'media.width', 'media.height', 'media.duration']) expect(msg).toContain(field)
    expect(message(() => parseContent(schema, { ...file, media: { kind: 'image', src: '/a.svg' } }, 'f.json'))).toContain('media.width')
  })
  it('caps the FAQ at 4 and needs the keyword in the title and in the name (the h1)', () => {
    const faq = Array.from({ length: 5 }, (_, i) => [`q${i}?`, 'a'])
    expect(message(() => parseContent(schema, { ...file, en: { ...file.en, faq } }, 'f.json'))).toContain('en.faq')
    expect(message(() => parseContent(schema, { ...file, en: { ...file.en, name: 'Hearts' } }, 'f.json'))).toContain('en.name: is the h1 and must contain the keyword "heart symbols"')
    expect(() => parseContent(schema, { ...file, en: { ...file.en, name: 'Hearts', h1: 'Heart symbols to copy' } }, 'f.json')).not.toThrow()
  })
  it('rejects demand `none` and a title without the keyword', () => {
    const msg = message(() => parseContent(schema, { ...file, en: { ...file.en, demand: { ...demand, source: 'none' }, title: 'Hearts to copy and paste' } }, 'f.json'))
    expect(msg).toContain('en.demand.source')
    expect(msg).toContain('en.title: must contain the keyword')
  })
})

describe('validateCollections', () => {
  const c = (over: object = {}) => defineCollection({ id: 'symbols', categories: ['a', 'b'], data, ...over })
  it('accepts a collection and gives the callbacks the typed data', () => {
    const typed = defineCollection({ id: 'symbols', categories: ['a'], data, dataEntries: (d) => d.symbols.length })
    expect(typed.dataEntries?.({ symbols: ['x', 'y'] })).toBe(2)
    expect(() => validateCollections([c()])).not.toThrow()
  })
  it('rejects ids and categories the template already uses, and malformed ones', () => {
    for (const id of RESERVED_SEGMENTS) expect(message(() => validateCollections([c({ id })])), id).toContain('URL segment')
    expect(message(() => validateCollections([c({ categories: ['page'] })]))).toContain('category "page"')
    expect(message(() => validateCollections([c({ id: 'Symbols' })]))).toContain('ASCII kebab-case')
  })
  it('rejects a collection without categories, a repeated category and a repeated id', () => {
    expect(message(() => validateCollections([c({ categories: [] })]))).toContain('at least one category')
    expect(message(() => validateCollections([c({ categories: ['a', 'a'] })]))).toContain('listed twice')
    expect(message(() => validateCollections([c(), c()]))).toContain('declared twice')
  })
})
