import { localizePath } from '@/core/i18n'
import { useCoreMessages, useShellLocale } from '@/core/messages'
import { buttonVariants } from '@/core/ui/button'

export function NotFound() {
  const l = useShellLocale()
  const m = useCoreMessages().notFound
  return (
    <main className="mx-auto max-w-5xl px-4 py-24 text-center">
      <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">{m.title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{m.body}</p>
      <a href={localizePath(l, '/')} className={buttonVariants({ size: 'lg', className: 'mt-8' })}>
        {m.back}
      </a>
    </main>
  )
}
