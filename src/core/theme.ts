// Theme: `.dark` on <html>, chosen from localStorage 'theme' ('light' | 'dark' | 'system'), else from SITE.theme.default
// ('system' follows the system preference, 'light' stays light until the visitor picks dark or system).
import { SITE } from '../../site.config.ts'

/** Inline <head> script. Runs before first paint. A stored 'light' | 'dark' | 'system' wins; with nothing stored the
 * site default applies. 'system' follows the system preference, also when it changes while the page is open. */
export function themeScript(defaultTheme: 'light' | 'system'): string {
  return `(()=>{try{const d=document.documentElement,m=matchMedia('(prefers-color-scheme: dark)'),s=()=>{let t;try{t=localStorage.getItem('theme')}catch{}if(t!=='light'&&t!=='dark'&&t!=='system')t='${defaultTheme}';d.classList.toggle('dark',t==='dark'||(t==='system'&&m.matches))};s();m.addEventListener('change',s);addEventListener('storage',s)}catch{}})()`
}

export const THEME_SCRIPT = themeScript(SITE.theme.default)

export type ThemeChoice = 'light' | 'dark' | 'system'

/** Stores the visitor's choice and applies it now; 'system' follows the system preference. */
export function setTheme(theme: ThemeChoice) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Private mode or blocked storage: the choice applies to this page view only.
  }
}
