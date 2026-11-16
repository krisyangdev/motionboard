# Design

Motionboard follows the shared site design system at `~/code/home/design-system/` (`tokens.css`, `components.css`, `ds.js`, rules in its `README.md`, reference page `index.html`). The system was taken from this site's look, so most values match `src/styles/*.css` already.

Known differences, kept until Rui decides (2026-11-16): Motionboard is dark-only (the system defaults to light with a System / Light / Dark switch), body text is 15px (system 17px), h1 up to 72px (80px), radius 10px (12px), nav 52px (56px), `--ink-3` #86868b (#8e8e93). Until then, keep Motionboard's current values and use the system's rules for everything new: hairlines as inset shadows, ink primary button, accent only for position, wrapping chips (no sideways-scrolling rows), `text-wrap: balance` on headings and `pretty` on paragraphs, `tabular-nums` on counts, reduced motion stops everything, 4px grid.

Check UI changes with the acceptance kit: `node ~/code/home/tools/design-check/check.mjs --allow posthog.com --allow cloudflareinsights.com https://motionboard.app/`.
