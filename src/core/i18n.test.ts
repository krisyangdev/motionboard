import { describe, expect, it } from 'vitest'
import { SITE_URL } from '../../site.config.ts'
import { alternateUrls, DEFAULT_LOCALE, HTML_LANG, localeOf, localeParam, LOCALES, localizePath, pageUrl, paramLocale, PREFIXED_LOCALES, stripLocale } from './i18n'

// The template ships two languages; these tests need one non-default language.
const other = PREFIXED_LOCALES[0]

describe('localeOf', () => {
  it('reads the prefix', () => {
    expect(localeOf(`/${other}/tools/x/`)).toBe(other)
    expect(localeOf(`/${other}/`)).toBe(other)
  })
  it('falls back to the default language', () => {
    expect(localeOf('/')).toBe(DEFAULT_LOCALE)
    expect(localeOf('/tools/x/')).toBe(DEFAULT_LOCALE)
    expect(localeOf('/unknown/tools/')).toBe(DEFAULT_LOCALE)
  })
  it('does not treat the default language as a prefix', () => {
    expect(localeOf(`/${DEFAULT_LOCALE}/tools/`)).toBe(DEFAULT_LOCALE)
  })
})

describe('stripLocale', () => {
  it('drops the prefix', () => {
    expect(stripLocale(`/${other}/tools/x/`)).toBe('/tools/x/')
    expect(stripLocale(`/${other}/`)).toBe('/')
    expect(stripLocale(`/${other}`)).toBe('/')
  })
  it('leaves default-language paths alone', () => {
    expect(stripLocale('/tools/x/')).toBe('/tools/x/')
    expect(stripLocale('/')).toBe('/')
  })
  it('does not cut a path that only starts with the language code', () => {
    expect(stripLocale(`/${other}-tools/`)).toBe(`/${other}-tools/`)
  })
})

describe('localizePath', () => {
  it('has no prefix for the default language', () => {
    expect(localizePath(DEFAULT_LOCALE, '/tools/x/')).toBe('/tools/x/')
    expect(localizePath(DEFAULT_LOCALE, '/')).toBe('/')
  })
  it('prefixes other languages', () => {
    expect(localizePath(other, '/tools/x/')).toBe(`/${other}/tools/x/`)
    expect(localizePath(other, '/')).toBe(`/${other}/`)
  })
  it('round-trips with stripLocale and localeOf', () => {
    for (const l of LOCALES) {
      const p = localizePath(l, '/guides/a/')
      expect(localeOf(p)).toBe(l)
      expect(stripLocale(p)).toBe('/guides/a/')
    }
  })
})

describe('pageUrl', () => {
  it('is absolute on the site origin', () => {
    expect(pageUrl(DEFAULT_LOCALE, '/tools/')).toBe(`${SITE_URL}/tools/`)
    expect(pageUrl(other, '/tools/')).toBe(`${SITE_URL}/${other}/tools/`)
  })
})

describe('alternateUrls', () => {
  const alts = alternateUrls('/tools/x/')
  it('has one entry per language plus x-default', () => {
    expect(alts).toHaveLength(LOCALES.length + 1)
    expect(alts.map((a) => a.lang).sort()).toEqual([...LOCALES.map((l) => HTML_LANG[l]), 'x-default'].sort())
  })
  it('points x-default at the default language', () => {
    expect(alts.find((a) => a.lang === 'x-default')?.href).toBe(pageUrl(DEFAULT_LOCALE, '/tools/x/'))
  })
  it('uses the html lang value and the localized URL for each language', () => {
    expect(alts.find((a) => a.lang === HTML_LANG[other])?.href).toBe(pageUrl(other, '/tools/x/'))
  })
})

describe('route param helpers', () => {
  it('localeParam is undefined for the default language', () => {
    expect(localeParam(DEFAULT_LOCALE)).toBeUndefined()
    expect(localeParam(other)).toBe(other)
  })
  it('paramLocale maps undefined and unknown values to the default language', () => {
    expect(paramLocale(undefined)).toBe(DEFAULT_LOCALE)
    expect(paramLocale('xx')).toBe(DEFAULT_LOCALE)
    expect(paramLocale(other)).toBe(other)
  })
})
