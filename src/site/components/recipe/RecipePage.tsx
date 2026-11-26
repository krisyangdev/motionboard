import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocale } from '@/core/locale'
import { buttonVariants } from '@/core/ui/button'
import { CopyAction, LikeButton, SaveButton, WishButton } from '@/site/components/actions'
import { TileGrid } from '@/site/components/TileGrid'
import { FullRecipe } from '@/site/components/recipe/FullRecipe'
import { Compare } from '@/site/components/recipe/Compare'
import { Player } from '@/site/components/recipe/Player'
import { SourceClip } from '@/site/components/recipe/SourceClip'
import { InstallCommand } from '@/site/components/home/SkillInstall'
import { byPos, order, shotName, sources, termName, type RecipeText, type Term } from '@/site/data/terms'
import { gsap, ScrollTrigger, useGSAP } from '@/site/lib/gsap'
import { HomeLink, RecipeLink, useGoToRecipe } from '@/site/lib/links'
import { useStat } from '@/site/lib/stats'
import { Faq } from '@/site/components/Faq'
import { useStrings } from '@/site/lib/strings'

const h2 = 'mb-4 font-semibold text-xl leading-tight tracking-tight'

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

export function RecipePage({ term: t, text }: { term: Term; text: RecipeText }) {
  const root = useRef<HTMLDivElement>(null)
  const goTo = useGoToRecipe()
  const locale = useLocale()
  const s = useStrings()
  const { copies } = useStat(t.slug)

  const i = order.findIndex((x) => x.slug === t.slug)
  const prev = order[(i - 1 + order.length) % order.length]
  const next = order[(i + 1) % order.length]
  const clips = sources(t, locale)
  // Selected source index, tied to the slug so navigating to another recipe starts at the first source.
  const [pick, setPick] = useState({ slug: t.slug, k: 0 })
  const k = pick.slug === t.slug ? pick.k : 0
  const selected = clips[k]
  const compare = useRef<HTMLDivElement>(null)
  const name = termName(t, locale)
  const shot = shotName(t, locale)
  const more = byPos(t.pos).filter((x) => x.slug !== t.slug)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || typing(e.target)) return
      if (e.key === 'ArrowLeft') goTo(prev.slug)
      else if (e.key === 'ArrowRight') goTo(next.slug)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, prev.slug, next.slug])

  const select = (idx: number) => {
    setPick({ slug: t.slug, k: idx })
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    compare.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  // Lower sections fade up once as they scroll into view.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-rv]').forEach((el) => {
          gsap.from(el, {
            y: 18,
            opacity: 0,
            duration: 0.7,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          })
        })
        ScrollTrigger.refresh()
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <main className="wrap min-h-[70vh] pt-2" ref={root}>
      <div className="mx-auto flex min-h-13 max-w-[var(--site-width)] items-center justify-between gap-3">
        <nav className="flex min-h-11 min-w-0 items-center gap-2 text-muted-foreground text-[0.8125rem]" aria-label={s.recipe.breadcrumb}>
          <HomeLink hash="recipes" className="inline-flex min-h-11 items-center hover:text-foreground">
            {s.nav.recipes}
          </HomeLink>
          <span aria-hidden="true">/</span>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-foreground" aria-current="page">
            {s.positions[t.pos]}
          </span>
        </nav>
        <div className="flex shrink-0 gap-2">
          <RecipeLink slug={prev.slug} className={buttonVariants({ variant: 'outline', size: 'icon-lg' })} aria-label={s.recipe.prev(termName(prev, locale))}>
            <ChevronLeft aria-hidden="true" />
          </RecipeLink>
          <RecipeLink slug={next.slug} className={buttonVariants({ variant: 'outline', size: 'icon-lg' })} aria-label={s.recipe.next(termName(next, locale))}>
            <ChevronRight aria-hidden="true" />
          </RecipeLink>
        </div>
      </div>

      <div className="rc-compare mx-auto mt-1 max-w-[var(--site-width)] scroll-mt-4" ref={compare}>
        {selected ? (
          <Compare term={t} source={selected} />
        ) : (
          <figure className="m-0 min-w-0">
            <Player term={t} />
            <figcaption className="mt-1 flex h-7 items-center font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wide">
              <span className="min-w-0 truncate">{s.recipe.recreationOnly}</span>
            </figcaption>
          </figure>
        )}
      </div>

      <div className="mx-auto max-w-[var(--site-width)]">
        <header className="mt-5 sm:mt-7">
          <h1 className="text-balance font-semibold text-[clamp(1.9rem,4vw,3.25rem)] leading-[1.05] tracking-tight" style={{ viewTransitionName: 'title' }}>
            {name}
          </h1>
          {shot.toLowerCase() !== name.toLowerCase() && (
            <p className="mt-2.5 font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wide">{s.recipe.shot(shot)}</p>
          )}
          <p className="mt-3.5 max-w-[60ch] text-pretty text-base text-muted-foreground leading-relaxed sm:text-[1.0625rem]">{t.def[locale]}</p>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <CopyAction term={t} />
          <LikeButton slug={t.slug} />
          <SaveButton slug={t.slug} />
          {copies > 0 && <span className="mx-1.5 font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wide">{s.recipe.copiedTimes(copies)}</span>}
          <div className="max-[720px]:w-full min-[721px]:ml-auto">
            <WishButton slug={t.slug} />
          </div>
        </div>

        {clips.length > 1 && (
          <section className="mt-14 sm:mt-18" data-rv>
            <h2 className={h2}>{s.recipe.seenIn}</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3">
              {clips.map((c, idx) => (
                <SourceClip key={`${c.href}-${idx}`} source={c} selected={idx === k} onSelect={() => select(idx)} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 sm:mt-18" data-rv>
          <h2 className={h2}>{s.recipe.howto(name)}</h2>
          {text.seo.howto.map((p) => (
            <p key={p} className="mb-3.5 max-w-[64ch] text-muted-foreground leading-relaxed">
              {p}
            </p>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <InstallCommand />
          </div>
        </section>

        <section className="mt-14 sm:mt-18">
          <FullRecipe term={t} text={text} />
        </section>

        <section className="mt-14 sm:mt-18" data-rv>
          <h2 className={h2}>{s.recipe.faq}</h2>
          <Faq items={text.seo.faq} />
        </section>
      </div>
      {more.length > 0 && (
        <section className="mt-14 sm:mt-18" data-rv>
          <h2 className={h2}>{s.recipe.more(s.positions[t.pos])}</h2>
          <TileGrid terms={more} />
        </section>
      )}
    </main>
  )
}
