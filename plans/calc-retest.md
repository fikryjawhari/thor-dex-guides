# Calc: retest changes (spec)

The user's retest of the auto-effects build (2026-10-27), settled over mockups v1 / v2 (`plans/calc-retest-mockup/`,
`.tmp/M1`, `.tmp/M2` reports). Build it into the real template (`template/calc.js`, `calc.css`), all four calc guides.
The mockup shows the look; where it differs from this spec, the spec wins. Delete this plan and the mockup folder when
built and merged (the docs step folds the lasting decisions into `template/README.md` → Damage calculator).

Everything in `plans/calc-auto-effects.md` (built) still holds unless changed here.

## Layout

1. **Six across.** The box grid and the trainer's team row show six sprites per row at every width, including the
   two-column layout at 480 (now 5 in the box).
2. **Frame rule (most important).** At 260 × 316 one scroll position shows the trainer bar, the trainer's team row,
   both active cards and all four of my moves at once. In the two-column layout every size shows both cards and all
   four moves of both sides without scrolling. Nothing added here may break this; a scenario checks it.
3. **Two columns, pinned moves.** In the two-column layout the cards + four move rows sit at the bottom of the first
   screen (the fourth move row ends at the viewport bottom when scrolled to the top); the height above them goes to the
   box and the trainer: more height = more box rows and a bigger trainer panel, not more empty space. Once there is room
   (crossover free to choose, but **expanded at 424 px tall**: 537 × 424 and 832 × 424), the trainer panel shows the
   **full preview: one Pokémon per row** with level, item, ability and its moves (tap a row = pick that foe, as the
   sprite does now); if six rows don't fit, the list scrolls inside its panel. Below the moves the page scrolls on as
   usual (fight bar, Field). Window resize / text zoom recompute it. One column (260) is unchanged apart from 1-2.
4. **Fight bar** below both movesets (full width in two columns), above the `Field ▸` row, outside the Field panel:
   Singles / Doubles, Weather, Terrain, Reset fight (↺ icon, `aria-label="Reset fight"`). Same behaviour as these
   controls have in Field now (Auto / manual weather and terrain layers, Doubles gating), only moved.

## Cards

5. **HP row, one line, condensed** (shorter than the mockup's: the user found it too tall): `Lv [50] [↺] [158] /235`,
   then right-aligned: toxic counter `T[1]` (only when badly poisoned; moved from beside HP), the turn-end residual
   button, the berry button. Residual: **red text for a loss, green for a gain, no sign**. Berry button (only when a
   berry is ready): **no berry name**, white text with a `+` (no berry costs its holder HP; Jaboca / Rowap hit the
   attacker and already fire on the hit). Must fit at 260 with all of them showing. Keep the thin HP bar under the card
   (the user liked it) and the speed colouring on `Spe`.
6. **Edit menu:**
   - Turn-end parts list: each line is a button applying just that part (`Leftovers 14` green, `Toxic 30` red, same
     colours as 5); the residual button on the card still applies them all.
   - Ability: a native select of the species' abilities plus `Other…`; Other turns it into a text entry with a
     full-window type-to-filter picker over ALL abilities, and a × back to the select. An off-species ability saved on
     a set shows as the text form.
   - Item and Nature: text entry with the full-window type-to-filter picker (the mockup's), Item over ALL items (drop
     the in-game filter). Status, Battle state, hit count, move type and every other select stay native selects in every
     mode (the app shims them; never intercept them). The picker works in a browser and in dvkb (query, results and
     keyboard all visible at 260 × 316).

## Moves

7. **Tappable damage.** The closed row's `73–86` becomes two boxed buttons `[73]–[86]` (same look otherwise, no sign).
   A tap does what the open row's HP −min / −max does now (`DMG.hit` with all automatic reactions, plus the user's
   recoil / contact / drain / Life Orb change, the log overlay, Broken ticks...). Foe moves hit my Pokémon. The numbers
   are always the row's current figures (hit count, crit, Z...), so a multi-hit move can be tapped once per hit at 1×
   or once at 3×. Remove HP −min / −max from the open row. (This closes "apply −HP from the closed row" in
   `plans/calc-open.md`.)
8. **Custom amount** in the open row: a number box + Apply (number pad in dvkb), applying exactly that damage with the
   same reactions as 7. Tapping one of the listed rolls fills the box.
