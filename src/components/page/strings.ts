// UI strings of the hub and guide pages. Kept here because src/i18n.ts is shared with the recipe pages.
import type { Locale } from '@/site.config'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "16 Nov 2026" in English, the ISO date in Chinese. Not Intl: its month abbreviations differ between engines. */
export const formatDate = (iso: string, locale: Locale) => {
  if (locale === 'zh') return iso
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

export const PAGE_STRINGS = {
  en: {
    effects: 'Effects',
    guides: 'Guides',
    updated: (iso: string) => `Updated ${formatDate(iso, 'en')}`,
    sources: 'Sources',
    checked: (iso: string) => `checked ${formatDate(iso, 'en')}`,
  },
  zh: {
    effects: '效果',
    guides: '指南',
    updated: (iso: string) => `更新于 ${formatDate(iso, 'zh')}`,
    sources: '来源',
    checked: (iso: string) => `查证于 ${formatDate(iso, 'zh')}`,
  },
}
