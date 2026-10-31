# Emerald Imperium build notes

Emerald Imperium 1.3 / 1.3.1, a GBA hack of Pokémon Emerald. Data from the hack's dex site, the official docs and the
game's own trainer sets. 1,208 species and forms, 159 tracker areas, 20 trainer boxes (138 boss trainers), 20 walkthrough
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
- **Items**: `tools/itemstd.py`, `itemstd.RULES['emerald-imperium']`. TMs + HMs share one box (182, game order).
  Shops have one row per item, each shop and price on its own line; berry lists split into individual berries.
  Battle rewards are `Also:` rows under the item's class, not a separate reward box; duplicate Leftovers merge.
  Mega Stones and Useful NPCs keep place text; NPCs sort A to Z. Name fixes use the rule's `rename` map.
- **Kept species**: obtainable species or actual trainer use; Megas / Primals need an obtainable base dex number
  or trainer use. Trainer-only Primal Dialga / Palkia stay; unused Mega Mewtwo X/Y and Mega Latias/Latios do not.
  IDs, order and move/ability/location indices are preserved; links to removed species are cleared, including
  Mega Stone links, but item facts stay. All 159 tracker area indices and egg subslots remain stable.
- **Walkthrough**: `walk.name_splits` follows the Trainers page's 20 boxes (19 cap splits plus Hot House).
  Hot House has six badge fragments (`2.1`, `2.1.f1`...`f5`); Route 110 / Victory Road's second-cap fragments
  (`2.3.f1` / `8.1.f1`) contain trainers only. Gardenia is at Mauville before Wally, cap 34; Rustboro's instruction
  to fight her any time stays. The desert note belongs to Trick House. Persistent stop keys let
  `dex.js` `migrateWalkState` move saved ticks/open state without losing them. `tools/tabs_check.py` checks
  walkthrough/trainer order and nondecreasing caps.

## Local storage (prefix ei)

`eidex1` list filters / sort / availability, `eicalc:<species name>` (was `<id>`, moved on load) + `eicalc:lastlv` stat calc, `eitrack`
tracker {e:{areaIdx:{p:species name (was id)} or {f:1}}}, `eiwalk` walkthrough {c:{split.stop.step:1}, o:{open splits, gi: Guide info}, x:{closed stops, doc*: open
docs}, s:{split.stop.c/e/i/t: section open 1 / closed 0}}, `eicap` {trainer key (stable): your highest level}, `eitr` open trainer
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

Area conditions (trainer `field`): EI "Permanent Sand" (Route 111, desert route) is applied as Sandstorm;
the "Trick Room" tags (Grace & Declan, Sidney) as Trick Room. Sidney's "Tailwind / TrickRoom" and Glacia's
"Snow / Sun" are team-variant labels, not conditions.
Doubles: each "Double Battle" / "True Double Battle" trainer gets one `gameType: 'Doubles'` record (source = the tag, `tools/trainer_fields.py`; 14 trainers).

Profile: `cfg.calc` in `hack.json` over `template/calc/profiles/expansion.json` (Gen 9 mechanics). Settings
checked: EI's own `include/config/battle.h` sets every damage switch used here to `GEN_LATEST`, which is `GEN_9`
in this release (`iriv24/pokeemerald-expansion` at `2576d0f3…`). hzla's pinned profile uses dmgGen 8 for the same
hack; the source-backed Gen 9 base stays, with explicit field fixtures added in the refinement. `Frostbite` is on `frz` (see the status
note below). `ls.dmg` (`eidmg`) is unchanged.

