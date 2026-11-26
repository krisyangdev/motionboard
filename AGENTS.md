# Motionboard: notes for agents

motionboard.app: 58 launch-film shot recipes and a free HyperFrames skill for Claude Code and Codex. Status, next steps and log: `~/code/home/projects/motionboard.md`. Shared site rules: `~/code/home/lines/sites.md`. Design: `DESIGN.md`.

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

## Plan to 100: where batch 1 stopped (2026-11-26)
- Plan: `~/Library/Application Support/Claude/side-session-notes/local_582a33d3-16af-453e-b9c7-f939718a155c/mb-plan-100.md` (5 batches, one minor release each, v8.0.0 at 100). Batch 1 (#49–58) shipped as v7.1.0 (95e6407). Rui stopped the work after batch 1 (「做完第一批停下来」); start batch 2 only when Rui or the lead says so.
- Batch kit (copies of the scratchpad files, which are gone): `~/Library/Application Support/Claude/side-session-notes/local_b345c0d6-e7e0-4bab-8a09-d8143b50b9a1/mb-batch-kit/`:
  - `BRIEF.md`: the film builder brief for Sonnet subagents, with the hyperframes check rules learned in batch 1 at the end.
  - `COPY.md` + `FORMAT-example.json`: the copy brief. Each subagent writes `<slug>.json` as {terms, en, seo, shot}; terms needs every key, en1 included.
  - `merge.py`: merges those JSONs into terms.json, en.json, seo/ and shots.json. It is idempotent and keeps the repo's JSON formatting. Fix its two path constants before use.
  - `sheet.sh <folder> "<times>" <tag>`: rsyncs a source to winlinux and runs check + snapshot, then pulls contact sheets.
  - `dl.sh` / `dl2.sh`: yt-dlp downloads of the original moments.
- winlinux `~/mb/p100/`:
  - `sheet.sh` + `cj.py`: check summary and contact sheets.
  - `render.sh <folder> <poster s>`: renders, then `enc.sh` (CRF env, default 20; -m CRF+3, -s CRF+7) writes the five media files to `out/`. Grainy films need `CRF=27`.
  - `orig/out/`: encoded original clips. `orig/raw/`: raw downloads already fetched for batches 2–3 (`<ytid>-<startSec-1>.mp4`).
- Batch-1 lessons:
  - Review every film from contact sheets before rendering. Builders usually needed 1–3 rounds, mostly for framing, text size (headlines 72px+, captions 26px+), a lockup hold of at least 2.2 s, and cold-seek `fromTo` errors.
  - `text_occluded` and contrast errors on blurred or flare layers are false positives.
- Batch 2 needs, in order:
  1. Read the batch-2 rows in mb-plan-100.md.
  2. Download and encode the originals (check `orig/raw/` first).
  3. Brief one builder per film, review the sheets, then render.
  4. Collect copy JSONs and run `merge.py`.
  5. Add hub links and bump the counts (58→68) the way 95e6407 did.
  6. Ship: `scripts/upload-media.sh <files>`, `npm test`, design-check, commit, push, `npm run deploy`, `gh release create v7.2.0`.
  7. Check live: 200, both sitemaps, playback at 1440 and 390.
  8. Run PSI on 2 new pages, then report to the lead.
  - The Netflix-style page uses `"link": true` on its sample, so no clip is self-hosted.
- `npm run dev` returned 500 for every page on 2026-11-26 ("Failed to load url /src/site.config.ts", Cloudflare runner), old pages too. `npm run build && npm run preview` (port 4173) works for local checks.
