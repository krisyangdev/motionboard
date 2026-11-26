**English** | [简体中文](README_CN.md)

# Motionboard

Make launch videos and motion graphics with Claude Code or Codex: a free HyperFrames skill with 58 shot recipes (match cut, logo reveal, kinetic typography, liquid glass effect, typing animation and more), each rebuilt in code from Apple, Linear, Figma and other launch films.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude%20Code-skill-d97757)](#install)
[![Codex skill](https://img.shields.io/badge/Codex-skill-111111)](#install)

[motionboard.app](https://motionboard.app) · [All recipes](https://motionboard.app/#recipes)

[![The Motionboard launch film, built from six recipes](assets/readme/film.gif)](https://motionboard.app)

Ask your agent to "make a launch video for my product", "add a match cut between these two screens" or "animate our logo reveal", and it builds the shot in code and renders an MP4 (or ports the motion to your website). Motionboard breaks real launch films down into 58 shots. Each shot is recreated in code as a ~10 second [HyperFrames](https://github.com/heygen-com/hyperframes) film (HTML and GSAP rendered to video), and the website shows every original next to its recreation. The skill gives your agent all 58 recipes, so it can make one shot or plan and build a whole launch film for your product.

[![Motionboard launch film, made with the Motionboard skill](https://media.motionboard.app/launch-motionboard-motionboard.jpg)](https://media.motionboard.app/launch-motionboard-motionboard.mp4)

The same three products, with the films from HyperFrames and brag next to ours: [launch video examples](https://motionboard.app/guides/launch-video-examples/).

Requirements: Node 22+, HyperFrames (`npx hyperframes`), ffmpeg.

## Install

```sh
npx skills add krisyangdev/motionboard
```

Or hand the link to your agent:

> Install this skill: https://github.com/krisyangdev/motionboard

Agents installing for a user: run `npx skills add krisyangdev/motionboard -g -y` (global, no prompts). If the skill is not available in the current session yet, read `SKILL.md` at the path the command prints (usually `~/.agents/skills/motionboard/`) and follow it.

In Claude Code, add it as a plugin:

```sh
/plugin marketplace add krisyangdev/motionboard
/plugin install motionboard@motionboard
```

Manual install for Claude Code and Codex:

```sh
git clone https://github.com/krisyangdev/motionboard.git ~/motionboard
ln -s ~/motionboard/skills/motionboard ~/.claude/skills/motionboard
ln -s ~/motionboard/skills/motionboard ~/.codex/skills/motionboard
```

## Use

| Say | What happens |
| --- | --- |
| Make a launch film for my product with Motionboard. | The agent reads your product, proposes a 4 to 6 shot storyboard with preview links, waits for your OK, builds each shot and joins them into one MP4. |
| Make a launch film for https://your-product.com with Motionboard. | One command, no questions: the agent captures the page, writes a brief, picks five recipes, builds and renders each one, and joins them into a 22 to 32 second MP4. |
| Use the match-cut recipe to go from my logo to the app. | The agent builds that one shot with your brand and UI, renders it, and checks it against the preview. |
| Make the Tilted UI with Depth of Field shot for this landing page. | The agent ports the recipe's GSAP timeline into your site as a hero animation. |

Each recipe page on [motionboard.app](https://motionboard.app) has a copy button that gives your agent one line: install this skill, then make that shot.

## Recipes

58 recipes, grouped by where they sit in a launch film.

<!-- recipes:start -->

### Opening (12)

| Recipe | Shot |
| --- | --- |
| [Light Reveal](https://motionboard.app/recipes/light-reveal/) | The product emerges from pure black as exposure rises, with a barely perceptible push-in, and the closing shot runs the same move in reverse. |
| [Showcase Wall](https://motionboard.app/recipes/showcase-wall/) | A full-screen wall of work cards drifts diagonally at constant speed while slowly scaling up, then accelerates into one card at the end. |
| [Word-by-Word Text Highlight](https://motionboard.app/recipes/word-by-word-text-highlight/) | Words in a small centered line brighten from gray to white one at a time, and the text never moves. |
| [Typing Animation (Typewriter Effect)](https://motionboard.app/recipes/typing-animation/) | Monospace text is typed character by character with a cursor at uneven human speed, then deleted and retyped. |
| [Branching Growth](https://motionboard.app/recipes/branching-growth/) | A single dot branches layer by layer into a network, slow at first and then faster, or splits in doubling beats until it fills the frame. |
| [Iris Transition](https://motionboard.app/recipes/iris-transition/) | A fixed circular window cuts rapidly between images, or revisits the same image, while its size jumps with the rhythm. |
| [Line Boil Effect](https://motionboard.app/recipes/line-boil-effect/) | Hand-drawn outlines swap to a slightly different trace every few frames, and motion steps at a low frame rate with no tweening. |
| [Text Behind Object Effect](https://motionboard.app/recipes/text-behind-object-effect/) | A giant headline sits behind a product window and the window covers its lower edge. The window holds still while each feature swaps the headline: the old word sinks behind it, the new word rises from behind it, and the app content changes on the same frame. |
| [3D Ribbon Text Animation](https://motionboard.app/recipes/3d-ribbon-text-animation/) | A two-line title folds between its words into zig-zag 3D ribbons and multiplies into a field of rows, wide arrow bands sweep past the camera, the last band fills the frame and wipes to the product UI, and the film ends on the product wordmark. |
| [One Word per Cut](https://motionboard.app/recipes/one-word-per-cut/) | One line is split into one word per shot. Each word sits at the center of the frame over a different product screen, file-name captions follow, then the full line lands on a cream card before the wordmark. |
| [Lens Flare Effect](https://motionboard.app/recipes/lens-flare-effect/) | A smartwatch on black. A long thin blue streak sweeps across the frame with a chain of chromatic ring and hexagon ghosts placed opposite the source along the line through the frame centre. The title Aster Series 2 rises, a smaller flare crosses it from right to left, and a short lockup closes the film. |
| [Star Wars Text Crawl](https://motionboard.app/recipes/star-wars-text-crawl/) | A line of cool-blue text fades in and out on black, then a justified block of cream text with a kicker and a title recedes up a tilted plane over a starfield, the stars rise when the crawl ends, and the Kestrel lockup appears. |

### Product reveal (12)

| Recipe | Shot |
| --- | --- |
| [Device Push-in Focus](https://motionboard.app/recipes/device-push-in-focus/) | A line-art 3D laptop turns upright while closed, opens, pushes in on the keyboard, then pans from key to key in step with the option selected in the UI beside it. |
| [Macro Pull-out Reveal](https://motionboard.app/recipes/macro-pull-out-reveal/) | The camera drifts slowly across a surface at extreme close range, then one pull-back reveals the whole device or page. |
| [X-Ray Effect](https://motionboard.app/recipes/x-ray-effect/) | The internal structure and the outer shell cross-dissolve from the same camera position, then the camera pulls back to the whole device. |
| [Text–Object Interleave](https://motionboard.app/recipes/text-object-interleave/) | Text and object interleave in depth: type rises from behind the product, a device slots into a gap in a sentence, or a word passes through an object and comes out as another word. |
| [Outline-to-Solid Reveal](https://motionboard.app/recipes/outline-to-solid-reveal/) | A wireframe or light-drawn outline appears first, then fills into a solid shape or material. |
| [3D Tilted UI with Depth of Field](https://motionboard.app/recipes/3d-tilted-ui-depth-of-field/) | A UI plane tilted 10–15° and shot up close, with only the active row in focus and the rest blurred. |
| [Dock Arrival](https://motionboard.app/recipes/dock-arrival/) | A magnified Dock opens a gap, a new icon grows into it with one small spark, and a cursor click opens the window. |
| [Fluted Glass Effect](https://motionboard.app/recipes/fluted-glass-effect/) | A laptop screen is split into 28 vertical glass ribs. Light streaks rise through the ribs and settle into a big word. The camera then pushes into the screen, the word lifts out, the title rises in, the glass flattens and the blur clears into a lockup with only a few faint ribs left at the screen edges. |
| [Dolly Zoom Effect](https://motionboard.app/recipes/dolly-zoom-effect/) | The camera backs away while the lens zooms in, so the phone holds its size in frame, the perspective behind it flattens, and the hall collapses into one wall of dashboard. |
| [Count Up Animation](https://motionboard.app/recipes/count-up-animation/) | One very large number rolls up digit by digit, fast at first and settling slowly on its target, with a small uppercase kicker above and a one-line label below. The same move then runs inside a dashboard card with a sparkline drawn in step, and last on a closing stat with a strip of ticks. |
| [Rack Focus](https://motionboard.app/recipes/rack-focus/) | A large insight card sits sharp in the foreground with a blurred laptop behind it. Focus pulls to the laptop, the card softens and drifts away, a second card slides in from the right and takes focus back, and a last pull lands on the headline Every dollar, in focus. before the Corsa lockup. |
| [Exploded View Animation](https://motionboard.app/recipes/exploded-view-animation/) | A phone's cover glass, display, frame, logic board, battery, wireless coil and back glass separate in the air one by one while three callouts name the glass, the chip and the battery. The top three layers fade, the camera dives into the board and pulls out, and the seven layers close from the back up into the whole phone beside the Arden One lockup. |

### Features (18)

| Recipe | Shot |
| --- | --- |
| [Dispense Line-up](https://motionboard.app/recipes/dispense-line-up/) | Accessories slide out of the main object one by one into a row while the caption appears word by word, then retract in mirror order. |
| [Zoom-to-Cursor Effect](https://motionboard.app/recipes/zoom-to-cursor/) | The camera pushes to the target element in 0.4–0.8s, holds for one click or input, then pulls back to the full view. |
| [Morph Transition](https://motionboard.app/recipes/morph-transition/) | One element keeps morphing into the next, replacing cuts, so the whole sequence has no hard cut. |
| [Wireframe Re-layout](https://motionboard.app/recipes/wireframe-re-layout/) | Content fades to wireframes, the wireframes re-flow into a new layout, then each cell fills with new content in turn. |
| [Card Flip Animation](https://motionboard.app/recipes/card-flip-animation/) | The preview card rotates 180° around the Y axis and its back face shows the code. |
| [Control-Driven Change](https://motionboard.app/recipes/control-driven-change/) | The frame a control (color picker, toggle, dial) lands, the page result changes on that same frame. It can be split-screen with the control on the left and the result on the right. |
| [Multiplayer Cursor Animation](https://motionboard.app/recipes/multiplayer-cursor-animation/) | Enlarged two-color named cursors move across a canvas, leave comments, and drag items to reorder. |
| [Focus Hop](https://motionboard.app/recipes/focus-hop/) | A highlight block or focus frame hops one cell at a time with the cursor, and the frame can take the color of the icon inside it. |
| [Pile-up and Clear](https://motionboard.app/recipes/pile-up-and-clear/) | Tasks, tags, or events pile up one by one until the screen is full, then clear in one step to a single result state. |
| [Prompt Carousel](https://motionboard.app/recipes/prompt-carousel/) | A line under the headline thickens into a pill, becomes an input box, and types a list of prompts that scroll vertically. |
| [Kinetic Typography](https://motionboard.app/recipes/kinetic-typography/) | A spec line is split into words placed far apart on uneven baselines, with a connector word stepping up letter by letter. |
| [Liquid Glass Effect](https://motionboard.app/recipes/liquid-glass-effect/) | A transparent glass disc, loupe, or control moves over content, magnifying and refracting what lies beneath, with dispersion at the edge. |
| [Map Pin Drop Animation](https://motionboard.app/recipes/map-pin-animation/) | A pin drops onto a map with a bounce and bursts into fragments, the map zooms out to the whole country, and a route line draws to the next city. |
| [Dot Matrix Animation](https://motionboard.app/recipes/dot-matrix-animation/) | A graphic is quantized onto a circular dot-matrix display, and every frame of its rotation or change snaps to the dot grid. |
| [Confetti Success Animation](https://motionboard.app/recipes/confetti-success-animation/) | On the frame of a tap, payment, or confirmation, lines, squares, and dots radiate from the contact point, or an icon pops with a bounce and an echo outline expands. |
| [Light Beam Effect](https://motionboard.app/recipes/light-beam-effect/) | Small laptops on black each throw a trapezoid beam of light with an app screen inside it. The beams swing, hand off, merge into one wide beam that carries a stat along its right edge, and the last laptop closes. |
| [Scrolling Text Animation](https://motionboard.app/recipes/scrolling-text-animation/) | One dictated line scrolls sideways from slow to fast, the last m is held and zoomed into giant humps, then the whole line squeezes into a bar and blooms into a two-line message bubble while the camera pulls back to the chat window around it. |
| [Chat Animation](https://motionboard.app/recipes/chat-animation/) | The camera sits close on a chat panel: a prompt is typed into the composer and sent, the bubble springs up, the AI shows Thinking… and runs three tool-call cards that spin and tick off, the reply streams in word by word, and the camera pulls back as a blank preview beside the chat fills with an invoicing dashboard before the Mosaic lockup. |

### Transitions (10)

| Recipe | Shot |
| --- | --- |
| [Locked-Layout Reskin](https://motionboard.app/recipes/locked-layout-reskin/) | Layout positions stay locked while the color scheme and fonts hard-cut every 6–10 frames. |
| [Glass Droplet Split](https://motionboard.app/recipes/glass-droplet-split/) | A glass slab stretches into a droplet, its neck thins and breaks, leaving a round bead. A dispersive glass ring contracting inward is the sibling form. |
| [Domino Wave](https://motionboard.app/recipes/domino-wave/) | A row of cubes flips 90 degrees one after another with a phase offset, while the camera pans along the line. |
| [Match Cut Transition](https://motionboard.app/recipes/match-cut-transition/) | One object is replaced by another at the same anchor point, so the viewer's gaze never moves. |
| [Wipe and Flash Transition](https://motionboard.app/recipes/wipe-flash-transition/) | A defocused foreground object sweeps across and covers the frame to cut scenes, or a central glow blows out to white before the next scene. |
| [Infinite Zoom Effect](https://motionboard.app/recipes/infinite-zoom/) | The camera dives into one card, its preview fills the frame and becomes the next screen, and after four levels the shot lands on the first screen again, so it loops. |
| [Flipbook Animation](https://motionboard.app/recipes/flipbook-animation/) | After a click, the 15 cards on a moodboard collapse into a book, the pages flip faster and faster, then burst into a 3D collage that drifts toward the camera and settles behind a wordmark. |
| [Ripple Effect](https://motionboard.app/recipes/ripple-effect/) | A headline sits inside a glowing spectral ring that ripples and sends out faint echoes. The ring contracts, then concentric rings expand from the centre and each one reveals the next scene, landing on the product. |
| [Light Leak Transition](https://motionboard.app/recipes/light-leak-transition/) | A soft orange, amber and magenta glow drifts in from one side of the frame, peaks near white on the cut frame, and the next screen develops out of the overexposure. It happens twice, ending on the lockup. |
| [Smash Cut](https://motionboard.app/recipes/smash-cut/) | A loud crowd scene full of beams and flashes hard-cuts in one frame to pure black, a white line types in word by word, and then green LEDs light between the lines while the sensor rises out of the dark and shrinks into the mark. |

### Ending (6)

| Recipe | Shot |
| --- | --- |
| [Rotating Logo Reveal](https://motionboard.app/recipes/rotating-logo-reveal/) | An object spins with a long ease-out and stops at the exact angle that forms the logo silhouette or the hero view of the product. |
| [Converging Logo Reveal](https://motionboard.app/recipes/converge-logo-reveal/) | At the end, multiple elements gather and compress into a single icon or logo, always centered in the frame. |
| [Logo Wordmark Reveal](https://motionboard.app/recipes/logo-wordmark-reveal/) | A logo mark sits centered, then the wordmark unfolds from behind it or outward from its center, optionally with a scramble-then-lock effect. |
| [Chromatic Aberration Text Effect](https://motionboard.app/recipes/chromatic-aberration-text-effect/) | Some letters of a wordmark stretch horizontally with RGB ghosting, distort in steps, then snap back clean. |
| [Line Drawing Logo Animation](https://motionboard.app/recipes/line-drawing-logo-animation/) | A low macro camera follows a plotter pen across paper: it draws a ring and a meridian, sketches each letter as a skeleton, a heavy pen fills them in, then the film cuts to the flat logo, which blurs while the date and URL type on below it. |
| [Blur Text Animation](https://motionboard.app/recipes/blur-text-animation/) | Large words on a dark field resolve from heavy blur one at a time, each line blurs away word by word before the next arrives, the product screen behind sharpens with the line about focus, and the closing tagline sharpens before the product mark lands under it. |

<!-- recipes:end -->

## Website

The site is TanStack Start prerendered to static HTML and served from Cloudflare Workers.

```sh
npm install
npm run dev        # http://127.0.0.1:3000
npm run build      # generate recipe files, prerender every page, write sitemap.xml
npm run deploy     # build, then cf deploy
```

`scripts/site/recipes.mjs` runs before each dev and build. It writes the agent-facing recipe files for the website (`public/r/`) and for the skill (`skills/motionboard/recipes/`) from `content/recipes/`, and copies `skills/motionboard/source/` to `public/source/`.

Films and posters are served from R2 at https://media.motionboard.app. Keep source files in `media/` (not tracked) and upload with `scripts/site/upload-media.sh [file ...]`. Copy, like and wish counts live in D1; apply the schema locally once with `npx wrangler d1 migrations apply DB --local`.

## License

MIT, see [LICENSE](LICENSE). The recreations in `skills/motionboard/source/` are original work. The original films belong to their owners and appear on the website only as short reference clips next to the recreations. See [NOTICE](NOTICE).
