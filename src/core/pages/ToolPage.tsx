// Template for a JSON-driven tool page (content/tools/<slug>.json).
// Order: breadcrumb, h1, lede, the tool, examples, how-to steps, sections, limits, FAQ, more tools.
import { Suspense } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { pageExists, seoState } from '@/core/content/exists'
import { pageH1 } from '@/core/content/h1'
import type { Entry } from '@/core/content/members'
import type { Tool } from '@/core/content/tools'
import { formatDate, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { seoHead, webApplicationLd } from '@/core/seo'
import { Breadcrumb, trail } from '@/core/ui/page/Breadcrumb'
import { Examples } from '@/core/ui/page/Examples'
import { FaqList } from '@/core/ui/page/FaqList'
import { LCP } from '@/core/ui/page/link'
import { RelatedGrid } from '@/core/ui/page/RelatedGrid'
import { StepsList } from '@/core/ui/page/StepsList'
import { slots } from '@/site/slots'
import { tools } from '@/site/tools'

export const toolPath = (slug: string) => `/tools/${slug}/`

/** The breadcrumb of a tool page: shown by the page and written to its JSON-LD (the Tools level only where the hub exists). */
const toolCrumbs = (page: Tool, locale: Locale) =>
  trail(locale, ...(pageExists(locale, '/tools/') ? [{ name: coreMessages[locale].page.tools, path: '/tools/' }] : []), { name: page.name, path: toolPath(page.slug) })

export function toolHead(page: Tool, locale: Locale) {
  const t = page.text
  const path = toolPath(page.slug)
  return seoHead({
    title: t.title,
    description: t.description,
    path,
    locale,
    ...seoState(path, locale),
    image: page.ogImage,
    breadcrumb: toolCrumbs(page, locale),
    jsonLd: [webApplicationLd({ name: page.name, description: t.description, locale, path })],
  })
}

// The widget slot has a fixed minimum height, so nothing moves when the widget chunk arrives.
// Widgets render only in the browser, after hydration.
const SLOT = 'min-h-[24rem] rounded-2xl border bg-card p-4'
const WidgetFallback = () => <div aria-hidden className="min-h-[22rem] rounded-lg bg-muted" />
const H2 = 'text-xl font-semibold tracking-tight'

export function ToolPage({ page, locale, siblings }: { page: Tool; locale: Locale; siblings: Entry[] }) {
  const t = page.text
  const l = coreMessages[locale].page
  const Widget = tools[page.tool]
  const ctx = { type: 'tool', slug: page.slug, locale } as const
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={toolCrumbs(page, locale)} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {pageH1(t)}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{t.lede}</p>
      {slots.afterLede?.(ctx)}

      {Widget && (
        <div className={`mt-8 ${SLOT}`}>
          <ClientOnly fallback={<WidgetFallback />}>
            <Suspense fallback={<WidgetFallback />}>
              <Widget locale={locale} />
            </Suspense>
          </ClientOnly>
        </div>
      )}

      {t.examples && t.examples.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.examples}</h2>
          <Examples examples={t.examples} locale={locale} />
        </section>
      )}

      {t.steps && t.steps.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.howTo}</h2>
          <StepsList steps={t.steps} />
        </section>
      )}

      {t.sections?.map((s) => (
        <section className="mt-12" key={s.h2}>
          <h2 className={H2}>{s.h2}</h2>
          <p className="mt-3 text-muted-foreground">{s.body}</p>
        </section>
      ))}

      {t.limits && (
        <section className="mt-12">
          <h2 className={H2}>{l.limits}</h2>
          <p className="mt-3 text-muted-foreground">{t.limits}</p>
        </section>
      )}

      {t.faq && t.faq.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.faq}</h2>
          <FaqList items={t.faq} openFirst />
        </section>
      )}

      {slots.afterContent?.(ctx)}

      {siblings.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.moreTools}</h2>
          <div className="mt-4">
            <RelatedGrid card={slots.card} entries={siblings.slice(0, 6)} locale={locale} />
          </div>
        </section>
      )}

      <p className="mt-12 text-sm text-muted-foreground">
        {l.updated} <time dateTime={page.updated}>{formatDate(locale, page.updated)}</time>
      </p>
    </main>
  )
}
