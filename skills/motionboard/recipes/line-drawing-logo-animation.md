# Line Drawing Logo Animation

Motionboard shot name: Plotter-Drawn Logo

A low macro camera follows a plotter pen across paper: it draws a ring and a meridian, sketches each letter as a skeleton, a heavy pen fills them in, then the film cuts to the flat logo, which blurs while the date and URL type on below it.

- Position in a launch film: Ending
- Slug: line-drawing-logo-animation
- Preview video: https://media.motionboard.app/plotter-logo.mp4
- Recipe page (preview film and original side by side): https://motionboard.app/recipes/line-drawing-logo-animation/
- Film length: 11s, 1920x1080
- Original reference: Linear Orbit (YouTube, 0:00) https://www.youtube.com/watch?v=PsY9J2DB1FM
- Original reference: Linear Orbit (YouTube, 0:15) https://www.youtube.com/watch?v=PsY9J2DB1FM&t=15s

## How to use this recipe

You are a coding agent. The user wants this shot for their own product. Follow these steps.

1. **Know the product.** If the product is clear from the user's repo or conversation, ask nothing and start. Otherwise ask once for: product name, logo file, brand colors.
2. **Pick the output.** If the user's message says a video or their website, do that. Otherwise ask once which one they want.
   - **Video (HyperFrames).** Copy the folder `../source/plotter-logo/` (next to this file in the skill) into the user's working folder, for example `cp -R <skill dir>/source/plotter-logo ./plotter-logo`. Adapt `index.html` (see "What to adapt"). Run `npx --yes hyperframes@0.8.209 check` on the untouched copy first and note its result. Preview with `npx --yes hyperframes@0.8.209 preview`, render an MP4 with `npx --yes hyperframes@0.8.209 render` (into `renders/`, named with a timestamp). The same commands are in `package.json` as `dev`, `check`, `render`; pass flags after `--`, as in `npm run render -- --quality draft`. Rendering needs network access for web fonts and GSAP.
   - **Website motion.** Port the GSAP timeline in `index.html` into the user's site, using their stack (React, Vue, Svelte, plain HTML). Build the same DOM structure, keep the timeline's durations, delays and easings exactly, and start it when the element scrolls into view (IntersectionObserver or ScrollTrigger). Respect `prefers-reduced-motion: reduce`: show the final frame as a static state and skip the movement.
3. **What to adapt.**
   - **Brand layer** (product name, logo, colors, fonts, copy): replace directly with the user's.
   - **UI layer** (the product screens, cards, windows, controls shown in the shot): rebuild the user's real UI as clean DOM, from their codebase (components, design tokens) or from a screenshot used as reference only. Never paste a screenshot into the shot.
   - **Motion** (timing, easing, camera moves, layering, stagger, order of events): keep exactly as in the source. This is what the recipe is.
   - The timeline targets UI elements by id and class, and camera moves land on fixed coordinates. Keep the ids the timeline uses, keep row counts and text lengths close to the source, and when the layout moves, update the target coordinates without changing the times.
4. **Fonts.** HyperFrames fetches Google Fonts such as Inter on its own. Some sources use macOS local fonts (PingFang, Songti via `local()`). Use the user's brand font when it can be bundled; for a system font such as SF Pro, use Inter. Check that text still fits its boxes.
5. **Verify.** Compare the render with the preview film on the recipe page at the beat times in the Timing row. The beats, timing and camera should match; only brand and UI content differ.

## Matches requests like

- The camera hugs the paper while a pen draws a ring and letters
- After the line drawing, a heavy pen fills every letter from left to right
- The logo blurs back into the paper and the date and URL type on below it

## Spec

