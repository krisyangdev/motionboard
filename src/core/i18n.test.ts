import { describe, expect, it } from 'vitest'
import { SITE, SITE_URL } from '../../site.config.ts'
import { DEFAULT_LOCALE, HTML_LANG, localeMeta, LOCALES } from './i18n'
import type { Locale } from './i18n'
import { LOCALE_DATA } from './locale-data'
import { mockSite } from './test-site'

type I18n = typeof import('./i18n')

/** i18n.ts loaded against a site.config.ts with these languages (the first is the default unless `over` says otherwise). */
async function load(languages: string[], over: Parameters<typeof mockSite>[1] = {}): Promise<I18n> {
  await mockSite(languages, over)
  return import('./i18n')
}

// Languages the mocked sites use are not part of the shipped Locale type.
const L = (code: string) => code as Locale

describe('the shipped config', () => {
  it('lists languages that are in the registry, with the default among them', () => {
    expect(LOCALES).toEqual(SITE.languages)
    expect(LOCALES).toContain(DEFAULT_LOCALE)
    for (const l of LOCALES) expect(LOCALE_DATA).toHaveProperty(l)
  })
  it('keeps zh as zh-CN everywhere and en as en-US', () => {
    expect(localeMeta(L('zh'))).toMatchObject({ hreflang: 'zh-CN', og: 'zh_CN', intl: 'zh-CN', dir: 'ltr' })
    expect(localeMeta(L('en'))).toMatchObject({ hreflang: 'en', og: 'en_US', intl: 'en-US', dir: 'ltr' })
    expect(HTML_LANG.zh).toBe('zh-CN')
  })
})

describe('the registry', () => {
  it('has complete entries for every language', () => {
    for (const [code, m] of Object.entries(LOCALE_DATA)) {
      expect(m.hreflang, code).toMatch(/^[a-z]{2,3}(-[A-Z]{2})?$/)
      expect(m.og, code).toMatch(/^[a-z]{2,3}_[A-Z]{2}$/)
      expect(m.intl, code).toBeTruthy()
      expect(['ltr', 'rtl']).toContain(m.dir)
      expect(m.name, code).toBeTruthy()
    }
  })
  it('marks Arabic, Hebrew and Persian right to left and nothing else', () => {
    expect(Object.entries(LOCALE_DATA).filter(([, m]) => m.dir === 'rtl').map(([code]) => code).sort()).toEqual(['ar', 'fa', 'he'])
  })
  it('uses the region codes search engines expect for Chinese and Brazilian Portuguese', () => {
    expect(LOCALE_DATA['zh-tw'].hreflang).toBe('zh-TW')
    expect(LOCALE_DATA['pt-br'].hreflang).toBe('pt-BR')
  })
})

