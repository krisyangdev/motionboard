import { useEffect, useRef, useState } from 'react'
import { cn } from '@/core/lib/utils'
import { useLocale } from '@/core/locale'
import { LCP } from '@/core/ui/page/link'
import { SearchBar } from '@/site/components/home/SearchBar'
import { BRAND } from '@/site/config'
import { bySlug, media, terms, termName } from '@/site/data/terms'
import { RecipeLink } from '@/site/lib/links'
import { useStrings } from '@/site/lib/strings'

// The hero (prototype C): the headline, the search as the hero action, and six films floating around them.
// Floats are posters in the markup; a <video> is created only after hydration, while the hero is on screen.
// Width of a float: md 200 (xl 250) for the first column of each side, 210 (260) for the middle, 180 (220) for the lowest.
// `--r` is the tilt; hover straightens it. From 768px the floats sit around the text, below that they are a row of three under the search.
const FLOATS = [
  {
    slug: 'typing-animation',
    phone: false,
    eager: true,
    delay: '-1s',
    cls: '[--r:-6deg] max-md:order-1 max-md:mt-2.5 max-md:-mr-2.5 md:absolute md:top-24 md:left-[2.5%] md:w-[200px] xl:w-[250px]',
  },
  {
    slug: '3d-tilted-ui-depth-of-field',
    phone: false,
    eager: true,
    delay: '-3s',
    cls: '[--r:7deg] md:[--r:4deg] max-md:order-3 max-md:mt-3.5 max-md:-ml-2.5 md:absolute md:top-[370px] md:left-[3%] md:w-[210px] xl:w-[260px]',
  },
  {
    slug: 'showcase-wall',
    phone: false,
    eager: false,
    delay: '-5s',
    cls: '[--r:-3deg] hidden lg:absolute lg:top-[620px] lg:left-[1.5%] lg:block lg:w-[180px] xl:w-[220px]',
  },
  {
    slug: 'match-cut-transition',
    phone: true,
    eager: true,
    delay: '-2s',
    cls: '[--r:3deg] md:[--r:5deg] z-[2] max-md:order-2 md:absolute md:top-[90px] md:right-[2.5%] md:w-[200px] xl:w-[250px]',
  },
  {
    slug: 'light-reveal',
    phone: false,
    eager: false,
    delay: '-4s',
    cls: '[--r:-4deg] hidden md:absolute md:top-[360px] md:right-[3%] md:block md:w-[210px] xl:w-[260px]',
  },
  {
    slug: 'line-boil-effect',
    phone: false,
    eager: false,
    delay: '-6s',
    cls: '[--r:3deg] hidden lg:absolute lg:top-[610px] lg:right-[1.5%] lg:block lg:w-[180px] xl:w-[220px]',
  },
]

const HIGHLIGHT = 'Claude Code'
const UNDERLINE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 10' preserveAspectRatio='none'%3E%3Cpath d='M2 7 Q 50 1 100 6 T 198 4' fill='none' stroke='black' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")`

// Hyphenated words (launch-film) stay on one line.
const keepHyphens = (t: string) =>
  t.split(/(\S+-\S+)/).map((part, k) => (k % 2 ? <span key={k} className="whitespace-nowrap">{part}</span> : part))

function Headline({ text }: { text: string }) {
  const i = text.indexOf(HIGHLIGHT)
  if (i < 0) return <>{keepHyphens(text)}</>
  return (
    <>
      {keepHyphens(text.slice(0, i))}
      <span className="relative whitespace-nowrap text-primary">
        {HIGHLIGHT}
        <span
          aria-hidden
          className="absolute inset-x-0 -bottom-1.5 h-2.5 bg-(--hl-underline)"
          style={{ maskImage: UNDERLINE, WebkitMaskImage: UNDERLINE, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }}
        />
      </span>
      {keepHyphens(text.slice(i + HIGHLIGHT.length))}
    </>
  )
}

