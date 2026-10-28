# Calc: both teams in the first frame (spec)

Decided 2026-10-27 / 28 in the calc-team decide session (final choices 2026-10-28), from the mockup `plans/calc-team-mockup/` (the real EI build
patched: `build.py` writes `.tmp/calc-team/calc-team.html`, Thor frame + panel; phone preview `calc-team.html`). The
mockup's `patch.css` / `patch.js` are the reference for every size below; the user approved it on the phone preview
and will report anything that is bad on the Thor. Branch `worktree-damage-calc`. Delete this plan and the mockup when
built (lasting decisions go to `template/README.md` → Damage calculator).

## The goal
At every viewer size the first frame shows, at once: **my team, the foe's team, both cards, all four moves (wide: both
lists) and the fight bar**. At 260 × 316 the first frame is the page scrolled to the trainer bar (as now: `openMatch`
scrolls to `.fbar`); the rail's jump arrows stop there (Jump arrows, below).

## Layout

### Narrow (< 480): facing columns
Top to bottom (the page scrolls; the box stays above, as now):
1. **Box** (`.dside.mg`, unchanged: tools + six-across grid, internal scroll, max-height 136).
2. **Trainer bar** (`.fbar`: ‹ name ›, Cap box when relative) full width, **no panel border** (the `.dside`
   around it is background-less, padding 0), 22 px high (nav / name button 22 px).
3. **Fight bar** full width (S / D, weather, terrain, ↺), 22 px high, **above the teams** (final).
4. **Teams, side by side**: left = my team (3 × 2 grid), right = the foe's team (3 × 2, the existing foe strip moved
   out of the trainer panel). Each in its own `.dside` panel, padding 2 px, gap 2 px. Cells: 24 px high, sprite
   22 px, level as a small badge on the cell's bottom-right corner (8 px, translucent panel2 background). Pokémon are
   not made smaller than this (user).
