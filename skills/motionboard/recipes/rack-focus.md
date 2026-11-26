# Rack Focus

A large insight card sits sharp in the foreground with a blurred laptop behind it. Focus pulls to the laptop, the card softens and drifts away, a second card slides in from the right and takes focus back, and a last pull lands on the headline Every dollar, in focus. before the Corsa lockup.

- Position in a launch film: Product reveal
- Slug: rack-focus
- Preview video: https://media.motionboard.app/rack-focus.mp4
- Recipe page (preview film and original side by side): https://motionboard.app/recipes/rack-focus/
- Film length: 10.6s, 1920x1080

## How to use this recipe

You are a coding agent. The user wants this shot for their own product. Follow these steps.

1. **Know the product.** If the product is clear from the user's repo or conversation, ask nothing and start. Otherwise ask once for: product name, logo file, brand colors.
2. **Pick the output.** If the user's message says a video or their website, do that. Otherwise ask once which one they want.
   - **Video (HyperFrames).** Copy the folder `../source/rack-focus/` (next to this file in the skill) into the user's working folder, for example `cp -R <skill dir>/source/rack-focus ./rack-focus`. Adapt `index.html` (see "What to adapt"). Run `npx --yes hyperframes@0.8.209 check` on the untouched copy first and note its result. Preview with `npx --yes hyperframes@0.8.209 preview`, render an MP4 with `npx --yes hyperframes@0.8.209 render` (into `renders/`, named with a timestamp). The same commands are in `package.json` as `dev`, `check`, `render`; pass flags after `--`, as in `npm run render -- --quality draft`. Rendering needs network access for web fonts and GSAP.
   - **Website motion.** Port the GSAP timeline in `index.html` into the user's site, using their stack (React, Vue, Svelte, plain HTML). Build the same DOM structure, keep the timeline's durations, delays and easings exactly, and start it when the element scrolls into view (IntersectionObserver or ScrollTrigger). Respect `prefers-reduced-motion: reduce`: show the final frame as a static state and skip the movement.
3. **What to adapt.**
   - **Brand layer** (product name, logo, colors, fonts, copy): replace directly with the user's.
   - **UI layer** (the product screens, cards, windows, controls shown in the shot): rebuild the user's real UI as clean DOM, from their codebase (components, design tokens) or from a screenshot used as reference only. Never paste a screenshot into the shot.
   - **Motion** (timing, easing, camera moves, layering, stagger, order of events): keep exactly as in the source. This is what the recipe is.
   - The timeline targets UI elements by id and class, and camera moves land on fixed coordinates. Keep the ids the timeline uses, keep row counts and text lengths close to the source, and when the layout moves, update the target coordinates without changing the times.
4. **Fonts.** HyperFrames fetches Google Fonts such as Inter on its own. Some sources use macOS local fonts (PingFang, Songti via `local()`). Use the user's brand font when it can be bundled; for a system font such as SF Pro, use Inter. Check that text still fits its boxes.
5. **Verify.** Compare the render with the preview film on the recipe page at the beat times in the Timing row. The beats, timing and camera should match; only brand and UI content differ.

## Matches requests like

- The card in front goes soft while the laptop behind it comes into focus
- Focus moves between the near and far planes like a camera operator turning the focus ring
- The last pull brings the headline out of the blur

## Spec

