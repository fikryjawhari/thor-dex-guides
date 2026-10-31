# Calc layout: two-line move rows, Δ fight changes, short-wide page (move-pages unit 4c)

Decided with the user on 2026-10-31 from a prototype on the real guides: `plans/calc-layout-proto.css` / `.js`,
injected by `python -I plans/calc-layout-proto.py [hack ...]` into `dist/<hack>.html` (framed with the switches in
`plans/calc-layout-proto-panel.html`). The prototype's CSS is the target: move it into `template/calc.css` with the
`px-` body classes dropped (the decided options are the only behaviour); the JS parts become calc.js code (below).
Delete the four `plans/calc-layout-proto*` files with this spec once built.

## What changes

Every guide with `cfg.calc`, the calc route only. No data, storage-key or saved-state changes.

1. **Closed damaging move row: two lines, KO on line 1** (rows 32 px; today 33).
   - Line 1: type dot + move name (shrinks first, ellipsis) · KO text (`.ko`, its colour, 10 px; shrinks second,
     ellipsis) · the min–max damage buttons (`.hp`, never shrink), right-aligned.
   - Line 2: Z (Photonic Sun) · HP chip / miss chip (`.dturn`, as today) · the % range (10 px, bold, `--fg`) · effect
     odds (`.dodds`, grey, take the rest, ellipsis) · the move controls (H1 / ×n, category, state, toggles, C),
     right-aligned.
   - Built as in the prototype: `.mm` a wrapping flex row, `.r1` / `.r2` `display:contents`, `order` puts the KO
     between the name and `.hp`, `.mm::after` (order 3, full width, 0 high) breaks the line. Line 2 spans get
     `line-height:13px`; Z / H / C keep their own size (`.rz` 14 px: don't give it a line height that grows it).
     Status rows (`.mr.st`) and empty slots (`.mr.em`) are unchanged (name | right slot, same 32 px). The opened row
     (`.dd`) follows line 2 at full width, unchanged inside (it already starts with the KO chance in full).
   - The user reads the odds as "there is an effect": cut odds are fine; the open row lists them all.
2. **Fight changes: a Δn button replaces the chips on the card** (n = number of changes: types, added type, ability,
   item; `fightChips`). Tap: the card's chip row (`.dfch`, as today) opens under the card as a dropdown; tap again:
   closes. A chip tap still clears that change (n drops; at 0 the button and the row go). The button is accent text;
   open = filled accent, `aria-expanded`. No sheet / new screen.
   - Narrow (< 480): first item of the card's third line (`order:8`, before the battle state / Aura / berry; Toxic turn
     and residual stay at the right). It makes a third line only if the card had none.
   - Wide: in the HP line after `/max` (it is in `.cl`), min-height 20 px like the other `.cl` boxes.
   - Open state: per side, in memory only (like `EDITOPEN`), closed on load; kept across re-renders; closes when n
     reaches 0 or the side's Pokémon changes.
