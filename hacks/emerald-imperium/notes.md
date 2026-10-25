# Emerald Imperium build notes

Emerald Imperium 1.3 / 1.3.1, a GBA hack of Pokémon Emerald. Data from the hack's dex site, the official docs and the
game's own trainer sets. 1,208 species and forms, 159 tracker areas, 20 trainer boxes (138 boss trainers), 9 walkthrough
splits (106 stops, 141 steps).

## Build

```bash
uv run python -I hacks/emerald-imperium/extract/build.py        # .src/ -> data.json + extract/report.txt (every conflict and guess)
uv run python -I hacks/emerald-imperium/extract/check.py [baseline.json]
python assemble.py emerald-imperium
```

Modules: `dex.py` (M MV AB P TC; `eidex.py` the dex site's data, `changes.py` the Changes doc), `locs.py` (LOC AR P.w P.g;
`specials.py` hand-transcribed statics, gifts and eggs), `items.py` (IT), `walk.py` (WK; `walk.txt` is the transcribed
walkthrough page), `trainers.py` (TR; `bosssheet.py` reads the Boss Battles sheet, `match.py` matches names), `prune.py`
(species kept), then `finalise()` in `tools/extractlib.py` (Items standard, prune, shared split names). Fetch the sources
with `SOURCES.md`. `check.py` also compares the Locations PDF's wild tables with the dex data (`pdfwild.py`, needs
pdfplumber).

## Sources and rules

Sources, by where they are used (files in `SOURCES.md`):

- **EI Dex** (dex.emeraldimperium.net; source github.com/miriamlefae/eidex, iriv24/eidex is an identical fork). Data
  files dated March 2026; the live site could be newer, so recheck before a rebuild. `src/data/`:
  speciesData.json (1,534 species/forms by speciesId: types, stats, abilities [a1,a2,hidden] (0 = none), wild
  heldItems, levelUpMoves, tmMoves (TM/HM, no separate tutor list), eggMoves, dexId, evolutions [[method, target,
  param]], forms tags, formId, nameKey, siblings), moveData.json (type, power (1 = variable), acc (999 = never misses;
  0 on status = never misses), pp, cat (0 Physical, 1 Special, 2 Status), description, flags; no priority),
  abilityData.json (includes EI originals), itemData.json (names), typeData.json (type ids 1-19, 10 unused, matchup x10),
  wild_encounters.json (pokeemerald-style: land 12 slots, water / rock smash 5, fishing 11 split old 0-2, good 3-5,
  super 6-10; no time of day), speciesLabelMap.json. Sprites: 64x64 RGBA, at most 16 colours. Evolution method codes:
  src/utils/parseEvo.ts (copied into EVO in dex.py).
- **Changes doc**, "1.3.1 Emerald Imperium Changes (Stats, Types, Abilities, Moves)" xlsx (Vicfis). Sheets: Pokemon
  Changes, Move Changes (124 moves), Ability Changes (30), Data Clean (vanilla cols 0-12, EI cols 14-26 per species).
  `changes.py` gives P.cf / MV.cf (source conflicts), MV.e + MV.dc (doc effect text), AB[3]; the vanilla values (P.vc)
  are no longer kept. Doc typos ignored, not conflicts: Wartortle "ARAIN DISH", Alolan Grimer/Muk "POWER OF ALCH.", Nosepass
  type "STURDY" (shifted cell), Ash Greninja row shifted, Calyrex "AS ONE ICE/SHADOW RIDER", move "Strange Stream".
  Conflicts kept and shown on pages: Togepi and Snubbull (doc Fairy/Normal, dex Fairy), Kyurem Black/White (stats and
  abilities swapped), Meowstic M/F (Prankster/Competitive swapped), Oricorio Pa'u/Pom-Pom (types swapped), Zygarde 10%
  (doc Inner Focus, dex Aura Break), moves Aqua Fang, Charge Beam, Fly, Octazooka, Strength Sap, Thunder Wave, Fury Attack
  (PP / power / accuracy). 55 moves differ from Showdown Gen 9 but are not in the doc.
- **Locations PDF**, "Pokemon Routes, Gift Mons, and Eggs" (EI 1.3, Aug 2025, 77 pages). Wild tables read by word position
  (`pdfwild.py`: columns by x band land < 165 < surf < 300 < fish < 435 < rock; rows "name" then "lo - hi rate%"): all
  124 locations are identical to the dex data, every slot. Pages 70-77 (statics, gifts, eggs, roamers, multiple choice)
  are transcribed by hand in `specials.py` because the continuation pages shift columns.
- **Encounter Tracker**, Google Sheet (received as pasted text). Header (128 areas, the official order and grouping) and
  the two 20% grass rows are in the extract. Underwater Routes 124/126 merged (tracker: "count as one encounter").
  Tracker-only data used: Littleroot starter choice (27 starters), Hot House badge tiers, egg pools placed in hatch-here
  areas (Oldale, Verdanturf, Fallarbor, Mt. Chimney, Lavaridge, Fortree), Galarian forms of the static birds. Areas not
  in the tracker (Altering Cave, Artisan Cave, Battle Frontier, Marine Cave, Terra Cave, Sky Pillar Top, Roaming) are
  listed with no tracker slot (AR.ns). Conflicts: Mirage Tower 3F slot 1 (tracker Rhydon, PDF / dex Rhyhorn); Route 130
  grass Shedinja missing from the tracker; the tracker omits Sudowoodo, Kyogre, Groudon, Rayquaza, Regigigas, Meltan and
  the roamers.
- **Items xlsx**, "Item, TMs, Mega Stones etc and Useful NPC Locations" (`items.py`): TM & HM Locations (TMs cols 0-1, HMs
  cols 5-6, "TM001 - Move"), Mega Stones (pairs in cols 1-2 and 5-6), Poké Marts (header row then item / price rows;
  Slateport berries in col 3), Useful NPC Locations (town header, "- " lines), Battle Item Rewards. Fixes: "Drain Kiss" =
  Draining Kiss; "Luxite" (sheet) = Luxrite (game item). Gaps: Mega Flapple has no stone in the sheet (Applite maps to
  Mega Appletun); Mega Rayquaza uses Dragon Ascent. The game's item data has no TM move names.
- **Walkthrough page** emeraldimperium.info/walkthrough.html (fetched 2026-10-02), transcribed into `walk.txt` (S split,
  P place, - step, > note). Tracker area groups are anchored to their first mention in a place heading or step text at or
  after the previous group (a far-ahead first mention, like Route 118 via Wake in Split 5, does not move the pointer);
  unmentioned areas become "on the way" stops after the previous group. Items are filed under the earliest area or town
  name in their location text; Latiasite, Latiosite (Southern Island) and Diancite (Navel Rock) have no walkthrough place.
- **Cheat Codes** docx, typed into WK.cheats. The DexNav site (map.emeraldimperium.net) is a JS app on the same
  encounter data; not used. NBurhans/emerald-imperium (third-party analysis of v1.3) not used; a repo containing the ROM
  was ignored.
