# Blur Text Animation

Large words on a dark field resolve from heavy blur one at a time, each line blurs away word by word before the next arrives, the product screen behind sharpens with the line about focus, and the closing tagline sharpens before the product mark lands under it.

- Position in a launch film: Ending
- Slug: blur-text-animation
- Preview video: https://media.motionboard.app/blur-text.mp4
- Recipe page (preview film and original side by side): https://motionboard.app/recipes/blur-text-animation/
- Film length: 10.5s, 1920x1080
- Original reference: Webflow Campaigns (YouTube, 0:41) https://www.youtube.com/watch?v=MWbSTVGM-Ws&t=41s
- Original reference: Linear At your command (YouTube, 0:46) https://www.youtube.com/watch?v=mRql2VJ99gM&t=46s

## How to use this recipe

You are a coding agent. The user wants this shot for their own product. Follow these steps.

1. **Know the product.** If the product is clear from the user's repo or conversation, ask nothing and start. Otherwise ask once for: product name, logo file, brand colors.
2. **Pick the output.** If the user's message says a video or their website, do that. Otherwise ask once which one they want.
   - **Video (HyperFrames).** Copy the folder `../source/blur-text/` (next to this file in the skill) into the user's working folder, for example `cp -R <skill dir>/source/blur-text ./blur-text`. Adapt `index.html` (see "What to adapt"). Run `npx --yes hyperframes@0.8.209 check` on the untouched copy first and note its result. Preview with `npx --yes hyperframes@0.8.209 preview`, render an MP4 with `npx --yes hyperframes@0.8.209 render` (into `renders/`, named with a timestamp). The same commands are in `package.json` as `dev`, `check`, `render`; pass flags after `--`, as in `npm run render -- --quality draft`. Rendering needs network access for web fonts and GSAP.
   - **Website motion.** Port the GSAP timeline in `index.html` into the user's site, using their stack (React, Vue, Svelte, plain HTML). Build the same DOM structure, keep the timeline's durations, delays and easings exactly, and start it when the element scrolls into view (IntersectionObserver or ScrollTrigger). Respect `prefers-reduced-motion: reduce`: show the final frame as a static state and skip the movement.
3. **What to adapt.**
   - **Brand layer** (product name, logo, colors, fonts, copy): replace directly with the user's.
   - **UI layer** (the product screens, cards, windows, controls shown in the shot): rebuild the user's real UI as clean DOM, from their codebase (components, design tokens) or from a screenshot used as reference only. Never paste a screenshot into the shot.
   - **Motion** (timing, easing, camera moves, layering, stagger, order of events): keep exactly as in the source. This is what the recipe is.
   - The timeline targets UI elements by id and class, and camera moves land on fixed coordinates. Keep the ids the timeline uses, keep row counts and text lengths close to the source, and when the layout moves, update the target coordinates without changing the times.
4. **Fonts.** HyperFrames fetches Google Fonts such as Inter on its own. Some sources use macOS local fonts (PingFang, Songti via `local()`). Use the user's brand font when it can be bundled; for a system font such as SF Pro, use Inter. Check that text still fits its boxes.
5. **Verify.** Compare the render with the preview film on the recipe page at the beat times in the Timing row. The beats, timing and camera should match; only brand and UI content differ.

## Matches requests like

- Words come out of heavy blur one at a time
- One line blurs away word by word and the next line comes in
- The tagline sharpens last and the product mark lands under it

## Spec

