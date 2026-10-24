# Template

`shell.html`, `dex.css` and `dex.js` are the one template every guide is built from (Emerald Imperium is the reference
build). `assemble.py` inlines them with the hack's `hack.json`, `data.json` and the sprites it uses into
`dist/<hack>.html`, and writes `dist/guides.json` and `dist/index.html`. Nothing about a hack is in the template: a
guide differs only by its data and its `cfg`. The device rules (window sizes, no Android keyboard, `<select>` shim,
lag rules, scroll restore) are the viewer contract: `.agents/skills/rom-hack-offline-dex/references/viewer-ui.md`.

## What a hack sets (`hack.json`)

`id`, `title`, `game`, `platform` (GBA / NDS / 3DS), `version` (the `dex-viewer:version` meta tag), and `cfg`:

| Key | What it does |
| --- | --- |
| `name` | The hack's name in wording. |
| `orig` | Tag for hack-original moves / abilities (`''` = none). |
| `evs` | `false` = no EV inputs or EV speeds. MGM shows only when this is on **and** some trainer Pokémon has EVs. |
| `starter` | `pick` = named starter picker (tracker bar, Trainers header, walkthrough) stored in `TK.s`; `type` = the same picker for guides whose rivals follow a type (`t.st` = Grass / Fire / Water). |
| `orbs` | Primal / Rayquaza Mega pages point at Useful NPCs. |
| `g3trainer` | Unobtainable species are tagged Trainer only. |
| `capLast` | The trainer cap box remembers the last cap set, for trainers with no cap. |
| `walkAreaNote` | Show area notes inside walkthrough encounters. |
| `trw` | Boss / trainer words, `[one, many, footer]`. |
| `credit` | Footer credit line (hook in place; no guide sets it yet). |
| `ls` | Every localStorage key. **Never change one after a guide is published**; add fields inside the existing objects instead. `capset` is unused but kept. |
| `txt` | All hack-specific wording (inserted as HTML): `obt`, `nw`, `g3`, `conf`, `tc`, `chdoc`, `mvh`, `nodc`, `mvsrc`, `mvsrcx`, `absrc`, `ns`, `walk` (Guide info text), `capl`, `capnone`, `noev`, `plm` / `plf` (player picker labels). |

## What the data switches on

A feature shows when the data has it, so a new hack needs no template change. The schema (every key, which are
optional) is `hacks/emerald-imperium/notes.md` → Data schema; `tools/schema.py` enforces the key order and raises on
an unknown key.

- Pokémon: tutor moves `p.tu`, source conflicts `p.cf` ("Sheet says ..."), Mega stone `p.stone` / `p.sloc`.
- Locations: a Starter area (`AR[i].st`, tied to the starter picker), sections per game table (`AR.es`), area maps
  (`AR.map`), tracker sub-slots (`AR.sub`), optional page order `ARO` (areas added later sit at the end of `AR` so saved
  trackers keep their slots).
- Trainers: caps `TR.caps` (hidden when empty), partners `t.pt`, shared battles `t.bt`, starter `t.st` and player `t.pl`
  variants (the player picker shows when any trainer has `pl`), EVs (MGM).
- Walkthrough: checklist steps `stop.s` (Next step and Reset checklist show only then), stop notes, cheat codes
  `WK.cheats`, game docs `WK.docs` / `WK.ko`, unplaced items `WK.np`, stop keys `stop.k`.
- Saved walkthrough state is keyed by stop key: when a hack regroups its stops, `migrateWalkState` moves saved ticks,
  open state and scroll anchors to the new positions (`tools/walk-state-check.mjs` tests it). Give every new stop a
  key that never changes; cutting a stop in two keeps the key on the first part and adds `.fN` to the others.

## Shared rules every guide follows

These came out of the consistency pass (2026-10-23/24); the extract helpers apply most of them.
- Species that are neither obtainable nor used by a trainer are left out (Megas / forms too).
- Trainers boxes are cap splits named `<Boss> Split [Cap N]`, then `Elite Four Split [Cap N]`, then `Post-game`
  (`tools/splits.py`). One cap list, mini caps included. The walkthrough's splits are the same boxes, and the
  Trainers page lists them in walkthrough order (`extractlib.trainers_follow_walk`; `tools/tabs_check.py` checks it).
- Items: one box set, sub-headings and row style for every guide (`tools/itemstd.py`, rules in its docstring).
- A Starter area on Locations, listed first.

## Page design

### Damage calculator

`#/calc` is implemented by `calc.js` and `calc.css`; `assemble.py` includes these and `calc/engine.js` only with
`cfg.calc`. The resolved profile supplies the level and stage bounds, status choices, nature/ability/item switches,
field entries, multi-hit ranges and variable-power moves. The page calls `DMG.init`, `DMG.stats` and `DMG.calc`;
damage rolls and KO probabilities come from the adapter, not page-side mechanics. The committed unit-B engine is a
temporary, explicitly marked stub and must be replaced by unit A before release.
When the adapter returns `per`, the expander shows each hit's rolls; aggregate HP subtraction and best-move ranking
sum those per-hit ranges, while percentages and KO text use the adapter's already aggregated values.

