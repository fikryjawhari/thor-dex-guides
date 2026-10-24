# Dex Viewer UI contract

The device contract every guide meets; `template/` implements all of it (names in `code` are the template's). Page design decisions: `template/README.md`.

## The window

The guide loads at `https://<id>.appassets.androidplatform.net/guides/<id>/index.html` (each guide has its own origin) inside a WebView in a floating overlay window. The window is never focusable, so:

- No Android keyboard: `<input>` and `<textarea>` can't be typed into.
- `<select>` works only because the app injects an in-page option list (`page_shim.js`). Date, time and colour pickers are blocked.
- `alert` / `confirm` work as in-window panels. `prompt` shows its default value read-only with a Copy button and answers with that default, so it's fine for "copy this code" and useless for "paste a code".
- No network. Everything inline.
- 1 dp = 1 CSS px. Text zoom (A-/A+) scales text, not the viewport. The title bar takes 44 dp.

| Case | Guide viewport (CSS px) |
| --- | --- |
| Minimum window | **260 x 316** (must be usable) |
| User's everyday bottom-screen size | 260 x 350 |
| Default first open, bottom screen | 480 x 392 |
| Maximised, bottom screen | 537 x 424 |
| Maximised, top screen | 832 x 424 |

## Theme

- Dark by default; light theme under `@media (prefers-color-scheme: light)` (the viewer's "Dark guide" off asks for it). Colours as tokens on `:root` (`--bg --panel --panel2 --line --fg --mut --acc --link --rail --railon --key`), redefined for light.
- **Always** `<meta name="color-scheme" content="dark light">`. Without it Chromium auto-darkens the page and inverts small sprites.

## Layout

- **Left icon rail** `#rail`: 44 px wide, fixed, full height, scrolls if the window is short, no labels and no expand button (the user decided against a ☰). Order: Pokémon (Poké Ball), Locations (map pin), Trainers (cap), Items (bag), Walkthrough (book), Calc (calculator). Inline SVG icons (stroke `currentColor`). Active item: `--acc` colour, `--railon` background, 3 px inset bar on the left. Ids `t-p t-l t-t t-i t-w t-c`; `setTab()` sets `.on`.
- Sticky header with the search box beside the rail; filter chips and sort/availability selects below it (sort and availability share one row).
- One column below 600 px. Touch targets at least 44 px tall (rows, tabs, buttons); 40 px for inline controls.
- **Nothing may overflow 260 px.** Lessons from the reference:
  - Tags and type badges are `inline-block` with `white-space:nowrap` (an inline tag glued to a long name made the page 271 px wide; the WebView then zoomed to 0.96 and stayed zoomed after maximising).
  - List rows put the types under the name when narrow, so badges never cover names.
  - Encounter tables (`table.enc`) and "Where to find" (`table.wh`) restack into a grid below 420 px.
  - The Pokémon page hero shrinks; selects can shrink (`min-width:0`).
  - Trainer cards: below 500 px a strip of up to six sprite buttons above one Pokémon; from 500 px every Pokémon as a block, three across at most.
- Sprites 24 px in closed trainer rows, 30 px in trainer cards, 32 px in walkthrough minis, 40 px in list rows, 112 px on the Pokémon page. `image-rendering: pixelated`.

## Viewer detection

```js
const INV=/\.appassets\.androidplatform\.net$/.test(location.hostname)||(()=>{try{return localStorage.getItem('dvkb')==='1'}catch(e){return false}})();
```

Inside the viewer (`INV`) the page swaps in the keyboard controls below. Outside it, number boxes stay real `<input>`s and the full-window search uses a real input with the device's keyboard. `localStorage.dvkb = '1'` forces viewer mode in any browser for testing.

## In-page keyboard (`KB`)

One keyboard at a time, `position:fixed` to the bottom, over the rail, max 560 px wide and centred, z-index 20. Built from `<button>`s with `touch-action: manipulation`, so taps never focus anything.

- **Search box** (`searchDisp`): the `<input id="q">` is replaced by a button with `value` and `placeholder` properties, so the rest of the code uses it like an input. A × inside clears it. Tapping it opens the full-window search.
- **Letters keyboard** rows: `1234567890`, `QWERTYUIOP`, `ASDFGHJKL:`, `ZXCVBNM.'-`, then **Clear · Space · ⌫ · Done**, the first three equal and Done taking the rest (the viewer's resize handle covers the bottom-right corner, and ⌫ is pressed far more than Done). Hold ⌫ to repeat. Keys 42 px when there's room, never under 30 (34 at the minimum window). Filters apply live as you type.
- **Name matching** ignores punctuation, spaces, accents and ♀/♂: `norm()`. "mrmime", "typenull", "flabebe" all match.
- **Encounter "Other..."** (`otherKb`): the same keyboard with a strip above the keys showing the area name as placeholder, the query, and matching Pokémon to tap (the user called this "really smart").
- **Number boxes** (`numBox`, `setNum`, `clampNum`): outside the viewer an `<input type=number>`; inside, a button showing the value, with − / + beside it where stepping helps (trainer "Your highest level", calc Level) and value-only in tight tables (calc IV/EV). Tapping the value opens the pad: a line naming the box and range, `1-0`, then `Clear − + ⌫ Done` (Done double width). Done clamps; EVs snap to 4. `setNum` fires `input` and `change`, so existing handlers just work.
- While the keyboard is open, `body.kbopen`: the filter row hides and `main` gets bottom padding of the keyboard height (`--kbh`). Navigation closes the keyboard. Redraw on resize.

## Full-window search (`SR`), every device

The search box is always a button (`searchDisp`). Tapping it covers the whole guide viewport (rail included, z-index 19, under the keyboard) with:

- A 44 px strip: ‹ back, the query, × clear, ⌄ hide/show keyboard (viewer only; outside it the strip holds a real input, Enter = Done, Esc = back).
- Scrolling results.
- The keyboard in `full` mode: 4 rows (QWERTY / ASDF / `123` Z-M ⌫ / Space + Done); `123` swaps the top row for digits; keys up to 46 px.

**Result order (the user's rule):** the current page's section first, in full (up to 100, then "Show all"), then the others in the order Pokémon, Filters, Locations, Trainers, Items, Walkthrough, 8 each with "Show all N". Detail pages count as their section (Pokémon, move, ability → Pokémon; trainer → Trainers; Calc → Pokémon). Filters are types, abilities, moves and locations that match. Trainers, items and places match by name only (a Pokémon's Places button covers where it lives).

**Results with actions:** each result has buttons that jump to it or search a page for its full name (Pokémon: Dex · Trainers · Places · Walk; place: Places · Walk; trainer: Trainers / Walk · Full page; item: Items · Walk · Trainers; move / ability / type: Filter · page). Tapping the row does the first. **Enter / Done** (or the first row) searches the current page for the raw text. The search stays set from page to page until its × or a tap on the current rail tab. Jumps (`land()`) lay out content-visibility-skipped ancestors so the target ends under the pinned headers. The last 6 picks show as Recent when the query is empty (`<prefix>recent`).

**Typing on a detail page** (Pokémon, move, ability, trainer) goes to the section's list as a new history entry (`UP` map, `searchNav` flag keeps the keyboard open for that one navigation); Back returns to the page.

## Performance (the Thor is slow at re-rendering big pages)

- **No base64 in rendered HTML.** `sprUrl(id)` turns each sprite's data URI into a `blob:` URL on first use (cached in `SPRU`), and sprites are CSS backgrounds on a `<div class="spr">`, not `<img>`. Inline data URIs made every list render parse megabytes and took seconds.
- `content-visibility:auto` with `contain-intrinsic-size:auto <estimate>` on list rows and on the bodies of open splits, stops and trainer groups.
- Build heavy content lazily: boss teams inside walkthrough stops are built on first open; opened ones stay open across re-renders (memory only).
- Re-render with `rerender()`: save the anchor (`keepAnchor`) and measured block heights (`cvSizes`), render, put the heights back (`cvApply`), restore the anchor (`toAnchor`).
- The viewer's WebView has accessibility switched off on the app side; nothing to do in the page.

## Scroll and route restore

`content-visibility` makes raw `scrollY` restores land in the wrong place, so everything restores by element:

- `keepAnchor()` hit-tests down the window with `elementFromPoint` for the first element matching `ANCH` and saves `{sel, off, y}`. Don't read geometry of elements inside skipped blocks (tracked via `contentvisibilityautostatechange` into `SKIP`); that forces layout and cost 400 to 700 ms.
- `toAnchor()` scrolls to it, then corrects with a ResizeObserver for 400 ms, stopped by a touch.
- `history.scrollRestoration='manual'`; per-history-entry snapshots (`SNAP`, keyed by `history.state.dk`) for Back/Forward.
- `posSave()` writes `{h: location.hash, a: keepAnchor()}` to `<prefix>pos` on scroll (debounced 300 ms) and on `visibilitychange`.
- **`window.dexViewer.restoreScroll(y)`**: the app calls this after reloading the guide (screen swap, reboot) instead of `scrollTo`. Restore from `<prefix>pos` when its hash matches, else `scrollTo(0,y)`.
- **Reopen on the last route:** the app always loads the bare file, so when there's no hash, `history.replaceState` to the saved hash before the first render.
- Persist filters, sort, open sections, tracker and calc inputs in localStorage under the hack's prefix.

## Testing

Use existing CDP / headless Chrome checks or available collaborative browser tools. Do not add a browser dependency just for this skill:

1. Load the file at 260 x 316, 260 x 350, 480 x 392, 537 x 424 and 832 x 424, `deviceScaleFactor` 2.3, mobile.
2. Run every route twice: normal, and with `localStorage.dvkb='1'` (viewer mode). Collect console errors; there must be none.
3. At 260 wide, check `document.documentElement.scrollWidth === 260` on every list route, every 3rd Pokémon page, every trainer page, and with every split and stop open.
4. In viewer mode: open search, type a name with the keyboard buttons, check the result order on a Pokémon page and a trainer page, pick a result, Done, Back; open a number pad and an "Other..." strip. Screenshot the minimum size and look at it.
5. Check the light theme once (`colorScheme: 'light'`).

On the Thor follow `PROGRESS.md` → Testing on the Thor and the sibling app docs as needed. Verify adb / CDP availability and authorisation before replacing an installed guide. Screenshot both screens and time a re-sort and opening the walkthrough (historical targets: about 0.25 s and under 0.7 s).
