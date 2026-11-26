# Design

The look is coss ui's default (https://coss.com/ui): neutral, quiet, near-black primary, light and dark. A site changes one thing: its brand colour.

## Tokens
- Use coss tokens only: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border`, `bg-primary` / `text-primary-foreground`, `bg-muted`, `text-destructive`, `text-success`, `text-warning`, `text-info`, `ring`.
- `--brand` / `--brand-foreground` (Tailwind `text-brand`, `bg-brand`, `text-brand-foreground`) are the only per-site colours, set in `src/site/styles.css` for `:root` and `.dark`. Use them for the logo, links in prose, small highlights. Buttons stay coss `primary` (near-black / near-white).
- Never edit the coss token block in `src/core/styles/app.css`; a site that needs another token adds it in `src/site/styles.css`.
- Dark mode is the `.dark` class on `<html>`, set before paint by `THEME_SCRIPT` (saved choice, else system).

## Type and scale
- Inter (self-hosted Latin subset, preloaded) with the system stack as fallback; Chinese text uses the system CJK font. Monospace is the system mono.
- Visitor pages: body 16–18px with `leading-relaxed`; page h1 `text-4xl` mobile → `text-5xl/6xl` desktop, `font-semibold tracking-tight`; section h2 `text-2xl/3xl`. Buttons coss default size, `size="lg"` for the main hero action.
- Layout: centred `max-w-5xl px-4` containers (`max-w-3xl` for prose), sections spaced `py-12`–`py-20`, cards in `gap-4`/`gap-6` grids, single column on phones.

## Components
- coss components live in `src/core/ui/` (installed with the shadcn CLI from the `@coss` registry; see `components.json`). Add one with `npx shadcn@latest add @coss/<name>`; do not hand-edit them, so later registry updates apply cleanly.
- Only the components the template uses are kept, because Tailwind turns every class in `src/` into CSS that is inlined in every page.
- Popup components (menu, select, dialog, sheet, toast, tooltip, popover) are never in the first screen of a content page and never imported by the shell. Header navigation uses plain links and a native `<details>` on phones; FAQs use `<details>` so answers are in the HTML.

## Page patterns
- Tool / recipe page (JSON in `content/tools/`): breadcrumb, h1 with the search keyword, one-line lede, the tool widget, steps, FAQ, related pages, updated date.
- Guide / legal page (MDX in `content/guides/`, `content/legal/`): breadcrumb, h1, date, prose.
- Hub page: h1, lede, card grid.
- Account and app pages (layer 1): coss forms (`Field`, `Input`, `Button`), cards, tables; noindex.

## Checks
- Every new page type: light and dark, 390px and 1440px, no horizontal scroll, contrast AA, focus rings visible.
- `node ~/code/home/tools/design-check/check.mjs <url>` and the Lighthouse gate (`npm run lighthouse`).
