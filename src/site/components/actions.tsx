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

/** Tiles sit inside links; compact controls must not trigger navigation. */
const isolate = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

export const formatCount = (n: number) => (n > 999 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n))

// Small square control on a film tile: translucent, readable over any frame, 44px touch target.
const mini =
  'relative inline-flex size-9 min-w-9 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg bg-background/65 text-foreground ring-1 ring-border backdrop-blur-md transition hover:bg-background/85 active:scale-95 pointer-coarse:size-11 [&_svg]:size-4 [&_svg]:shrink-0'

/**
 * Copy button. `className` styles the full button (e.g. `max-md:w-full`); `onCopied` runs after every successful copy.
 * The full variant renders the button plus a persistent paste hint as a full-width line (`basis-full`) in the parent flex row.
 */
export function CopyAction({ term, compact, className, onCopied }: { term: Term; compact?: boolean; className?: string; onCopied?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const timer = useRef<number>(0)
  const [done, setDone] = useState(false)
  const [hinted, setHinted] = useState({ slug: term.slug, on: false })
  const { actions } = useStrings()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy(e: MouseEvent) {
    if (compact) isolate(e)
    await writeClipboard(copyText(term))
    if (ref.current) burst(ref.current)
    trackCopy(term.slug)
    track('copy', { tool: SITE.id, what: 'prompt', recipe: term.slug, page: location.pathname })
    setDone(true)
    setHinted({ slug: term.slug, on: true })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 1600)
    onCopied?.()
  }

  if (compact) {
    return (
      <button ref={ref} type="button" className={mini} aria-label={done ? actions.copied : actions.copy} onClick={copy}>
        {done ? <Check aria-hidden /> : <Copy aria-hidden />}
      </button>
    )
  }

  return (
    <>
      <Button ref={ref} size="lg" className={cn('min-w-44 max-sm:min-w-0', className)} onClick={copy}>
        {done ? <Check aria-hidden /> : <Copy aria-hidden />}
        <span>{done ? actions.copied : actions.copy}</span>
      </Button>
      <span role="status" className="order-last basis-full text-muted-foreground text-sm empty:sr-only">
        {hinted.on && hinted.slug === term.slug ? actions.pasteHint : null}
      </span>
    </>
  )
}

export function LikeButton({ slug, compact }: { slug: string; compact?: boolean }) {
  const { liked, likes, toggle } = useLike(slug)
  const { actions } = useStrings()
  const count = likes >= 10 ? formatCount(likes) : null
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
      aria-label={`${count ? `${count} ` : ''}${liked ? actions.unlike : actions.like}`}
      onClick={(e) => {
        if (compact) isolate(e)
        toggle()
      }}
    >
      <Heart aria-hidden fill={liked ? 'currentColor' : 'none'} className={cn('size-4 shrink-0', liked && 'animate-[like-pop_0.45s_cubic-bezier(0.16,1,0.3,1)]')} />
      {count && <span className="font-mono text-xs font-medium tabular-nums">{count}</span>}
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

// Small muted vote link at the end of the recipe page; the thanks replaces the link text in place.
export function WishLink({ slug }: { slug: string }) {
  const [voted, setVoted] = useState(false)
  const { actions } = useStrings()
  return voted ? (
    <p role="status" className="text-muted-foreground text-sm">
      {actions.wishPop}
    </p>
  ) : (
    <button
      type="button"
      className="inline-flex min-h-11 cursor-pointer items-center text-left text-muted-foreground text-sm underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground"
      onClick={() => {
        trackWish(slug)
        setVoted(true)
      }}
    >
      {actions.wish}
    </button>
  )
}
