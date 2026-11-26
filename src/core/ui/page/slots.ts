// Slots: places in the page templates where a site puts its own visuals without forking a route.
// A site fills them in src/site/slots.tsx; an empty object keeps the template's look.
import type { ReactNode } from 'react'
import type { Locale } from '@/core/i18n'
import type { Entry } from '@/core/content/members'
import type { PageType } from '@/core/pages'

/** What a slot knows about the page it renders in: its type, its slug (none for a hub) and language. */
export type SlotContext = { type: Extract<PageType, 'tool' | 'guide' | 'hub' | 'about' | 'legal'>; slug?: string; locale: Locale }

export type PageSlots = {
  /** Rendered right under the lede of a tool, guide, hub or about page (a hero image, a call to action). */
  afterLede?: (ctx: SlotContext) => ReactNode
  /** Rendered after the main content, before the related block and the updated line. */
  afterContent?: (ctx: SlotContext) => ReactNode
  /** Replaces the card of a hub member and of a related page. */
  card?: (entry: Entry, locale: Locale) => ReactNode
}
