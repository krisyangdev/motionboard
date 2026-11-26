import type { Locale } from '../../site.config.ts'

/** A link: `path` is a default-language path (may end in a #hash), `href` an external URL; `cta` names a tracked outbound link (data-cta). */
export type NavItem = { label: Record<Locale, string>; path?: string; href?: string; cta?: string }

/** Header links. */
export const nav: NavItem[] = [
  { label: { en: 'Tools', zh: '工具' }, path: '/tools/' },
  { label: { en: 'Guides', zh: '指南' }, path: '/guides/' },
  { label: { en: 'Symbols', zh: '符号' }, path: '/symbols/' },
]

/** Footer links, shown before Privacy, Terms and Contact (each shown only when it exists). */
export const footerNav: NavItem[] = [
  { label: { en: 'Tools', zh: '工具' }, path: '/tools/' },
  { label: { en: 'Guides', zh: '指南' }, path: '/guides/' },
  { label: { en: 'Symbols', zh: '符号' }, path: '/symbols/' },
]

/** Optional line under the copyright; empty strings show nothing. */
export const footerNote: Record<Locale, string> = { en: '', zh: '' }
