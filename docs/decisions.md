# Decision log

Each entry records what was decided, the alternatives, and why. Add new entries at the bottom as the project evolves, including decisions you later reverse.

---

## 1. Low-res pixel canvas instead of a high-res sketchbook

**Decision:** Draw on a 320×120 bitmap and scale it up with `image-rendering: pixelated`.

**Alternatives:** A high-res canvas with smooth, anti-aliased, pressure-sensitive brushes (like a lightweight Procreate).

**Why:** The small canvas is the product's personality. It lowers the skill bar, makes every post look like it belongs, keeps files to a few KB, and makes animation storage cheap. The wide 8:3 shape matches the size of a Miiverse handwritten post and sits naturally in a scrolling feed, like a banner, instead of taking over the screen. A high-res canvas would feel more "professional" but would raise the pressure to make good art, which works against the goal.

## 2. Custom drawing engine instead of Fabric.js / Konva

**Decision:** Write a small engine on the raw Canvas 2D API.

**Alternatives:** Fabric.js or Konva.

**Why:** Those libraries model drawings as movable vector objects. This app needs freehand pixel painting with a fill bucket, which they don't do well. The engine needed is small (lines, brushes, fill, undo) and owning it gives full control over how drawing feels.

## 3. Indexed color (1 byte per pixel), not RGBA

**Decision:** Store each pixel as a palette index (`Uint8Array`) and convert to RGBA only when rendering.

**Alternatives:** Draw directly on the canvas and read pixels back as RGBA.

**Why:** It's 4× smaller, it guarantees only palette colors ever exist, it makes flood fill an exact comparison, and the same format can be used for animation frames and for compact storage later.

## 4. Bresenham lines between pointer samples, not `ctx.stroke()`

**Decision:** Connect pointer samples with a Bresenham line and stamp the brush at each pixel. Use `getCoalescedEvents()` to get every sample.

**Alternatives:** The canvas's built-in `lineTo` / `stroke`.

**Why:** Built-in strokes are anti-aliased, which adds gray in-between pixels. That breaks the look and makes the fill bucket leak. Pointer events also arrive with gaps on fast strokes, so samples must be joined with lines.

## 5. Snapshot undo instead of diff-based undo

**Decision:** Save a full copy of the bitmap before each change, capped at 50 steps.

**Alternatives:** Store per-stroke diffs or replay a command list.

**Why:** At ~38 KB per snapshot, 50 steps is ~1.9 MB, which is fine. Snapshots are simple and hard to get wrong. Revisit when animations multiply the data by the number of frames.

## 6. "Clear" is undoable, so no confirmation dialog

**Decision:** Clearing the canvas records an undo step instead of asking "Are you sure?"

**Why:** Confirmation dialogs interrupt the flow and people click through them anyway. Making the action reversible is safer and smoother.

## 7. Engine is framework-free and unit tested

**Decision:** Keep `src/lib/pixel` free of React and cover it with Vitest tests.

**Why:** The drawing logic is the riskiest part and the easiest to test in isolation. It can also be reused for server-side thumbnail generation later.

## 8. Zoom, rotate, and pan are a display transform only

**Decision:** The view (zoom, rotation, pan) is a CSS transform on the canvas element. Pointer positions are mapped back into bitmap coordinates by undoing the transform. The bitmap itself never changes when you rotate or zoom.

**Alternatives:** Re-render the bitmap into a larger rotated canvas, or rotate the bitmap data.

**Why:** Rotating pixel data would be lossy at any angle that isn't a multiple of 90°, and rotating the view is what artists actually want (turning the paper to get a better stroke angle). A CSS transform is GPU-accelerated and keeps pixels crisp with `image-rendering: pixelated`. Zoom anchors on the cursor and rotation pivots on the viewport center, so whatever you're looking at stays put. Panning is limited so the canvas can never be scrolled away: a zoomed-in canvas stops when its edge meets the viewport edge, and a canvas that fits entirely in view stays centered and can't be panned at all (there's nothing hidden to pan to). The limit accounts for rotation and is re-applied on resize.

## 9. Toolbar modeled on game drawing tools: eraser/pen pairs by size

**Decision:** Brush size and tool are chosen together with one tap (eraser or pen at small / medium / large), in a framed, chunky-button toolbar with key badges.

**Alternatives:** A separate tool picker and size slider (common in desktop apps).