| Item | Value |
| --- | --- |
| Timing | Film 11s. Hard cuts at 1.9s, 3.4s and 4.7s, and to the flat logo at 5.8s. A thin pen draws the ring 0–2.6s (55% to closed) and a blue pen the meridian 2.3–3.2s. The 10 skeletons start from 3.0s to 4.78s, 0.16–0.22s apart, 0.3–0.55s each. The heavy pen fills 4.5–5.755s, characters 0.075s apart, 0.42s each. Flat logo 5.8–7.0s, defocus 7.0–7.9s, the lockup moves up 90px as it defocuses, date types from 7.75s, URL from 8.15s, held to 11s. The paper texture and guides are on screen from frame 0 with no fade-in |
| Easing | Ring pen `none` (constant speed); meridian and letter skeletons `power1.inOut`; heavy fill `power2.out`; guides `power2.out`; camera constant speed (`none`) in takes 1, 2 and 3, `power3.out` in take 4; logo defocus `power2.inOut`; date and URL `expo.out` (0.5s per character, 0.035s apart, each character rising 8px from below and going from 6px blur to sharp) |
| Camera | Perspective 1500px, the paper tilted about a horizontal axis. Take 1 zoom 5.2→4.4, tilt 58°→55°, roll −10°→−6°, the camera aimed 4° of arc ahead of the pen tip so the tip stays near the middle of the frame (about 45% of the frame height); take 2 zoom 2.5→2.2, tilt 50°→47°; take 3 zoom 1.9→1.75, tilt 55°→52°, the camera sliding right aimed about 25 units left of the letter being drawn, so the pen tip sits in the middle-right of the frame; take 4 zoom 1.15→0.78, tilt 52°→46°, pulling back and sliding right while the fill runs, with the whole mark inside the frame at its start and the right edge of the 6 about 280px inside the frame at the end. An extra 1.00→1.02 slow push runs across all four takes. Depth of field uses four identical copies of the plane blurred 0, 2.4, 6 and 12px, with a focus band half-width of 150, 190, 160 and 330px (takes 1 to 4) |
| Subject | Plane units: 1 unit = 2.8px, x-height 100 units (280px). Mark: an ink ring plus a blue meridian ellipse (radius 66, half-width 30 units); wordmark meridian plus a blue 26, 10 characters built from arcs and straight lines. Thin pen 0.7 units (about 2px), heavy pen 16 units (about 45px) for letters and 13 units for the ring and meridian. 36 guide strokes: 4 horizontal rulings, 3 concentric circles, 3 diagonals, 2 cross lines, the left and right edge of every character and the bounding circle of each round letter, plus baseline ticks every 6 units and registration crosses |
| Sync | Each character's guides are drawn 0.8–0.9s before its skeleton; each character's heavy stroke starts only after its own skeleton is done (the m skeleton ends at 3.55s and its fill starts at 4.66s; the 6 skeleton ends at 5.28s and its fill starts at 5.335s); strokes inside a character run one after another in both passes (m: stem, then the two arches; e: crossbar, then the bowl) and the character's total time stays the same; the i-dots fill 0.28s after the heavy stroke starts; the last character is filled at 5.755s and the film cuts to the flat logo at 5.8s, 0.045s later |
| Style | Paper base `#f3f4f6` with two multiply relief textures (256px and 1024px); ink `#0d0f13`, ultramarine accent `#2346ff` (meridian, 26, URL), guides `#7d838d`; a 256px grain tile jumped every frame (9% multiply, 3% screen) and a 30% vignette; date and URL Inter 500, 50px, centered (date text box top at y=600px, URL at y=680px), the URL in the accent color |

## Why it works

Macro paper with depth of field makes a few thin lines the subject, so the viewer sees how the logo is drawn before seeing the finished mark. Four camera positions cut at 1.9s, 3.4s and 4.7s, each showing one thing (ring, meridian, letters, fill), and the three cut points set the rhythm. After the hard cut to the flat logo it defocuses into the paper over 0.9s (moving up 90px) and the date and URL type on below it once the defocus has finished, so the two never overlap and the eye does not have to move. The whole film has one accent color, used only for the meridian, the 26 and the URL.

## Prompt

