# One Word per Cut

One line is split into one word per shot. Each word sits at the center of the frame over a different product screen, file-name captions follow, then the full line lands on a cream card before the wordmark.

- Position in a launch film: Opening
- Slug: one-word-per-cut
- Preview video: https://media.motionboard.app/word-per-cut.mp4
- Recipe page (preview film and original side by side): https://motionboard.app/recipes/one-word-per-cut/
- Film length: 10.8s, 1920x1080
- Original reference: Anthropic What we make of this moment (YouTube, 0:06) https://www.youtube.com/watch?v=JDsFHmq9hlA&t=6s
- Original reference: Anthropic What we make of this moment (YouTube, 1:04) https://www.youtube.com/watch?v=JDsFHmq9hlA&t=64s

## How to use this recipe

You are a coding agent. The user wants this shot for their own product. Follow these steps.

1. **Know the product.** If the product is clear from the user's repo or conversation, ask nothing and start. Otherwise ask once for: product name, logo file, brand colors.
2. **Pick the output.** If the user's message says a video or their website, do that. Otherwise ask once which one they want.
   - **Video (HyperFrames).** Copy the folder `../source/word-per-cut/` (next to this file in the skill) into the user's working folder, for example `cp -R <skill dir>/source/word-per-cut ./word-per-cut`. Adapt `index.html` (see "What to adapt"). Run `npx --yes hyperframes@0.8.209 check` on the untouched copy first and note its result. Preview with `npx --yes hyperframes@0.8.209 preview`, render an MP4 with `npx --yes hyperframes@0.8.209 render` (into `renders/`, named with a timestamp). The same commands are in `package.json` as `dev`, `check`, `render`; pass flags after `--`, as in `npm run render -- --quality draft`. Rendering needs network access for web fonts and GSAP.
   - **Website motion.** Port the GSAP timeline in `index.html` into the user's site, using their stack (React, Vue, Svelte, plain HTML). Build the same DOM structure, keep the timeline's durations, delays and easings exactly, and start it when the element scrolls into view (IntersectionObserver or ScrollTrigger). Respect `prefers-reduced-motion: reduce`: show the final frame as a static state and skip the movement.
3. **What to adapt.**
   - **Brand layer** (product name, logo, colors, fonts, copy): replace directly with the user's.
   - **UI layer** (the product screens, cards, windows, controls shown in the shot): rebuild the user's real UI as clean DOM, from their codebase (components, design tokens) or from a screenshot used as reference only. Never paste a screenshot into the shot.
   - **Motion** (timing, easing, camera moves, layering, stagger, order of events): keep exactly as in the source. This is what the recipe is.
   - The timeline targets UI elements by id and class, and camera moves land on fixed coordinates. Keep the ids the timeline uses, keep row counts and text lengths close to the source, and when the layout moves, update the target coordinates without changing the times.
4. **Fonts.** HyperFrames fetches Google Fonts such as Inter on its own. Some sources use macOS local fonts (PingFang, Songti via `local()`). Use the user's brand font when it can be bundled; for a system font such as SF Pro, use Inter. Check that text still fits its boxes.
5. **Verify.** Compare the render with the preview film on the recipe page at the beat times in the Timing row. The beats, timing and camera should match; only brand and UI content differ.

## Matches requests like

- One line is split so each word gets its own shot
- The word stays dead center while a new product screen changes behind it every 0.5s
- File-name captions follow, then the full line lands on a cream card

## Spec

