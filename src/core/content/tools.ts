// JSON-driven tool pages: content/tools/<slug>.json, one lazy chunk per page.
// A tool exists in a language only when its JSON has a block for that language with a title; there is no fallback.
import index from 'virtual:content-index'
import type { Locale } from '../i18n'

export type PageText = {
  title: string
  /** 50-160 characters. */
  description: string
  h1: string
  lede: string
  steps?: { title: string; body: string }[]
  faq?: [question: string, answer: string][]
}

/** The JSON file: shared fields plus one text block per language. */
type ToolFile = {
  slug: string
  /** Id of a widget in src/site/tools/index.ts, or null for a text-only page. */
  tool: string | null
  /** YYYY-MM-DD */
  updated: string
  name?: Partial<Record<Locale, string>>
} & Partial<Record<Locale, PageText>>

/** A tool in one language. */
export type Tool = {
  slug: string
  tool: string | null
  updated: string
  name: string
  text: PageText
  /** Every language the tool exists in. */
  locales: Locale[]
}

const files = import.meta.glob<ToolFile>('/content/tools/*.json', { import: 'default' })

/** The tool in a language, or undefined when it has no text in that language. */
export async function loadTool(slug: string, locale: Locale): Promise<Tool | undefined> {
  const entry = index.tools.find((t) => t.slug === slug)
  if (!entry?.locales.includes(locale)) return undefined
  const file = await files[`/content/tools/${slug}.json`]?.()
  const text = file?.[locale]
  if (!file || !text) return undefined
  return { slug, tool: file.tool, updated: file.updated, name: entry.name[locale] ?? text.title, text, locales: entry.locales }
}

/** Every tool that exists in a language, with its name there, sorted by slug. */
export const toolNames = (locale: Locale): { slug: string; name: string }[] =>
  index.tools.filter((t) => t.locales.includes(locale)).map((t) => ({ slug: t.slug, name: t.name[locale] ?? t.slug }))
