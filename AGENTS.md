# Motionboard: notes for agents

motionboard.app: 38 launch-film shot recipes and a free HyperFrames skill for Claude Code and Codex. Status, next steps and log: `~/code/home/projects/motionboard.md`. Shared site rules: `~/code/home/lines/sites.md`. Design: `DESIGN.md`.

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
- Skill: `skills/motionboard/` (runnable HyperFrames sources per recipe).

## Checks before reporting a UI change
- `npm test` passes.
- `node ~/code/home/tools/design-check/check.mjs --allow posthog.com --allow cloudflareinsights.com --allow motionboard.app <url>`. Known false positive: on the home page at 1440 it reports `load failed: hero-film-m.mp4`. The browser fires `error` on a `<source>` whose `media` does not match, and nothing actually fails to load.
- Home Lighthouse on pagespeed.web.dev (the local kit's Lighthouse runs behind a proxy, so its performance numbers are lower).

## Handoff (2026-11-16)
The repo moved from `~/Documents/motion-lexicon-site` to `~/code/sites/motionboard`. The task-3 audit table, with what passed, what was fixed and what waits on Rui: `~/Library/Application Support/Claude/side-session-notes/local_b345c0d6-e7e0-4bab-8a09-d8143b50b9a1/mb-task3-audit.md`. Open item: aligning with the shared design system (light theme, 17px body and the related size changes) waits on Rui.
