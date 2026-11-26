import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mockSite } from './test-site'
import type { Locale } from './i18n'

type Pages = typeof import('./pages')

async function load(languages: string[]): Promise<Pages> {
  await mockSite(languages)
  return import('./pages')
}

const L = (code: string) => code as Locale

// The template's demo collection. A site built from the template drops it, and these tests with it.
const demo = existsSync(new URL('../../content/collections/symbols/', import.meta.url))

describe('pageLocales', () => {
  it('lists the languages that have a title, in site order', async () => {
    const { pageLocales } = await load(['en', 'zh', 'es'])
    expect(pageLocales({ title: { en: 'Hello', es: 'Hola' } as Record<string, string> })).toEqual(['en', 'es'])
    expect(pageLocales({ title: { es: 'Hola', en: 'Hello' } as Record<string, string> })).toEqual(['en', 'es'])
  })
  it('ignores empty titles and languages the site does not list', async () => {
    const { pageLocales } = await load(['en', 'es'])
    expect(pageLocales({ title: { en: 'Hello', es: '', zh: '你好' } as Record<string, string> })).toEqual(['en'])
    expect(pageLocales({ title: {} as Record<string, string> })).toEqual([])
  })
})

describe('sitePages with a third language that has no content', () => {
  it('has the home page in every language and no other page in the new one', async () => {
    const { sitePages, pageLocales } = await load(['en', 'zh', 'es'])
    const pages = sitePages()
    const home = pages.find((p) => p.path === '/')
    expect(home && pageLocales(home)).toEqual(['en', 'zh', 'es'])
    for (const p of pages.filter((p) => p.path !== '/')) {
      expect(pageLocales(p), p.path).not.toContain('es')
      expect(pageLocales(p).length, p.path).toBeGreaterThan(0)
      // No title or description of another language stands in for a missing one.
      expect(p.title[L('es')], p.path).toBeUndefined()
      expect(p.description[L('es')], p.path).toBeUndefined()
    }
  })

  it('lists the tool pages only in the languages their JSON has a block for', async () => {
    const { sitePages, pageLocales, contentIndex } = await load(['en', 'zh', 'es'])
    // Works on any site's content: no page may claim the content-less third language.
    for (const page of sitePages().filter((p) => p.path !== '/')) expect(pageLocales(page)).not.toContain('es')
    for (const t of contentIndex().tools) expect(t.locales).not.toContain('es')
  })
})

describe('sitePages registry fields', () => {
  it('gives every page a type, a breadcrumb that starts at home and ends at itself, and a lastmod', async () => {
    const { sitePages, pageLocales } = await load(['en', 'zh'])
    for (const p of sitePages().filter((p) => p.path !== '/')) {
      expect(p.type, p.path).toBeTruthy()
      expect(p.lastmod, p.path).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      // `reasons` and `noindex` are set together, and a page with no noindex language is indexable.
      expect(p.reasons !== undefined, p.path).toBe(p.noindex !== undefined)
      if (!p.noindex) expect(p.indexable, p.path).toBe(true)
      for (const l of pageLocales(p)) {
        const trail = p.breadcrumb?.[L(l)]
        expect(trail?.[0], p.path).toMatchObject({ path: '/' })
        expect(trail?.at(-1)?.path, p.path).toBe(p.path)
      }
    }
    const home = sitePages().find((p) => p.path === '/')
    expect(home).toMatchObject({ type: 'home', indexable: true })
    expect(home?.breadcrumb).toBeUndefined()
  })
  it('carries the keyword of tool and guide pages per language', async () => {
    const { sitePages } = await load(['en', 'zh'])
    for (const p of sitePages().filter((p) => p.type === 'tool' || p.type === 'guide')) expect(p.keyword?.[L('en')], p.path).toBeTruthy()
  })
})