- **Boss Battles sheet** (Google Sheet by LightGlory, Flash Ketchum, iamguitar, PrincessGlaceon, Cap), downloaded as
  xlsx. No cell notes in the export (only pokepast links and type-icon images). `bosssheet.py` reads the 12 split tabs
  (Badge 1..8, Hot House, Evergrande City, Victory Road, Elite 4 / Champion; xlsx truncates names to 31 characters, full
  names came from a pasted text copy, spot-checked: 16 of 20 lines identical). Block layout: title in col C (rewards in
  col R), species above the "Pokemon:" row in cols F/K/P (may carry "(Lead Slot n)" or "PRE-BURNED"), then Level / Nature
  / Ability / Item / Moves in cols C/H/M, stats / IV / EV in +2/+3/+4, "Speed Stat: a (b)" (a = no EVs, b = with EVs, at
  the cap in the "level cap used" note), extra speed lines (Scarfed, Sun Up, Ability Proc...). Unlabelled rows near
  Ability hold "-> Mega ability". Hot House tab: one section per badge tier with "Player Choice" rewards; the 7 badge
  block has no title for its second team (the calc shows it is Sailor Dwayne). Hidden tabs (Types, the two "Horizontal"
  tabs) and the "Hoenn/Sinnoh Gyms Only" duplicates are not used; the Horizontal tabs are an older version (Roark on Route
  116 with Shieldon, Candice on Route 125, Flannery with Torkoal).
- **hzla Dynamic Calc** (hzla.github.io/Dynamic-Calc-Decomps/?data=imp13, used by the official site; repo
  hzla/Dynamic-Calc-Decomps). `backups/title_to_backup_mappings.js` maps "Emerald Imperium 1.3" to `backups/imp_1-3.js`
  (backup_moves + backup_data: species -> "Lvl L Trainer Name" -> set with ivs, evs, item, level (<= 0 = relative to the
  highest level, like "Highest Lv -1"), nature, ability, moves, tr_id, sub_index, battle_type, ai_tags, status),
  evaluated with node (`Hack.calc_backup`). 1,198 of 2,396 sets are vanilla leftovers (Hardy, no item, no ability) and
  are skipped; the other 1,198 are exactly the boss set (213 trainer names incl. numbered copies such as Roxanne2..5, and
  Hot House tiers under one tr_id). Mega / Primal forms appear twice (base set + "-Mega" copy with sub_index 6+); they
  are folded into the base slot. This is the game's own trainer data (AI flags included), so it is the **authority for
  sets**; the sheet supplies order, titles, places, leads, pre-status, rewards and paste links.
- **pokemon-showdown** 0.11.11 (`moves.js`, `abilities.js`): move priority only, plus the comparison that flags EI
  changes (MV.h) and EI originals (MV.x, AB[2]).

Data rules:

- **Forms and availability** (dex.py, eidex.py). Dropped: forms tagged totem, gigantamax, tera. Cosmetic duplicates
  folded: same dexId + identical types, stats, abilities and level-up moves keep the lowest speciesId (Alcremie,
  Vivillon, Unown, Furfrou, Minior colours...); evolution targets are remapped. P.g: 0 = in the wild tables or in the
  evolution family (both directions) of something that is; 1 = Mega / Primal; 3 = not in the wild tables (starters,
  gifts, fossils, statics, legendaries, or unobtainable). P.fc = form change (Rotom appliances, Arceus plates, Castform,
  Aegislash...: CHANGE list in dex.py), takes its base form's availability.
- **Wild tables and areas** (locs.py). Altering Cave has 9 tables; only the first is live, the rest are skipped
  (UNUSED_RUBY_SAPPHIRE maps skipped). Areas are the tracker's. Hatch towns (Verdanturf, Fallarbor, Mt. Chimney,
  Lavaridge, Fortree) get one tracker slot per egg (Fire / Water / Grass egg = starter egg by shard, Lavaridge,
  Pacifidlog egg; any of them can hatch at any of those towns), appended to AR; Oldale keeps only its own egg. Gardenia
  (Petalburg Woods, cap 20) sits in the Wattson split at cap 34 (the player delays her for a stronger team; the
  walkthrough keeps her stop). Littleroot's lab and the gift houses of Rustboro, Mossdeep, Sootopolis fold into the town
  ("Gift (Devon Corp 2F)"). Shop rows get their shop as a sub-heading ("All free" dropped from Verdanturf's rows: gifts
  there, and the mart sells more).
- **Move changes** compare EI data with Showdown Gen 9; status moves with a nominal 100 accuracy and variable-power moves
  (Showdown power 0) are not counted as changes.
- **Trainers** (trainers.py). Pairing: whole trainers by species overlap + name tokens (127 / 137), then per Pokémon
  (doubles with two calc trainers search every calc trainer; same dex number allows form names such as
  Wishiwashi-School). 674 of 677 Pokémon have a calc set; the 3 without are the Route 103 rival starters (the calc has
  only vanilla data there). Speed check: our formula reproduces the sheet's Speed Stat for 592 of 609 checkable Pokémon
  at the sheet's own cap; the 17 misses are sheet slips (Badge 3 Fantina computed at cap 44 though her note says 34,
  Wally's Skarmory...). Boxes are level cap runs named from the caps (Hot House stays one box); the cap 84 box, named
  "Wally in Victory Road" in the cap list, holds the Ever Grande trainers too ("Victory Road"). Gym leaders take the last
  matching walkthrough stop, others a forward pointer; Route 111 desert fights in Split 5 sit with Mirage Tower; the Elite
  Four with Victory Road; fallbacks: Gardenia (post 3rd badge) -> Verdanturf Town, Crasher Wake -> Mauville City.
- **Level caps**: a trainer's default cap is the cap of the next boundary fight in the Navigation list (Roxanne 15,
  Rustboro rival 20 ... Champion 85); Hot House tiers 2-7 badges = 30 / 44 / 56 / 64 / 71 / 80. This reproduces every
  "level cap used for the speed calculation" note in the sheet.
- **Sheet vs calc** (the calc wins; the card shows "Sheet says ..."). 68 Pokémon (72 fields): 39 EV rows (mostly shifted
  rows), 11 IVs, 6 species names (form names or a base name for a Mega holder), 4 natures (Gardenia Vileplume
  Bashful / Bold, Hot House Sceptile, Jessica Blastoise, Grace Typhlosion), 4 levels (Edwin Ludicolo -3 / -2, Charlotte x3
  -1 / -2), 3 items (Hot House Arcanine "Jolly", Swellow Flame Orb / Muscle Band), 3 moves (rival Crobat Haze vs Leech
  Life on Route 119), 1 ability. The calc gives Battle Girl Jenny's Mega Flapple an Applite (items sheet: Applite = Mega
  Appletun, no stone for Flapple). The walkthrough says Roark on Route 116 in Split 1; the current sheet has Candice there
  and Roark outside Shoal Cave (Split 7).
- **Name fixes** (the build report lists them): Lycaroc, Farigaraf, Crygonal, Thunderus, Iron Jugulus, Mabostiff,
  Trevanant, Bannette; items Roseradeite, Infernite, Slakingite, Luxrayite / Luxite, Grimmsnarlite, Alakazamite; moves
  Extrasensroy, Fishous Rend, Stealth Rocks, Scorching Sand; abilities Emperor's Prescence, Gulp Missle, Tablet of Ruin.
  Items keep readable names (the game's item data truncates to 12 letters). Keldeo-Resolute uses Keldeo (folded cosmetic
  form). Behemoth Bash added to M.
- **Items**: rules in `itemstd.RULES['emerald-imperium']` (History → Items standard).

## Local storage (prefix ei)

