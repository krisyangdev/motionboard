import { describe, expect, it } from 'vitest'
import { fontCss, fontPreloads, themeColorMetas, type DisplayFont } from './head'
import { themeScript } from './theme'

const display: DisplayFont = {
  family: 'Display',
  file: 'display-latin.woff2',
  weight: '200 800',
  stretch: '75% 100%',
  unicodeRange: 'U+0000-00FF',
  fallback: { local: 'Arial', ascent: '95%', descent: '25%', lineGap: '0%', sizeAdjust: '102%' },
}

describe('fonts', () => {
  it('inter body: Inter faces, one preload, heading = body', () => {
    const css = fontCss({ body: 'inter' })
    expect(css).toContain("font-family:'Inter'")
    expect(css).toContain("--site-font-heading:'Inter', 'Inter Fallback'")
    expect(fontPreloads({ body: 'inter' }).map((l) => l.href)).toEqual(['/fonts/inter-latin.woff2'])
  })

  it('system body with display font: no Inter, one preload for the display font', () => {
    const css = fontCss({ body: 'system', display })
    expect(css).not.toContain('Inter')
    expect(css).toContain('font-stretch:75% 100%')
    expect(css).toContain("src:local('Arial');ascent-override:95%")
    expect(css).toContain('--site-font-sans:ui-sans-serif, system-ui, sans-serif')
    expect(css).toContain("--site-font-heading:'Display', 'Display Fallback', ui-sans-serif")
    expect(fontPreloads({ body: 'system', display }).map((l) => l.href)).toEqual(['/fonts/display-latin.woff2'])
  })

  it('system body alone loads no font', () => {
    expect(fontPreloads({ body: 'system' })).toEqual([])
    expect(fontCss({ body: 'system' })).not.toContain('@font-face')
  })
})

describe('theme', () => {
  const color = { light: '#fafaf7', dark: '#111111' }
  it('light default: one theme-color', () => {
    expect(themeColorMetas({ default: 'light', color })).toEqual([{ name: 'theme-color', content: '#fafaf7' }])
  })
  it('system default: theme-color per scheme', () => {
    expect(themeColorMetas({ default: 'system', color }).map((m) => m.media)).toEqual([
      '(prefers-color-scheme: light)',
      '(prefers-color-scheme: dark)',
    ])
  })

  /** Runs the head script against a stub page and says whether it set `.dark`. */
  function runScript(defaultTheme: 'light' | 'system', stored: string | null, systemDark: boolean) {
    let dark = false
    const document = {
      cookie: stored === null ? 'other=1' : `other=1; theme=${stored}`,
      documentElement: { classList: { toggle: (_: string, on: boolean) => (dark = on) } },
    }
    const matchMedia = () => ({ matches: systemDark, addEventListener: () => {} })
    new Function('document', 'matchMedia', themeScript(defaultTheme))(document, matchMedia)
    return dark
  }

  it('nothing stored: the site default decides', () => {
    expect(runScript('light', null, true)).toBe(false)
    expect(runScript('system', null, true)).toBe(true)
    expect(runScript('system', null, false)).toBe(false)
  })
  it('a stored choice wins over the default and the system preference', () => {
    expect(runScript('light', 'dark', false)).toBe(true)
    expect(runScript('system', 'light', true)).toBe(false)
    expect(runScript('light', 'system', true)).toBe(true)
    expect(runScript('light', 'system', false)).toBe(false)
  })
  it('an unknown stored value falls back to the default', () => {
    expect(runScript('light', 'blue', true)).toBe(false)
  })
})
