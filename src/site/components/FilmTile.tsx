import { useCallback, useEffect, useRef, useState } from 'react'
import type { FocusEvent, MouseEvent, PointerEvent } from 'react'
import { cn } from '@/core/lib/utils'
import { useLocale } from '@/core/locale'
import { CopyAction, LikeButton, SaveButton } from '@/site/components/actions'
import { media, termName } from '@/site/data/terms'
import type { Term } from '@/site/data/terms'
import { RecipeLink } from '@/site/lib/links'
import { useStrings } from '@/site/lib/strings'

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Touch devices have no hover: of the tiles on screen, the one whose center is nearest the
// viewport center plays, one at a time. One observer and one scroll listener serve all tiles.
type Ctl = { play(): void; stop(): void }
const ctls = new WeakMap<Element, Ctl>()
const visible = new Set<Element>()
let playing: Element | null = null
let io: IntersectionObserver | null = null
let raf = 0

function pick() {
  raf = 0
  const mid = innerHeight / 2
  let best: Element | null = null
  let bestD = Infinity
  for (const el of visible) {
    const r = el.getBoundingClientRect()
    const d = Math.abs(r.top + r.height / 2 - mid)
    if (d < bestD) {
      best = el
      bestD = d
    }
  }
  if (best === playing) return
  if (playing) ctls.get(playing)?.stop()
  playing = best
  if (best) ctls.get(best)?.play()
}

const schedule = () => {
  if (!raf) raf = requestAnimationFrame(pick)
}

function watchTouch(el: Element, ctl: Ctl) {
  if (!io) {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target)
        else visible.delete(e.target)
      }
      schedule()
    })
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule)
  }
  ctls.set(el, ctl)
  io.observe(el)
  return () => {
    io?.unobserve(el)
    visible.delete(el)
    ctls.delete(el)
    if (playing === el) {
      ctl.stop()
      playing = null
    }
  }
}

export function FilmTile({ term, eager = false }: { term: Term; eager?: boolean }) {
  const root = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const title = useRef<HTMLAnchorElement>(null)
  const [live, setLive] = useState(false)
  // The <video> is only rendered once the tile first needs to play, so the page markup carries one
  // video per page (the recipe film) for search engines, and tiles download nothing until then.
  const [armed, setArmed] = useState(false)
  const [hint, setHint] = useState(false)
  const hintTimer = useRef(0)
  const locale = useLocale()
  const s = useStrings()
  const src = media(term, 'small')

  const play = useCallback(() => {
    if (reducedMotion()) return
    const v = video.current
    if (!v) setArmed(true)
    else v.play().catch(() => {})
  }, [])

  useEffect(() => {
    if (armed) video.current?.play().catch(() => {})
  }, [armed])

  useEffect(() => () => window.clearTimeout(hintTimer.current), [])

  // After a copy, the paste hint shows inside the tile's frame for a moment.
  const onCopied = () => {
    setHint(true)
    window.clearTimeout(hintTimer.current)
    hintTimer.current = window.setTimeout(() => setHint(false), 2500)
  }

  const stop = useCallback(() => {
    const v = video.current
    if (!v) return
    v.pause()
    v.currentTime = 0
    setLive(false)
  }, [])

  useEffect(() => {
    if (!matchMedia('(hover: none)').matches) return
    return watchTouch(root.current!, { play, stop })
  }, [play, stop])

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') play()
  }
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') stop()
  }
  const onFocus = (e: FocusEvent) => {
    if (e.target.matches(':focus-visible')) play()
  }
  const onBlur = (e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) stop()
  }

  // Tile frame and title morph into the recipe page's film and heading.
  const onNavigate = (e: MouseEvent) => {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const f = frame.current
    const t = title.current
    // On a recipe page the current film and heading already carry these names; a name may appear only
    // once per page, so they give them up for the transition and the tile morphs into the next recipe.
    const current = [...document.querySelectorAll<HTMLElement>('[style*="view-transition-name"]')].filter(
      (el) => el !== f && el !== t && (el.style.viewTransitionName === 'film' || el.style.viewTransitionName === 'title'),
    )
    const names = current.map((el) => el.style.viewTransitionName)
    current.forEach((el) => (el.style.viewTransitionName = 'none'))
    f?.style.setProperty('view-transition-name', 'film')
    t?.style.setProperty('view-transition-name', 'title')
    setTimeout(() => {
      f?.style.removeProperty('view-transition-name')
      t?.style.removeProperty('view-transition-name')
      current.forEach((el, i) => (el.style.viewTransitionName = names[i]))
    }, 1000)
  }

  return (
    <article
      ref={root}
      className="group relative min-w-0"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div
        className={cn(
          'relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border transition-shadow group-focus-within:ring-foreground/20 group-hover:ring-foreground/20',
          live && 'ring-brand/70 group-focus-within:ring-brand/70 group-hover:ring-brand/70',
        )}
        ref={frame}
      >
        <img
          src={media(term, 'jpgSmall')}
          alt=""
          width={960}
          height={540}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        {armed && (
          <video
            ref={video}
            className={cn('absolute inset-0 size-full object-cover transition-opacity duration-200', live ? 'opacity-100' : 'opacity-0')}
            src={src}
            muted
            loop
            playsInline
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setLive(true)}
          />
        )}
        {hint && (
          <div role="status" className="absolute inset-x-0 bottom-0 z-10 bg-background/85 px-2.5 py-1.5 text-xs leading-snug backdrop-blur-md">
            {s.actions.pasteHint}
          </div>
        )}
      </div>
      <div className="absolute top-2 right-2 z-10 flex gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100 max-md:opacity-100">
        <CopyAction term={term} compact onCopied={onCopied} />
        <SaveButton slug={term.slug} compact />
      </div>
      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="grid min-w-0 gap-px">
          <RecipeLink
            ref={title}
            slug={term.slug}
            viewTransition
            data-tile-title
            className="line-clamp-2 font-medium text-[0.9rem] leading-snug outline-none pointer-coarse:-my-3 pointer-coarse:py-3 after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-brand focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
            onClick={onNavigate}
          >
            {termName(term, locale)}
          </RecipeLink>
          <span className="font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wide max-[559px]:hidden">{s.positions[term.pos]}</span>
        </div>
        <div className="relative z-10 shrink-0">
          <LikeButton slug={term.slug} compact />
        </div>
      </div>
    </article>
  )
}