`eidex1` list filters / sort / availability, `eicalc:<id>` + `eicalc:lastlv` stat calc, `eitrack` tracker {e:{areaIdx:{p:id}
or {f:1}}}, `eiwalk` walkthrough {c:{split.stop.step:1}, o:{open splits, gi: Guide info}, x:{closed stops, doc*: open
docs}, s:{split.stop.c/e/i/t: section open 1 / closed 0}}, `eicap` {trainerKey: your highest level}, `eitr` open trainer
groups, `eimgm` "1" = Minimal Grinding Mode (speeds without EVs), `eirecent`, `eipos`, `eiloc`, `eiitems`. Keep them once
published. Rival teams are filtered by the type of the starter recorded in tracker area 0 (Starter); the walkthrough's
Starter picker sets that same tracker value.

## Hack-only data

Beyond the shared schema (the last section): P.cf / MV.cf
(doc-vs-data conflicts, the "Sources disagree" card), MV.dc + MV.e (the doc's text), AR.sub / AR.in (hatch-town slots),
AR.ns, P.w methods `Hot House (N+ badges)`, `Choice (...)`, `Starter egg`, `Pseudo egg`, `Roaming` (rates "1 of N"),
WK.cheats (+ `cnote`), trainer `c` (calc trainer names), `pp` (pokepaste), mon `a0` / `ld` / `pre` / `x` / `cf` /
`src`, and the Hot House tiers in the caps list. No WK.docs, no WK.ko.

### Damage calc

Profile: `cfg.calc` in `hack.json` over `template/calc/profiles/expansion.json` (Gen 9 mechanics). Settings
checked: EI's own `include/config/battle.h` sets every damage switch used here to `GEN_LATEST`, which is `GEN_9`
in this release (`iriv24/pokeemerald-expansion` at `2576d0f3…`). hzla's pinned profile uses dmgGen 8 for the same
hack; the source-backed Gen 9 base stays, with explicit field fixtures added in the refinement. `Frostbite` is on `frz` (see the status
note below). `ls.dmg` (`eidmg`) is unchanged.

Sources: the mechanics are read from the release's `src/battle_util.c` and `include/config/battle.h` (a shallow
fetch into `.tmp/source/`, never shipped). The oracle is hzla's Dynamic-Calc-Decomps, pinned at `ff6c3e3…`, run
locally from `.tmp/hzla/` (`hzla_compare.mjs`); its code and tables are not copied. Where hzla and the source
differ, the source wins. The 2026-10-25 refinement has nine explained roll differences, listed in the fixtures.

