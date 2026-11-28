import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocale } from '@/core/locale'
import { coreMessages } from '@/core/messages'
import { CopyAction, LikeButton, SaveButton, WishLink } from '@/site/components/actions'
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
import { Faq, foldClass, foldSummary } from '@/site/components/Faq'
import { useStrings } from '@/site/lib/strings'

const h2 = 'text-[1.625rem] leading-tight md:text-[2rem]'
const h2Small = 'mb-4 text-[1.625rem] leading-tight'
const navBtn = 'inline-flex size-10 items-center justify-center rounded-full bg-card text-foreground shadow-soft transition-colors hover:bg-surface pointer-coarse:size-11'

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
    root.current?.querySelector('[data-original]')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
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
    <main className="min-h-[70vh] bg-recipe" ref={root}>
      <div className="wrap pt-2">
        <div className="flex min-h-13 items-center justify-between gap-3">
          <nav className="flex min-h-11 min-w-0 items-center text-[0.875rem] text-muted-foreground md:text-[0.9375rem]" aria-label={coreMessages[locale].page.breadcrumb}>
            <ol className="flex min-w-0 items-center gap-2">
              <li className="flex items-center">
                <HomeLink className="inline-flex min-h-11 items-center hover:text-foreground">{coreMessages[locale].page.home}</HomeLink>
              </li>
              <li className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true">/</span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-foreground" aria-current="page">
                  {name}
                </span>
              </li>
            </ol>
          </nav>
          <div className="flex shrink-0 gap-2">
            <RecipeLink slug={prev.slug} className={navBtn} aria-label={s.recipe.prev(termName(prev, locale))}>
              <ChevronLeft aria-hidden="true" className="size-5" />
            </RecipeLink>
            <RecipeLink slug={next.slug} className={navBtn} aria-label={s.recipe.next(termName(next, locale))}>
              <ChevronRight aria-hidden="true" className="size-5" />
            </RecipeLink>
          </div>
        </div>

        <div className="mt-1 grid items-center gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
          <div className="min-w-0">
            <div className="rounded-[20px] bg-card p-[5px] shadow-film md:rounded-[2rem] md:p-2 md:motion-safe:-rotate-1">
              <Player term={t} />
            </div>
            {!selected && <p className="mt-4 text-[15px] text-muted-foreground">{s.recipe.recreationOnly}</p>}
          </div>

          <div className="flex min-w-0 flex-col gap-3 md:gap-4">
            <span className="inline-flex self-start rounded-full bg-card px-3.5 py-1.5 font-semibold text-[15px] text-kicker shadow-soft">
              {s.positions[t.pos]} · {s.recipe.filmLength(t.dur)}
            </span>
            <h1 className="m-0 text-balance text-[34px] leading-[1.04] md:text-[52px]" style={{ viewTransitionName: 'title' }}>
              {name}
            </h1>
            <p className="m-0 line-clamp-3 text-pretty text-base text-muted-foreground md:text-lg">{t.def[locale]}</p>
            {shot.toLowerCase() !== name.toLowerCase() && <p className="m-0 text-[13px] text-muted-foreground">{s.recipe.shot(shot)}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <CopyAction term={t} className="max-md:w-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LikeButton slug={t.slug} />
              <SaveButton slug={t.slug} />
              {copies >= 10 && <span className="mx-1.5 text-[13px] text-muted-foreground">{s.recipe.copiedTimes(copies)}</span>}
            </div>
          </div>
        </div>

        {selected && (
          <section className="mt-14 md:mt-20" data-rv>
            <h2 className={h2}>{s.recipe.seenIn}</h2>
            <div className="mt-4 grid items-start gap-4 md:mt-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
              <Compare source={selected} />
              <div className="flex flex-col gap-3">
                {clips.map((c, idx) => (
                  <SourceClip key={`${c.href}-${idx}`} source={c} selected={idx === k} onSelect={() => select(idx)} />
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="max-w-[800px]">
          <section className="mt-14 md:mt-[4.5rem]" data-rv>
            <h2 className={h2Small}>{s.recipe.howto(name)}</h2>
            <p className="mb-4 text-base text-muted-foreground leading-relaxed">{s.recipe.pasteLine}</p>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <InstallCommand />
            </div>
            <details className={foldClass}>
              <summary className={foldSummary}>
                <span>{s.recipe.built}</span>
              </summary>
              <div className="px-5 pb-[18px] md:px-6">
                {text.seo.howto.map((p) => (
                  <p key={p} className="mb-3 text-base text-muted-foreground leading-relaxed last:mb-0">
                    {p}
                  </p>
                ))}
              </div>
            </details>
            <FullRecipe term={t} text={text} />
          </section>

          <section className="mt-10" data-rv>
            <h2 className={h2Small}>{s.recipe.faq}</h2>
            <Faq items={text.seo.faq} />
          </section>

          <div className="mt-14">
            <WishLink slug={t.slug} />
          </div>
        </div>

        {more.length > 0 && (
          <section className="mt-14 md:mt-20" data-rv>
            <h2 className={h2}>{s.recipe.more(s.positions[t.pos])}</h2>
            <div className="mt-4 md:mt-6">
              <TileGrid terms={more} />
            </div>
          </section>
        )}
        <div className="h-16 md:h-20" aria-hidden="true" />
      </div>
    </main>
  )
}
