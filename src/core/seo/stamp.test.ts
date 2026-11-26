import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { contentFiles, hashContent, matchesSlug, readHashes, setUpdated, stamp, stampStatus } from './stamp.ts'

const json = (o: object) => `${JSON.stringify(o, null, 2)}\n`
const mdx = (updated: string, body: string, title = 'A guide') => `---\ntitle: ${title}\nupdated: "${updated}"\nkind: guide\n---\n\n${body}\n`

describe('hashContent', () => {
  it('ignores `updated`, key order and formatting of JSON', () => {
    const a = hashContent('content/tools/x.json', json({ slug: 'x', updated: '2026-01-01', en: { title: 'T', steps: [1, 2] } }))
    const b = hashContent('content/tools/x.json', JSON.stringify({ en: { steps: [1, 2], title: 'T' }, updated: '2027-05-05', slug: 'x' }))
    expect(a).toBe(b)
  })
  it('changes with any content change in JSON, including a nested one and an array order', () => {
    const base = { slug: 'x', en: { title: 'T', faq: [['q', 'a']] }, data: { list: [1, 2] } }
    const h = hashContent('x.json', json(base))
    expect(hashContent('x.json', json({ ...base, en: { ...base.en, title: 'T2' } }))).not.toBe(h)
    expect(hashContent('x.json', json({ ...base, data: { list: [2, 1] } }))).not.toBe(h)
  })
  it('ignores `updated`, line endings and trailing blank lines of MDX', () => {
    const a = hashContent('g.mdx', mdx('2026-01-01', 'Body text.'))
    expect(hashContent('g.mdx', mdx('2026-12-31', 'Body text.').replace(/\n/g, '\r\n') + '\r\n\r\n')).toBe(a)
  })
  it('changes with a body or frontmatter change in MDX', () => {
    const a = hashContent('g.mdx', mdx('2026-01-01', 'Body text.'))
    expect(hashContent('g.mdx', mdx('2026-01-01', 'Body text!'))).not.toBe(a)
    expect(hashContent('g.mdx', mdx('2026-01-01', 'Body text.', 'Another title'))).not.toBe(a)
  })
})

describe('setUpdated', () => {
  it('bumps the top-level `updated` of a JSON file and leaves a nested one alone', () => {
    const text = json({ slug: 'x', updated: '2026-01-01', data: { updated: '2020-02-02' } })
    const out = setUpdated('x.json', text, '2026-11-27')
    expect(JSON.parse(out)).toEqual({ slug: 'x', updated: '2026-11-27', data: { updated: '2020-02-02' } })
  })
  it('bumps the frontmatter line of MDX, keeping quotes, and not a line in the body', () => {
    expect(setUpdated('g.mdx', mdx('2026-01-01', 'updated: "2020-02-02"'), '2026-11-27')).toBe(mdx('2026-11-27', 'updated: "2020-02-02"'))
    expect(setUpdated('g.mdx', '---\nupdated: 2026-01-01\n---\nx', '2026-11-27')).toBe('---\nupdated: 2026-11-27\n---\nx')
  })
  it('throws, naming the file, when there is no date to bump', () => {
    expect(() => setUpdated('content/guides/en/g.mdx', '---\ntitle: x\n---\nbody', '2026-11-27')).toThrow('content/guides/en/g.mdx')
  })
})

describe('matchesSlug', () => {
  it('matches a slug in every language, a collection item, and a path', () => {
    expect(matchesSlug('content/guides/en/getting-started.mdx', 'getting-started')).toBe(true)
    expect(matchesSlug('content/guides/zh/getting-started.mdx', 'getting-started')).toBe(true)
    expect(matchesSlug('content/collections/symbols/heart-symbols.json', 'symbols/heart-symbols')).toBe(true)
    expect(matchesSlug('content/tools/word-counter.json', 'content/tools/word-counter.json')).toBe(true)
    expect(matchesSlug('content/tools/word-counter.json', 'counter')).toBe(false)
    expect(matchesSlug('content/hubs/symbols/decorative.json', 'symbols')).toBe(false)
  })
})

describe('stamp', () => {
  let root: string
  const write = (rel: string, text: string) => {
    mkdirSync(dirname(join(root, rel)), { recursive: true })
    writeFileSync(join(root, rel), text)
  }
  const read = (rel: string) => readFileSync(join(root, rel), 'utf8')
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'stamp-'))
    write('content/tools/word-counter.json', json({ slug: 'word-counter', published: '2026-01-01', updated: '2026-01-01', en: { title: 'Word counter' } }))
    write('content/guides/en/intro.mdx', mdx('2026-01-01', 'Hello.'))
    write('content/renamed.json', '{}')
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('lists the page content files only', () => {
    expect(contentFiles(root)).toEqual(['content/guides/en/intro.mdx', 'content/tools/word-counter.json'])
  })
  it('records new files without touching them, then reports nothing changed', () => {
    const r = stamp({ root, today: '2026-11-27' })
    expect(r.added).toHaveLength(2)
    expect(r.bumped).toEqual([])
    expect(read('content/guides/en/intro.mdx')).toBe(mdx('2026-01-01', 'Hello.'))
    expect(Object.keys(readHashes(root))).toHaveLength(2)
    const s = stampStatus(root)
    expect([s.changed, s.added, s.removed]).toEqual([[], [], []])
  })
  it('bumps a changed file to today and records it; unchanged files keep their date', () => {
    stamp({ root, today: '2026-11-27' })
    write('content/guides/en/intro.mdx', mdx('2026-01-01', 'Hello, world.'))
    expect(stampStatus(root).changed).toEqual(['content/guides/en/intro.mdx'])
    const r = stamp({ root, today: '2026-11-27' })
    expect(r.bumped).toEqual(['content/guides/en/intro.mdx'])
    expect(read('content/guides/en/intro.mdx')).toBe(mdx('2026-11-27', 'Hello, world.'))
    expect(JSON.parse(read('content/tools/word-counter.json')).updated).toBe('2026-01-01')
    expect(stampStatus(root).changed).toEqual([])
  })
  it('--minor records the change and keeps the date', () => {
    stamp({ root, today: '2026-11-27' })
    write('content/guides/en/intro.mdx', mdx('2026-01-01', 'Hello, wrold.'))
    const r = stamp({ root, today: '2026-11-27', minor: ['intro'] })
    expect(r.minor).toEqual(['content/guides/en/intro.mdx'])
    expect(r.bumped).toEqual([])
    expect(read('content/guides/en/intro.mdx')).toBe(mdx('2026-01-01', 'Hello, wrold.'))
    expect(stampStatus(root).changed).toEqual([])
  })
  it('--minor with an unknown slug throws and changes nothing', () => {
    stamp({ root, today: '2026-11-27' })
    write('content/guides/en/intro.mdx', mdx('2026-01-01', 'Changed.'))
    expect(() => stamp({ root, today: '2026-11-27', minor: ['nope'] })).toThrow('--minor nope')
    expect(read('content/guides/en/intro.mdx')).toBe(mdx('2026-01-01', 'Changed.'))
  })
  it('drops the record of a deleted file', () => {
    stamp({ root, today: '2026-11-27' })
    rmSync(join(root, 'content/guides/en/intro.mdx'))
    expect(stampStatus(root).removed).toEqual(['content/guides/en/intro.mdx'])
    stamp({ root, today: '2026-11-27' })
    expect(Object.keys(readHashes(root))).toEqual(['content/tools/word-counter.json'])
  })
})
