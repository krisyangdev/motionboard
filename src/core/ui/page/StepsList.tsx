/** Numbered how-to steps. */
export function StepsList({ steps }: { steps: readonly { title: string; body: string }[] }) {
  return (
    <ol className="mt-4 space-y-4">
      {steps.map((s, i) => (
        <li className="flex gap-3" key={s.title}>
          <span aria-hidden className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {i + 1}
          </span>
          <div>
            <h3 className="font-medium">{s.title}</h3>
            <p className="mt-1 text-muted-foreground">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
