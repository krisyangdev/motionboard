// Template for a use-case page (content/use-cases/<slug>.json at /for/<slug>/, spec §1.7).
// Order: breadcrumb, h1, lede, byline, common problems, workflow, what to use, FAQ, call to action.
import { notFound } from '@tanstack/react-router'
import { existingLocales, isSitePage, seoState } from '@/core/content/exists'
import { pageH1 } from '@/core/content/h1'
import { typedPath } from '@/core/content/hubs'
import { loadPageFile } from '@/core/content/pagefiles'
import type { UseCaseText } from '@/core/content/schema'
import { paramLocale, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { seoHead } from '@/core/seo'
import { buttonVariants } from '@/core/ui/button'
import { Breadcrumb, trail } from '@/core/ui/page/Breadcrumb'
import { Byline } from '@/core/ui/page/Byline'
import { FaqList } from '@/core/ui/page/FaqList'
import { LCP, PathLink } from '@/core/ui/page/link'
import { StepsList } from '@/core/ui/page/StepsList'
import { slots } from '@/site/slots'

export type UseCase = { slug: string; published: string; updated: string; ogImage?: string; text: UseCaseText; locales: readonly Locale[] }

const useCasePath = (slug: string) => typedPath('use-case', slug)

const crumbs = (u: UseCase, locale: Locale) => trail(locale, { name: pageH1(u.text), path: useCasePath(u.slug) })

export function useCaseHead(u: UseCase, locale: Locale) {
  const path = useCasePath(u.slug)
  return seoHead({ title: u.text.title, description: u.text.description, path, locale, ...seoState(path, locale), type: 'website', image: u.ogImage, breadcrumb: crumbs(u, locale) })
}

/** Route loader: 404 when the language has no text for the page (never another language's text). */
export async function loadUseCasePage(localeParam: string | undefined, slug: string): Promise<UseCase> {
  const locale = paramLocale(localeParam)
  const path = useCasePath(slug)
  if (!isSitePage(locale, path)) throw notFound()
  const file = await loadPageFile('use-cases', slug)
  const text = file?.[locale]
  if (!file || !text) throw notFound()
  return { slug, published: file.published, updated: file.updated, ogImage: file.ogImage, text, locales: existingLocales(path) }
}

const H2 = 'text-xl font-semibold tracking-tight'

export function UseCasePage({ u, locale }: { u: UseCase; locale: Locale }) {
  const l = coreMessages[locale].page
  const t = u.text
  const ctx = { type: 'use-case', slug: u.slug, locale } as const
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={crumbs(u, locale)} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {pageH1(t)}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{t.lede}</p>
      <Byline locale={locale} updated={u.updated} />
      {slots.afterLede?.(ctx)}
      <section className="mt-12">
        <h2 className={H2}>{l.problems}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {t.problems.map((p) => (
            <li className="rounded-xl border bg-card p-4" key={p.title}>
              <h3 className="font-medium">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-12">
        <h2 className={H2}>{l.workflow}</h2>
        <StepsList steps={t.workflow} />
      </section>
      <section className="mt-12">
        <h2 className={H2}>{l.useCaseTools}</h2>
        <ul className="mt-4 space-y-3">
          {t.examples.map((e) => (
            <li className="rounded-xl border bg-card p-4" key={e.path}>
              <PathLink className="font-medium text-brand underline underline-offset-4" locale={locale} path={e.path}>
                {e.name}
              </PathLink>
              <p className="mt-1 text-muted-foreground">{e.caption}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-12">
        <h2 className={H2}>{l.faq}</h2>
        <FaqList items={t.faq} openFirst />
      </section>
      {slots.afterContent?.(ctx)}
      <p className="mt-12">
        <PathLink className={buttonVariants({ size: 'lg' })} locale={locale} path={t.cta.path}>
          {t.cta.name}
        </PathLink>
      </p>
    </main>
  )
}
