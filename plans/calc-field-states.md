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
- Open question for the build session (ask first): how Stealth Rock / Spikes damage shows. Recommended: a
  switch-in part shown with the turn-end parts and applied once when the Pokémon is selected from the team /
  strip (manual HP edits win), vs. only shown, applied by tap.
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
