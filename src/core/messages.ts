// UI strings of the shell (header, footer, 404). Site pages keep theirs in src/site/messages.ts.
import { useLocation } from '@tanstack/react-router'
import { localeOf, type Locale } from './i18n'

export const coreMessages = {
  en: {
    skipLink: 'Skip to content',
    nav: 'Main',
    theme: { toggle: 'Toggle dark mode' },
    language: 'Language',
    notFound: { title: 'Page not found', body: 'This page does not exist or has moved.', back: 'Back to home' },
    footer: { privacy: 'Privacy', terms: 'Terms', contact: 'Contact' },
  },
  zh: {
    skipLink: '跳到正文',
    nav: '主导航',
    theme: { toggle: '切换深色模式' },
    language: '语言',
    notFound: { title: '页面不存在', body: '这个页面不存在，或已经搬走。', back: '回到首页' },
    footer: { privacy: '隐私政策', terms: '服务条款', contact: '联系' },
  },
} satisfies Record<Locale, unknown>

/** Each language's name in that language. */
export const languageNames: Record<Locale, string> = { en: 'English', zh: '中文' }

/**
 * Locale of the page being shown, read from the URL. The shell also renders on 404 pages, where the
 * `{-$locale}` route param is not available, so it cannot rely on useLocale().
 */
export function useShellLocale(): Locale {
  return localeOf(useLocation().pathname)
}

export const useCoreMessages = () => coreMessages[useShellLocale()]
