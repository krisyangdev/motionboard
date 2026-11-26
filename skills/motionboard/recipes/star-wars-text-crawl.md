# Star Wars Text Crawl

Motionboard shot name: Release Crawl

A line of cool-blue text fades in and out on black, then a justified block of cream text with a kicker and a title recedes up a tilted plane over a starfield, the stars rise when the crawl ends, and the Kestrel lockup appears.

- Position in a launch film: Opening
- Slug: star-wars-text-crawl
- Preview video: https://media.motionboard.app/text-crawl.mp4
- Recipe page (preview film and original side by side): https://motionboard.app/recipes/star-wars-text-crawl/
- Film length: 12s, 1920x1080

## How to use this recipe

You are a coding agent. The user wants this shot for their own product. Follow these steps.

1. **Know the product.** If the product is clear from the user's repo or conversation, ask nothing and start. Otherwise ask once for: product name, logo file, brand colors.
2. **Pick the output.** If the user's message says a video or their website, do that. Otherwise ask once which one they want.
   - **Video (HyperFrames).** Copy the folder `../source/text-crawl/` (next to this file in the skill) into the user's working folder, for example `cp -R <skill dir>/source/text-crawl ./text-crawl`. Adapt `index.html` (see "What to adapt"). Run `npx --yes hyperframes@0.8.209 check` on the untouched copy first and note its result. Preview with `npx --yes hyperframes@0.8.209 preview`, render an MP4 with `npx --yes hyperframes@0.8.209 render` (into `renders/`, named with a timestamp). The same commands are in `package.json` as `dev`, `check`, `render`; pass flags after `--`, as in `npm run render -- --quality draft`. Rendering needs network access for web fonts and GSAP.
   - **Website motion.** Port the GSAP timeline in `index.html` into the user's site, using their stack (React, Vue, Svelte, plain HTML). Build the same DOM structure, keep the timeline's durations, delays and easings exactly, and start it when the element scrolls into view (IntersectionObserver or ScrollTrigger). Respect `prefers-reduced-motion: reduce`: show the final frame as a static state and skip the movement.
3. **What to adapt.**
   - **Brand layer** (product name, logo, colors, fonts, copy): replace directly with the user's.
   - **UI layer** (the product screens, cards, windows, controls shown in the shot): rebuild the user's real UI as clean DOM, from their codebase (components, design tokens) or from a screenshot used as reference only. Never paste a screenshot into the shot.
   - **Motion** (timing, easing, camera moves, layering, stagger, order of events): keep exactly as in the source. This is what the recipe is.
   - The timeline targets UI elements by id and class, and camera moves land on fixed coordinates. Keep the ids the timeline uses, keep row counts and text lengths close to the source, and when the layout moves, update the target coordinates without changing the times.
4. **Fonts.** HyperFrames fetches Google Fonts such as Inter on its own. Some sources use macOS local fonts (PingFang, Songti via `local()`). Use the user's brand font when it can be bundled; for a system font such as SF Pro, use Inter. Check that text still fits its boxes.
5. **Verify.** Compare the render with the preview film on the recipe page at the beat times in the Timing row. The beats, timing and camera should match; only brand and UI content differ.

## Matches requests like

- A justified block of text recedes up a tilted plane and shrinks toward the distance
- One short line fades in and out first, then the whole crawl rises from the bottom edge
- When the crawl ends the stars rise and the product lockup appears

## Spec

| Item | Value |
| --- | --- |
| Timing | Film 12s. Intro line fades in at 0.05s (0.4s) and out 2.7–3.0s (0.3s); stars go to 0.16 over 0–0.6s and rise to 1 over 2.2–3.4s (1.2s); the crawl starts at 2.7s and runs at a constant 210px/s (the block top starts 30px past the pivot line); the crawl layer fades 9.3–10.2s (0.9s); the dark pocket behind the lockup 9.2–10.2s; mark at 9.4s (0.7s), wordmark at 9.5s (0.8s), tagline at 9.7s (0.6s), held to the end; stars rise 9.0–12.0s (3.0s) |
| Easing | Crawl linear (ease none, constant speed); intro in power2.out and out power2.in; stars power1.out then power1.inOut; crawl fade power1.in; lockup dim power2.out; mark, wordmark and tagline `cubic-bezier(0.16,1,0.3,1)` (expo.out); star rise power2.inOut; twinkle on a sine curve |
| Camera | The plane tilts about its bottom edge with `rotateX(45deg)`, pivot line at y=1040px, perspective 405px with the origin at the frame centre (960px, 540px), so the vanishing point sits near y≈135px (540 − 405 × cot 45°). The camera holds still during the crawl; from 9.0–12.0s it tilts down and the stars rise by 420px scaled by depth (nearer stars rise more) |
| Subject | Plane 1700px wide, 110px from the left. Text block in Inter 700, 67px on an 84px line, letter-spacing 0.01em, justified (`text-wrap: pretty`): an EPISODE 4.0 kicker (54px, tracking 0.36em, accent), the title THE MERGE AWAKENS (92px, 800, one line) and three paragraphs of about 21 words; 84px between the title and the first paragraph, 56px between paragraphs. About 16 lines show at once and capitals at the bottom edge are about 77px tall. A mask is transparent above 14% of the frame height, fully visible from 40%, and fades out from 94% at the bottom. The sky is 640 seeded stars (seed 19770525) plus 20 brighter stars with a glow, depth 0.15–1, drifting 3px per second scaled by depth and twinkling on a sine |
| Sync | The intro line starts to fade at 2.7s, the same moment the crawl starts; the stars finish brightening at 3.4s, while the first line is still rising from under the bottom edge; the dark pocket starts at 9.2s, 0.1s before the crawl fades (9.3s), so the background behind the lockup is already dark while the last lines go |
| Style | Background `#06070b`, crawl text warm cream `#efe5cf`, one cool accent `#86b8ff` (intro line, kicker, mark), with none of the classic crawl yellow; Inter only: body 700, title 800, intro line 500 at 62px; mark is a 104px rounded square with two dark upward chevrons, wordmark Kestrel 156px 700, tagline Code review, minus the wait. at 40px 500; vignette |

