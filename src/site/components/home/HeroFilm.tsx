import { useLocale } from '@/core/locale'
import { LCP } from '@/core/ui/page/link'
import { SearchBar } from '@/site/components/home/SearchBar'
import { BRAND } from '@/site/config'

// The hero: one headline line, the search as the hero action and the hub chips. The effects grid starts right below it.
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

export function HeroFilm({ query, onQuery, onLoaded }: { query: string; onQuery: (q: string) => void; onLoaded: () => void }) {
  const locale = useLocale()

  return (
    <section className="relative overflow-hidden bg-hero after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-8 after:bg-linear-to-b after:from-transparent after:to-background">
      <div className="relative z-[1] mx-auto flex w-full max-w-[1100px] flex-col items-center px-4 pt-5 pb-5 text-center md:px-8 md:pt-9 md:pb-8">
        <h1 {...LCP} className="hero-h1 mb-5 text-[34px] leading-[1.05] [font-variation-settings:'opsz'_96] md:mb-7 md:text-[46px] xl:text-[54px]">
          <Headline text={BRAND.headline[locale]} />
        </h1>
        <SearchBar query={query} onQuery={onQuery} onLoaded={onLoaded} />
      </div>
    </section>
  )
}
