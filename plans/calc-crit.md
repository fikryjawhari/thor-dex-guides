# Critical-hit survey (U5, 2026-10-26)

Scope C handoff for U6. Source/game data wins over descriptions and author documents. This is a rules survey,
not an engine-derived oracle. No hzla code or tables were copied. `cr` below is the proposed sparse `MV.cr` field;
the inventories enumerate every non-zero source entry, including entries not exposed by the guide.

## Result and fixture contract

Agreed with the orchestrator on 2026-10-26:
- `crit.stage` counts move stage + active Focus Energy + eligible held item + Super Luck, capped at the top index
  of the hack's table: I/P/E cap 3; H cap 4. A move's `cr >= 6` is a forced-crit sentinel, NOT six counted stages.
- `crit.p` is that table's fraction (not a percentage). A forced hit has p 1. Battle Armor / Shell Armor, or a
  future Lucky Chant input, overrides this to p 0 and forced false WITHOUT erasing counted stage.
- `crit.forced` is true for `cr >= 6` / stock `willCrit`, Merciless on poison or toxic poison, Laser Focus, OR a
  counted stage whose table probability is 1. Guarantees apply even with `slot.crit: false`; manual `slot.crit: true`
  selects a critical-damage scenario but does not itself change the chance or make a random hit guaranteed.
- Fixtures use `atk.ab` / `def.ab` as numeric global `AB` indices (`-1` = none), `atk.it` as the item name,
  `def.st: 'psn'` or `'tox'`, and attacker-side `field.atkFocus: true`. `defFocus` is the other side and must not
  raise the attacker's stage. Move indices refer to each guide's `M`, never national move numbers.
- `atkFocus` means the pumped state has ALREADY been established, not that the status move or consumable is being
  used in this hit. Dire Hit and activated/consumed Lansat can share this state; simply holding Lansat does nothing.

No input keys are invented in fixtures. Deferred states: propose `atkLaserFocus` / `defLaserFocus` (boolean active
timer), `atkLuckyChant` / `defLuckyChant` (boolean protected side), and `atkDragonCheer` / `defDragonCheer` (0, 1 or 2
already-established pumped stages, mutually exclusive with Focus). These are proposals only, NOT the approved
contract. H's Dragon Cheer is not implemented at this pin anyway. No Laser Focus, Lucky Chant or Dragon Cheer
fixtures. Affection/friendship and H's overworld enemy-side crit boost likewise lack inputs and are not inferred.

## Per-generation rules