9. **Follow-up chips become ranges**, not buttons: recoil / drain / Rocky Helmet etc. show `25–30` for min–max of the
   row, red for the attacker's loss, green for a gain, no sign; not tappable (7 applies them).
10. **Everything beside the move card moves into it.** The crit button, the multi-hit cycle button and the move-state
    controls now outside the row (the "toggle moves": Assurance, Fury Cutter / Rollout / Echoed Voice counters,
    Stockpile, Stored Power stages... whatever `calc.js` renders next to the row) go inside the card, on its bar, as the
    mockup put crit + hits + the move toggle. Multi-hit: the existing small cycle button (counts **including 1×**), not
    a select. Every closed move row has the same height, controls included, and the frame rule (2) still holds.
11. **Move → Field toggles.** A move that sets a Field entry or battle state gets a toggle on its row (status moves: in
    place of `—`; damaging ones like Stone Axe / Dig: beside crit), lit when on, flipping the same state the Field /
    Edit controls flip. Side: the move user's side for screens / Tailwind / Safeguard / Protect / own states, the
    opponent's for hazards and Leech Seed-type states, the user's battle state for Dig / Fly / Bounce / Dive /
    Minimize. Weather / terrain moves set that weather / terrain as a manual choice (tap again: none). Map:
    `.tmp/M1/report.md` → "Move → existing entry map" (use the real keys from `calc.js`; only entries the guide's
    profile offers).

## Field

12. **Field panel** (below the fight bar): Global group first (full width, collapsible), then the Player / Foe switch,
    then that side's groups (States, Turn end, Hazards, Doubles allies in Doubles: the real calc's groups) as
    collapsible sections **stacked in one column at every width** (never side by side). Each open group shows its
    toggles in the normal grid.
13. **Collapse bars per group, not for the whole panel**: each open group ends in the guide's standard collapse bar
    (`.endbar`, `Collapse <group>`, as Walkthrough / Items use: `template/dex.js` "Collapse bars", shown only when the
    open block is taller than the window). No big "Collapse Field" bar.
14. **New entries:** Safeguard per side (a tracked state; where the calc applies a status automatically it blocks it
    for that side, otherwise no effect) for every calc guide whose moves include it; **Protect** (the entry exists but only
    Photonic shows it, through `zmove`): offer it on every calc guide whose moves include a Protect-family move (the
    user asked for EI; same rule everywhere). On: the protected side's incoming hits show 0 / "Protected" and taps
    apply nothing, except moves that bypass Protect (Feint, Unseen Fist contact, the guide's own list if it has one)
    and Photonic's Z-moves (¼, as now). **Weather moves use the guide's own weather**: Hail sets Snow where the guide
    has Snow, not Hail (EI), Hail elsewhere. No per-guide passes beyond this: the map reads each guide's profile.

## Checks

Update the calc scenarios that drive what changed (HP −min / −max buttons, follow-up chip taps, Field group layout,
selects), don't delete coverage. New checks: the frame rule (2) at 260 × 316 / 260 × 394 / 480 × 392 / 537 × 424 /
832 × 424, normal and dvkb; two-column pinned layout and the full trainer preview at 424 tall; HP row on one line at
260 with toxic + residual + berry; equal closed move-row heights (multi-hit included); tap min / max = the old HP −
results (recoil, Helmet, Sash, berry); custom amount; follow-up ranges not buttons; move → Field toggles in sync both
ways; per-group collapse bars; the picker for Item / Nature / Other ability in normal and dvkb; native selects not
intercepted. Then the full Checks in `plans/calc-open.md` → Checks (engine tests and hzla counts only if the engine
changed), `domcompare` vs main: only `#/calc` differs. Republish the four previews (`calc-auto-ei / -hardlove /
-photonic / -eternal.html`, Thor frame with `tools/mockup/thor-frame/calc-presets.html`).

## Build units (Sol agents in this worktree, one after another; each ends at a commit)

- **R1 layout and cards:** 1-6 (six across, pinned two-column layout + full trainer preview, fight bar, HP row, edit
  menu + picker), their scenarios.
- **R2 moves:** 7-11 + the Safeguard / Protect / Hail entries of 14, their scenarios.
- **R3 Field + checks:** 12-13, the remaining checks, full calc scenario run, domcompare, the four previews.