| Mechanic | Profile entry | Source (release) | Fixtures |
| --- | --- | --- | --- |
| Iron Fist 1.3× on punches (Iron Fist's native effect disabled) | `powerMods` | `battle_util.c` 9173 | iron-fist-changed, iron-fist-non-punch |
| Emperor's Presence 1.3× Water and Steel, own and allied effects stack | `powerMods`; `atkEmperorPresence` for the attacking ally in doubles | 9252, 9299 | emperor-presence, emperor-presence-steel, emperor-ally-* |
| Striker 1.3× kicking moves | `powerMods` | 9177 | striker-kick |
| Liquid Voice 1.2× sound moves (type change is native) | `powerMods` | 9240 | liquid-voice-sound |
| Feline Prowess 2× Sp. Atk (special moves) | `attackMods` | 9527 | feline-prowess-special |
| Sage Power 1.5× Sp. Atk (special moves) | `attackMods` | 9609 | sage-power-special |
| Fatal Precision 1.2× when super effective | `finalMods` | 10060 | fatal-precision-super-effective |
| Bone Zone: bone moves ignore immunity; 2× when resisted to ≤ 0.5 | `effectiveness`, `finalMods` (EI's four bone moves) | 10074, 10465 | bone-zone-immune |
| Mountaineer: immune to Rock (defender) | `effectiveness` | 10574 | mountaineer-rock |
| Primal Armor 0.5× when super effective (defender) | `finalMods` | 10097 | primal-armor-super-effective |
| ORAORAORAORA!: second punch 50% of its base damage | `hits` (count 2 for a single-strike punch) and `hitBaseDamage` (`floor`, half down) | `battle_script_commands.c` 1240, `battle_util.c` 9914, 10277 | ora-punch-second-hit, ora-non-punch |
| Draco Barrage ignores Fairy immunity | `effectiveness` (Fairy 0 → 1) | 10482 | draco-barrage-fairy |
| Draco Barrage estimates physical and special damage against the target | `beforeStats`: integer-truncated staged stats and damage estimates; `slot.invert` swaps the selected category | 11968–12017 (`EFFECT_SHELL_SIDE_ARM`), `battle_script_commands.c` 2161 | draco-*: lower/higher attacking stat, tie, integer near-tie, stages and inversions |
| Bull Rush / Quill Rush 1.2× selected attacking stat on first turn out | `attackMods`, explicit per-mon `abilityOn` | 9522–9526 | bull-rush-*, quill-rush-*; physical and special, on/off |
| Illusion 1.3× selected attacking stat while disguised | `attackMods`, explicit per-mon `abilityOn` | 9647–9652 | illusion-*; physical and special, on/off |
| Blazing Soul +1 Fire priority at full HP | `afterMoveType`, result `priority`; does not infer move order | `battle_main.c` 5030–5032 | blazing-soul-*: full, hurt, not-fire, psychic-terrain |
| Ice Eater absorbs Ice attacks | `effectiveness`, including Mold Breaker, Ability Shield and Neutralizing Gas boundaries | 4112–4115, 10700 | ice-eater-* |
| Defeatist halves the attacking stat only at or below one-third HP | `beforeStats` suppresses the stock half-HP trigger, `attackMods` applies EI's threshold | 9539–9542 | defeatist-*: half HP, third+1, third physical/special |
| Frostbite halves special damage | `beforeRolls` sets `isBurned` for special moves when the attacker's status is `frz` | 9975, applied 10308 | frostbite-special, frostbite-physical |

Status: EI's `B_USE_FROSTBITE` makes frostbite replace freeze in most cases (`include/config/battle.h`), and a few
moves still freeze. A frozen attacker cannot act, and a frozen defender has no damage effect here, so only frostbite
changes a result. The `frz` key is labelled Frostbite; no Freeze option is shown.

Not changed from native: Toxic Boost, Flare Boost, Water Compaction, Adaptability, Technician and the other vanilla
abilities use the Smogon/expansion behaviour. Checked against source: Toxic Boost (physical, 1.5×), Flare Boost
(special, 1.5×). The first pass incorrectly described Defeatist as native-correct: stock triggers at half HP;
the refinement explicitly fixes EI's one-third threshold. The rest are not audited line by line.

Disagreements between the changes doc or the Known Bugs file and the source (source followed):
- Flare Boost: the doc says Attack; the source boosts Sp. Atk while burned (9161).
- Bone Zone: the doc says it ignores resistances and immunities; the source ignores only immunity, and doubles
  damage only when the resisted multiplier is ≤ 0.5, so ×0.25 becomes ×0.5 rather than ×1.
- Flower Gift: the doc says Atk and Spe in sun; the Known Bugs file says the game gives Atk and SpD to the user
  and its ally. The calc uses the vanilla Atk boost, which matches the game as the bug list describes it.
- Bull Rush / Quill Rush: the release source has no physical-category guard, so special damage also gets 1.2×.
  hzla restricts it to physical damage; our two special-on fixtures intentionally differ.
- Illusion modifies the attacking stat in the release, not move power (as hzla does). Hand-calculated tests at
  powers 7, 17, 25 and 41 protect the rounding point even when ordinary fixtures happen to match.

#### Refinement dispositions (2026-10-25)

Every original open point is closed mechanically or explicitly scoped below. UI and trainer-field preparation
are separate from correctness. No trainer `field` evidence is consumed automatically.

| Point | Disposition |
| --- | --- |
| Oracle `noSwitch=1` | Switch-in prediction / AI ranking and associated preview controls, not a damage-generation setting. Read `js/calc_ui/switch_preview/g3.js`, `g4.js`, `g5.js`, and `menu_settings.js` in the pinned oracle; no damage-core use. No engine override or damage fixture is appropriate. |
| Oracle `evs=0` | The catalog explicitly offers No EVs and w/ EVs variants (`js/romhack_catalog.js` 182–191). It is not a universal EI ban. Preserve guide EV support and existing MGM zero-EV selection; `evs-enabled` and the shared UI scenarios guard this. |
| Individual ability state | `monControls` declares per-Pokémon First turn out (Bull/Quill Rush) or Disguised (Illusion). Missing/false `abilityOn` means off; no switch history is guessed. Controls must remain on their own Pokémon, not global. Other abilities are not silently redefined. |
| Defeatist threshold discovered during refinement | Correctness fix, no extra checkbox: current HP automatically determines the one-third trigger. Four boundary fixtures and hand-calculated rolls; matches the hack oracle. |
| Ally Emperor's Presence | Explicit `atkEmperorPresence` field effect, attacking ally only, Doubles only. Own ability remains automatic; own plus ally stacks. No ally slot or trainer-field inference is needed. Water, Steel, off, other type, singles and stacking fixtures. |
| Draco Barrage | Compares floor-staged Atk/Def versus SpA/SpD damage estimates using the source's fixed Shell Side Arm power (100) and level term. It does not compare attacking stats alone or simulate final damage, items, ability multipliers, weather or screens. Source randomises integer ties; use deterministic Special as the automatic tie default and an explicit invert toggle for either result. Inversion is also allowed in non-ties. Result exposes automatic category, tie and inversion; chosen category controls contact. |
| Ice Eater | Correctness fix: explicitly implement Ice immunity, which the stock engine did not provide. Five fixtures cover Ice/non-Ice, Mold Breaker, Ability Shield and Neutralizing Gas. Healing is outside this single-attack damage result; recovery / multi-turn simulation deferred. |
| Self Sufficient / Parasitic Waste | Self Sufficient heals 1/16 at end of turn (`battle_util.c:5137-5142`): `cfg.calc.residual`, counted in the KO text and the Turn end strip, never in the rolls. Frostbite 1/16 per turn (`battle_util.c:2447-2452`) likewise. Parasitic Waste heals on the hit, not at end of turn: not modelled. |
| Blazing Soul / priority | Correct effective priority is implemented now, including Psychic Terrain blocking. `slot.order` accepts first/last and feeds existing order-dependent power hooks. The UI still needs a separate decide step for move-vs-move order, ties, Trick Room and single-column direction. A Speed highlight is not a turn-order promise. |
| Frozen / otherwise unable attacker | Accepted user decision: calculate hypothetical damage, do not prevent the action. `unable-attacker-slp` and `unable-attacker-frz`; `frz` still means Frostbite. |
| Spread / weather / screens | Added singles/doubles spread, sun/rain, Reflect/Light Screen/Aurora Veil, non-stacking screens, critical bypass, snow and hail fixtures. Source `GetScreensModifier` (10031+) uses 0.5 singles / 0.667 doubles; spread and ordinary sun/rain/screens do not change between Gen 8 and Gen 9 (direct stock parity checked). Snow is the notable Gen 9 difference: Ice-type Defence ×1.5 (`battle_util.c` 9881); hail has no such defence boost. Weather chip/healing is outside these per-hit rolls. |

Independent validation: `tools/calc/imperium_check.mjs` checks source-derived integer category estimates,
hand-calculated ability modifier placement/rounding, native Gen 9 field rolls and Gen 8/9 parity for unchanged
fields, effective priority, explicit order, EVs and immutable inputs. Included in `npm test`.
KO estimates repeat the displayed attack under fixed inputs, not a turn-state simulation: they do not expire
First turn out, break disguise, apply healing or decide subsequent move order.

Still requires in-game confirmation: Bull/Quill Rush on a special attack, integer-tied Draco Barrage category
distribution, allied Emperor stacking and Blazing Soul into Psychic Terrain. Source-backed fixtures are not an
in-game test. First-turn/disguise checkboxes, an allied Emperor field effect and per-move category inversion are
wired and persisted in the existing storage object. Category and Auto/Inverted state remain visible when the
move is collapsed. Changing an ability or Mega form clears its conditional state. Broader turn-order and
trainer-field UI are deferred. At wide sizes the match block grows when these controls need more room, keeping
Field reachable rather than allowing an overflowing match block to cover it.

Checks:
- `node tools/calc/hzla_compare.mjs emerald-imperium`: 109 cases, 100 exact matches, nine source/UI-choice differences,
  zero unexplained mismatches. Report `.tmp/calc-emerald-imperium/compare.json`.
- `node tools/calc/test.mjs`: 81 passed, 0 failed (`.tmp/calc-emerald-imperium/engine-test.log`).
- `python assemble.py`: all four guides built (`.tmp/calc-emerald-imperium/assemble.log`).
- `node tools/scenarios/calc-imperium.mjs`: 10 passes (all five viewer sizes, normal/dvkb), real checkbox clicks,
  inversion/collapsed indication, field propagation, reload persistence and ability-state clearing.
- Not done: an in-game test (a save state and one known move, per `plans/damage-calc.md` → How to check) or a
  physical Thor check. Browser regression results are recorded in the session status.

#### W2 weight / automatic-power audit (2026-10-25)

All 1,208 guide species were compared with EI source weights: 1,080 stock-name lookups,
128 `weightNames()` fallbacks and no 1 kg defaults. All 128 fallback rows (including the
regional forms omitted from the brief), both Nidoran and the additional Hoopa discrepancy appear below.
Weights are hectograms divided by ten. No hzla weight data was used.

Source **EI**: `iriv24/pokeemerald-expansion` commit
`2576d0f3f4c861c760f0c55198e37e6d7b91683e`, `src/data/pokemon/species_info.h` and
`src/data/pokemon/species_info/gen_1_families.h` through `gen_9_families.h`.
The parent `species_info.h` supplies the additional hack Megas: do not substitute a base species
or a Gigantamax form. Source paths/lines below are relative to these locations; macro line numbers
identify the actual `.weight` initializer. The shared sprite-source expansion pin
`73b3fbeb574327cd9420c89e56bef5aa3c08fead` was also fetched for cross-reference; EI values win.
The local read-only `repos/eidex.zip` (`361c7d51bb5c301d9917f22222703db2a36e908a`)
has species IDs/labels but no weight fields. Its labels map guide IDs to source symbols.
All requested forms have an EI source weight: none needs an online weight or undocumented fallback.

| ID | Form | Engine before (kg) | EI source (kg) | Source EI | Verdict |
| --- | --- | ---: | ---: | --- | --- |
| 1497 | Mega Butterfree | 32 | 32 | `gen_1_families.h:1264` | Keep; exact source weight |
| 956 | Alolan Rattata | 3.8 | 3.8 | `gen_1_families.h:2003` | Keep; exact source weight |
| 957 | Alolan Raticate | 25.5 | 25.5 | `gen_1_families.h:2070` | Keep; exact source weight |
| 1009 | Pikachu (Cosplay) | 6 | 6 | `gen_1_families.h:2672` | Keep; exact source weight |
| 1010 | Pikachu (Rock Star) | 6 | 6 | `gen_1_families.h:2723` | Keep; exact source weight |
| 1011 | Pikachu (Belle) | 6 | 6 | `gen_1_families.h:2775` | Keep; exact source weight |
| 1012 | Pikachu (Pop Star) | 6 | 6 | `gen_1_families.h:2827` | Keep; exact source weight |
| 1013 | Pikachu (PhD) | 6 | 6 | `gen_1_families.h:2878` | Keep; exact source weight |
| 1014 | Pikachu (Libre) | 6 | 6 | `gen_1_families.h:2929` | Keep; exact source weight |
| 1533 | Pikachu (Surfing) | 6 | 6 | `gen_1_families.h:2981` | Keep; exact source weight |
| 1534 | Pikachu (Flying) | 6 | 6 | `gen_1_families.h:3033` | Keep; exact source weight |
| 958 | Alolan Raichu | 21 | 21 | `gen_1_families.h:3755` | Keep; exact source weight |
| 959 | Alolan Sandshrew | 40 | 40 | `gen_1_families.h:3952` | Keep; exact source weight |
| 960 | Alolan Sandslash | 55 | 55 | `gen_1_families.h:4018` | Keep; exact source weight |
| 29 | Nidoran♀ | 7 | 7 | `gen_1_families.h:4084` | Keep; exact source weight |
| 32 | Nidoran♂ | 9 | 9 | `gen_1_families.h:4279` | Keep; exact source weight |
| 961 | Alolan Vulpix | 9.9 | 9.9 | `gen_1_families.h:4817` | Keep; exact source weight |
| 962 | Alolan Ninetales | 19.9 | 19.9 | `gen_1_families.h:4884` | Keep; exact source weight |
| 963 | Alolan Diglett | 1 | 1 | `gen_1_families.h:6082` | Keep; exact source weight |
| 964 | Alolan Dugtrio | 66.6 | 66.6 | `gen_1_families.h:6149` | Keep; exact source weight |
| 965 | Alolan Meowth | 4.2 | 4.2 | `gen_1_families.h:6348` | Keep; exact source weight |
| 974 | Galarian Meowth | 7.5 | 7.5 | `gen_1_families.h:6479` | Keep; exact source weight |
| 966 | Alolan Persian | 33 | 33 | `gen_1_families.h:6414` | Keep; exact source weight |
| 993 | Hisuian Growlithe | 22.7 | 22.7 | `gen_1_families.h:7114` | Keep; exact source weight |
| 994 | Hisuian Arcanine | 168 | 168 | `gen_1_families.h:7179` | Keep; exact source weight |
| 1500 | Mega Machamp | 130 | 130 | `gen_1_families.h:8035` | Keep; exact source weight |
| 967 | Alolan Geodude | 20.3 | 20.3 | `gen_1_families.h:8637` | Keep; exact source weight |
| 968 | Alolan Graveler | 110 | 110 | `gen_1_families.h:8704` | Keep; exact source weight |
| 969 | Alolan Golem | 316 | 316 | `gen_1_families.h:8770` | Keep; exact source weight |
| 975 | Galarian Ponyta | 24 | 24 | `gen_1_families.h:8964` | Keep; exact source weight |
| 976 | Galarian Rapidash | 80 | 80 | `gen_1_families.h:9029` | Keep; exact source weight |
| 977 | Galarian Slowpoke | 36 | 36 | `gen_1_families.h:9352` | Keep; exact source weight |
| 978 | Galarian Slowbro | 70.5 | 70.5 | `gen_1_families.h:9419` | Keep; exact source weight |
| 979 | Galarian Farfetch'd | 42 | 42 | `gen_1_families.h:9828` | Keep; exact source weight |
| 970 | Alolan Grimer | 42 | 42 | `gen_1_families.h:10374` | Keep; exact source weight |
| 971 | Alolan Muk | 52 | 52 | `gen_1_families.h:10442` | Keep; exact source weight |
| 1502 | Mega Kingler | 60 | 60 | `gen_1_families.h:11432` | Keep; exact source weight |
| 995 | Hisuian Voltorb | 13 | 13 | `gen_1_families.h:11629` | Keep; exact source weight |
| 996 | Hisuian Electrode | 71 | 71 | `gen_1_families.h:11694` | Keep; exact source weight |
| 972 | Alolan Exeggutor | 415.6 | 415.6 | `gen_1_families.h:11896` | Keep; exact source weight |
| 973 | Alolan Marowak | 34 | 34 | `gen_1_families.h:12094` | Keep; exact source weight |
| 980 | Galarian Weezing | 16 | 16 | `gen_1_families.h:12738` | Keep; exact source weight |
| 981 | Galarian Mr. Mime | 56.8 | 56.8 | `gen_1_families.h:14113` | Keep; exact source weight |
| 1402 | Paldean Tauros (Combat) | 115 | 115 | `gen_1_families.h:15246` | Keep; exact source weight |
| 1403 | Paldean Tauros (Blaze) | 85 | 85 | `gen_1_families.h:15311` | Keep; exact source weight |
| 1404 | Paldean Tauros (Aqua) | 110 | 110 | `gen_1_families.h:15376` | Keep; exact source weight |
| 1503 | Mega Lapras | 220 | 220 | `gen_1_families.h:15725` | Keep; exact source weight |
| 1505 | Mega Snorlax | 460 | 460 | `gen_1_families.h:17289` | Keep; exact source weight |
| 982 | Galarian Articuno | 50.9 | 50.9 | `gen_1_families.h:17422` | Keep; exact source weight |
| 983 | Galarian Zapdos | 58.2 | 58.2 | `gen_1_families.h:17563` | Keep; exact source weight |
| 984 | Galarian Moltres | 66 | 66 | `gen_1_families.h:17703` | Keep; exact source weight |
| 997 | Hisuian Typhlosion | 69.8 | 69.8 | `gen_2_families.h:438` | Keep; exact source weight |
| 1405 | Paldean Wooper | 11 | 11 | `gen_2_families.h:3072` | Keep; exact source weight |
| 985 | Galarian Slowking | 79.5 | 79.5 | `gen_1_families.h:9484` | Keep; exact source weight |
| 998 | Hisuian Qwilfish | 3.9 | 3.9 | `gen_2_families.h:4529` | Keep; exact source weight |
| 999 | Hisuian Sneasel | 27 | 27 | `gen_2_families.h:5022` | Keep; exact source weight |
| 986 | Galarian Corsola | 0.5 | 0.5 | `gen_2_families.h:5849` | Keep; exact source weight |
| 987 | Galarian Zigzagoon | 17.5 | 17.5 | `gen_3_families.h:1102` | Keep; exact source weight |
| 988 | Galarian Linoone | 32.5 | 32.5 | `gen_3_families.h:1167` | Keep; exact source weight |
| 1527 | Mega Slaking | 130.5 | 130.5 | `species_info.h:626` | Keep; exact source weight |
| 351 | Castform (Normal) | 0.8 | 0.8 | `gen_3_families.h:7986` | Keep; exact source weight |
| 1490 | Mega Torterra | 310 | 310 | `species_info.h:375` | Keep; exact source weight |
| 1493 | Mega Infernape | 55 | 70 | `species_info.h:564` | Set `over.species` weight |
| 1491 | Mega Empoleon O | 84.5 | 84.5 | `species_info.h:437` | Keep; exact source weight |
| 1492 | Mega Empoleon D | 84.5 | 160 | `species_info.h:499` | Set `over.species` weight |
| 1489 | Mega Luxray | 42 | 46 | `species_info.h:306` | Set `over.species` weight |
| 1531 | Mega Roserade | 14.5 | 20 | `species_info.h:692` | Set `over.species` weight |
| 413 | Wormadam (Plant) | 6.5 | 6.5 | `gen_4_families.h:1846` | Keep; exact source weight |
| 1532 | Mega Dusknoir | 106.6 | 106.6 | `species_info.h:762` | Keep; exact source weight |
| 1529 | Primal Dialga | 683 | 683 | `species_info.h:874` | Keep; exact source weight |
| 1530 | Primal Palkia | 336 | 336 | `species_info.h:931` | Keep; exact source weight |
| 492 | Shaymin (Land) | 2.1 | 2.1 | `gen_4_families.h:6580` | Keep; exact source weight |
| 1000 | Hisuian Samurott | 58.2 | 58.2 | `gen_5_families.h:663` | Keep; exact source weight |
| 1001 | Hisuian Lilligant | 19.2 | 19.2 | `gen_5_families.h:3778` | Keep; exact source weight |
| 550 | Basculin (Red Striped) | 18 | 18 | `gen_5_families.h:3845` | Keep; exact source weight |
| 989 | Galarian Darumaka | 40 | 40 | `gen_5_families.h:4556` | Keep; exact source weight |
| 555 | Darmanitan (Standard) | 92.9 | 92.9 | `gen_5_families.h:4437` | Keep; exact source weight |
| 990 | Galarian Darmanitan (Standard) | 120 | 120 | `gen_5_families.h:4621` | Keep; exact source weight |
| 1093 | Galarian Darmanitan (Zen) | 120 | 120 | `gen_5_families.h:4685` | Keep; exact source weight |
| 991 | Galarian Yamask | 1.5 | 1.5 | `gen_5_families.h:5261` | Keep; exact source weight |
| 1506 | Mega Garbodor | 107.3 | 107.3 | `gen_5_families.h:5778` | Keep; exact source weight |
| 1002 | Hisuian Zorua | 12.5 | 12.5 | `gen_5_families.h:5965` | Keep; exact source weight |
| 1003 | Hisuian Zoroark | 73 | 73 | `gen_5_families.h:6030` | Keep; exact source weight |
| 992 | Galarian Stunfisk | 20.5 | 20.5 | `gen_5_families.h:9511` | Keep; exact source weight |
| 1004 | Hisuian Braviary | 43.4 | 43.4 | `gen_5_families.h:10279` | Keep; exact source weight |
| 641 | Tornadus (Incarnate) | 63 | 63 | `gen_5_families.h:11112` | Keep; exact source weight |
| 642 | Thundurus (Incarnate) | 61 | 61 | `gen_5_families.h:11246` | Keep; exact source weight |
| 645 | Landorus (Incarnate) | 68 | 68 | `gen_5_families.h:11513` | Keep; exact source weight |
| 648 | Meloetta (Aria) | 6.5 | 6.5 | `gen_5_families.h:12000` | Keep; exact source weight |
| 670 | Floette (Red) | 0.9 | 0.9 | `gen_6_families.h:1688` | Keep; exact source weight |
| 678 | Meowstic (Male) | 8.5 | 8.5 | `gen_6_families.h:2336` | Keep; exact source weight |
| 1155 | Meowstic (Female) | 8.5 | 8.5 | `gen_6_families.h:2398` | Keep; exact source weight |
| 1005 | Hisuian Sliggoo | 68.5 | 68.5 | `gen_6_families.h:4250` | Keep; exact source weight |
| 1006 | Hisuian Goodra | 334.1 | 334.1 | `gen_6_families.h:4315` | Keep; exact source weight |
| 710 | Pumpkaboo (Average) | 5 | 5 | `gen_6_families.h:4575` | Keep; exact source weight |
| 711 | Gourgeist (Average) | 12.5 | 12.5 | `gen_6_families.h:4839` | Keep; exact source weight |
| 1007 | Hisuian Avalugg | 262.4 | 262.4 | `gen_6_families.h:5228` | Keep; exact source weight |
| 720 | Hoopa (Confined) | 9 | 9 | `gen_6_families.h:6076` | Keep; exact source weight |
| 1168 | Hoopa (Unbound) | 490 | 49 | `gen_6_families.h:6143` | Needs Opus; retain stock pending scope decision |
| 1008 | Hisuian Decidueye | 37 | 37 | `gen_7_families.h:221` | Keep; exact source weight |
| 741 | Oricorio (Baile) | 3.4 | 3.4 | `gen_7_families.h:1421` | Keep; exact source weight |
| 1172 | Rockruff (Own Tempo) | 9.2 | 9.2 | `gen_7_families.h:1939` | Keep; exact source weight |
| 745 | Lycanroc (Midday) | 25 | 25 | `gen_7_families.h:2000` | Keep; exact source weight |
| 746 | Wishiwashi (Solo) | 0.3 | 0.3 | `gen_7_families.h:2191` | Keep; exact source weight |
| 773 | Silvally (Normal) | 100.5 | 100.5 | `gen_7_families.h:4161` | Keep; exact source weight |
| 774 | Minior (Meteor Red) | 0.3 | 40 | `gen_7_families.h:4259` | Set `over.species` weight |
| 1199 | Minior (Core Red) | 0.3 | 0.3 | `gen_7_families.h:4297` | Keep; exact source weight |
| 1512 | Mega Orbeetle | 40.8 | 40.8 | `gen_8_families.h:1344` | Keep; exact source weight |
| 1513 | Mega Drednaw | 115.5 | 115.5 | `gen_8_families.h:1907` | Keep; exact source weight |
| 1514 | Mega Coalossal | 310.5 | 310.5 | `gen_8_families.h:2281` | Keep; exact source weight |
| 1515 | Mega Flapple | 1 | 1 | `gen_8_families.h:2471` | Keep; exact source weight |
| 1516 | Mega Appletun | 13 | 13 | `gen_8_families.h:2592` | Keep; exact source weight |
| 1517 | Mega Sandaconda | 65.5 | 65.5 | `gen_8_families.h:2902` | Keep; exact source weight |
| 849 | Toxtricity (Amped) | 40 | 40 | `gen_8_families.h:3331` | Keep; exact source weight |
| 1518 | Mega Toxtricity | 40 | 40 | `gen_8_families.h:3395` | Keep; exact source weight |
| 1519 | Mega Centiskorch | 120 | 120 | `gen_8_families.h:3640` | Keep; exact source weight |
| 1521 | Mega Grimmsnarl | 61 | 61 | `gen_8_families.h:4520` | Keep; exact source weight |
| 875 | Eiscue (Ice) | 89 | 89 | `gen_8_families.h:5139` | Keep; exact source weight |
| 876 | Indeedee (Male) | 28 | 28 | `gen_8_families.h:5262` | Keep; exact source weight |
| 1225 | Indeedee (Female) | 28 | 28 | `gen_8_families.h:5325` | Keep; exact source weight |
| 1523 | Mega Copperajah | 650 | 650 | `gen_8_families.h:5643` | Keep; exact source weight |
| 892 | Urshifu (Single Strike) | 105 | 105 | `gen_8_families.h:6794` | Keep; exact source weight |
| 902 | Basculegion (Male) | 110 | 110 | `gen_5_families.h:4048` | Keep; exact source weight |
| 1234 | Basculegion (Female) | 110 | 110 | `gen_5_families.h:4111` | Keep; exact source weight |
| 905 | Enamorus (Incarnate) | 48 | 48 | `gen_8_families.h:7636` | Keep; exact source weight |
| 1299 | Oinkologne (Male) | 120 | 120 | `gen_9_families.h:659` | Keep; exact source weight |
| 1300 | Oinkologne (Female) | 120 | 120 | `gen_9_families.h:721` | Keep; exact source weight |
| 1316 | Squawkabilly (Green) | 2.4 | 2.4 | `gen_9_families.h:1731` | Keep; exact source weight |
| 1352 | Palafin (Zero) | 60.2 | 60.2 | `gen_9_families.h:4011` | Keep; exact source weight |
| 1391 | Gimmighoul (Chest) | 5 | 5 | `gen_9_families.h:6132` | Keep; exact source weight |
| 1416 | Ogerpon (Teal) | 39.8 | 39.8 | `gen_9_families.h:7414` | Keep; exact source weight |

**Power bands (EI `src/battle_util.c`).** Lines 8693–8717 define Flail/Reversal and weight tables;
8832–8843 use `floor(48 * currentHP / maxHP)` with inclusive thresholds 1/4/9/16/32/48
and powers 200/150/100/80/40/20. Low Kick/Grass Knot (8917–8929) use strict weight comparisons:
<10/<25/<50/<100/<200/≥200 kg gives 20/40/60/80/100/120. Heavy Slam/Heat Crash (8930–8935)
use the integer attacker/defender ratio: <2/2/3/4/≥5 gives 40/60/80/100/120.
Eruption/Water Spout (8832–8834) floor move power times currentHP/maxHP; the final minimum is 1.
Electro Ball (8944–8948) uses integer speed ratio <1/1/2/3/≥4 → 40/60/80/120/150;
Gyro Ball (8950–8953) uses `min(150, floor(25 * defenderSpeed / attackerSpeed) + 1)`.
These are the native Gen 9 engine rules: no shared engine phase or profile power rule is needed.

**Needs Opus — W2 Hoopa Unbound (`1168`).** EI `gen_6_families.h:6143` says `.weight = 490`
(49 kg), while stock and the shared expansion header say 490 kg (`.weight = 4900`). This conflicts
with the binding scope note that EI changes no existing-species weights. Retain stock 490 kg;
the orchestrator must decide whether the release-source typo should override that scope note.
This is not an undocumented form and is not silently treated as a confirmed 49 kg change.

W2 implementation checkpoint: source audit complete; weight overrides and automatic-power fixtures follow.

## Checks

`check.py` [baseline.json [current.json]]: the Locations PDF's wild tables against the dex data slot by slot; given a
pre-Part-B data.json, the keep rule for species (every trainer-used species stays), reference integrity, unchanged tables
and trainers, tracker area indices, walkthrough stop / tick keys, and that finalising again leaves the data
byte-identical. Then `python assemble.py emerald-imperium` (no missing-sprite warning), `tools/domcompare.mjs`
against the previous build, and the viewer-size checks (CLAUDE.md).

## History

- **2026-10-24, walkthrough = Trainers boxes.** The nine gym splits became the Trainers page's 20 boxes, same names and
  order (`walk.name_splits`): 19 cap splits plus the optional Hot House after Brawly, its stop cut into the six badge
  sections (`2.1`, `2.1.f1`...`f5`, named like them). Each stop goes with its trainers' box; Route 110 and Victory Road
  span two caps and are cut in two (second part `2.3.f1` / `8.1.f1`, trainers only). Gardenia moved from Rustboro to the
  Mauville stop, before Wally, where the Trainers page has her (cap 34; the Rustboro step "fight Gardenia at any time"
  stays). Stops keep their keys, so saved ticks and open state carry over (dex.js `migrateWalkState`); the Norman split's
  desert note moved to the Trick House split. The Trainers page now lists each box in walkthrough order (shared
  finaliser `trainers_follow_walk`): Wattson, Mt. Chimney, Flannery, Trick House and Tate and Liza boxes reordered.
  `tools/tabs_check.py` checks both pages agree and caps never go down. Template, same day: Starter above Next step on
  the walkthrough, and the Trainers place buttons show their box's cap (`n/N | cap`).
- **2026-10-23, Items standard.** `tools/itemstd.py` (shared, idempotent; run by `finalise()`) puts Items in the shared
  box set (rules: `itemstd.RULES['emerald-imperium']`). TMs + HMs are one box (182, game order); Shops is one row per item
  (shops one per line, price after the shop; the six berry lists split into single berries; the stray Pomeg Berry row
  dropped; kind from the item name, `EI_KIND`); the 40 Battle item rewards moved into Held Items (class by item),
  Evolution Items (Leaf, Shiny, Ice Stone) and Stats and Abilities (PP Max), as `Also: reward, defeat <trainer> <place>`
  (Leftovers x3 merged); capitalisation fixed (`rename`). Mega Stones and Useful NPCs (A to Z) keep their place text.
- **2026-10-23, Part B (consistency pass).** Species 1,275 -> 1,208: dropped 63 unavailable, unused ordinary / form
  entries and four unused Megas whose base species is unavailable (Mega Mewtwo X / Y, Mega Latias / Latios). Megas /
  Primals need an obtainable base dex number or actual trainer use; trainer-only Primal Dialga / Palkia stay. Original
  species IDs, order, all move / ability / location indices and encounter records kept; links to removed species
  filtered, Mega Stone item facts kept with the removed-species links cleared. AR[0] is `Starter` (`st:1`), same
  location list and index; all 159 tracker area indices, egg subslots and saved tracker species survive.
  Walkthrough keeps its nine splits and every stop and step, now named `<Boss> Split [Cap N]` through `tools/splits.py`
  (Roxanne 15, Brawly 25, Wattson 34, Flannery 47, Norman 59, Winona 68, Tate & Liza 76, Juan 82, Elite Four 85);
  Trainers keeps 20 boxes, only Champion's becomes `Elite Four Split [Cap 85]`. `hack.json` and the localStorage keys are
  unchanged. Saved links to removed species can no longer open a detail page, but no saved ID is reassigned. Checked: all
  481 trainer-used species, 159 areas, 106 stops, 141 steps preserved; finalising twice is byte-identical; consistency
  check (all viewer sizes, normal / dvkb, light theme), `walkcheck` / `pagecheck` at 260x316 and `domcompare` over 2,716
  routes per mode: no page errors (every route differs, since the footer's species count changed). No Thor-device test.
- **2026-10-20, split UI.** Hatch-town slots, Gardenia's move to the Wattson split, folded gift houses, level cap boxes
  and shop sub-headings (Sources and rules) were added to the published data.
- **2026-10-19.** The builder and these notes moved out of the guide's top comment into `extract/` and this file.
- **2026-10-02, first build (claude.ai, five batches).** Pokémon, moves, abilities; changes doc, Locations PDF and
  tracker; Items and Walkthrough with cheat codes; Trainers (138 boss trainers, 677 Pokémon) from the boss sheet + hzla calc.

## Data schema (shared by all four guides)

The other guides' notes link here.

```text
The JSON in #data, the same for every guide. Key order and what is dropped: tools/schema.py, applied by the
extract's finalise(); hack.json: tools/datajson.py HACK_ORDER. [x] = only guides that have that data, the others omit it.
  Top level, in order: M MV AB P LOC AR [ARO] IT WK TR TC built   (no build markers, no source strings)
  M   [moveName]
  MV  [{t type, c category, bp power or "Varies", ac accuracy or null, pp, pr priority, d description, f flags[],
        h change notes[], [dc 1 = the changes doc lists it, e the doc's paragraph], [cf doc-vs-data conflicts[]],
        [x 1 = hack original]}]
  AB  [[name, description, [1 if hack original, [changed]]]]   (trailing falsy values are not written)
  P   [{id speciesId string, n display name, dex, t[types], a[abilityIdx], ha hidden abilityIdx or -1,
        s[HP,Atk,Def,SpA,SpD,Spe], ef/et [[how, id]] evolves from/into, of[ids] other forms, lv[[level, moveIdx]]
        (level 0 = learned on evolution), tm[moveIdx], [tu[moveIdx] tutors], eg[moveIdx], w[[LOCidx, method, rate,
        levels, note]], g availability (0 obtainable, 1 Mega/Primal, 3 not found / trainer only),
        [hi wild held item names], [stone, sloc: a Mega's stone and where to get it], [nu 1 = Mega not usable],
        [fc 1 = form change], [cf doc-vs-data conflicts[] ("Sources disagree" card)]}]   dex order, base form then other forms
  LOC [sublocationName] in tracker order
  AR  [{n area name, l[LOC idx], [st 1 = the starter picker is this area's tracker], [sub [AR idx] tracker slots the
        area is split into (hatch towns, one per egg), in = the area a slot belongs to], [es the area's encounter
        sections], [map [data URI]], [ns 1 = no tracker slot], [note]}]   (slots are appended after the tracker's areas
        so saved trackers, keyed by AR index, keep their meaning)
  ARO [AR idx] [optional] the Locations page's area order, where areas added later sit at the end of AR (same reason)
  P.w methods: Grass/cave, Surf, Old/Good/Super Rod, Rock Smash (rates are %), Static, Gift, Egg / Starter egg /
  Pseudo egg, Starter choice, Hot House (N+ badges), Choice (...), Roaming (rates "1 of N"); w[4] = how to get it.
  IT  [{n section, k tm|mega|gen|npc, note, r:[[item, text, link (move idx or mega id), missable 1?, sub-heading]]}]
      (the Items standard: tools/itemstd.py)
  WK  {splits:[{n "Name Split [Cap N]" (the cap is read from the name; none after the League), [note],
       st:[{k stop key, n place, a[AR idx], s:[[step, note]], [note], it:[[section, item, text, link]],
       tr [trainer keys], [x 1 = "on the way" stop]}]}], np unplaced items, [docs [[title, text]]],
       [ko {rows, note}], [cheats [[code, alias, text, toggle]], cnote]}
       Stop key k: the stop's identity for saved state. A guide's first build sets it to "split.stop" (its position
       then) and it never changes; when stops are regrouped or reordered the old key stays (a stop split in two gets
       "<key>.f1"), and dex.js migrateWalkState moves the saved ticks / collapse state to the new positions by key.
       Positions in state are "split.stop"; there is no separate legacy table (the root of a key is its legacy position).
  TR  {g:[{n box (= the walkthrough split name), cap, tab sheet tab, [note[]], sec:[{h place, [cap [level, who, where,
       battles left]], [note[]], [opt 1 = optional place], [rw reward choices], tr:[trainer]}]}], caps:[[label, cap]]
       (the page's Level caps table)}
       (boxes are level cap runs named from caps, places runs of one location; Hot House stays one box)
       trainer {k "g.s.t" key, n name, loc place, tags[] (Optional, Double Battle, Back to Back #1, Permanent Rain, Trick
       Room...), [st "Water"/"Grass"/"Fire" or the starter's name = shown if that is YOUR starter], [cap default level
       cap], note[], [field evidence records], [rw rewards], [pp pokepast url], [c calc trainer names], [bt battle id shared by trainers fought at
       once], [pl "m"/"f" = shown for that player character], [pt partners [{n, st, pl, p}]], p:[mon]}
       mon {id speciesId (Mega/Primal form when it holds the stone), l absolute level OR r relative to the cap, i item,
       [a0 ability before Mega Evolution], a ability idx (Mega ability for Megas), [ao "A / B" when the slot is random],
       [na nature], iv[6], [ev[6]] (HP,Atk,Def,SpA,SpD,Spe), m[moveIdx], [hp Hidden Power type (from IVs)], [ld lead
       slot], [pre[status]], [x[sheet extra speed lines]], [cf[sheet values that differ from the calc]],
       [src "s" = sheet only]}
  WK stop .tr [trainer keys]: placed by location name within the walkthrough split (gym leaders take the last matching
       stop, others a forward pointer; Route 111 desert fights in Split 5 sit with Mirage Tower; Elite Four with Victory
       Road; fallbacks: Gardenia (post 3rd badge) -> Verdanturf Town, Crasher Wake -> Mauville City).
  Level caps: a trainer's default cap is the cap of the next boundary fight in the Navigation list (Roxanne 15, Rustboro
       rival 20 ... Champion 85); Hot House tiers 2-7 badges = 30/44/56/64/71/80. This reproduces every "level cap used
       for the speed calculation" note in the sheet.
  TC {attackType: {defendType: multiplier x10}}   built (date)

STAT FORMULA (Gen 3+)
  HP    = floor((2B + IV + floor(EV/4)) x L / 100) + L + 10
  Other = floor((floor((2B + IV + floor(EV/4)) x L / 100) + 5) x nature)
```

Trainer `field` is optional, data-only preparation for a later field UI. Shared finalisation regenerates it from
group/section/trainer notes and trainer tags (`tools/trainer_fields.py`); it never inspects team moves, abilities
or held items. Each record is `{scope, text, effects, review}`: scope identifies the original note/tag level,
text is the complete existing wording, effects holds conservative normalisations, and review marks unresolved
labels or incomplete targeting/outcomes. Effects use `{kind, value, [duration], [side], [timing], [layers]}`;
absent properties are unknown, not defaults. Kinds: weather, terrain, room, side-condition, hazard, critical-bonus.
Side is player or opponent; weather/terrain/rooms are global. Duration `permanent` records the doc wording, not
a claim that an effect cannot be replaced. Timing is battle-start or after-first-send-out when documented.
Repeated section/trainer evidence describes one effect, not stacked applications. No template or calc consumer
applies these records yet; `review: false` does not mean the engine supports the effect or its special rules.
