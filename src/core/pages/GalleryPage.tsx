// Template for a gallery (content/gallery/<slug>.json at /gallery/<slug>/, spec §1.8). Entries have no URL of their own.
// Order: breadcrumb, h1, lede, intro, the entries (image or video with alt text, title, caption, facts, link), FAQ.
// Every image is an <img> in the server HTML with width, height and alt; the first row loads at once, the rest lazily.
// A video is <video controls preload="none" poster> with its <source> in the HTML.
import { notFound } from '@tanstack/react-router'
import { existingLocales, isSitePage, seoState } from '@/core/content/exists'
import { pageH1 } from '@/core/content/h1'
import { typedPath } from '@/core/content/hubs'
import { loadPageFile } from '@/core/content/pagefiles'
import type { GalleryEntry, GalleryText } from '@/core/content/schema'
import { paramLocale, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { seoHead } from '@/core/seo'
import { Breadcrumb, trail } from '@/core/ui/page/Breadcrumb'
import { FaqList } from '@/core/ui/page/FaqList'
import { LCP, PathLink } from '@/core/ui/page/link'
import { slots } from '@/site/slots'

export type Gallery = { slug: string; published: string; updated: string; ogImage?: string; text: GalleryText; locales: readonly Locale[] }

const galleryPath = (slug: string) => typedPath('gallery', slug)

const crumbs = (g: Gallery, locale: Locale) => trail(locale, { name: pageH1(g.text), path: galleryPath(g.slug) })

export function galleryHead(g: Gallery, locale: Locale) {
  const path = galleryPath(g.slug)
  return seoHead({ title: g.text.title, description: g.text.description, path, locale, ...seoState(path, locale), type: 'website', image: g.ogImage, breadcrumb: crumbs(g, locale) })
}

/** Route loader: 404 when the language has no text for the page (never another language's text). */
export async function loadGalleryPage(localeParam: string | undefined, slug: string): Promise<Gallery> {
  const locale = paramLocale(localeParam)
  const path = galleryPath(slug)
  if (!isSitePage(locale, path)) throw notFound()
  const file = await loadPageFile('gallery', slug)
  const text = file?.[locale]
  if (!file || !text) throw notFound()
  return { slug, published: file.published, updated: file.updated, ogImage: file.ogImage, text, locales: existingLocales(path) }
}

const H2 = 'text-xl font-semibold tracking-tight'
const FRAME = 'h-auto w-full rounded-xl border bg-card'
/** Entries in the first row of the grid (two columns): not lazy-loaded. */
const FIRST_ROW = 2

function Media({ entry, index }: { entry: GalleryEntry; index: number }) {
  const m = entry.media
  if (m.kind === 'image') {
    return <img alt={entry.alt} className={FRAME} decoding="async" height={m.height} loading={index < FIRST_ROW ? undefined : 'lazy'} src={m.src} width={m.width} />
  }
  return (
    <video aria-label={entry.alt} className={FRAME} controls height={m.height} playsInline poster={m.poster} preload="none" width={m.width}>
      <source src={m.src} type={m.mime ?? 'video/mp4'} />
    </video>
  )
}

export function GalleryPage({ g, locale }: { g: Gallery; locale: Locale }) {
  const l = coreMessages[locale].page
  const t = g.text
  const ctx = { type: 'gallery', slug: g.slug, locale } as const
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={crumbs(g, locale)} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {pageH1(t)}
      </h1>
      <p className="mt-3 max-w-3xl text-lg text-muted-foreground">{t.lede}</p>
      <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
      {slots.afterLede?.(ctx)}
      <ul className="mt-8 grid gap-8 sm:grid-cols-2">
        {t.entries.map((e, i) => (
          <li key={e.title}>
            <figure>
              <Media entry={e} index={i} />
              <figcaption className="mt-3">
                <h2 className="font-medium">{e.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{e.caption}</p>
                {e.facts && e.facts.length > 0 && (
                  <dl className="mt-2 space-y-0.5 text-sm">
                    {e.facts.map(([k, v]) => (
                      <div key={k}>
                        <dt className="inline font-medium">{k}: </dt>
                        <dd className="inline text-muted-foreground">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {e.link && (
                  <p className="mt-2 text-sm">
                    <PathLink className="text-brand underline underline-offset-4" locale={locale} path={e.link.path}>
                      {e.link.name}
                    </PathLink>
                  </p>
                )}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {t.faq && t.faq.length > 0 && (
        <section className="mx-auto mt-12 max-w-3xl">
          <h2 className={H2}>{l.faq}</h2>
          <FaqList items={t.faq} />
        </section>
      )}
      {slots.afterContent?.(ctx)}
    </main>
  )
}
