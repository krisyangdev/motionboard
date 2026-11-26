import type { Locale } from '../../site.config.ts'
import { GITHUB_URL, LICENSE_URL } from './config.ts'
import { PAGES } from './data/page-index.ts'

/** A link: `path` is a default-language path (may end in a #hash), `href` an external URL; `cta` names a tracked outbound link (data-cta). */
export type NavItem = { label: Record<Locale, string>; path?: string; href?: string; cta?: string }

/** Header links. */
export const nav: NavItem[] = [
  { label: { en: 'Recipes', zh: '配方' }, path: '/#recipes' },
  { label: { en: 'Saved', zh: '收藏' }, path: '/saved/' },
  { label: { en: 'GitHub', zh: 'GitHub' }, href: GITHUB_URL, cta: 'github' },
]

/** Footer links: the hub and guide pages, then the license. */
export const footerNav: NavItem[] = [
  ...PAGES.map((p) => ({ label: p.label, path: p.path })),
  { label: { en: 'License', zh: '许可证' }, href: LICENSE_URL, cta: 'github' },
]

/** One line under the copyright. */
export const footerNote: Record<Locale, string> = {
  en: 'Recreations rendered with HyperFrames · Original films © their owners. Anonymous usage stats via PostHog and Cloudflare Web Analytics: no cookies, no stored IDs, no IP, no recordings.',
  zh: '复刻由 HyperFrames 渲染 · 原片版权归各自所有者。用 PostHog 和 Cloudflare Web Analytics 匿名统计访问：不用 Cookie，不存 ID，不记 IP，不录屏。',
}
