# Eternal X calc refinement: move and item changes

Survey only (unit S3). Nothing here is a rule or a fixture; batch agents settle each row against the oracle.

## Sources and counts

- `hacks/eternal-x/.src/Move Changes.pdf`: 28 moves (Rebalanced only), text via pdfplumber.
- `hacks/eternal-x/.src/Item Changes _ Locations.pdf`: TM teaches, shop and item locations, wild held items, Big Root.
- `hacks/eternal-x/.src/Changelog.txt`: cross-check. It adds Rock Smash (power 60, Rebalanced) and says Frost Breath
  was buffed in V2.4 (Rebalanced); neither is in the PDF.
- `hacks/eternal-x/data.json` MV notes: 28 entries carry a note (`e` text, `dc` diff list). The brief said 38; the
  count in the data and the PDF is 28, so 38 was not found.
- `hacks/eternal-x/hack.json` → `cfg.calc`: base `gen6`, field toggles, one override (inverse battle). No item or move
  overrides, so the base profile's standard items apply.

Counts over the 30 changed moves (28 PDF + Rock Smash + Frost Breath):
- damage effect: 6
- data (power / type / accuracy / PP already in the guide): 21
- out of scope (healing, secondary effects): 2
- unclassified, needs Opus: 1 (Frost Breath)

Items: 0 damage-relevant changes in the PDF. Item rows below are none.

## Damage-effect moves

### Batch 1

- [x] **Cut**: done. Type already Grass in data (no rule); always-crit critical rule added. Oracle does not crit without the flag: neutral is a known difference (doc decides); `cut-critical` matches. Type fixtures carry the crit flag.
  Was:  type Normal → Grass; always a critical hit (PP 30 → 20 is data). Oracle test: Cut vs a Rock-type
  defender should be 2x (Normal would be 0.5x), vs Ghost neutral (Normal immune), vs Water 2x; with the crit setting
  off, damage should equal the crit value (x1.5 in gen 6).
- [x] **Strength**: done, no rule: Rock type in data; matches the oracle on Fire, Rock-user STAB (`strength-rock-user-stab`).
  Was:  type Normal → Rock (power 100 is data; the self Def / Sp. Def drop is out of scope). Oracle test:
  Strength vs Fire, Flying, Bug (2x), Fighting, Ground, Steel (0.5x), Ghost (neutral); a Rock-type user with Strength
  should get STAB.
- [x] **Drill Peck**: no work (orchestrator answer 2).
  Was:  critical hit ratio +1 (same as Slash / Leaf Blade). Oracle test: compare the calc's crit-chance
  output (if it shows one) for Drill Peck against Tackle. Damage on a fixed crit is unchanged, so if the oracle gives
  no ratio output, this row is a no-op for the calc (see Needs Opus).
- [x] **Self-Destruct**: done. Critical rule (Cut / Self-Destruct / Explosion); `self-destruct-neutral` is a known difference, `-critical` matches. No defense-halving conflict in gen 6 (oracle neutral = ours without the rule).
  Was:  always a critical hit (power 200 is data). Oracle test: with the crit setting off, the calc's
  damage should equal the oracle's crit damage against any neutral target.
- [x] **Explosion**: done, same rule and fixtures (`explosion-neutral` known difference, `-critical` matches).
  Was:  always a critical hit (power 250 is data). Oracle test: same as Self-Destruct.
- [x] **Triple Kick**: engine fixed (Opus): power x hit number, so 20 / 40 / 60 (tools/calc/test.mjs). In-game test. Was:  power 10 → 20 per hit (three hits: 20 / 40 / 60 if scaled). Oracle test: multi-hit total against a
  neutral target equals the sum of three hits at bp 20, 40 and 60; check the engine reads the power field, not a
  hard-coded 10.

## Data (already in the guide, nothing to do)

Fly, Submission, Chatter, Tail Slap, Shadow Punch, Arm Thrust, Spike Cannon, Absorb, Mega Drain, Force Palm, Mud Bomb,
Mystical Fire, Fell Stinger, Freeze-Dry, Steel Wing, Needle Arm, Cross Poison, Gear Grind, Power Gem, Disarming Voice,
Rock Smash.

## Out of scope (secondary effects, healing, status, AI)

Parabolic Charge (HP restored 50% → 25%), Draining Kiss (HP restored 75% → 50%). Also out of scope: Strength's stat drop,
Fell Stinger's on-KO effect (not implemented, only the power changed), Big Root's healing change (item, 30% → 100%).

