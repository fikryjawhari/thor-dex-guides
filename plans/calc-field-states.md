# Calc: stackable battle states, pledge fields, hazards (spec, 2026-10-26)

Settled with the user; build in a fresh session on `worktree-damage-calc-toggles` (engine + UI together: the Field
draws toggles from profile entries, so the UI can't be checked without the engine inputs). Read first:
`plans/calc-handover.md` (compact pass), `template/README.md` → Damage calculator, `tools/calc/README.md`.

## Rule
One-at-a-time states stay in Edit's Battle state select (Dig, Fly / Bounce, Dive, Minimized, Switching out).
Anything that can stack is a Field toggle per side (stored `atk*` = Player, `def*` = Foe, as now). Offer a toggle
only when the hack has what causes it (the move / item / ability is in its data, gen rules); Protect only in
profiles with `zmove` (Photonic).

## Engine (tools/calc/src/adapter.js, profiles, fixtures, rebuild engine.js)
`residual()` today covers weather, items, Grassy Terrain, status and profile extras only. Add, per side:

| Toggle | Effect |
|---|---|
| Trapped (Bind, Wrap, Fire Spin, Whirlpool, Sand Tomb, Clamp, Magma Storm, Infestation, Snap Trap, Thunder Cage) | −1/8 (gen 2-5 −1/16). Binding Band read from the **other** card's item (no band variant): −1/6 gen 6+, −1/8 gen 5. Trapper switching / fainting ends it: manual off. |
| Seeded | −1/8 (gen 1 −1/16); the other card heals that much (Big Root ×1.3 on the healer); Liquid Ooze on the seeded side turns the heal into damage. Magic Guard. |
| Salt Cure | −1/8; −1/4 Water or Steel |
| Cursed (Ghost Curse) | −1/4 |
| Nightmare | −1/4, only while asleep |
| Ingrain, Aqua Ring | +1/16 each (Big Root ×1.3) |
| Sea of Fire (Fire + Grass Pledge) | −1/8 to non-Fire |
| Swamp (Grass + Water Pledge) | Speed ×1/4 (`DMG.speed`, faster colour) |
| Charge | next Electric move ×2 (stock `isCharge`) |
| Protect | Photonic only: Z-moves through it ×1/4 (stock `isProtected`) |
| Foresight / Odor Sleuth; Miracle Eye | Normal/Fighting hit Ghost; Psychic hits Dark |
| Tar Shot | Fire ×2 more effective on the target |
| Glaive Rush (used last turn) | the user takes ×2 |
| Roost (this turn) | loses Flying |
| Smack Down / Thousand Arrows | grounded (no Flying / Levitate Ground immunity) |
| Magnet Rise, Telekinesis | Ground immunity |
| Stealth Rock | switch-in −1/8 × Rock effectiveness |
| Spikes 1-3 | switch-in −1/8, −1/6, −1/4 (grounded) |
| Toxic Spikes 1-2 | see Hazards |

Bad Dreams: automatic (the other card has it and this one is asleep / Comatose), no toggle. Rainbow (Fire + Water
Pledge) changes no damage: not offered. Each new term gets engine fixtures in `tools/calc/test.mjs` (gen splits,
Magic Guard, Big Root, Liquid Ooze, Binding Band from the opposing card); the KO text keeps using the turn-end total.

## Hazards
- Toxic Spikes (layers 1-2) on a side: every grounded, non-Poison, non-Steel Pokémon selected on that side gets
  Poison (1 layer) / Bad poison (2). A Poison type does **not** absorb them: the layers stay until the user sets 0.
- Settled with the user during the build: Rocks / Spikes apply once on selection from the team / strip. No
  switch-in parts on the HP line or in residuals. Manual HP entry / Full HP re-arms damage without applying it.
  A compact **Apply hazards** action inside the folded Hazards section reapplies pending entry effects, then
  disables until relevant edits / field changes or a new selection. Damage, status and Web track independently:
  clearing poison must not subtract Rocks a second time. Selecting again after switching away is a fresh entry;
  recalculation, direction changes and reload are not. Keep these markers in the existing calc storage.
- Toxic Spikes changes status on entry only; manual status overrides persist. Clearing status re-arms its part
  of Apply hazards. Web sets the absolute Speed stage to -1, not current stage minus one; manual stage edits
  re-arm it so a replay from +5 starts at -1. No White Herb consumption or reciprocal stat-drop effects.
- Add Sticky Web when its source move is available (Gen 6+). Implement sharp steel / G-Max Steelsurge in the
  engine and fixtures only: the user confirms no planned guide will need its control.
- Layer counts are cycling toggles (`Spikes 2`), never a select.

## UI: still one window at every size
The toggle count roughly doubles. Keep every rule from the compact pass: word-width boxes, `auto-fit`, the narrow
Player | Foe switch, and the one-window check (`calc-state.mjs` one-window) at 260 / 480 / 537 / 832 × 316 and the
viewer sizes. Group each side: the current toggles, then **Turn end** (trapped, seeded, salt cure, curse,
nightmare, ingrain, aqua ring, sea of fire) and **Hazards** folded (count of active ones on the fold), the rest
(Charge, Protect, Foresight, Tar Shot, Glaive Rush, Roost, grounded, Ground immunity, Swamp) where they fit. Fold
state is not stored. Mockup first at 260 × 316 if the layout isn't obvious. Field summary line lists active ones.

## Out of scope (after this build)
Merge this tab into `worktree-damage-calc` first, then clear the loose ends there: Return / Frustration default
power 102, the verify list and the trainer-field automation decide in `plans/calc-handover.md`.

## Build and audit record (2026-10-26)
- Built on `worktree-damage-calc-toggles`; user approved the corrected previews and requested a commit on
  2026-10-26. Not merged; the user will merge in a separate session. Keep this plan until the build is merged.
  Durable UI/API contracts are in `template/README.md` and `tools/calc/README.md`.
- Engine includes the state / turn-end / entry effects above, per-side Swamp speed and grounding hooks in
  `tools/calc/instrument.mjs`, and engine-only Steelsurge. `DMG.entry` returns numeric damage parts, optional
  status and an absolute Speed stage (-1, or +1 for Contrary). No entry hazard enters the turn-end total.
  Generations 4-9 remain supported; earlier-generation rate branches do not broaden that contract.
- `npm --prefix tools/calc test`: 96 engine groups, zero failures, 41 direct stock parity cases. Imperium,
  Hardlove, Photonic and Eternal suites pass; state fixtures pass 737 / 746 / 549 / 326 respectively. Final bundle:
  390911 bytes, gzip 94543. Evidence: `.tmp/calc-field-engine-test.log`, `.tmp/calc-field-engine-build.log`.
- Final `python assemble.py`: all four guides build. `calc-field-states.mjs` passes 42 / 42 / 46 / 46 cases
  (176 total, normal/dvkb; seven window sizes). Covers once-only entry, HP reset/direct edit, independent poison
  and Web replay from +5, redraw/reload, side mapping, residual isolation, folds, source gating and minimum-size
  overflow. Photonic/Eternal also verify that inverse battles do not invert Magnet Rise/Telekinesis immunity,
  and Gravity overrides it. Final Hardlove profile scenario: 10/10 after updating its intentional Protect removal.
- Regression checks pass: residual 40, layout 36, triple/power 20, Imperium 10, Photonic 10 and Eternal 10.
  Calc-state checks pass 118 across the four guides. Syntax checks and `git diff --check` pass. Synthetic builder
  checks cover move/ability gating, Z-only Protect, no Steelsurge UI, unique keys and unchanged input config.
- Full before/after DOM sweeps, all four guides normal/dvkb: only `#/calc` changes in each sweep; 19,840 other
  route/mode comparisons identical, zero page errors, zero unsettled routes. Logs:
  `.tmp/calc-field-validation/*-dom-*.log`; baseline builds: `.tmp/calc-field-baseline/`.
  Sweeps preceded the final inverse-rule engine rebuild; final inverse UI scenarios exercise that rebuilt bundle.
- Existing `calc-field.mjs`: EI 2/2; the two EI-specific imported-party cases fail on each other guide because
  those fixtures have no party slot 5. The same six failures reproduce on the pre-change builds; not changed here.
  Evidence: `.tmp/calc-field-validation/*baseline*`, final scenario logs in the same directory.
- At 260 x 316 the closed-group Photonic Field measures 307px, its body/scroll height both 275px, with no
  horizontal overflow. Expanded sections scroll within the bounded Field rather than growing past the window.
  Screenshots: `.tmp/calc-checks/calc-field-min-closed.png`, `calc-field-min-hazards.png`.
  T3 preview snapshots twice returned `Preview automation snapshot timed out after 15000ms.`; repository browser
  scenarios/screenshots supplied the visual fallback. The user subsequently approved the corrected phone previews.

Built Thor-frame previews (live preset panel, not the old illustrative mockup):
- https://windows-pc.tail1846b8.ts.net/preview/calc-field-states.html (Imperium).
- https://windows-pc.tail1846b8.ts.net/preview/calc-field-hardlove.html (Hardlove).
- https://windows-pc.tail1846b8.ts.net/preview/calc-field-photonic.html (Photonic/Z).
- https://windows-pc.tail1846b8.ts.net/preview/calc-field-eternal.html (Eternal).

### Phone feedback fixes (2026-10-26)
- User approved the field control size and the three-across closed headings changing to stacked expanded groups.
  Preserve both. Field body children no longer flex-shrink, and toggle/section grid rows use their natural content
  size so pressing a control cannot compress wrapped labels. Expanded content still scrolls inside one window.
- The player box now top-packs its existing compact rows instead of stretching unused height between them.
  No insertion order, column count, Pokemon data or engine behaviour changed.
- Added field press/height/content-fit and 17-Pokemon top-packing regressions at every size, normal/dvkb. The
  pre-fix Imperium build fails 22 of 56 checks (14 non-shrinking contracts, eight stretched-row cases); the fixed
  Imperium build passes all 56. Logs: `.tmp/calc-field-feedback-before.log`, `.tmp/*-field-feedback*.log`.
- Final all-guide checks: field scenarios 56 / 56 / 60 / 60 (232 total), compact-state scenarios 40 / 26 / 26 / 26
  (118 total), all passing. Eight Calc-route DOM comparisons against the pre-feedback builds are identical,
  with zero page errors. All four guides rebuilt and the same Thor-frame phone previews refreshed.
- The screenshot's Safari-specific compression was not directly reproduced in Chrome; the fix explicitly removes
  flex compression and content-row sizing ambiguity. The user rechecked the corrected previews, approved them
  and requested a commit; merge will be done in a separate session.