**Why:** Switching between drawing and erasing at the same size is the most frequent action in quick doodling. Pairing them makes it one tap instead of two. Big tiles also work for touch and stylus, and the shortcut badges teach keyboard users the shortcuts without a help screen.

## 10. Site look: a sunny town square, not a dark social app

**Decision:** A bright green, chunky, friendly visual style: banner panels strung with pixel festival bunting, rounded "paving stone" background, big pill buttons with a pressed-down shadow, a pixel turtle mascot (Pip, drawn by me), Pixelify Sans for headings and Nunito for body text.

**Inspiration:** Sudomemo (green section bars, chunky buttons) and the Miiverse archive (a calm column of post cards with who / where / when / reactions). The goal was the feeling, not a copy: original mascot, colors, and layout. An early version used film-strip perforations on the banners; they were swapped for bunting because they were too close to the reference, and bunting fits the "town square" idea better.

**Why:** The product is about low-pressure, playful posting. The UI should feel like a toy, not a dashboard, so people aren't intimidated into lurking.

## 11. Sample content is drawn by the real engine

**Decision:** Mock posts are generated procedurally (seeded frogs, cats, cities, ghosts…) with the same bitmap engine and palette as the editor.

**Alternatives:** Placeholder images, or hand-drawing and committing PNGs.

**Why:** It keeps every sample within the real constraints (320×120, 3 inks), needs no image files, and is deterministic, so the same seed always gives the same picture. It also exercises the engine. The mock data module mirrors the future database shape, so swapping in real queries shouldn't change the components.

## 12. No profile avatars for now

**Decision:** Posts show the author's name and @handle only.

**Why:** Keeps the feed focused on the drawings and cuts scope for the two-week build. Drawn profile pictures remain a planned part of sign-up.

## 13. Optimistic "Yeah!" button

**Decision:** Tapping Yeah! updates the count instantly. Right now it's local only; with a backend, it will send the request in the background and roll back if it fails.

**Why:** Reactions should feel instant. Waiting on the network for a like makes an app feel sluggish.

## 14. Square 120×120 canvas for profile pictures

**Decision:** Profile pictures get their own square 120×120 canvas (now part of "Make your profile" at `/signin`), separate from the 320×120 post canvas. The editor takes its size as a prop, so it's the same component and tools.

**Why:** A profile picture is shown small and square next to a name, so a wide banner shape would be cropped or squished. 120 matches the post canvas height, so the pixel scale feels the same. The editor's stage keeps at least a 16:10 shape and fits the canvas inside it in both directions (CSS container units), so a square canvas doesn't become enormous on a wide screen.

## 15. Editor frame uses the site's green

**Decision:** The editor frame switched from purple to the site's leaf green with the same dot pattern and drop shadow as other panels.

**Why:** The purple came from the first editor mockup, before the site had a visual identity. Matching the rest of the site makes the editor feel like part of the plaza rather than a separate tool.

## 16. Zoom inside a fixed window, with edge arrows

**Decision:** The canvas sits in a fixed-size window. Zooming happens inside it instead of the canvas spilling across the whole stage. When part of the drawing is hidden, a translucent bar with an arrow appears on that edge; tapping it (or pressing an arrow key) pans 40% of the window that way with a short slide. Strokes can only start inside the window.

**Inspiration:** Game drawing tools that show scroll arrows on the edges of a zoomed canvas.

**Why:**
- The canvas keeps the same size and position on screen, so the layout never jumps when zooming.
- The arrows show where hidden content is, which a plain clipped canvas doesn't.
- They give touch users a way to pan without the hand tool or two-finger gestures.
- Previously you could start a stroke in the stage margin and paint pixels you couldn't see. Restricting strokes to the window fixes that.

**Trade-off:** While zoomed, the bars cover a thin strip at the window edge. They only appear on sides that actually have hidden content, and disappear at 100%.

**Performance:** No extra cost. It's still a CSS transform on the canvas plus a clipping box; the bitmap is never re-rendered for panning or zooming.

## 17. Quarter-turn rotation and a flip view, instead of free rotation

**Decision:** Rotation now turns the view in 90° steps and zooms so the whole canvas fits the window. A new Flip button (F) mirrors the view left-to-right. Both are display-only, like zoom.

**What changed:** The first version rotated in 15° steps, copying painting apps like Procreate.

