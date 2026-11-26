// Locale rules, framework-free so vite.config.ts and scripts can import them.
// The default language lives at the root (/tools/x/), every other language under its prefix (/zh/tools/x/).
// Paths passed around the app are default-language paths with a leading and trailing slash.
import { SITE, SITE_URL, type Locale } from '../../site.config.ts'

export type { Locale }
export const LOCALES = SITE.languages as readonly Locale[]
export const DEFAULT_LOCALE: Locale = SITE.defaultLang
/** Languages that have a URL prefix (every one but the default). */
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE)

/** <html lang> and hreflang value. */
export const HTML_LANG: Record<Locale, string> = { en: 'en', zh: 'zh-CN' }
export const OG_LOCALE: Record<Locale, string> = { en: 'en_US', zh: 'zh_CN' }

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

/** hreflang alternates of a default-language path, including x-default. Used by seoHead and the sitemap. */
export const alternateUrls = (path: string) => [
  ...LOCALES.map((l) => ({ lang: HTML_LANG[l], href: pageUrl(l, path) })),
  { lang: 'x-default', href: pageUrl(DEFAULT_LOCALE, path) },
]
