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

Mechanics audit in progress (2026-10-25). The starting `cfg.calc = {base: "expansion"}` is not yet a
verified EI profile. Baseline: `820e5a42e5c472ea7483a3b45caf16e8d2d12eb7`; gate logs in
`.tmp/gate/20261025-091923-768412/` (baseline assembly passed).

- Official site links hzla's Dynamic-Calc-Decomps. Read-only oracle pinned at
  `ff6c3e339e276e6b4e8e44db58750b6534bc26aa`; `index.html`, `js/romhack_catalog.js` and
  `backups/title_to_backup_mappings.js` select `data=imp13`, `dmgGen=8`, `gen=8`, `types=6`,
  `noSwitch=1`, and `evs=0` or `1`. EI 1.3 uses `backups/imp_1-3.js`; `imp` is EI 1.2.
  No EI profile is registered under `calc/mechanics/romhacks/`; behaviour also lives in shared
  `gen789.js`, `util.js` and UI data-loading adjustments. Never copy that code or its tables.
- Game source located: `iriv24/pokeemerald-expansion`, `release` at
  `2576d0f3f4c861c760f0c55198e37e6d7b91683e` (also available from the aki-mizu fork).
  `include/config/battle.h` sets modern critical damage/chance, type matchups, split, terrain,
  Transistor and Snow Warning; Frostbite is enabled; Protean/Libero activates repeatedly.
  `src/battle_util.c` contains custom damage abilities. Exact ROM/source correspondence needs checking.
- Another dedicated calc: `harryjowright/emerald-imperium-damage-calc`, locally pinned at
  `516eca76fcb3dd79d8b13fcb8d069581c9164c6b` (2025-02-26). It predates the release source
  and the 1.3.1 workbook and is not linked by the official site.

Remaining: finish source/doc audit, implement oracle comparison and fixed cases, write overrides,
resolve differences and run engine/build checks. No in-game test yet.

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
       cap], note[], [rw rewards], [pp pokepast url], [c calc trainer names], [bt battle id shared by trainers fought at
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
