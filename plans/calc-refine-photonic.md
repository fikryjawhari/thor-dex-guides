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

The doc explicitly changes Z-Move power for 16 moves. Z2 tests every target; five need an orchestrator verdict (Needs Opus 4).

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
4. **Done (orchestrator, session 3):** the doc's Z powers are the hack's own per-move values, not the band: `cfg.calc.zpow` lists all 16 and wins in the engine; all 16 pass; Arm Thrust, Twineedle, Power Gem are known oracle differences (oracle uses the band). Was: **Needs Opus (Z2 doc-power verdict, 2026-10-25):** conversion support is implemented in engine
   `580f021`; fixtures `b73d0ab`, `3ffed9b` and checks `e0d94c1` exercise `slot.z: 1` without `slot.bp`.
   This supersedes the earlier Z deferral. All 25 conversion names, categories and single-hit results pass,
   including Pikachu + Pikanium Z + Volt Tackle = Catastropika (guide power 210). Eleven of the sixteen
   explicit doc powers pass, but the five rows below fail. Do not mark this item Done or call the unit
   all-green until the orchestrator settles those rows. No shared engine, profile, extract or UI changes
   were made by this test worker. The per-move Z button belongs to the UI step.

   | Move | Engine BP | Doc target BP | Oracle BP | Evidence / judgement needed |
   | --- | --- | --- | --- | --- |
   | Arm Thrust | 100 | 140 | 100 | Text line 15; guide power 25 uses the 100 band, not the doc's explicit 140. |
   | Mystical Fire | 160 | 170 | 140 | Text line 21; guide power 85 uses the 160 band; 170 is not a band. |
   | Freeze-Dry | 175 | 180 | 140 | Text line 31; guide power 95 uses the 175 band, not 180. |
   | Twineedle | 100 | 175 | 100 | Text line 34; guide power 45 uses the 100 band; Z is one hit. |
   | Power Gem | 160 | 175 | 160 | Text line 39; game power 80 is authoritative (answers 1, 2 below), unlike doc power 90. Decide Z separately; do not change extracted data to make a test pass. |

   Evidence: `tools/calc/photonic_check.mjs` -> `documentedZPowers` and the five `FAIL Photonic Z2`
   lines in `.tmp/calc-refine/z2-photonic.log`. Damage is compared with a fixed-power, single-hit control
   of the same type/category (Tackle or Psychic with `bp`/`t`, no `z`). A neutral move avoids carrying
   Freeze-Dry's Water effectiveness, multi-hit behaviour or other base-move mechanics into the Z control.
   Z fixtures never set power. Arm Thrust, Twineedle and Double Kick set `hits: 1` only because the shared
   oracle wrapper reapplies the original hit count after conversion; separate engine assertions force
   `hits: 5` and require one hit with unchanged rolls. No harness change or copied oracle tables.

   Doc data, transcribed from `Move Changes.pdf`, Rebalanced, printed pages 1-2
   (`.src/txt/Move Changes.txt` lines below). These are the doc's before/after values, not independently
   verified stock powers; preserve even surprising before values. All sixteen after values are asserted.

   | Base move | Doc Z power, before -> after | Text line |
   | --- | --- | --- |
   | Wing Attack | 120 -> 160 | 6 |
   | Submission | 160 -> 175 | 9 |
   | Chatter | 120 -> 175 | 10 |
   | Shadow Punch | 120 -> 160 | 12 |
   | Water Pulse | 120 -> 160 | 13 |
   | Arm Thrust | 100 -> 140 | 15 |
   | Mystical Fire | 120 -> 170 | 21 |
   | Parabolic Charge | 120 -> 175 | 23 |
   | Horn Leech | 120 -> 175 | 25 |
   | Draining Kiss | 100 -> 140 | 26 |
   | Freeze-Dry | 140 -> 180 | 31 |
   | Twineedle | 100 -> 175 | 34 |
   | Steel Wing | 140 -> 175 | 38 |
   | Power Gem | 120 -> 175 | 39 |
   | Needle Arm | 120 -> 175 | 40 |
   | Cross Poison | 140 -> 175 | 41 |

Minor: Horn Leech starts at 65 in the doc and 75 in the MV.h note; both end at 90, so nothing changes in the data.