> Build a closing shot called Plotter-Drawn Logo for an event, 11 seconds, 1920×1080, 30fps. Use one paper plane (base #f3f4f6 with relief texture) that carries the whole logo: a mark made of an ink ring and a blue (#2346ff) meridian ellipse, plus a lowercase wordmark meridian built from arcs and lines and a blue 26, 10 characters in all, x-height 100 units = 280px. The camera is a low macro with 1500px perspective, and depth of field comes from four identical copies of the plane blurred 0, 2.4, 6 and 12px with a focus band half-width of 150–330px. Draw every stroke with stroke-dashoffset and set pathLength to 10000 (GSAP rounds CSS lengths to whole numbers, so a pathLength of 1 makes strokes jump). 0–1.9s take 1 (zoom 5.2→4.4, tilt 58°→55°, constant speed): the paper texture and gray guides (cross lines, concentric circles, diagonals, horizontal rulings) are on screen from frame 0 with no fade-in, and a thin pen (about 2px) draws the ring at constant speed from 55% to 79% while the camera is aimed 4° of arc ahead of the pen tip, so the tip stays in the middle of the frame. At 1.9s hard cut to take 2 (zoom 2.5→2.2, tilt 50°→47°): the ring closes at 2.6s, a blue pen draws the meridian ellipse over 0.9s (power1.inOut), and from 3.0s the m appears at the right edge. At 3.4s hard cut to take 3 (zoom 1.9→1.75, tilt 55°→52°, constant speed): the 10 character skeletons start in turn at 3.0, 3.22, 3.44, 3.62, 3.78, 3.98, 4.14, 4.34, 4.56 and 4.78s, 0.3–0.55s each with power1.inOut, the strokes inside a character drawn one after another, each character's edge lines and bounding circle start drawing 0.8–0.9s earlier; the camera slides right, aimed about 25 units left of the letter being drawn, so the pen tip sits middle-right in the frame. At 4.7s hard cut to take 4 (zoom 1.15→0.78, tilt 52°→46°, power3.out, the camera pulling back and sliding right), opening with the whole ring mark inside the frame and ending with the right edge of the 6 about 280px inside the frame: a heavy pen (letters 16 units, about 45px; ring 13 units) traces over every skeleton, ring at 4.5s, meridian at 4.58s, characters from 4.66s every 0.075s, 0.42s each (power2.out), the strokes inside a character drawn one after another (m: stem, then the two arches; e: crossbar, then the bowl), the i-dots filling 0.28s later. At 5.8s hard cut to the flat paper: the logo is 1480px wide and centered, pushing 1.00→1.03 until 7.0s, then over 0.9s (power2.inOut) it defocuses to 16px blur, 18% opacity and scale 1.10 while moving up 90px, and keeps drifting to 1.14. From 7.75s the date "16 Dec 2026" (Inter 500, 50px, text box top at y=600px, below the defocused logo) types in character by character, 0.5s each with expo.out, 0.035s apart, rising 8px from below and going from 6px blur to sharp; from 8.15s the URL "meridian26.com" (text box top at y=680px) types in the same way in the accent color; hold to 11s. Finish with a per-frame jumping grain tile and a vignette. Build it with HTML/SVG + GSAP.

## Often confused with

- [Logo Wordmark Reveal](./logo-wordmark-reveal.md): Mark-to-Wordmark Unfold pushes the wordmark out of an existing mark in one 1.3s move; Plotter-Drawn Logo draws the mark and wordmark stroke by stroke on blank paper with a moving camera and ends on a date and URL.
- [Outline-to-Solid Reveal](./outline-to-solid-reveal.md): Outline to Solid lights a product outline and fills it in place on a fixed camera; Plotter-Drawn Logo draws the strokes one by one on paper with a moving macro camera.

## Source files

Runnable HyperFrames project, 3 files.

- ../source/plotter-logo/hyperframes.json (318 B)
- ../source/plotter-logo/index.html (23.6 KB)
- ../source/plotter-logo/package.json (301 B)

Read `../source/plotter-logo/index.html` in full before adapting it: it holds the whole composition and its GSAP timeline.
