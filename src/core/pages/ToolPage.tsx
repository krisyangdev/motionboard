// Template for a JSON-driven tool page (content/tools/<slug>.json).
import { Suspense } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { ChevronDownIcon } from 'lucide-react'
import type { ToolPage as ToolPageData } from '@/core/content/tools'
import type { Locale } from '@/core/i18n'
import { articleLd, breadcrumbLd, faqLd, seoHead, softwareAppLd } from '@/core/seo'
import { tools } from '@/site/tools'
import { Breadcrumb, CardGrid, formatDate, labels, LCP } from './HubPage'

export const toolPath = (slug: string) => `/tools/${slug}/`

export function toolHead(page: ToolPageData, locale: Locale) {
  const t = page[locale]
  const name = page.name[locale]
  const path = toolPath(page.slug)
  return seoHead({
    title: t.title,
    description: t.description,
    path,
    locale,
    jsonLd: [
      page.tool
        ? softwareAppLd({ name, description: t.description, locale, path, category: 'WebApplication' })
        : articleLd({ headline: t.h1, description: t.description, locale, path, datePublished: page.updated }),
      breadcrumbLd(locale, [[labels[locale].tools, '/tools/'], [name, path]]),
      ...(t.faq?.length ? [faqLd(t.faq)] : []),
    ],
  })
}

// The widget slot has a fixed minimum height, so nothing moves when the widget chunk arrives.
// Widgets render only in the browser, after hydration.
const SLOT = 'min-h-[24rem] rounded-2xl border bg-card p-4'
const WidgetFallback = () => <div aria-hidden className="min-h-[22rem] rounded-lg bg-muted" />

export function ToolPage({ page, locale, siblings }: { page: ToolPageData; locale: Locale; siblings: { slug: string; name: Record<Locale, string> }[] }) {
  const t = page[locale]
  const l = labels[locale]
  const Widget = page.tool ? tools[page.tool] : undefined
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb items={[{ label: l.tools, path: '/tools/' }, { label: page.name[locale] }]} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {t.h1}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{t.lede}</p>

      {Widget && (
        <div className={`mt-8 ${SLOT}`}>
          <ClientOnly fallback={<WidgetFallback />}>
            <Suspense fallback={<WidgetFallback />}>
              <Widget locale={locale} />
            </Suspense>
          </ClientOnly>
        </div>
      )}

      {t.steps && t.steps.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">{l.howTo}</h2>
          <ol className="mt-4 space-y-4">
            {t.steps.map((s, i) => (
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
        </section>
      )}

      {t.faq && t.faq.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">{l.faq}</h2>
          <div className="mt-2">
            {t.faq.map(([q, a]) => (
              <details className="group border-b last:border-b-0" key={q}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-md py-4 text-left font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDownIcon aria-hidden className="pointer-events-none mt-1 size-4 shrink-0 opacity-80 transition-transform duration-200 ease-in-out group-open:rotate-180" />
                </summary>
                <p className="pb-4 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {siblings.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">{l.moreTools}</h2>
          <div className="mt-4">
            <CardGrid entries={siblings.slice(0, 6).map((s) => ({ title: s.name[locale], href: toolPath(s.slug) }))} locale={locale} />
          </div>
        </section>
      )}

      <p className="mt-12 text-sm text-muted-foreground">
        {l.updated} <time dateTime={page.updated}>{formatDate(page.updated, locale)}</time>
      </p>
    </main>
  )
}
