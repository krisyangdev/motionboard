import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Bookmark, Check, Copy, Heart } from 'lucide-react'
import { track } from '@/core/track'
import { cn } from '@/core/lib/utils'
import { Button } from '@/core/ui/button'
import { burst, writeClipboard } from '@/site/components/CopyButton'
import { SITE } from '@/site/config'
import { copyText } from '@/site/data/copy'
import type { Term } from '@/site/data/terms'
import { useStrings } from '@/site/lib/strings'
import { useSaved } from '@/site/lib/saved'
import { trackCopy, trackWish, useLike } from '@/site/lib/stats'

// A link bar above a film frame: your product link becomes a shot. Drawn on lucide's 24px grid.
function LinkToFilm() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="4.5" rx="2.25" />
      <path d="M6.5 5.25h5" />
      <rect x="3" y="10.5" width="18" height="10.5" rx="2.5" />
      <path d="M10.25 13.6v4.3l3.7-2.15z" fill="currentColor" />
    </svg>
  )
}

/** Tiles sit inside links; compact controls must not trigger navigation. */
const isolate = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

export const formatCount = (n: number) => (n > 999 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n))

// Small square control on a film tile: translucent, readable over any frame, 44px touch target.
const mini =
  'relative inline-flex size-9 min-w-9 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg bg-background/65 text-foreground ring-1 ring-border backdrop-blur-md transition hover:bg-background/85 active:scale-95 pointer-coarse:size-11 [&_svg]:size-4 [&_svg]:shrink-0'

export function CopyAction({ term, compact }: { term: Term; compact?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null)
  const timer = useRef<number>(0)
  const [done, setDone] = useState(false)
  const { actions } = useStrings()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy(e: MouseEvent) {
    if (compact) isolate(e)
    await writeClipboard(copyText(term))
    if (ref.current) burst(ref.current)
    trackCopy(term.slug)
    track('copy', { tool: SITE.id, what: 'prompt', recipe: term.slug, page: location.pathname })
    setDone(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 1600)
  }

  if (compact) {
    return (
      <button ref={ref} type="button" className={mini} aria-label={done ? actions.copied : actions.copy} onClick={copy}>
        {done ? <Check aria-hidden /> : <Copy aria-hidden />}
      </button>
    )
  }

  return (
    <Button ref={ref} size="lg" className="min-w-40 max-sm:min-w-0 max-sm:flex-1 sm:min-w-44" onClick={copy}>
      {done ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span aria-live="polite">{done ? actions.copied : actions.copy}</span>
    </Button>
  )
}

export function LikeButton({ slug, compact }: { slug: string; compact?: boolean }) {
  const { liked, likes, toggle } = useLike(slug)
  const { actions } = useStrings()
  const count = formatCount(likes)
  return (
    <button
      type="button"
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center gap-2 text-sm font-medium transition active:scale-95',
        compact
          ? 'h-8 min-w-0 rounded-md px-1 text-muted-foreground hover:text-foreground pointer-coarse:-my-1.5 pointer-coarse:h-11'
          : 'h-10 min-w-11 rounded-lg px-3.5 ring-1 ring-border hover:bg-accent',
        liked && 'text-destructive hover:text-destructive',
      )}
      aria-pressed={liked}
      // starts with the visible count so the accessible name contains the visible text
      aria-label={`${count} ${liked ? actions.unlike : actions.like}`}
      onClick={(e) => {
        if (compact) isolate(e)
        toggle()
      }}
    >
      <Heart aria-hidden fill={liked ? 'currentColor' : 'none'} className={cn('size-4 shrink-0', liked && 'animate-[like-pop_0.45s_cubic-bezier(0.16,1,0.3,1)]')} />
      <span className="font-mono text-xs font-medium tabular-nums">{count}</span>
    </button>
  )
}

export function SaveButton({ slug, compact }: { slug: string; compact?: boolean }) {
  const { has, toggle } = useSaved()
  const saved = has(slug)
  const { actions } = useStrings()
  return (
    <button
      type="button"
      className={compact ? mini : 'inline-flex h-10 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium ring-1 ring-border transition hover:bg-accent active:scale-95'}
      aria-pressed={saved}
      aria-label={saved ? actions.unsave : actions.save}
      onClick={(e) => {
        if (compact) isolate(e)
        toggle(slug)
      }}
    >
      <Bookmark aria-hidden fill={saved ? 'currentColor' : 'none'} className="size-4 shrink-0" />
      {!compact && <span>{saved ? actions.saved : actions.save}</span>}
    </button>
  )
}

export function WishButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const { actions } = useStrings()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative inline-block max-sm:w-full" ref={box}>
      <Button
        variant="outline"
        size="lg"
        className="max-sm:w-full"
        aria-expanded={open}
        onClick={() => {
          trackWish(slug)
          setOpen(true)
        }}
      >
        <LinkToFilm />
        {actions.wish}
      </Button>
      {open && (
        <div
          role="status"
          className="absolute top-[calc(100%+0.5rem)] left-0 z-20 w-max max-w-[min(17.5rem,calc(100vw-2rem))] rounded-lg border bg-popover px-3.5 py-2.5 text-popover-foreground text-sm shadow-lg/10"
        >
          {actions.wishPop}
        </div>
      )}
    </div>
  )
}
