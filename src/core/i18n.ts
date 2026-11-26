// Locale rules, framework-free so vite.config.ts and scripts can import them.
// The default language lives at the root (/tools/x/), every other language under its prefix (/zh/tools/x/).
// Paths passed around the app are default-language paths with a leading and trailing slash.
// The language list is `SITE.languages` in site.config.ts; everything that depends on a language reads it from here.
import { SITE, SITE_URL, type Locale } from '../../site.config.ts'
import { LOCALE_DATA, type LocaleMeta } from './locale-data.ts'

export type { Locale, LocaleMeta }

type SiteLanguages = {
  languages: readonly string[]
  defaultLang: string
  title: Record<string, string>
  description: Record<string, string>
}

/** Checks the language settings of site.config.ts; every message says what to change. Runs when this module loads. */
export function validateLanguages(site: SiteLanguages): void {
  const { languages, defaultLang } = site
  if (languages.length === 0) throw new Error('site.config.ts languages: list at least one language')
  const seen = new Set<string>()
  for (const l of languages) {
    if (!(l in LOCALE_DATA)) throw new Error(`site.config.ts languages: "${l}" is not in src/core/locale-data.ts; add it there (template) with hreflang/og/intl/dir/name`)
    if (seen.has(l)) throw new Error(`site.config.ts languages: "${l}" is listed more than once`)
    seen.add(l)
  }
  if (!seen.has(defaultLang)) throw new Error(`site.config.ts defaultLang: "${defaultLang}" is not in languages (${languages.join(', ')}); set it to one of them`)
  for (const key of ['title', 'description'] as const) {
    for (const l of languages) {
      if (!site[key][l]) throw new Error(`site.config.ts ${key}: no text for "${l}"; add ${key}.${l} (the home page needs a ${key} in every language)`)
    }
  }
}

validateLanguages(SITE)

/** Error for a language that has no src/core/messages/<code>.ts. */
export const missingCoreMessages = (l: string) =>
  new Error(`site.config.ts languages: "${l}" has no UI strings; add src/core/messages/${l}.ts (copy src/core/messages/en.ts and translate it)`)

export const LOCALES = SITE.languages as readonly Locale[]
export const DEFAULT_LOCALE: Locale = SITE.defaultLang
/** Languages that have a URL prefix (every one but the default). */
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE)

/** Registry entry of a language: hreflang, og, intl, dir, name. */
export const localeMeta = (l: Locale): LocaleMeta => LOCALE_DATA[l]

const table = <T>(pick: (m: LocaleMeta) => T) => Object.fromEntries(LOCALES.map((l) => [l, pick(LOCALE_DATA[l])])) as Record<Locale, T>

/** <html lang>, hreflang and inLanguage value. */
export const HTML_LANG = table((m) => m.hreflang)
export const OG_LOCALE = table((m) => m.og)
/** <html dir>. */
export const DIR = table((m) => m.dir)
/** Tag passed to Intl. */
export const INTL_LOCALE = table((m) => m.intl)

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v)

/** URL prefix of a locale: '' for the default language, '/zh' for Chinese. */
export const localePrefix = (l: Locale) => (l === DEFAULT_LOCALE ? '' : `/${l}`)

/** Path of a page in a locale; `path` is the default-language path. */
export const localizePath = (l: Locale, path: string) => `${localePrefix(l)}${path}`

/** Absolute URL of a page in a locale. */
export const pageUrl = (l: Locale, path: string) => `${SITE_URL}${localizePath(l, path)}`

/** Locale of a URL pathname. */
export function localeOf(pathname: string): Locale {
  const first = pathname.split('/')[1]
  return isLocale(first) && first !== DEFAULT_LOCALE ? first : DEFAULT_LOCALE
}

/** Default-language path of a URL pathname (drops the locale prefix). */
export function stripLocale(pathname: string): string {
  const l = localeOf(pathname)
  return l === DEFAULT_LOCALE ? pathname : pathname.slice(l.length + 1) || '/'
}

/** Value of the optional `{-$locale}` route param: undefined for the default language. */
export const localeParam = (l: Locale): string | undefined => (l === DEFAULT_LOCALE ? undefined : l)

/** Locale from the `{-$locale}` route param; undefined means the default language. */
export const paramLocale = (p: string | undefined): Locale => (isLocale(p) ? p : DEFAULT_LOCALE)

/**
 * hreflang alternates of a default-language path in the languages the page exists in, plus x-default
 * (the default language's URL if the page has it, else the first language it has). Used by seoHead and the sitemap.
 */
export function alternateUrls(path: string, locales: readonly Locale[] = LOCALES) {
  if (locales.length === 0) return []
  const xDefault = locales.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : locales[0]
  return [...locales.map((l) => ({ lang: HTML_LANG[l], href: pageUrl(l, path) })), { lang: 'x-default', href: pageUrl(xDefault, path) }]
}

/**
 * A date as text in a language. `iso` is YYYY-MM-DD (read as a UTC day, so server and browser print the same text)
 * or a full timestamp. Default style: long date.
 */
export function formatDate(l: Locale, iso: string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'long' }): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso)
  return new Intl.DateTimeFormat(INTL_LOCALE[l], { ...(dateOnly ? { timeZone: 'UTC' } : {}), ...opts }).format(new Date(dateOnly ? `${iso}T00:00:00Z` : iso))
}

/** A number as text in a language; `opts` takes any Intl.NumberFormat option (currency, sign, ...). */
export const formatNumber = (l: Locale, n: number, opts?: Intl.NumberFormatOptions): string => new Intl.NumberFormat(INTL_LOCALE[l], opts).format(n)
