// MDX pages: content/guides/<lang>/<slug>.mdx and content/legal/<lang>/<slug>.mdx.
import type { ComponentType } from 'react'
import index from 'virtual:content-index'
import { LOCALES, type Locale } from '../i18n'
import type { DocIndexEntry } from '../pages'
import type { DocFrontmatter, GuideFrontmatter } from './schema'

export type Collection = 'guides' | 'legal'
export type { DocFrontmatter, GuideFrontmatter }

export const isGuide = (fm: DocFrontmatter): fm is GuideFrontmatter => 'kind' in fm
export type DocComponent = ComponentType<{ components?: Record<string, ComponentType<any>> }>
export type Doc = { Component: DocComponent; frontmatter: DocFrontmatter }

type DocModule = { default: DocComponent; frontmatter: DocFrontmatter }

const modules = import.meta.glob<DocModule>('/content/{guides,legal}/*/*.mdx')

const fileOf = (collection: Collection, locale: Locale, slug: string) => `/content/${collection}/${locale}/${slug}.mdx`

/** Default-language path of a doc page: /guides/<slug>/, /privacy/. */
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

/** Docs of a collection in one language, newest first. */
export function docList(collection: Collection, locale: Locale): DocIndexEntry[] {
  return index.docs[collection][locale]
}

/** Languages a doc exists in (the languages that have its file). */
export const docLocales = (collection: Collection, slug: string): Locale[] =>
  LOCALES.filter((l) => index.docs[collection][l].some((d) => d.slug === slug))
