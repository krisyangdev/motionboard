// MDX pages: content/guides/<lang>/<slug>.mdx, content/legal/<lang>/<slug>.mdx, content/about/<lang>/about.mdx,
// content/compare/<lang>/<a>-vs-<b>.mdx and content/glossary/<lang>/<slug>.mdx.
import type { ComponentType } from 'react'
import type { Locale } from '../i18n'
import { typedPath } from './hubs'
import type { AboutFrontmatter, CompareFrontmatter, DocFrontmatter, GlossaryFrontmatter, GuideFrontmatter, LegalFrontmatter } from './schema'

/** The MDX pages DocPage renders. */
export type DocCollection = 'guides' | 'legal' | 'about'
export type Collection = DocCollection | 'compare' | 'glossary'
export type { DocFrontmatter, GuideFrontmatter }

type FrontmatterOf = { guides: GuideFrontmatter; legal: LegalFrontmatter; about: AboutFrontmatter; compare: CompareFrontmatter; glossary: GlossaryFrontmatter }

export const isGuide = (fm: DocFrontmatter): fm is GuideFrontmatter => 'kind' in fm
export type DocComponent = ComponentType<{ components?: Record<string, ComponentType<any>> }>
export type Doc<C extends Collection = DocCollection> = { Component: DocComponent; frontmatter: FrontmatterOf[C] }

type DocModule = { default: DocComponent; frontmatter: FrontmatterOf[Collection] }

const modules = import.meta.glob<DocModule>('/content/{guides,legal,about,compare,glossary}/*/*.mdx')

const fileOf = (collection: Collection, locale: Locale, slug: string) => `/content/${collection}/${locale}/${slug}.mdx`

/** Default-language path of a doc page: /guides/<slug>/, /compare/<slug>/, /glossary/<slug>/, /privacy/, /about/. */
export const docPath = (collection: Collection, slug: string) =>
  collection === 'guides' ? `/guides/${slug}/` : collection === 'compare' || collection === 'glossary' ? typedPath(collection, slug) : `/${slug}/`

// Loaded modules are kept here so a component can read them synchronously: a function cannot travel
// through loader data, and rendering a lazy component on the server would stream the article late.
// Route loaders do not run again while the browser hydrates, so the component falls back to
// `use(loadDoc(...))` there (the promise is memoised, the server HTML stays until it resolves).
const loading = new Map<string, Promise<Doc<Collection> | undefined>>()
const loaded = new Map<string, Doc<Collection>>()

export function loadDoc<C extends Collection>(collection: C, locale: Locale, slug: string): Promise<Doc<C> | undefined> {
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
  return promise as Promise<Doc<C> | undefined>
}

/** Doc already loaded by loadDoc, or undefined. */
export const loadedDoc = <C extends Collection>(collection: C, locale: Locale, slug: string) => loaded.get(fileOf(collection, locale, slug)) as Doc<C> | undefined