| Item | Value |
| --- | --- |
| Timing | Film 10.6s. Insight card rises 0.1–0.9s; runway count 12.9→14.2 over 1.0–2.3s and sparkline draws 0.9–2.2s; rack 1 to the laptop 2.5–3.4s (0.9s); insight card drifts off left 3.0–4.4s; new transaction row 3.75–4.3s, cash 482,310→481,070 over 3.85–4.5s, tooltip $33.9k 4.2–4.55s; approval card slides in from the right 4.6–5.6s; rack 2 to the card 4.9–5.8s (0.9s); Approve pressed at 6.2s, budget bar fills 6.4–7.1s; card leaves 7.1–7.8s; rack 3 to the headline 7.1–8.1s (1.0s), headline fades in 7.5–8.3s, underline draws 8.15–8.85s; scene fades 9.1–9.6s; lockup rises 9.3–10.4s and holds to the end |
| Easing | All three racks use power2.inOut, interpolating the focus distance between keyframes; card rise and slide-in, number counts, underline and lockup rise use expo.out; sparkline, fades and blur recovery use power2.out; card exits use power2.inOut and power2.in; the background drift is linear (none) |
| Camera | Locked camera with one focus distance driving the film. Depths: foreground cards 0, laptop 0.8, headline 1.5, bokeh 2.0–2.5. Focus is 0 for 0–2.5s, 0.8 at 3.4–4.9s, back to 0 at 4.9–5.8s, then 1.5 at 7.1–8.1s. Blur radius: planes in front of the focus get 40px per unit of distance capped at 24px; planes behind it get 28px per unit capped at 22px. Focus breathing: a foreground card grows 5% when fully defocused, the laptop and headline at most 1.4%. Parallax drift is linear over the 10.6s: x offset headline 10px, laptop 22px, approval card 44px, insight card 60px, with y at 25% of x |
| Subject | Insight card 700x448px scaled 1.2x to about 840x538px, centred at (510, 700), left of centre; approval card 520x338px scaled 1.2x to about 624x406px, centred at (1500, 520), right of centre; laptop lid 1000x600px scaled 1.18x to about 1180x708px, centred near (1190, 640), screen 976x576px with 14–15px UI text (about 16.5–17.7px on screen) and a 1120x24px base; headline Every dollar, in focus. at 140px with 144px line height, centred; 7 bokeh discs of 65–180px with a thin brighter rim, a faint fill and a soft outer edge, clustered at the laptop's upper left and right at depth 2.0–2.5; diameter = size × (0.3 + 0.7 × min(1, \|depth − focus\| / 2.4)), opacity = (0.08 + 0.17 × (1 − that ratio)) × 0.75–1, with a 3px blur |
| Sync | In each rack one plane's blur rises while the other falls on the same frame and the same curve; the laptop is sharp at 3.4s and the new transaction row lands 0.35s later; focus settles on the approval card at 5.8s and Approve is pressed 0.4s after, with the figures and budget bar following; the headline starts to appear at 7.5s while focus is still moving and is sharp at 8.1s, when the underline begins; the laptop drops to 45% opacity at 7.2–8.1s so the headline owns the frame |
| Style | Background `#09090b`, one accent mint `#3fe0a5`, neutral dark grey cards and UI; Inter throughout, headline weight 700; cards with 26px corners, a 1px hairline border and a large soft shadow; grain at 7% opacity re-rolled every 3 frames and a vignette reaching 50% at the edges |

## Why it works

One shared focus distance drives the whole film and each plane computes its blur from its own distance to it, so one plane going soft and another going sharp happen on the same frame and the same easing curve, and the viewer reads a lens turning its focus ring. The foreground card grows slightly as it defocuses, which is real lens focus breathing, and a slow parallax drift keeps the order of the planes visible. Each rack shows only two planes: the insight card against the laptop, the approval card against the laptop, then the headline against the defocused laptop; one card drifts out before the next comes in, so the frame never holds three layers at once. Each pull is followed by a hold of about 1.5s with something happening on the interface (a counting number, a new transaction row, an Approve press), so there is content to read the moment focus lands. The headline appears last and sits on the farthest content plane, so it stays soft whenever focus is elsewhere. Bokeh lights sit at the back and swell and shrink with focus, giving the background a change on every pull. There is one accent color, mint #3fe0a5.

## Prompt

