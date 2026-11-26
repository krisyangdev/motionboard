import { coreMessages } from '@/core/messages'
import type { Locale } from '@/core/i18n'

/** Before and after pairs of a tool, each with a caption. */
export function Examples({ examples, locale }: { examples: readonly { input: string; output: string; caption: string }[]; locale: Locale }) {
  const l = coreMessages[locale].page
  return (
    <div className="mt-4 space-y-4">
      {examples.map((e) => (
        <figure className="rounded-xl border bg-card p-4" key={e.caption}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{l.exampleInput}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words font-mono text-sm">{e.input}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{l.exampleOutput}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words font-mono text-sm">{e.output}</dd>
            </div>
          </dl>
          <figcaption className="mt-3 text-sm text-muted-foreground">{e.caption}</figcaption>
        </figure>
      ))}
    </div>
  )
}