5. **Cards side by side** (mine left, foe right), the nameless card below.
6. **Moves** (the attacker's four, full width), each closed row 33 px: line 1 16 px (endpoint buttons 15 px), line 2
   13 px (its buttons / turn chip 13 px), `.mm` padding 1 px, row gap 2 px. Open rows unchanged.
7. Field (unchanged).
`.fit` gap 2 px. Budget at 260 × 316 (measured in the mockup, trainer bar top to the fourth move's bottom): plain cards 294 px,
the busiest card (Mega, Toxic turn, residual, Sitrus chip: three card lines) 313 px.

**The nameless card** (narrow only; the highlighted team cell says who is in). A fixed shape, the parts never move;
extra info only adds line 3:
- **Line 1:** ↺ (full HP), HP box (26 px wide: just over three digits), `/max`, then ✎ (Edit, 20 × 18, icon only) at
  the right. HP bar under it (full width).
- **Line 2:** Mega (M) and the ability boxes (monControls, Broken, Sword / Shield, Download, the Intimidate toggle) at
  the left, hugging the left edge when there's no M; Aura and the Dig/Fly/... battle-state tag also go here. The
  Speed number at the right, **no "Spe" label** (faster = accent, as now; keep the tooltip / aria "Speed").
- **Line 3, only when any exist:** the berry chip at the left; T + the Toxic turn box (17 × 16 px) and then the
  residual amount at the right (residual furthest right, T centred against its box).
- **Not shown:** the Intimidated mark (`Int −1`) on the HP line (the engine still applies it).
- **Lv:** shown on the team cell; the Lv box is on the card only while Edit is open (it joins line 1 first).
- **Name:** hidden; shown as line 0 when the selected Pokémon is not in the team row (picked from the box / Find) —
  for the foe the strip always holds it, so the foe card never shows the name.
  **At most three lines, always** (the user, 2026-10-28; the HP bar under line 1 isn't a line). Built (unit 2):
  - Name not shown: line 2 = M, ability boxes, Aura, state tag, Speed (right); line 3 = berry (left), T + Toxic box,
    residual (right).
  - Name shown (line 0): M, the ability boxes and Speed move up to line 0 (Speed at its right end); the name truncates
    (ellipsis) as far as needed, even to one letter. There is no line 2: line 0, line 1 (HP), line 3.
  - Aura and the state tag sit on the top line (line 0 or line 2) while it has room; when it doesn't, they move to line
    3, centred between the berry chip and T / residual (state first, then Aura, then both). If that is still more than
    three lines the card goes tight (1 px gaps, slimmer chips, Aura shown as "A", tooltip unchanged). `fitCards()`
    measures each narrow card after render, on resize and when its size changes (text zoom fires no resize) and keeps
    the first arrangement that fits.
  - Line 0 is not shown while Edit is open (the editor names the Pokémon).
  - Measured at 260 × 316 and 260 × 394, normal and dvkb: the busiest case (name + M + two ability boxes + Aura + state
    + berry + Toxic + residual) is 3 lines (62 px), fourth move bottom 314 at 316. A plain card with the name is 2 lines
    (44 px). At text zoom 1.3 the busiest name-line card takes a fourth line (nothing clips, page 260 wide); Aura
    never shows on my card in practice (it's the foe's totem aura).
- **Edit open at narrow:** the open card spans both columns (grid rows `cm cm` / `cf cf`): the other card moves under
  it, full width too. The editor itself is unchanged (it already shows the name).
- Tapping the card still selects the attacker (`data-a="sel"` on `.cc`).

### Wide (≥ 480): two columns, one window
Grid areas: `box tside` (the only `1fr` row), `fight tside`, `cm cf`, `mv mf`: the cards and both move lists are
pinned to the bottom, the left column is the box panel then the fight bar, the right column is the trainer panel.
- **My team row is part of the box panel**, under the grid (final), split off by a
  1 px line (`border-top: var(--line)`), not a panel of its own. Cells 28 px high, sprite 24 px, level badge on the
  corner. The box grid scrolls in what is left (≈ 3 rows at 392).
- **Fight bar** under the box panel in the left column (it's ~214 px wide, the same bar as at 260). Not full width at
  the bottom: that costs the 25 px the preview needs at 480 × 392.
- **No foe strip at wide**: the trainer preview is the foe's team (tap a row = pick that foe, as now).
- **Trainer preview: two-line rows, all six always visible, no scrolling**: rows 25 px (sprite 20, line 1 11.5 px,
  line 2 9.5 px, line-height 1.1, padding 0 4px, gap 1 px), trainer bar 24 px. `TEAMNEED` / the 400 px rule go.
  Measured: all six visible at 480 × 392, 537 × 424 and 832 × 424.
- **Cards** keep today's two-line cards with names (~48 px); inputs 20 px, name line 18 px.
- **Move rows** the same 33 px as narrow (lines 16 + 13 px).
- **Line 3 parts aligned** (all sizes): the Toxic turn box, the residual and the berry chip share one inner box
  (border-box, 18 px high, line-height 16 px, 11 px text, centred), so their digits sit on one line (the turn box sat
  higher).

## My team row
- **Storage:** `team: [{src, pid}]` (max 6, dense, in order) in the existing `cfg.ls.dmg` object; no new key. Resolve
  by `pid` (imported: party then boxes; custom: `ST.custom`), so re-imports, box moves and deleted customs can't point
  at the wrong Pokémon. An entry that doesn't resolve is dropped on render (a deleted custom set leaves the team).
- **No automatic fill** (the user, 2026-10-28, replacing "first import fills an empty team"): imports never touch the
  team; it is built only by drag and drop.
- **Cells:** sprite + level badge; the selected one `.on` (accent); empty slots dashed. Box cells already in the team
  get a 5 px accent dot (top right).
- **Tap a team cell** = send it in (same as tapping it in the box: `ST.mine`, a switch: scratch state applies, HP
  kept). Plain tap on a box cell still selects, as now.
- **Drag and drop** (pointer events; HTML5 drag doesn't fire on touch):
  - touch / pen: press and hold 250 ms without moving > 8 px starts the drag; moving first is a scroll (no drag).
    Mouse: moving 5 px starts it.
  - the lifted cell dims (opacity .35); a floating copy (scale 1.2, above the finger) follows; the slot under it gets
    an accent outline.
  - box → empty slot: append. box → filled slot: **replace** that member. Already in the team: swap to that slot.
  - team → another slot: swap (onto an empty slot: move to the end). team → anywhere outside the row: remove (the
    copy shows a red × while outside).
  - while dragging: `touchmove` prevented (no scroll, no pointercancel), long-press context menu / callout / text
    selection suppressed on the cells; the click right after a drop is swallowed (400 ms); near the top / bottom
    40 px the page auto-scrolls (narrow).
  - Mega: the M toggle on the card, never a second team entry.
- **HP bar and fainted** (added 2026-10-28): every team cell (my team row; the foe strip at narrow; the foe's trainer
  preview rows at wide) shows a thin HP bar along its bottom (2 px, the card's HP bar colours: green / yellow / red by
  percent) from that Pokémon's current fight HP. At 0 HP the sprite turns grey (`filter: grayscale(1)`, nothing
  else: no icon, no dimming of the cell). Both follow HP changes live; ↺ Reset fight and a trainer change restore full
  HP, so the bars refill and the colour comes back. Fits inside the existing cells (24 px narrow, 28 px wide, 25 px
  preview rows): the first-frame budget at 260 × 316 must hold.
- **dvkb:** nothing to type in the row; check that the layout holds with the keyboard mode on.

## Edge cases
- No trainer picked: foe strip area shows the trainer bar's "Pick a trainer"; my side as usual.
- Trainer with < 6: the foe strip keeps 6 cells (empty ones hidden, as now).
- No imported save (custom sets only): the box lists customs; they drag the same way (`src: 'custom'`).
- A banner (`.ban`) goes above everything, full width; the first-frame rule is checked without a banner.
- Text zoom (A+): the card may wrap more; never clip or widen the page.
- Doubles / Trick Room / Speed colour: unchanged (the number keeps its colour).

## Jump arrows (the rail's ⤒ / ⤓, `CALC.stops()`)
They lock to the new frame. Narrow: **top** (0, the box), **first frame** (trainer bar top − 2 px: trainer bar, fight
bar, teams, cards, moves), **the fourth move's bottom** only when an open row / editor pushes it below the window
(bottom − innerHeight + 3, kept only if it is ≥ 24 px past the first frame), **Field** (`details.dfield` top − 2).
Wide: **top** (the one-window calc) and **Field**. Every stop is clamped to the page's scroll range; stops closer than
24 px merge. Measured in the mockup: 260 × 316 → 0, 137 (+ Field when it's open: 386); wide → 0, Field. `openMatch`
still lands on the first frame.

## Decided (2026-10-28)
Facing columns, nameless cards at narrow; fight bar above the teams below 480 and under the box from 480; my team row
in the box panel under the grid from 480; trainer preview two-line rows; wide cards keep their names; drop on a filled
slot replaces it; hold 250 ms. The user will report anything bad on the Thor. Added 2026-10-28 (unit 2): an HP bar and
the fainted grey on team cells (My team → HP bar and fainted).

## Action log (2026-10-28, built)
The action log overlay (every action: hits, misses, turn end, berry, entry, Area info) sits at the top and goes 3 s
after the last action; a new action restarts the 3 s, touching / scrolling a long one holds it, × still closes it.

## Auto Doubles (the last manual fight setting)
Tag / multi / double battles switch the fight bar to **Doubles** automatically, like weather and terrain already do.
- **Data** (each guide's `data.json`, already there; no new extraction): a trainer is a doubles fight when one of its
  `tags` matches `^(True )?Double` (EI "Double Battle" / "True Double Battle", Hardlove "Double", "Double with …",
  "Double Battle with …", "Double, Optional"), `^2on2 Double` (Hardlove), `^Multi Battle` (Photonic) or
  `^Triple Battle` (Eternal X: the calc has no triples; Doubles is the nearest, spread moves ×0.75 as in triples), **or**
  it has partners (`pt`: multi battles with Hau / Calem / Serena). Not doubles: Hardlove "Back2Back …" (one after
  another, singles) and Eternal X "Rotation Battle" (one active Pokémon at a time). Counts (2026-10-28): EI 14,
  Hardlove 92, Photonic 60, Eternal X 62 (50 tagged + 12 partner-only). Where to put it: `tools/trainer_fields.py`
  writes it as field evidence (`gameType: 'Doubles'`, source = the tag / "partner") so it rides the existing Auto
  layer; the per-hack patterns are one shared list there (a new hack adds its wording).
- **Page:** S / D follows the existing automatic / manual lifecycle: the trainer's evidence makes D automatic
  (dashed, pressed, A mark, the tooltip names the tag); tapping S or D makes it manual for this fight; Auto, ↺ Reset
  fight and a trainer change clear the manual choice. A doubles fight also turns on the Doubles-only Field entries as
  now. The Area line names the source like weather ("Double Battle").
- **Checks:** per guide, the count above; a doubles trainer opens in D (auto), a singles one in S; manual S survives a
  move / HP change and is cleared by Reset fight and by the next trainer; Back2Back / Rotation stay S.

## Build units (in order; one template session at a time)
Status 2026-10-28: unit 1 done (`a0f978a`), unit 2 done (`3007d4b`..this commit; `CALC.team()`, `CALC.fit()` for checks), unit 4a done (`eba379c`, `ac9a9e4`), the saves branch merged (`506c25c`).
Checks during a unit: only what it changed, fast path `uv run python -I tools/gate.py scenarios <hacks> --only
calc-a,calc-b --jobs 4` (built dist, no rebuild; `python assemble.py` first after a template change). The full `gate.py
check --template --jobs 4` runs once, in unit 3. Engine / oracle checks: `plans/calc-open.md` → Checks (a fresh worktree
needs `npm ci --prefix tools/calc` and `.tmp/hzla*` copied from the calc worktree).
1. **Done.** Layout + nameless card (`a0f978a`).
2. **Team row + drag and drop + HP bar / fainted** (template; Opus medium): `ST.team` with pid refs, render, tap = send
   in, the pointer-event drag (from the mockup's `patch.js`), box dots (no automatic fill from an import: My team row), drop of unresolved entries; the team cells' HP bar and fainted grey
   (My team → HP bar and fainted) on both teams at every size. Replace unit 1's stand-in `teamMembers()` (party or
   customs) and keep the `.offteam` name fallback working off `ST.team`. Commit.
3. **Checks** (Haiku medium; after units 2 and 4b): update the checks that test the old layout (unit 1's list: retest
   R1 HP / frame, layout 18c / 19 / 20 / 20b / 20c, smoke cell size, zmove z toggle / totem aura, auto crowded HP,
   controls 2, persist 26 dvkb, import 12 dvkb, bridge B2 dvkb: the last four tap the Lv box, which is only on the
   narrow card while Edit is open; the fight bar's buttons (↺ included) are 22 px: the user accepted that 2026-10-28,
   so the tap rule takes 22 px for the fight bar),
   `calc-state` one-window; add `tools/scenarios/calc-team.mjs`: first-frame rule at the five sizes × normal / dvkb
   (my row, the foe's team (narrow: strip; wide: all six preview rows unclipped), both cards, four moves (wide:
   eight), fight bar inside the viewport, plain and busy card), open move rows / an open editor never overlap Field
   (both sides, 480 × 392 and 560 × 424), drag via `Input.dispatchTouchEvent` (box → empty, box → filled, swap, drag
   out, swipe doesn't drag, tap sends in), persistence across reload, re-import keeps the team by pid and never fills an empty one, deleted custom
   leaves it, HP bar / grey at 0 HP and back after Reset fight and a trainer change, jump-arrow stops at 260 × 316 /
   260 × 394 / wide with Field closed and open; the Auto Doubles checks (unit 4). Add `#/calc` to
   `tools/domcompare.mjs`'s routes. Then `plans/calc-open.md` → Checks (full calc scenario set with `--jobs 4`,
   `assemble.py`, every calc guide), domcompare against `calc-pre-team` on `#/calc`.
4. **Auto Doubles.** **4a data: done** (`eba379c`, `ac9a9e4`): `tools/trainer_fields.py` `DOUBLES_TAGS` / partners
   write `{scope: 'trainer-tag' | 'trainer-partner', text, effects: [{kind: 'gameType', value: 'Doubles', source}],
   review: false}` in `trainer.field`; counts asserted in `tools/trainer_fields_check.py`. **4b page** (template; Opus
   medium, after unit 2): the S / D auto layer in `calc.js`: read the record from `areaRecords()` (`areaField()`
   ignores `kind: 'gameType'`, so add it separately); the Area line names `effect.source` / the record `text` ("Double
   Battle", "partner"), not the value "Doubles"; the checks above in `tools/scenarios/calc-field.mjs` (or its own
   `calc-doubles.mjs`); hzla compares unchanged. Commit.
5. **Docs + preview** (Opus main chat): `template/README.md` → Damage calculator (replace "Retest layout" sizes, the
   preview rule, the team row, HP bar / fainted, Auto Doubles), the save ID tables rule in CLAUDE.md → Making a new
   guide and the skill (`plans/calc-open.md` → Save readers: "every new guide's extract writes its ID tables"), every
   calc guide in the Thor frame on the phone preview, delete this plan and `plans/calc-team-mockup/`, PROGRESS /
   calc-open items 1-2 done.
