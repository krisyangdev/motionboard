import type { ReactNode } from 'react'

/** Fold style shared by the FAQ and the recipe page: a surface card with a +/– marker. */
export const foldClass = 'group mb-3 rounded-card-sm bg-surface'
export const foldSummary =
  "flex cursor-pointer list-none select-none items-center justify-between gap-4 rounded-card-sm px-5 py-[18px] text-lg font-semibold leading-snug after:text-[22px] after:leading-none after:text-muted-foreground after:content-['+'] group-open:after:content-['–'] md:px-6 [&::-webkit-details-marker]:hidden"

/** FAQ as native <details>, so the answers are in the prerendered HTML. `items` are [question, answer]; nodes allow inline links. */
export function Faq({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <div>
      {items.map(([q, a], i) => (
        <details key={i} className={foldClass}>
          <summary className={foldSummary}>
            <span>{q}</span>
          </summary>
          <p className="m-0 px-5 pb-[18px] text-base text-muted-foreground leading-relaxed md:px-6">{a}</p>
        </details>
      ))}
    </div>
  )
}
