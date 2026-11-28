import { useCallback, useEffect, useRef, useState } from 'react'
import type { FocusEvent, MouseEvent } from 'react'
import { cn } from '@/core/lib/utils'
import { useLocale } from '@/core/locale'
import { CopyAction, SaveButton } from '@/site/components/actions'
import { media, termName } from '@/site/data/terms'
import type { Term } from '@/site/data/terms'
import { RecipeLink } from '@/site/lib/links'
import { useStrings } from '@/site/lib/strings'

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Touch devices have no hover: of the tiles on screen, the one whose center is nearest the
// viewport center plays, one at a time. One observer and one scroll listener serve all tiles.
type Ctl = { play(): void; stop(): void; pause(): void }
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

// Desktop (hover + fine pointer): a tile plays while at least half of it is visible, and pauses when
// it leaves the viewport or the tab is hidden. One observer serves all tiles. Nothing starts before
// the page has loaded, so posters and the LCP come first.
const desktopMedia = '(hover: hover) and (pointer: fine)'
const inView = new Set<Element>()
let dio: IntersectionObserver | null = null
let ready = false

function resumeAll() {
  if (!ready || document.hidden) return
  for (const el of inView) ctls.get(el)?.play()
}

function startDesktop() {
  const go = () => {
    ready = true
    resumeAll()
  }
  const idle = () => (window.requestIdleCallback ? window.requestIdleCallback(go) : setTimeout(go, 200))
  if (document.readyState === 'complete') idle()
  else addEventListener('load', idle, { once: true })
}

function watchDesktop(el: Element, ctl: Ctl) {
  if (!dio) {
    dio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inView.add(e.target)
          else inView.delete(e.target)
          if (!ready || document.hidden) continue
          if (e.isIntersecting) ctls.get(e.target)?.play()
          else ctls.get(e.target)?.pause()
        }
      },
      { threshold: 0.5 },
    )
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) for (const t of inView) ctls.get(t)?.pause()
      else resumeAll()
    })
    startDesktop()
  }
  ctls.set(el, ctl)
  dio.observe(el)
  return () => {
    dio?.unobserve(el)
    inView.delete(el)
    ctls.delete(el)
    ctl.pause()
  }
}

export function FilmTile({ term, eager = false, priority = false }: { term: Term; eager?: boolean; priority?: boolean }) {
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
  // Whether the tile should be playing; a video armed after the request starts only if still wanted.
  const wanted = useRef(false)
  const locale = useLocale()
  const s = useStrings()
  const src = media(term, 'small')

  const play = useCallback(() => {
    if (reducedMotion()) return
    wanted.current = true
    const v = video.current
    if (!v) setArmed(true)
    else v.play().catch(() => {})
  }, [])

  useEffect(() => {
    if (armed && wanted.current) video.current?.play().catch(() => {})
  }, [armed])

  useEffect(() => () => window.clearTimeout(hintTimer.current), [])

  // After a copy, the paste hint shows inside the tile's frame for a moment.
  const onCopied = () => {
    setHint(true)
    window.clearTimeout(hintTimer.current)
    hintTimer.current = window.setTimeout(() => setHint(false), 2500)
  }

  const stop = useCallback(() => {
    wanted.current = false
    const v = video.current
    if (!v) return
    v.pause()
    v.currentTime = 0
    setLive(false)
  }, [])

  // Pause keeps the current frame and the video visible.
  const pause = useCallback(() => {
    wanted.current = false
    video.current?.pause()
  }, [])

  useEffect(() => {
    if (matchMedia('(hover: none)').matches) return watchTouch(root.current!, { play, stop, pause })
    if (matchMedia(desktopMedia).matches) return watchDesktop(root.current!, { play, stop, pause })
    return undefined
  }, [play, stop, pause])

  const onFocus = (e: FocusEvent) => {
    if (e.target.matches(':focus-visible')) play()
  }
  const onBlur = (e: FocusEvent) => {
    if (matchMedia(desktopMedia).matches) return
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
      className="group relative flex min-w-0 flex-col rounded-[18px] bg-card p-[5px] shadow-card transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-card-hover motion-reduce:hover:translate-y-0 md:rounded-card md:p-2"
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className="relative aspect-video overflow-hidden rounded-[13px] bg-media md:rounded-media" ref={frame}>
        <img
          src={media(term, 'jpgSmall')}
          srcSet={`${media(term, 'jpgXs')} 480w, ${media(term, 'jpgSmall')} 960w`}
          sizes="(max-width: 767px) 50vw, 420px"
          alt=""
          aria-hidden="true"
          width={960}
          height={540}
          loading={eager || priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
        />
        {armed && (
          <video
            ref={video}
            className={cn(
              'absolute inset-0 size-full object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100',
              live ? 'opacity-100' : 'opacity-0',
            )}
            src={src}
            muted
            loop
            playsInline
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setLive(true)}
          />
        )}
        <span className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-black/55 px-2 py-1 font-semibold text-white text-xs leading-none tabular-nums max-md:hidden">
          {Number(term.dur.toFixed(1))}s
        </span>
        {/* Phones: Copy sits on the poster so the name keeps the full width under it. */}
        <div className="absolute right-1.5 bottom-1.5 z-10 md:hidden">
          <CopyAction term={term} compact onCopied={onCopied} />
        </div>
        {hint && (
          <div role="status" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 max-md:top-0 max-md:bottom-auto bg-background/85 px-2.5 py-1.5 text-xs leading-snug backdrop-blur-md">
            {s.actions.pasteHint}
          </div>
        )}
      </div>
      <div className="absolute top-3.5 right-3.5 z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100 max-md:hidden">
        <SaveButton slug={term.slug} compact />
      </div>
      <div className="flex items-center gap-2 pt-2 pr-1 pb-[3px] pl-1.5 md:px-2 md:pt-3 md:pb-1.5">
        <RecipeLink
          ref={title}
          slug={term.slug}
          viewTransition
          data-tile-title
          className="line-clamp-2 min-w-0 flex-1 font-semibold text-sm leading-[1.3] outline-none after:absolute after:inset-0 after:rounded-[18px] focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background md:text-base md:after:rounded-card"
          onClick={onNavigate}
        >
          {termName(term, locale)}
        </RecipeLink>
        <div className="max-md:hidden">
          <CopyAction term={term} compact onCopied={onCopied} />
        </div>
      </div>
    </article>
  )
}
