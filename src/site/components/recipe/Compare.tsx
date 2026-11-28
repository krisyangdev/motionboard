import { Film } from '@/site/components/recipe/Player'
import type { Source } from '@/site/data/terms'
import { useStrings } from '@/site/lib/strings'

// The selected original film of a recipe (the recreation lives in the top frame of the page).
export function Compare({ source }: { source: Source }) {
  const { clip } = source
  const { recipe } = useStrings()
  return (
    <figure className="m-0 min-w-0 scroll-mt-4" data-original>
      {clip ? (
        <Film src={clip.src} poster={clip.poster} name={recipe.originalAria(source.title)} />
      ) : (
        <a
          className="relative flex aspect-video flex-col justify-between overflow-hidden rounded-media bg-card p-4 shadow-soft transition-colors hover:bg-surface"
          href={source.href}
          target="_blank"
          rel="noopener"
        >
          <span className="block min-w-0">
            <span className="block font-semibold text-base leading-snug">{source.title}</span>
            <span className="mt-1 block text-[15px] text-muted-foreground">{source.range}</span>
          </span>
          <span className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-full bg-primary px-4 font-semibold text-primary-foreground text-sm">
            {source.youtube ? recipe.watchOnYouTube : recipe.watchOnX}
          </span>
        </a>
      )}
      <figcaption className="flex min-w-0 items-center justify-between gap-3 pt-3 text-[15px] text-muted-foreground">
        <span className="min-w-0">
          <b className="font-semibold text-foreground">{source.title}</b> {source.range}
        </span>
        {clip && (
          <a className="-my-3 flex min-h-11 shrink-0 items-center px-1 hover:text-foreground" href={source.href} target="_blank" rel="noopener">
            YouTube ↗
          </a>
        )}
      </figcaption>
    </figure>
  )
}
