import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import { useLocale } from '@/core/locale'
import { Button, buttonVariants } from '@/core/ui/button'
import { CopyAction } from '@/site/components/actions'
import { BRAND } from '@/site/config'
import { HERO, HERO_FILM } from '@/site/data/hero'
import { bySlug, termName } from '@/site/data/terms'
import { gsap, useGSAP } from '@/site/lib/gsap'
import { RecipeLink } from '@/site/lib/links'
import { useStrings } from '@/site/lib/strings'

const SEGS = HERO.map((s) => ({ ...s, term: bySlug[s.slug], dur: s.end - s.start }))

const pendingSeek = new WeakMap<HTMLVideoElement, number>()

function seek(v: HTMLVideoElement, t: number) {
  pendingSeek.set(v, t)
  if (v.readyState >= 1) {
    // Segments of one continuous film follow each other: when playback has just crossed into
    // this segment, leave it running instead of seeking back a frame.
    const d = v.currentTime - t
    if (d < -0.03 || d > 0.25) v.currentTime = t
  } else if (!v.dataset.seekHook) {
    v.dataset.seekHook = '1'
    v.addEventListener('loadedmetadata', () => {
      const p = pendingSeek.get(v)
      if (p !== undefined) v.currentTime = p
    })
  }
}

export function HeroFilm() {
  const root = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const fills = useRef<(HTMLElement | null)[]>([])
  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [started, setStarted] = useState(false)
  const [armed, setArmed] = useState(false)
  const [shown, setShown] = useState(false)
  const locale = useLocale()
  const s = useStrings()
  const live = inView && !hidden && (!reduced || started)
  const cur = SEGS[index]

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.hero-h', { y: 28, opacity: 0, duration: 0.9, ease: 'expo.out' })
        gsap.from('.hero-frame', { y: 16, opacity: 0, duration: 0.9, delay: 0.1, ease: 'expo.out' })
        gsap.from('.tl-item', { y: 12, opacity: 0, duration: 0.6, delay: 0.3, stagger: 0.06, ease: 'expo.out' })
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  // Pause when the hero is off-screen or the tab is hidden; follow the reduced-motion setting.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(root.current!)
    const onVis = () => setHidden(document.hidden)
    onVis()
    document.addEventListener('visibilitychange', onVis)
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const onMq = () => setReduced(mq.matches)
    onMq()
    mq.addEventListener('change', onMq)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      mq.removeEventListener('change', onMq)
    }
  }, [])

  useEffect(() => {
    if (live) setArmed(true)
  }, [live])

  // The current segment seeks to its start.
  useEffect(() => {
    if (armed) seek(video.current!, SEGS[index].start)
  }, [index, armed])

  useEffect(() => {
    fills.current.forEach((f, i) => {
      if (f && i !== index) f.style.transform = 'scaleX(0)'
    })
  }, [index])

  // Playback and the progress fill, driven by currentTime outside React.
  useEffect(() => {
    if (!armed) return
    const seg = SEGS[index]
    const v = video.current!
    if (!live) {
      v.pause()
      return
    }
    v.play().catch(() => {})
    const fill = fills.current[index]
    let raf = 0
    let done = false
    const tick = () => {
      if (v.seeking) {
        raf = requestAnimationFrame(tick)
        return
      }
      const t = v.currentTime
      if (fill) fill.style.transform = `scaleX(${Math.min(1, Math.max(0, (t - seg.start) / seg.dur))})`
      if (t >= seg.end || v.ended) {
        if (SEGS.length === 1) {
          v.currentTime = seg.start
          v.play().catch(() => {})
        } else if (!done) {
          done = true
          setIndex((i) => (i + 1) % SEGS.length)
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [index, live, armed])

  const select = (i: number) => {
    setStarted(true)
    if (i !== index) {
      setIndex(i)
      return
    }
    const v = video.current!
    v.currentTime = SEGS[i].start
    v.play().catch(() => {})
  }

  return (
    <section className="wrap pt-7 pb-5" ref={root}>
      <h1 className="hero-h mb-6 max-w-[17em] text-balance font-semibold text-[clamp(28px,8.4vw,34px)] leading-[1.04] tracking-tighter sm:text-[clamp(34px,min(5.2vw,8svh),72px)] sm:leading-[1.02] min-[900px]:mx-auto min-[900px]:text-center">
        {BRAND.headline[locale]}
      </h1>
      <div className="hero-stage grid content-start gap-3 max-sm:-mx-4 min-[900px]:justify-items-center">
        <div className="hero-frame relative aspect-video w-full overflow-hidden bg-muted sm:rounded-xl sm:ring-1 sm:ring-border min-[900px]:w-[var(--vw)]">
          <img
            className="absolute inset-0 z-0 size-full object-cover"
            src={HERO_FILM.poster}
            srcSet={`${HERO_FILM.posterSmall} 960w, ${HERO_FILM.poster} 1920w`}
            sizes="(min-width: 900px) 1200px, 100vw"
            alt=""
            width={1920}
            height={1080}
            fetchPriority="high"
            elementtiming="poster"
            decoding="async"
          />
          {/* Sources are in the markup so the download starts with the page, before the script runs. */}
          <video
            ref={video}
            className={cn('absolute inset-0 z-[1] size-full object-cover', shown ? 'opacity-100' : 'opacity-0')}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setShown(true)}
          >
            <source src={HERO_FILM.mobile} type="video/mp4" media="(max-width: 767px)" />
            <source src={HERO_FILM.src} type="video/mp4" />
          </video>
          {reduced && !started && (
            <Button
              size="icon-xl"
              className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-[2] size-16 rounded-full sm:size-16 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-5"
              aria-label={s.hero.play}
              onClick={() => setStarted(true)}
            >
              <Play fill="currentColor" className="ml-0.5" />
            </Button>
          )}
        </div>
        <ol className="m-0 flex h-11 list-none gap-1 p-0 max-sm:mx-4 sm:h-12 min-[900px]:w-[var(--vw)]" aria-label={s.hero.shots}>
          {SEGS.map((seg, i) => (
            <li key={seg.slug} className="tl-item min-w-0 flex-1 basis-0" style={{ flexGrow: seg.dur }}>
              <button
                type="button"
                className="group relative flex size-full cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-muted-foreground transition-colors sm:bg-muted sm:ring-1 sm:ring-border sm:before:absolute sm:before:inset-x-0 sm:before:top-0 sm:before:h-0.5 sm:before:bg-brand sm:before:opacity-0 sm:before:transition-opacity sm:hover:bg-accent sm:hover:text-foreground sm:aria-[current=true]:bg-accent sm:aria-[current=true]:text-foreground sm:aria-[current=true]:before:opacity-100"
                aria-label={termName(seg.term, locale)}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => select(i)}
              >
                {/* Phones: a slim progress bar inside the full-height tap target. From 640px: the tab's background. */}
                <span className="pointer-events-none absolute overflow-hidden max-sm:inset-x-0 max-sm:top-1/2 max-sm:h-1.5 max-sm:-translate-y-1/2 max-sm:rounded-full max-sm:bg-muted max-sm:ring-1 max-sm:ring-border max-sm:group-aria-[current=true]:bg-accent sm:inset-0">
                  <span className="absolute inset-0 origin-left [transform:scaleX(0)] max-sm:bg-brand sm:bg-foreground/8" ref={(el) => void (fills.current[i] = el)} />
                </span>
                <span className="relative max-w-full truncate font-medium text-[0.8125rem] max-sm:hidden" aria-hidden="true">
                  {seg.short[locale]}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 pt-1 max-sm:mx-4 min-[900px]:w-[var(--vw)]">
          <div className="grid min-w-0 gap-0.5">
            <span className="font-semibold text-xl leading-tight tracking-tight min-[900px]:text-[1.375rem]">{termName(cur.term, locale)}</span>
            <span className="font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wide">{s.positions[cur.term.pos]}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 max-md:w-full">
            <CopyAction term={cur.term} className="max-md:w-full" />
            <RecipeLink slug={cur.term.slug} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              {s.hero.open}
            </RecipeLink>
          </div>
        </div>
      </div>
    </section>
  )
}
