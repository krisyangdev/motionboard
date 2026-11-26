import { useEffect, useState } from 'react'
import { buttonVariants } from '@/core/ui/button'
import { TileGrid } from '@/site/components/TileGrid'
import { order } from '@/site/data/terms'
import { useSaved } from '@/site/lib/saved'
import { HomeLink } from '@/site/lib/links'
import { useStrings } from '@/site/lib/strings'

export function SavedPage() {
  const { saved } = useSaved()
  const s = useStrings()
  // Saved lives in localStorage; render the list only after hydration so the prerendered
  // empty state never flashes for a visitor who has saved recipes.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const terms = order.filter((t) => saved.includes(t.slug))

  return (
    <main className="wrap min-h-[70vh] pt-2">
      <h1 className="mt-6 mb-7 flex items-baseline gap-3 text-balance font-semibold text-[clamp(1.9rem,4vw,3.25rem)] leading-[1.05] tracking-tight">
        {s.saved.title} {mounted && <span className="font-mono text-muted-foreground text-xs uppercase tracking-wide">{terms.length}</span>}
      </h1>
      {mounted && terms.length > 0 && <TileGrid terms={terms} />}
      {mounted && terms.length === 0 && (
        <div className="flex flex-col items-start gap-4 pt-6">
          <p className="text-muted-foreground">{s.saved.empty}</p>
          <HomeLink hash="recipes" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            {s.saved.browse}
          </HomeLink>
        </div>
      )}
    </main>
  )
}
