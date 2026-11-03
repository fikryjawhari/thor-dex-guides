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
- Switch-ins (`postKO.c` `BattleAI_PostKOSwitchIn_Internal`): each bench mon is scored against BOTH player mons on the
  field (`BATTLER_OPPONENT` + `BATTLER_ACROSS`, summed; a fainted one is left out; both down: party order), max rolls,
  so the order is deterministic (but Zoroark's +0-2); ties go to the first party slot (strict `>`). Which foe faints
  and which slot it was in change nothing. Singles also: the hard-switch chance on the foe card.
- Double KO: both picks are made before either switches in (the second skips the first via `aiSwitchedPartySlot`), so
  the second is #2 on the same ranking; the first one's entry (Intimidate ...) does not change it. In-game test.
- Grids read down, then right (both sides, narrow 3 x 2):
  ```
   | F1 | F3 | F5
   | F2 | F4 | F6
    field next  rest, fainted last (grey)
  ```
  Singles foe: r1c1 the foe on the field (a picked foe moves there), then the switch-in order down the columns
  (r2c1 = next out), fainted last. Doubles: column 1 = the two on the field (a 1 px line after it), c2r1 / c2r2 the
  first / second replacement, c3 the rest, fainted last. My grid: party order in singles; in doubles column 1 = my two
  on the field, the bench in party order. Wide: the first two cells of my row / the first two foe rows. Recomputed on
  every change (HP, stages, picks), so the cells move: a double tap follows the Pokemon, not the cell, and taps are
  ignored for a moment after a reorder. Display only: the saved team order is unchanged.
- Doubles: the AI scores against both of the player's on-field Pokemon; the moves / rolls shown are the viewed one's;
  a foe move's % is "this move into the viewed target" (so a move going into the other target shows 0 %, plus a line
  for the other target).
- Doubles controls: a tap on an on-field Pokemon views it; a tap on a benched one takes the viewed one's cell (as
  switching it in; the foe's replacement after a KO goes into the fainted one's cell); the replaced one goes back to
  its bench place. No 1 <-> 2 swap control: in Hardlove the slot changes no number (move scoring is against both
  targets, faster first by Speed, target ties random; switch-ins sum over both). Explicit slots / swap only for a
  future hack whose AI reads the opposite slot (Run & Bun).

## To settle
- In-game: the double-KO order above; when your Pokemon faints the same turn, does the AI pick before seeing your
  replacement?
- Doubles: faster AI mon scored first; its partner ignores a target it fast-OHKOs (`pick_command.c`).
- How rnbcalc renders the % (not read); our numbers' text at 260 px.
- Fixtures: the AI doc's examples; the user's in-game tests. Can `data/battle_tests/` run the AI headless?
- Profile hook: the branch / tie maths and the UI in the template behind `cfg.calc`'s AI switch; the rules in a
  Hardlove profile module, inlined only for it. Unbound / Radical Red AI is not public.
