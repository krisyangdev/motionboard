import { ChevronDownIcon } from 'lucide-react'

/** Visible FAQ as native `<details>` (answers are in the HTML; no FAQPage markup). `openFirst` opens the first item. */
export function FaqList({ items, openFirst = false }: { items: readonly (readonly [string, string])[]; openFirst?: boolean }) {
  return (
    <div className="mt-2">
      {items.map(([q, a], i) => (
        <details className="group border-b last:border-b-0" key={q} open={openFirst && i === 0}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-md py-4 text-left font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {q}
            <ChevronDownIcon aria-hidden className="pointer-events-none mt-1 size-4 shrink-0 opacity-80 transition-transform duration-200 ease-in-out group-open:rotate-180" />
          </summary>
          <p className="pb-4 text-muted-foreground">{a}</p>
        </details>
      ))}
    </div>
  )
}
