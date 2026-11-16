import { Asset, useRouter, type RouterManagedTag } from '@tanstack/react-router'
import { composeSsrBodyScripts, deepEqual, getSsrBodyScriptParts } from '@tanstack/router-core'
import { isServer } from '@tanstack/router-core/isServer'
import { useSelector } from '@tanstack/react-store'
import { createElement } from 'react'

// TanStack's <Scripts> with one change: the app's entry module starts only after the posters marked
// elementtiming="poster" that are in the first viewport have been presented on screen. When hydration
// ran before that, Lighthouse's simulated mobile run counted all of the JS (download and execution)
// toward LCP, which put recipe pages at 90-95 and the home page at 89-99. The modules still download
// early via the modulepreload links; a visitor waits a frame or two longer for hydration.
// Element Timing reports presentation time, which can trail the main-thread paint by 100 ms or more.
// Browsers without it start after the posters are decoded and one frame has run; a page without
// posters starts after one frame; if a poster stalls, the entry starts after 3 s.
const boot = (src: string) =>
  `(()=>{let d;const go=()=>{if(d)return;d=1;const s=document.createElement("script");s.type="module";s.src=${JSON.stringify(src)};document.head.append(s)};` +
  `const frame=()=>requestAnimationFrame(()=>setTimeout(go));setTimeout(go,3000);` +
  `const p=[...document.querySelectorAll("img[elementtiming=poster]")].filter(i=>i.getBoundingClientRect().top<innerHeight);` +
  `if(!p.length)return frame();` +
  `if(!PerformanceObserver.supportedEntryTypes?.includes("element"))return Promise.all(p.map(i=>i.decode().catch(()=>{}))).then(frame);` +
  `const left=new Set(p);const o=new PerformanceObserver(l=>{for(const e of l.getEntries())left.delete(e.element);if(!left.size){o.disconnect();setTimeout(go)}});o.observe({type:"element",buffered:true})})()`

const deferEntry = (tag: RouterManagedTag): RouterManagedTag => {
  const attrs = tag.tag === 'script' ? tag.attrs : undefined
  if (attrs?.type !== 'module' || typeof attrs.src !== 'string') return tag
  return { tag: 'script', attrs: { suppressHydrationWarning: true }, children: boot(attrs.src) }
}

type Matches = Parameters<typeof getSsrBodyScriptParts>[0]
// The router's matches store is a TanStack store at runtime; its public type omits subscribe.
type Store = Parameters<typeof useSelector<Matches, RouterManagedTag[]>>[0]

export function Scripts() {
  const router = useRouter()
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
