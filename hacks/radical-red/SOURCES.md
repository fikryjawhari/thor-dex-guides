# Radical Red docs

Fetched 2026-10-18 (game v4.1), RomHackDex move details 2026-10-19; official docs, official dex data, Showdown / calc
/ hzla references and vanilla FireRed text 2026-11-01. Target: **Radical Red 4.1 (released 2024-03-22), Hardcore
mode**. Closed source (CFRU + DPE): the game data is what the official dex and hzla extracted from the ROM; the
author's docs are the check.

| Path | Contents |
| --- | --- |
| `repos/Radical-Red-Pokedex/data.js` | **The official dex's data** (dex.radicalred.net, byte-identical to the live site): 1,343 species (stats, types, abilities with hidden, egg groups, wild held items, level-up / TM / tutor / egg moves, evolutions, the `changes` field on 667), 1,003 moves (type, split, power, accuracy, PP, priority, target, effect chance, description), 255 abilities with in-game text, 749 items with bag text, TM and tutor lists, 221 areas in game order (day / night grass, rods, surf, Rock Smash, raids 1-6 with drops, statics, gifts, trades, roamer, standard / hidden / shop / cheat items, tutors, trainers; inner keys are the cap step the content unlocks at), 464 trainers with **hardcore and normal teams** (nature, ability slot, level, item, moves, IVs, EVs, cap step, area), 18 level caps (`[normal, hardcore]`), scaled-level codes, 1,333 sprites as data URLs. Encodings: the site's `src/*.js` (copied alongside). Commit `488a091`, data.js last changed 2024-04-07/15 ("updated to RR 4.1") |
| `drive/` | The author's Drive folder (v4.1 docs): `4.1 Changelog`, `Changelog up to v4.0`, `Evolution Changes v4.1`, `All Pokemon Changes v3.1` (outdated), `Follower Pokémon Guide`, `Useful Links & Resources` (version, level caps, codes), `Item, TM, and Move Tutor Locations v4.1` (TMs, tutors, overworld items, Mega Stones, Z-Crystals, shops, care packages), `Pokémon Locations & Raid Dens v4.1` (grass / caves, fishing / surf, fossils, Safari, statics, raid dens, egg vendor / Game Corner, trades, gifts, mystery gifts, unobtainables), `Wonder Egg Pokémon Pools v4.1`, `rr4_1.ups` (the patch; never commit) |
| `trainers-hardcore.xlsx` | "Restricted/Hardcore Mode Info & Hardcore Bosses v4.1": **Main tab = Hardcore rules** (permanent AI weather / terrain, banned abilities and their replacements, banned moves, item swaps and removals, hardcore caps), Trainer Order, every boss tab. Cells equal the 2026-11-01 download |
| `trainers-normal.xlsx` | "Default Mode Bosses v4.1 (with EVs)", same layout. Cells equal the 2026-11-01 download |
| `repos/pokemon-showdown/` | RR Showdown server (`RadicalRedShowdown/pokemon-showdown` `5495579`, MIT): base `data/` (moves with flags, abilities, items, conditions) and `data/mods/gen9rr/` (RR's overrides: moves, abilities with their exact code, items, pokedex, learnsets, scripts, rulesets), `config/formats.ts`. Edited after 4.1 (PvP balance, CAP): use for move flags and what changed abilities / items do, not for numbers |
| `repos/damage-calc/` | Official RR calc (calc.radicalred.net, `RadicalRedShowdown/damage-calc` `7f35400`, MIT): `calc/src/data/` (species, moves, abilities, items), `calc/src/mechanics/gen789.ts` / `util.ts`, `src/js/data/sets/hardcore.js` (1,560 Hardcore boss sets) and `normal.js` |
| `repos/Dynamic-Calc-Decomps/` | hzla (`2a54a6d`, no top-level licence: reference only): `backups/radredhc.js` (every trainer extracted from the ROM, Hardcore), `radrednm.js` / `radrednmnew.js` + `trainer_orders/radrednmnew.js` (normal), `js/savereaders/savereader_radicalred.js` + `save_constants/radical_red_*` (species, moves, items, abilities by game ID; randomiser tables), `calc/test/radicalred-savereader.test.js` (its fixtures are external saves, not in the repo) |
| `repos/pokefirered/` | Vanilla base text (`pret/pokefirered` `ce6406d`): `src/data/items.json` (bag text), `src/move_descriptions.c`, `src/data/text/abilities.h`, to mark text RR changed (Gen 1-3 entries only) |
| `romhackdex/` | RomHackDex mirror (2026-10-18): 1,343 Pokémon, 204 locations, 248 items, move / ability / type tables; `moves.json` (`tools/rhd_moves.py`). Second opinion on the official dex |

## Inventory (new-guide-sources.md)

| Area | Covered by |
| --- | --- |
| Pokémon (species, forms, types, stats, abilities, evolutions, learnsets, obtainable) | `data.js` species; changes: `data.js` `changes` + `drive/4.1 Changelog`, `Evolution Changes`; unobtainables: locations sheet → Unobtainables, Hardcore Main (Shedinja) |
| Wild held items | `data.js` species `items` [common, rare] (416 species) |
| Moves | `data.js` moves; flags and secondary effects: Showdown `data/moves.ts` + `gen9rr/moves.ts`; Hardcore move bans: Hardcore Main tab |
| Abilities | `data.js` abilities (in-game text); exact effects of changed / new ones: Showdown `gen9rr/abilities.ts`; Hardcore replacements: Hardcore Main tab |
| Items | `data.js` items (bag text); vanilla text: `pokefirered/items.json`; new / changed effects: Showdown `gen9rr/items.ts`, changelogs |
| Item locations | `data.js` areas (standard / hidden / shop / cheat, by cap step); item sheet (TMs, overworld, Mega Stones, Z-Crystals, shops with prices, care packages); Hardcore swaps / removals: Hardcore Main tab |
| Encounters | `data.js` areas (grass day / night, rods, surf, Rock Smash, raids with drops, statics, gifts, trades, roamer; levels; standard FRLG slot rates); locations sheet (Safari, fossils, egg vendor, Game Corner, mystery gifts); Wonder Egg pools |
| Locations | `data.js` areas (221, game order) |
| Trainers | `data.js` trainers (464, hardcore teams for all of them); bosses: `trainers-hardcore.xlsx`, check: calc `hardcore.js`, hzla `radredhc.js` (ROM); rival teams by starter in both sheets |
| Walkthrough | **No walkthrough doc exists.** Order: Hardcore Trainer Order tab + caps + `data.js` area order and cap steps |
| Mechanics | Hardcore Main tab (permanent AI weather / terrain, Rapid Spin, omniboost, no EVs on bosses but Ghost Marowak), thread features list (no bag vs bosses, Set style, soft caps), changelogs; engine: RR calc `gen789.ts`, Showdown `gen9rr/scripts.ts` / `conditions.ts` |
| Move tutors, useful NPCs | `data.js` tutors per area; item sheet → Move Tutors; thread (IV perfecter Celadon, EV checker and ability swapper Saffron, nature changer in every Pokémon Center, relearner Cerulean, egg tutor Fuchsia) |
| Save import (calc) | ID tables: `data.js` keys are game IDs; hzla `radical_red_*_constants.js`. **No save: needs one from the user** (hzla's test saves are not public) |
| Sprites | `data.js` sprites (1,333 data URLs, the dex's art) for RR's own forms |
| Item icons | none found |
| Credits | thread credits (soupercell, koala4, CFRU / DPE team, sprite artists), official dex (JwowSquared and contributors), RR Showdown / calc devs (Pacmanboss256, Karthik, Budget Cyro, Aegide), hzla, RomHackDex, doc maintainers |

Not fetched: the user's FireRed (1636) ROM (with `rr4_1.ups` it would allow a ROM extract; the official dex and hzla
already come from the ROM), Moveset Database (movesets.radicalred.net), Monotype docs, puzzle videos.

## Re-fetch

Source updates: `watch.json` (`uv run python -I tools/check_updates.py radical-red`).

```bash
D=hacks/radical-red/.src
python -I tools/mirror.py https://romhackdex.net/radical-red/ $D/romhackdex 4000 team-builder compare /moves/ /abilities/
for p in moves abilities; do mkdir -p $D/romhackdex/$p; curl -sL --compressed -A 'Mozilla/5.0' https://romhackdex.net/radical-red/$p/ -o $D/romhackdex/$p/index.html; done
python -I tools/rhd_moves.py $D/romhackdex/moves/index.html radical-red $D/romhackdex/moves.json
curl -sL "https://docs.google.com/spreadsheets/d/1ES8L4OzeJ8rCuMWFNvrDaZKArqR7Vys2ytFxjx2pbwE/export?format=xlsx" -o $D/trainers-normal.xlsx
curl -sL "https://docs.google.com/spreadsheets/d/1jDbKFA30xo8csPHZNLtsmqs781bW_Xb9mKoPYyE6KK8/export?format=xlsx" -o $D/trainers-hardcore.xlsx
python -I tools/drive_ls.py 1YaYM-8dzRlBRuJm1bmYrjJC6HGwTwl-x $D/drive   # then delete the two boss sheets and rr4_0.ups (duplicates / old)
get(){ repo=$1; sha=$2; shift 2; for p in "$@"; do mkdir -p "$D/repos/$(basename $repo)/$(dirname "$p")"; curl -sfL "https://raw.githubusercontent.com/$repo/$sha/$p" -o "$D/repos/$(basename $repo)/$p"; done; }
get JwowSquared/Radical-Red-Pokedex 488a0918194d567b5f7b02c396118d51fb9c81ce data.js index.html src/abilityRandomizer.js src/displayMethods.js src/filterMethods.js src/globals.js src/onStartUp.js src/tableMethods.js src/utility.js
get RadicalRedShowdown/pokemon-showdown 54955790eb71a0fb0a881850f1e8afed3bfe25bd LICENSE config/formats.ts data/{moves,abilities,items,conditions,typechart,pokedex}.ts data/mods/gen9rr/{abilities,conditions,formats-data,items,learnsets,moves,pokedex,rulesets,scripts}.ts
get RadicalRedShowdown/damage-calc 7f3540035176b3db4386871956eec1c309aea26e LICENSE calc/LICENSE calc/src/data/{abilities,index,interface,items,moves,natures,species,types}.ts calc/src/mechanics/{gen789,util}.ts src/js/data/sets/{hardcore,normal}.js src/hardcore.template.html
get hzla/Dynamic-Calc-Decomps 2a54a6d9ce708a7870c16bcb5cf751c263e477a2 calc/LICENSE backups/{radredhc,radrednm,radrednmnew,title_to_backup_mappings}.js backups/trainer_orders/radrednmnew.js js/savereaders/savereader_radicalred.js js/savereaders/save_constants/radical_red_{constants,dex_ability_constants,item_constants,randomizer_constants}.js calc/test/radicalred-savereader.test.js
get pret/pokefirered ce6406d8c2eaf46d543c8a2606de0c3cb1951982 src/data/items.json src/move_descriptions.c src/data/text/abilities.h
```

About 215 MB (RomHackDex 180, the patch 18). `data.js` is a JS object literal (single quotes, number keys): parse it
as data, never `eval` it. Live site: `https://dex.radicalred.net/data.js`, identical to the pin on 2026-11-01.

| File | SHA-256 |
| --- | --- |
| `repos/Radical-Red-Pokedex/data.js` | `04c9dc94b6a7e3d33f5dcb5e804487466e7a249f4d340cf19853d70f37596df9` |
| `drive/rr4_1.ups` | `cc9279e126540f8f43088d4678bf72479da44e9e8c8c466372d5a1a0e0a5a223` |
| `drive/Item, TM, and Move Tutor Locations v4.1 - Radical Red.xlsx` | `23715528a053a769d3b5319714726dbb98efe8e3689375ac84f672305401fcb0` |
| `drive/Pokémon Locations & Raid Dens v4.1 - Radical Red.xlsx` | `edba4d58237b7cc64fa2b0beda8b4ed700f0f2a5e52345b52f5b5180d76437ef` |
| `drive/Wonder Egg Pokémon Pools v4.1 - Radical Red.xlsx` | `2bbc13064aa54566025692c238f649792f17a8597d2100ac05bc11f042d3e7a9` |
| `drive/4.1 Changelog - Radical Red.txt` | `f3e1eaeb7e149802d581b8804e7c12aeeea252934df022e95c7978948a16f7fe` |

Google regenerates xlsx containers: compare cells, not bytes. Wayback blocks scripted fetches now; PokeCommunity
answered a plain curl with a browser User-Agent (2026-11-01).


## Files

TODO: document files.


## Game files

TODO: document game files.


## Source checks

TODO: document source checks.

## Save format references (unit 7, 2026-11-02; read online, not fetched into `.src/`)

- RR growth rates: `Base_Stats.c` from ydarissep/Radical-Red-Pokedex `65712ed` (2023-08-04), sha256 starting `2cd667a4`;
  derived into `extract/growth.json`.
- RR save format: RadicalHex (jajaa17/RadicalHex `3697412`, GPLv3, `src/core.js`) and PKForge
  (sofianeelhor/PKForge `2df0443`, GPLv3, `RadicalRedFormat.cs`). Reference only; no code copied.
