import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useLocaleParam } from '@/core/locale'
import { terms } from '@/site/data/terms'
import { useStrings } from '@/site/lib/strings'

export const HUBS = ['text-animation', 'logo-animation', 'transitions', 'ui-animation', 'product-reveal'] as const

// The search haystack (names, shot names and the phrases people use for the shot) is a separate chunk,
// imported on first focus or input, so no page carries it.
let haystack: Record<string, string> | null = null
let loading: Promise<Record<string, string>> | null = null

export const getHaystack = () => haystack

export function loadHaystack() {
  loading ??= import('@/site/data/gen/search.json').then((m) => (haystack = m.default as Record<string, string>))
  return loading
}

export function scrollToRecipes() {
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById('recipes')?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
}

const chip =
  'inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full px-3.5 font-semibold text-sm shadow-soft transition-[background-color,color,translate] duration-200 hover:-translate-y-px md:h-10 md:px-[18px] md:text-[15px]'

// The hero action: a big search field and the hub chips. The query lives in HomePage and filters the grid below.
export function SearchBar({ query, onQuery, onLoaded }: { query: string; onQuery: (q: string) => void; onLoaded: () => void }) {
  const s = useStrings()
  const locale = useLocaleParam()
  const input = useRef<HTMLInputElement>(null)
  const load = () => void loadHaystack().then(onLoaded)

  // "/" focuses the field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return
      e.preventDefault()
      input.current?.focus()
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex w-full max-w-[640px] flex-col items-center gap-4" role="search">
      <label className="relative flex h-12 w-full cursor-text items-center rounded-full bg-card pr-5 pl-[52px] shadow-search transition-shadow focus-within:ring-3 focus-within:ring-primary md:h-16">
        <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          ref={input}
          type="search"
          value={query}
          aria-label={s.shelves.search}
          placeholder={s.shelves.searchPlaceholder(terms.length)}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className="h-full min-w-0 flex-1 appearance-none border-0 bg-transparent font-medium text-[17px] text-foreground outline-none placeholder:text-ink-3 md:text-lg [&::-webkit-search-cancel-button]:appearance-none"
          onFocus={load}
          onChange={(e) => {
            load()
            onQuery(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && query) {
              e.preventDefault()
              onQuery('')
            } else if (e.key === 'Enter') {
              e.preventDefault()
              scrollToRecipes()
            }
          }}
        />
        <kbd className="hidden rounded-md bg-surface-2 px-2 py-0.5 font-medium font-sans text-[13px] text-muted-foreground md:inline-block">/</kbd>
      </label>
      <nav className="-mx-4 flex flex-nowrap justify-start gap-2 self-stretch overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-wrap md:justify-center md:self-auto md:overflow-visible md:px-0" aria-label={s.shelves.types}>
        <button
          type="button"
          className={`${chip} bg-foreground text-background`}
          onClick={() => {
            onQuery('')
            scrollToRecipes()
          }}
        >
          {s.hero.all}
        </button>
        {HUBS.map((hub) => (
          <Link key={hub} to="/{-$locale}/$hub/" params={{ locale, hub }} className={`${chip} bg-(--chip-bg) text-foreground`}>
            {s.hubs[hub]}
          </Link>
        ))}
      </nav>
    </div>
  )
}