describe('quality gate in the registry', () => {
  it('indexableLocales leaves out the languages a page is noindex in', async () => {
    const { indexableLocales } = await load(['en', 'zh'])
    const page = { title: { en: 'A', zh: 'B' } as Record<string, string>, noindex: { zh: ['thin'] } as Record<string, string[]> }
    expect(indexableLocales(page)).toEqual(['en'])
    expect(indexableLocales({ title: page.title })).toEqual(['en', 'zh'])
  })
  it('marks a page indexable false only when every language is noindex, and prefixes the reasons with the language', async () => {
    const { sitePages } = await load(['en', 'zh'])
    for (const p of sitePages().filter((p) => p.noindex)) {
      expect(p.reasons?.length, p.path).toBeGreaterThan(0)
      for (const r of p.reasons ?? []) expect(r, p.path).toMatch(/^(en|zh): /)
    }
  })
  it('describes the pages 2 and up of a paginated hub by hub, number and languages', async () => {
    const { hubPagination, sitePages } = await load(['en', 'zh'])
    const hubs = sitePages().filter((p) => p.type === 'hub')
    for (const p of hubPagination()) {
      expect(p.n, p.path).toBeGreaterThanOrEqual(2)
      expect(p.path, p.path).toBe(`${p.hub}page/${p.n}/`)
      expect(hubs.map((h) => h.path), p.path).toContain(p.hub)
      expect(p.locales.length, p.path).toBeGreaterThan(0)
    }
  })
  it('keeps hubs out of existence in languages without a member, and has no hub for the content-less third language', async () => {
    const { sitePages, pageLocales } = await load(['en', 'zh', 'es'])
    for (const p of sitePages().filter((p) => p.type === 'hub')) expect(pageLocales(p), p.path).not.toContain('es')
  })
})

describe.runIf(demo)('collection items in the registry (template demo content: the symbols collection)', () => {
  it('lists every item page with its collection, a 4-level breadcrumb and the kind of its main media', async () => {
    const { sitePages, pageLocales } = await load(['en', 'zh'])
    const items = sitePages().filter((p) => p.type === 'item')
    expect(items.map((p) => p.path).sort()).toHaveLength(8)
    for (const p of items) {
      expect(p.collection, p.path).toBe('symbols')
      expect(p.path, p.path).toMatch(/^\/symbols\/[a-z-]+\/$/)
      for (const l of pageLocales(p)) {
        const trail = p.breadcrumb?.[L(l)] ?? []
        expect(trail.map((c) => c.path), p.path).toEqual(['/', '/symbols/', expect.stringMatching(/^\/symbols\/(decorative|practical)\/$/), p.path])
      }
    }
    expect(items.filter((p) => p.media === 'image').map((p) => p.path).sort()).toEqual(['/symbols/arrow-symbols/', '/symbols/heart-symbols/', '/symbols/star-symbols/'])
  })

  it('has exactly one deliberately thin item per language, and it is noindex with its reasons', async () => {
    const { sitePages, indexableLocales } = await load(['en', 'zh'])
    const items = sitePages().filter((p) => p.type === 'item')
    const noindex = items.filter((p) => !p.indexable || p.noindex)
    expect(noindex.map((p) => p.path)).toEqual(['/symbols/music-note-symbols/'])
    const thin = noindex[0]
    expect(Object.keys(thin.noindex ?? {})).toEqual(['en', 'zh'])
    expect(thin.noindex?.[L('en')]?.join('\n')).toMatch(/item text.*at least 80/)
    expect(thin.noindex?.[L('zh')]?.join('\n')).toMatch(/item text.*at least 150/)
    expect(thin.indexable).toBe(false)
    expect(indexableLocales(thin)).toEqual([])
    for (const p of items.filter((p) => p !== thin)) expect(indexableLocales(p), p.path).toEqual(['en', 'zh'])
  })

  it('counts only the indexable items in the hubs: the thin one is a member of no hub list', async () => {
    const { contentIndex } = await load(['en', 'zh'])
    const index = contentIndex()
    expect(index.collections.symbols.items).toHaveLength(8)
    expect(index.pages['/symbols/music-note-symbols/']).toEqual({ locales: ['en', 'zh'], noindex: ['en', 'zh'] })
    expect(index.pages['/symbols/heart-symbols/']).toEqual({ locales: ['en', 'zh'], noindex: [] })
    expect(index.hubs['symbols/decorative']).toEqual({ en: 'Decorative', zh: '装饰' })
  })

  it('gives every item 3 to 8 related items from its own language and never the thin one', async () => {
    const { contentIndex } = await load(['en', 'zh'])
    for (const i of contentIndex().collections.symbols.items) {
      for (const l of i.locales) {
        const related = i.related[L(l)] ?? []
        expect(related.length, `${i.slug} ${l}`).toBeGreaterThanOrEqual(3)
        expect(related.length, `${i.slug} ${l}`).toBeLessThanOrEqual(8)
        expect(related, `${i.slug} ${l}`).not.toContain(i.slug)
        if (i.slug !== 'music-note-symbols') expect(related, `${i.slug} ${l}`).not.toContain('music-note-symbols')
      }
    }
  })

  it('uses an explicit related list when the item has one', async () => {
    const { contentIndex } = await load(['en', 'zh'])
    const currency = contentIndex().collections.symbols.items.find((i) => i.slug === 'currency-symbols')
    expect(currency?.related[L('en')]).toEqual(['math-symbols', 'check-mark-symbols', 'arrow-symbols'])
  })

  it('creates no page in a third language the items have no text for', async () => {
    const { sitePages, pageLocales } = await load(['en', 'zh', 'es'])
    for (const p of sitePages().filter((p) => p.type === 'item')) expect(pageLocales(p), p.path).toEqual(['en', 'zh'])
  })

  it('builds the category hubs under the collection hub, with the pages they have members for', async () => {
    const { sitePages } = await load(['en', 'zh'])
    const hub = sitePages().find((p) => p.path === '/symbols/decorative/')
    expect(hub?.breadcrumb?.[L('en')]?.map((c) => c.name)).toEqual(['Home', 'Symbols', 'Decorative'])
    expect(hub?.lastmod).toBe('2026-11-26')
  })
})

