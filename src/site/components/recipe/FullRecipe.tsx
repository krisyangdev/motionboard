import { useState } from 'react'
import { Check, ChevronDown, Copy } from 'lucide-react'
import { useLocale } from '@/core/locale'
import { Button } from '@/core/ui/button'
import { bySlug, recipeFile, termName, type RecipeText, type Term } from '@/site/data/terms'
import { RecipeLink } from '@/site/lib/links'
import { useStrings } from '@/site/lib/strings'

const h3 = 'mb-3 font-mono text-[0.6875rem] font-normal text-muted-foreground uppercase tracking-wide'

function PromptCopy({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  const { full } = useStrings()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      setTimeout(() => setDone(false), 1600)
    } catch {
      // clipboard blocked: leave the button unchanged
    }
  }
  return (
    <Button variant="ghost" size="icon-lg" className="absolute top-0.5 right-0.5 text-muted-foreground hover:text-foreground" aria-label={done ? full.promptCopied : full.copyPrompt} onClick={copy}>
      {done ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </Button>
  )
}

// Closed by default; the content stays in the DOM so it is in the prerendered HTML.
export function FullRecipe({ term: t, text }: { term: Term; text: RecipeText }) {
  const locale = useLocale()
  const { full } = useStrings()
  return (
    <details className="group rounded-xl bg-muted ring-1 ring-border" data-rv>
      <summary className="flex min-h-12 cursor-pointer list-none select-none items-center justify-between gap-3 rounded-xl px-4 font-semibold text-[0.9375rem] hover:bg-accent group-open:rounded-b-none group-open:shadow-[0_1px_0_var(--border)] [&::-webkit-details-marker]:hidden">
        <span>{full.title}</span>
        <ChevronDown aria-hidden="true" className="size-[18px] text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="grid max-w-[820px] gap-8 px-4 pt-5 pb-6 sm:px-5 sm:pt-6 sm:pb-7">
        <section>
          <h3 className={h3}>{full.why}</h3>
          <p className="text-[0.9375rem] leading-relaxed">{text.why}</p>
        </section>
        <section>
          <h3 className={h3}>{full.spec}</h3>
          <dl className="m-0">
            {text.spec.map(([k, v]) => (
              <div key={k} className="grid gap-0.5 border-t py-3 text-sm leading-relaxed last:border-b sm:grid-cols-[minmax(80px,140px)_minmax(0,1fr)] sm:gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="m-0 [overflow-wrap:anywhere] [&_code]:rounded-sm [&_code]:bg-background [&_code]:px-1.5 [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.78rem] [&_code]:ring-1 [&_code]:ring-border" dangerouslySetInnerHTML={{ __html: v }} />
              </div>
            ))}
          </dl>
        </section>
        <section>
          <h3 className={h3}>{full.prompt}</h3>
          <div className="relative rounded-lg bg-background py-3.5 pr-14 pl-4 ring-1 ring-border">
            <p className="text-sm leading-relaxed [overflow-wrap:anywhere]">{text.prompt}</p>
            <PromptCopy text={text.prompt} />
          </div>
        </section>
        <section>
          <h3 className={h3}>{full.says}</h3>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {text.says.map((s) => (
              <li key={s} className="inline-flex min-h-8 items-center rounded-full px-3.5 py-1 text-muted-foreground text-[0.8125rem] ring-1 ring-border">
                {s}
              </li>
            ))}
          </ul>
        </section>
        {text.vs.length > 0 && (
          <section>
            <h3 className={h3}>{full.vs}</h3>
            <ul className="m-0 list-none p-0">
              {text.vs.map(([slug, why]) => {
                const other = bySlug[slug]
                return (
                  <li key={slug} className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 border-t py-3 text-muted-foreground text-sm leading-relaxed last:border-b">
                    {other ? (
                      <RecipeLink slug={slug} className="inline-flex min-h-7 items-center font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground pointer-coarse:-my-2 pointer-coarse:min-h-11">
                        {termName(other, locale)}
                      </RecipeLink>
                    ) : null}
                    <span>{why}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        <a className="inline-flex min-h-11 items-center justify-self-start font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wide underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground" href={recipeFile(t)}>
          {full.file}
        </a>
      </div>
    </details>
  )
}