Mine (party, boxes, custom sets), selection, unsaved/saved edits and per-slot overrides are one object in `cfg.ls.dmg`.
Internal set aliases follow trainer data (`l`, `na`, `a`, `i`, `m`); the engine boundary converts them to its
`lv`, `nat`, `ab`, `it`, `st`, six-element `stg` contract. Caps stay in the existing `TCAP` store. Sheets and expanders
are transient; pickers use the shared keyboard/number pad and the viewer's normal select shim.

Import exists only with `profile.save`: a file input calls `READERS[profile.save](bytes, D)` and maps game IDs through
`D.GID` (bypassed with `ids: "ours"`). Success atomically replaces the import and clears imported edits/slot overrides;
errors retain the old import. `calc/readers/test.js` and `tools/scenarios/fixtures/calc/` supply synthetic JSON saves.
`node tools/scenarios/calc-smoke.mjs dist/emerald-imperium.html` patches only a temporary built page to select that reader.

`dex.js` owns guarded rail, trainer-card and stat-calculator entry hooks and delegates the calc's three scroll stops.
Below 480px, one moveset is shown; from 480px, equal columns show both and keep Field below the viewport-height block.
The Mine grid scrolls internally; the foe list replaces its strip only at 222px of measured availability. Both strips
share 28px cells with the level safely inside the selection border. Without `cfg.calc`, only removal of the Calc tab
changes the other pages' DOM, and `#/calc` redirects to the Pokémon list.

Built with the user over many mockup rounds; keep to it and don't retry what's listed as rejected.

**Collapsible pages** (walkthrough, Locations, Trainers, Items; `COLLAPSIBLE PAGES` in dex.js, "Collapsible pages" in
dex.css):
1. Levels: box (closed by default) → place (`details.stopd`, sticky under the search bar) → section
   (`details.sec`, sticky under the place). Every level's open state is saved in the page's `LS` object.
2. Tapping a header never scrolls (`flip()`, `hold()`); browser scroll anchoring is off while it settles.
3. Expand all / Collapse all bars (`segBar`): one at the page top for the boxes, one in a box with 2+ sub-levels. They
   only open or close their own level and never move the bar.
4. Collapse bars at the bottom of a block only when it is taller than the window (`bars()`); a pinned block collapses
   in place and flashes (inset accent ring). Rechecked on toggles, resizes, content-visibility renders and any change
   of the page size (a ResizeObserver on `#app`: the viewer's text zoom fires no resize but changes the height).
   Size changes clear cached bar heights and coalesce into one animation-frame check; no polling or extra elements.
5. Jump buttons in the rail (`.rjump`): up / down between boxes, landing at `T()` under the search bar.
6. Stacked sticky headers: paint `--bg` above the lower header so no gap shows on the phone, and pin only what's asked.
7. The level row ("Level cap 15 · yours 17") is closed by default.
8. Items: boxes don't pin, their sub-headings do. A box with one sub-heading named like itself shows the name twice
   (box header + sub-heading) on purpose: the user wants it that way so the box header never becomes sticky.

**Walkthrough:** Guide info → Starter → Next step → Expand / Collapse all, nothing else above the splits. Inside a stop:
note, then Checklist / Encounters / Items / Trainers sections. Stops with trainers show `n/N | cap` (the split's cap
when the stop has none). Empty stops are grey signs (`.wsign`), not boxes. Guide info holds tracker export / import /
reset, the game docs and the intro text.

**Trainers:** a Show switch per box (Places / Trainers / Teams, read from the page, not stored) pinned under the box
header; each place header has a `n/N | cap` button that fills first (part → all open, all → all closed) and never
toggles the place. Toggling keeps the trainer you're reading in place (anchor = the first row edge under the pinned
headers). Trainer cards: below 500 px a strip of up to six sprites above one Pokémon; from 500 px all Pokémon as
blocks, three across at most. An opened card starts at its team. One speed per Pokémon (with EVs, or without under MGM).

**Search:** the full-window search on every device (the in-page keyboard in the viewer or `dvkb`, the device keyboard
elsewhere). The current page's section first, then Pokémon, Filters, Locations, Trainers, Items, Walkthrough. Each
result has action buttons (Dex, Trainers, Places, Walk, Filter...) that jump or search; Enter searches the current page.
The search stays set across pages until its × or a tap on the current rail tab. Jumps use `land()`, which lays out
content-visibility-skipped ancestors first.

**Rejected** (don't bring back): animated collapses (slide, smooth scroll then close, synced fold); pinned trainer
rows or team previews; a ☰ rail; BST anywhere; IVs on cards; the "Changes from vanilla" card and Changed filter;
evo/breed tags; the trials / mini caps switch; per-hack item boxes; separate Expand / Collapse bars per island and place
on Trainers.
