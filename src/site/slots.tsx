// Visual slots of the template's page routes (see src/core/ui/page/slots.ts). Empty = the template's look.
import type { PageSlots } from '@/core/ui/page/slots'
import { CopyTiles } from '@/site/symbols/CopyTiles'

export const slots: PageSlots = {
  // The data block of a symbols item: tiles to copy.
  itemData: ({ collection, data }) => (collection === 'symbols' ? <CopyTiles symbols={(data as { symbols: string[] }).symbols} /> : null),
}