Sources: the mechanics are read from the pinned release's `src/battle_util.c` and `include/config/battle.h`
(fetch recipe: `SOURCES.md`, never shipped). Source paths and lines below are relative to that release. The oracle is hzla's Dynamic-Calc-Decomps, pinned at `ff6c3e3…`, run
locally with `tools/calc/hzla_compare.mjs`; its code and tables are not copied. Where hzla and the source
differ, the source wins. Known differences are recorded in `calc_matchups.json`. Engine contracts and
validation commands: `tools/calc/README.md` → Hack validation; page behaviour: `template/README.md` → Damage calculator.

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
| Self-Destruct, Explosion, Misty Explosion halve the target's defending stat (`B_EXPLOSION_DEFENSE` is `GEN_4`): the raw stat, floored, before stages, after Wonder Room's swap; Misty Explosion halves Sp. Def | `beforeStats` halves `def.rawStats.def` (physical without Wonder Room) or `.spd` (otherwise) | 9774–9775 | explosion-*, self-destruct-*, misty-explosion-*: plain, +1 stage, Wonder Room, crit |
| Ruin abilities (Tablets / Sword / Vessel / Beads): ×0.75 in the attacking / defending stat chain while any living battler has one, except a battler with the same Ruin; Psyshock counts as Defense | native (stock reads the holder's ability) | 9681–9685, 9843–9847, `IsAbilityOnField` 6542 | ruin-*: each Ruin, its holder, the other category, Psyshock, two Ruins, both Tablets |

Status: EI's `B_USE_FROSTBITE` makes frostbite replace freeze in most cases (`include/config/battle.h`), and a few
moves still freeze. A frozen attacker cannot act, and a frozen defender has no damage effect here, so only frostbite
changes a result. The `frz` key is labelled Frostbite; no Freeze option is shown.

Not changed from native: Toxic Boost, Flare Boost, Water Compaction, Adaptability, Technician and the other vanilla
abilities use the Smogon/expansion behaviour. Checked against source: Toxic Boost (physical, 1.5×), Flare Boost
(special, 1.5×). Defeatist needs the override above because stock triggers at half HP.
The rest are not audited line by line.

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
- Explosion's halving: hzla halves the staged Defense with round-half-down, after weather; the source floors the raw
  stat before stages. They agree without a stage; with +1 on an odd halved stat they differ (Lickitung 95 → 47 → 70,
  hzla 142 → 71). Under Wonder Room hzla swaps the defences twice (as in Photonic Sun's notes) and halves Defense.

#### Scope and profile choices

Release `2576d0f3`: `include/config/battle.h`, `item.h`, `pokemon.h`, `src/battle_util.c`, map scripts
and `trainer_parties.h` determine availability, not the oracle's field list.
- **Inverse battles: none.** `B_FLAG_INVERSE_BATTLE` is `0`; effectiveness only inverts when non-zero
  (`battle_util.c` 10710), and no trainer or script sets it.
- **Shadowy Veil: absent.** No ability or move in the release, docs, eidex or oracle backup.
- **Non-latest damage switches:** `B_EXPLOSION_DEFENSE` `GEN_4` (table above); `B_PROTEAN_LIBERO` `GEN_1`
  (type change on every move); `B_INTREPID_SWORD` / `B_DAUNTLESS_SHIELD` `GEN_1` (every entry).
  Non-latest `item.h` / `pokemon.h` switches are overworld / graphics only.
- **Not available:** Terastallization, Z-Moves, Dynamax (only the Mega Ring is given; no trainer sets them),
  Commander, Battery, Dragon Cheer or Pledge moves.
- **Profile inputs:** fainted allies, Rage Fist count, switching, Glaive Rush, Salt Cure, Tar Shot, Charge,
  hazards, Snow and Neutralizing Gas; move/ability-gated ally Power Spot, Steely Spirit, Flower Gift,
  Fairy/Dark Aura, Aura Break, Ruin and Plus/Minus; Power Trick, Sports, Power/Guard Split, Laser Focus,
  Lucky Chant and Protect. Shared grouping, generation gates and effects: `tools/calc/README.md` → Base profiles and fields.
- **Electrify / Ion Deluge:** use the move's Type override (`slot.t: 'Electric'`), not a separate toggle.
- **Hail-setting moves set Snow**, not Hail.

#### Conditional mechanics and validation

- `abilityOn` is opt-in for Bull/Quill Rush and Illusion, never inferred from switch history.
  Own and allied Emperor's Presence stack; the allied effect is Doubles-only.
- Draco Barrage compares integer-truncated, staged Atk/Def and SpA/SpD estimates using Shell Side Arm's
  fixed power 100 and level term, not attacking stats alone or final damage with items, abilities, weather
  or screens. The source randomises integer ties; Auto defaults to Special and `slot.invert` selects the other
  category, in ties or non-ties. The chosen category controls contact.
- Ice Eater provides Ice immunity with Mold Breaker, Ability Shield and Neutralizing Gas boundaries;
  healing is not part of its single-attack damage result. Parasitic Waste's on-hit healing is not modelled.
- Self Sufficient heals 1/16 at turn end (`battle_util.c` 5137–5142), and Frostbite costs 1/16 (2447–2452).
  `cfg.calc.residual` feeds turn-end actions and KO estimates, never damage rolls.
- Blazing Soul reports effective priority, including Psychic Terrain blocking. `slot.order` feeds
  order-dependent power without choosing a foe's move. The Speed highlight is not a turn-order promise.
- Calculate hypothetical damage even when the attacker is asleep or frozen. `frz` means Frostbite here.
- `MV.cr` comes from release `src/data/moves_info.h`: Snipe Shot 2, Razor Shell 1, Zippy Zap always.
  **Doc says** Aqua Tail +1; the source has none. `over.critItems` gives Leek +1 for Farfetch'd (Galarian too),
  +2 for Sirfetch'd (`battle_script_commands.c` 1956–1979; stock gives +2 for both).
- Spectral Thief uses `over.state: {theft: "headroom"}` (`battle_script_commands.c` 17783/17837):
  a stat at +6 is not taken; gain is limited to remaining room before Simple / Contrary.
  Intrepid Sword / Dauntless Shield fire on every entry (`battle.h` 152–153) unless `entry` is false.
- Oracle `noSwitch` concerns AI switch prediction, not damage. Its `evs=0` is a catalog No EVs variant,
  not a universal ban: keep EV support and MGM's zero-EV selection.

`tools/calc/imperium_check.mjs` independently checks category estimates, modifier placement/rounding,
Gen 9 field rolls and unchanged Gen 8/9 parity, priority/order, EVs and immutable inputs. It runs in
`npm test --prefix tools/calc`; `calc_states.json` holds state/crit fixtures. KO estimates repeat an attack
under fixed inputs, not a turn simulation: they do not expire First turn out, break disguise, apply healing
or decide later move order. In-game confirmation remains open (below), including Quill Rush special damage,
integer-tied Draco Barrage distribution, allied Emperor stacking and Blazing Soul into Psychic Terrain.

#### Weights and automatic power

All 1,208 guide species have source-backed weights: 1,080 stock-name lookups, 128 `weightNames()` fallbacks,
no 1 kg defaults. Weights are source hectograms / 10, not hzla data. Source: `iriv24/pokeemerald-expansion`
`2576d0f3f4c861c760f0c55198e37e6d7b91683e`, `src/data/pokemon/species_info.h` and its
`gen_1_families.h` through `gen_9_families.h` under `src/data/pokemon/species_info/`.
The parent header supplies the hack Megas; do not substitute a base species or Gigantamax form.
Fetch the release with `SOURCES.md`; source paths below are relative to that release.

`cfg.calc.over.species` overrides the stock/fallback weights:

| ID | Form | kg | Release source |
| --- | --- | ---: | --- |
| 1493 | Mega Infernape | 70 | `species_info.h:564` |
| 1492 | Mega Empoleon D | 160 | `species_info.h:499` |
| 1489 | Mega Luxray | 46 | `species_info.h:306` |
| 1531 | Mega Roserade | 20 | `species_info.h:692` |
| 774 | Minior (Meteor Red) | 40 | `gen_7_families.h:4259` |
| 1168 | Hoopa Unbound | 49 | `gen_6_families.h:6143` |

Hoopa's `.weight = 490` is 49 kg, an inherited expansion typo rather than the official 490 kg.
The release source wins over the old scope assumption that no existing species weights change.

Automatic-power bands are native Gen 9: `src/battle_util.c` 8693–8717, 8832–8843, 8917–8953
(Flail/Reversal, Low Kick/Grass Knot, Heavy Slam/Heat Crash, HP power, Electro Ball/Gyro Ball).
No profile power rule is needed. The adapter reports computed power, including Eruption / Water Spout /
Dragon Energy, for the Power box. `tools/calc/imperium_check.mjs` independently checks weight boundaries,
integer ratios, exhaustive HP and speed-stage cases against fixed-power reference calculations.
The 23 automatic-power fixtures in `calc_matchups.json` omit `slot.bp` so they exercise the native rules.

#### Save import

Reader `expansion` (`cfg.calc.save`; format notes `template/calc/readers/README.md` → expansion: pokeemerald-expansion
(the 28-sector slot and expansion Pokémon struct)). `extract/gid.py` writes `GID` after the prune from the release's expansion headers
(`tools/expansion_ids.py`): species (our P ids are the game's species numbers, all 1,208 checked by name), moves (789 of
789 by name), abilities (284 of 284; the two "As One" by description), items (the game's names, 20 squeezed ones spelt as
Showdown and the trainer sets do: Never-MeltIce -> Never-Melt Ice, so their calc effects apply), growth rates (every
species; EI's Primal Dialga / Palkia from `species_info.h`). The 67 pruned species have no GID entry: an imported one is
skipped and counted in the banner ("· 1 not in this guide").

Checked 2026-10-27 (`.src/saves/`, SOURCES.md):
- `hzla-Emerald Imperium 1.3.sav` (hzla's original save) against `ei-1.3.expected.json` (written by `tools/calc_paste_expected.py` from
  hzla's paste of the same save, `--layout box13:3,party:6,box0:24`): all 33 match (species incl. Alolan Marowak,
  Galarian Rapidash, Aegislash; level, nature, ability slot incl. hidden, item incl. Mega Stones, moves, IVs incl. two
  30s in Speed / Sp. Atk, which checks the stat reorder). The paste has no EVs and all its levels are 56, which the
  party's stored levels confirm.
- A copy with a mint (Impish -> Adamant), EVs (4 HP / 252 Atk / 252 Spe) and one Pokémon made a pruned species
  (Mewtwo): nature, EVs and the skip all as expected (made by hand; the save has no mints or EVs of its own).
- Banners: hzla's mGBA save state -> Save state; a Renegade Platinum save -> Wrong game; one flipped byte in the party
  sector -> Unreadable; a blank flash and a save with party count 0 -> No Pokémon yet. the second save `hzla-em_imp.sav`
  imports 6 + 25 (levels 1-56, Pikachu (Pop Star)); no expected file for it.
- Not checked yet: a save from the user's own game (EI 1.3.1), RetroArch's `.srm`, a Pokémon with its form in a
  macro-built family (Vivillon) and the ability randomiser (not modelled).

#### In-game tests

Rolls are the engine's 16 rolls (`tools/calc`). Level 50, Serious nature, 31 IVs, 0 EVs, no item, no field, no crit
unless stated. Multi-hit rolls are per hit.

- **Triple Kick scales per hit.** Settles: power is 20, 40, 60 on hits 1-3, not 20 on each hit.
  - Attacker: Hitmontop (Atk 115), ability Intimidate. Technician would boost these 20-power hits, so it must not be the ability.
  - Defender: Blastoise (HP 154, Def 120). Move: Triple Kick, all three hits land.
  - Expected: hit 1 `12 12 12 12 12 13 13 13 13 13 13 13 13 13 13 15`; hit 2 `22 22 22 22 24 24 24 24 24 24 25 25 25 25 25 27`;
    hit 3 `33 34 34 34 36 36 36 36 37 37 37 37 39 39 39 40`.
  - Other way (flat 20 on every hit): all three hits show the hit 1 list.
- **Self Sufficient heals at turn end.** Settles: heal is floor(max HP / 16), minimum 1, at turn end, never in the rolls.
  - Defender: Turtwig, ability Self Sufficient, max HP 22. No attacker needed.
  - Expected: +1 HP at each turn end (floor(22 / 16) = 1).
  - Other way: no heal at turn end.
- **Frostbite costs HP at turn end.** Settles: Frostbite is 1/16 of max HP per turn.
  - Defender: Blastoise with status Frostbite (`frz`), max HP 154.
  - Expected: -9 HP at each turn end (floor(154 / 16)). Other way (1/8, as a burn): -19.
- **Bull Rush boosts special moves on the first turn out.** Settles: whether the 20% Bull Rush boost applies to a special move.
  - Attacker: Snorlax (Atk 130, SpA 65) with ability Bull Rush, first turn out. Any mon with Bull Rush; the stats are Snorlax's.
  - Defender: Blastoise (Def 120, SpD 105). Move: Psychic (Special, power 90).
  - Expected (Bull Rush on): `28 29 29 29 30 30 30 31 31 31 32 32 32 33 33 34`.
  - Other way (no boost on specials): `23 24 24 24 24 25 25 25 26 26 26 26 27 27 27 28`.
- **Draco Barrage category on an exact Atk = SpA tie.** Settles: the category the game uses when Atk and SpA are equal.
  The calc's automatic choice is Physical.
  - Attacker: Celebi (Atk 120, SpA 120). Defender: Snorlax (Def 85, SpD 130, HP 235). Move: Draco Barrage (Dragon, Special, power 100).
  - Expected (calc, Physical): `54 55 55 56 56 57 58 58 59 60 60 61 62 62 63 64`.
  - Other way (the game uses Special): `35 36 36 36 37 37 38 38 39 39 39 40 40 41 41 42`.
- **Self-Destruct halves Defense.** Settles: `B_EXPLOSION_DEFENSE` `GEN_4` (the target's Defense is halved), not the
  Gen 5+ rule. Explosion would OHKO here, so the test uses Self-Destruct.
  - Attacker: Snorlax (Atk 130). Defender: Blastoise (HP 154, Def 120). Move: Self-Destruct (Normal, power 100).
  - Expected: `123 124 126 127 129 130 132 133 135 136 138 139 141 142 144 145`.
  - Other way (no halving): `61 63 63 64 64 66 66 67 67 69 69 70 70 72 72 73`.

## Checks

`check.py` [baseline.json [current.json]]: the Locations PDF's wild tables against the dex data slot by slot; given a
pre-pruning data.json, the keep rule for species (every trainer-used species stays), reference integrity, unchanged tables
and trainers, tracker area indices, walkthrough stop / tick keys, and that finalising again leaves the data
byte-identical. Then `python assemble.py emerald-imperium` (no missing-sprite warning), `tools/domcompare.mjs`
against the previous build, and the viewer-size checks (CLAUDE.md).

## History

- **2026-10-24:** Walkthrough regrouped into the Trainers page's 20 boxes, retaining persistent stop keys.
- **2026-10-23:** Shared item standard; 1,275 → 1,208 species under the obtainable/trainer-used rule, saved IDs preserved.
- **2026-10-20:** Hatch-town slots, Gardenia in the Wattson split, town gift houses and shop sub-headings added.
- **2026-10-02:** First guide from dex/changes/location docs, boss sheet and hzla trainer sets.

## Data schema (shared by all four guides)

The other guides' notes link here.

```text
The JSON in #data, the same for every guide. Key order and what is dropped: tools/schema.py, applied by the
extract's finalise(); hack.json: tools/datajson.py HACK_ORDER. [x] = only guides that have that data, the others omit it.
  Top level, in order: M MV AB P LOC AR [ARO] IT WK TR TC [GID] built   (no build markers, no source strings)
  M   [moveName]
  MV  [{t type, c category, bp power or "Varies", ac accuracy or null, pp, pr priority, [cr crit stage when not 0,
        6 = always a crit (the damage calc)], d description, f flags[], h change notes[], [dc 1 = the changes doc
        lists it, e the doc's paragraph], [cf doc-vs-data conflicts[]], [x 1 = hack original]}]
  AB  [[name, description, [1 if hack original, [changed, [statement, original]]]]]
      [0] name, [1] in-game description, [2] hack-original flag, [3] changes-doc text,
      [4] complete hack-effect statement, [5] standard original effect. Trailing falsy values are not written.
      EI's changed, non-original abilities get [4] and [5] from extract/ability_text.json (s and o).
      Other abilities keep their existing fields. Mountaineer's original is Showdown CAP, not a vanilla ability.
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
       Trainer key k: the trainer's identity for saved state (level caps, the calc, recents, open state). The extracts
       number trainers "g.s.t" while they build; finalise (tools/trainer_keys.py) then gives each its key from the
       committed extract/trainer_keys.json, matched on identity (name, place, starter / player variant, game trainer
       id when the source has one, team species): a key never changes, a new trainer gets "t<N>". The table was
       seeded 2026-10-29 with the keys as they were, so no saved state moved. The build report lists loose matches,
       new keys and entries nothing matched (a trainer renamed with a new team loses its state unless its entry is
       edited to the new name).
  TR  {g:[{n box (= the walkthrough split name), cap, tab sheet tab, [note[]], sec:[{h place, [cap [level, who, where,
       battles left]], [note[]], [opt 1 = optional place], [rw reward choices], tr:[trainer]}]}], caps:[[label, cap]]
       (the page's Level caps table)}
       (boxes are level cap runs named from caps, places runs of one location; Hot House stays one box)
       trainer {k key (Trainer key below), n name, loc place, tags[] (Optional, Double Battle, Back to Back #1, Permanent Rain, Trick
       Room...), [st "Water"/"Grass"/"Fire" or the starter's name = shown if that is YOUR starter], [cap default level
       cap], note[], [field evidence records], [rw rewards], [pp pokepast url], [c calc trainer names], [bt battle id shared by trainers fought at
       once], [pl "m"/"f" = shown for that player character], [pt partners [{n, st, pl, p}]], p:[mon],
       [normal {easy level decrement for Easy, p:[mon] Normal team; collapsed, no saved state}]}
       mon {id speciesId (Mega/Primal form when it holds the stone), l absolute displayed level OR r relative to the cap,
       [sl stat level, only when different from l; Gen V Challenge level bug, never substituted for the displayed level], i item,
       [a0 ability before Mega Evolution], a ability idx (Mega ability for Megas), [ao "A / B" when the slot is random],
       [na nature], iv[6], [ev[6]] (HP,Atk,Def,SpA,SpD,Spe), m[moveIdx], [hp Hidden Power type (from IVs)], [ld lead
       slot], [au[5] Totem aura stages Atk,Def,SpA,SpD,Spe], [pre[status]], [x[sheet extra speed lines]], [cf[sheet values that differ from the calc]],
       [hn[hzla disagreements shown as "hzla says ..."]], [src "s" = sheet only]}
  WK stop .tr [trainer keys]: placed by location name within the walkthrough split (gym leaders take the last matching
       stop, others a forward pointer; Route 111 desert fights in Split 5 sit with Mirage Tower; Elite Four with Victory
       Road; fallbacks: Gardenia (post 3rd badge) -> Verdanturf Town, Crasher Wake -> Mauville City).
  Level caps: a trainer's default cap is the cap of the next boundary fight in the Navigation list (Roxanne 15, Rustboro
       rival 20 ... Champion 85); Hot House tiers 2-7 badges = 30/44/56/64/71/80. This reproduces every "level cap used
       for the speed calculation" note in the sheet.
  TC {attackType: {defendType: multiplier x10}}
  GID [optional] the save importer's game id tables, lists indexed by game id (null = nothing maps): sp -> P id,
      mv -> M idx, ab -> AB idx, it -> item name, [gr -> growth rate 0-5 (GROWTH_ order), for readers whose boxed
      Pokémon store only experience]. Written after the prune (M / AB indexes); template/calc/readers/README.md
  built (date)

STAT FORMULA (Gen 3+)
  HP    = floor((2B + IV + floor(EV/4)) x L / 100) + L + 10
  Other = floor((floor((2B + IV + floor(EV/4)) x L / 100) + 5) x nature)
```

Trainer `field` is optional evidence for the calc's automatic Field defaults and Area line. Shared finalisation regenerates it from
group/section/trainer notes and trainer tags (`tools/trainer_fields.py`); it never inspects team moves, abilities
or held items. Each record is `{scope, text, effects, review}`: scope identifies the original note/tag level,
text is the complete existing wording, effects holds conservative normalisations, and review marks unresolved
labels or incomplete targeting/outcomes. Effects use `{kind, value, [duration], [side], [timing], [layers], [source]}`;
absent properties are unknown, not defaults. Kinds: weather, terrain, room, side-condition, hazard, critical-bonus and gameType.
Side is player or opponent; weather/terrain/rooms are global. Duration `permanent` records the doc wording, not
a claim that an effect cannot be replaced. Timing is battle-start or after-first-send-out when documented.
Repeated section/trainer evidence describes one effect, not stacked applications. The calc consumes supported
effects (weather/terrain, Trick Room, foe Tailwind/crit, hazards and automatic Doubles); variant labels are ignored.
Fog and random terrain remain text only. `review: false` does not imply support for every special rule.
UI precedence and lifecycle: `template/README.md` → Damage calculator; normalization: `tools/trainer_fields.py`.