describe('three languages: en, zh, es', () => {
  it('derives the lists from site.config.ts', async () => {
    const i = await load(['en', 'zh', 'es'])
    expect(i.LOCALES).toEqual(['en', 'zh', 'es'])
    expect(i.DEFAULT_LOCALE).toBe('en')
    expect(i.PREFIXED_LOCALES).toEqual(['zh', 'es'])
    expect(i.isLocale('es')).toBe(true)
    expect(i.isLocale('fr')).toBe(false)
  })

  it('reads the prefix with localeOf', async () => {
    const i = await load(['en', 'zh', 'es'])
    expect(i.localeOf('/es/tools/x/')).toBe('es')
    expect(i.localeOf('/es/')).toBe('es')
    expect(i.localeOf('/es')).toBe('es')
    expect(i.localeOf('/tools/x/')).toBe('en')
    expect(i.localeOf('/en/tools/')).toBe('en')
    expect(i.localeOf('/fr/tools/')).toBe('en')
  })

  it('drops the prefix with stripLocale and does not cut a path that only starts with the code', async () => {
    const i = await load(['en', 'zh', 'es'])
    expect(i.stripLocale('/es/tools/x/')).toBe('/tools/x/')
    expect(i.stripLocale('/es/')).toBe('/')
    expect(i.stripLocale('/es')).toBe('/')
    expect(i.stripLocale('/tools/x/')).toBe('/tools/x/')
    expect(i.stripLocale('/es-tools/')).toBe('/es-tools/')
  })

  it('localizePath, pageUrl and the route param helpers', async () => {
    const i = await load(['en', 'zh', 'es'])
    expect(i.localizePath(L('en'), '/tools/x/')).toBe('/tools/x/')
    expect(i.localizePath(L('es'), '/tools/x/')).toBe('/es/tools/x/')
    expect(i.localizePath(L('es'), '/')).toBe('/es/')
    expect(i.pageUrl(L('es'), '/tools/')).toBe(`${SITE_URL}/es/tools/`)
    expect(i.localeParam(L('es'))).toBe('es')
    expect(i.localeParam(L('en'))).toBeUndefined()
    expect(i.paramLocale('es')).toBe('es')
    expect(i.paramLocale('xx')).toBe('en')
    expect(i.paramLocale(undefined)).toBe('en')
    for (const l of i.LOCALES) {
      const p = i.localizePath(l, '/guides/a/')
      expect(i.localeOf(p)).toBe(l)
      expect(i.stripLocale(p)).toBe('/guides/a/')
    }
  })

  it('takes html lang, og locale, direction and Intl tag from the registry', async () => {
    const i = await load(['en', 'zh', 'es'])
    expect(i.HTML_LANG).toEqual({ en: 'en', zh: 'zh-CN', es: 'es' })
    expect(i.OG_LOCALE).toEqual({ en: 'en_US', zh: 'zh_CN', es: 'es_ES' })
    expect(i.DIR).toEqual({ en: 'ltr', zh: 'ltr', es: 'ltr' })
    expect(i.INTL_LOCALE).toEqual({ en: 'en-US', zh: 'zh-CN', es: 'es-ES' })
    expect(i.localeMeta(L('es')).name).toBe('Español')
  })

  it('alternateUrls lists exactly the given languages plus x-default', async () => {
    const i = await load(['en', 'zh', 'es'])
    const alts = i.alternateUrls('/tools/x/', [L('en'), L('es')])
    expect(alts.map((a) => a.lang)).toEqual(['en', 'es', 'x-default'])
    expect(alts.find((a) => a.lang === 'es')?.href).toBe(`${SITE_URL}/es/tools/x/`)
    expect(alts.find((a) => a.lang === 'x-default')?.href).toBe(`${SITE_URL}/tools/x/`)
  })

  it('alternateUrls defaults to every language', async () => {
    const i = await load(['en', 'zh', 'es'])
    expect(i.alternateUrls('/tools/x/').map((a) => a.lang)).toEqual(['en', 'zh-CN', 'es', 'x-default'])
  })

  it('alternateUrls points x-default at the first language when the page has no default-language version', async () => {
    const i = await load(['en', 'zh', 'es'])
    const alts = i.alternateUrls('/tools/x/', [L('zh'), L('es')])
    expect(alts.map((a) => a.lang)).toEqual(['zh-CN', 'es', 'x-default'])
    expect(alts.at(-1)?.href).toBe(`${SITE_URL}/zh/tools/x/`)
  })

  it('formatDate prints a date in the language', async () => {
    const i = await load(['en', 'zh', 'es'])
    expect(i.formatDate(L('en'), '2026-11-26')).toBe('November 26, 2026')
    expect(i.formatDate(L('es'), '2026-11-26')).toBe('26 de noviembre de 2026')
    expect(i.formatDate(L('zh'), '2026-11-26')).toBe('2026年11月26日')
    expect(i.formatDate(L('en'), '2026-11-26', { dateStyle: 'medium' })).toBe('Nov 26, 2026')
  })

  it('formatDate reads a plain date as a UTC day', async () => {
    const i = await load(['en', 'es'])
    expect(i.formatDate(L('en'), '2026-01-01')).toBe('January 1, 2026')
    expect(i.formatDate(L('en'), '2026-01-01T23:30:00Z', { dateStyle: 'short', timeZone: 'UTC' })).toBe('1/1/26')
  })

  it('formatNumber groups digits per language and takes Intl options', async () => {
    const i = await load(['en', 'zh', 'es'])
    expect(i.formatNumber(L('en'), 1234567.5)).toBe('1,234,567.5')
    expect(i.formatNumber(L('es'), 1234567.5)).toBe('1.234.567,5')
    expect(i.formatNumber(L('en'), 5, { style: 'currency', currency: 'USD' })).toBe('$5.00')
    expect(i.formatNumber(L('en'), 3, { signDisplay: 'exceptZero' })).toBe('+3')
  })
})

describe('a right-to-left language', () => {
  it('Arabic gets dir rtl and its own tags', async () => {
    const i = await load(['en', 'ar'])
    expect(i.DIR).toEqual({ en: 'ltr', ar: 'rtl' })
    expect(i.HTML_LANG.ar).toBe('ar')
    expect(i.OG_LOCALE.ar).toBe('ar_AR')
    expect(i.localeMeta(L('ar')).name).toBe('العربية')
    expect(i.localizePath(L('ar'), '/tools/')).toBe('/ar/tools/')
  })
})

describe('a default language that is not first', () => {
  it('serves it at the root and the others under their prefix', async () => {
    const i = await load(['zh', 'en'], { defaultLang: 'en' })
    expect(i.DEFAULT_LOCALE).toBe('en')
    expect(i.PREFIXED_LOCALES).toEqual(['zh'])
    expect(i.localizePath(L('en'), '/a/')).toBe('/a/')
    expect(i.localizePath(L('zh'), '/a/')).toBe('/zh/a/')
  })
})

describe('validation of site.config.ts', () => {
  it('rejects a language that is not in the registry and says where to add it', async () => {
    await expect(load(['en', 'xx'])).rejects.toThrow('site.config.ts languages: "xx" is not in src/core/locale-data.ts; add it there (template) with hreflang/og/intl/dir/name')
  })
  it('rejects a default language that is not listed', async () => {
    await expect(load(['en', 'es'], { defaultLang: 'fr' })).rejects.toThrow('site.config.ts defaultLang: "fr" is not in languages (en, es); set it to one of them')
  })
  it('rejects a language listed twice', async () => {
    await expect(load(['en', 'es', 'es'])).rejects.toThrow('site.config.ts languages: "es" is listed more than once')
  })
  it('rejects an empty list', async () => {
    await expect(load([])).rejects.toThrow('site.config.ts languages: list at least one language')
  })
  it('rejects a home title missing for a language', async () => {
    await expect(load(['en', 'es'], { title: { en: 'Home' } })).rejects.toThrow('site.config.ts title: no text for "es"; add title.es (the home page needs a title in every language)')
  })
  it('rejects a home description missing for a language', async () => {
    await expect(load(['en', 'es'], { description: { en: 'About', es: '' } })).rejects.toThrow('site.config.ts description: no text for "es"; add description.es')
  })
  it('names the missing UI strings file of a language', async () => {
    const i = await load(['en', 'es'])
    expect(i.missingCoreMessages('ar').message).toBe('site.config.ts languages: "ar" has no UI strings; add src/core/messages/ar.ts (copy src/core/messages/en.ts and translate it)')
  })
})
