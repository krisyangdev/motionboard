// MDX pages: content/guides/<lang>/<slug>.mdx, content/legal/<lang>/<slug>.mdx and content/about/<lang>/about.mdx.
import type { ComponentType } from 'react'
import type { Locale } from '../i18n'
import type { DocFrontmatter, GuideFrontmatter } from './schema'

export type Collection = 'guides' | 'legal' | 'about'
export type { DocFrontmatter, GuideFrontmatter }

export const isGuide = (fm: DocFrontmatter): fm is GuideFrontmatter => 'kind' in fm
export type DocComponent = ComponentType<{ components?: Record<string, ComponentType<any>> }>
export type Doc = { Component: DocComponent; frontmatter: DocFrontmatter }

type DocModule = { default: DocComponent; frontmatter: DocFrontmatter }

const modules = import.meta.glob<DocModule>('/content/{guides,legal,about}/*/*.mdx')

const fileOf = (collection: Collection, locale: Locale, slug: string) => `/content/${collection}/${locale}/${slug}.mdx`

/** Default-language path of a doc page: /guides/<slug>/, /privacy/, /about/. */
export const docPath = (collection: Collection, slug: string) => (collection === 'guides' ? `/guides/${slug}/` : `/${slug}/`)

// Loaded modules are kept here so a component can read them synchronously: a function cannot travel
// through loader data, and rendering a lazy component on the server would stream the article late.
// Route loaders do not run again while the browser hydrates, so the component falls back to
// `use(loadDoc(...))` there (the promise is memoised, the server HTML stays until it resolves).
const loading = new Map<string, Promise<Doc | undefined>>()
const loaded = new Map<string, Doc>()

export function loadDoc(collection: Collection, locale: Locale, slug: string): Promise<Doc | undefined> {
  const file = fileOf(collection, locale, slug)
  let promise = loading.get(file)
  if (!promise) {
    promise = (modules[file]?.() ?? Promise.resolve(undefined)).then((mod) => {
      if (!mod) return undefined
      const doc = { Component: mod.default, frontmatter: mod.frontmatter }
      loaded.set(file, doc)
      return doc
    })
    loading.set(file, promise)
  }
  return promise
}

/** Doc already loaded by loadDoc, or undefined. */
export const loadedDoc = (collection: Collection, locale: Locale, slug: string) => loaded.get(fileOf(collection, locale, slug))
