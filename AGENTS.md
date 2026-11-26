# Site template: notes for agents

The template every site is built from: React 19 + TanStack Start/Router/Query + Tailwind CSS v4 + coss ui (Base UI), prerendered and served by one Cloudflare Worker. Demo: https://template.krisyang.dev. Status and log: `~/code/home/projects/site-template.md`. Shared site rules: `~/code/home/lines/sites.md`. Look and tokens: `DESIGN.md`.

## Commands
- `npm run dev`: dev server on http://127.0.0.1:3000.
- `npm run build`: writes the generated public files (robots, `_redirects`, `_headers`, llms.txt, video sitemap), then builds and prerenders every page in every language into `.cloudflare/output/v1/workers/default/assets`.
- `npm test`: unit tests (Vitest), build, then `scripts/test.mjs` checks the output: sitemap ↔ pages, hreflang, canonical, titles, descriptions, `<html lang>`, JSON-LD, internal links, redirects, robots, headers, llms.txt, noindex outside the sitemap, and that no page starts its JS before LCP or links an external stylesheet.
- `npm run typecheck`: `tsc --noEmit` (run after a build or dev start, which generates `src/routeTree.gen.ts`).
- `npm run deploy`: build, `cf deploy` (never wrangler), IndexNow ping.
- `npm run lighthouse -- --url <url> [--perf 99]`: local Lighthouse gate (95 per category by default). Its performance numbers run behind the local proxy and come out lower; pagespeed.web.dev mobile is the reference for the 99 gate (the anonymous PSI API quota is often used up, so use the web page).

## Who owns what
Sites merge template updates, so the split matters:
- Template-owned (sites do not edit; fix it in the template and merge): `src/core/**`, `scripts/**`, `src/router.tsx`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `components.json`, `DESIGN.md`, this file's template sections.
- Site-owned (each site edits freely): `site.config.ts`, `cloudflare.config.ts`, `src/site/**`, `content/**`, `public/**` (except the generated files), the route files a site adds, `README.md`, the "Site notes" section at the end of this file.
- Shared route files under `src/routes/` (root, locale layout, tools, guides, legal) ship with the template; a site may change them, accepting a merge conflict when the template changes them too.

## Where things are
- `site.config.ts`: domain, name, languages, home title/description, OG image, contact email, PostHog key variable, IndexNow key, llms.txt switch, CSP allowlist. The only place for these values; scripts import it too.
- i18n: `src/core/i18n.ts` (pure rules: default language at the root, others under `/<lang>/`; paths passed around are default-language paths with leading and trailing slash), `src/core/locale.tsx` (`useLocale()`, `useLocaleParam()`, `useMessages()`). Routes live under `src/routes/{-$locale}/`; `route.tsx` there 404s unknown prefixes and `/en/`. UI strings: `src/core/messages.ts` (shell), `src/site/messages.ts` (site). Links in the current language: `<Link to="/{-$locale}/tools/$slug/" params={{ locale: useLocaleParam(), slug }}>`.
- SEO: `seoHead()` and JSON-LD helpers in `src/core/seo.ts`; every route's `head()` uses it. The page list for the sitemap, llms.txt and redirects is `sitePages()` in `src/core/pages.ts`; extra static pages go in `src/site/pages.ts`. Sitemap with hreflang alternates is written by TanStack's prerender (`vite.config.ts`).
- Content: JSON pages in `content/tools/<slug>.json` (template `src/core/pages/ToolPage.tsx`, widget registry `src/site/tools/index.ts`), MDX in `content/guides/<lang>/` and `content/legal/<lang>/` (`src/core/pages/DocPage.tsx`). Lists read `virtual:content-index` (names and frontmatter only, built by `contentIndex()` in `src/core/pages.ts`), so a page chunk never bundles other pages' text. Restart `npm run dev` after adding a content file.
- Generated public files: `scripts/generate.mjs` (run by the build): `robots.txt`, `_redirects` (from `content/renamed.json`, every language, with and without trailing slash), `_headers` (security headers + CSP from `src/core/headers.ts`, immutable caching for `/assets/*` and `/fonts/*`), `llms.txt`, `sitemap-video.xml` (from `content/videos.json`). They are gitignored.
- Analytics: `src/core/track.ts` (PostHog capture API, cookieless, no SDK; no key = console + `window.__events`), `src/core/Analytics.tsx` (page_view, errors → `$exception`, `data-cta` link clicks), page types in `src/site/analytics.ts`. Every event carries `site` and `lang`. Cloudflare Web Analytics is turned on per zone in the dashboard, not in code.
- Shell: `src/core/shell/` (Header, Footer, ThemeToggle, LanguageSwitch, NotFound), nav links in `src/site/nav.ts`. Theme: `.dark` class set before paint by `THEME_SCRIPT` (`src/core/theme.ts`).
- coss ui: `src/core/ui/` (shadcn CLI, `components.json`, registry `@coss`). Only components in use are kept: every class in `src/` ends up in the CSS inlined in every page. Add with `npx shadcn@latest add @coss/<name>`.

