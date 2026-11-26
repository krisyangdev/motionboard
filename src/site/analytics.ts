// Site-owned: maps a page to the `page_type` property of page_view events.

/** `defaultLangPath` is the pathname without the locale prefix ('/recipes/x/'). */
export function pageType(defaultLangPath: string): string {
  const p = defaultLangPath.startsWith('/') ? defaultLangPath : `/${defaultLangPath}`
  if (p === '/') return 'home'
  if (p.startsWith('/recipes/')) return 'recipe'
  if (p.startsWith('/guides/')) return 'guide'
  if (p.startsWith('/saved')) return 'saved'
  return 'hub'
}
