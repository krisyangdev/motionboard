import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { media, termName, type Term } from '@/data/terms'
import { useLocale, useStrings } from '@/lib/locale'
import { track } from '@/lib/track'

type FilmProps = { src: string; mobileSrc?: string; poster: string; posterSmall?: string; name: string; transitionName?: string; slug?: string }

// Autoplays muted on loop; click toggles. Reduced motion shows the poster and plays only on click.
export function Film({ src, mobileSrc, poster, posterSmall, name, transitionName, slug }: FilmProps) {
  const video = useRef<HTMLVideoElement>(null)
  const bar = useRef<HTMLElement>(null)
  const [paused, setPaused] = useState(false)
  const { recipe } = useStrings()

  useEffect(() => {
    const v = video.current
    if (!v) return
    // Phones get the 720p film; picked after mount so the prerendered markup carries no source to preload.
    const film = mobileSrc && matchMedia('(max-width: 767px)').matches ? mobileSrc : src
    if (v.getAttribute('src') !== film) v.src = film
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
  }, [src, mobileSrc, slug])

  const toggle = () => {
    const v = video.current
    if (!v) return
    if (v.paused) {
      if (slug) track('video_play', { recipe: slug, page: location.pathname, trigger: 'click' })
      v.play().catch(() => {})
    } else v.pause()
  }

  return (
    <div className="rc-player">
      <div className="frame" style={transitionName ? { viewTransitionName: transitionName } : undefined}>
        {/* keyed so a new source remounts the video and autoplays */}
        {/* The poster is an image in the markup (not the video's poster attribute) so it downloads with the page, at
            960px on phones; the video paints over it once it has a frame. */}
        <img
          src={poster}
          srcSet={posterSmall ? `${posterSmall} 960w, ${poster} 1920w` : undefined}
          sizes={posterSmall ? '(min-width: 900px) 1100px, 100vw' : undefined}
          alt=""
          width={1920}
          height={1080}
          fetchPriority="high"
          elementtiming="poster"
          decoding="async"
        />
        <video key={src} ref={video} autoPlay muted loop playsInline preload="auto" />
        <button type="button" className="rc-hit" aria-label={paused ? recipe.play(name) : recipe.pause(name)} onClick={toggle}>
          <span className="rc-glyph" data-on={paused}>
            <Play aria-hidden="true" fill="currentColor" />
          </span>
        </button>
        <span className="rc-prog" aria-hidden="true">
          <i ref={bar} />
        </span>
      </div>
    </div>
  )
}

// The full film of a recipe.
export function Player({ term: t }: { term: Term }) {
  const locale = useLocale()
  return <Film src={media(t, 'mp4')} mobileSrc={media(t, 'mobile')} poster={media(t, 'jpg')} posterSmall={media(t, 'jpgSmall')} name={termName(t, locale)} transitionName="film" slug={t.slug} />
}