## Why it works

The text block sits on a plane tilted about its bottom edge, and perspective squeezes it into a trapezoid. Lines at the bottom are large and readable, each line above is smaller than the last and narrower, and that shrinking is the only depth cue the eye needs. The plane moves at one constant speed, so every line spends the same time between appearing and becoming small, and the viewer can predict how long a paragraph stays readable. A mask at the top fades the lines that have become too small to read, which leaves a band of plain stars above the text instead of a pile of fine lines. The intro line is the only centred text in the film. It sets up the story in one sentence before the crawl rises from the bottom edge, so the viewer knows to read next. The stars use depth parallax, and when the crawl is done the camera tilts down and the stars rise, which moves the frame from reading to looking at the lockup. The crawl is warm cream and only the kicker, the intro line and the mark use the cool blue, so the film keeps one accent colour.

## Prompt

> Build a 12-second, 1920x1080, 30 fps dark product film called Release Crawl, in the style of the 1977 space-opera opening crawl: a justified block of text recedes up a tilted plane. The fictional product is Kestrel, a code-review tool. Use no film logo, name or marks, and no classic crawl yellow. Background #06070b, crawl text warm cream #efe5cf, one cool accent #86b8ff, Inter only.
>
> Starfield: one 1920x1080 canvas redrawn every frame from timeline time (tween a dummy object across the whole timeline with onUpdate: render(tl.time()); no requestAnimationFrame). Generate 640 stars with mulberry32 seed 19770525, each with a depth 0.15–1, a radius, a brightness and a twinkle frequency, mostly white-ish (240,244,255) with some warm (255,238,214) and cool (186,212,255). Add 20 brighter stars (radius 1.7–2.7px, glow 7x the radius). Each star drifts up 3px per second times its depth, wrapping, and twinkles with alpha × (0.78 + 0.22 × sin(t × frequency + phase)). Canvas opacity goes 0 to 0.16 over 0.6s, then from 2.2s to 1 over 1.2s (power1.inOut).
>
> Intro line: centred, two lines, Inter 500, 62px on an 88px line, letter-spacing 0.012em, accent #86b8ff: Two sprints ago, in a repo / far, far away… It fades in from 0.05s over 0.4s (power2.out, scale 0.985 to 1) and fades out from 2.7s over 0.3s (power2.in).
>
> Crawl: an outer container with perspective: 405px and perspective-origin 960px 540px; inside it a plane 1700px wide, 110px from the left, with its top edge at y=1040px, transform-origin 50% 0 and transform: rotateX(45deg), which puts the vanishing point near y=135px. The text block is anchored above the plane's pivot line in Inter 700, 67px on an 84px line, letter-spacing 0.01em, text-align: justify, text-wrap: pretty, upright. Content in order: the kicker EPISODE 4.0 (54px on a 72px line, tracking 0.36em, centred, accent); the title THE MERGE AWAKENS (92px on a 108px line, 800, tracking 0.04em, one line, centred, 20px below the kicker); then three paragraphs of about 21 words each, the first 84px below the title and 56px between paragraphs, a release note told as an epic: the review backlog, Kestrel reading every change first and flagging risky lines, then version 4.0 shipping with inline suggestions, faster diffs and a queue that never stalls. Wrap the crawl layer in a vertical mask: fully transparent above 14% of the frame height, fully visible from 40%, fading out from 94% at the bottom edge. The block moves up the plane at a constant 210px per second (ease none): at 2.7s its top sits 30px below the pivot line and it ends at y = −300px, so the duration is (block height + 30 + 300) / 210 with the height read from offsetHeight. The crawl layer fades out from 9.3s over 0.9s (power1.in). About 16 lines show at once.
>
> Ending: from 9.0 to 12.0s every star rises by 420px times its depth (power2.inOut), which reads as the camera tilting down. From 9.2s a dark radial pocket fades in over 1.0s in the centre (power2.out). The mark appears at 9.4s: a 104px accent rounded square with two dark (#07101f) upward chevrons, rising from 16px below at scale 0.9 over 0.7s expo.out. The wordmark Kestrel (Inter 700, 156px, tracking −0.045em) rises 24px from 9.5s over 0.8s expo.out. The tagline Code review, minus the wait. (40px, 500, cream at 62% opacity) rises 16px from 9.7s over 0.6s expo.out. Hold to the end.
>
> Constraints: deterministic, a single paused GSAP timeline; set start values with tl.set and animate with .to tweens that state their end values.

## Often confused with

- [Scrolling Text Animation](./scrolling-text-animation.md): Ramble to Summary scrolls one line sideways, speeds it up and squeezes it into a message bubble; Release Crawl moves a whole block at constant speed up a tilted plane and ends on the product lockup.
- [3D Ribbon Text Animation](./3d-ribbon-text-animation.md): Folded Ribbon Text folds a title into 3D ribbons and multiplies them into rows; Release Crawl is one block of text that shrinks because the plane is tilted, at a constant speed.

## Source files

Runnable HyperFrames project, 3 files.

- ../source/text-crawl/hyperframes.json (318 B)
- ../source/text-crawl/index.html (10.9 KB)
- ../source/text-crawl/package.json (299 B)

Read `../source/text-crawl/index.html` in full before adapting it: it holds the whole composition and its GSAP timeline.
