# Ripple Effect

A headline sits inside a glowing spectral ring that ripples and sends out faint echoes. The ring contracts, then concentric rings expand from the centre and each one reveals the next scene, landing on the product.

- Position in a launch film: Transitions
- Slug: ripple-effect
- Preview video: https://media.motionboard.app/ripple.mp4
- Recipe page (preview film and original side by side): https://motionboard.app/recipes/ripple-effect/
- Film length: 10s, 1920x1080
- Original reference: Apple AirPods Pro 3 (YouTube, 0:02) https://www.youtube.com/watch?v=EMmKs8vMKhU&t=2s

## How to use this recipe

You are a coding agent. The user wants this shot for their own product. Follow these steps.

1. **Know the product.** If the product is clear from the user's repo or conversation, ask nothing and start. Otherwise ask once for: product name, logo file, brand colors.
2. **Pick the output.** If the user's message says a video or their website, do that. Otherwise ask once which one they want.
   - **Video (HyperFrames).** Copy the folder `../source/ripple/` (next to this file in the skill) into the user's working folder, for example `cp -R <skill dir>/source/ripple ./ripple`. Adapt `index.html` (see "What to adapt"). Run `npx --yes hyperframes@0.8.209 check` on the untouched copy first and note its result. Preview with `npx --yes hyperframes@0.8.209 preview`, render an MP4 with `npx --yes hyperframes@0.8.209 render` (into `renders/`, named with a timestamp). The same commands are in `package.json` as `dev`, `check`, `render`; pass flags after `--`, as in `npm run render -- --quality draft`. Rendering needs network access for web fonts and GSAP.
   - **Website motion.** Port the GSAP timeline in `index.html` into the user's site, using their stack (React, Vue, Svelte, plain HTML). Build the same DOM structure, keep the timeline's durations, delays and easings exactly, and start it when the element scrolls into view (IntersectionObserver or ScrollTrigger). Respect `prefers-reduced-motion: reduce`: show the final frame as a static state and skip the movement.
3. **What to adapt.**
   - **Brand layer** (product name, logo, colors, fonts, copy): replace directly with the user's.
   - **UI layer** (the product screens, cards, windows, controls shown in the shot): rebuild the user's real UI as clean DOM, from their codebase (components, design tokens) or from a screenshot used as reference only. Never paste a screenshot into the shot.
   - **Motion** (timing, easing, camera moves, layering, stagger, order of events): keep exactly as in the source. This is what the recipe is.
   - The timeline targets UI elements by id and class, and camera moves land on fixed coordinates. Keep the ids the timeline uses, keep row counts and text lengths close to the source, and when the layout moves, update the target coordinates without changing the times.
4. **Fonts.** HyperFrames fetches Google Fonts such as Inter on its own. Some sources use macOS local fonts (PingFang, Songti via `local()`). Use the user's brand font when it can be bundled; for a system font such as SF Pro, use Inter. Check that text still fits its boxes.
5. **Verify.** Compare the render with the preview film on the recipe page at the beat times in the Timing row. The beats, timing and camera should match; only brand and UI content differ.

## Matches requests like

- The headline holds in a glowing spectral ring that swells with each echo
- Rings open from the centre one after another, each showing the next scene
- The last ring clears and the shot lands on the product

## Spec