Reference: [Bulbapedia, Critical hit, Probability and Stage modifiers](https://bulbapedia.bulbagarden.net/wiki/Critical_hit#Probability_2),
read 2026-10-26. Stages are additive, subject to one held item and the mutually exclusive pumped state.

| Counted stage | Gen 3 / 4 / 5 | Gen 6 | Gen 7+ |
| ---: | ---: | ---: | ---: |
| 0 | 1/16 | 1/16 | 1/24 |
| 1 | 1/8 | 1/8 | 1/8 |
| 2 | 1/4 | 1/2 | 1/2 |
| 3 | 1/3 | 1 | 1 |
| 4+ | 1/2 | 1 | 1 |

Gen 3 is shown because EI is an Emerald hack, but EI explicitly replaces those odds with modern odds.
Gen 4-5 caps at 4 with NO stage-only guarantee; Gen 6+ effectively saturates at 3. H retains a five-entry table
despite using Gen 6 probabilities. Critical damage is 2x in Gen 3-5 and 1.5x from Gen 6; chance and damage are
separate settings (H's function returns a multiplier token of 2, not proof of 2x final damage).

### Every requested source and stacking

| Source | Ordinary rule | Composition / limits |
| --- | --- | --- |
| High-crit attacking move | +1; explicitly marked special moves can be +2 | Adds to other sources. Use game data, not a name whitelist. |
| Always-crit move | Guarantee, not a stage addition | Still blocked by Armor / Lucky Chant. |
| Scope Lens / Razor Claw | +1 | One held item; cannot equip both. |
| Stick / Leek | +2 for Farfetch'd, and Sirfetch'd where present | Not Chansey, Blissey or an arbitrary holder. EI exception below. |
| Lucky Punch | +2 for Chansey only | Not Blissey or Happiny. |
| Super Luck | +1 | Stacks with move, eligible item and pumped state. Sniper changes damage, NOT stage. |
| Focus Energy / Dire Hit | +2 pumped state (Gen 3 onward) | Do not stack with each other or repeated uses. |
| Lansat Berry | On activation establishes the same +2 pumped state | Not a permanent held-item +2; no extra +2 if already pumped. H held-path defect below. |
| Dragon Cheer | +1 pumped for a non-Dragon recipient, +2 for a Dragon recipient | Ally recipient in doubles; mutually exclusive with Focus / Dire Hit / Lansat pumped state. |
| Laser Focus | Guaranteed hits until end of next turn | No stage addition; Armor / Lucky Chant still block. |
| Merciless | Guaranteed crit if defender is poisoned, including toxic poison | No stage addition; not activated by burn or poison on the attacker. |
| Battle Armor / Shell Armor | Prevent critical hits | p 0 even at cap / with a guaranteed move; ability-ignoring interactions are separate. |
| Lucky Chant | Prevents critical hits on protected side for five turns | Blocks even guaranteed sources. No input key in this pass. |

Pumped-state details: [Focus Energy](https://bulbapedia.bulbagarden.net/wiki/Focus_Energy_(move)),
[Dire Hit](https://bulbapedia.bulbagarden.net/wiki/Dire_Hit),
[Lansat Berry](https://bulbapedia.bulbagarden.net/wiki/Lansat_Berry),
[Dragon Cheer](https://bulbapedia.bulbagarden.net/wiki/Dragon_Cheer_(move)). Dire Hit 2 / 3 are Wonder Launcher-only
Gen 5 variants (+2 / +3); they are not ordinary held crit items and are not inferred from `atk.it` in these guides.
Guarantees: [Laser Focus](https://bulbapedia.bulbagarden.net/wiki/Laser_Focus_(move)),
[Merciless](https://bulbapedia.bulbagarden.net/wiki/Merciless_(Ability)). Species item restrictions and stacking:
[Stick](https://bulbapedia.bulbagarden.net/wiki/Leek),
[Lucky Punch](https://bulbapedia.bulbagarden.net/wiki/Lucky_Punch),
[Super Luck](https://bulbapedia.bulbagarden.net/wiki/Super_Luck_(Ability)).

## I: Emerald Imperium 1.3.1

Authority: [iriv24/pokeemerald-expansion, 2576d0f3f4c861c760f0c55198e37e6d7b91683e](https://github.com/iriv24/pokeemerald-expansion/tree/2576d0f3f4c861c760f0c55198e37e6d7b91683e).
Local read-only evidence: `.tmp/source/{battle.h,battle_script_commands.c,battle_util.c,moves_info.h}` and
`.tmp/u5/ei_items.h` (downloaded `src/data/items.h` at the same pin). Paths below are repository paths at that pin.

- `include/config/battle.h:5-6`: B_CRIT_CHANCE / B_CRIT_MULTIPLIER = GEN_LATEST (release Gen 9);
  `:65` B_UPDATED_MOVE_DATA = GEN_LATEST. `:251` disables affection mechanics. Not vanilla Emerald's Gen 3 odds.
- `src/battle_script_commands.c:1930-1942`: tables `{24,8,2,1,1}`, `{16,8,2,1,1}`, `{16,8,4,3,2}` and selection.
  U6's Gen 7+ result contract normalises the redundant final entry away, cap 3. `:1981-2027` counts sources and
  blocks Lucky Chant first, then checks Laser Focus / move alwaysCriticalHit / Merciless, then Armor.
- `:1956-1979`: Scope Lens effect +1; Lucky Punch +2 only Chansey; **Leek +1 Farfetch'd (base species, including
  Galarian), +2 Sirfetch'd**. This is an EI-specific departure from the usual +2 for both ducks.
  `src/data/items.h:6928/6962/8324/8695/10159` maps Leek / Punch / Lens / Claw / Lansat to those effects.
  Razor Claw uses the SAME effect as Scope Lens; the narrow switch is not evidence that Claw lacks its boost.
- `src/battle_script_commands.c:1997-2003`: Focus +2, non-Dragon Cheer +1, per-move stage, item, Super Luck +1,
  bonusCritStages. `:12734-12748` enforces one pumped state; Dragon Cheer on a Dragon uses Focus +2.
  Dragon Cheer exists in the source catalogue but is not exposed in this guide's M. No extra UI input is inferred.
- `src/battle_util.c:7378-7390`, `:7557-7567`, `:7826-7834`: Lansat's critical-up effect sets Focus, only if not
  already pumped. `src/battle_script_commands.c:1989-1991` implements Laser Focus and Merciless, both present in EI.
- Compared with ordinary modern moves: **Razor Shell 0 -> 1** (`moves_info.h:13283`); **Snipe Shot 1 -> 2**
  (`:17162`); Zippy Zap is always critical here (`:16802`), retaining its Let's Go-style behaviour instead of
  later evasion-boost behaviour. All six always-crit moves are in the inventory below.
- The Changes workbook, Move Changes rows 27 / 43, agrees on Snipe Shot +2 / Razor Shell +1. **Doc says** Aqua Tail
  has +1 crit (row 94), but `src/data/moves_info.h:10018-10038` has ordinary EFFECT_HIT, NO criticalHitStage or
  alwaysCriticalHit: **cr 0**. Shadow Claw / Attack Order remain +1, not +2 merely because the doc mentions them.

### I complete non-zero move inventory

Source column: `src/data/moves_info.h`, `.criticalHitStage`, or `.alwaysCriticalHit` represented as `cr: 6`.
Sky Attack's conditional stage is 1 because B_UPDATED_MOVE_DATA >= GEN_3. Guide indices are current M indices.

| Move | cr | Source line | Guide MV index |
| --- | ---: | ---: | ---: |
| Karate Chop | 1 | 167 | 427 |
| Razor Wind | 1 | 433 | 254 |
| Razor Leaf | 1 | 1955 | 388 |
| Sky Attack | 1 | 3634 | 253 |
| Crabhammer | 1 | 3864 | 396 |
| Slash | 1 | 4130 | 79 |
| Aeroblast | 1 | 4501 | 633 |
| Cross Chop | 1 | 6003 | 421 |
| Blaze Kick | 1 | 7531 | 128 |
| Air Cutter | 1 | 7914 | 111 |
| Poison Tail | 1 | 8598 | 258 |
| Leaf Blade | 1 | 8754 | 395 |
| Night Slash | 1 | 10004 | 316 |
| Shadow Claw | 1 | 10501 | 92 |
| Psycho Cut | 1 | 10689 | 525 |
| Cross Poison | 1 | 11006 | 200 |
| Stone Edge | 1 | 11107 | 329 |
| Attack Order | 1 | 11357 | 664 |
| Spacial Rend | 1 | 11495 | 674 |
| Storm Throw | 6 | 12007 | 566 |
| Frost Breath | 6 | 13056 | 373 |
| Drill Run | 1 | 13169 | 213 |
| Razor Shell | 1 | 13283 | 510 |
| Zippy Zap | 6 | 16802 | 280 |
| Snipe Shot | 2 | 17162 | 623 |
| Wicked Blow | 6 | 18503 | 667 |
| Surging Strikes | 6 | 18528 | 448 |
| Esper Wing | 1 | 19031 | 593 |
| Triple Arrows | 1 | 19097 | 637 |
| Flower Trick | 6 | 19678 | 690 |
| Aqua Cutter | 1 | 20158 | 580 |
| Ivy Cudgel | 1 | 20426 | 785 |
| 10,000,000 Volt Thunderbolt | 2 | 21009 | not exposed |

### I extract handoff: choose (a)

Current route: `hacks/emerald-imperium/extract/eidex.py:11-18` loads `.src/repos/eidex.zip` moveData and Showdown;
`extract/dex.py:48-70` builds M/MV from eidex move IDs, selecting moves used by retained species. eidex moveData
contains NO per-move crit field; Showdown cache likewise strips it. Do not infer stages from description text.
The pinned public game's `src/data/moves_info.h` DOES provide clean fields; use that source to emit sparse `MV.cr`
alongside the existing move construction. The present source copy is in `.tmp/source/`, NOT a durable extract input:
the orchestrator must add a pinned fetch/cache under `.src/` and document its refetch before wiring the extract.
Use display name / move constant mapping and resolve the one config condition. `alwaysCriticalHit` maps to 6.
Choose **(a), data.json `cr`**, not (b); source acquisition is necessary, not a reason for a permanent hack.json list.
32 guide moves non-zero; one additional source Z-move is listed but not exposed by M.

## H: Hardlove Gold 0.8.3

Authority: [kumakuma1/hardlove, f1b236300187a2b18bf1a0b5ee1f80b3a2fed57b](https://github.com/kumakuma1/hardlove/tree/f1b236300187a2b18bf1a0b5ee1f80b3a2fed57b).
Data is in `hacks/hardlove-gold/.src/repos/hardlove/`; COMMIT matches that pin. Battle code evidence is cached in
`.tmp/calc-hardlove-gold/source/`, supplemented with raw pinned scripts and battle_item.c in `.tmp/u5/`.

- `src/battle/other_battle_calculators.c:1720-1727`: **{16,8,2,1,1}**, Gen 6 odds, NOT Gen 4 odds nor Gen 9 base 1/24.
  `:1754-1757` counts Focus +2, Lens/Claw +1, move critical_count, Super Luck +1, Punch +2 Chansey, Leek +2
  Farfetch'd / Sirfetch'd. `:1767-1769` caps at 4; Laser Focus also forces the native table index to 4.
  The result contract keeps Laser Focus separate from counted stage rather than exposing that implementation detail.
- `:1776-1787`: Merciless on poison, ALWAYS_CRITICAL and HIT_THREE_TIMES_ALWAYS_CRITICAL guarantee a crit;
  Battle Armor / Shell Armor (with MoldBreakerAbilityCheck), Lucky Chant and MOVE_EFFECT_FLAG_NO_CRITICAL block.
  All relevant abilities are exposed in AB. `doc/Mechanics.txt:20-21` agrees on base 1/16 and 1.5x crit damage.
- `include/config.h:6` enables HLG_CUSTOM_WEATHER. `other_battle_calculators.c:1759-1764` adds +1 to enemy slots
  1/3 when the permanent overworld weather flag is active and its variable is 7/8. This is not ordinary rain/snow
  supplied through `field.weather`; no compatible input exists, so omit rather than silently infer it.
- `data/itemdata/itemdata.c:15094/21204/16654/16849/13404` has Lens / Claw / Punch / Leek / Lansat effects.
  Source item is Leek (old Stick naming may be an input alias, not a second stacking item). Dire Hit's data
  `:3654-3717` includes critrate_stages 1, the item-use marker, not a held-item bonus to add on every attack.
- **Pinned Lansat defect / boundary:** `src/battle/battle_item.c:500-507` checks low HP and no Focus but dispatches
  HELD_ITEM_SHARPLY_RAISE_STAT, not HELD_ITEM_RAISE_CRIT. Its `data/battle_scripts/subscripts/
  subscript_0210_HELD_ITEM_SHARPLY_RAISE_STAT.s:17-22` updates a temporary stat, not Focus.
  `src/battle/battle_script_commands.c:5145-5148` has the same dispatch for its berry-eat path.
  The stolen/Fling effect route **does** select HELD_ITEM_RAISE_CRIT (`battle_item.c:815-818`), so use actual
  `atkFocus` after that state is established, not automatic '+2 for holding Lansat'. Do not repair native berry AI here.
- **Doc/description says** Dragon Cheer boosts crit, more for Dragon types, but `data/Moves.c:24736-24764`
  gives it MOVE_EFFECT_HIT (effect at :24743), and `moves/move_script_0916_DRAGON_CHEER.s:7` just GoToEffectScript.
  No Dragon Cheer crit state is implemented by this source path. **Description says** Ivy Cudgel is high crit;
  `data/Moves.c:24500` is ordinary HIT, hence **cr 0**, not modern +1. Razor Shell `:14510` is defence-drop, cr 0;
  Zippy Zap `:19775` is evasion-up, not its earlier Let's Go guaranteed-crit version. Snipe Shot `:20207` is +1,
  NOT EI's +2. H's Move Changes workbook has no crit-specific row to override these source effects.

### H complete non-zero move inventory

Source column: `data/Moves.c`, `.data.effect`. No numeric crit field exists, but effect constants give clean values.
HIGH_CRITICAL, its BURN_HIT / POISON_HIT variants, CHARGE_TURN_HIGH_CRIT(_FLINCH), and
HIGH_CRITICAL_RAISE_SPEED_HIT each add 1; ALWAYS_CRITICAL / HIT_THREE_TIMES_ALWAYS_CRITICAL map to 6.
Evidence: `src/battle/battle_script_commands.c:1103-1105` maps burn/poison variants to HIGH_CRITICAL;
`effects/effect_script_0043_HIGH_CRITICAL.s:7`, `0039_CHARGE_TURN_HIGH_CRIT.s:18`,
`0075_CHARGE_TURN_HIGH_CRIT_FLINCH.s:17`, `0368_HIGH_CRITICAL_RAISE_SPEED_HIT.s:7` each add one to
BSCRIPT_VAR_CRITICAL_BOOSTS before CalcCrit. Do not miss the two charge-turn effects in a HIGH_CRITICAL-only grep.

| Move | cr | Source line | Guide MV index |
| --- | ---: | ---: | ---: |
| Karate Chop | 1 | 65 | 419 |
| Razor Wind | 1 | 362 | 363 |
| Razor Leaf | 1 | 2036 | 7 |
| Sky Attack | 1 | 3872 | 184 |
| Crabhammer | 1 | 4115 | 512 |
| Slash | 1 | 4412 | 33 |
| Aeroblast | 1 | 4790 | 595 |
| Cross Chop | 1 | 6437 | 414 |
| Blaze Kick | 1 | 8084 | 470 |
| Air Cutter | 1 | 8489 | 115 |
| Poison Tail | 1 | 9245 | 237 |
| Leaf Blade | 1 | 9407 | 455 |
| Night Slash | 1 | 10811 | 211 |
| Shadow Claw | 1 | 11378 | 230 |
| Psycho Cut | 1 | 11540 | 450 |
| Cross Poison | 1 | 11891 | 359 |
| Stone Edge | 1 | 11999 | 256 |
| Attack Order | 1 | 12269 | 616 |
| Spacial Rend | 1 | 12431 | 624 |
| Storm Throw | 6 | 13052 | 544 |
| Frost Breath | 6 | 14240 | 490 |
| Drill Run | 1 | 14375 | 105 |
| Snipe Shot | 1 | 20207 | 699 |
| Wicked Blow | 6 | 22151 | 715 |
| Surging Strikes | 6 | 22178 | 763 |
| Esper Wing | 1 | 22772 | 764 |
| Flower Trick | 6 | 23582 | 717 |
| Aqua Cutter | 1 | 24257 | 641 |

### H extract handoff: choose (a)

`hacks/hardlove-gold/extract/hgsource.py:19` already parses data/Moves.c into `HG.MV`;
`extract/dex.py:385-439` builds M/MV from the retained move set and overlays `.data` / `.battle` source values.
Read `g['data']['effect']` in that overlay, map the effect families above to 1 or 6, omit zeros. No new source fetch
or runtime move-name list is needed. Choose **(a), data.json `cr`**, for all 28 non-zero guide moves.

## P: Photonic Sun 2.38 Rebalanced

Authority: `hacks/photonic-sun/.src/dex-rebalanced.json`, the hacked USUM move tables dumped by tools/ctr_dex.py.
Compare with the same directory's dex-vanilla.json, not online descriptions. Gen 7 native crit odds apply; no
game-code edit to the chance algorithm is claimed by the move table. `notes.md:168` / SOURCES.md identify this
game-data precedence. Native effects/items: Focus / Dire Hit / Lansat pumped +2, Lens / Claw +1, Stick +2 Farfetch'd,
Lucky Punch +2 Chansey, Super Luck +1; Merciless and Laser Focus exist, Armor / Lucky Chant block them.
Sirfetch'd and Dragon Cheer do not exist in this generation or guide. Affection is not modelled by this contract.

Changes versus the vanilla dump: **Drill Peck 0 -> 1** (:1189); **Self-Destruct 0 -> 6** (:1244);
**Explosion 0 -> 6** (:1277). Move Changes text :27 / :42-43 agrees (extracted from the author PDF).
Storm Throw / Frost Breath were already 6 and remain so. 10,000,000 Volt Thunderbolt remains stage 2 (:1843),
NOT always-crit on its own (p 1/2), and needs stage2 coverage even if a future UI only exposes it as a signature Z-move.
No other changed or removed non-zero crit value exists when comparing every move ID to dex-vanilla.json.

### P complete non-zero move inventory

Source column: local `.src/dex-rebalanced.json`, field `moves[].crit`; each row occupies one source line.

| Move | cr | Source line | Guide MV index |
| --- | ---: | ---: | ---: |
| Karate Chop | 1 | 1126 | 1 |
| Razor Wind | 1 | 1137 | 12 |
| Drill Peck | 1 | 1189 | 64 |
| Razor Leaf | 1 | 1199 | 74 |
| Self-Destruct | 6 | 1244 | 119 |
| Sky Attack | 1 | 1267 | 142 |
| Crabhammer | 1 | 1276 | 151 |
| Explosion | 6 | 1277 | 152 |
| Slash | 1 | 1287 | 162 |
| Aeroblast | 1 | 1301 | 176 |
| Cross Chop | 1 | 1362 | 237 |
| Blaze Kick | 1 | 1423 | 298 |
| Air Cutter | 1 | 1438 | 313 |
| Poison Tail | 1 | 1466 | 341 |
| Leaf Blade | 1 | 1472 | 347 |
| Night Slash | 1 | 1524 | 399 |
| Shadow Claw | 1 | 1545 | 420 |
| Psycho Cut | 1 | 1551 | 426 |
| Cross Poison | 1 | 1564 | 439 |
| Stone Edge | 1 | 1568 | 443 |
| Attack Order | 1 | 1578 | 453 |
| Spacial Rend | 1 | 1584 | 459 |
| Storm Throw | 6 | 1604 | 479 |
| Frost Breath | 6 | 1648 | 523 |
| Drill Run | 1 | 1653 | 528 |
| 10,000,000 Volt Thunderbolt | 2 | 1843 | 718 |

### P extract handoff: choose (a)

`hacks/photonic-sun/extract/dex.py:40-42` loads hacked + vanilla dumps into `tools/ctrguide.py:48-75` build_dex.
That shared helper already compares `crit` (:59-62) for change notes but omits it from the emitted entry (:65-70).
Copy non-zero `m['crit']` into `e['cr']`. `tools/ctr_dex.py:315` reads this byte at move-record offset 0xE.
Choose **(a), data.json `cr`**, 26 moves. No hack.json fallback or textual inference is justified.

## E: Eternal X 2.67 Rebalanced

Authority: `hacks/eternal-x/.src/dex-rebalanced.json`, hacked XY game data, compared with dex-vanilla.json.
Native Gen 6 odds (base 1/16), same additive item / Super Luck / pumped rules as P. Item is called Stick;
only Farfetch'd gets its +2. Armor / Lucky Chant exist. Merciless, Laser Focus, Dragon Cheer and Sirfetch'd are
not present in this generation or guide; do not manufacture AB indices for them. Affection not modelled.

Changes: **Cut 0 -> 6** (:907), **Drill Peck 0 -> 1** (:957), **Self-Destruct 0 -> 6** (:1012),
**Explosion 0 -> 6** (:1045). The author's Move Changes text :7 / :26-27 / :30-31 agrees, explicitly distinguishing
Drill Peck's increased rate from a guarantee. Storm Throw / Frost Breath remain their vanilla 6.
No other changed or removed non-zero crit value exists in the complete per-ID dump comparison.

### E complete non-zero move inventory

Source column: local `.src/dex-rebalanced.json`, `moves[].crit`.

| Move | cr | Source line | Guide MV index |
| --- | ---: | ---: | ---: |
| Karate Chop | 1 | 894 | 1 |
| Razor Wind | 1 | 905 | 12 |
| Cut | 6 | 907 | 14 |
| Drill Peck | 1 | 957 | 64 |
| Razor Leaf | 1 | 967 | 74 |
| Self-Destruct | 6 | 1012 | 119 |
| Sky Attack | 1 | 1035 | 142 |
| Crabhammer | 1 | 1044 | 151 |
| Explosion | 6 | 1045 | 152 |
| Slash | 1 | 1055 | 162 |
| Aeroblast | 1 | 1069 | 176 |
| Cross Chop | 1 | 1130 | 237 |
| Blaze Kick | 1 | 1191 | 298 |
| Air Cutter | 1 | 1206 | 313 |
| Poison Tail | 1 | 1234 | 341 |
| Leaf Blade | 1 | 1240 | 347 |
| Night Slash | 1 | 1292 | 399 |
| Shadow Claw | 1 | 1313 | 420 |
| Psycho Cut | 1 | 1319 | 426 |
| Cross Poison | 1 | 1332 | 439 |
| Stone Edge | 1 | 1336 | 443 |
| Attack Order | 1 | 1346 | 453 |
| Spacial Rend | 1 | 1352 | 459 |
| Storm Throw | 6 | 1372 | 479 |
| Frost Breath | 6 | 1416 | 523 |
| Drill Run | 1 | 1421 | 528 |

### E extract handoff: choose (a)

`hacks/eternal-x/extract/dex.py:47-50` calls the same `tools/ctrguide.py:48-75` helper as P. The same sparse copy
of `m['crit']` to `e['cr']` covers all 26 moves (including Cut). Choose **(a), data.json `cr`**.

## Checks and remaining integration work

U5 owns this report, appended crit cases in the four calc_states.json files and the Done so far line only.
Fixtures assert chance metadata, not RNG outcomes or turn execution. Each has a nonempty src naming this report
and the controlling game source / rule. Existing U2 cases must remain byte-for-byte before the append boundary.
The source inventories above are complete; zero-stage regressions additionally cover EI Aqua Tail and H Ivy Cudgel.
Per-hack fixture counts and validation results are recorded on completion below.

U6 / orchestrator next: implement sparse extracts (EI requires pinned source acquisition), rebuild data, then run
crit cases against the adapter. Probe runs here check input acceptance only; no expected chance is taken from the
engine. No new Laser Focus / Lucky Chant / Dragon Cheer keys are authorised by this survey.
