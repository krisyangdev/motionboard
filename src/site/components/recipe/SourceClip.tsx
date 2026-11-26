import { Play } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import type { Source } from '@/site/data/terms'
import { useStrings } from '@/site/lib/strings'

const mono = 'font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wide'
const card = 'relative flex aspect-video flex-col justify-between overflow-hidden rounded-xl bg-muted ring-1 ring-border transition-colors hover:bg-accent'
const go = 'inline-flex min-h-8 items-center gap-1.5 self-start rounded-full bg-primary px-3.5 font-semibold text-primary-foreground text-sm transition-transform'

// Card for one original film. YouTube sources select into the compare block; others open externally.
export function SourceClip({ source: s, selected, onSelect }: { source: Source; selected: boolean; onSelect: () => void }) {
  const { recipe } = useStrings()
  const label = (
    <span className="block min-w-0">
      <span className="block font-semibold text-[0.9375rem] leading-snug tracking-tight">{s.title}</span>{' '}
      <span className={cn('mt-1 block', mono)}>
        {s.range}
        {s.note ? ` · ${s.note}` : ''}
      </span>
    </span>
  )

  if (!s.youtube) {
    return (
      <a className={cn(card, 'group p-4')} href={s.href} target="_blank" rel="noopener">
        {label}
        <span className={cn(go, 'group-hover:scale-105')}>{recipe.watchOnX}</span>
      </a>
    )
  }

  return (
    <div className={cn(card, selected && 'ring-foreground/50')}>
      <button type="button" className="group absolute inset-0 flex w-full cursor-pointer flex-col justify-between border-0 bg-transparent p-4 text-left" aria-pressed={selected} onClick={onSelect}>
        {label}{' '}
        <span className={cn(go, 'group-hover:scale-105')}>
          <Play aria-hidden="true" fill="currentColor" className="size-[11px]" />
          {selected ? recipe.showing : recipe.compare}
        </span>
      </button>
      <a className={cn(mono, 'absolute right-0 bottom-0 flex h-11 items-center px-4 hover:text-foreground')} href={s.href} target="_blank" rel="noopener">
        YouTube ↗
      </a>
    </div>
  )
}