3. **Short-wide page: 480+ wide and under 392 tall** (e.g. 480 × 316, 537 × 360): the narrow page's top with the wide
   match. Grid areas `"ban ban" "box box" "tside fight" "team foe" "cm cf" "mv mf"`, rows auto, `align-content:start`,
   no `min-height` on `.fit` (no blank band above Field).
   - The box (`.mg`, Import / New / Find + grid, 136 px, grid scrolls inside) sits above the fold as at 260; opening
     the calc scrolls to the trainer bar (as narrow); the page scrolls as far as it can (on a taller window the box's
     bottom shows above the trainer bar).
   - Trainer bar and battle-state row share one line (each half the width); the trainer list (`.fteam`) is hidden and
     the foe strip (`.dfoe`) shows, as at 260; team and foe strips are one row of six each (24 px cells, 22 px
     sprites: the narrow cell size).
   - Cards, Edit (both editors open together), movesets in two aligned columns: the wide rules, unchanged.
   - Switching: a body class set on load and resize (`innerWidth>=480&&innerHeight<392`), not a media query, and not
     changed while a number box / select in the calc has focus (a phone keyboard resizes the window). Every
     `innerWidth<480` test about the page's top / scrolling (`stops()`, `openMatch()`, drag auto-scroll near the edges)
     uses "narrow or short"; card and editor tests (`fitCards`, `eopen`, the resize handler's editors) stay width-only.
   - At 392 tall and up nothing changes from today: 480 × 392 keeps the box + trainer list and now fits all four rows
     (fourth row ends at 388 with six foe Pokémon), so checks 20b / 20c keep their sizes.
4. **Battle-state row 20 px** (S / D, the two selects, reset; today 22), every size.

## Out of scope

Pokémon cards otherwise (name size stays: 13 px, the trainer bar is 14 px; card height comes from its 18–20 px
boxes), team / box cell sizes, trainer bar height, the opened row's content, status-row content (the parallel "Not
modelled" chip goes in the status row's right slot, unchanged by this), the editor, Field.

## Controls and states

| Control | State | Action | Result | Disabled / empty |
| --- | --- | --- | --- | --- |
| Move row (damaging) | closed | tap the row | opens (`.dd` under line 2), KO chance in full first | — |
| Move row | open | tap line 1 / 2 | closes | — |
| Min / max buttons | — | tap | applies that damage (today) | disabled as today (fainted, Protected) |
| Z / H / C, category, state, toggles | — | tap | as today; the row keeps two lines | as today |
| Δn | closed | tap | chip row opens under the card's lines, Δn filled | no changes: no button |
| Δn | open | tap | chip row closes | — |
| Fight chip | row open | tap | clears that change; Δ(n−1); at 0 button + row go | — |
| Edit → Fight… | — | add a change | Δn appears / counts up (row stays as it was) | — |
| ↺ / Reset fight | — | tap | changes cleared: button gone, row closed | — |
| Resize across 392 tall (480+ wide) | — | resize | switches between full and short-wide; scroll goes to the trainer bar when entering short | held while a calc input has focus |
| Rail up / down | short-wide | tap | the narrow stops (top, box, trainer bar, fourth move / Field rule as at 260) | — |

## Edge cases

- **Immune**: line 1 name · `No effect` (in `.hp`); line 2 Z and controls only (no range, no KO, no odds).
- **Fainted**: KO text `fainted` on line 1; buttons disabled. **Protected**: `.hp` shows `0 · Protected`.
- **Z on** (Photonic Sun): line 1 shows the Z-move name (accent), H buttons hidden as today; Z pressed on line 2.
- **Multi-hit**: H1 / ×n before C on line 2; KO and range follow the shown hit as today.
- **HP chip + odds** (Life Orb recoil `25–25`, drain `7–10`, `miss −n`): chip before the range; odds get what is
  left (may be just "…" at 260). Range, chips and controls never wrap or leave the row at 260.
- **Long move names** (`Light That Burns the Sky`, Z names): the name truncates first; then the KO text.
- **Three odds**: cut with "…" on the closed row; all in the open row (`dodds2`).
- **Status rows / Not modelled**: unchanged, 32 px; side-by-side columns stay aligned (all rows 32 px).
- **Δ with a battle state + Toxic + residual** at 260: one third line (Δ left, T box + residual right); with a long
  Aura/berry set `fitCards` rules apply as today (Δ is order 8, before them).
- **dvkb**: the number pad changes nothing here (no resize in the viewer). Text zoom: rows grow with the text, no
  overlap (flex wrap). Light / dark: KO colours as today.
- **Viewer sizes**: 260 × 316 four rows inside (ends ≤ 312 with three-line cards); 260 × 350 same; 480 × 392 full
  layout four rows; 537 / 832 × 424 four rows; 480 × 316 short-wide four rows in both columns (ends ≈ 294).
- Saved state: none new (Δ open state is not saved); `guide-update.mjs` unchanged.

## Checks

| Requirement | Scenario | Sizes / modes | Assertion |
| --- | --- | --- | --- |
| Four rows fit | `calc-layout.mjs` check 1 | 260 × 316, 260 × 350, 480 × 316 (short), 480 × 392, normal + dvkb; EI and Photonic | foe with Toxic + a battle state + a fight change (three-line card): the attacker's four rows end inside the window; at 480 both columns |
| Row shape | `calc-layout.mjs` new check "two-line rows" | SIZE_STAR + 480 × 316 | closed damaging row ≤ 33 px; `.mv`, `.ko`, `.hp` on one line (tops within 2 px), range / odds / controls on line 2; nothing past the row's right edge; `.hp` and the range not clipped; a long-name fixture truncates `.mv`, not `.hp` |
| Edge rows | same check | 260 × 316 | immune (no `.ko` text, `No effect`), Protected, fainted, Z on (Photonic), H1 / ×3, HP chip + odds: still two lines, inside the row |
| Odds | `calc-fight-state.mjs` 'odds' | as today | "beside the KO text" becomes: odds on line 2 after the range, KO on line 1; ellipsis when cut; open row lists all; KO chance in full first (unchanged) |
| Δ fight changes | `calc-fight-state.mjs` 'Edit → Fight…' (and Worry Seed / Soak / Trick: read chips through Δ) | 260 × 316, 537 × 424 | after adding +Ghost: `Δ1`, chips hidden; tap Δ → `['+Ghost']` inside the card; chip tap clears, Δ gone; reload: Δ1, closed. Narrow: Δ is on the card's third line; wide: on the HP line |
| Short-wide | `calc-layout.mjs` new check "short wide" | 480 × 316, 537 × 360, normal + dvkb | `.fteam` hidden, `.dfoe` one row of six, trainer bar and battle-state row share a line, scroll lands on the trainer bar, Field directly under the rows (no gap > 4 px), no sideways scroll |
| Stops | `calc-layout.mjs` check 18 | add 480 × 316 | the narrow rule holds in short-wide |
| No switch at 392+ | checks 20 / 20b / 20c | unchanged sizes | pass as today (480 × 392 is the full layout) |
| Battle-state row | check 1 | 260 × 316 | `.dfight` 20 px |
| Every guide | `domcompare` vs main, `gate.py check` | all guides | intended differences only: move rows, Δ, `.dfight` height |

Finish: `assemble.py`, the scenarios above with `gate.py scenarios --only calc-layout,calc-fight-state --jobs 8`, the
full gate once at the end, `preview.py` in the Thor frame for the user's Thor test.
