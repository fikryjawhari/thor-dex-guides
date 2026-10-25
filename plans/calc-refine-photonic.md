# Calc refinement: Photonic Sun move changes (survey S2)

Sources: `hacks/photonic-sun/.src/Move Changes.pdf` (Rebalanced only; text via pdfplumber, 4 pages) and the move notes
in `hacks/photonic-sun/data.json` (MV.h = dex comparison notes, 38; MV.e = the Move Changes doc paragraph, 43). There
is no source code for this hack: the hzla oracle settles behaviour in the batch units.

Counts (40 moves named in the doc, plus 5 TM-only entries):
- data: 29 (power / type / accuracy / PP only; already in the guide data)
- damage effect: 3
- out of scope: 8 (7 with a data part too, 1 pure: Toxic Thread) + 5 TM-only learnset changes
- Batches: 1
- Needs Opus: 4 items (below)

## Damage effect

### Batch 1
- [x] **Self-Destruct**: done. `over.rules` critical rule (value true, `names.move` in Self-Destruct / Explosion); no-flag rolls equal crit-flag rolls. Oracle does not crit it (1.5 ratio only with crit flag); oracle also halves Defense, open: Needs Opus 5. Fixtures `self-destruct-neutral` / `-critical`. now always a critical hit (was a normal hit; the doc says it "brings back some of the power"). Oracle test: pick a neutral matchup from `calc_matchups.json` that has Self-Destruct; run the oracle with no crit flag and with `isCrit` forced on. If the two match, the oracle already crits it and the guide must do the same with no flag set. If they differ, the oracle lacks the rule: the doc decides and the oracle row is marked as a known gap.
- [x] **Explosion**: done, same rule and fixtures `explosion-neutral` / `-critical` (defense-halving conflict: Needs Opus 5).
  Was:  now always a critical hit. Same test as Self-Destruct, on a matchup with Explosion.
- [x] **Drill Peck**: no work (orchestrator answer 3).
  Was:  critical hit stage 0 to 1 (1/8 chance instead of 1/24 in gen 9). The oracle gives one damage number, so a damage test only shows that a forced crit is the same as the base crit damage. The stage itself needs a crit-stage input: see Needs Opus 3.

## Data (already in the guide data; no calc work)

Comet Punch, Fly, Submission, Tail Slap, Shadow Punch, Water Pulse, Arm Thrust, Spike Cannon, Absorb, Mega Drain, Force Palm, Mud Bomb, Mystical Fire, Spirit Shackle, Darkest Lariat, Sparkling Aria, Freeze-Dry, Triple Kick, Power Gem, Needle Arm, Cross Poison, Disarming Voice, Rock Climb, Multi-Attack, Octazooka, Shell Trap, Dark Void, Gear Grind, Chatter

Two of these disagree with the doc: see Needs Opus 1 and 2.

## Out of scope

Secondary effects, status chance, healing, stat drops, learnsets. The power / PP part of the mixed ones is in the data.
- Wing Attack (power and PP are data; "now learned at higher levels" is a learnset change)
- Twineedle (power is data; effect chance 20% to 30%)
- Steel Wing (power and PP are data; effect chance 10% to 20%)
- Parabolic Charge (power and PP are data; HP restored 50% to 25%)
- Horn Leech (power is data; HP restored 50% to 30%)
- Draining Kiss (power is data; HP restored 75% to 50%)
- Rapid Spin (power is data; now boosts Speed)
- Toxic Thread (stat drops and poison: pure out of scope)
- TM-only learnset changes: Quash (TM60), Frost Breath (TM79), Confide (TM100), Brutal Swing (TM59), Smart Strike (TM67)

Z-Move power changes appear on about 20 moves in the doc. They are power values; they go to Needs Opus 4 if the calc models Z moves at all.

## Needs Opus

5. **Self-Destruct / Explosion Defense halving (new, found in batch 1)**: the pinned oracle halves the target's Defense
   (`.tmp/hzla/calc/mechanics/vanilla/gen789.js` ~1273, `move.named('Explosion', 'Self-Destruct', 'Misty Explosion')`,
   `pokeRound(defense / 2)`; not the " Null" branch). Oracle neutral Self-Destruct on Snorlax vs Blastoise: 244-250;
   ours and `@smogon/calc` (photonic_check reference): 123-126. Hardlove decided no halving (code wins; its notes
   `Explosion / Self-Destruct` row). Photonic has no source code and the doc does not mention halving (data `h`/`e`
   notes: only "Always a critical hit"). The four Self-Destruct / Explosion fixtures therefore stay `mismatch` in
   hzla_compare until decided. Decide: halve (oracle, stock Gen 5+ games), or no halving (ours, Hardlove precedent).
   The always-crit rule itself is checked by the crit ratio: oracle crit / neutral 1.5 and ours crit = neutral with the rule.

1. **Triple Kick**: the doc says power 10 to 20; `data.json` has bp 10 and no MV.h note. Check the extract, not the calc.
2. **Power Gem**: the doc says power 80 to 90 and PP 20 to 15; `data.json` has bp 80 (the MV.h note lists PP only). Same check as item 1.
3. **Drill Peck**: no damage-level oracle test for a crit-stage change. Decide whether the engine takes a crit-stage input (an engine phase) or the rule is checked only by a unit table.
4. **Z-Move power**: `calc-mechanics.md` says nothing about Z moves. Decide if the calc models them; if not, these stay out.

Minor: Horn Leech starts at 65 in the doc and 75 in the MV.h note; both end at 90, so nothing changes in the data.

Could not classify: none.

### Orchestrator answers
1, 2. Settled: 3DS hacks take the game data over the doc (notes.md → Conflicts and findings already lists Triple
   Kick); Power Gem is the same case (game bp 80, PP 15). No calc or extract work.
3. Drill Peck: no work. The calc shows damage per crit / no crit (the per-move crit toggle); the crit chance is not
   shown, so a crit stage changes nothing the calc displays.
4. Z-moves: unit Z (plans/calc-refine.md) covers them.