## Items

No damage-relevant item changes. Item changes checked and classed as data or out of scope: TM teaches (TM48, 60, 49,
58, 100, 51, 79), shop and item locations, wild held items (Life Orb, Flame / Toxic Orb, the stones, the incenses,
the trade items, the fossils), Big Root (out of scope, see above), Mega Stone availability. Incense type boosts and
Metal Coat are held and used as before; only where they are found changed.

## Needs Opus

4. **Triple Kick (found in batch 1)**: data.json MV 166 bp 20 (doc: 10 => 20). The engine ignores it: with a
   1-, 2- or 3-hit slot, every hit is 5-6 damage (rolls for bp 10 on Snorlax vs Blastoise, Lv 50, 0 EVs), not 13-16
   (bp 20). The oracle gives 13-16 on each of 3 hits, so it uses bp 20 flat, no scaling. The oracle's gen 6 path
   hardcodes `hitIndex * 10` (`.tmp/hzla/calc/mechanics/gen56.js:438-441`); where our engine's 10 comes from is not traced.
   Decide: (a) flat 20 on every hit (the oracle; a `movePower` rule `value: 20` would do it, if the engine lets it
   override), or (b) scaling 20 / 40 / 60 (the stock Gen 5-6 shape with the new base). The doc does not say which.
   The fixture was removed while undecided (it fails the reference check, which uses the data power).
   Also an engine question: the stock hardcoded base power overriding the data field needs a fix in the engine,
   which is not this unit's file (tools/calc/src).

- **Frost Breath**: Changelog V2.4 says it was buffed (Rebalanced), but neither the PDF nor data.json shows a change.
  data.json has bp 60 / ac 90 / pp 10 (the vanilla values). Evidence: `Changelog.txt` line 151; `data.json` moves
  index 523. Settle from the romfs move data if available, not from the docs.
- **Drill Peck** crit ratio: a crit-chance change does not alter deterministic damage. Decide whether the calc should
  model crit chance at all (probably no); otherwise the row is a no-op.
- **Count**: the brief said 38 move notes; data.json and the PDF both have 28. Confirm the expected number.

### Orchestrator answers
1. Frost Breath: 3DS hacks take the game data over the docs; data.json is extracted from the romfs, so its values
   stand. Not a calc row.
