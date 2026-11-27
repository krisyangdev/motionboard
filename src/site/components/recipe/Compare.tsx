import { Film, Player } from '@/site/components/recipe/Player'
import type { Source, Term } from '@/site/data/terms'
import { useStrings } from '@/site/lib/strings'

const mono = 'font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wide'
const outLink = 'flex shrink-0 -my-4 -mr-1 min-h-11 items-center px-1 text-muted-foreground hover:text-foreground'

export function Compare({ term, source }: { term: Term; source: Source }) {
  const { clip } = source
  const { recipe } = useStrings()
  return (
    // Below 768px the grid dissolves (contents) so RecipePage can interleave both figures with the header and actions.
    <div className="grid grid-cols-1 gap-5 max-md:contents min-[900px]:grid-cols-2 min-[900px]:gap-3">
      <figure className="m-0 min-w-0 scroll-mt-4 max-md:order-5 max-md:mt-6" data-original>
        {clip ? (
          <Film src={clip.src} poster={clip.poster} name={recipe.originalAria(source.title)} />
        ) : (
          <a
            className="relative flex aspect-video flex-col justify-between overflow-hidden rounded-xl bg-muted p-4 ring-1 ring-border transition-colors hover:bg-accent"
            href={source.href}
            target="_blank"
            rel="noopener"
          >
            <span className="block min-w-0">
              <span className="block font-semibold text-[0.9375rem] leading-snug tracking-tight">{source.title}</span>
              <span className={`mt-1 block ${mono}`}>{source.range}</span>
            </span>
            <span className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-full bg-primary px-3.5 font-semibold text-primary-foreground text-sm">
              {source.youtube ? recipe.watchOnYouTube : recipe.watchOnX}
            </span>
          </a>
        )}
        <figcaption className={`mt-1 flex h-7 min-w-0 items-center justify-between gap-3 ${mono}`}>
          <span className="min-w-0 truncate">
            {recipe.original} · {source.title} · {source.range}
          </span>
          {clip && (
            <a className={outLink} href={source.href} target="_blank" rel="noopener">
              YouTube ↗
            </a>
          )}
        </figcaption>
      </figure>
      <figure className="m-0 min-w-0 max-md:order-1 max-md:mt-1 md:max-[899px]:-order-1">
        <Player term={term} />
        <figcaption className={`mt-1 flex h-7 min-w-0 items-center justify-between gap-3 ${mono}`}>
          <span className="min-w-0 truncate">{recipe.recreation}</span>
        </figcaption>
      </figure>
    </div>
  )
}
