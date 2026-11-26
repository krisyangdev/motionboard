import { Link } from '@tanstack/react-router'
import { useLocaleParam, useMessages } from '@/core/locale'
import { Button } from '@/core/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/core/ui/card'
import { messages } from '@/site/messages'

// React's types do not know the Element Timing attribute; spreading it keeps the JSX type-safe.
const lcp = { elementtiming: 'lcp' }

export function Home() {
  const m = useMessages(messages)
  const locale = useLocaleParam()
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <section className="mx-auto max-w-3xl text-center">
        <h1 {...lcp} className="text-balance font-bold text-4xl tracking-tight sm:text-6xl">
          {m.hero.title}
        </h1>
        <p className="mt-6 text-pretty text-lg text-muted-foreground leading-relaxed sm:text-xl">{m.hero.lede}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button size="xl" render={<Link to="/{-$locale}/tools/" params={{ locale }} />}>
            {m.hero.tools}
          </Button>
          <Button size="xl" variant="outline" render={<Link to="/{-$locale}/guides/" params={{ locale }} />}>
            {m.hero.guides}
          </Button>
        </div>
      </section>
      <section className="mt-20 grid gap-4 sm:mt-28 sm:grid-cols-2 lg:grid-cols-3">
        {m.features.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <CardTitle className="text-lg">{f.title}</CardTitle>
              <CardDescription className="text-base leading-relaxed">{f.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  )
}
