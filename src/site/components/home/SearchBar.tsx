import { Link } from '@tanstack/react-router'
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

export function SearchBar({ query, onQuery, onLoaded }: { query: string; onQuery: (q: string) => void; onLoaded: () => void }) {
  const s = useStrings()
  const locale = useLocaleParam()
  const load = () => void loadHaystack().then(onLoaded)

  return (
    <div className="wrap grid gap-2 pt-1 pb-1">
      <input
        type="search"
        value={query}
        aria-label={s.shelves.search}
        placeholder={s.shelves.searchPlaceholder(terms.length)}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className="h-11 w-full rounded-lg bg-background px-3.5 text-base outline-none ring-1 ring-border placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand sm:text-sm"
        onFocus={load}
        onChange={(e) => {
          load()
          onQuery(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && query) {
            e.preventDefault()
            onQuery('')
          }
        }}
      />
      <nav className="flex flex-wrap items-center gap-1" aria-label={s.shelves.types}>
        {HUBS.map((hub) => (
          <Link
            key={hub}
            to="/{-$locale}/$hub/"
            params={{ locale, hub }}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3.5 font-medium text-muted-foreground text-sm ring-1 ring-border transition-colors hover:bg-accent hover:text-foreground"
          >
            {s.hubs[hub]}
          </Link>
        ))}
      </nav>
    </div>
  )
}
