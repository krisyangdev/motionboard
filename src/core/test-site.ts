// Test helper: loads modules against a site.config.ts with another language list. Tests call
// `await mockSite(['en', 'es'])` and then import the module under test dynamically, so it sees the mock.
import { vi } from 'vitest'

type Site = typeof import('../../site.config.ts').SITE

/** Replaces site.config.ts for the modules imported next. `over` overrides single SITE fields (titles and descriptions default to one text per language). */
export async function mockSite(languages: string[], over: Partial<Record<keyof Site, unknown>> = {}) {
  const actual = await vi.importActual<typeof import('../../site.config.ts')>('../../site.config.ts')
  const texts = (prefix: string) => Object.fromEntries(languages.map((l) => [l, `${prefix} ${l}`]))
  const SITE = { ...actual.SITE, languages, defaultLang: languages[0], title: texts('Title'), description: texts('Description'), ...over }
  vi.resetModules()
  vi.doMock('../../site.config.ts', () => ({ ...actual, SITE }))
}
