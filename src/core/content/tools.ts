// JSON-driven tool pages: content/tools/<slug>.json, one lazy chunk per page.
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

export type ToolPage = {
  slug: string
  /** Id of a widget in src/site/tools/index.ts, or null for a text-only page. */
  tool: string | null
  /** YYYY-MM-DD */
  updated: string
  name: Record<Locale, string>
} & Record<Locale, PageText>

const pages = import.meta.glob<ToolPage>('/content/tools/*.json', { import: 'default' })


export async function loadTool(slug: string): Promise<ToolPage | undefined> {
  return pages[`/content/tools/${slug}.json`]?.()
}

/** Every tool with its localised name, sorted by slug. */
export function toolNames(): { slug: string; name: Record<Locale, string> }[] {
  return index.tools
}
