// JSON-driven tool pages: content/tools/<slug>.json, one lazy chunk per page.
// A tool exists in a language only when its JSON has a block for that language with a title; there is no fallback.
import type { Locale } from '../i18n'
import { existingLocales } from './exists'
import type { ToolFile, ToolText } from './schema'

/** A tool in one language. */
export type Tool = {
  slug: string
  tool: string
  published: string
  updated: string
  ogImage?: string
  related?: string[]
  name: string
  text: ToolText
  /** Every language the tool exists in. */
  locales: Locale[]
}

const files = import.meta.glob<ToolFile>('/content/tools/*.json', { import: 'default' })

/** The tool in a language, or undefined when it has no text in that language. */
export async function loadTool(slug: string, locale: Locale): Promise<Tool | undefined> {
  const locales = existingLocales(`/tools/${slug}/`)
  if (!locales.includes(locale)) return undefined
  const file = await files[`/content/tools/${slug}.json`]?.()
  const text = file?.[locale]
  if (!file || !text) return undefined
  return { slug, tool: file.tool, published: file.published, updated: file.updated, ogImage: file.ogImage, related: file.related, name: file.name?.[locale] || text.title, text, locales: [...locales] }
}
