import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { cn } from '@/core/lib/utils'
import { TileGrid } from '@/site/components/TileGrid'
import { POSITION_ORDER, byPos } from '@/site/data/terms'
import type { Position } from '@/site/data/terms'
import { useStrings } from '@/site/lib/strings'

const shelfId = (p: Position) => `shelf-${p}`
const count = 'font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wide'

export function Shelves() {
  const [active, setActive] = useState<Position | null>(null)
  const s = useStrings()

  // The shelf crossing a band just under the sticky bar is the one in view.
  useEffect(() => {
    const inBand = new Set<Position>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const p = (e.target as HTMLElement).dataset.pos as Position
          if (e.isIntersecting) inBand.add(p)
          else inBand.delete(p)
        }
        setActive(POSITION_ORDER.find((p) => inBand.has(p)) ?? null)
      },
      { rootMargin: '-100px 0px -60% 0px' },
    )
    for (const p of POSITION_ORDER) {
      const el = document.getElementById(shelfId(p))
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])

  const go = (p: Position) => (e: MouseEvent) => {
    e.preventDefault()
    setActive(p)
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(shelfId(p))?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }

  return (
    <section id="recipes" className="scroll-mt-0 pb-10">
      {/* On phones the chips wrap onto two or three rows, so the bar scrolls away with the page instead of sticking. */}
      <nav className="z-20 border-b bg-background/80 backdrop-blur-lg md:sticky md:top-0" aria-label={s.shelves.label}>
        <div className="wrap flex flex-wrap items-center gap-1 py-1 md:min-h-14">
          {POSITION_ORDER.map((p) => (
            <a
              key={p}
              href={`#${shelfId(p)}`}
              data-pos={p}
              aria-current={active === p ? 'true' : undefined}
              onClick={go(p)}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3.5 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground',
                'aria-[current=true]:bg-accent aria-[current=true]:text-foreground aria-[current=true]:ring-1 aria-[current=true]:ring-border',
              )}
            >
              {s.positions[p]}
              <span className={count}>{byPos(p).length}</span>
            </a>
          ))}
        </div>
      </nav>
      <div className="wrap">
        {POSITION_ORDER.map((p) => {
          const list = byPos(p)
          return (
            <section key={p} className="scroll-mt-20 pt-10" id={shelfId(p)} data-pos={p} aria-labelledby={`${shelfId(p)}-h`}>
              <h2 className="mb-4 flex items-baseline gap-2.5 font-semibold text-[1.375rem] leading-tight tracking-tight" id={`${shelfId(p)}-h`}>
                {s.positions[p]}
                <span className={count}>{list.length}</span>
              </h2>
              <TileGrid terms={list} />
            </section>
          )
        })}
      </div>
    </section>
  )
}
