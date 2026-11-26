# Text Behind Object Effect

Motionboard shot name: Headline Behind Product

A giant headline sits behind a product window and the window covers its lower edge. The window holds still while each feature swaps the headline: the old word sinks behind it, the new word rises from behind it, and the app content changes on the same frame.

- Position in a launch film: Opening
- Slug: text-behind-object-effect
- Preview video: https://media.motionboard.app/text-behind-object.mp4
- Recipe page (preview film and original side by side): https://motionboard.app/recipes/text-behind-object-effect/
- Film length: 11s, 1920x1080
- Original reference: Apple iPhone 17 Pro (YouTube, 0:00) https://www.youtube.com/watch?v=TNhX1uR2vO8
- Original reference: Samsung Galaxy Z Fold8 Ultra All-new Unfolds (YouTube, 0:01) https://www.youtube.com/watch?v=3vvJeRHe3sk&t=1s

## How to use this recipe

You are a coding agent. The user wants this shot for their own product. Follow these steps.

1. **Know the product.** If the product is clear from the user's repo or conversation, ask nothing and start. Otherwise ask once for: product name, logo file, brand colors.
2. **Pick the output.** If the user's message says a video or their website, do that. Otherwise ask once which one they want.
   - **Video (HyperFrames).** Copy the folder `../source/text-behind-object/` (next to this file in the skill) into the user's working folder, for example `cp -R <skill dir>/source/text-behind-object ./text-behind-object`. Adapt `index.html` (see "What to adapt"). Run `npx --yes hyperframes@0.8.209 check` on the untouched copy first and note its result. Preview with `npx --yes hyperframes@0.8.209 preview`, render an MP4 with `npx --yes hyperframes@0.8.209 render` (into `renders/`, named with a timestamp). The same commands are in `package.json` as `dev`, `check`, `render`; pass flags after `--`, as in `npm run render -- --quality draft`. Rendering needs network access for web fonts and GSAP.
   - **Website motion.** Port the GSAP timeline in `index.html` into the user's site, using their stack (React, Vue, Svelte, plain HTML). Build the same DOM structure, keep the timeline's durations, delays and easings exactly, and start it when the element scrolls into view (IntersectionObserver or ScrollTrigger). Respect `prefers-reduced-motion: reduce`: show the final frame as a static state and skip the movement.
3. **What to adapt.**
   - **Brand layer** (product name, logo, colors, fonts, copy): replace directly with the user's.
   - **UI layer** (the product screens, cards, windows, controls shown in the shot): rebuild the user's real UI as clean DOM, from their codebase (components, design tokens) or from a screenshot used as reference only. Never paste a screenshot into the shot.
   - **Motion** (timing, easing, camera moves, layering, stagger, order of events): keep exactly as in the source. This is what the recipe is.
   - The timeline targets UI elements by id and class, and camera moves land on fixed coordinates. Keep the ids the timeline uses, keep row counts and text lengths close to the source, and when the layout moves, update the target coordinates without changing the times.
4. **Fonts.** HyperFrames fetches Google Fonts such as Inter on its own. Some sources use macOS local fonts (PingFang, Songti via `local()`). Use the user's brand font when it can be bundled; for a system font such as SF Pro, use Inter. Check that text still fits its boxes.
5. **Verify.** Compare the render with the preview film on the recipe page at the beat times in the Timing row. The beats, timing and camera should match; only brand and UI content differ.

## Matches requests like

- A giant headline hides behind the app window and the window covers its lower edge
- The product holds still while the headline words swap behind it
- The window content changes on the same frame as the headline word

## Spec