describe.runIf(demo)('noindex share of a collection', () => {
  it('fails the build naming the collection and the noindex items when the share is above seo.maxNoindexShare', async () => {
    const { sitePages } = await load(['en', 'zh'])
    expect(() => sitePages()).not.toThrow()
    await mockSite(['en', 'zh'], { seo: { hubMinMembers: 1, maxNoindexShare: 0.1 } })
    const strict = await import('./pages')
    expect(() => strict.sitePages()).toThrow(/collection "symbols" \(en\): 1 of 8 items are noindex \(12\.5%\), more than seo\.maxNoindexShare 0\.1[\s\S]*\/symbols\/music-note-symbols\/: item text/)
    expect(strict.noindexShareErrors()).toHaveLength(2)
    expect(strict.sitePages({ skipShareCheck: true }).length).toBeGreaterThan(0)
  })
})

// The template's demo pages for the hand-written types beyond tools and guides. A site built from the template drops them, and these tests with it.
const demoTypes = existsSync(new URL('../../content/compare/en/word-counter-vs-google-docs.mdx', import.meta.url))

describe.runIf(demoTypes)('compare, alternatives, glossary, use-case, gallery and changelog in the registry (template demo content)', () => {
  const byPath = async (languages = ['en', 'zh']) => {
    const { sitePages } = await load(languages)
    return new Map(sitePages().map((p) => [p.path, p]))
  }

  it('lists one demo page of each type at its base URL, indexable in both languages', async () => {
    const pages = await byPath()
    const want = {
      '/compare/word-counter-vs-google-docs/': 'compare',
      '/alternatives/microsoft-word/': 'alternatives',
      '/glossary/word-count/': 'glossary',
      '/for/students/': 'use-case',
      '/gallery/symbol-cards/': 'gallery',
      '/changelog/': 'changelog',
    }
    for (const [path, type] of Object.entries(want)) {
      const p = pages.get(path)
      expect(p?.type, path).toBe(type)
      expect(p?.indexable, path).toBe(true)
      expect(p?.noindex, path).toBeUndefined()
      expect(Object.keys(p?.title ?? {}), path).toEqual(['en', 'zh'])
      expect(p?.keyword?.[L('en')], path).toBeTruthy()
      expect(p?.lastmod, path).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('has no hub or index level in the breadcrumb: compare and glossary hubs need their own hub file', async () => {
    const pages = await byPath()
    expect(pages.get('/compare/word-counter-vs-google-docs/')?.breadcrumb?.[L('en')]?.map((c) => c.path)).toEqual(['/', '/compare/word-counter-vs-google-docs/'])
    expect(pages.get('/glossary/word-count/')?.breadcrumb?.[L('zh')]?.map((c) => c.path)).toEqual(['/', '/glossary/word-count/'])
    expect(pages.get('/for/students/')?.breadcrumb?.[L('en')]?.map((c) => c.name)).toEqual(['Home', 'Word counter for students'])
    expect(pages.has('/compare/')).toBe(false)
    expect(pages.has('/glossary/')).toBe(false)
  })

  it('marks the pages that have one of our products next to third-party ones, for the disclosure line', async () => {
    const pages = await byPath()
    expect(pages.get('/compare/word-counter-vs-google-docs/')?.ours).toBe(true)
    expect(pages.get('/alternatives/microsoft-word/')?.ours).toBe(true)
    expect(pages.get('/glossary/word-count/')?.ours).toBeUndefined()
  })

  it('creates no page in a third language the content has no text for', async () => {
    const pages = await byPath(['en', 'zh', 'es'])
    for (const path of ['/compare/word-counter-vs-google-docs/', '/alternatives/microsoft-word/', '/glossary/word-count/', '/for/students/', '/gallery/symbol-cards/', '/changelog/']) {
      expect(Object.keys(pages.get(path)?.title ?? {}), path).toEqual(['en', 'zh'])
    }
  })

  it('takes the changelog lastmod from its updated date and lists its entries newest first with their anchors', async () => {
    const { changelogEntries, sitePages } = await load(['en', 'zh'])
    const entries = changelogEntries()
    expect(entries.length).toBeGreaterThanOrEqual(3)
    expect(entries.map((e) => e.date)).toEqual([...entries.map((e) => e.date)].sort().reverse())
    expect(entries[0].id).toMatch(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/)
    expect(entries.every((e) => e.page === 1)).toBe(true)
    const page = sitePages().find((p) => p.type === 'changelog')
    expect(page?.lastmod && page.lastmod >= entries[0].date).toBe(true)
  })

  it('has no paginated pages for a changelog under 50 entries', async () => {
    const { hubPagination } = await load(['en', 'zh'])
    expect(hubPagination().filter((p) => p.hub === '/changelog/')).toEqual([])
  })
})

describe('gateGroup', () => {
  const text = (w: string) => Array.from({ length: 40 }, (_, i) => `${w}${i}`).join(' ')
  const path = (slug: string) => `/x/${slug}/`
  const check = { verdict: (t: string) => ({ indexable: t !== 'bad', reasons: t !== 'bad' ? [] : ['empty'] }), text: (t: string) => t, published: (slug: string) => (slug === 'old' ? '2026-01-01' : '2026-02-01') }

  it('returns an empty record for a page that passes and the reasons for one that fails, per language', async () => {
    const { gateGroup } = await load(['en', 'zh'])
    const gate = gateGroup(
      new Map([
        ['ok', { en: text('a'), zh: 'bad' }],
        ['bad', { en: 'bad' }],
      ]),
      path,
      check,
    )
    expect(gate.get('ok')).toEqual({ zh: ['empty'] })
    expect(gate.get('bad')).toEqual({ en: ['empty'] })
  })

  it('fails the later of two near-duplicates and keeps the earlier one', async () => {
    const { gateGroup } = await load(['en'])
    const same = text('w')
    const gate = gateGroup(new Map([['new', { en: same }], ['old', { en: same }], ['other', { en: text('z') }]]), path, check)
    expect(gate.get('old')).toEqual({})
    expect(gate.get('other')).toEqual({})
    expect(gate.get('new')?.en?.[0]).toMatch(/^near-duplicate of \/x\/old\/ \(similarity 1\.00, at most 0\.6\)$/)
  })

  it('compares at the threshold it is given', async () => {
    const { gateGroup } = await load(['en'])
    const half = `${text('w').split(' ').slice(0, 30).join(' ')} ${text('q').split(' ').slice(0, 15).join(' ')}`
    const loose = gateGroup(new Map([['old', { en: text('w') }], ['new', { en: half }]]), path, check)
    const strict = gateGroup(new Map([['old', { en: text('w') }], ['new', { en: half }]]), path, { ...check, threshold: 0.3 })
    expect(loose.get('new')).toEqual({})
    expect(strict.get('new')?.en?.[0]).toMatch(/at most 0\.3\)$/)
  })
})

