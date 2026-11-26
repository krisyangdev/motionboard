import type { Locale } from '../../site.config.ts'

type NavItem = { label: Record<Locale, string>; path: string }

/** Header links. Paths are default-language paths with leading and trailing slash. */
export const nav: NavItem[] = [
  { label: { en: 'Tools', zh: '工具' }, path: '/tools/' },
  { label: { en: 'Guides', zh: '指南' }, path: '/guides/' },
]

/** Footer links, shown before Privacy, Terms and Contact. */
export const footerNav: NavItem[] = [
  { label: { en: 'Tools', zh: '工具' }, path: '/tools/' },
  { label: { en: 'Guides', zh: '指南' }, path: '/guides/' },
]