> Build a 10.6-second, 1920x1080, 30 fps dark product film called Rack Focus for a fictional product, Corsa (a team finance app). Background #09090b, one accent color mint #3fe0a5, font Inter. The frame has four planes, each with a depth: an insight card and an approval card in front (depth 0), a laptop in the middle (depth 0.8), the headline Every dollar, in focus. far back (depth 1.5), and 7 bokeh lights at the very back (depth 2.0–2.5). Drive the film with one focus distance f over time: 0 for 0–2.5s, to 0.8 over 2.5–3.4s, held at 0.8 until 4.9s, back to 0 over 4.9–5.8s, held at 0 until 7.1s, then to 1.5 over 7.1–8.1s, every segment eased with power2.inOut. On each frame compute each plane's blur radius from its distance to f: 40px per unit of distance when the plane is in front of the focus, capped at 24px; 28px per unit when it is behind, capped at 22px. Apply it as CSS filter: blur() on the plane. Scale a plane up as it defocuses (focus breathing): foreground cards up to 5%, laptop and headline up to 1.4%. Add a linear parallax drift: x offset = −u × factor, with u running from −1 to 1 over the film and factors of 10px for the headline, 22px for the laptop, 44px for the approval card and 60px for the insight card, y offset at 25% of x. Put all state in one render(t) function driven by one linear proxy tween from 0 to 10.6s, with no CSS animations. The insight card is 700x448px scaled 1.2x and centred at (510, 700): a Corsa Insight header, a number counting 12.9→14.2 months of runway, a +1.3 mo chip, a sparkline, one line of copy and two buttons. The laptop lid is 1000x600px scaled 1.18x and centred near (1190, 640), with a 976x576px Corsa dashboard: a 176px sidebar, three KPI cards (Cash balance $482,310, Monthly burn $33,920, Runway 14.2 mo), an 8-month spend bar chart with November in mint and a transactions table, UI text 14–15px. The approval card is 520x338px scaled 1.2x and centred at (1500, 520): Priya Nair requesting $2,400.00 for annual design seats, a Marketing budget $6,180 left bar, and Approve and Decline buttons. Timeline: the insight card rises 0.1–0.9s (expo.out, from 50px below, scale 0.94→1) and the other planes fade in 0–1.2s; the number counts to 14.2 over 1.0–2.3s and the sparkline draws 0.9–2.2s; rack 1 to the laptop 2.5–3.4s while the insight card drifts 380px left and fades over 3.0–4.4s; at 3.75–4.3s a row Planwise −$1,240.00 slides in at the top of the transactions table (the other rows move down 34px, the new row flashes mint), cash counts to $481,070 over 3.85–4.5s and a $33.9k tooltip appears on the chart at 4.2–4.55s; the approval card slides in from 340px right at 4.6–5.6s (expo.out); rack 2 back to the foreground at 4.9–5.8s; at 6.2s Approve is pressed (scale 0.95 and back), the label turns to Approved and the budget bar fills from 38.2% to 62.2% over 6.4–7.1s with the text changing to $3,780 left; the card leaves right 7.1–7.8s; rack 3 to the headline 7.1–8.1s, with the headline fading in 7.5–8.3s, the laptop dropping to 45% opacity and a mint underline under focus. drawing 8.15–8.85s; the scene fades out 9.1–9.6s; the lockup rises 9.3–10.4s (120px mint mark, Corsa at 136px, Team finance, made clear. at 34px), going from 14px blur to sharp as it rises. Bokeh sits only at the laptop's upper left and right: diameter = size × (0.3 + 0.7 × min(1, |depth − f| / 2.4)) and opacity = (0.08 + 0.17 × (1 − that ratio)) × 0.75–1, so the discs swell, shrink and dim with focus. Finish with 7% grain re-rolled every 3 frames and a vignette.

## Often confused with

- [Device Push-in Focus](./device-push-in-focus.md): Device Push-in Focus moves the camera toward parts of one device; in Rack Focus the camera stays still and focus moves between planes at different depths: foreground cards, the laptop and the headline.
- [3D Tilted UI with Depth of Field](./3d-tilted-ui-depth-of-field.md): Tilted UI with Depth of Field leads the eye with a sharp band and graded blur across one tilted interface; in Rack Focus a whole plane is sharp at a time and the sharp plane changes over time.

## Source files

Runnable HyperFrames project, 3 files.

- ../source/rack-focus/hyperframes.json (318 B)
- ../source/rack-focus/index.html (32.3 KB)
- ../source/rack-focus/package.json (299 B)

Read `../source/rack-focus/index.html` in full before adapting it: it holds the whole composition and its GSAP timeline.
