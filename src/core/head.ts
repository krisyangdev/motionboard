// Fonts and theme colours written into <head>, from SITE.fonts and SITE.theme.

export type DisplayFont = {
  /** CSS family name, e.g. 'Bricolage Grotesque'. */
  family: string
  /** File under public/fonts, e.g. 'bricolage-latin.woff2'. */
  file: string
  /** font-weight range of the variable font, e.g. '200 800'. */
  weight: string
  /** font-stretch range, e.g. '75% 100%'. */
  stretch?: string
  unicodeRange: string
  /** Local font scaled to the display font's metrics, so the swap moves no text. */
  fallback: { local: string; ascent: string; descent: string; lineGap: string; sizeAdjust: string }
}

export type FontConfig = { body: 'inter' | 'system'; display?: DisplayFont }

const SYSTEM = 'ui-sans-serif, system-ui, sans-serif'
const INTER_FILE = '/fonts/inter-latin.woff2'

const INTER_FACE =
  `@font-face{font-family:'Inter';font-style:normal;font-weight:100 900;font-display:swap;src:url(${INTER_FILE}) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}` +
  // Local Arial scaled to Inter's metrics, so the swap to Inter moves no text (no layout shift).
  "@font-face{font-family:'Inter Fallback';src:local('Arial');ascent-override:90.49%;descent-override:22.56%;line-gap-override:0%;size-adjust:107.06%}"

/** @font-face rules plus the --site-font-sans / --site-font-heading stacks that app.css uses. */
export function fontCss(fonts: FontConfig): string {
  const sans = fonts.body === 'inter' ? `'Inter', 'Inter Fallback', ${SYSTEM}` : SYSTEM
  let css = fonts.body === 'inter' ? INTER_FACE : ''
  let heading = sans
  const d = fonts.display
  if (d) {
    const f = d.fallback
    css +=
      `@font-face{font-family:'${d.family}';font-style:normal;font-weight:${d.weight};${d.stretch ? `font-stretch:${d.stretch};` : ''}font-display:swap;src:url(/fonts/${d.file}) format('woff2');unicode-range:${d.unicodeRange}}` +
      `@font-face{font-family:'${d.family} Fallback';src:local('${f.local}');ascent-override:${f.ascent};descent-override:${f.descent};line-gap-override:${f.lineGap};size-adjust:${f.sizeAdjust}}`
    heading = `'${d.family}', '${d.family} Fallback', ${sans}`
  }
  return `${css}:root{--site-font-sans:${sans};--site-font-heading:${heading}}`
}

/** One preload per self-hosted font in use: Inter when it is the body font, and the display font. */
export function fontPreloads(fonts: FontConfig) {
  const files = [...(fonts.body === 'inter' ? [INTER_FILE] : []), ...(fonts.display ? [`/fonts/${fonts.display.file}`] : [])]
  return files.map((href) => ({ rel: 'preload', href, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' as const }))
}

export type ThemeConfig = { default: 'light' | 'system'; color: { light: string; dark: string } }

/** theme-color metas. A light-default site has one light colour; a system-default site follows the system scheme. */
export function themeColorMetas(theme: ThemeConfig): { name: string; content: string; media?: string }[] {
  if (theme.default === 'light') return [{ name: 'theme-color', content: theme.color.light }]
  return [
    { name: 'theme-color', content: theme.color.light, media: '(prefers-color-scheme: light)' },
    { name: 'theme-color', content: theme.color.dark, media: '(prefers-color-scheme: dark)' },
  ]
}
