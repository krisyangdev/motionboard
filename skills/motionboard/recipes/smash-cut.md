# Smash Cut

A loud crowd scene full of beams and flashes hard-cuts in one frame to pure black, a white line types in word by word, and then green LEDs light between the lines while the sensor rises out of the dark and shrinks into the mark.

- Position in a launch film: Transitions
- Slug: smash-cut
- Preview video: https://media.motionboard.app/smash-cut.mp4
- Recipe page (preview film and original side by side): https://motionboard.app/recipes/smash-cut/
- Film length: 11s, 1920x1080
- Original reference: Apple Watch Series 12 (YouTube, 1:22) https://www.youtube.com/watch?v=MO9HJsUxEEk&t=82s

## How to use this recipe

You are a coding agent. The user wants this shot for their own product. Follow these steps.

1. **Know the product.** If the product is clear from the user's repo or conversation, ask nothing and start. Otherwise ask once for: product name, logo file, brand colors.
2. **Pick the output.** If the user's message says a video or their website, do that. Otherwise ask once which one they want.
   - **Video (HyperFrames).** Copy the folder `../source/smash-cut/` (next to this file in the skill) into the user's working folder, for example `cp -R <skill dir>/source/smash-cut ./smash-cut`. Adapt `index.html` (see "What to adapt"). Run `npx --yes hyperframes@0.8.209 check` on the untouched copy first and note its result. Preview with `npx --yes hyperframes@0.8.209 preview`, render an MP4 with `npx --yes hyperframes@0.8.209 render` (into `renders/`, named with a timestamp). The same commands are in `package.json` as `dev`, `check`, `render`; pass flags after `--`, as in `npm run render -- --quality draft`. Rendering needs network access for web fonts and GSAP.
   - **Website motion.** Port the GSAP timeline in `index.html` into the user's site, using their stack (React, Vue, Svelte, plain HTML). Build the same DOM structure, keep the timeline's durations, delays and easings exactly, and start it when the element scrolls into view (IntersectionObserver or ScrollTrigger). Respect `prefers-reduced-motion: reduce`: show the final frame as a static state and skip the movement.
3. **What to adapt.**
   - **Brand layer** (product name, logo, colors, fonts, copy): replace directly with the user's.
   - **UI layer** (the product screens, cards, windows, controls shown in the shot): rebuild the user's real UI as clean DOM, from their codebase (components, design tokens) or from a screenshot used as reference only. Never paste a screenshot into the shot.
   - **Motion** (timing, easing, camera moves, layering, stagger, order of events): keep exactly as in the source. This is what the recipe is.
   - The timeline targets UI elements by id and class, and camera moves land on fixed coordinates. Keep the ids the timeline uses, keep row counts and text lengths close to the source, and when the layout moves, update the target coordinates without changing the times.
4. **Fonts.** HyperFrames fetches Google Fonts such as Inter on its own. Some sources use macOS local fonts (PingFang, Songti via `local()`). Use the user's brand font when it can be bundled; for a system font such as SF Pro, use Inter. Check that text still fits its boxes.
5. **Verify.** Compare the render with the preview film on the recipe page at the beat times in the Timing row. The beats, timing and camera should match; only brand and UI content differ.

## Matches requests like

- The loudest scene cuts to pure black in one frame, then a calm line types in
- The crowd, the beams and the flashes are at full volume, and then there is nothing but white text
- Once the words are done, the product lights up out of the black

## Spec

