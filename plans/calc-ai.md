# AI move odds and switch-ins (Hardlove Gold; the shared parts in the template)

Status: deciding (2026-11-03). Next: mockups (AI options block, the % / score on foe move rows, doubles slots, the
foe team ordered by switch-in), then the spec.

## Source
The hack's AI code is public and is the authority; the AI doc (`Hardlove Gold AI document_WIP.md`) is the list of
expected results. Pinned `4a8d4a6308`, `src/trainerai/` (copied to `.src/repos/hardlove/src/trainerai/`;
`SOURCES.md` + the fetch need updating): `main.c` (scoring: `BasicScoring`, `DamagingMoveScoring`, `SetupScoring`,
`HarassmentScoring`, `RecoveryScoring`), `setupStateVariables.c` (the damage tables), `calcDamage.c` (the AI's own
damage formula), `calcSpeed.c`, `pick_command.c` (pick, targets, hard switch), `postKO.c` (switch-in score),
`scoringHelper.c`, `calc.c`; `include/custom/custom_ai.h`. ~7,100 lines. The AI changed in 0.8.6 and 0.8.7: port it
function by function (named after the C) so an update is a diff of `src/trainerai/`.

## What the code does (read 2026-11-03)
- The AI's own moves: one random roll each (`BattleRand % 16`, 85-100 %, applied after crit, before STAB, as the real
  formula), so the highest-damage pick is random; a killing roll is capped at the target's HP, so every killing move
  ties as highest. Not the "always highest roll" kind of AI.
- Damage the AI receives (player's moves into it) and every switch-in calc (`postKO.c`): the max roll
  (`damageRange[15]`). So the switch-in score is deterministic (but for Zoroark's random +0-2).
- Random bonuses are fixed branches: +2 on 25 % (highest damage / kills), 70 % / 50 % / 5 % (Explosion by HP),
  20 % (trapping moves), etc. Ties: uniform random; doubles: the target is rolled first among targets with the top score.
- `calcDamage.c` is a separate implementation: compare it with our engine term by term before trusting our numbers as
  the AI's (any gap: follow the AI's formula for the odds only).

## Decided
- Odds per foe move as rnbcalc: every combination of the AI's rolls and of each random bonus, highest score per branch,
  ties split evenly; one % per foe move row. Also show the score (e.g. "+6/+8") next to the %.
- AI options: a collapsible section in Field, between Global and the next section (or above Global): the battle facts
  the calc can't know (first turn out, Protect last turn, Taunt / Encore up, sleep turns, last mon ...); derive what we
  can (first turn out = just entered) so the toggles stay few.
- Switch-ins: the foe's team cells reorder by the post-KO switch-in score against the Pokémon on the field (recomputed
  on every pick); fainted ones go grey (open: rank them in place, or always last). Singles also: the hard-switch chance.
- Doubles in scope: slots 1 and 2 on both sides (a number in the sprite cell's corner); the AI scores against both of
  the player's slotted Pokémon; the moves / rolls shown are the viewed Pokémon's; a foe move's % is "this move into the
  viewed target" (so a move going into the other slot shows 0 %, plus a line for the other target).

## To settle
- Doubles slot controls (proposal in chat 2026-11-03): a tap on a slotted Pokémon views it; a tap on a benched one
  fills an empty slot, else takes the viewed one's slot (as switching it in; the foe's replacement after a KO goes into
  the fainted one's slot); 1 <-> 2 swap = a tap on the slot number on that side's card. A second tap on the viewed cell
  is taken (hazard chip; double tap = dex page), so it can't be the swap.
- Default slots: each side's first two (the player's party order, the trainer's order).
- Doubles: faster AI mon scored first; its partner ignores a target it fast-OHKOs (`pick_command.c`).
- How rnbcalc renders the % (not read); our numbers' text at 260 px.
- Fixtures: the AI doc's examples; the user's in-game tests. Can `data/battle_tests/` run the AI headless?
- Profile hook: the branch / tie maths and the UI in the template behind `cfg.calc`'s AI switch; the rules in a
  Hardlove profile module, inlined only for it. Unbound / Radical Red AI is not public.
