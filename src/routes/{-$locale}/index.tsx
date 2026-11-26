import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/core/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/core/ui/card'

export const Route = createFileRoute('/{-$locale}/')({
  component: Home,
})

function Home() {
  const { locale } = Route.useParams()
  const zh = locale === 'zh'
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{zh ? '站点模板' : 'Site template'}</h1>
      <p className="mt-4 text-muted-foreground">{zh ? '预渲染、Tailwind、coss ui。' : 'Prerendered, Tailwind, coss ui.'}</p>
      <div className="mt-8 flex gap-3">
        <Button>{zh ? '开始' : 'Get started'}</Button>
        <Button variant="outline" render={<Link to="/{-$locale}/" params={{ locale: zh ? undefined : 'zh' }} />}>
          {zh ? 'English' : '中文'}
        </Button>
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-brand">Card</CardTitle>
          <CardDescription>coss card</CardDescription>
        </CardHeader>
      </Card>
    </main>
  )
}
