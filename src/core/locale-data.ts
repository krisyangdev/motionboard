// Metadata of every language a site can use, keyed by its URL code (the entries of `languages` in site.config.ts).
// Pure data with no imports, so vite.config.ts and scripts can load it. To use a language that is not listed
// here, add it here in the template and merge the change into the sites.
export type LocaleMeta = {
  /** <html lang>, hreflang and JSON-LD inLanguage value. */
  hreflang: string
  /** Open Graph locale (og:locale). */
  og: string
  /** BCP 47 tag for Intl (dates, numbers). */
  intl: string
  /** Writing direction, set as <html dir>. */
  dir: 'ltr' | 'rtl'
  /** The language's name in itself, shown in the language switcher. */
  name: string
}

const ltr = (hreflang: string, og: string, intl: string, name: string): LocaleMeta => ({ hreflang, og, intl, dir: 'ltr', name })
const rtl = (hreflang: string, og: string, intl: string, name: string): LocaleMeta => ({ hreflang, og, intl, dir: 'rtl', name })

export const LOCALE_DATA: Record<string, LocaleMeta> = {
  en: ltr('en', 'en_US', 'en-US', 'English'),
  zh: ltr('zh-CN', 'zh_CN', 'zh-CN', '中文'),
  'zh-tw': ltr('zh-TW', 'zh_TW', 'zh-TW', '繁體中文'),
  ja: ltr('ja', 'ja_JP', 'ja-JP', '日本語'),
  ko: ltr('ko', 'ko_KR', 'ko-KR', '한국어'),
  es: ltr('es', 'es_ES', 'es-ES', 'Español'),
  fr: ltr('fr', 'fr_FR', 'fr-FR', 'Français'),
  de: ltr('de', 'de_DE', 'de-DE', 'Deutsch'),
  it: ltr('it', 'it_IT', 'it-IT', 'Italiano'),
  pt: ltr('pt', 'pt_PT', 'pt-PT', 'Português'),
  'pt-br': ltr('pt-BR', 'pt_BR', 'pt-BR', 'Português (Brasil)'),
  ru: ltr('ru', 'ru_RU', 'ru-RU', 'Русский'),
  ar: rtl('ar', 'ar_AR', 'ar', 'العربية'),
  he: rtl('he', 'he_IL', 'he-IL', 'עברית'),
  fa: rtl('fa', 'fa_IR', 'fa-IR', 'فارسی'),
  hi: ltr('hi', 'hi_IN', 'hi-IN', 'हिन्दी'),
  id: ltr('id', 'id_ID', 'id-ID', 'Bahasa Indonesia'),
  vi: ltr('vi', 'vi_VN', 'vi-VN', 'Tiếng Việt'),
  th: ltr('th', 'th_TH', 'th-TH', 'ไทย'),
  tr: ltr('tr', 'tr_TR', 'tr-TR', 'Türkçe'),
  nl: ltr('nl', 'nl_NL', 'nl-NL', 'Nederlands'),
  pl: ltr('pl', 'pl_PL', 'pl-PL', 'Polski'),
  uk: ltr('uk', 'uk_UA', 'uk-UA', 'Українська'),
  sv: ltr('sv', 'sv_SE', 'sv-SE', 'Svenska'),
}
