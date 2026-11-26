import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'

/** FAQ as native <details>, so the answers are in the prerendered HTML. `items` are [question, answer]; nodes allow inline links. */
export function Faq({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <div className="border-b">
      {items.map(([q, a], i) => (
        <details key={i} className="group border-t">
          <summary className="flex min-h-14 cursor-pointer list-none select-none items-center justify-between gap-4 py-2.5 font-semibold text-[0.9375rem] leading-snug tracking-tight hover:text-foreground sm:text-base [&::-webkit-details-marker]:hidden">
            <span>{q}</span>
            <Plus aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45" />
          </summary>
          <p className="mb-5 max-w-[64ch] text-[0.9375rem] text-muted-foreground leading-relaxed">{a}</p>
        </details>
      ))}
    </div>
  )
}
