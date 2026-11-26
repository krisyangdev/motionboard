# Lens Flare Effect

A smartwatch on black. A long thin blue streak sweeps across the frame with a chain of chromatic ring and hexagon ghosts placed opposite the source along the line through the frame centre. The title Aster Series 2 rises, a smaller flare crosses it from right to left, and a short lockup closes the film.

- Position in a launch film: Opening
- Slug: lens-flare-effect
- Preview video: https://media.motionboard.app/lens-flare.mp4
- Recipe page (preview film and original side by side): https://motionboard.app/recipes/lens-flare-effect/
- Film length: 10s, 1920x1080
- Original reference: Apple Watch Series 12 (YouTube, 1:12) https://www.youtube.com/watch?v=MO9HJsUxEEk&t=72s

## How to use this recipe

You are a coding agent. The user wants this shot for their own product. Follow these steps.

1. **Know the product.** If the product is clear from the user's repo or conversation, ask nothing and start. Otherwise ask once for: product name, logo file, brand colors.
2. **Pick the output.** If the user's message says a video or their website, do that. Otherwise ask once which one they want.
   - **Video (HyperFrames).** Copy the folder `../source/lens-flare/` (next to this file in the skill) into the user's working folder, for example `cp -R <skill dir>/source/lens-flare ./lens-flare`. Adapt `index.html` (see "What to adapt"). Run `npx --yes hyperframes@0.8.209 check` on the untouched copy first and note its result. Preview with `npx --yes hyperframes@0.8.209 preview`, render an MP4 with `npx --yes hyperframes@0.8.209 render` (into `renders/`, named with a timestamp). The same commands are in `package.json` as `dev`, `check`, `render`; pass flags after `--`, as in `npm run render -- --quality draft`. Rendering needs network access for web fonts and GSAP.
   - **Website motion.** Port the GSAP timeline in `index.html` into the user's site, using their stack (React, Vue, Svelte, plain HTML). Build the same DOM structure, keep the timeline's durations, delays and easings exactly, and start it when the element scrolls into view (IntersectionObserver or ScrollTrigger). Respect `prefers-reduced-motion: reduce`: show the final frame as a static state and skip the movement.
3. **What to adapt.**
   - **Brand layer** (product name, logo, colors, fonts, copy): replace directly with the user's.
   - **UI layer** (the product screens, cards, windows, controls shown in the shot): rebuild the user's real UI as clean DOM, from their codebase (components, design tokens) or from a screenshot used as reference only. Never paste a screenshot into the shot.
   - **Motion** (timing, easing, camera moves, layering, stagger, order of events): keep exactly as in the source. This is what the recipe is.
   - The timeline targets UI elements by id and class, and camera moves land on fixed coordinates. Keep the ids the timeline uses, keep row counts and text lengths close to the source, and when the layout moves, update the target coordinates without changing the times.
4. **Fonts.** HyperFrames fetches Google Fonts such as Inter on its own. Some sources use macOS local fonts (PingFang, Songti via `local()`). Use the user's brand font when it can be bundled; for a system font such as SF Pro, use Inter. Check that text still fits its boxes.
5. **Verify.** Compare the render with the preview film on the recipe page at the beat times in the Timing row. The beats, timing and camera should match; only brand and UI content differ.

## Matches requests like

- A long thin blue line sweeps across the watch
- Round and hexagonal light spots move opposite the light source
- The light passes over the title and the letters light up in turn

## Spec