function Float({ f, live }: { f: (typeof FLOATS)[number]; live: boolean }) {
  const locale = useLocale()
  const term = bySlug[f.slug]
  const name = termName(term, locale)
  const link = useRef<HTMLAnchorElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [armed, setArmed] = useState(false)
  const [playing, setPlaying] = useState(false)

  // Create the video when the float is shown and the hero is on screen; on phones only the middle float plays.
  useEffect(() => {
    if (!live || armed || !link.current || link.current.offsetParent === null) return
    if (matchMedia('(max-width: 767px)').matches && !f.phone) return
    setArmed(true)
  }, [live, armed, f])

  useEffect(() => {
    const v = video.current
    if (!v) return
    if (live) v.play().catch(() => {})
    else v.pause()
  }, [live, armed])

  return (
    <RecipeLink
      slug={f.slug}
      ref={link}
      aria-label={name}
      className={cn('pointer-events-auto block rotate-(--r) transition-transform duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)] hover:z-[3] hover:rotate-0 hover:scale-[1.06]', f.cls)}
    >
      <span className="relative block rounded-[14px] bg-card p-1 shadow-float motion-safe:animate-bob md:rounded-[22px] md:p-1.5" style={{ animationDelay: f.delay }}>
        <span className="relative block aspect-video overflow-hidden rounded-[10px] bg-media md:rounded-media">
          <img
            className="size-full object-cover"
            src={media(term, 'jpgSmall')}
            alt=""
            width={960}
            height={540}
            loading={f.eager ? 'eager' : 'lazy'}
            decoding="async"
          />
          {armed && (
            <video
              ref={video}
              className={cn('absolute inset-0 size-full object-cover transition-opacity duration-300', playing ? 'opacity-100' : 'opacity-0')}
              src={media(term, 'small')}
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
              onPlaying={() => setPlaying(true)}
            />
          )}
        </span>
        <span className="absolute -bottom-3.5 left-3.5 rounded-full bg-[#1b1512] px-3 py-1.5 font-semibold text-[13px] text-white leading-none whitespace-nowrap max-md:hidden" aria-hidden="true">
          {name.replace(/ \(.*\)/, '')}
        </span>
      </span>
    </RecipeLink>
  )
}

export function HeroFilm({ query, onQuery, onLoaded }: { query: string; onQuery: (q: string) => void; onLoaded: () => void }) {
  const root = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [reduced, setReduced] = useState(true)
  const locale = useLocale()
  const s = useStrings()
  const live = inView && !hidden && !reduced

  // Pause when the hero is off-screen or the tab is hidden; no playing under reduced motion.
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

  return (
    <section
      ref={root}
      className="relative flex flex-col overflow-hidden bg-hero pb-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-[60px] after:bg-linear-to-b after:from-transparent after:to-background md:min-h-[820px] md:flex-row md:items-center md:pb-0 md:after:h-[120px]"
    >
      <div className="relative z-[2] mx-auto flex w-full max-w-[760px] flex-col items-center px-4 pt-6 text-center md:max-w-[640px] md:px-8 md:pt-10 md:pb-24 xl:max-w-[760px]">
        <span className="inline-flex h-9 items-center rounded-full bg-(--chip-bg) px-4 font-semibold text-kicker text-sm shadow-soft">{s.hero.kicker(terms.length)}</span>
        <h1 {...LCP} className="hero-h1 mt-3.5 text-[42px] leading-[0.98] [font-variation-settings:'opsz'_96] md:mt-5 md:text-[60px] xl:text-[72px]">
          <Headline text={BRAND.headline[locale]} />
        </h1>
        <p className="mt-3.5 mb-[22px] max-w-[26em] text-[17px] text-muted-foreground md:mt-6 md:mb-8 md:text-xl">{s.hero.sub}</p>
        <SearchBar query={query} onQuery={onQuery} onLoaded={onLoaded} />
      </div>
      <div className="relative z-[2] grid grid-cols-3 px-3 pt-8 pb-6 md:pointer-events-none md:absolute md:inset-0 md:z-[1] md:block md:p-0">
        {FLOATS.map((f) => (
          <Float key={f.slug} f={f} live={live} />
        ))}
      </div>
    </section>
  )
}
