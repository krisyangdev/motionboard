# Scrolling Text Animation

Motionboard shot name: Ramble to Summary

One dictated line scrolls sideways from slow to fast, the last m is held and zoomed into giant humps, then the whole line squeezes into a bar and blooms into a two-line message bubble while the camera pulls back to the chat window around it.

- Position in a launch film: Features
- Slug: scrolling-text-animation
- Preview video: https://media.motionboard.app/ramble-summary.mp4
- Recipe page (preview film and original side by side): https://motionboard.app/recipes/scrolling-text-animation/
- Film length: 11s, 1920x1080
- Original reference: Google Pixel Drop (YouTube, 0:06) https://www.youtube.com/watch?v=rUqLlMVJE3w&t=6s

## How to use this recipe

You are a coding agent. The user wants this shot for their own product. Follow these steps.

1. **Know the product.** If the product is clear from the user's repo or conversation, ask nothing and start. Otherwise ask once for: product name, logo file, brand colors.
2. **Pick the output.** If the user's message says a video or their website, do that. Otherwise ask once which one they want.
   - **Video (HyperFrames).** Copy the folder `../source/ramble-summary/` (next to this file in the skill) into the user's working folder, for example `cp -R <skill dir>/source/ramble-summary ./ramble-summary`. Adapt `index.html` (see "What to adapt"). Run `npx --yes hyperframes@0.8.209 check` on the untouched copy first and note its result. Preview with `npx --yes hyperframes@0.8.209 preview`, render an MP4 with `npx --yes hyperframes@0.8.209 render` (into `renders/`, named with a timestamp). The same commands are in `package.json` as `dev`, `check`, `render`; pass flags after `--`, as in `npm run render -- --quality draft`. Rendering needs network access for web fonts and GSAP.
   - **Website motion.** Port the GSAP timeline in `index.html` into the user's site, using their stack (React, Vue, Svelte, plain HTML). Build the same DOM structure, keep the timeline's durations, delays and easings exactly, and start it when the element scrolls into view (IntersectionObserver or ScrollTrigger). Respect `prefers-reduced-motion: reduce`: show the final frame as a static state and skip the movement.
3. **What to adapt.**
   - **Brand layer** (product name, logo, colors, fonts, copy): replace directly with the user's.
   - **UI layer** (the product screens, cards, windows, controls shown in the shot): rebuild the user's real UI as clean DOM, from their codebase (components, design tokens) or from a screenshot used as reference only. Never paste a screenshot into the shot.
   - **Motion** (timing, easing, camera moves, layering, stagger, order of events): keep exactly as in the source. This is what the recipe is.
   - The timeline targets UI elements by id and class, and camera moves land on fixed coordinates. Keep the ids the timeline uses, keep row counts and text lengths close to the source, and when the layout moves, update the target coordinates without changing the times.
4. **Fonts.** HyperFrames fetches Google Fonts such as Inter on its own. Some sources use macOS local fonts (PingFang, Songti via `local()`). Use the user's brand font when it can be bundled; for a system font such as SF Pro, use Inter. Check that text still fits its boxes.
5. **Verify.** Compare the render with the preview film on the recipe page at the beat times in the Timing row. The beats, timing and camera should match; only brand and UI content differ.

## Matches requests like

- A sentence too long to finish scrolls faster and faster
- The last letter is stretched into giant shapes
- The whole line squeezes to a bar and pops out as one short bubble

## Spec

