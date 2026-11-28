import { useMemo } from 'react'
import { Button } from '@/core/ui/button'
import { getHaystack } from '@/site/components/home/SearchBar'
import { TileGrid } from '@/site/components/TileGrid'
import { POSITION_ORDER, byPos, order } from '@/site/data/terms'
import type { Position } from '@/site/data/terms'
import { useStrings } from '@/site/lib/strings'

// Position colour: a 12px dot with a soft 4px ring of the same colour at 22%.
const DOT: Record<Position, string> = {
  open: 'bg-pos-open shadow-[0_0_0_4px_color-mix(in_srgb,var(--pos-open)_22%,transparent)]',
  reveal: 'bg-pos-reveal shadow-[0_0_0_4px_color-mix(in_srgb,var(--pos-reveal)_22%,transparent)]',
  feature: 'bg-pos-feature shadow-[0_0_0_4px_color-mix(in_srgb,var(--pos-feature)_22%,transparent)]',
  bridge: 'bg-pos-bridge shadow-[0_0_0_4px_color-mix(in_srgb,var(--pos-bridge)_22%,transparent)]',
  close: 'bg-pos-close shadow-[0_0_0_4px_color-mix(in_srgb,var(--pos-close)_22%,transparent)]',
}

export function Shelves({ query, onQuery }: { query: string; onQuery: (q: string) => void }) {
  const s = useStrings()
  const q = query.trim().toLowerCase()
  const searching = q !== ''
  // Until the haystack chunk has loaded, match on names.
  const hay = getHaystack()
  const found = useMemo(
    () => (searching ? order.filter((t) => (hay ? hay[t.slug] : `${t.name.en} ${t.name.zh} ${t.en} ${t.zh}`.toLowerCase()).includes(q)) : []),
    [searching, q, hay],
  )

  return (
    <section id="recipes" className="pt-10 pb-8">
      <div className="wrap">
        <h2 className="mb-6 text-[26px] leading-[1.15] md:text-[32px]">{s.hero.allEffects}</h2>
        {searching ? (
          <div aria-live="polite">
            {found.length ? (
              <TileGrid terms={found} />
            ) : (
              <div className="flex flex-wrap items-center gap-3 py-6">
                <p className="m-0 text-muted-foreground">{s.shelves.noResults(query.trim())}</p>
                <Button variant="outline" size="lg" onClick={() => onQuery('')}>
                  {s.shelves.clear}
                </Button>
              </div>
            )}
          </div>
        ) : (
          POSITION_ORDER.map((p) => {
            const list = byPos(p)
            return (
              <section key={p} className="mb-12" id={`shelf-${p}`} data-pos={p} aria-labelledby={`shelf-${p}-h`}>
                <div className="mb-4 flex items-baseline gap-3">
                  <h2 className="inline-flex items-center gap-2.5 text-2xl" id={`shelf-${p}-h`}>
                    <span className={`size-3 shrink-0 rounded-full ${DOT[p]}`} aria-hidden />
                    {s.positions[p]}
                  </h2>
                  <span className="text-[15px] text-muted-foreground tabular-nums">{list.length}</span>
                </div>
                <TileGrid terms={list} />
              </section>
            )
          })
        )}
      </div>
    </section>
  )
}