**Why:** Testing it raised problems specific to this app:
- At small angles a hard-edged pixel grid shows jagged stair-steps on screen, which fights the pixel look.
- With the fixed canvas window (decision 16), any tilt pushes the corners outside the window and shows scroll arrows even at 100%, which feels broken.
- On a tiny canvas you can reach any stroke angle without turning the paper, and mouse/trackpad users rarely rotate. Flipnote and Miiverse never had rotation.

Quarter turns keep pixels aligned with the screen, which helps when drawing long vertical lines or working on a square profile picture. Flipping is a classic artist trick for spotting lopsided proportions, and it doesn't distort pixels at all. A sideways wide canvas is small, but you can zoom in and pan with the edge arrows.

## 18. Zoom can't go below "fits the window"

**Decision:** The smallest zoom is the size where the whole canvas fits the window: 100% normally, smaller when a wide canvas is turned sideways. The zoom label counts from that fitted size, so 100% always means "everything is in view".

**Alternatives:** Allow zooming out to 50% or 25%, as most drawing apps do.

**Why:** With the fixed window (decision 16), 100% already shows the whole canvas. Zooming out further only shrinks the drawing into empty space, with less detail and no benefit. Big canvases need zoom-out to see the whole picture; a 320×120 canvas doesn't. Measuring from the fitted size also avoids a confusing "37%" label when the canvas is turned sideways.

## 19. Posting works before the backend, behind a fake API

**Decision:** Posts are saved in the browser (`localStorage`) through a small async module (`lib/local/posts.ts`) that behaves like a network call: it waits ~700 ms, can fail with typed errors (network, storage full), and returns the created post. The composer handles each outcome: validation, a posting spinner, an error with retry that keeps the drawing, and a redirect with a success banner.

**Alternatives:** Wait for Supabase before building posting, or save synchronously with no loading/error states.

**Why:** Posting is the core user journey, so it should be testable now. Designing against a fake API that can fail makes sure the loading and error states exist from the start, instead of being bolted on after the happy path works. `?simulateError=1` forces a failure so the error state can be demoed and tested. Only this one module changes when the real backend arrives.

**Trade-offs:** Posts only exist in one browser, and other people can't see them. Pages are labeled "On this device" so that's never a surprise.

## 20. Drawings saved as run-length-encoded text

**Decision:** Drawings are stored as a small versioned binary format (width, height, then color/run-length pairs), base64-encoded. Decoding validates the data and throws on anything corrupt, and the feed shows a "couldn't be loaded" placeholder instead of crashing.

**Alternatives:** Save the raw bitmap (38 KB → ~51 KB as text), or a PNG data URL.

**Why:** Doodles are mostly blank paper and long single-color runs, so a typical one shrinks to 2–6 KB of text (one test line was 412 characters). That matters with browser storage's ~5 MB limit, and later for database rows. PNG would be similar in size but needs async canvas work to encode and decode. The version byte leaves room for an animation format later.

## 21. Animation: a 320×180 flipbook built on the same editor

**Decision:** Animations get their own taller 320×180 canvas (`/draw/animate`) and reuse the drawing editor with frames added. A still drawing is just the one-frame case, so every tool, shortcut, and view control works the same in both.

**Details and why:**
- **Taller canvas:** 16:9 gives movement room to go up and down (a bouncing ball, a jump), which the wide 320×120 post canvas doesn't.
- **Undo per frame:** each frame has its own history, so undo never jumps you to another frame unexpectedly.
- **Deleting a frame is undoable** with one click instead of a confirmation dialog, matching decision 6.
- **Onion skin on by default:** it's the single most useful aid for flipbook animation; the previous frame is shown faded only where the current frame is blank.
- **No drawing during playback:** prevents accidentally drawing on whichever frame happened to be showing.
- **Limit of 100 frames and 2/4/8/12/24 fps:** room for short scenes, not just loops (Flipnote allowed 999, but most flipnotes were far shorter). Still keeps posts reasonably small (a typical frame is 2–6 KB, so a full animation is a few hundred KB).
- **Feed playback** only runs while an animation is on screen, respects `prefers-reduced-motion`, and always has a pause button (WCAG asks that moving content can be paused).

**Considered:** a separate animation component. Rejected because it would duplicate the editor and the two would drift apart.

**Found while testing:** at thumbnail size, crisp "pixelated" scaling dropped 1-pixel lines, so thin drawings looked blank in the frame strip. Thumbnails now scale smoothly; the main canvas stays pixel-crisp.