## Performance rules (PSI mobile 99+)
- Every public page is prerendered; all CSS is inlined in `<head>` (`?inline` import in `__root.tsx`); one self-hosted font (Inter Latin, preloaded) with a metric-matched Arial fallback, so the swap causes no layout shift.
- `src/core/Scripts.tsx` replaces TanStack's `<HeadContent>`/`<Scripts>`: the app JS (entry + modulepreloads) is only added once every element with an `elementtiming` attribute in the first viewport has painted (3 s fallback). Mark the LCP element with `elementtiming="lcp"` (images also `fetchPriority="high"`). Otherwise Lighthouse counts the JS toward LCP and mobile scores drop to 90–95 (seen on Motionboard).
- Popup components (menu, select, dialog, sheet, toast, tooltip, popover) never render in the first screen of a content page and are never imported by the shell; FAQs are native `<details>`; widgets load after hydration inside a fixed-height slot.
- Measured 2026-11-26 on template.krisyang.dev, PSI mobile: home 100/100/100/100, tool page 100/100/100/100.

## Starting a new site from the template
1. `gh repo create krisyangdev/<slug> --private` and clone the template into `~/code/sites/<slug>` (`git clone git@github.com:krisyangdev/site-template.git <slug>`), then `git remote rename origin template` and `git remote add origin <new repo>`; `git push -u origin main`.
2. Edit `site.config.ts` (id, name, domain, worker, languages, copy, email, IndexNow key + `public/<key>.txt`), `src/site/styles.css` (`--brand` light/dark), `public/favicon.svg`, `public/og.png`, `cloudflare.config.ts` (bindings).
3. Replace the demo content in `content/`, `src/site/home/`, `src/site/tools/`, `src/site/nav.ts`.
4. `npm test`, `npm run deploy`, check the live URL and PSI.

## Taking template updates into a site
`git fetch template && git merge template/main`, resolve conflicts (site-owned files keep the site's version), `npm install`, `npm test`, deploy. Make shared fixes in the template first, then merge them into each site; never fix `src/core/` only in a site.

## Adopting the template in an existing site (e.g. Motionboard)
Add the template as a remote and merge with unrelated histories (`git remote add template …; git fetch template; git merge template/main --allow-unrelated-histories`), or start from a fresh clone and copy the site's content in. Then move: site config values into `site.config.ts`; the duplicated `/zh/` route tree into `{-$locale}` routes; `seo.ts`/`track.ts`/`Scripts.tsx`/scripts to the core versions; hand-written CSS to Tailwind + coss tokens; keep site-only parts (data generators, video components, D1 bindings) under `src/site/` and `scripts/site/`. Acceptance: same URLs (sitemap diff empty), `npm test` green, PSI mobile ≥ 99 on home and one deep page.

## Decisions (2026-11-26, template dev)
- npm, single package (no monorepo), Node 22 (type stripping for `site.config.ts` in scripts).
- i18n with the official `{-$locale}` optional segment and plain typed dictionaries per locale (no Paraglide compile step): our sites carry few UI strings; page text lives in content files that are loaded per page.
- MDX through `@mdx-js/rollup` + `import.meta.glob` (no Content Collections): fewer moving parts, one chunk per document.
- Fonts: Inter only (coss default), Latin subset self-hosted; Geist Mono dropped for the system mono.
- coss `html { font-sans font-mono }` from the registry was a bug (everything rendered mono); fixed to `font-sans` in `app.css`.
- Template demo runs on `template.krisyang.dev` (a throwaway subdomain of an existing zone).
