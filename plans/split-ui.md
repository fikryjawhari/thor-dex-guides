# Split UI: collapsible pages (walkthrough done, other pages built, mockup round 2)

Decided with the user on 2026-10-19 over eight mockup rounds, then built into the template for the walkthrough page
(`#/walk`). This file is the reference for bringing the same patterns to Locations, Trainers and Items (and anything
else built from `details.split`). Mockup (EI and HG, real content, viewer sizes, collapse-style switch):
https://claude.ai/artifact/Kp64pS46UwPRSsyWVao1Zs. The final mockup choice is "Sticky header".

## The patterns (apply these everywhere)

1. **Expand all / Collapse all bars.** A two-button bar (`.seg`): one at the top of the page for the top-level blocks
   (splits), and one as the first thing inside each split for its stops. They only open or close their own level.
   Everything below keeps its own saved state: collapsing all splits and expanding them again shows each stop and
   section exactly as left. Pressing a bar never scrolls: the bar stays where it is (`noAnchor()`, then correct by
   the bar's own movement). Sized small (28 px top, 26 px in a split; 12 px text); the user said the first version
   (34 px) was too large.
2. **Every level saved and restored** in the page's own localStorage object (the walkthrough uses `LS.walk`: `o`
   splits open, `x` stops closed, `s` sections, `c` ticks). Defaults: splits closed, stops open, sections open,
   checklist closed. Never change a published `cfg.ls` key; add fields inside the existing object instead.