| Item | Value |
| --- | --- |
| Timing | Film 11s. Scroll 0.1–3.2s (3.1s, 93 frames); brake 3.2–3.7s; held m 3.3–4.1s (0.8s, 26 extra m); zoom-in 3.45–4.4s (0.95s); squeeze 4.6–5.05s (0.45s, about 14 frames); bubble bloom 5.05–5.75s (0.7s); summary words 5.3–6.3s; camera pull-back 6.3–8.0s (1.7s, 51 frames); reply bubble 7.6s; window drift 8.0–8.9s (0.9s); window fades 8.65–8.9s; lockup lands at 8.9s and holds to the end (2.1s) |
| Easing | Scroll power2.in (cubic ease-in); brake and bloom expo.out; zoom-in and pull-back interpolate scale in log space (outQuart and outQuint curves); squeeze power3.inOut; summary words expo.out |
| Camera | One 120px line (Inter 500, letter-spacing -0.035em), 36 words, 9,833px wide, starting at x=160 and ending with "um" parked at x=930, next to frame center; horizontal blur stdDeviation 0 to 36px with speed, back to 0 within 0.5s of the brake; zoom-in 1x to 6.8x about frame center, so each m hump is about 446px tall (41% of the frame height) and only 2 to 3 m's stay in view; the 140px side fades go to 0 over 3.5–3.95s (0.45s, power2.inOut), so an m cut by the frame edge reads as part of an m; the squeeze treats the zoomed frame as one flat image, clipped to the 446px band the m's occupy so no blurred glyph tops show above the bar, and scales it on X about frame center from 1 to 0.0075, a bar about 14px wide and 446px tall, while its color turns from ink to violet (4.78–5.03s) and the horizontal blur rises to 14px (4.6–4.9s) and returns to 0 within 0.13s; pull-back 6.03x to 1x with no tilt at the start, a tilt that grows to -2° (Y) and 1° (X) as it pulls back and stays (perspective 2600px), then a slow drift 1.00 to 1.02 over 8.0–8.9s with the Y tilt easing to -1.4° |
| Subject | The bubble is 277×74px in the chat window with 15px type, violet, 20px corners and a 6px bottom-right corner. Its close-up is a separate element at screen size, 1,671×446px with 91px type and 121px and 36px corners (the same shape times 6.03), so the text stays sharp and the bubble keeps at least 120px to each frame edge. It opens from the squeezed bar, 14px wide and 446px tall and centered on x=960, widening evenly to both sides over 5.05–5.75s while the corner radius grows with the width. On the first frame of the pull-back (6.3s) the bubble inside the chat window, scaled 6.03x, takes over at the same size and position. The chat window is 1640×900px with an 11-conversation sidebar, 5 earlier messages, the summary bubble, Liam's reply and a composer with a Gist button; after the pull-back to 1x the bubble lands in the lower right of the window |
| Sync | The pill label changes from Listening to Summarizing at 4.4s, the moment the zoom lands and 0.2s before the squeeze starts, while the mic icon swaps to a sparkle icon and the waveform bars flatten to scaleY 0.12 over 0.25s (power2.out); the pill fades out from 4.9s over 0.35s (power2.in) and drops 14px; the word counter climbs to 36 words with the scroll and the last word is counted at 3.18s; the window background fades in over 0.35s starting at 6.3s and the window content over 0.45s starting at 6.35s; the line under the bubble (Summarized by Gist · 36 words to 10 · Delivered) fades in over 0.5s from 6.45s, after the pull-back has made it narrower than the frame; the reply bubble appears and the sidebar preview (Liam's reply, cut with an ellipsis) and time change on the same frame (7.6s) |
| Style | Warm cream background #f2efe9, text #1c1b19, one violet accent #5b3df5; the chat window is white with #e9e6e0 hairlines; Inter throughout; the closing mark is a violet rounded square with three white bars (84, 84 and 42px) and a 176px Inter 700 wordmark |

## Why it works

The scroll starts almost still, so viewers can read the first words, then accelerates to about 8,200 px/s with horizontal blur that grows with speed. They read first and are then left behind, which shows how long the input is. Holding the last m and zooming into it fills the frame with repeated shapes and sets the beat of the film. The squeeze and the bloom happen at the same spot, frame center: the zoomed frame squeezes into a bar whose width, height and color match the bubble's starting bar, and the bubble opens from it evenly to both sides, so the eye does not move. The result sits next to the input: the counter stops at 36 words and the line under the bubble says 36 words to 10. One accent color (violet #5b3df5) is shared by the bubble, the mic, the badge and the mark.

## Prompt

> Build a shot called Ramble to Summary, 11 seconds, 1920×1080, 30 fps, silent, for a product named Gist (a chat app that turns a long voice note into one short message). Light theme: warm cream background #f2efe9, text #1c1b19, one violet accent #5b3df5, Inter throughout. A white listening pill (720×84px) rises at the bottom from 0.05s over 0.7s with expo.out, with a violet mic circle, the label "Listening", 28 violet waveform bars and a word counter that climbs from 0 to 36 words; label and counter are 23px and the counter number is bold violet. In the middle of the frame one line of dictated text, Inter 500 120px, letter-spacing -0.035em, starting at x=160: "ok so basically Thursday is a problem because Priya is out and Liam hasn't finished the pricing page and legal wants one more look so I think we push the launch review to Friday and um" (36 words). It scrolls left from 0.1s to 3.2s with power2.in (cubic ease-in), starting almost still and reaching about 8,200 px/s, with horizontal motion blur (an SVG feGaussianBlur whose stdDeviation grows from 0 to 36px with speed) and 140px edge fades that go to 0 between 3.5 and 3.95s. From 3.2 to 3.7s it brakes with expo.out and the blur returns to 0; after the brake the end of "um" rests at x=930, next to frame center, so the text fills the left half and the right half is left for the m's. From 3.3 to 4.1s the final m of "um" is held down: 26 more m appear one by one, slightly accelerating. From 3.45 to 4.4s zoom the whole line in 6.8x about frame center (interpolate scale in log space, outQuart) until each m hump is about 446px tall and only 2 to 3 m's are in view. At 4.4s the pill label switches to "Summarizing", the mic icon swaps to a sparkle icon and the waveform bars flatten to scaleY 0.12 over 0.25s (power2.out); the pill fades out from 4.9s over 0.35s with power2.in, moving down 14px. From 4.6 to 5.05s treat the zoomed frame as one flat image, clipped to the 446px band the m's occupy (so no blurred glyph tops show above the bar), and squeeze it horizontally about frame center (scaleX 1 to 0.0075, power3.inOut) into a vertical bar about 14px wide and 446px tall; from 4.78 to 5.03s the ink color turns violet, and horizontal blur rises to 14px between 4.6 and 4.9s and returns to 0 within 0.13s. On the frame the bar disappears, a violet bubble of the same center, width and height takes over and widens evenly to both sides, staying centered on x=960, from 5.05 to 5.75s to its full 1,671px width (expo.out). In this close-up the bubble is its own element at screen size: 1,671×446px, 91px type, 121px corners and a 36px bottom-right corner (the 20px and 6px corners of the 277×74px bubble times 6.03); the corner radius grows with the width, so the bubble stays sharp and keeps at least 120px to each frame edge. It holds the summary "Launch review moves to Friday. / Pricing page and legal pending." (10 words); from 5.3s each word rises in 65ms apart (0.4s expo.out). The bubble is the newest sent message in a macOS-style chat window (1640×900px: 360px sidebar with 11 conversations, a Launch crew thread with 5 earlier messages followed by the summary bubble and Liam's reply, a composer with a violet Gist button), and in the chat window it is 277×74px with 15px type. During the close-up the window is scaled 6.03x about the bubble center with no tilt and its background and content hidden; at 6.3s, on the first frame of the pull-back, the bubble inside the window takes over at the same size and position. From 6.3 to 8.0s pull the camera back to 1x (log-space scale, outQuint) while a perspective tilt grows from 0 to -2° Y and 1° X (perspective 2600px) and stays; the window background fades in over 0.35s starting at 6.3s and the window content over 0.45s starting at 6.35s, and a small line under the bubble, "Summarized by Gist · 36 words to 10 · Delivered", fades in over 0.5s from 6.45s. At 7.6s Liam's reply "Friday works. I'll have the pricing copy by Thursday night." rises in, and on the same frame the sidebar preview changes to Liam's reply cut with an ellipsis and the time updates. From 8.0 to 8.9s the window drifts from 1.00 to 1.02 while the Y tilt eases to -1.4°; from 8.65 to 8.9s it fades out. From 8.9s a violet mark (156px rounded square with three white bars), a 176px Gist wordmark and "Voice notes, summarized." rise in with expo.out and hold to 11s, drifting up 6px. Use HTML plus one paused GSAP timeline, fully deterministic, with no random numbers and no requestAnimationFrame.

## Often confused with

- [Word-by-Word Text Highlight](./word-by-word-text-highlight.md): Word-by-Word Highlight sets the reading pace of a paragraph with color changes; Ramble to Summary scrolls the text itself at rising speed and then compresses it into a very short result.
- [Typing Animation (Typewriter Effect)](./typing-animation.md): Rhythmic Typing types one command at a steady pace; Ramble to Summary accelerates from slow to fast and ends as a single message.

## Source files

Runnable HyperFrames project, 3 files.

- ../source/ramble-summary/hyperframes.json (318 B)
- ../source/ramble-summary/index.html (30.8 KB)
- ../source/ramble-summary/package.json (303 B)

Read `../source/ramble-summary/index.html` in full before adapting it: it holds the whole composition and its GSAP timeline.