| Item | Value |
| --- | --- |
| Timing | Film 11s. Headline settles 0–1.2s, window rises 0.3–1.45s (1.15s, 34 frames); typing 1.45–2.4s (40 characters), task tick 2.5s, web clip card 2.62s (0.45s). First swap: old word sinks 3.0–3.3s (0.3s), new word rises for 0.9s from 3.32s, window content changes on the same frame; hover card appears 4.7s and leaves 5.3s. Second swap: sink 5.5–5.8s, rise 5.82–6.72s, command palette opens 5.82s already listing 6 recent notes; query typed 6.15–6.9s, matched results replace the recents at 7.0s, answer streams 7.1–7.75s. Finish: Recall sinks 8.2–8.5s (230px, power3.in), palette closes 8.3s, wordmark rises 8.52–9.42s, window sinks 8.45–9.45s (1.0s), icon 8.75s, tagline 9.1s (after the window's top edge has sunk below it, 0.55s rise), hold to 11s with about 1.6s of settled wordmark and about 1.35s of settled tagline |
| Easing | Rises and word swaps `cubic-bezier(0.16,1,0.3,1)` (expo.out); old word sinks with power3.in (0.3s); the closing window sink uses power3.inOut; camera pushes and the closing pull-back both use expo.out, with a 3px blur added for the first 0.12s of each push (2px on the pull-back) and removed over 0.3s; the world rotation is linear |
| Camera | 3D world with 2600px perspective: the headline layer sits 420px behind the window and is scaled 1.1615 to cancel the perspective shrink, so it looks the same size from the front. The whole world turns from rotateY −4° to +4° at constant speed over 11s, with a slow push 1.00→1.03. The window rises from below the frame (y 800px) with rotateX 10°→0 and stays opaque throughout. On each swap the camera pushes fast: from 3.32s, 0.7s to 1.10x on the right panel, with the window's left edge about 55px outside the frame, then from 5.82s, 0.7s to 1.12x on the palette, then from 8.3s a 0.9s pull-back to full frame |
| Subject | Headline Inter 650, 340px, letter-spacing −0.045em, no punctuation; window 1500×900px at (210,425), bottom 245px off-frame. Its top edge covers the letters by about 51px, a quarter of the letter height. The window is a three-pane notes app: sidebar 248px, note list 352px, editor 590px, right panel 310px, body text 12.5–15px, secondary text 10.5–12px, note title 31px, section headings 17px, palette query 18px, answer text 15.5px; header collaborator avatars 28px, right-panel collaborator list avatars 22px. Ending: the app icon is a 100px emerald rounded square (23px radius, gradient `#17c585` to `#0a8a5c`, white H), centred, top at y 70px; the tagline "Notes that remember." is Inter 500 at 32px in `#7a7b83`, centred, top at y 520px. The headline text box starts at y 182px with 340px line height, so the window's top edge at y 425px covers about 51px of the letter bottoms |
| Sync | First swap (3.32s): the right panel changes from outline to linked notes, six links turn accent every 0.1s from 3.42s, ten graph lines draw every 0.07s from 3.52s. The cursor moves in 4.1–4.65s and stops about 8px below the link text so the link stays readable. When the hover card appears (4.7s) the matching graph node rings on the same frame and its graph edge thickens to 2.4px. Second swap (5.82s): the new word, the command palette and the camera push start on the same frame, and the window dims by 16% |
| Style | Light stage gradient `#f3f2ee` to `#e9e7e2`, headline ink `#17171b`, one accent emerald `#0f9d68` (links, selected row, icon); white window with `#e7e6e3` hairlines and a `#f3f2ef` sidebar, four layered soft shadows, soft corner vignette |

## Why it works

The headline and the window sit on two layers, so when the camera turns slowly the back layer moves about 60px less than the window and the viewer reads real depth from parallax. The window covers only about a quarter of the lowercase letter height, so the word stays readable. Each swap happens at the window's top edge, so the eye never leaves one spot, and the headline word, the window content and the camera push start on the same frame, which ties each word to one feature.

## Prompt

> Build an 11-second product opener called Headline Behind Product for a fictional Mac notes app named Halden. Light stage (gradient #f3f2ee to #e9e7e2), 1920x1080, 30fps. Put two layers in one 3D world with 2600px perspective: the headline layer sits 420px behind the window (translateZ(-420px), scaled 1.1615 to cancel the perspective shrink), set in Inter 650 at 340px with letter-spacing -0.045em, ink #17171b, text box top at y 182px with 340px line height, centred, with no punctuation after the word; the window layer is a 1500x900px macOS-style window that stays fully opaque, with its top-left at (210,425) and its bottom 245px off-frame, so its top edge covers about a quarter of the letter height. The window is a three-pane notes app: sidebar 248px (inbox, folders, tags with counts), note list 352px, editor 590px, right panel 310px, filled with real work content (Pricing review, Atlas launch checklist, Maya Chen) with body text 12.5-15px, secondary text 10.5-12px, note title 31px, section headings 17px, palette query 18px, answer text 15.5px, header avatars 28px and collaborator-list avatars 22px, with grey text at least 4.5:1 against white. Turn the whole world from rotateY -4deg to +4deg at constant speed over 11s with a slow push 1.00 to 1.03, so the back headline shifts against the window. Timeline: 0.3-1.45s the window rises from below the frame (y 800px to 0, rotateX 10deg to 0, expo.out); 1.45-2.4s a 40-character bullet types in the editor; 3.0-3.3s the headline Capture sinks 230px (power3.in) behind the window, and once it is fully hidden Connect rises from behind it at 3.32s (expo.out, 0.9s), so only one word is on screen in any frame; on the same frame the right panel becomes linked notes, six links turn accent every 0.1s, ten graph lines draw every 0.07s and the camera pushes to 1.10x in 0.7s (expo.out, 3px blur for the first 0.12s, leaving the window's left edge about 55px outside the frame); the cursor moves in 4.1-4.65s and stops about 8px below the link text; at 4.7s a hover card opens and the matching graph node rings and its edge thickens to 2.4px on the same frame, and the card leaves at 5.3s; 5.5-5.8s the word sinks and Recall rises at 5.82s (0.9s), with a command palette opening on the same frame (background dimmed 16%, six recent notes listed from the first frame) and the camera pushing to 1.12x in 0.7s; 6.15-6.9s a question types in, at 7.0s the recents are replaced by matched results, 7.1-7.75s the answer streams word by word with three sources; Recall sinks 230px (power3.in) behind the window 8.2-8.5s, at 8.3s the palette closes, and the Halden wordmark rises 8.52-9.42s, the window sinks 210px over 1.0s with power3.inOut, the camera pulls back to full frame in 0.9s (expo.out, 2px blur), the app icon appears at 8.75s (100px emerald rounded square, 23px radius, gradient #17c585 to #0a8a5c, white H, centred, top at y 70px) and the tagline "Notes that remember." rises at 9.1s, after the window top has sunk below it (Inter 500, 32px, #7a7b83, centred, top at y 520px, 0.55s), then hold to 11s. Use plain HTML elements and GSAP on one paused timeline.

## Often confused with

- [Text–Object Interleave](./text-object-interleave.md): Text–Object Interleave has a 3D product rise in front of the type and lets words pass through an object; Headline Behind Product uses a real app window that holds still while only the word and the window content change.
- [3D Tilted UI with Depth of Field](./3d-tilted-ui-depth-of-field.md): Tilted UI with Depth of Field shoots one interface at an angle with only the active row in focus; Headline Behind Product shows the whole window and builds the shot on the occlusion between the window and a giant headline.

## Source files

Runnable HyperFrames project, 3 files.

- ../source/text-behind-object/hyperframes.json (318 B)
- ../source/text-behind-object/index.html (46.5 KB)
- ../source/text-behind-object/package.json (307 B)

Read `../source/text-behind-object/index.html` in full before adapting it: it holds the whole composition and its GSAP timeline.
