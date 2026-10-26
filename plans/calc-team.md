# Calc: a team row you build by dragging (idea, not decided)

2026-10-26, raised in the auto-effects decide session (`plans/calc-auto-effects.md`). Needs its own decide session
(mockup in the Thor frame, then a spec); not part of the auto-effects build.

## What the user wants
- One row at the top of the player's side that holds up to six team members, so a whole fight can be planned with
  the real line-up: tap a slot to send that Pokémon in (it is a switch: the auto-effects scratch state applies, HP
  stays).
- Filled by **drag and drop** from the Mine list (boxes, custom sets, the import), not by "select, then mark as in
  team". Dragging a slot out of the row (or onto another slot) removes / reorders it.
- The Mega toggle stays the way to see a Mega: no second "Mega" entry needed in the team (old calcs made you add the
  Mega as its own set).

## What exists today (worktree-damage-calc, `template/calc.js`)
- `ST.mine = {src: 'party' | 'box' | 'custom', b, i}` picks the player's Pokémon; `ST.imp.party` is the imported
  save's party (only with `profile.save`), `ST.custom` the sets made in the calc. `mineList()` / Find yours list them.
- Both teams already have a strip of 28 px cells (the foe strip, and Mine's strip mode). 6 × 28 px plus gaps is
  about 180 px, so six across fits the 260 px minimum width with room to spare; the row is one strip height (~30 px)
  of the 316 px window, which is the real cost: check the one-window rule (`calc-state.mjs` one-window) with it.

## Proposal to start the decide from
- Storage: `team: [ref, ...]` (max 6) inside the existing `cfg.ls.dmg` object, where `ref` is the same
  `{src, b, i}` (or a stable key) `ST.mine` uses. No new localStorage key. An imported party could fill an empty team
  once, never overwrite a built one.
- The row replaces Mine's strip mode when a team exists; the full Mine grid / Find yours stays the source to drag
  from. Empty slots are dashed drop targets.
- Drag: HTML5 drag and drop does not fire on touch (the Thor, phones). Use pointer events: press and hold
  (~250 ms) or a small move threshold starts the drag, a floating copy of the cell follows the finger, drop on a slot.
  A plain tap must still select. Scrolling the Mine grid must not start a drag (hold, not move, starts it).
- Removing: drag a slot out of the row, or a small × on the slot while in an edit mode. Open question.
- Questions for the session: does the row also exist for the foe (it already is the trainer's team), does the team
  survive a reload (yes, like custom sets), what happens to a team member whose custom set is deleted, dvkb
  (keyboard) mode, and where the row sits at 480+ widths (two columns).
