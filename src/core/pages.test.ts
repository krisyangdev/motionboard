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
    expect(pageLocales({ title: { en: 'Hello', es: 'Hola' } })).toEqual(['en', 'es'])
    expect(pageLocales({ title: { es: 'Hola', en: 'Hello' } })).toEqual(['en', 'es'])
  })
  it('ignores empty titles and languages the site does not list', async () => {
    const { pageLocales } = await load(['en', 'es'])
    expect(pageLocales({ title: { en: 'Hello', es: '', zh: '你好' } })).toEqual(['en'])
    expect(pageLocales({ title: {} })).toEqual([])
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
    const tool = sitePages().find((p) => p.path.startsWith('/tools/') && p.path !== '/tools/')
    expect(tool && pageLocales(tool)).toEqual(['en', 'zh'])
    for (const t of contentIndex().tools) expect(t.locales).not.toContain('es')
  })
})
