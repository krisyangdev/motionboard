# Motionboard: notes for agents

motionboard.app: 48 launch-film shot recipes and a free HyperFrames skill for Claude Code and Codex. Status, next steps and log: `~/code/home/projects/motionboard.md`. Shared site rules: `~/code/home/lines/sites.md`. Design: `DESIGN.md`.

## Commands
- `npm run dev`: local dev server (http://127.0.0.1:3000).
- `npm run build`: generates recipe files, `public/robots.txt`, `public/_redirects`, the video sitemap, then prerenders every page.
- `npm test`: build, then `scripts/test.mjs` checks the output (sitemap ↔ pages, canonical, hreflang, titles, descriptions, JSON-LD, internal links, redirects, video sitemap, robots).
- `npm run deploy`: build and deploy with the `cf` CLI (never wrangler), then pings IndexNow.
- `scripts/upload-media.sh`: films and posters in `media/` (gitignored) go to the R2 bucket behind the media host. Video renders never run on the Mac.

## Where things are
- `src/site.config.ts`: the only place for domain, media host, name, languages, PostHog key variable, IndexNow key, social defaults and hreflang alternates. Scripts import it too.
- Content: `src/data/terms.json` + `en.json` (recipes), `src/data/seo/<slug>.json` (search copy), `src/data/pages/<id>.json` (hubs and guides, schema in `src/data/content.ts`), `src/data/renamed.json` (old slug → new, drives the 301s).
- SEO head: `seoHead()` in `src/lib/seo.ts`; sitemap pages in `vite.config.ts`.
- Analytics: `src/lib/track.ts` (PostHog, shared project "Sites", cookieless) + `src/components/Analytics.tsx`. Every event has `site=motionboard` and `lang`. Cloudflare Web Analytics is injected at the edge.
- Script loading: `src/components/Scripts.tsx` replaces TanStack's `<HeadContent>`/`<Scripts>` in `__root.tsx`. The app JS (modulepreload links + entry) is only added once the posters with `elementtiming="poster"` are on screen; otherwise PSI mobile counts the JS toward LCP (recipe pages fell to 90-95). A new LCP image needs `fetchPriority="high"` and `elementtiming="poster"`.
- Skill: `skills/motionboard/` (runnable HyperFrames sources per recipe).

## Checks before reporting a UI change
- `npm test` passes.
- `node ~/code/home/tools/design-check/check.mjs --allow posthog.com --allow cloudflareinsights.com --allow motionboard.app <url>`. Known false positive: on the home page at 1440 it reports `load failed: hero-film-m.mp4`. The browser fires `error` on a `<source>` whose `media` does not match, and nothing actually fails to load.
- Home Lighthouse on pagespeed.web.dev (the local kit's Lighthouse runs behind a proxy, so its performance numbers are lower).

## Handoff (2026-11-16)
The repo moved from `~/Documents/motion-lexicon-site` to `~/code/sites/motionboard`. The task-3 audit table, with what passed, what was fixed and what waits on Rui: `~/Library/Application Support/Claude/side-session-notes/local_b345c0d6-e7e0-4bab-8a09-d8143b50b9a1/mb-task3-audit.md`. Open item: aligning with the shared design system (light theme, 17px body and the related size changes) waits on Rui.

## Launch-film showcase and film tools (task 10, 2026-11-26)
- `/guides/launch-video-examples/` is a guide page built from the `showcase` block (`src/data/content.ts`, rendered by `ShowFilm` in `src/components/page/ContentPage.tsx`, styles `.pg-show`/`.pg-film` in `src/styles/page.css`). Films are `launch-<product>-<tool>{.mp4,-m.mp4,.jpg}` on R2; `scripts/video-sitemap.mjs` lists the films whose name ends in `-motionboard`.
- Skill `film/join.mjs` snaps cuts to the beat of the bundled tracks (tempo table at the top of the file) and mixes per-shot `sfx` cues (render clock) from `film/sfx/` (CC0). Film sources and v3 joins: winlinux `~/mb/film-test/motionboard-v2/<product>/launch-film/` (`film-v3.json`), Mac copies in `marketing/film-test/` (git-excluded). Web encodes: winlinux `~/mb/showcase/enc.sh <src> <base> [poster s]`.
- Media with `media="(max-width: 767px)"` sources also trips the design-check `load failed: ...-m.mp4` false positive on any page, not only home.
- Long unbroken links in zh body text overflow at 390 px; `.pg-body` has `overflow-wrap: break-word`.

## Adding recipes (task 11, 2026-11-26)
- A recipe = `src/data/terms.json` entry (zh copy + `samples`) + `src/data/en.json` entry + `src/data/seo/<slug>.json` + `skills/motionboard/source/<video>/` + a `film/shots.json` slot + five media files (`<video>.mp4`, `-m.mp4`, `-s.mp4`, `.jpg`, `-m.jpg`, posters 960x540) + `orig-<youtubeId>-<startSec>.{mp4,jpg}` per sample. `npm run build` regenerates recipe md, README tables and llms.txt.
- Original clip names collide when two recipes sample the same film at the same start second (`orig-TNhX1uR2vO8-0` serves light-reveal, text-object-interleave and text-behind-object-effect). Reuse the existing file; never re-encode it over the R2 copy.
- Batch-1 working files (briefs, review sheets, merge script) were in the session scratchpad and are gone; the films' sources in `skills/motionboard/source/` are the record.