| Item | Value |
| --- | --- |
| Timing | Film 10.8s, all hard cuts. Eight words: Everything 0–0.6s, your 0.6–1.1s, team 1.1–1.6s, knows, 1.6–2.3s (comma holds 0.2s longer), ready 2.3–2.8s, when 2.8–3.3s, you 3.3–3.8s, ask. 3.8–4.7s (last word holds 0.9s). Four file-name captions at 4.7–5.2s, 5.2–5.8s, 5.8–6.3s and 6.3–6.8s. Full-line card 6.8–8.6s (1.8s), wordmark 8.6–10.8s (2.2s) |
| Easing | Each shot's camera move uses `power3.out` for the full shot length (0.5–0.9s), so it is still moving at the cut; word entrance `expo.out` 0.28s, scale 1.08 to 1 and blur 10px to 0; the screen's defocus settles from 6px to 2.5px in 0.3s (caption shots 5px to 3px); caption `expo.out` 0.22s, rising 6px while fading in; card lines `expo.out` 0.5s, rising 14px, 0.08s apart; icon tiles `expo.out` 0.8s, 0.07s apart; wordmark letters `expo.out` 0.9s, 0.05s apart |
| Camera | Each shot is one 1920×1080 app screen (a 1560×900 window, alternating light and dark) with 1800px perspective. Everything pulls from 2.0x to 1.5x with Y rotation -7° to -2°; your pushes from 1.15x to 1.45x, rotation 10° to 4°, roll -1.5° to -0.5°; team holds 1.5x while the camera center slides 360px right; knows, pulls from 2.3x to 1.4x, roll 1.5° to 0°; ready pulls from 1.6x to 1.45x, X rotation -6° to -1°, roll 3° to 0°; when pushes from 1.05x to 1.6x; you goes 1.55x to 1.45x, X rotation 8° to 2°, roll -1° to 0°; ask. pushes from 1.25x to 1.4x. Caption shots are macro crops of four screens, each centered on a dense, colorful area, alternating light and dark: 4.7s light doc, goals list above and the milestone table with avatars and status pills below, the caption in the blank band between them, 2.6x to 2.9x; 5.2s dark meeting notes, waveforms and transcript, 2.5x to 2.8x; 5.8s light dashboard, metric cards and the line-and-area chart, 2.6x to 3.1x; 6.3s dark inbox, avatars and mail rows, 2.6x to 3.0x; roll within ±2°. The card scales 1.00 to 1.035 and the wordmark 1.00 to 1.04, linear |
| Subject | Word: EB Garamond 500, 184px, letter-spacing -0.025em, fixed at frame center; warm white `#f8f4ec` on dark screens, ink `#17161b` on light screens. Behind each word sits a soft ellipse scrim (dark screens 1000×340px `rgba(6,6,10,0.72)`, light screens 1240×440px `rgba(250,249,253,0.72)`, fading out in steps to 0) plus a vignette (dark screens edge `rgba(0,0,0,0.42)`, light screens edge `rgba(40,36,60,0.18)`). All eight screens belong to the product Tessel: doc, inbox, board, meeting notes, calendar, dashboard, customer table and Q&A, each with 12–30 items of real content. Captions use JetBrains Mono 38px, centered over each macro crop on a rounded backing pill (17px 32px 19px padding, 14px radius; dark crops `rgba(8,8,12,0.72)`, light crops `rgba(250,249,253,0.94)` with a 1px `rgba(23,22,27,0.08)` border and a `0 6px 24px rgba(30,28,60,0.12)` shadow), for example `/ Q4-launch-plan /`. On dark crops the text is `#f6f3ee` with `#a9a9ff` slashes under a 1100×420px dimming scrim (`rgba(6,6,10,0.5)` fading to 0.14); on light crops the text is `#17161b` with `#5b5bf0` slashes under a 1240×440px light scrim (`rgba(250,249,253,0.56)` fading to 0) |
| Sync | The cut, the word and the screen change on the same frame; the word's entrance blur clears within 0.28s and the screen's defocus settles to 2.5px within 0.3s, so both turn sharp almost together. Captions start fading in 0.04s after the cut. On the card the first line appears at 6.8s and the second 0.08s later, with the last word ask. in the accent color. Wordmark scene: icon base from 8.6s for 0.7s, the four tiles from 8.68s each 0.07s later, letters from 8.65s, tagline at 8.6s (0.3s fade) |
| Style | Dark screens (window `#0f0f13`, panel `#17171c`) alternate with light screens (window `#f3f3f6`, panel `#ffffff`) over soft violet-blue and peach radial wallpapers; the only accent is indigo `#5b5bf0` (`#9a9aff` for text on dark screens); the ending uses a cream background `#f3efe6`, wordmark Inter 600 176px, letter-spacing -0.04em, and a 210px app icon (indigo rounded square, four tiles, one of them amber) |

## Why it works

The word keeps its position and size while only the screen behind it changes, so the viewer's eye never moves and each word has 0.5s to read. Eight words map to eight real screens (doc, inbox, board, meeting notes, calendar, dashboard, customer table, Q&A), so by the end of the sentence the product's main modules have all appeared. The comma holds 0.2s longer and the last word holds 0.9s, which gives the line a rhythm. The complete sentence appears once, at the end, on a cream card, and the closing wordmark uses a single accent color.

## Prompt