2. Drill Peck: no work. The calc shows damage with / without crit (per-move toggle), not the crit chance.
3. 38 vs 28: a miscount in the brief; 28 is right.
Batch note: Cut's and Strength's types come from data.json (check that they read Grass / Rock there, then only the
always-crit part of Cut is a rule).
- (after batch 1) Triple Kick: shared engine fix in tools/calc/instrument.mjs. Power = the move's own power x the hit
  number (EI's expansion source does exactly this: battle_util.c EFFECT_TRIPLE_KICK), and Gen 5/6 now passes the hit
  number (stock left every hit at the first-hit power). Eternal X: 20 / 40 / 60; the oracle's flat 20 is wrong for
  hits 2-3. No oracle fixture (the stock reference loop can't express it); covered by test.mjs.


### W2: stock weights and automatic power (2026-10-25)

- [x] Weight audit: all 782 guide species, including 29 stock XY Megas.
- [ ] Automatic-power fixtures and boundary checks.
- [ ] Final checks and Damage calc notes.

Eternal X changes no weights (user's binding scope: unchanged Gen 6 data). The engine lookup probe
finds 746 direct stock matches, 36 weightNames() fallbacks and zero 1 kg defaults. Nidoran-F and
Nidoran-M resolve directly and remain distinct (7 and 9 kg). No weight override is needed; cfg.calc
is unchanged. Every directly named species, including all 29 Megas, uses its stock Gen 6 weight.
There are no regional forms, Primals or undocumented hack-only species in this guide.

Online reference checked 2026-10-25: [Bulbapedia, List of Pokemon by weight](https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_weight).
The complete form verdict table includes the supplied list plus eight additional fallback names:
five appliance Rotom, White/Black Kyurem and Flabebe (Red). These are stock forms, not hack additions.
Weights are kilograms; reference and engine columns agree in every row. Cosmetic/default forms
retain their stock base weight; specific Rotom/Kyurem stock forms are found before the base fallback.

| Guide species | Engine stock lookup | Reference kg | Engine kg | Verdict |
| --- | --- | ---: | ---: | --- |
| Nidoran♀ | Nidoran-F | 7 | 7 | Correct; stock, unchanged |
| Nidoran♂ | Nidoran-M | 9 | 9 | Correct; stock, unchanged |
| Castform (Normal) | Castform | 0.8 | 0.8 | Correct; fallback, unchanged |
| Deoxys (Normal) | Deoxys | 60.8 | 60.8 | Correct; fallback, unchanged |
| Burmy (Plant) | Burmy | 3.4 | 3.4 | Correct; fallback, unchanged |
| Wormadam (Plant) | Wormadam | 6.5 | 6.5 | Correct; fallback, unchanged |
| Cherrim (Overcast) | Cherrim | 9.3 | 9.3 | Correct; fallback, unchanged |
| Shellos (West Sea) | Shellos | 6.3 | 6.3 | Correct; fallback, unchanged |
| Gastrodon (West Sea) | Gastrodon | 29.9 | 29.9 | Correct; fallback, unchanged |
| Heat Rotom | Rotom-Heat | 0.3 | 0.3 | Correct; fallback, unchanged |
| Wash Rotom | Rotom-Wash | 0.3 | 0.3 | Correct; fallback, unchanged |
| Frost Rotom | Rotom-Frost | 0.3 | 0.3 | Correct; fallback, unchanged |
| Fan Rotom | Rotom-Fan | 0.3 | 0.3 | Correct; fallback, unchanged |
| Mow Rotom | Rotom-Mow | 0.3 | 0.3 | Correct; fallback, unchanged |
| Giratina (Altered) | Giratina | 750 | 750 | Correct; fallback, unchanged |
| Shaymin (Land) | Shaymin | 2.1 | 2.1 | Correct; fallback, unchanged |
| Basculin (Red-Striped) | Basculin | 18 | 18 | Correct; fallback, unchanged |
| Darmanitan (Standard) | Darmanitan | 92.9 | 92.9 | Correct; fallback, unchanged |
| Deerling (Spring) | Deerling | 19.5 | 19.5 | Correct; fallback, unchanged |
| Sawsbuck (Spring) | Sawsbuck | 92.5 | 92.5 | Correct; fallback, unchanged |
| Tornadus (Incarnate) | Tornadus | 63 | 63 | Correct; fallback, unchanged |
| Thundurus (Incarnate) | Thundurus | 61 | 61 | Correct; fallback, unchanged |
| Landorus (Incarnate) | Landorus | 68 | 68 | Correct; fallback, unchanged |
| White Kyurem | Kyurem-White | 325 | 325 | Correct; fallback, unchanged |
| Black Kyurem | Kyurem-Black | 325 | 325 | Correct; fallback, unchanged |
| Keldeo (Ordinary) | Keldeo | 48.5 | 48.5 | Correct; fallback, unchanged |
| Meloetta (Aria) | Meloetta | 6.5 | 6.5 | Correct; fallback, unchanged |
| Vivillon (Icy Snow) | Vivillon | 17 | 17 | Correct; fallback, unchanged |
| Flabébé (Red) | Flabébé | 0.1 | 0.1 | Correct; fallback, unchanged |
| Floette (Red) | Floette | 0.9 | 0.9 | Correct; fallback, unchanged |
| Floette (Yellow) | Floette | 0.9 | 0.9 | Correct; fallback, unchanged |
| Florges (Red) | Florges | 10 | 10 | Correct; fallback, unchanged |
| Furfrou (Natural) | Furfrou | 28 | 28 | Correct; fallback, unchanged |
| Meowstic (Male) | Meowstic | 8.5 | 8.5 | Correct; fallback, unchanged |
| Meowstic (Female) | Meowstic | 8.5 | 8.5 | Correct; fallback, unchanged |
| Pumpkaboo (Average) | Pumpkaboo | 5 | 5 | Correct; fallback, unchanged |
| Gourgeist (Average) | Gourgeist | 12.5 | 12.5 | Correct; fallback, unchanged |
| Xerneas (Neutral) | Xerneas | 215 | 215 | Correct; fallback, unchanged |

Probe and full 782-row audit: .tmp/calc-refine/w2-eternal-probe.mjs and w2-eternal-weights.json.
Execution/check log: .tmp/calc-refine/w2-eternal.log. No source tables or oracle code were copied.

#### W2 Needs Opus

None from the weight audit. Regional-form fixture is not applicable: none exists in the guide.
