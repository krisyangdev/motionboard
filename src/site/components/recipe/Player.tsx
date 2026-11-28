import { useEffect, useRef, useState } from 'react'
import { cn } from '@/core/lib/utils'
import { Play } from 'lucide-react'
import { useLocale } from '@/core/locale'
import { track } from '@/core/track'
import { media, termName, type Term } from '@/site/data/terms'
import { useStrings } from '@/site/lib/strings'

type FilmProps = { src: string; mobileSrc?: string; poster: string; posterSmall?: string; name: string; alt?: string; transitionName?: string; slug?: string; radius?: string }

// Autoplays muted on loop; click toggles. Reduced motion shows the poster and plays only on click.
export function Film({ src, mobileSrc, poster, posterSmall, name, alt, transitionName, slug, radius = 'rounded-media' }: FilmProps) {
  const video = useRef<HTMLVideoElement>(null)
  const bar = useRef<HTMLElement>(null)
  const [paused, setPaused] = useState(false)
  // Other films (the original clip next to the recipe film) render their <video> after mount, so the page
  // markup carries one video, the recipe film.
  const [mounted, setMounted] = useState(!!slug)
  useEffect(() => setMounted(true), [])
  const { recipe } = useStrings()

  useEffect(() => {
    const v = video.current
    if (!v) return
    // A recipe film's sources are in the markup; other films get their source after mount.
    if (!slug && v.getAttribute('src') !== src) v.src = src
    let raf = 0
    const draw = () => {
      if (bar.current && v.duration) bar.current.style.transform = `scaleX(${v.currentTime / v.duration})`
    }
    const tick = () => {
      draw()
      raf = requestAnimationFrame(tick)
    }
    const onPlay = () => {
      setPaused(false)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
    }
    const onPause = () => {
      setPaused(true)
      cancelAnimationFrame(raf)
      draw()
    }
    const onFirstPlaying = () => track('video_play', { recipe: slug!, page: location.pathname, trigger: 'auto' })
    if (slug) v.addEventListener('playing', onFirstPlaying, { once: true })
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('seeked', draw)

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      v.pause()
      setPaused(true)
    } else if (v.paused) {
      v.play().catch(() => setPaused(true))
    } else {
      onPlay()
    }
    return () => {
      cancelAnimationFrame(raf)
      v.removeEventListener('playing', onFirstPlaying)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('seeked', draw)
    }
  }, [src, mobileSrc, slug, mounted])

  const toggle = () => {
    const v = video.current
    if (!v) return
    if (v.paused) {
      if (slug) track('video_play', { recipe: slug, page: location.pathname, trigger: 'click' })
      v.play().catch(() => {})
    } else v.pause()
  }

  return (
    <div>
      <div
        className={cn('relative aspect-video overflow-hidden bg-media', radius)}
        style={transitionName ? { viewTransitionName: transitionName } : undefined}
      >
        {/* keyed so a new source remounts the video and autoplays */}
        {/* The poster is an image in the markup (not the video's poster attribute) so it downloads with the page, at
            960px on phones; the video paints over it once it has a frame. */}
        <img
          src={poster}
          srcSet={posterSmall ? `${posterSmall} 960w, ${poster} 1920w` : undefined}
          sizes={posterSmall ? '(min-width: 900px) 1100px, 100vw' : undefined}
          alt={alt ?? ''}
          aria-hidden={alt ? undefined : true}
          width={1920}
          height={1080}
          fetchPriority="high"
          elementtiming="poster"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        {/* A recipe film carries its sources in the prerendered markup so search engines find the video without
            running the script; preload="none" and no autoPlay keep it from downloading before the poster is
            painted, and the effect above starts it. Phones get the 720p film. */}
        {mounted && (
          <video key={src} ref={video} className="absolute inset-0 size-full object-cover" muted loop playsInline preload={slug ? 'none' : 'auto'}>
            {slug && mobileSrc && <source src={mobileSrc} type="video/mp4" media="(max-width: 767px)" />}
            {slug && <source src={src} type="video/mp4" />}
          </video>
        )}
        <button
          type="button"
          className="group absolute inset-0 grid size-full cursor-pointer place-items-center rounded-[inherit] border-0 bg-transparent p-0 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
          aria-label={paused ? recipe.play(name) : recipe.pause(name)}
          onClick={toggle}
        >
          <span
            className={cn(
              'grid size-16 scale-90 place-items-center rounded-full bg-background/60 text-foreground opacity-0 ring-1 ring-border backdrop-blur-md transition duration-200',
              paused && 'scale-100 opacity-100',
            )}
          >
            <Play aria-hidden="true" fill="currentColor" className="ml-1 size-[22px]" />
          </span>
        </button>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-foreground/14" aria-hidden="true">
          <i ref={bar} className="block h-full origin-left bg-brand [transform:scaleX(0)]" />
        </span>
      </div>
    </div>
  )
}

// The full film of a recipe.
export function Player({ term: t, alt }: { term: Term; alt: string | undefined }) {
  const locale = useLocale()
  return <Film src={media(t, 'mp4')} mobileSrc={media(t, 'mobile')} poster={media(t, 'jpg')} posterSmall={media(t, 'jpgSmall')} name={termName(t, locale)} alt={alt} transitionName="film" slug={t.slug} radius="rounded-[15px] md:rounded-[24px]" />
}
