import { useRef } from 'react'
import { useLocale } from '@/core/locale'
import { coreMessages } from '@/core/messages'
import { cn } from '@/core/lib/utils'
import { Faq } from '@/site/components/Faq'
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

const mono = 'font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wide'
const h2 = 'scroll-mt-6 font-semibold text-[1.375rem] leading-tight tracking-tight'
const text = 'text-muted-foreground leading-[1.65] [html:lang(zh)_&]:leading-[1.8]'
const MED = 'max-w-[960px]!'
const WIDE = 'max-w-none!'

// The launch film of the home page with its shots listed under it, each linking to its recipe.
// The home hero is a full-page section with its own heading, so it is not reused here.
function Hero() {
  const locale = useLocale()
  const s = useStrings()
  return (
    <div className={MED}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border">
        <video className="absolute inset-0 size-full object-cover" controls playsInline preload="none" poster={HERO_FILM.poster}>
          <source src={HERO_FILM.mobile} type="video/mp4" media="(max-width: 767px)" />
          <source src={HERO_FILM.src} type="video/mp4" />
        </video>
      </div>
      <ol className="mt-3 list-none p-0" aria-label={s.hero.shots}>
        {HERO.map((seg, i) => {
          const term = bySlug[seg.slug]
          return (
            <li key={seg.slug} className="grid min-h-11 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3 border-t text-[0.9rem] leading-snug last:border-b">
              <span className={mono}>{String(i + 1).padStart(2, '0')}</span>
              <RecipeLink slug={seg.slug} className="font-medium">
                {termName(term, locale)}
              </RecipeLink>
              <span className={mono}>{s.positions[term.pos]}</span>
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
      <figcaption className="mb-3 font-semibold text-[0.9375rem] leading-snug tracking-tight">
        <a className={linkClass} href={film.href} target="_blank" rel="noopener">
          {film.tool}
        </a>
      </figcaption>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border">
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
        {film.facts.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-t py-2">
            <dt className={`pt-0.5 ${mono}`}>{label}</dt>
            <dd className="m-0 text-pretty text-[0.84rem] text-muted-foreground leading-normal">
              <Inline text={value} />
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}

function BlockView({ block: b }: { block: Block }) {
  const t = PAGE_STRINGS[useLocale()]
  switch (b.t) {
    case 'h2':
      return (
        <h2 className={h2} id={anchor(b.text)}>
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
        <div className={MED}>
          <table className="w-full border-collapse text-left text-sm leading-relaxed">
            <thead className="max-sm:sr-only">
              <tr>
                {b.head.map((h) => (
                  <th key={h} className={`whitespace-nowrap border-b pr-4 pb-2.5 text-left font-normal last:pr-0 ${mono}`}>
                    <Inline text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r} className="max-sm:block max-sm:border-t max-sm:py-3 max-sm:first:border-t-0">
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      data-label={plain(b.head[i] ?? '')}
                      className="border-t py-3 pr-4 align-top text-muted-foreground first:font-medium first:text-foreground last:pr-0 max-sm:block max-sm:border-t-0 max-sm:py-1 max-sm:pr-0 max-sm:before:block max-sm:before:font-mono max-sm:before:text-[0.6875rem] max-sm:before:text-muted-foreground max-sm:before:uppercase max-sm:before:tracking-wide max-sm:before:content-[attr(data-label)] max-sm:first:before:hidden [tr:first-child>&]:border-t-0"
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
          <TileGrid terms={b.slugs.map((slug) => bySlug[slug]).filter(Boolean)} />
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
          <h2 className={h2} id={anchor(b.product)}>
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
        <aside className="mt-14 border-t pt-5">
          <h3 className={`mb-2 font-normal ${mono}`}>{t.sources}</h3>
          <ul className="m-0 list-none p-0">
            {b.items.map((x) => (
              <li key={x.url} className="flex flex-wrap items-baseline gap-x-3.5 gap-y-0.5 text-sm leading-normal [&+li]:mt-1.5">
                <Inline text={`[${x.label}](${x.url})`} />
                <span className={mono}>{t.checked(x.checked)}</span>
              </li>
            ))}
          </ul>
        </aside>
      )
  }
}

// Hub pages (films grouped by what people search for) and guides.
export function ContentPage({ data }: { data: PageData }) {
  const locale = useLocale()
  const t = PAGE_STRINGS[locale]
  const { kind, updated, copy } = data

  return (
    <main className="wrap min-h-[70vh] pt-2">
      <div className="flex min-h-13 items-center justify-between gap-3">
        <nav className="flex min-h-11 min-w-0 items-center gap-2 text-muted-foreground text-[0.8125rem]" aria-label={coreMessages[locale].page.breadcrumb}>
          <ol className="flex min-w-0 items-center gap-2">
            <li className="flex items-center">
              <HomeLink className="inline-flex min-h-11 items-center hover:text-foreground">{coreMessages[locale].page.home}</HomeLink>
            </li>
            <li className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true">/</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-foreground" aria-current="page">
                {copy.h1}
              </span>
            </li>
          </ol>
        </nav>
      </div>
      <header className="mt-5 sm:mt-7">
        <h1 className="max-w-[20em] text-balance font-semibold text-[clamp(1.9rem,4vw,3.25rem)] leading-[1.05] tracking-tight">{copy.h1}</h1>
        <p className="mt-4 max-w-[720px] text-pretty text-base text-muted-foreground leading-relaxed sm:text-[1.0625rem]">
          <Inline text={copy.lede} />
        </p>
        {kind === 'guide' && <p className={`mt-4 ${mono}`}>{t.updated(updated)}</p>}
      </header>
      <div className="mt-10 [overflow-wrap:break-word] sm:mt-12 [&>*]:max-w-[720px] [&>*+*]:mt-[18px] [&>h2+*]:mt-4 [&>h2]:mt-11 sm:[&>h2]:mt-14">
        {copy.blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
    </main>
  )
}
