import { Play } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import type { Source } from '@/site/data/terms'
import { useStrings } from '@/site/lib/strings'

const card = 'relative grid grid-cols-[112px_minmax(0,1fr)] items-center gap-x-4 rounded-card-sm bg-card p-2 text-left transition-shadow md:grid-cols-[136px_minmax(0,1fr)]'

// Card for one original film: poster, title and time range. YouTube sources select into the original player; others open externally.
export function SourceClip({ source: s, selected, onSelect }: { source: Source; selected: boolean; onSelect: () => void }) {
  const { recipe } = useStrings()
  const poster = s.clip?.poster

  const thumb = poster ? (
    <img src={poster} alt="" width={960} height={540} loading="lazy" decoding="async" className="aspect-video w-full rounded-[10px] object-cover" />
  ) : (
    <span aria-hidden="true" className="grid aspect-video w-full place-items-center rounded-[10px] bg-media text-white/80">
      <Play fill="currentColor" className="size-4" />
    </span>
  )

  const title = <span className="block font-semibold leading-snug">{s.title}</span>
  const range = `${s.range}${s.note ? ` · ${s.note}` : ''}`

  if (!s.youtube) {
    return (
      <a className={cn(card, 'shadow-soft hover:bg-surface')} href={s.href} target="_blank" rel="noopener">
        {thumb}
        <span className="min-w-0">
          {title}
          <span className="mt-0.5 block text-sm text-muted-foreground tabular-nums">{range}</span>
          <span className="mt-1 block text-sm text-link">{recipe.watchOnX}</span>
        </span>
      </a>
    )
  }

  return (
    <div className={cn(card, selected ? 'shadow-[inset_0_0_0_2px_var(--primary)]' : 'shadow-soft hover:bg-surface')}>
      <button
        type="button"
        className="absolute inset-0 cursor-pointer rounded-[inherit] border-0 bg-transparent p-0 focus-visible:ring-2 focus-visible:ring-brand"
        aria-pressed={selected}
        aria-label={`${s.title} ${s.range}`}
        onClick={onSelect}
      />
      {thumb}
      <span className="min-w-0">
        {title}
        <span className="mt-0.5 flex items-center justify-between gap-2 text-sm text-muted-foreground tabular-nums">
          <span>{range}</span>
          <a className="relative z-10 -my-3 flex min-h-11 shrink-0 items-center px-1 hover:text-foreground" href={s.href} target="_blank" rel="noopener">
            YouTube ↗
          </a>
        </span>
      </span>
    </div>
  )
}