## 22. Never trap the page scroll

**Problem (found in testing):** scrolling with the cursor over the editor panned the canvas instead of the page, even when there was nothing to pan. With the large editor taking up most of the screen, the page felt stuck depending on where the cursor happened to be. On touch screens, swiping on the green margins couldn't scroll the page either.

**Decision:** Follow how nested scroll areas behave on the web. Pinch or Ctrl/Cmd + scroll zooms the canvas. A plain scroll pans the canvas only if it's zoomed in and can still move in that direction; otherwise, including once it reaches its edge, the page scrolls. On touch, only the canvas itself captures gestures, and the margins scroll the page.

**Iteration:** the first version handed scrolling to the page the moment the canvas hit its edge. That felt too loose: one swipe would pan the canvas and then keep going into the page. The compromise is **scroll latching**, which browsers use for nested scroll areas. Each swipe sticks to whatever it started on: a swipe that starts by panning the canvas keeps panning it to the edge and stops there, and only a new swipe (after a ~250 ms pause) scrolls the page. While the pointer is held down (drawing or dragging), the page never scrolls.

**Verified:** at 100%, scrolling over the canvas scrolled the page (288 px). Zoomed in, one long swipe panned the canvas to its edge and the page moved 0 px. A new swipe after a pause then scrolled the page (288 px).

## 23. White text on a deeper grass green (accessibility)

**Problem (found in the code review):** white text on the original leaf green (`#6cc04a`) measured 2.26:1, well under the WCAG AA minimum of 4.5:1 (3:1 for large bold text). It affected the header, section bars, banners, and the editor frame.

**Options:** (a) darken the green behind white text; (b) keep the bright green and switch the text to dark ink.

**First try:** (b), ink on the bright green (7.5:1). It passed, but I wanted to compare it with the white-text version before settling.

**Decision:** (a). I previewed a forest green (`#2f6b20`, 6.5:1), wanted it a little more vibrant, and settled on a grass green, `#368224`, at 4.8:1. That's about as vibrant as the green can get while still passing with white text. Panels get a darker `#25601a` drop shadow, the pixel logo is white with a dark green offset, and focus rings on green are white. Small text on see-through white boxes failed (about 2.9:1), so those boxes now use a dark tint instead.

## 24. Posts are drawing-only; replies can be text

**Problem:** the brief allowed text posts, but the homepage says "Every post is hand-drawn." A feed with text posts mixed in looks like a generic forum and weakens the one idea that makes the plaza different.

**Options:** (a) keep text posts, limited to one plaza; (b) no text anywhere, so replies must be drawn too; (c) posts must be drawings, replies can be typed or drawn.

**Decision:** (c). The feed stays all drawings, which is the identity of the app. Replies stay low-effort: having to draw just to say "the cheeks!!" would kill conversation. Captions (80 characters) cover the cases where a drawing needs words.

**Changes:** removed the text post type (text is now reply-only in the data types), turned the three sample text posts into captioned drawings, and replaced the "Plaza Chatter" plaza with "Doodle Q&A", where you draw your question.

**Trade-off:** a quick question like "how do you draw hands?" now needs a drawing, which is a little more effort. That fits the spirit of the app.

## 25. Guest profiles on a shared backend (accounts later)

**Problem:** posts, replies, and yeahs only lived in each person's browser, so nobody could see anyone else's activity. That's not really a social app, and it rules out testing with other people. Full accounts (email, passwords, recovery) are a lot of work for a two-week build.

**Options:** (a) keep everything in the browser and add replies and yeahs there; (b) full accounts with Supabase Auth; (c) guest profiles: Supabase anonymous sign-in plus a shared database.

**Decision:** (c). Browsing is open to everyone. When someone tries to post, reply, or Yeah!, they're asked to make a quick profile on the sign-in page: draw a 120×120 profile picture, pick a name and handle. That creates an anonymous Supabase identity, and everything they do is shared with everyone. The page says clearly that it's a temporary profile saved to this browser and that full accounts are coming soon.

**Why:** it keeps the core idea (your drawn profile picture is your identity) and real shared activity, without building email accounts yet. Later, a guest can attach an email to the same identity, so nothing is lost.

**Trade-offs:** clearing browser data or switching devices means a new profile. Open posting needs protection: row-level security, size limits on every table, CAPTCHA on guest sign-in, and reporting. See `docs/data-model.md` for the tables and access rules.
