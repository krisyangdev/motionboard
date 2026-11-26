import type { ReactNode } from 'react'

/** First-hand material of a guide (our own test, table, screenshot, number) with its caption. Available in MDX as `<Evidence caption="…">`. */
export function Evidence({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="my-8 rounded-xl border bg-card p-4">
      <div className="overflow-x-auto">{children}</div>
      <figcaption className="mt-3 text-sm text-muted-foreground">{caption}</figcaption>
    </figure>
  )
}
