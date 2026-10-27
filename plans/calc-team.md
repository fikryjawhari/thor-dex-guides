# Calc: both teams in the first frame (spec)

Decided 2026-10-27 in the calc-team decide session, from the mockup `plans/calc-team-mockup/` (the real EI build
patched: `build.py` writes `.tmp/calc-team/calc-team.html`, Thor frame + panel; phone preview `calc-team.html`). The
mockup's `patch.css` / `patch.js` are the reference for every size below; the user approved it on the phone preview
and will report anything that is bad on the Thor. Branch `worktree-damage-calc`. Delete this plan and the mockup when
built (lasting decisions go to `template/README.md` → Damage calculator).

## The goal
At every viewer size the first frame shows, at once: **my team, the foe's team, both cards, all four moves (wide: both
lists) and the fight bar**. At 260 × 316 the first frame is the page scrolled to the trainer bar (as now: `openMatch`
/ `stops()` scroll to `.fbar`).

## Layout

### Narrow (< 480): facing columns
Top to bottom (the page scrolls; the box stays above, as now):
1. **Box** (`.dside.mg`, unchanged: tools + six-across grid, internal scroll, max-height 136).
2. **Trainer bar** (`.fbar`: ‹ name ›, Cap box when relative) full width, **no panel border** (the `.dside`
   around it is background-less, padding 0), 22 px high (nav / name button 22 px).
3. **Teams, side by side**: left = my team (3 × 2 grid), right = the foe's team (3 × 2, the existing foe strip moved
   out of the trainer panel). Each in its own `.dside` panel, padding 2 px, gap 2 px. Cells: 24 px high, sprite
   22 px, level as a small badge on the cell's bottom-right corner (8 px, translucent panel2 background). Pokémon are
   not made smaller than this (user).
4. **Cards side by side** (mine left, foe right), the nameless card below.
5. **Moves** (the attacker's four, full width), each closed row 33 px: line 1 16 px (endpoint buttons 15 px), line 2
   13 px (its buttons / turn chip 13 px), `.mm` padding 1 px, row gap 2 px. Open rows unchanged.
6. **Fight bar** full width under the moves (S / D, weather, terrain, ↺), 22 px high.
7. Field (unchanged).
`.fit` gap 2 px. Budget at 260 × 316 (measured in the mockup, trainer bar top to fight bar bottom): plain cards 294 px,
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
- **Edit open at narrow:** the open card spans both columns (grid rows `cm cm` / `cf cf`): the other card moves under
  it, full width too. The editor itself is unchanged (it already shows the name).
- Tapping the card still selects the attacker (`data-a="sel"` on `.cc`).

### Wide (≥ 480): two columns, one window
Grid areas: `box tside` (the only `1fr` row; box grid and trainer preview scroll inside), `team foe`, `cm cf`,
`mv mf`, `fight fight`. My team row (6 across, 28 px cells as the foe strip now) sits under the box, the foe strip
(always shown now, also when the preview is) under the trainer panel, aligned. Cards keep **today's two-line cards
with names** (the columns are ~216 px; open question below). Fight bar full width at the bottom: the cards, moves and
fight bar are pinned to the bottom; spare height goes to the box / preview.
- **Trainer preview** (`.fteam`): **two-line rows** (as built), shown whenever the trainer panel has room for the bar
  plus at least one row; the strip under it always shows all six, so the preview no longer needs 150 px
  (`TEAMNEED` / the 400 px height rule go). At 392 about 3 rows show, at 424 about 4; they scroll.

## My team row
- **Storage:** `team: [{src, pid}]` (max 6, dense, in order) in the existing `cfg.ls.dmg` object; no new key. Resolve
  by `pid` (imported: party then boxes; custom: `ST.custom`), so re-imports, box moves and deleted customs can't point
  at the wrong Pokémon. An entry that doesn't resolve is dropped on render (a deleted custom set leaves the team).
- **First import:** an empty team is filled once from the imported party; a built team is never overwritten.
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
- **dvkb:** nothing to type in the row; check that the layout holds with the keyboard mode on.

## Edge cases
- No trainer picked: foe strip area shows the trainer bar's "Pick a trainer"; my side as usual.
- Trainer with < 6: the foe strip keeps 6 cells (empty ones hidden, as now).
- No imported save (custom sets only): the box lists customs; they drag the same way (`src: 'custom'`).
- A banner (`.ban`) goes above everything, full width; the first-frame rule is checked without a banner.
- Text zoom (A+): the card may wrap more; never clip or widen the page.
- Doubles / Trick Room / Speed colour: unchanged (the number keeps its colour).

## Open (defaults used; the user may overrule after the Thor)
- Wide cards: keep the names (default) or use the nameless card there too.
- Fight bar under the moves (default) or above the teams (the mockup panel has both).
- Trainer preview at wide: two-line rows (default) / full rows / off.
- Drop on a filled slot: replace (default) or insert and push along. Hold time 250 ms.
- Later, not in this build: an HP bar / fainted grey on team cells.

## Build units (in order; one template session at a time)
1. **Layout + nameless card** (template: `calc.js` `calcPage` markup / `calc.css`; Sol or Opus): build the grid areas
   in the page's own markup (not the mockup's after-render moves): narrow facing columns, wide pinned rows, foe strip
   out of the trainer panel, fight bar inside the one-window block, condensed trainer bar / move rows / fight bar
   (narrow), nameless card at narrow incl. the name fallback and full-width Edit, preview rows without `TEAMNEED`;
   `stops()` / `openMatch` scroll targets. Commit.
2. **Team row + drag and drop** (template; Sol): `ST.team` with pid refs, render, tap = send in, the pointer-event
   drag (from the mockup's `patch.js`), box dots, first-import fill, drop of unresolved entries. Commit.
3. **Checks** (Haiku medium): update `calc-retest` R1 (foe strip 3 columns at narrow, preview row count, fight bar now
   inside the first frame at every size), `calc-state` one-window; add `tools/scenarios/calc-team.mjs`: first-frame
   rule at the five sizes × normal / dvkb (my row, foe row, both cards, four moves (wide: eight), fight bar inside
   the viewport, plain and busy card), drag via `Input.dispatchTouchEvent` (box → empty, box → filled, swap, drag out,
   swipe doesn't drag, tap sends in), persistence across reload, re-import keeps the team by pid, deleted custom
   leaves it. Then plans/calc-open.md → Checks (full calc scenario set, `assemble.py`, every calc guide), domcompare
   against the branch's previous build on `#/calc`.
4. **Docs + preview** (Opus main chat): `template/README.md` → Damage calculator (replace "Retest layout" sizes, the
   preview rule, add the team row), every calc guide in the Thor frame on the phone preview, delete this plan and
   `plans/calc-team-mockup/`, PROGRESS / calc-open item 1 done.
