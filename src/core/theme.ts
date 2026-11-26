// Theme: `.dark` on <html>, chosen from localStorage 'theme' or else the system preference.

/** Inline <head> script. Runs before first paint and follows the system preference until a choice is saved. */
export const THEME_SCRIPT = `(()=>{try{const d=document.documentElement,m=matchMedia('(prefers-color-scheme: dark)'),s=()=>{let t;try{t=localStorage.getItem('theme')}catch{}d.classList.toggle('dark',t==='dark'||(t!=='light'&&m.matches))};s();m.addEventListener('change',s);addEventListener('storage',s)}catch{}})()`

export function setTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Private mode or blocked storage: the choice applies to this page view only.
  }
}
