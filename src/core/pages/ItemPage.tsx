// Template for a collection page: /<collection>/<slug>/ is an item (content/collections/<collection>/<slug>.json) or, when the
// slug is one of the collection's categories, that category's hub. One route file per collection serves both.
// Item order: breadcrumb, h1 (+ own name), lede, main media, the site's data block, body blocks, FAQ, related items.
import index from 'virtual:content-index'
import { notFound } from '@tanstack/react-router'
import { isSitePage } from '@/core/content/exists'
import { pageH1 } from '@/core/content/h1'
import { categoryHubId, itemPath } from '@/core/content/hubs'
import { loadItem, type Item } from '@/core/content/items'
import { hubName, relatedItemEntries, type Entry } from '@/core/content/members'
import { paramLocale, type Locale } from '@/core/i18n'
import { coreMessages } from '@/core/messages'
import { HubPage, hubHead, loadHub, type HubData } from '@/core/pages/HubPage'
import { imageObjectLd, seoHead, videoLd } from '@/core/seo'
import { Breadcrumb, trail } from '@/core/ui/page/Breadcrumb'
import { FaqList } from '@/core/ui/page/FaqList'
import { LCP } from '@/core/ui/page/link'
import { MediaBlock } from '@/core/ui/page/MediaBlock'
import { RelatedGrid } from '@/core/ui/page/RelatedGrid'
import { slots } from '@/site/slots'

export type CollectionPageData =
  | { kind: 'hub'; hub: HubData; locales: readonly Locale[] }
  | { kind: 'item'; item: Item; related: Entry[]; locales: readonly Locale[] }

/**
 * Route loader of /<collection>/<slug>/: the category hub when the slug is a category, else the item. 404 when the item
 * has no text block in the language (never another language's text).
 */
export async function loadCollectionPage(collection: string, slug: string, localeParam: string | undefined): Promise<CollectionPageData> {
  if (index.categories[collection]?.includes(slug)) {
    const hub = await loadHub(categoryHubId(collection, slug), localeParam, 1)
    return { kind: 'hub', hub, locales: hub.locales }
  }
  const locale = paramLocale(localeParam)
  const item = await loadItem(collection, slug, locale)
  if (!item) throw notFound()
  return { kind: 'item', item, related: await relatedItemEntries(collection, slug, locale), locales: item.locales }
}

/**
 * The breadcrumb of an item: Home, the collection hub, the primary category hub, the item. Each level in between exists
 * only in the languages that have that hub. Shown by the page and written to its JSON-LD.
 */
const itemCrumbs = (item: Item, locale: Locale) => {
  const hubs = [item.collection, categoryHubId(item.collection, item.category[0])]
  return trail(locale, ...hubs.filter((h) => isSitePage(locale, `/${h}/`)).map((h) => ({ name: hubName(h, locale), path: `/${h}/` })), { name: item.name, path: itemPath(item.collection, item.slug) })
}

export function itemHead(item: Item, locale: Locale) {
  const t = item.text
  const m = item.media
  const path = itemPath(item.collection, item.slug)
  const jsonLd =
    m?.kind === 'image'
      ? [imageObjectLd({ name: item.name, caption: t.alt ?? t.lede, contentUrl: m.src, license: m.license, locale, path })]
      : m?.kind === 'video'
        ? [videoLd({ name: item.name, description: t.lede, thumbnailUrl: m.poster, contentUrl: m.src, uploadDate: item.published, duration: m.duration, locale, path })]
        : undefined
  return seoHead({
    title: t.title,
    description: t.description,
    path,
    locale,
    noindex: item.noindex.includes(locale),
    locales: item.locales.filter((x) => !item.noindex.includes(x)),
    image: item.ogImage ?? (m?.kind === 'image' ? m.src : m?.kind === 'video' ? m.poster : undefined),
    video: m?.kind === 'video' ? m.src : undefined,
    breadcrumb: itemCrumbs(item, locale),
    jsonLd,
  })
}

export const collectionPageHead = (data: CollectionPageData, locale: Locale) => (data.kind === 'hub' ? hubHead(data.hub, locale) : itemHead(data.item, locale))

const H2 = 'text-xl font-semibold tracking-tight'

export function ItemPage({ item, related, locale }: { item: Item; related: Entry[]; locale: Locale }) {
  const t = item.text
  const l = coreMessages[locale].page
  const ctx = { type: 'item', collection: item.collection, slug: item.slug, locale } as const
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Breadcrumb crumbs={itemCrumbs(item, locale)} />
      <h1 {...LCP} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {pageH1({ title: t.title, h1: t.h1 ?? t.name })}
      </h1>
      {t.ownName && <p className="mt-1 text-sm text-muted-foreground">{t.ownName}</p>}
      <p className="mt-3 text-lg text-muted-foreground">{t.lede}</p>
      {slots.afterLede?.(ctx)}

      {item.media && <MediaBlock alt={t.alt ?? t.name} media={item.media} />}
      {slots.itemData?.({ ...ctx, data: item.data })}

      {t.body.map((b) => (
        <section className="mt-12" key={b.h2}>
          <h2 className={H2}>{b.h2}</h2>
          <p className="mt-3 text-muted-foreground">{b.body}</p>
        </section>
      ))}

      {t.faq && t.faq.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.faq}</h2>
          <FaqList items={t.faq} />
        </section>
      )}

      {slots.afterContent?.(ctx)}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className={H2}>{l.related}</h2>
          <div className="mt-4">
            <RelatedGrid card={slots.card} entries={related} locale={locale} />
          </div>
        </section>
      )}
    </main>
  )
}

/** The page of /<collection>/<slug>/: an item or a category hub. */
export function CollectionPage({ data, locale }: { data: CollectionPageData; locale: Locale }) {
  return data.kind === 'hub' ? <HubPage data={data.hub} /> : <ItemPage item={data.item} locale={locale} related={data.related} />
}
