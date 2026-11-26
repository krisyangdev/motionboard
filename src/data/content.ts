// Shapes of the hand-written search copy. Two sources:
//   src/data/seo/<slug>.json    one file per recipe: the common name users search for, title, meta
//                               description, a short how-to and 2-3 FAQ items, in both locales.
//   src/data/pages/<id>.json    hub pages (films grouped by what users search) and guides.
// Text fields are plain text. Paragraph, list and table text may contain two inline forms only:
// [label](url) links and `code`. Internal links are written as English paths ("/recipes/x/") and the
// renderer prefixes /zh on Chinese pages.
import type { Locale } from '@/site.config'

export type RecipeSeoCopy = {
  /** Common name of the effect, the H1 and the name used in tiles and links ("Match Cut Transition") */
  name: string
  /** <title> without the brand, at most 55 characters */
  title: string
  /** meta description, 120-155 characters */
  description: string
  /** "How to make a <name> with Claude Code or Codex": 2-3 short paragraphs */
  howto: string[]
  /** 2-3 [question, answer] pairs, shown on the page and marked up as FAQPage */
  faq: [string, string][]
}
export type RecipeSeo = Record<Locale, RecipeSeoCopy>

export type Block =
  | { t: 'h2'; text: string }
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  /** a grid of recipe films (tiles linking to the recipe pages), by slug */
  | { t: 'films'; slugs: string[] }
  /** the home page launch film with its recipe segments */
  | { t: 'hero' }
  /** a one-line shell command with a copy button */
  | { t: 'cmd'; text: string }
  | { t: 'faq'; items: [string, string][] }
  /** cited sources, each with the date it was checked (YYYY-MM-DD) */
  | { t: 'sources'; items: { label: string; url: string; checked: string }[] }
  /** one product's films side by side: our film first, then the others, each with its facts */
  | { t: 'showcase'; product: string; url: string; story: string; films: ShowcaseFilm[] }

export type ShowcaseFilm = {
  /** tool name shown above the film */
  tool: string
  /** neutral link to the tool */
  href: string
  /** media base name on MEDIA_URL: <video>.mp4 (1080p), <video>-m.mp4 (720p, phones), <video>.jpg (poster) */
  video: string
  /** length in seconds */
  dur: number
  /** label/value rows under the film: input, wall time, renders, sound, ... */
  facts: [string, string][]
}

export type PageCopy = {
  /** <title> without the brand, at most 55 characters */
  title: string
  /** meta description, 120-155 characters */
  description: string
  h1: string
  /** one paragraph under the H1 */
  lede: string
  blocks: Block[]
}

export type ContentPage = {
  id: string
  kind: 'hub' | 'guide'
  /** English path with leading and trailing slash, e.g. "/logo-animation/" or "/guides/can-claude-make-videos/" */
  path: string
  /** last factual update, YYYY-MM-DD; shown on guides */
  updated: string
  en: PageCopy
  zh: PageCopy
}
