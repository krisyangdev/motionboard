// Slots: places in the page templates where a site puts its own visuals without forking a route.
// A site fills them in src/site/slots.tsx; an empty object keeps the template's look.
import type { ReactNode } from 'react'
import type { Locale } from '@/core/i18n'
import type { Entry } from '@/core/content/members'
import type { PageType } from '@/core/pages'

/** What a slot knows about the page it renders in: its type, its slug (none for a hub), its collection (items) and language. */
export type SlotContext = { type: Extract<PageType, 'tool' | 'guide' | 'hub' | 'about' | 'legal' | 'item'>; slug?: string; collection?: string; locale: Locale }

/** The context of an item page: the collection's `data` of the item (validated at build time by the schema the site declared). */
export type ItemSlotContext = SlotContext & { type: 'item'; slug: string; collection: string; data: unknown }

export type PageSlots = {
  /** Rendered right under the lede of a tool, guide, hub, about or item page (a hero image, a call to action). */
  afterLede?: (ctx: SlotContext) => ReactNode
  /** Rendered after the main content, before the related block and the updated line. */
  afterContent?: (ctx: SlotContext) => ReactNode
  /** Replaces the card of a hub member and of a related page. */
  card?: (entry: Entry, locale: Locale) => ReactNode
  /** The data block of an item page (copy tiles, a spec table), between the main media and the body text. */
  itemData?: (ctx: ItemSlotContext) => ReactNode
}
