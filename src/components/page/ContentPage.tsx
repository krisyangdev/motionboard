import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { burst, writeClipboard } from '@/components/CopyButton'
import { TileGrid } from '@/components/TileGrid'
import { Inline } from '@/components/page/inline'
import type { PageData } from '@/components/page/load'
import { PAGE_STRINGS } from '@/components/page/strings'
import type { Block, ShowcaseFilm } from '@/data/content'
import { HERO, HERO_FILM } from '@/data/hero'
import { PAGES } from '@/data/pages'
import { bySlug, termName } from '@/data/terms'
import { PageLink, useLocale, useStrings } from '@/lib/locale'
import { track } from '@/lib/track'
import { MEDIA_URL, SITE, SKILL_INSTALL } from '@/site.config'

const anchor = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')

/** Header text without the inline link and code marks, for the phone layout's cell labels. */
const plain = (t: string) => t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`/g, '')

// A one-line command with a copy button, in the look of the home page's skill install box.
function Command({ text }: { text: string }) {
  const s = useStrings()
  const btn = useRef<HTMLButtonElement>(null)
  const timer = useRef<number>(0)
  const [done, setDone] = useState(false)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    await writeClipboard(text)
    track('copy', { tool: SITE.id, what: text === SKILL_INSTALL ? 'install' : 'command', page: location.pathname })
    if (btn.current) burst(btn.current)
    setDone(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 1600)
  }

  return (
    <div className="skill-box">
      <code>{text}</code>
      <button ref={btn} type="button" className="btn ghost icon" aria-label={done ? s.actions.copied : s.skill.copy} onClick={copy}>
        {done ? <Check aria-hidden /> : <Copy aria-hidden />}
      </button>
    </div>
  )
}

// The launch film of the home page with its shots listed under it, each linking to its recipe.
// The home hero is a full-page section with its own heading, so it is not reused here.
function Hero() {
  const locale = useLocale()
  const s = useStrings()
  return (
    <div className="pg-med">
      <div className="frame">
        <video controls playsInline preload="none" poster={HERO_FILM.poster}>
          <source src={HERO_FILM.mobile} type="video/mp4" media="(max-width: 767px)" />
          <source src={HERO_FILM.src} type="video/mp4" />
        </video>
      </div>
      <ol className="pg-segs" aria-label={s.hero.shots}>
        {HERO.map((seg, i) => {
          const term = bySlug[seg.slug]
          return (
            <li key={seg.slug}>
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              <PageLink to={{ page: 'recipe', slug: seg.slug }}>{termName(term, locale)}</PageLink>
              <span className="mono">{s.positions[term.pos]}</span>
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
    <figure className="pg-film">
      <figcaption>
        <a href={film.href} target="_blank" rel="noopener">
          {film.tool}
        </a>
      </figcaption>
      <div className="frame">
        <video
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
      <dl>
        {film.facts.map(([label, value]) => (
          <div key={label}>
            <dt className="mono">{label}</dt>
            <dd>
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
      return <h2 id={anchor(b.text)}>{b.text}</h2>
    case 'p':
      return (
        <p>
          <Inline text={b.text} />
        </p>
      )
    case 'ul':
    case 'ol': {
      const List = b.t
      return (
        <List>
          {b.items.map((item) => (
            <li key={item}>
              <Inline text={item} />
            </li>
          ))}
        </List>
      )
    }
    case 'table':
      return (
        <div className="pg-med pg-table">
          <table>
            <thead>
              <tr>
                {b.head.map((h) => (
                  <th key={h}>
                    <Inline text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td key={i} data-label={plain(b.head[i] ?? '')}>
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
        <div className="pg-wide">
          <TileGrid terms={b.slugs.map((slug) => bySlug[slug]).filter(Boolean)} />
        </div>
      )
    case 'hero':
      return <Hero />
    case 'cmd':
      return <Command text={b.text} />
    case 'faq':
      return (
        <div className="faq">
          {b.items.map(([q, a]) => (
            <details key={q}>
              <summary>
                <Inline text={q} />
              </summary>
              <p>
                <Inline text={a} />
              </p>
            </details>
          ))}
        </div>
      )
    case 'showcase':
      return (
        <>
          <h2 id={anchor(b.product)}>
            <a href={b.url} target="_blank" rel="noopener">
              {b.product}
            </a>
          </h2>
          <p>
            <Inline text={b.story} />
          </p>
          <div className="pg-wide pg-show">
            {b.films.map((film) => (
              <ShowFilm key={film.video} film={film} product={b.product} />
            ))}
          </div>
        </>
      )
    case 'sources':
      return (
        <aside className="pg-src">
          <h3 className="mono">{t.sources}</h3>
          <ul>
            {b.items.map((x) => (
              <li key={x.url}>
                <Inline text={`[${x.label}](${x.url})`} />
                <span className="mono">{t.checked(x.checked)}</span>
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
  const s = useStrings()
  const t = PAGE_STRINGS[locale]
  const { id, kind, updated, copy } = data
  const label = PAGES.find((p) => p.id === id)!.label[locale]

  return (
    <main className="wrap gut pg">
      <div className="rc-top">
        <nav className="rc-crumbs" aria-label={s.recipe.breadcrumb}>
          {kind === 'hub' ? <PageLink to={{ page: 'home', hash: 'recipes' }}>{s.nav.recipes}</PageLink> : <span>{t.guides}</span>}
          <span aria-hidden="true">/</span>
          <span aria-current="page">{label}</span>
        </nav>
      </div>
      <header className="pg-head">
        <h1>{copy.h1}</h1>
        <p className="pg-lede">
          <Inline text={copy.lede} />
        </p>
        {kind === 'guide' && <p className="mono pg-meta">{t.updated(updated)}</p>}
      </header>
      <div className="pg-body">
        {copy.blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
    </main>
  )
}
