// The launch film on the home page, cut into the recipes it is made of.
// One film (Motionboard's own launch film, made with the recipes below); each segment is a
// time range of it, taken from the film's segments.json. Both encodes have a keyframe at every
// segment start, so jumping to a segment shows its first frame at once.
import { MEDIA_URL, type Locale } from '@/site/config'

export const HERO_FILM = {
  /** 1080p film; phones play `mobile` (720p), same timeline */
  src: `${MEDIA_URL}/hero-film.mp4`,
  mobile: `${MEDIA_URL}/hero-film-m.mp4`,
  /** the film's first frame, so the film takes over the poster without a visible cut */
  poster: `${MEDIA_URL}/hero-start.jpg`,
  posterSmall: `${MEDIA_URL}/hero-start-m.jpg`,
  /** share image */
  cover: `${MEDIA_URL}/hero-film.jpg`,
}

export type HeroSegment = { slug: string; start: number; end: number; /** one or two words, for the tab */ short: Record<Locale, string> }

const seg = (slug: string, start: number, end: number, en: string, zh: string): HeroSegment => ({ slug, start, end, short: { en, zh } })

export const HERO: HeroSegment[] = [
  seg('typing-animation', 0, 2.8, 'Typing', '打字'),
  seg('3d-tilted-ui-depth-of-field', 2.8, 5.5, 'Tilted UI', '倾斜界面'),
  seg('zoom-to-cursor', 5.5, 8.2, 'Cursor zoom', '光标缩放'),
  seg('morph-transition', 8.2, 10.6, 'Morph', '形变'),
  seg('match-cut-transition', 10.6, 12.4, 'Match cut', '匹配剪辑'),
  seg('logo-wordmark-reveal', 12.4, 15.8, 'Wordmark', '字标'),
]
