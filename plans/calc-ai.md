# AI move odds and switch-ins (Hardlove Gold; the shared parts in the template)

Status: UI settled (2026-11-03, mockup approved on the phone); spec below. Next: the build, after
`plans/gauntlet-carry.md` (both touch calc.js: one template build at a time). The open items under To settle need the
user's in-game tests; they don't block the build (the code is the authority, the tests confirm it).

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

- (2026-11-03, after the mockup) What a % means: the chance this foe Pokemon clicks this move INTO the viewed target,
  out of everything it can do this turn. Per foe Pokemon, every (move, target) pair, the ally pairs and the hard switch
  (singles) add up to 100. Doubles example: Arceus vs your Scizor (viewed) + Typhlosion: "40 %" on a row = 40 % of
  turns Arceus clicks that move into Scizor; the open row shows "→ Typhlosion 14 %" etc.

## What the code does in doubles (`pick_command.c`, read 2026-11-03)
- Not independent. The FASTER AI Pokemon (`AI_IsClient2Faster`: Trick Room flips, Lagging Tail / Stall go last; a
  Speed tie keeps the slot the game asks first, confirm in-game) scores and picks first. Its table covers both of your
  Pokemon and its ally (`ScoreMovesAgainstAlly`); the target is rolled uniformly among targets with a top-scoring
  move, then the move uniformly among that target's tied moves.
- The slower one picks after, knowing the faster one's move (`partnerMoveNo`, `partnerClicksAttackingMove`). If the
  faster one picked a damaging move, both of your Pokemon are up, and it CAN OHKO one of yours with any move while
  moving first (`monCanOneShotPlayerWithAnyMove && aiMovesFirst`: what it could do, not what it picked; your
  opposite-slot Pokemon is checked first), the slower one ignores that Pokemon entirely (scores only your other one and
  its ally). Not faster than you: no ignore, so both can go into the same Pokemon.
- So the slower one's odds are a mixture: for each branch of the faster one's pick (with its probability), the slower
  one's conditional odds. The calc computes the faster one exactly, then the slower one per branch.
- Ally moves: `ScoreMovesAgainstAlly` scores Helping Hand (only if the partner's move attacks and isn't Helping Hand),
  Heal Pulse / Milk Drink / Pollen Puff (ally ≤ 50 %, not slower), Skill Swap combos, Decorate, Coaching ... as a
  third target. `BasicScoring` makes Helping Hand impossible into your Pokemon. So an ally move's % is into the ally
  and does not change with which of your Pokemon you view.
- Encore / choice lock: the locked move gets +1000 (`ScoreMovesAgainstDefender`): 100 % of the move picks. Taunt:
  status moves −IMPOSSIBLE (0 %). Disable / Torment / 0 PP: that move impossible.
