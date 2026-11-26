import type { Media } from '@/core/content/schema'
import { LCP } from './link'

/**
 * The main media of an item page: an image with its size and alt text, or a video with `<source>` and poster in the
 * server HTML (never set by script after mount). It is the first thing on screen, so it is the LCP element.
 */
export function MediaBlock({ media, alt }: { media: Media; alt: string }) {
  const frame = 'mt-8 h-auto w-full rounded-xl border bg-card'
  if (media.kind === 'image') {
    return <img {...LCP} alt={alt} className={frame} decoding="async" fetchPriority="high" height={media.height} src={media.src} width={media.width} />
  }
  return (
    <video aria-label={alt} className={frame} controls height={media.height} playsInline poster={media.poster} preload="none" width={media.width}>
      <source src={media.src} type={media.mime ?? 'video/mp4'} />
    </video>
  )
}