> Build a 10.8s opening shot called One Word per Cut, 1920×1080, 30fps, silent, all hard cuts. Split the line "Everything your team knows, ready when you ask." into words: Everything 0–0.6s, your 0.6–1.1s, team 1.1–1.6s, knows, 1.6–2.3s, ready 2.3–2.8s, when 2.8–3.3s, you 3.3–3.8s, ask. 3.8–4.7s. Set each word in EB Garamond 500, 184px, letter-spacing -0.025em, always at the exact center of the frame, warm white #f8f4ec on dark screens and ink #17161b on light screens. Behind each word is a different product screen (a 1560×900 macOS window with 12–30 items of real English content, alternating light and dark): doc, inbox, board, meeting notes, calendar, dashboard, customer table, Q&A. Use 1800px perspective. Each screen has its own camera move with power3.out for the full shot length: shot 1 pulls from 2.0x to 1.5x with Y rotation -7° to -2°; shot 2 pushes from 1.15x to 1.45x with rotation 10° to 4°; shot 3 holds 1.5x and slides 360px right; shot 4 pulls from 2.3x to 1.4x; shot 5 pulls from 1.6x to 1.45x with X rotation -6° to -1°; shot 6 pushes from 1.05x to 1.6x; shot 7 goes 1.55x to 1.45x with X rotation 8° to 2°; shot 8 pushes from 1.25x to 1.4x. Each screen lands defocused by 6px and settles to 2.5px in 0.3s, and the word resolves with expo.out in 0.28s from scale 1.08 and 10px blur. Put a soft ellipse scrim behind the word (dark screens 1000×340px rgba(6,6,10,0.72); light screens 1240×440px rgba(250,249,253,0.72); both fading out in steps to 0) plus a vignette (dark edge rgba(0,0,0,0.42), light edge rgba(40,36,60,0.18)) so the word stays readable. From 4.7 to 6.8s add four file-name captions with fixed windows: 4.7–5.2s "/ Q4-launch-plan /", 5.2–5.8s "/ Acme-renewal-call-Nov-6 /", 5.8–6.3s "/ Ask-usage-last-90-days /", 6.3–6.8s "/ Q3-pricing-review-final /". Each is a macro crop of one of the same screens, centered on a dense, colorful area and alternating light and dark: 4.7s the light doc with the goals list above and the milestone table (avatars and status pills) below, the caption in the blank band between them, at 2.6x to 2.9x; 5.2s the dark meeting notes (waveforms and transcript) at 2.5x to 2.8x; 5.8s the light dashboard (metric cards and the line-and-area chart) at 2.6x to 3.1x; 6.3s the dark inbox (avatars and mail rows) at 2.6x to 3.0x; roll within ±2°, defocus 5px settling to 3px. Set each caption in JetBrains Mono 38px, centered on a rounded backing pill (17px 32px 19px padding, 14px radius; rgba(8,8,12,0.72) on dark crops, rgba(250,249,253,0.94) on light crops, with a 1px rgba(23,22,27,0.08) border and a 0 6px 24px rgba(30,28,60,0.12) shadow), entering 0.04s after the cut with expo.out over 0.22s while rising 6px. On dark crops the text is #f6f3ee with #a9a9ff slashes over a 1100×420px scrim (rgba(6,6,10,0.5) fading to 0.14); on light crops the text is #17161b with #5b5bf0 slashes over a 1240×440px light scrim (rgba(250,249,253,0.56) fading to 0). From 6.8 to 8.6s hard cut to a cream #f3efe6 card with two lines, "Everything your team knows," and "ready when you ask.", in EB Garamond 500 124px, ink, with the last word ask. in the accent #5b5bf0; each line rises 14px and fades in with expo.out over 0.5s, the second line 0.08s after the first, and the card pushes slowly from 1.00 to 1.035. From 8.6 to 10.8s hard cut to the wordmark: a 210px app icon (indigo rounded square, four tiles, one amber) whose four tiles settle from the corners with expo.out over 0.8s, 0.07s apart, then the wordmark "Tessel" (or your product name) in Inter 600 176px, letters appearing one by one from 8.65s with expo.out over 0.9s, a one-line tagline reading "Docs, mail, meetings and answers in one place." (Inter 32px, grey #6b685f) at 8.6s with a 0.3s fade, and a slow push from 1.00 to 1.04. The only accent color is indigo #5b5bf0.

## Often confused with

- [Kinetic Typography](./kinetic-typography.md): Scattered Spec Type scatters several spec lines around the camera; One Word per Cut shows one word at a time at a fixed center while the whole screen behind it changes.
- [Typing Animation (Typewriter Effect)](./typing-animation.md): Rhythmic Typing types one line out in place letter by letter; One Word per Cut swaps whole words by cutting, so the cuts set the rhythm and the screen behind changes each time.

## Source files

Runnable HyperFrames project, 3 files.

- ../source/word-per-cut/hyperframes.json (318 B)
- ../source/word-per-cut/index.html (82.6 KB)
- ../source/word-per-cut/package.json (301 B)

Read `../source/word-per-cut/index.html` in full before adapting it: it holds the whole composition and its GSAP timeline.
