import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useLocale, useLocaleParam } from '@/core/locale'
import { coreMessages } from '@/core/messages'
import { cn } from '@/core/lib/utils'
import { Faq } from '@/site/components/Faq'
import { HUBS } from '@/site/components/home/SearchBar'
import { CommandBox } from '@/site/components/home/SkillInstall'
import { TileGrid } from '@/site/components/TileGrid'
import { Inline, linkClass, plain } from '@/site/components/page/inline'
import type { PageData } from '@/site/components/page/load'
import { PAGE_STRINGS } from '@/site/components/page/strings'
import { MEDIA_URL, SKILL_INSTALL } from '@/site/config'
import type { Block, ShowcaseFilm } from '@/site/data/content'
import { HERO, HERO_FILM } from '@/site/data/hero'
import { bySlug, termName } from '@/site/data/terms'
import { HomeLink, RecipeLink } from '@/site/lib/links'
import { useStrings } from '@/site/lib/strings'
import { track } from '@/core/track'

const anchor = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')

const label = 'text-[0.8125rem] font-semibold text-muted-foreground'
const h2 = 'scroll-mt-6 text-[1.625rem] text-foreground leading-tight'
const h2Guide = 'sm:text-[2rem]'
const text = 'text-[1.0625rem] text-muted-foreground leading-[1.65] [html:lang(zh)_&]:leading-[1.8]'
const MED = 'max-w-[960px]!'
const WIDE = 'max-w-none!'

// Rows of the content column: spacing between blocks and before headings.
const flow = '[overflow-wrap:break-word] [&>*+*]:mt-[18px] [&>h2+*]:mt-3 [&>h2]:mt-10'

// Home / current page, C's .crumbs.
function Crumbs({ current }: { current: string }) {
  const locale = useLocale()
  return (
    <nav className="flex min-h-14 min-w-0 items-center text-[0.875rem] text-muted-foreground sm:min-h-[62px] sm:text-[0.9375rem]" aria-label={coreMessages[locale].page.breadcrumb}>
      <ol className="flex min-w-0 items-center gap-2">
        <li className="flex items-center">
          <HomeLink className="inline-flex min-h-11 items-center hover:text-foreground">{coreMessages[locale].page.home}</HomeLink>
        </li>
        <li className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true">/</span>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-foreground" aria-current="page">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  )
}

// The five hubs as pills, the current one filled.
function HubChips({ current }: { current: string }) {
  const s = useStrings()
  const locale = useLocaleParam()
  return (
    <nav className="flex flex-wrap gap-2" aria-label={s.shelves.types}>
      {HUBS.map((hub) => (
        <Link
          key={hub}
          to="/{-$locale}/$hub/"
          params={{ locale, hub }}
          aria-current={hub === current ? 'page' : undefined}
          className={cn(
            'inline-flex h-9 items-center rounded-full px-3.5 font-semibold text-sm transition-[background-color,color,transform] hover:-translate-y-px sm:h-10 sm:px-[18px] sm:text-[0.9375rem]',
            hub === current ? 'bg-foreground text-background' : 'bg-card text-foreground shadow-soft',
          )}
        >
          {s.hubs[hub]}
        </Link>
      ))}
    </nav>
  )
}

