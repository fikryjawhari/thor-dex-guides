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

6. **Done (orchestrator, session 3):** `hzla_compare.mjs` lets the oracle work out a variable-power move's power natively when the fixture sets none, and takes species weights the same way as the engine (`src/names.js`); Photonic 111 match + 10 known, 0 errors. Was: **W2 shared oracle harness (new):** `tools/calc/hzla_compare.mjs:168-169` rejects all variable-power
   fixtures without `slot.bp` and lines 180-182 rename them `Guide fixed power`. W2 deliberately does not
   set power, so its ten new fixtures report `needs explicit power` errors, not damage mismatches. The same
   helper's `oracleGeneration()` uses 1 kg for unknown form names rather than `weightNames()`; preserve real
   form weights when adding native auto-power support. This is shared code outside this unit's ownership.
   Evidence: `.tmp/calc-refine/w2-photonic-oracle.mjs` loads the pinned oracle through the existing loader,
   retains native move names and verified stock weights, and compares **872 cases**, each automatic BP and
   all 16 rolls: ten fixtures, 54 weight/ratio boundary cases, 470 HP cases and 338 speed-stage cases. All
   agree. No oracle code or tables copied or shipped. The official comparator still has 101 matches,
   10 pre-existing known differences, zero mismatches and 10 W2 harness errors. Next: extend that shared
   adapter to native automatic power, then rerun the official command; do not add manual powers to W2.

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

## Unit W

### W2: stock weights and automatic power (2026-10-25)

- [x] Weight / auto-power moves: scoped audit, fixtures and formula checks complete; official comparator
  support for native automatic power remains **Needs Opus 6**, not an accepted all-green integration gate.

Photonic Sun uses unchanged Gen 7 weights. No species weight override is needed. The full 928-species
probe finds 878 direct stock lookups, 50 `weightNames()` fallbacks and zero 1 kg defaults. All 48 Megas
and both Primals resolve directly to stock forms; no hack-only Mega exists here. Nidoran gender IDs
remain distinct. Additional fallbacks beyond the supplied list are the five appliance Rotom forms,
White/Black Kyurem, Ash-Greninja, Flabebe (Red) and Ultra Necrozma.