Could not classify: none.

## Totem data (step 7)

- 2026-10-25 checkpoint 1: hand-checked all 13 tables (33 mons) in the local `Totem Battles.txt`;
  shifted row labels make automatic parsing unsafe. `.src/` already exists here; no main-checkout copy needed.
- Cross-check: all 653 game trainer records, including 38 teams using listed Totem species, contain no
  matching Totem encounter. No existing TR Totems to enrich. The doc supplies these wild/SOS sets and auras.
  No hzla code or tables copied.
- Allies follow the lead in `p`, not `pt`: `template/dex.js` line 664 reserves `pt` for the player's partner.
  Use the existing `Prismatic Moon` version tag for Raticate.
- Initial data table only; integration, schema, source notes and assertions follow in checkpoint 2.
- Checkpoint 1 gates: npm test, photonic_check, hzla_compare (118 matches / 28 known / 0 mismatches / 0 errors),
  extract/check.py and datajson hack canonicalisation all exit 0. Log: `.tmp/calc-refine/totem.log`.
- Needs Opus (step 7): the doc calls Togedemaru's ally only "Rotom" but gives Hydro Pump. Preserve base Rotom
  pending a verdict on Wash Rotom; trainer archives do not resolve the form. IVs are absent from the doc;
  rendering requires `iv[6]`, so label 31-IV assumptions explicitly rather than claim game evidence.
- Ultra Necrozma's doc level 100 stays separate from the user-selected cap 95.
- Rematches follow Ilima's post-game battle: walkthrough Part 34 describes taking his Normalium Z to Verdant Cavern.

## Unit Z

- [x] **Z2 conversion fixtures/check block:** engine `580f021`; fixture commits `b73d0ab`, `3ffed9b`;
  check block `e0d94c1`. Added 25 no-power Z fixtures (all 16 doc moves plus nine band/stock/edge cases).
- [ ] **Z2 doc-power acceptance:** Needs Opus 4 has five failures; not Done and not eligible for an all-green merge.
- [x] **Totem aura:** covered by manual stat stages; no aura automation or other work.

### Z2 checks (2026-10-25)

Changed-move bands covered: 100 (Absorb), 120 (Mega Drain, changed from stock 40 to 60), 140 (Draining Kiss),
160 (Wing Attack), 175 (Chatter), 180 (Sparkling Aria), 190 (Multi-Attack). Earthquake stays 180;
Weather Ball is the unchanged-power stock exception (base 50, Z 160, not the 100 band); Low Kick is 160
without a manual power; Double Kick converts to one hit; Catastropika is 210. All use `z: 1`, no `bp`.

The oracle reports 121 matches, 25 known differences, zero unannotated mismatches/errors across 146
fixtures. Z2 adds 10 matches and 15 source-annotated oracle differences; the older 121 cases remain
111 matches plus 10 known differences after the orchestrator's W2 harness fix. The oracle uses stock
Z powers for these 15: Wing Attack, Submission, Chatter, Shadow Punch, Water Pulse, Mystical Fire,
Parabolic Charge, Horn Leech, Draining Kiss, Freeze-Dry, Steel Wing, Needle Arm, Cross Poison,
Sparkling Aria and Multi-Attack. Each fixture cites its doc text line. Mystical Fire and Freeze-Dry
disagree with the doc on both sides, explicitly recorded rather than accepted as correct engine output.

Before every Z2 commit: `npm test --prefix tools/calc` and `node tools/calc/photonic_check.mjs` exit 1
(first fixture checkpoints lacked the new Z reference block; the finished block reports precisely the
five doc-power failures above). Existing Photonic field/W2 checks and the 25 Z name/category/hit checks
pass. The aggregate npm command stops at Photonic, so Eternal is not reached by that command.
`node tools/calc/hzla_compare.mjs photonic-sun` and
`python -I tools/datajson.py hacks/photonic-sun/hack.json` exit 0 after each annotated fixture group.
`git diff --check` passes. Full log: `.tmp/calc-refine/z2-photonic.log`;
oracle details: `.tmp/calc-photonic-sun/compare.json`. No push; orchestrator's claim untouched.

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