// The launch film of the home page with its shots listed under it, each linking to its recipe.
// The home hero is a full-page section with its own heading, so it is not reused here.
function Hero() {
  const locale = useLocale()
  const s = useStrings()
  return (
    <div className={MED}>
      <div className="relative aspect-video overflow-hidden rounded-media bg-media shadow-film">
        <video className="absolute inset-0 size-full object-cover" controls playsInline preload="none" poster={HERO_FILM.poster}>
          <source src={HERO_FILM.mobile} type="video/mp4" media="(max-width: 767px)" />
          <source src={HERO_FILM.src} type="video/mp4" />
        </video>
      </div>
      <ol className="mt-4 list-none overflow-hidden rounded-card-sm bg-surface p-0" aria-label={s.hero.shots}>
        {HERO.map((seg, i) => {
          const term = bySlug[seg.slug]
          return (
            <li key={seg.slug} className="grid min-h-12 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3 border-t px-5 text-[0.9375rem] leading-snug first:border-t-0">
              <span className={`${label} tabular-nums`}>{String(i + 1).padStart(2, '0')}</span>
              <RecipeLink slug={seg.slug} className="font-semibold">
                {termName(term, locale)}
              </RecipeLink>
              <span className={label}>{s.positions[term.pos]}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// One film of a showcase: tool link, the film, and its facts. Plays are counted once per page load.
function ShowFilm({ film, product }: { film: ShowcaseFilm; product: string }) {
  const t = PAGE_STRINGS[useLocale()]
  const counted = useRef(false)
  const base = `${MEDIA_URL}/${film.video}`
  return (
    <figure className="m-0 min-w-0">
      <figcaption className="mb-3 font-semibold text-base leading-snug">
        <a className={linkClass} href={film.href} target="_blank" rel="noopener">
          {film.tool}
        </a>
      </figcaption>
      <div className="relative aspect-video overflow-hidden rounded-media bg-media shadow-film">
        <video
          className="absolute inset-0 size-full object-cover"
          controls
          playsInline
          preload="none"
          poster={`${base}.jpg`}
          aria-label={t.filmFor(film.tool, product)}
          onPlay={() => {
            if (counted.current) return
            counted.current = true
            track('video_play', { recipe: film.video, page: location.pathname, trigger: 'click' })
          }}
        >
          <source src={`${base}-m.mp4`} type="video/mp4" media="(max-width: 767px)" />
          <source src={`${base}.mp4`} type="video/mp4" />
        </video>
      </div>
      <dl className="mt-3 tabular-nums">
        {film.facts.map(([k, value]) => (
          <div key={k} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-t py-2">
            <dt className={`pt-0.5 ${label}`}>{k}</dt>
            <dd className="m-0 text-pretty text-[0.875rem] text-muted-foreground leading-normal">
              <Inline text={value} />
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}

function BlockView({ block: b, guide }: { block: Block; guide: boolean }) {
  const t = PAGE_STRINGS[useLocale()]
  switch (b.t) {
    case 'h2':
      return (
        <h2 className={cn(h2, guide && h2Guide)} id={anchor(b.text)}>
          {b.text}
        </h2>
      )
    case 'p':
      return (
        <p className={text}>
          <Inline text={b.text} />
        </p>
      )
    case 'ul':
    case 'ol': {
      const List = b.t
      return (
        <List className={cn('pl-[22px] marker:text-muted-foreground', b.t === 'ul' ? 'list-disc' : 'list-decimal')}>
          {b.items.map((item) => (
            <li key={item} className={`${text} [&+li]:mt-2`}>
              <Inline text={item} />
            </li>
          ))}
        </List>
      )
    }
    case 'table':
      return (
        <div className={cn(MED, 'overflow-hidden rounded-media bg-card shadow-soft')}>
          <table className="w-full border-collapse text-left text-[0.9375rem] leading-relaxed">
            <thead className="max-sm:sr-only">
              <tr className="bg-surface">
                {b.head.map((h) => (
                  <th key={h} className={`whitespace-nowrap px-4 py-3 text-left ${label}`}>
                    <Inline text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r} className="max-sm:block max-sm:border-t max-sm:px-4 max-sm:py-3 max-sm:first:border-t-0">
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      data-label={plain(b.head[i] ?? '')}
                      className="border-t px-4 py-3 align-top text-muted-foreground first:font-semibold first:text-foreground max-sm:block max-sm:border-t-0 max-sm:px-0 max-sm:py-1 max-sm:before:block max-sm:before:font-semibold max-sm:before:text-[0.8125rem] max-sm:before:text-muted-foreground max-sm:before:content-[attr(data-label)] max-sm:first:before:hidden"
                    >
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'films':
      return (
        <div className={WIDE}>
          <FilmGrid slugs={b.slugs} />
        </div>
      )
    case 'hero':
      return <Hero />
    case 'cmd':
      return <CommandBox text={b.text} what={b.text === SKILL_INSTALL ? 'install' : 'command'} />
    case 'faq':
      return <Faq items={b.items.map(([q, a]) => [<Inline key="q" text={q} />, <Inline key="a" text={a} />])} />
    case 'showcase':
      return (
        <>
          <h2 className={cn(h2, guide && h2Guide)} id={anchor(b.product)}>
            <a className="underline decoration-transparent underline-offset-6 transition-[text-decoration-color] hover:decoration-border" href={b.url} target="_blank" rel="noopener">
              {b.product}
            </a>
          </h2>
          <p className={text}>
            <Inline text={b.story} />
          </p>
          <div className={cn(WIDE, 'grid grid-cols-1 items-start gap-10 min-[881px]:grid-cols-3 min-[881px]:gap-6')}>
            {b.films.map((film) => (
              <ShowFilm key={film.video} film={film} product={b.product} />
            ))}
          </div>
        </>
      )
    case 'sources':
      return (
        <aside className="mt-14 rounded-card-sm bg-surface px-5 py-5 sm:px-6">
          <h3 className={`mb-2 text-[0.9375rem] ${label}`}>{t.sources}</h3>
          <ul className="m-0 list-none p-0">
            {b.items.map((x) => (
              <li key={x.url} className="flex flex-wrap items-baseline gap-x-3.5 gap-y-0.5 text-[0.9375rem] leading-normal [&+li]:mt-1.5">
                <Inline text={`[${x.label}](${x.url})`} />
                <span className={label}>{t.checked(x.checked)}</span>
              </li>
            ))}
          </ul>
        </aside>
      )
  }
}

// Cards of a films block. TileGrid has no column prop: hubs and guides use three columns at every width above phones (C's .hub-grid)
// by overriding its column class from the wrapper.
function FilmGrid({ slugs }: { slugs: string[] }) {
  return (
    <div className="min-[1200px]:[&>div]:grid-cols-3">
      <TileGrid terms={slugs.map((slug) => bySlug[slug]).filter(Boolean)} />
    </div>
  )
}

// Hub pages (films grouped by what people search for) and guides.
export function ContentPage({ data }: { data: PageData }) {
  const locale = useLocale()
  const t = PAGE_STRINGS[locale]
  const { kind, updated, copy } = data
  const hub = kind === 'hub'

  if (hub) {
    const grid = copy.blocks.filter((b) => b.t === 'films')
    const rest = copy.blocks.filter((b) => b.t !== 'films')
    return (
      <main className="min-h-[70vh] bg-hub">
        <div className="wrap">
          <Crumbs current={copy.h1} />
          <header className="flex flex-col items-start gap-4 pt-1 pb-6 sm:pt-4 sm:pb-10">
            <h1 className="max-w-[900px] text-[2.5rem] text-foreground leading-[1.02] min-[768px]:text-[3.75rem] min-[1280px]:text-[4.5rem]">{copy.h1}</h1>
            <p className="m-0 max-w-[720px] text-pretty text-[1.0625rem] text-muted-foreground leading-snug sm:text-xl">
              <Inline text={copy.short ?? copy.lede} />
            </p>
            <HubChips current={data.id} />
          </header>
          {grid.map((block, i) => (
            <BlockView key={i} block={block} guide={false} />
          ))}
          <section className={cn('my-24 max-w-[760px]', flow)}>
            <p className={text}>
              <Inline text={copy.lede} />
            </p>
            {rest.map((block, i) => (
              <BlockView key={i} block={block} guide={false} />
            ))}
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[70vh] bg-hub">
      <div className="wrap">
        <Crumbs current={copy.h1} />
        <header className="flex flex-col items-start gap-4 pt-1 pb-6 sm:pt-4 sm:pb-10">
          <h1 className="max-w-[900px] text-[2.25rem] text-foreground leading-[1.02] min-[768px]:text-[3.5rem]">{copy.h1}</h1>
          <p className="m-0 max-w-[760px] text-pretty text-[1.0625rem] text-muted-foreground leading-snug sm:text-xl">
            <Inline text={copy.lede} />
          </p>
          <p className="m-0 text-[0.9375rem] text-ink-3">
            <time dateTime={updated}>{t.updated(updated)}</time>
          </p>
        </header>
        <div className={cn('pb-24 [&>*]:max-w-[760px]', flow)}>
          {copy.blocks.map((block, i) => (
            <BlockView key={i} block={block} guide />
          ))}
        </div>
      </div>
    </main>
  )
}