3. **Jump buttons in the rail.** Two buttons (`.rjump`, arrow-to-line icons) in the empty part of the left rail under
   the section icons, shown only on pages that have splits. Up: to the top of the split you're in, or the previous
   split if this split's header already sits at the top with the gap above it. Down: the next split to that same spot
   (so up and down undo each other). The header flashes where you land. Sizes: about 26 px each at 316 tall, 44 px
   from about 350 tall (they fill the rail's spare height, `max-height` 89 px). The user picked the rail over floating
   buttons ("definitely in the rail, great idea").
4. **Sticky headers.** An open stop's header pins under the search bar while you scroll through it, and an open
   section's header pins under its stop's header (each stop carries its header height as `--sh`; the search bar's
   height is `--hh` on `<html>`). They slide off when their block ends. Splits don't stick (too much height at 316).
   The stop's grey left rail is drawn as a `::before` that ends 12 px early, or its last pixels peek out under the
   pinned yellow header as it slides off (the user spotted this).
5. **Tapping a header never scrolls.** Summary clicks are handled by the page (`flip()`): the header stays at the same
   pixel, the bottom bars are settled in the same frame, browser scroll anchoring is off for the moment, and the
   header is held in place for ~450 ms (`hold()`) while blocks above that `content-visibility` skipped render at their
   real height. Any press, wheel or key ends the hold. (Without this the header drifted half off the top, and the
   stop's collapse bar popped in a frame late, which looked like jitter.)
6. **Collapse from the bottom.** A collapse bar at the end of each split, stop and section, shown only when that block
   (header + content + the bar itself) is taller than the window under the search bar, so its header can't be reached
   without scrolling. Re-checked on every toggle and resize, so bars come and go with the window size (agreed).
   Looks: split bar = boxed button "Collapse <split>"; stop bar = full width, dashed top border, grey "Collapse
   <stop>"; section bar = small, right-aligned, yellow, section name only (so it reads apart from the stop bar under
   it). With sticky headers a stop or section collapses in place (its header is already at the top) and flashes;
   a split closes, its header goes to the top and flashes.
7. **The flash** is an inset 2 px accent ring that fades over 0.9 s (inset so a clipped block can't cut it).
8. **Animations rejected** (so nobody tries them again): sliding the page with a transform (blocks above re-render and
   it overshoots), a smooth scroll to the header then close (looked like a delay, and like a scroll button), a fold
   synced with the scroll (looked like it collapsed from the bottom), scroll-then-fold in sequence (still odd).
   Sticky headers solved it: nothing has to travel.

## Walkthrough specifics (built)

- **Top of the page:** Guide info → Next step (guides with checklists) → Starter (when the guide has a picker) →
  Expand / Collapse all. Nothing else above the splits.
- **Guide info** (a split, `WO.o.gi`): tracker count (caught · failed) also on its header; Export / Import / Reset all
  / Reset checklist; then "Game docs": cheat codes, the game docs (HG), the post-KO AI table and "Items with no
  walkthrough place" are all docs (closed by default, `WO.x.doc*` = 1 when open); the intro text (`TX.walk`) last.
- **Next step** (only when the guide has checklist steps): the first unticked step in walkthrough order; tapping it
  opens its split, stop and checklist and scrolls to the step. The user's idea rating: "great idea".
- **Starter picker for slot guides (EI):** lists area 0's species and sets the area 0 encounter (`TK.e[0]`), so the
  rival teams follow its type; the Littleroot tracker and the picker stay in sync. Pick guides (HG) keep `TK.s`.
- **Inside a stop:** the stop note, then sections Checklist, Encounters, Items, Trainers, each a `details.sec` opened
  from its yellow header, always wrapped even with one row. Collapsed headers show: done/total; the caught Pokémon or
  "failed"; item count plus a red MISSABLE tag; trainer count.
- **Encounters:** one box per area, each with its own tracker. With several areas in one stop, a short tag (the area
  name minus the stop name: 1F, B1F, Stevens Room) replaces the grey "Encounter" label; with one area there's no
  label. The area-name subheading is gone.
- **Item name column:** left at 38% for now. Possible later: measure the longest single word in the item column at
  the current font size, work out the share it needs at the minimum width (260), and keep that share at larger
  widths; or let the browser size each table (drop `overflow-wrap:anywhere` there), which would make columns differ
  from stop to stop. 30% breaks "Stomping"; EI needs about 37%.

## Locations, Trainers, Items (built 2026-10-19, mockup round 2)

Asked for by the user: the walkthrough patterns on the three other pages; top level closed by default, everything
inside open (except the level row); entries under a box sit on the page, not in boxes of their own; rail arrows move
between boxes. Mockup = the real build in a frame: https://claude.ai/artifact/GmXrq1ATz3jBbi6Q6N5iQH
(`tools/mockup/pages.py`, `pages-outer.html`). Round 1 had two switches; the user picked "trainer rows never stick"
(a pinned team preview looked bad, on both pages) and "item tables with no box" (the losing CSS is gone).
- **Locations** (`LGRP`, `locBox`, `locPlace`, `LS.loc`): box → place (`details.stopd`, sticky) → method
  (`details.sec`, sticky under it). The place repeats the full name ("Route 102" box → "Route 102"; "Granite Cave" →
  "Granite Cave 1F" → Grass/cave). Boxes: next-to-each-other areas whose names share their first two words (names of
  3+ words; routes never group); an area with several places of its own never joins one. One-area box: tracker above
  its places; several areas: each place is one area with its tracker inside. Same-named places merge (`adjRows` takes
  a list). Areas split into tracker slots (`AR[i].sub`, slots have `.in` and `.t`; `ARS(a)`): one place with the
  town's name, a yellow section per slot with its own tracker (`locSlots`). EI's hatch towns have one slot per egg
  (stage 7: Fire / Water / Grass egg, Lavaridge, Pacifidlog egg), and an egg saved on the town before the split moves
  to its slot.
  `#/l/<place>` opens its box and place and lands it at `T()`.
- **Trainers** (`trGroup`, `trRows`, `LS.tr` {o boxes, p places, t trainers}): box = one mini-split with its cap
  (data: EI stage 7 from the trainers' caps, Hardlove `split_ui.py` from the sheet's headings) → place (white, sticky,
  collapsible) → trainer row (`details.trd`: name, tags, team preview; open = the full card; not sticky). Bottom bars
  for boxes and places (the walkthrough's styles). A trainer collapses from its card's bottom line instead, on every
  card in a trainer row (Trainers page and walkthrough, both guides, always shown so all cards look the same):
  "▴ Collapse" on the left, Pokepaste (if any) on the right (`.trf`, `.trfold`); it lands the trainer's header under
  the pinned headers above it (`pinTop`). A trainer's own page has no Collapse. (The user's pick over a separate bar,
  which in the walkthrough read the same as the Trainers section's, and over showing the trainer's name in the pinned
  section header.) Box and place Expand / Collapse bars were replaced 2026-10-20 by the island Show switch
  (Places / Trainers / Teams, pinned under the island header) and a "teams n/N" button per place header; the page-top
  bar reads Open all islands / Close all (`plans/trainers-show-switch.md`).
  The user's reason for mini-splits as boxes: three collapse levels without a new collapse style.
- **Level row** (`details.capd`, both pages and the walkthrough): closed by default, "Level cap 15", or "Level cap 15 ·
  yours 17" once set (setting the cap itself clears yours); open state kept in memory (`CAPO`) so stepping the number doesn't close it, not saved.
- **Items** (`itemBox`, `LS.items` {o, x, s}): box → its name again as a white sticky heading (dashed stop bar) →
  yellow sub-headings where rows carry one (`r[4]`: EI shops; Hardlove held item kinds, Valuables). Tables `.itbl.ix`.
- Fixed in round 2: the search bar and section header heights are observed as border boxes (the bar's padding changes
  at 420 px wide without its content box changing, which left a 4 px gap under it); `#/l/<place>` from search now opens
  and lands the place (it used to jump back to the top), re-renders on that route no longer reopen it.
- Shared: `TOG[view]` (one capture `toggle` listener on #app: saving and filling), `colBind` (SHO observes place and
  section headers; sections carry `--ch`), the tap handler covers every page in `COLV`, `.seg.all` = the page's
  boxes, jump buttons on every `COLV` page.
- The walkthrough keeps its own levels (its splits are the walkthrough's); only the level row and item tables changed.
- Checked: `tools/mockup/pagecheck.mjs` (both guides, 260 × 316, also `dvkb`: no page errors, width 260, taps hold,
  stickies, bars, jumps, state after reload, place links), `walkcheck.mjs` (both guides), the egg save move. Not done:
  `domcompare` against `main`, the Thor.

## Implementation (as built, 2026-10-19)

`template/dex.js`, section **COLLAPSIBLE PAGES** (just before WALKTHROUGH TAB), holds the reusable parts:
- `hdrH()` the search bar's height while it sticks (0 when it doesn't: `@media (max-height:260px)`), `T()` = that + 8
  (the gap a header lands at). A ResizeObserver on `<header>` keeps `--hh` on `<html>` (sticky stop headers' `top`).
  `SHO` (ResizeObserver) keeps `--sh` on each `details.stopd` = its summary's height (sticky section headers' `top`
  is `--hh + --sh`); `bindWalk` observes each stop summary once.
- `flip(d,open)`: header taps. The walkthrough's click handler calls it for every `summary` in the page (it
  `preventDefault`s the native toggle). The `toggle` events still fire, and do the saving and lazy filling as before.
- `noAnchor()` / `hold(el)`: `overflow-anchor:none` on `<html>`, then for 450 ms correct the scroll so `el` stays at the
  pixel it was at; `pointerdown`, `wheel` or `keydown` ends it early (a jump-button click would otherwise be undone).
- `bars()`: every `.endbar` (rendered with `hidden`) is hidden, then shown where its `details` is open and
  `offsetHeight + bar height > innerHeight - hdrH()`. Bars whose block sits inside a skipped `content-visibility`
  block are left alone (reading them would force layout); `contentvisibilityautostatechange` re-runs `barsSoon()`
  when one renders, and so does `resize`. Bar heights are measured once per class (`BH`).
- `foldUp(d)`: a collapse bar. A stop or section whose header is pinned (top >= `hdrH()`) closes with `flip` and
  flashes; a split closes, scrolls its header to `T()` and flashes.
- `segAll(bar,list)`: Expand / Collapse all (`segBar(cls)` makes the bar); the pressed bar is held still.
- Jump buttons: `.rjump` lives in `template/shell.html` (in the rail, `hidden`); `render()` shows it only on `#/walk`
  without a search. Targets are `details.split.jt` (add `jt` to a page's top-level splits to reuse it). `jumpState()`
  disables up at the top and down when no target is below.
- `flash(el)`: the `.flash` class (inset ring keyframes in dex.css).

Walkthrough (`WALKTHROUGH TAB`):
- `WO` (`LS.walk`) gained `s` (sections) and `o.gi` (Guide info). Doc keys: `doc<j>` and `docko` as before (saved open
  docs carry over), plus `doccheat` and `docnp`. `WO.o.doc` / `WO.o.ch` (the old Game docs / Cheat codes splits) are
  no longer read.
- `walkStop()` renders the sections directly with `walkSec(k,t,tags,body)` (t = c/e/i/t). `walkTrainers(ts)` now only
  returns the trainer rows. `trackerHTML(a,lab)` / `trackerHTML0(a,lab)` take the label (undefined = "Encounter" as on
  Locations, '' = none, else a `.atag`).
- `guideInfoHTML()` fills Guide info when it's first opened (like the old Game docs split). `starterRow()`: pick
  guides as before (`.tk-starter`); `slot` guides get `.wk-starter`, listing area 0's "Starter choice" species (all of
  its species if there are none); changing it sets `TK.e[0]` and re-renders. `nextStep()` reads the data and `WO.c`;
  tapping Next step saves its split, stop and checklist as open, re-renders, scrolls the step to just under the
  pinned stop and section headers and flashes it.
- Search results (`#/walk` with a query) show stops with their sections, without jump buttons or bars at the top.
- CSS: `dex.css` "Collapsible pages" block at the end; a stop's grey rail is `.stop::before` (ends 12 px early) for
  every `details.stopd`, docs included.

Differences from the mockup: the mockup rebuilt the real page's DOM at runtime and kept all three collapse styles.
The template builds the sections in `walkStop` and has only the sticky style; Guide info is lazy; bars skip
content-visibility-skipped blocks; the starter picker lists only the "Starter choice" species.

Checks done (headless Chrome, 260 × 316, EI and HG, normal and `dvkb`): no page errors, page width 260, the state
comes back after a reload; header taps hold the header still; stop and section bars collapse in place; the split bar
lands its header at `T()`; the jump buttons land on `T()`; Expand / Collapse all keep the bar still; Next step;
the starter picker sets area 0. `domcompare` against `main`: see PROGRESS.md.

Tools for the next page (in `tools/mockup/`, see its README): `snap.mjs` snapshots a page's DOM from a built guide,
the walkthrough mockup's sources (`gen.py`, `outer.html`, `inner.js`, `inner.css`) show how the mockup was layered
over that snapshot, and `walkcheck.mjs` is the behaviour test above (adapt it per page).