Online weight reference checked 2026-10-25: [Bulbapedia, List of Pokemon by weight](https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_weight).
In particular [Minior](https://bulbapedia.bulbagarden.net/wiki/Minior_(Pok%C3%A9mon)) is **0.3 kg in Core
form**, not its 40 kg Meteor form. The engine already selects 0.3 kg for Red Core. No redundant override.
The following table includes every requested form plus every additional fallback; stock kg is the
unchanged Gen 7 weight checked against the reference, not a hack-weight modification.

| Guide form | Engine lookup | Engine kg | Stock kg | Verdict |
| --- | --- | --- | --- | --- |
| Nidoran♀ | Nidoran-F | 7 | 7 | Keep (stock) |
| Nidoran♂ | Nidoran-M | 9 | 9 | Keep (stock) |
| Castform (Normal) | Castform | 0.8 | 0.8 | Keep (fallback) |
| Deoxys (Normal) | Deoxys | 60.8 | 60.8 | Keep (fallback) |
| Burmy (Plant) | Burmy | 3.4 | 3.4 | Keep (fallback) |
| Wormadam (Plant) | Wormadam | 6.5 | 6.5 | Keep (fallback) |
| Cherrim (Overcast) | Cherrim | 9.3 | 9.3 | Keep (fallback) |
| Shellos (West Sea) | Shellos | 6.3 | 6.3 | Keep (fallback) |
| Shellos (East Sea) | Shellos | 6.3 | 6.3 | Keep (fallback) |
| Gastrodon (West Sea) | Gastrodon | 29.9 | 29.9 | Keep (fallback) |
| Gastrodon (East Sea) | Gastrodon | 29.9 | 29.9 | Keep (fallback) |
| Heat Rotom | Rotom-Heat | 0.3 | 0.3 | Keep (fallback) |
| Wash Rotom | Rotom-Wash | 0.3 | 0.3 | Keep (fallback) |
| Frost Rotom | Rotom-Frost | 0.3 | 0.3 | Keep (fallback) |
| Fan Rotom | Rotom-Fan | 0.3 | 0.3 | Keep (fallback) |
| Mow Rotom | Rotom-Mow | 0.3 | 0.3 | Keep (fallback) |
| Giratina (Altered) | Giratina | 750 | 750 | Keep (fallback) |
| Shaymin (Land) | Shaymin | 2.1 | 2.1 | Keep (fallback) |
| Basculin (Red-Striped) | Basculin | 18 | 18 | Keep (fallback) |
| Darmanitan (Standard) | Darmanitan | 92.9 | 92.9 | Keep (fallback) |
| Deerling (Spring) | Deerling | 19.5 | 19.5 | Keep (fallback) |
| Sawsbuck (Spring) | Sawsbuck | 92.5 | 92.5 | Keep (fallback) |
| Tornadus (Incarnate) | Tornadus | 63 | 63 | Keep (fallback) |
| Thundurus (Incarnate) | Thundurus | 61 | 61 | Keep (fallback) |
| Landorus (Incarnate) | Landorus | 68 | 68 | Keep (fallback) |
| White Kyurem | Kyurem-White | 325 | 325 | Keep (fallback) |
| Black Kyurem | Kyurem-Black | 325 | 325 | Keep (fallback) |
| Keldeo (Ordinary) | Keldeo | 48.5 | 48.5 | Keep (fallback) |
| Meloetta (Aria) | Meloetta | 6.5 | 6.5 | Keep (fallback) |
| Ash-Greninja | Greninja-Ash | 40 | 40 | Keep (fallback) |
| Vivillon (Icy Snow) | Vivillon | 17 | 17 | Keep (fallback) |
| Flabébé (Red) | Flabébé | 0.1 | 0.1 | Keep (fallback) |
| Floette (Red) | Floette | 0.9 | 0.9 | Keep (fallback) |
| Floette (Orange) | Floette | 0.9 | 0.9 | Keep (fallback) |
| Floette (White) | Floette | 0.9 | 0.9 | Keep (fallback) |
| Florges (Red) | Florges | 10 | 10 | Keep (fallback) |
| Furfrou (Natural) | Furfrou | 28 | 28 | Keep (fallback) |
| Meowstic (Male) | Meowstic | 8.5 | 8.5 | Keep (fallback) |
| Meowstic (Female) | Meowstic | 8.5 | 8.5 | Keep (fallback) |
| Pumpkaboo (Average) | Pumpkaboo | 5 | 5 | Keep (fallback) |
| Gourgeist (Average) | Gourgeist | 12.5 | 12.5 | Keep (fallback) |
| Xerneas (Neutral) | Xerneas | 215 | 215 | Keep (fallback) |
| Zygarde (50%) | Zygarde | 305 | 305 | Keep (fallback) |
| Zygarde (50%, Power Construct) | Zygarde | 305 | 305 | Keep (fallback) |
| Hoopa Confined | Hoopa | 9 | 9 | Keep (fallback) |
| Oricorio (Baile) | Oricorio | 3.4 | 3.4 | Keep (fallback) |
| Rockruff (Own Tempo) | Rockruff | 9.2 | 9.2 | Keep (fallback) |
| Lycanroc (Midday) | Lycanroc | 25 | 25 | Keep (fallback) |
| Wishiwashi (Solo) | Wishiwashi | 0.3 | 0.3 | Keep (fallback) |
| Minior (Red Core) | Minior | 0.3 | 0.3 | Keep (fallback) |
| Mimikyu (Disguised) | Mimikyu | 0.7 | 0.7 | Keep (fallback) |
| Ultra Necrozma | Necrozma-Ultra | 230 | 230 | Keep (fallback) |

Probe and complete audit: `.tmp/calc-refine/w2-photonic-probe.mjs` and `w2-photonic-weights.json`.

**Fixtures:** `w2-low-kick`, `w2-grass-knot`, `w2-heavy-slam`, `w2-heat-crash`, `w2-flail`,
`w2-reversal`, `w2-gyro-ball`, `w2-electro-ball`, `w2-regional-raichu`, `w2-mega-steelix`.
None sets `slot.bp`. Mega Steelix is a stock Mega (Photonic adds no hack-only Mega).

**Stock Gen 7 formulas confirmed, no profile rules added:** Low Kick / Grass Knot use >=10/25/50/100/200 kg
for 40/60/80/100/120 BP (otherwise 20); Heavy Slam / Heat Crash use attacker/defender weight ratios
>=2/3/4/5 for 60/80/100/120 (otherwise 40). Flail / Reversal use `p=floor(48*HP/maxHP)`,
p<=1/4/9/16/32 for 200/150/100/80/40 (otherwise 20), including p=32 at 40 BP. Gyro Ball is
`min(150,floor(25*defSpeed/atkSpeed)+1)`; Electro Ball uses floor(atkSpeed/defSpeed) 0/1/2/3/4+
for 40/60/80/120/150. Do not import Hardlove's non-stock inequalities or Gyro Ball rule here.

Sources: `@smogon/calc` 0.12.0 `dist/mechanics/gen789.js:537-576,633-637`; pinned hzla
`ff6c3e339e276e6b4e8e44db58750b6534bc26aa` `calc/mechanics/gen789.js:603-662,717-721`
(read/run locally only). No hack source claims changed bands. Native-oracle results above confirm them.

**Final checks (2026-10-25):** `npm test --prefix tools/calc`, `node tools/calc/photonic_check.mjs` and
`python -I tools/datajson.py hacks/photonic-sun/hack.json` pass. The Photonic checker verifies 928 weight
bands, 120 exact form/Mega/Primal/Alolan weights using adjacent Heavy Slam ratio boundaries, 54 synthetic
weight/ratio boundary cases, all 235 positive Snorlax HP values for both Flail/Reversal (470 cases), all
13x13 Speed-stage combinations for both Gyro/Electro Ball (338 cases), and ten no-power fixtures.
`node tools/calc/hzla_compare.mjs photonic-sun` exits 1 solely on the ten native-power harness errors
listed in Needs Opus 6; its original 111 rows retain 101 matches and 10 known differences. The independent
native-oracle probe passes all 872 cases. `git diff --check` passes. Logs: `.tmp/calc-refine/w2-photonic.log`;
official report: `.tmp/calc-photonic-sun/compare.json`. No weight/profile changes, shared engine changes,
template changes or raw author documents committed. Orchestrator's claim left untouched; never pushed.

### Orchestrator answers
1, 2. Settled: 3DS hacks take the game data over the doc (notes.md → Conflicts and findings already lists Triple
   Kick); Power Gem is the same case (game bp 80, PP 15). No calc or extract work.
3. Drill Peck: no work. The calc shows damage per crit / no crit (the per-move crit toggle); the crit chance is not
   shown, so a crit stage changes nothing the calc displays.
4. Z-moves: unit Z (plans/calc-refine.md) covers them.
