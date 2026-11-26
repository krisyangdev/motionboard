import { describe, expect, it } from 'vitest'
import { mockSite } from './test-site'
import type { Locale } from './i18n'

type Pages = typeof import('./pages')

async function load(languages: string[]): Promise<Pages> {
  await mockSite(languages)
  return import('./pages')
}

const L = (code: string) => code as Locale

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
      expect(p.indexable, p.path).toBe(true)
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