| Item | Value |
| --- | --- |
| Timing | Film 10s. The watch fades up 0–1.1s with a 24px rise; face elements appear in turn 0.45–1.85s; the activity rings fill 0.7–2.5s; flare A crosses the watch 1.25–5.0s (3.75s); the watch leaves 4.55–5.25s (0.7s); the title starts at 5.05s (1.2s, the two words 0.14s apart); flare B runs 5.95–7.4s (1.45s); the title fades at 7.4s (0.45s); the mark ring draws at 7.85s (0.8s), the asterisk at 8.0s (1.0s), the wordmark at 8.25s (0.9s) and the tagline at 8.75s (0.8s); flare C flashes on the mark at 8.4s and decays with a 0.5s time constant; hold to 10s |
| Easing | Source travel `p + 0.11·sin(2πp)`: about 0.31x speed in mid-frame and about 1.69x at the ends, so the light moves slowest above the watch; intensity fades in over the first 14% and out over the last 14% with smoothstep; face elements and the title use expo.out (`cubic-bezier(0.16,1,0.3,1)`); the watch fades in with power2.out and leaves with power2.in; the mark ring draws with power3.inOut; the activity rings use 1−(1−x)³ |
| Camera | Locked frame, no roll. The watch layer pushes linearly from 1.04x to 1.1x over 0–4.55s, then to 1.22x with a 10px blur and a fade over 4.55–5.25s; the title layer pushes linearly from 1x to 1.03x over 4.9–7.9s; the flare canvas sits in screen space and ignores the camera |
| Subject | Case 480x590px with a 132px radius; display inset 20px (440x550px, 112px radius); dark woven bands above and below (340px and 360px wide, fading out toward the frame edge); crown 22x92px on the right. Face: WED 26, 18°, time 10:09 (Inter 600, 124px), seconds counting up from 42 once a second; three activity rings with radii 80/58/36px and 19px stroke filled to 81%, 100% and 75%; MOVE 486/600 CAL, EXERCISE 31/30 MIN, STAND 9/12 HR; three tiles, HEART RATE 72 BPM, BATT 86% and STEPS 8.4k. Flare A's source runs from x -420px to 2340px with y on a quadratic curve 200→620 (control point)→330px, about 442px at the centre; three streak layers with half-lengths 1250/1000/780px and half-heights 34/9/2.6px; a core of 95px radius. Flare B is scaled to 0.62, with its source running from x 2200px to -300px, y 505→548px, intensity 0.85. Ghost position = frame centre + g × (source − centre), eight ghosts: g=-0.30 ring r58, -0.55 disc r24, -0.84 hexagon r118, -1.12 ring r76, -1.50 big disc r205, +0.40 ring r34, +0.70 disc r15, -1.95 ring r46; flare B uses five of them. Title Aster Series 2 (Inter 700, 176px, letter-spacing -0.045em) |
| Sync | Ghosts, streaks, core, veiling glare, the rim light on the case, the diagonal sheen on the glass and the highlight band on the title all come from one source function evaluated every frame, so they move with the light; ghosts sit on the opposite side of the centre and fade out as the source nears it (strength smoothstep(0.04, 0.4, d/960) with d the source's distance from the centre); the veil peaks with the source near the centre, falling off as exp(−d²/640²); while flare B crosses the title, the highlight band of each word is centred on the source x; flare C starts at 8.4s once the mark is drawn |
| Style | Background `#04050a`, one accent cool blue `#4da3ff`; flare colours (70,130,255), (130,190,255) and (235,245,255); ring ghosts use three chromatic fringes at radius ratios 0.955/1.0/1.05 in (255,95,175), (60,235,225) and (85,120,255); the flare canvas uses screen blending; 7% grain and a vignette to 60% black at the edge; Inter throughout |

## Why it works

Every part of the flare comes from one source position, so the optics read correctly: the ghosts sit on the line through the source and the frame centre, they move left when the light moves right, they weaken and the veil thickens as the source nears the centre, which is how a real lens behaves. The streak is a thin horizontal line (2.6px to 34px high, up to 2500px long) like an anamorphic lens produces, and the ghosts are rings, discs and a hexagon (the shape of aperture blades) with three chromatic fringes on the rings. These details make the flare read as light inside a lens, and a glow texture pasted over the picture would lack them. The light moves slowest over the watch (about 0.31x speed mid-frame), which gives the viewer time to read the face. The rim of the case, the highlight on the glass and the bright band on the title all follow the same source x, so the light seems to fall on the objects. A black frame and one cool blue accent keep the picture clean and the flare is the only bright thing in it. The second flare is scaled to 0.62 with five ghosts and crosses the title, and each letter brightens as the light reaches it; a short pulse on the mark ends the film.

## Prompt

> Build a 10-second, 1920x1080, 30 fps dark product film called Lens Flare Effect for a fictional product, Aster (a smartwatch). Background #04050a and one accent, cool blue #4da3ff. Draw the flare on a single 1920x1080 canvas: fill it black every frame, draw with the lighter composite operation, and lay the whole layer over the scene with mix-blend-mode: screen. Every state is a pure function of time: one empty tween that spans the film calls render(time) from its onUpdate (plus an hf-seek listener), with no Math.random, no Date and no CSS animation. The light is a moving point S. Each frame draw: a veiling glare (a full-frame fill of (40,80,190) at 0.1×v, plus a radial gradient of 1250px radius, where v = intensity × exp(−d²/640²) and d is the distance from S to the frame centre (960,540), so the haze is heaviest with the source near the centre); a bloom of 460px radius; three horizontal streak layers drawn as elliptical radial gradients with half-lengths 1250/1000/780px, half-heights 34/9/2.6px, colours (70,130,255), (130,190,255) and (235,245,255) and opacities 0.30/0.75/0.95, which together make one long thin blue line; a hot white core of 95px radius; and a faint streak on the opposite side of the frame at centre − 0.72×(S − centre), 700px half-length and 5px half-height. Place the ghosts on the line from the source through the frame centre: position = centre + g × (S − centre), recomputed every frame, so when the light moves right the ghosts move left. Use eight: g=−0.30 ring r58, −0.55 disc r24, −0.84 hexagon r118 (rotated to the line), −1.12 ring r76, −1.50 large ellipse disc r205, +0.40 ring r34, +0.70 disc r15, −1.95 ring r46. Draw each ring ghost as three chromatic fringes at radius ratios 0.955/1.0/1.05 in (255,95,175), (60,235,225) and (85,120,255), and multiply ghost strength by smoothstep(0.04, 0.4, d/960) so the ghosts vanish when the source is near the centre. The frame: the watch sits at the centre, case 480x590px with a 132px radius, a dark metal gradient and a cool bright line along the top edge, display inset 20px (440x550px, 112px radius), dark woven bands above and below fading out toward the frame edge. The face is dense: WED 26, 18°, time 10:09 (124px), a seconds counter that adds 1 every second, three activity rings of radius 80/58/36px, MOVE 486/600 CAL, EXERCISE 31/30 MIN, STAND 9/12 HR, HEART RATE 72 BPM with an ECG line, a BATT 86% ring and STEPS 8.4k. The bright line on the case edge and the diagonal sheen on the glass are computed from the source x and follow the light. Timeline: 0–1.1s the watch fades up; 0.7–2.5s the activity rings fill; 1.25–5.0s flare A travels from left of the frame (x=−420px) to right of it (x=2340px), with y along a curve 200→442→330px, sweeping over the watch, using travel p + 0.11·sin(2πp) so it is slowest mid-frame; 4.55–5.25s the watch scales to 1.22x and leaves with a blur and a fade; at 5.05s the title Aster Series 2 (Inter 700, 176px) rises one word at a time under a small INTRODUCING line; 5.95–7.4s flare B (scale 0.62, five ghosts) crosses the title from right to left, with a highlight band on the letters that follows the source x so each letter brightens as the light reaches it; at 7.4s the title fades out; from 7.85s the lockup: a ring draws, an asterisk mark spins in, the wordmark Aster (Inter 600, 112px) wipes in from the left and the tagline Time, in depth. fades up, and at 8.4s a short flare (streaks and core, no ghosts) flashes on the mark. Add 7% grain and a vignette.

## Often confused with

- [Light Reveal](./light-reveal.md): Light Reveal uses a sweeping light to bring out the material of an object on black; here the light is a lens artifact, with streaks, ghosts and veiling glare computed from the source position each frame and added over the product and the title.
- [Light Beam Effect](./light-beam-effect.md): In Screen Projection Beams the beam is a window onto a fixed screen; the flare here hides and reveals nothing, it adds a layer of light spots that move with the source.

## Source files

Runnable HyperFrames project, 3 files.

- ../source/lens-flare/hyperframes.json (318 B)
- ../source/lens-flare/index.html (26.9 KB)
- ../source/lens-flare/package.json (299 B)

Read `../source/lens-flare/index.html` in full before adapting it: it holds the whole composition and its GSAP timeline.
