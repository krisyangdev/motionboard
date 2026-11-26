import { Asset, useRouter, useTags, type RouterManagedTag } from '@tanstack/react-router'
import { composeSsrBodyScripts, deepEqual, getSsrBodyScriptParts } from '@tanstack/router-core'
import { isServer } from '@tanstack/router-core/isServer'
import { useSelector } from '@tanstack/react-store'
import { createElement, useRef } from 'react'

// TanStack's <HeadContent> and <Scripts> with one change: the app's JavaScript is neither fetched nor
// run until the LCP elements in the first viewport are on screen.
// Rule for sites: mark the LCP element (the hero heading or the hero image) with elementtiming="lcp";
// images also get fetchPriority="high". Any elementtiming value counts; every such element whose top
// is inside the first viewport is waited for.
// Why: Lighthouse's simulated mobile run counts every script request that finished before the
// observed LCP, and every script that ran before it, toward LCP. With the modulepreload links in
// <head> and the entry module starting on its own, pages scored 89-95 instead of 99.
// So <Head> leaves the modulepreload links out, and <Scripts> replaces the entry <script> with a
// boot script that adds those links and the entry together once the marked elements are presented
// (all modules then download in parallel). A visitor sees the same page; hydration starts after the LCP paint.
// Element Timing reports presentation time, which can trail the main-thread paint by 100 ms or more.
// Browsers without it start after marked images are decoded and one frame has run; a page without
// marked elements starts after one frame; if an element stalls, the scripts start after 3 s.

const isModulePreload = (tag: RouterManagedTag) => tag.tag === 'link' && tag.attrs?.rel === 'modulepreload'

export function Head() {
  const tags = useTags()
  const nonce = useRouter().options.ssr?.nonce
  return <>{tags.filter((t) => !isModulePreload(t)).map((tag) => createElement(Asset, { ...tag, key: `tsr-meta-${JSON.stringify(tag)}`, nonce }))}</>
}

const boot = (src: string, preloads: string[]) =>
  `(()=>{let d;const go=()=>{if(d)return;d=1;for(const h of ${JSON.stringify(preloads)}){const l=document.createElement("link");l.rel="modulepreload";l.href=h;document.head.append(l)}` +
  `const s=document.createElement("script");s.type="module";s.src=${JSON.stringify(src)};document.head.append(s)};` +
  `const frame=()=>requestAnimationFrame(()=>setTimeout(go));setTimeout(go,3000);` +
  `const p=[...document.querySelectorAll("[elementtiming]")].filter(i=>i.getClientRects().length&&i.getBoundingClientRect().top<innerHeight);` +
  `if(!p.length)return frame();` +
  `if(!PerformanceObserver.supportedEntryTypes?.includes("element"))return Promise.all(p.map(i=>i.decode?.().catch(()=>{}))).then(frame);` +
  `const left=new Set(p);const o=new PerformanceObserver(l=>{for(const e of l.getEntries())left.delete(e.element);if(!left.size){o.disconnect();setTimeout(go)}});o.observe({type:"element",buffered:true})})()`

type Matches = Parameters<typeof getSsrBodyScriptParts>[0]
// The router's matches store is a TanStack store at runtime; its public type omits subscribe.
type Store = Parameters<typeof useSelector<Matches, RouterManagedTag[]>>[0]

export function Scripts() {
  const router = useRouter()
  // The preload list of the first render; later navigations must not change the boot script, or the
  // router would insert and run it again.
  const tags = useTags()
  const preloads = useRef(tags.filter(isModulePreload).map((t) => String(t.attrs?.href))).current
  const deferEntry = (tag: RouterManagedTag): RouterManagedTag => {
    const attrs = tag.tag === 'script' ? tag.attrs : undefined
    if (attrs?.type !== 'module' || typeof attrs.src !== 'string') return tag
    return { tag: 'script', attrs: { suppressHydrationWarning: true }, children: boot(attrs.src, preloads) }
  }
  const getScripts = (matches: Matches, initial?: Parameters<typeof composeSsrBodyScripts>[1]): RouterManagedTag[] => {
    const [routeScripts, manifestScripts] = getSsrBodyScriptParts(matches, router.ssr?.manifest, router.options.ssr?.nonce, {
      suppressHydrationWarning: true,
    })
    return composeSsrBodyScripts([routeScripts, manifestScripts.map(deferEntry)], initial)
  }
  const store = router.stores.matches as unknown as Store
  const live = useSelector(store, (m) => getScripts(m), { compare: deepEqual })
  const scripts = (isServer ?? router.isServer) ? getScripts(router.stores.matches.get(), router.serverSsr?.takeInitialHydrationScriptTags()) : live
  return <>{scripts.map((asset, i) => createElement(Asset, { ...asset, key: `tsr-scripts-${asset.tag}-${i}` }))}</>
}