| Item | Value |
| --- | --- |
| Timing | Film 11s at 30 fps. Scene A runs 0–3.5s and cuts to pure black at 3.5s (frame 105) with no fade; black stays silent 3.5–3.95s; line 1 is The at 3.95s, most at 4.15s, accurate at 4.35s; line 2 is heart at 5.35s, rate at 5.55s, sensing. at 5.8s; each word fades in over 0.45s; the green LEDs fade in at 6.2s (0.5s) and pulse at 6.8s and 7.35s; the sensor plate rises from 6.7s over 1.3s; both lines fade out at 7.4s (0.45s); at 7.6s the sensor shrinks into the mark over 0.95s; the wordmark unfolds at 8.05s (0.9s, 0.05s between letters); the tagline fades in at 8.4s (0.4s); wordmark and tagline are in place by 8.8s and hold to the end at 11s |
| Easing | Scene A is driven by one linear clock (ease none) and redrawn every frame from the time; word fade-ins power2.out (0.45s, rising 5px with blur 6px→0); LED fade-in expo.out; plate rise power2.inOut; LED pulses power2.out up and power2.inOut back; shrink to the mark power3.inOut; wordmark expo.out (`cubic-bezier(0.16,1,0.3,1)`); the lines fade out power2.in |
| Camera | Scene A is handheld: scale `1.08 + 0.55 × (t/3.5)^2.4`, accelerating from 1.08x to 1.63x around the origin (960, 700); shake x = sin(47t)×9 + sin(83t+1.3)×6, y = sin(53t+0.7)×8 + sin(97t+2.1)×5, roll sin(31t)×0.006 rad, all three multiplied by an amplitude of 0.7→2.0 (0.7 + 1.3 × t/3.5), with the two front rows pushed 50% further; there is no shake on black: the sensor drifts 0.94→1.02 over 6.2–8.0s (linear) and the whole frame drifts 1→1.035 over 7.6–11.0s (linear) |
| Subject | The crowd has 14 rows (row r, d = r/13); figure height s = 10 + 120d² px and the row centre y = 450 + 750 × d^1.2. Each figure is random (seed 11): body width ×0.82–1.22, body height ×0.85–1.2, head ×0.78–1.28, spacing ×0.6–1.35, 7% left out, and each row starts at a different offset. Figures jump at 1.9–3.3Hz with height \|sin\| × 0.38s. Arms: 22% down, 38% both up, 14% left only, 14% right only, 12% holding a phone (a small pale blue-white screen with a flickering glow); 10% hold a glow stick (green or white). Figures are near-black silhouettes, rgb(26,36,52) on the far rows fading to rgb(6,8,12) on the near rows, with a thin rim light only on the top of the head and shoulders, its color and strength taken from the 8 lamps. The nearest two rows are drawn apart with a 12px Gaussian blur. 8 lamps at x = 120 + 245i with a base at y = 470 each throw one upward beam, 1600px long with a half-angle of 0.05 or 0.075 rad, sweeping ±0.78 rad about vertical at 1.9–3.3 rad/s; each beam is 3 nested wedges (widths 1, 0.62, 0.32 at 34% opacity each) for a soft edge, with a 380px-radius glow at the lamp, plus 6 drifting haze patches and 40 back and 12 front soft bokeh discs (radius 14–54px and 70–180px). A 560x214px heart-rate card sits top left: PULSE · LIVE · LAP 12, BPM climbing 126 to 200, Zone 5 and an ECG trace scrolling at 300px/s. The sensor plate is 776px across with 72 radial ticks, a central disc of radius 176px, two 34x72px photodiodes and four 26px LEDs centred ±28px from the middle; the mark is 210px, the wordmark Inter 600 at 176px and the tagline Inter 400 at 32px |
| Sync | On 3.5s the picture, the heart-rate card and all sound stop on the same frame; the last strobe at 3.44s makes the frame before the cut the brightest; BPM reads 200 at the cut; black stays silent 0.45s before the first word; the LEDs light 0.4s after sensing. appears (6.2s) in the gap between the lines so they never touch a letter; the two LED pulses (6.8s, 7.35s) happen while the plate rises; the wordmark and tagline open while the sensor shrinks into the mark |
| Style | Pure black `#000`, one accent green `#34e27a` (LED core `#d4ffd9`, glow `rgba(70,255,130,0.85)`); the scene A sky goes `#03040a` → `#0a1424` → `#0d1a2c` and the beams are cool white `rgb(200,220,255)`, green `rgb(60,240,130)` and warm amber `rgb(255,190,110)`; strobes `rgb(235,242,255)` at up to 42% opacity, each decaying over 0.11s, at 0.4 / 0.9 / 1.35 / 1.8 / 2.2 / 2.55 / 2.9 / 3.15 / 3.44s; vignette to 62% black at the edge; text on black is Inter 500 at 72px, letter-spacing -0.02em, color `rgba(244,244,245,0.95)`, two centred lines with a 96px line height and line centres at y = 445 and 635, with every word's space reserved from the start so nothing reflows as words appear |

## Why it works

A smash cut puts the loudest image next to the quietest one with nothing in between, so the viewer feels the drop on the cut frame itself. The first 3.5s is a crowd, sweeping beams, camera flashes, a heart-rate counter that keeps climbing and a camera that pushes in and shakes harder; after the cut there is pure black and one calm line of white text. The louder the first part, the stronger the drop, so it is packed with motion: hundreds of figures jumping, 8 beams sweeping, 9 strobes, and a push that accelerates. The last strobe sits 2 frames before the cut so the last frame before it is the brightest. The cut lands on a whole frame with no fade and no dissolve frame; if there is sound, it stops on the same frame. Black then stays silent for 0.45s so the contrast can land, and the line types in word by word: The most accurate, a 1s pause, then heart rate sensing., with a pause between the two beats. The product arrives after the words: four green LEDs light up in the gap between the two lines, the sensor plate rises out of the black, and it shrinks into the mark, with the Pulse wordmark after it. The film has one accent color, green #34e27a, and it is the glow sticks in the crowd, the heart-rate trace and the LEDs, which ties the loud half to the quiet half.

## Prompt

