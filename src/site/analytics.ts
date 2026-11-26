// Site-owned: maps a page to the `page_type` property of page_view events. Add a branch for each new kind of page.

/** `defaultLangPath` is the pathname without the locale prefix ('/tools/x/'). */
export function pageType(defaultLangPath: string): string {
  const p = defaultLangPath.startsWith('/') ? defaultLangPath : `/${defaultLangPath}`
  const path = p.endsWith('/') ? p : `${p}/`
  if (path === '/') return 'home'
  if (path === '/tools/') return 'tools_hub'
  if (path.startsWith('/tools/')) return 'tool'
  if (path === '/guides/') return 'guides_hub'
  if (path.startsWith('/guides/')) return 'guide'
  if (path === '/symbols/') return 'symbols_hub'
  if (path.startsWith('/symbols/')) return 'symbol'
  if (path === '/privacy/' || path === '/terms/') return 'legal'
  return 'other'
}
