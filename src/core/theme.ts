// Theme: `.dark` on <html>. The visitor's choice ('light' | 'dark' | 'system') is a `theme` cookie on SITE.domain, so
// every host of the site (www, app, ...) shows the same theme; with no choice SITE.theme.default applies
// ('system' follows the system preference, 'light' stays light until the visitor picks dark or system).
import { SITE } from '../../site.config.ts'

export type ThemeChoice = 'light' | 'dark' | 'system'

const COOKIE = /(?:^|;\s*)theme=(light|dark|system)(?:;|$)/

/** Inline <head> script. Runs before first paint, and again when the system preference changes. */
export function themeScript(defaultTheme: 'light' | 'system'): string {
  return `(()=>{try{const d=document.documentElement,m=matchMedia('(prefers-color-scheme: dark)'),s=()=>{const t=(document.cookie.match(${COOKIE.toString()})||[])[1]||'${defaultTheme}';d.classList.toggle('dark',t==='dark'||(t==='system'&&m.matches))};s();m.addEventListener('change',s)}catch{}})()`
}

export const THEME_SCRIPT = themeScript(SITE.theme.default)

/** The stored choice, or null when the visitor has not picked one. Browser only. */
export function storedTheme(): ThemeChoice | null {
  return (document.cookie.match(COOKIE)?.[1] as ThemeChoice | undefined) ?? null
}

/** Stores the visitor's choice for every host of the site and applies it now. */
export function setTheme(theme: ThemeChoice) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  const host = location.hostname
  const domain = host === SITE.domain || host.endsWith(`.${SITE.domain}`) ? `; Domain=${SITE.domain}` : ''
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${domain}${secure}`
}