| Item | Value |
| --- | --- |
| Timing | Film 10.5s. Line 1 resolves 0.45–2.6s (0.28s between words, 0.035s between letters, 1.1s per letter) and blurs out 2.95–3.95s (0.1s between words); line 2 resolves 3.55–4.9s (0.2s between words, 0.95s each) and blurs out 5.15–6.05s; line 3 resolves 5.7–7.28s (0.17s between words, 0.9s each) and blurs out 7.0–8.02s (0.08s between words); tagline letters resolve 7.55–9.28s (0.3s between words, 0.04s between letters, 1.15s per letter); the tagline rises and the mark lands 8.7–9.65s; wordmark letters 8.85–10.11s; held to the end |
| Easing | Entrance blur, scale and drift power3.out, opacity power1.out over half the duration; exit blur, scale and drift power2.in, opacity power1.in starting 0.12s later; tagline rise, mark and wordmark `cubic-bezier(0.16,1,0.3,1)` (expo.out); background screen sharpening and dimming power2.inOut; the pushes, the screen scale and the page scroll are constant-speed |
| Camera | Locked framing with slow drifts only: the text layer scales 1.0→1.045 over 0–10.5s; the editor behind scales 1.07→1.0 over 0–8s while its page scrolls up 140px; the lockup layer scales 1.0→1.035 over 8.7–10.5s |
| Subject | Inter 700, letter-spacing -0.035em, line height 1.04: lines 1 and 3 at 150px in two rows, line 2 at 168px in one row, tagline at 184px in one row. Each unit starts at 52px blur (tagline 60px), scale 1.12, opacity 0, drifts at most 9px sideways and rises from 12–26px below, and ends at 0px blur, scale 1; the exit goes to 46px blur, scale 1.07, 14px up, at most 7px sideways and opacity 0, with the drift taken from a seeded generator (mulberry32). Line 1 and the tagline split into letters; lines 2 and 3 move per word. The mark is a 108px amber rounded square (radius 24 per 100) with a dark C stroke and a cursor bar; the Clearline wordmark is Inter 700 at 96px, 26px from the mark. Behind it sits a 1700x960 Clearline editor at (110px, 60px) with a 250px sidebar, a draft titled Introducing Clearline 2.0 and a 360px clarity panel (score 92), at 60% opacity under an elliptical dark veil (1350x620, 80% at the centre, 12% at the edge) |
| Sync | While line 3 reads We bring it into focus., the editor sharpens from 9px blur over 5.6–6.9s; as the tagline resolves the editor dims from 60% to 13% over 7.5–8.6s and an amber glow behind the tagline rises over 7.55–8.95s; the tagline rises 104px at 8.7s and the mark starts resolving at 8.75s, so the lockup sits under the tagline; each line starts arriving 0.35–0.47s before the previous line has finished blurring out |
| Style | Near black `#09090b`, text `#f4f4f6`, grey `#8a8a96` for blurry. and rough., one accent amber `#ffb15c` (clearly., the glow behind the tagline, the mark gradient #ffc98a to #ff8c38 and the suggestion marks in the editor); Inter only; a vignette (55% at the edge) and film grain (9% opacity, repositioned every 1/12s from a seeded generator) |

## Why it works

Blur reads as not yet in focus. A word at 52px blur still has its colour and rough width, so the eye sees where the text will land and then reads the meaning one word at a time at the pace of the stagger. The hero lines resolve letter by letter, so a word grows from the inside letter by letter; the smaller lines resolve per word, which keeps them quick. The blur-out is the same move in reverse, word by word, so a line leaves in the order it came and the next line arrives in the space it freed. The product screen behind starts blurred too and sharpens from 9px blur with the line We bring it into focus., so the image and the words say the same thing. The close is the only hold in the film: the tagline sharpens last, the screen dims to 13% and the mark lands under it, so the final frame is a tagline and a mark on near black with one amber accent, #ffb15c.

## Prompt

> Build a 10.5-second, 1920x1080, 30 fps product film called Blur Text Animation for a fictional product, Clearline (an AI writing app). The frame is near black #09090b with text #f4f4f6; grey #8a8a96 is used only on the words blurry. and rough., and the only accent color is amber #ffb15c. Use Inter 700 only, letter-spacing -0.035em, line height 1.04, text centered. Behind the text sits a blurred product screen: a 1700x960 Clearline editor with its top-left at (110, 60), a 250px sidebar (Search, Ask Clearline, Recent, a Drafts list, Folders, a user Maya Chen at the bottom), a real draft titled Introducing Clearline 2.0 in the middle (a few English paragraphs, a list and two amber-underlined suggestions) and a 360px clarity panel on the right (score 92, Readability Grade 7, four suggestion cards). The editor is at 60% opacity under an elliptical dark veil (1350x620, rgba(9,9,11,0.8) at the centre, 0.12 at the edge). Every text unit moves the same way. Entrance: start at 52px blur, scale 1.12, opacity 0, at most 9px sideways drift and 12–26px below; blur, scale and position ease to 0px, 1 and 0 with power3.out and opacity rises to 1 with power1.out over half the duration. Exit: 46px blur, scale 1.07, 14px up, at most 7px sideways, power2.in over 0.7s, opacity fading with power1.in over 0.5s starting 0.12s later. Take drift values from a seeded generator (mulberry32), never Math.random. Timeline: at 0.45s line 1 enters at 150px in two rows, Every idea / starts blurry., split into letters, 0.28s between words, 0.035s between letters, 1.1s per letter; from 2.95s it blurs out word by word, 0.1s apart. At 3.55s line 2, Say it rough., enters at 168px in one row, moving per word, 0.2s between words, 0.95s each; from 5.15s it blurs out word by word, 0.1s apart. At 5.7s line 3, We bring it / into focus., enters at 150px in two rows, 0.17s between words, 0.9s each; from 7.0s it blurs out word by word, 0.08s apart. Each line starts arriving about 0.4s before the previous line has finished blurring out. Background screen: opacity rises to 60% over 0–1.2s (power2.out) with a 9px blur at the start, sharpens over 5.6–6.9s (power2.inOut, aligned with line 3) and dims to 13% over 7.5–8.6s; over 0–8s it scales from 1.07 to 1.0 while its page scrolls up 140px at constant speed. At 7.55s the tagline Write clearly. enters at 184px in one row, split into letters, starting at 60px blur, 0.3s between words, 0.04s between letters, 1.15s per letter, with clearly. in amber; an amber glow rises behind it (ellipse 900x380, 20% at the centre, 1.4s power2.out). At 8.7s the tagline rises 104px (0.95s, expo.out) and at 8.75s the mark resolves from 24px blur and scale 0.8 (0.9s, expo.out): a 108px amber gradient rounded square (#ffc98a to #ff8c38, radius 24 per 100) with a dark #1a1209 C stroke and a cursor bar. To its right the wordmark Clearline, Inter 700 at 96px, 26px away, resolves letter by letter from 22px blur starting 8.85s, 0.045s between letters, 0.9s each. The lockup row sits with its top at 656px and holds to the end of the film, pushing slowly to 1.035x over 8.7–10.5s. Across the whole film the text layer scales from 1.0 to 1.045 at constant speed. Add a vignette (55% at the edge) and film grain (9% opacity, repositioned every 1/12s).

## Often confused with

- [Word-by-Word Text Highlight](./word-by-word-text-highlight.md): Word-by-Word Highlight brightens words from gray to white in a line that never moves or blurs; in Blur Text Animation each word resolves from heavy blur with scale and drift, and the whole line then blurs away word by word.
- [One Word per Cut](./one-word-per-cut.md): One Word per Cut swaps words by cutting, with a new screen behind each one; in Blur Text Animation the words resolve in place from blur, lines hand over by blurring out, and the screen behind focuses once.

## Source files

Runnable HyperFrames project, 3 files.

- ../source/blur-text/hyperframes.json (318 B)
- ../source/blur-text/index.html (20.7 KB)
- ../source/blur-text/package.json (298 B)

Read `../source/blur-text/index.html` in full before adapting it: it holds the whole composition and its GSAP timeline.