> Build an 11-second, 1920x1080, 30 fps product film called Smash Cut for a fictional product, Pulse (a smart ring whose selling point is the most accurate heart rate). It has one move: the loudest, busiest image hard-cuts in a single frame to pure black and silence, a calm white line types in word by word, and the product appears only after the words. The frame is pure black #000 and the one accent color is green #34e27a.
>
> Scene A (0–3.5s) is a code-drawn concert crowd, the loudest part of the film. Use one 1920x1080 canvas redrawn every frame from the timeline time, with no random calls (use mulberry32 with seed 11). The crowd has 14 rows; for row r, d = r/13, figure height s = 10 + 120d² px and row centre y = 450 + 750 × d^1.2. Each figure is random: body width ×0.82–1.22, body height ×0.85–1.2, head ×0.78–1.28, spacing ×0.6–1.35, 7% left out, and each row starts at a different offset so nothing tiles. Every figure jumps at 1.9–3.3 Hz with height |sin| × 0.38s. Arms: 22% down, 38% both up, 14% left only, 14% right only, 12% holding a phone (a small pale blue-white screen with a flickering glow); 10% hold a glow stick (green or white). Figures are near-black silhouettes, rgb(26,36,52) on the far rows fading to rgb(6,8,12) on the near rows, with a thin rim light only on the top of the head and shoulders, taking its color from the nearest lamp. Behind them, 8 lamps at x = 120 + 245i with a base at y = 470 each throw one upward beam, 1600px long with a half-angle of 0.05 or 0.075 rad, sweeping ±0.78 rad about vertical at 1.9–3.3 rad/s; draw each beam as 3 nested wedges (widths 1, 0.62, 0.32 at 34% opacity each) for a soft edge; colors are cool white rgb(200,220,255), green rgb(60,240,130) and warm amber rgb(255,190,110). The sky is a gradient #03040a → #0a1424 → #0d1a2c with 6 drifting haze patches, 40 soft bokeh discs behind the crowd and 12 large ones (radius 70–180px) in front; the nearest two rows are drawn on their own layer with a 12px Gaussian blur. The camera is handheld: scale 1.08 + 0.55 × (t/3.5)^2.4 (to 1.63x) around (960, 700), shake x = sin(47t)×9 + sin(83t+1.3)×6, y = sin(53t+0.7)×8 + sin(97t+2.1)×5, roll sin(31t)×0.006 rad, all multiplied by 0.7→2.0 over the scene. Add 9 white strobes at 0.4, 0.9, 1.35, 1.8, 2.2, 2.55, 2.9, 3.15 and 3.44s (color rgb(235,242,255), peak 42% opacity, 0.11s decay; the last one sits 2 frames before the cut), a vignette to 62% black, and a 560x214px heart-rate card top left: PULSE · LIVE · LAP 12, BPM climbing 126 to 200, Zone 5 and an ECG trace scrolling at 300 px/s.
>
> At 3.5s hard-cut: scene A ends on frame 105 and the next layer is pure black, with no fade, dissolve or flash; if you add music, it stops on the same frame. Hold silent black for 0.45s. From 3.95s the words fade in one by one (0.45s, power2.out, rising 5px with blur 6px→0) in Inter 500 at 72px, letter-spacing -0.02em, color rgba(244,244,245,0.95), as two centred lines with a 96px line height and line centres at y = 445 and 635, with every word's space reserved from the start. Line 1: The 3.95s, most 4.15s, accurate 4.35s; pause 1s; line 2: heart 5.35s, rate 5.55s, sensing. 5.8s. Put the product between the lines: at 6.2s four 26px green LEDs fade in (0.5s, expo.out) in a 2x2 grid centred ±28px from the middle, core #d4ffd9, glow rgba(70,255,130,0.85), with a soft green ambient glow; they pulse at 6.8s and 7.35s (scale up to 1.3 in 0.1s, back in 0.3s). From 6.7s the sensor plate rises to 40% opacity over 1.3s (power2.inOut): 776px across, a titanium gradient rim, 72 radial ticks, a central disc of radius 176px and two 34x72px photodiodes; the whole sensor drifts from 0.94x to 1.02x over 6.2–8.0s. At 7.4s both lines fade out (0.45s, power2.in).
>
> Ending: at 7.6s the sensor shrinks over 0.95s (power3.inOut) into a 210px mark left of the wordmark and rises to 100% opacity. The Pulse wordmark (Inter 600, 176px, letter-spacing -0.04em) unfolds letter by letter from 8.05s (0.9s expo.out each, 0.05s apart, entering from 60px left with blur 10px); the tagline Accurate to every beat. (Inter 400, 32px, #7f8c85) fades in at 8.4s; the frame drifts 1→1.035 over 7.6–11.0s. Wordmark and tagline are in place by 8.8s and hold to the end.

## Often confused with

- [One Word per Cut](./one-word-per-cut.md): One Word per Cut also uses hard cuts, but it swaps in a new product screen at every cut with the word fixed in the centre, at 0.5s per cut; a smash cut has one cut, from a very loud image to silent black, and the words type in after it.
- [Wipe and Flash Transition](./wipe-flash-transition.md): Wipe and Flash hides the scene change behind a big out-of-focus object or a bloom that whites out the frame; a smash cut changes the scene in a single frame and the cut itself is the effect.

## Source files

Runnable HyperFrames project, 3 files.

- ../source/smash-cut/hyperframes.json (318 B)
- ../source/smash-cut/index.html (26.1 KB)
- ../source/smash-cut/package.json (298 B)

Read `../source/smash-cut/index.html` in full before adapting it: it holds the whole composition and its GSAP timeline.