- Hard switch: singles only (`isDoubleBattle == FALSE`), decided before the move (`CalculateSwitch`: a 0-99 roll
  against a score from the best switch-in's post-KO score and the damage variance). Encore / Taunt don't enter it
  directly; anything that changes the damage numbers or switch-in scores can move it. All numbers come from the port
  (the mockup's were sampled).

## Spec (UI)
| Control | State | Action | Result |
| --- | --- | --- | --- |
| Foe move row (foe card is the attacker) | AI on (the profile's AI switch: Hardlove) | – | A 30 px left column across both lines: the % (line 1, 12 px bold; 0 % muted) over the score (line 2, 9 px muted: `+8`, `+6/+8` for a random branch, `−20`, `Lock` for Encore / choice). The move name shrinks first as today. The row(s) with the highest % get a 3 px accent bar on the left edge. Status rows: the same column, the rest unchanged. |
| Foe move row | doubles | tap (open) | The open row lists every target: `→ <viewed> 40 % +8 · → <other> 14 % +6 · → ally <name> 6 %`, then the score branches (base, each random bonus and its chance). |
| Foe move row | doubles, a move scored only into the ally (Helping Hand ...) | – | The column shows its ally %, unchanged when you view your other Pokemon; score prefixed `A` (`A+6/+8`). |
| Foe card | singles, hard-switch chance > 0 | – | Chip `Sw 13%` on line 2 (left of the state tags; `fitCards` treats it like the battle-state tag). Move % + Sw % = 100. No "top pick" chip (the user reads it from the %). |
| Foe grid | singles / doubles | any change | Order as in Decided. A 9 px accent number at the top left of each benched, alive foe cell: its switch-in rank (1 = next out); none on the field or fainted. |
| Field → AI section | first section, ABOVE Global (the user changes it most) | expand / collapse (as the other sections) | A Player / Foe segment as the side toggles, then two-column toggle buttons for that side's viewed on-field Pokemon. |
| AI → Foe | – | – | First turn out (Auto: on when it just came in, off after the first damage tap to or from it; dashed outline + `·A` while Auto; a tap overrides until it leaves), Protect (cycles ×0 / last turn / 2 turns), Taunted, Encored (disabled until Last move is set; on = that move locked), Last move (select of its moves; also feeds choice lock with a Choice item, Torment ...), and whatever else the port needs that the calc can't know (Disable, sleep turns ...). |
| AI → Player | – | – | First turn out (Auto as above), Last move, Confused, Infatuated, Substitute, ... (what the AI reads about your Pokemon that the calc doesn't model). |
| Facts the calc already has | Seeded, Focus Energy, Laser Focus, screens, Tailwind, Dig / Fly, Toxic count, fainted (last mon), Speed | – | Not repeated in AI: the port reads the calc's own state. |
| Any AI toggle / Last move | – | change | Odds, Sw %, scores and the bench order recompute at once. |

Saved state: the AI toggles are battle state (scratch, per Pokemon; cleared on a switch, a new fight, ↺, and per
battle inside a gauntlet), so no new saved keys. The AI section's open state is stored as the other Field sections'.

## Spec (engine)
- `template/calc/ai/` (shared, inlined only with the profile's AI switch): the branch enumerator (each random bonus and
  the AI's damage roll per move; highest score per branch; ties split evenly; doubles: target roll then move roll; the
  slower Pokemon as a mixture over the faster one's branches), the switch-in ranking, the hard-switch %, the AI UI.
- Hardlove profile module: the port of `src/trainerai/` function by function (same names), using `calcDamage.c`'s
  formula where it differs from our engine (compare term by term first; list each gap in `hacks/hardlove-gold/notes.md`).
- Cost: the bonuses are per move, so enumerate per move and combine; doubles adds the slower one × the faster one's
  branches (≤ 12 target × move picks).

## Checks
| Requirement | Where | Assertion |
| --- | --- | --- |
| Odds = the C | node test under `tools/calc/` with fixtures | The AI doc's examples and the user's in-game tests: % per move, Sw %, bench order. |
| Sum to 100 | same | Per foe Pokemon, all pairs + Sw % = 100 (the largest takes the rounding remainder). |
| UI | new `tools/scenarios/calc-ai.mjs` (Hardlove), 260 × 316 normal / `dvkb`, 480 × 316 | Column on foe rows only with AI on; Encored disabled without Last move, then 100 % on that move; Taunted zeroes status rows; bench numbers match the order; AI above Global; no AI UI in other guides. |
| Layout | `calc-layout.mjs` | Closed rows stay 32 px; cards keep ≤ 3 lines with the Sw chip. |

## To settle
- In-game: the double-KO order (Decided); when your Pokemon faints the same turn, does the AI pick before seeing your
  replacement? The Speed-tie slot. That the partner-ignore keys on "can OHKO", not on the pick.
- The full AI → Foe / Player toggle list: from the port (each `ctx->` field the C reads that the calc lacks).
- Fixtures: can `data/battle_tests/` run the AI headless (exact expected picks)?
- Unbound / Radical Red AI is not public: no AI there.
