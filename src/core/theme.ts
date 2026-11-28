// Theme: `.dark` on <html>, chosen from localStorage 'theme', else from SITE.theme.default
// ('system' follows the system preference, 'light' stays light until the visitor picks dark).
import { SITE } from '../../site.config.ts'

const SYSTEM_SCRIPT = `(()=>{try{const d=document.documentElement,m=matchMedia('(prefers-color-scheme: dark)'),s=()=>{let t;try{t=localStorage.getItem('theme')}catch{}d.classList.toggle('dark',t==='dark'||(t!=='light'&&m.matches))};s();m.addEventListener('change',s);addEventListener('storage',s)}catch{}})()`
const LIGHT_SCRIPT = `(()=>{try{const d=document.documentElement,s=()=>{let t;try{t=localStorage.getItem('theme')}catch{}d.classList.toggle('dark',t==='dark')};s();addEventListener('storage',s)}catch{}})()`

/** Inline <head> script. Runs before first paint. */
export function themeScript(defaultTheme: 'light' | 'system'): string {
  return defaultTheme === 'light' ? LIGHT_SCRIPT : SYSTEM_SCRIPT
}

export const THEME_SCRIPT = themeScript(SITE.theme.default)

export function setTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Private mode or blocked storage: the choice applies to this page view only.
  }
}