| Item | Value |
| --- | --- |
| Timing | Film 10s. The ring grows to full size over 0.1–1.7s (1.6s); the two headline lines blur in at 0.5s and 0.64s (1.1s each) with a 10px red/blue split that closes by 1.55s; echo rings are born at 0.9, 1.7, 2.5, 3.3 and 4.1s and each lives 2.8s; fringe and wobble swell 3.9–4.6s; the ring contracts 5.5% over 4.4–4.7s; five reveal rings open from 4.7s, 0.14s apart, 2.0s each; the case lands at 4.75s (1.8s) and the earbuds at 4.8s and 4.9s (1.9s); the spec line rises at 5.55s (0.9s) and fades at 7.2s (0.5s); the product recedes 7.3–8.3s; lockup mark 7.55s, wordmark 7.65s, tagline 7.95s; a highlight sweeps 8.9–9.9s and the lockup holds to the end |
| Easing | Ring growth, reveal rings, headline and product landing expo.out (1 − 2^(−10p)); echo rings cubic.out; the contraction before the reveal power3.in; float and the slow headline scale sine.inOut; product push-in sine.out; product recede and wordmark highlight power2.inOut |
| Camera | Locked frame, no camera move. The headline block scales 1→1.03x over 0.8–4.7s (sine.inOut); inside the five reveal rings the product scene starts magnified 1.30, 1.24, 1.18, 1.12 and 1.06x and eases to 1x as its ring opens, while a black veil of 55%, 45%, 35%, 25% and 15% clears with it; the product group pushes in 1→1.05x over 4.7–9.9s |
| Subject | Main ring base radius 380px with four strokes 26/11/5/2.2px wide. Its colour is a conic gradient of 24 stops whose hue runs twice around the ring (saturation 82%, lightness 62–78%), starting at 205° − 38°/s × time and rotating at 0.55 rad/s. The edge wobbles with three sines of 5, 8 and 13 lobes (weights 1, 0.6, 0.35) at an amplitude of 3.2–5.6px. Echo rings grow from 402px to 732px radius (1.7px line, plus a 1.1px companion at +7px); three thin rings sit inside at R−18, R−36 and R−62; 220 radial ticks outside have length = energy × (3 + 34n²), with energy 0.3 plus 0.95 during 3.9–4.6s. The reveal rings are five clip-path circles centred at (960, 540), each holding a full copy of the product scene, radius 1320 × (1 − 2^(−10p)); every edge gets a 38px soft band, four strokes of 30/13/5.5/2.4px and thin lines at r+11 and r−9. Product scene: dark radial backdrop, two 230x414px white earbuds (left 701px, right 989px, tilted ∓8°, with a silver head, grey ear tip, mic ports and a blue edge light) and a 400x276px rounded case (left 760px, top 590px) with a lid seam, an LED and an engraved ring |
| Sync | Each echo is born with a 7px outward push on the main ring that decays as exp(−5·age); fringe energy, wobble and brightness peak together at 4.6s, 0.1s before the first reveal ring opens and after the ring has contracted; the first reveal ring covers the headline within 0.1s; the case and earbuds land while the rings open, so the product is already settling when it is revealed; the spec line rises as the last ring nears the frame edge (about 5.8s); the lockup mark starts drawing as the product recedes |
| Style | Base `#09090b`, accent `#8fb4ff` (case light and spec dots); the spectral rings are the only other colour. Inter throughout: headline 88px 700, spec line 26px 500, footnote 16px 400, wordmark 150px 700, tagline 36px 500; elliptical vignette (85% × 78%), no grain |

## Why it works

The headline sits in a spectral ring that swells and sends out a few fading echoes, so by the time the line is read the eye is already held by a circular rhythm. For the reveal the same circle becomes a window: five rings open from the centre one after another, each holding a full copy of the next scene, outer rings first and inner rings after. The product inside each ring starts magnified and eases back to size, so the cut reads as travelling down a tunnel onto the product. The circles share the centre of the title ring, so the ring contracts (4.4–4.7s) and the first circle bursts open from the same point, and no hard cut is needed. The ring's hue runs twice around it and is the only colour on the #09090b backdrop; the product scene uses only white forms and one #8fb4ff light, so the frame returns to a restrained dark after the reveal. The earbuds and case begin landing while the rings open and are nearly settled when the last ring leaves (about 5.8s), and the spec line rises after that.

## Prompt

