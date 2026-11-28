import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Bookmark, Check, Copy, Heart } from 'lucide-react'
import { track } from '@/core/track'
import { cn } from '@/core/lib/utils'
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

// Small round control on a film tile, over the poster: readable over any frame.
const mini =
  'relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/70 active:scale-95 [&_svg]:size-4 [&_svg]:shrink-0'

const soft =
  'relative inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-card px-4 font-semibold text-[15px] shadow-soft transition hover:bg-surface-2 active:scale-95 [&_svg]:size-[18px] [&_svg]:shrink-0'

/**
 * Copy button. `className` styles the full button (e.g. `max-md:w-full`); `onCopied` runs after every successful copy.
 * The compact variant is the card's red pill (icon-only circle on phones). The full variant renders the button plus a
 * persistent paste hint as a full-width line (`basis-full`) in the parent flex row.
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
      <button
        ref={ref}
        type="button"
        className={cn(
          'relative z-10 inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-primary px-3.5 font-semibold text-primary-foreground text-sm transition hover:bg-primary-hover active:scale-95 max-md:w-9 max-md:px-0 [&_svg]:size-4 [&_svg]:shrink-0',
          done && 'bg-ok hover:bg-ok',
        )}
        aria-label={done ? actions.copied : actions.copy}
        onClick={copy}
      >
        {done ? <Check aria-hidden /> : <Copy aria-hidden />}
        <span className="max-md:hidden">{done ? actions.copied : actions.copyShort}</span>
      </button>
    )
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={cn(
          'relative inline-flex h-[60px] cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-primary px-8 font-semibold text-lg text-primary-foreground shadow-primary transition hover:bg-primary-hover active:scale-[0.97] [&_svg]:size-5 [&_svg]:shrink-0',
          done && 'bg-ok shadow-none hover:bg-ok',
          className,
        )}
        onClick={copy}
      >
        {done ? <Check aria-hidden /> : <Copy aria-hidden />}
        <span>{done ? actions.copied : actions.copy}</span>
      </button>
      <span role="status" className="order-last basis-full text-[15px] text-muted-foreground empty:sr-only">
        {hinted.on && hinted.slug === term.slug ? actions.pasteHint : null}
      </span>
    </>
  )
}

export function LikeButton({ slug }: { slug: string }) {
  const { liked, likes, toggle } = useLike(slug)
  const { actions } = useStrings()
  const count = likes >= 10 ? formatCount(likes) : null
  return (
    <button type="button" className={cn(soft, liked && 'text-destructive hover:text-destructive')} aria-pressed={liked} onClick={toggle}>
      <Heart aria-hidden fill={liked ? 'currentColor' : 'none'} className={cn(liked && 'animate-[like-pop_0.45s_cubic-bezier(0.16,1,0.3,1)]')} />
      <span>{actions.like}</span>
      {count && <span className="text-sm tabular-nums">{count}</span>}
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
      className={compact ? mini : soft}
      aria-pressed={saved}
      aria-label={compact ? (saved ? actions.unsave : actions.save) : undefined}
      onClick={(e) => {
        if (compact) isolate(e)
        toggle(slug)
      }}
    >
      <Bookmark aria-hidden fill={saved ? 'currentColor' : 'none'} />
      {!compact && <span>{saved ? actions.saved : actions.save}</span>}
    </button>
  )
}

// Small muted vote link at the end of the recipe page; the thanks replaces the link text in place.
export function WishLink({ slug }: { slug: string }) {
  const [voted, setVoted] = useState(false)
  const { actions } = useStrings()
  return voted ? (
    <p role="status" className="text-[15px] text-muted-foreground">
      {actions.wishPop}
    </p>
  ) : (
    <button
      type="button"
      className="inline-flex min-h-11 cursor-pointer items-center text-left text-[15px] text-muted-foreground underline underline-offset-[3px] hover:text-foreground"
      onClick={() => {
        trackWish(slug)
        setVoted(true)
      }}
    >
      {actions.wish}
    </button>
  )
}