> Build a 10-second, 1920x1080, 30 fps dark product film called Ripple Effect for a fictional product, Hush (noise-cancelling earbuds). Base colour #09090b, accent #8fb4ff, font Inter. One onUpdate driven by the timeline redraws two canvases and sets the radii of five clip-paths; text and product use GSAP tweens. No random numbers, no CSS animation.
>
> Part 1, the title ring (0–4.7s): a glowing spectral ring centred at (960, 540) with a base radius of 380px, drawn on canvas with the lighter composite mode. It is four strokes (26/11/5/2.2px wide, faint to strong) whose colour is a 24-stop conic gradient (createConicGradient) with the hue running twice around the ring (saturation 82%, lightness 62–78%, hue start 205° − 38°/s × time, gradient rotating at 0.55 rad/s). From 0.1 to 1.7s the ring grows from 0.6x to 1x with expo.out. The edge radius is R + amplitude × (sin(5θ − 2.3t) + 0.6·sin(8θ + 1.7t) + 0.35·sin(13θ − 3.1t)), amplitude 3.2–5.6px. Add three thin rings inside (R−18, R−36, R−62) and 220 radial ticks outside, length = energy × (3 + 34n²) with energy about 0.3. Echo rings are born at 0.9, 1.7, 2.5, 3.3 and 4.1s, live 2.8s, grow from 402px to 732px radius with cubic.out, fade out and are 1.7px wide. Each birth pushes the main ring out 7px, decaying as exp(−5·age), so the ring seems to swell with the echoes. Inside the ring sits the headline Silence, / tuned to you. (88px, weight 700, letter-spacing −0.035em, line-height 1.08): the two lines start at 0.5s and 0.64s and take 1.1s with expo.out from 14px blur and 22px below, while a CSS variable drives a 10px red/blue split that closes over 1.0s from 0.55s. A 16px lab-test footnote fades in at the bottom left from 1.4s. From 3.9 to 4.6s the energy rises by 0.95 and the wobble grows, and from 4.4 to 4.7s the ring contracts 5.5% (power3.in).
>
> Part 2, the reveal (4.7–6.4s): five circular clip-paths centred at (960, 540); circle k starts at 4.7 + 0.14k seconds with radius = 1320 × (1 − 2^(−10p)), p being progress over 2.0s. Each circle holds a full copy of the same product scene (one function builds all five); circle 0 is at the bottom and circle 4 on top, so outer rings leave first and inner rings follow. The copies start magnified 1.30, 1.24, 1.18, 1.12 and 1.06x and ease back to 1x with their ring, and a black veil of 55%, 45%, 35%, 25% and 15% clears with them, which gives the tunnel look. Draw each circle's edge on the upper canvas: a 38px soft band, four spectral strokes 30/13/5.5/2.4px wide, and thin lines at r+11 and r−9; the edge fades once the radius passes 1000px.
>
> Product scene: a dark radial backdrop (#23262f to #09090b) with a faint blue glow. Two 230x414px white earbuds in SVG (silver-white head, grey ear tip with a mesh, mic ports, a blue edge light): the left one at left 701px, top 140px, the right one at left 989px, top 150px, mirrored, tilted ∓8°, both with a drop shadow. A 400x276px white rounded case (left 760px, top 590px) with a lid seam, a blue LED and a soft shadow. The case rises from 150px below at 0.88x over 1.8s with expo.out starting at 4.75s; the earbuds start at 4.8s and 4.9s, rise from 230 and 250px below and rotate from ±26° to ±8° over 1.9s. The product group pushes in to 1.05x over 4.7–9.9s, and from 6.7s everything floats 12–14px (sine.inOut). From 5.55s a 26px spec line sits under the product, Hush · 45 dB adaptive noise cancelling · 9 h, or 36 h with the case, rising over 0.9s and fading at 7.2s.
>
> Ending (7.3–10s): from 7.3s the product group takes 1.0s to drop to 16% opacity, 0.94x and 5px blur. At 7.55s a 124px mark (two spectral thin rings and a white centre dot) draws on and rotates, at 7.65s the wordmark Hush (Inter 700, 150px) rises out of blur, at 7.95s the tagline Noise cancelling, tuned to you. (36px) rises, and from 8.9 to 9.9s a spectral highlight sweeps across the wordmark; from 7.5 to 9.9s one more faint echo ring leaves the frame centre. Add a vignette, no grain.

## Often confused with

- [Iris Transition](./iris-transition.md): Iris Transition keeps a fixed round window that jumps in size with the beat and cuts images inside it; here concentric rings open one after another from the centre, each edge is a spectral stroke and a mask, and the move happens once.
- [Glass Droplet Split](./glass-droplet-split.md): Glass Droplet Split stretches a glass form until it breaks; Ripple Effect has no solid object, only a ring that swells, echoes that fade and circular masks that open outward.

## Source files

Runnable HyperFrames project, 3 files.

- ../source/ripple/hyperframes.json (318 B)
- ../source/ripple/index.html (25.2 KB)
- ../source/ripple/package.json (295 B)

Read `../source/ripple/index.html` in full before adapting it: it holds the whole composition and its GSAP timeline.
