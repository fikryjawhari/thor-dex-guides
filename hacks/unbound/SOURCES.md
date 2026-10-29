# Unbound docs

Fetched 2026-10-18. Dex, locations and items from RomHackDex; boss teams from three community sheets the user supplied;
missions, walkthrough and extras from [unboundwiki.com](https://unboundwiki.com/).

| Path | Contents |
| --- | --- |
| `romhackdex/pokedex/` | 1,269 Pokémon pages: stats, abilities, evolutions, level-up and TM moves, wild locations |
| `romhackdex/locations/`, `romhackdex/items/` | 94 locations, 352 items |
| `romhackdex/moves/index.html`, `abilities/index.html` | Move and ability (with descriptions) tables |
| `romhackdex/moves.json` | **Use this for moves**: all 993 with type, category, power, accuracy, PP, priority and description (`tools/rhd_moves.py`) |
| `trainers-difficult.xlsx`, `trainers-expert.xlsx`, `trainers-insane.xlsx` | Gym leaders, league, rival, Shadow and Light of Ruin bosses, boss wild battles, mega trainers, Title Defense, Battleground, with EV spreads |
| `unboundwiki/unboundwiki.json` | 1,545 wiki entries (title, link, category, HTML): 967 Pokédex, 84 missions, 40-part walkthrough, 104 locations, 129 TMs and HMs, 90 items, 49 Mega Stones, plus pages for raid dens, tutors, Z-crystals, mechanics |

## Re-fetch

Source updates: `watch.json` (`uv run python -I tools/check_updates.py unbound`).

```bash
D=hacks/unbound/.src
python -I tools/mirror.py https://romhackdex.net/unbound/ $D/romhackdex 4000 team-builder compare /moves/ /abilities/
for p in moves abilities; do mkdir -p $D/romhackdex/$p; curl -sL --compressed -A 'Mozilla/5.0' https://romhackdex.net/unbound/$p/ -o $D/romhackdex/$p/index.html; done
python -I tools/rhd_moves.py $D/romhackdex/moves/index.html unbound $D/romhackdex/moves.json
curl -sL "https://docs.google.com/spreadsheets/d/1_HF-bxEfamTW8S3q7tLjHWWPjo9E1QLS5dtMIhJHoeY/export?format=xlsx" -o $D/trainers-difficult.xlsx
curl -sL "https://docs.google.com/spreadsheets/d/1yl1AXKfarFb8_8-iF8We9zmLB135kxJ82yOGQDoMHOs/export?format=xlsx" -o $D/trainers-expert.xlsx
curl -sL "https://docs.google.com/spreadsheets/d/1pLTQKQkWTnSkev4_kcjHbY0AkBujbTUDybxXFNZ_aVY/export?format=xlsx" -o $D/trainers-insane.xlsx
mkdir -p $D/unboundwiki
python -I tools/wp_dump.py https://unboundwiki.com $D/unboundwiki/unboundwiki.json pages wiki
```

About 200 MB. The wiki's Pokédex overlaps RomHackDex; use whichever reads cleaner at build time. Unbound is the only
backlog hack with a quest system (the wiki's Missions category). Two RomHackDex pages 404 on the site itself
(Minior Red Meteor, Pumpkaboo Average).


## Pinned hzla reference (2026-10-29)

Repository: https://github.com/hzla/Dynamic-Calc-Decomps
Coherent snapshot: `ff6c3e339e276e6b4e8e44db58750b6534bc26aa`.
Local root: `.src/repos/hzla/`; paths below are relative to that root.
**Reference only: not copied into the guide.** The repository has no top-level licence;
`calc/LICENSE` is the MIT licence of the upstream Smogon calc, not a blanket grant for hzla's
additions, trainer data or save reader. Independently implement the CFRU reader/profile.

| Path | Git blob SHA | Last-touch commit |
| --- | --- | --- |
| `backups/unbound.js` | `132f40351fc72af8278d998c068f6bb0c5a511ef` | `062236b3b8f70e849990c0f5c01ee7d34073bbaa` |
| `calc/mechanics/romhacks/profiles/unbound.js` | `42eb9896924205f8042d57030c863bd26515abb0` | `e82c19d71de0558f8f2a4e8ad148bdf1ab5788fd` |
| `calc/mechanics/romhacks/helpers.js` | `ecba37a1613708f3e83f01a8410e06adcf1c0641` | `c04d0219aa627ab8c020f2b53c9ec4aebebcfece` |
| `calc/mechanics/romhacks/index.js` | `0ca24f44237a3db9f8f7b750d74942f73cb9cd5a` | `78ad44e4beec6a01ab3ea0d44bcd485eabaa50c8` |
| `calc/mechanics/gen789.js` | `034de2610d94bb603fcfea9224f7d36da6901776` | `43500b62c2b7a8417b9d158eccba36b1e95317c2` |
| `calc/mechanics/vanilla/gen789.js` | `272a8d1bd09bbe5df894b941de76bb272cabd5af` | `f6b95446689756d6e85e519185294133606bfac0` |
| `calc/mechanics/util.js` | `56e93fa360a5bb2541d8cc09b9c6acbbf713e9f8` | `7e57aec6c3ac54abab297b340c2cc893f387d622` |
| `js/savereaders/savereader_unbound.js` | `431dd1ee2e16855989ddf7709df66f4bf7d9566d` | `062236b3b8f70e849990c0f5c01ee7d34073bbaa` |
| `js/savereaders/save_constants/unbound_2_1_constants.js` | `0d824ad437b4f0b2b7a768cd6b20f58bdf4520a1` | `062236b3b8f70e849990c0f5c01ee7d34073bbaa` |
| `scripts/generate_unbound_2_1_save_constants.py` | `1a878327524537378ddc9265391d027a20b71815` | `062236b3b8f70e849990c0f5c01ee7d34073bbaa` |
| `js/unbound_adapter.js` | `e677a7334114396d2da53ea830cca043a8265678` | `062236b3b8f70e849990c0f5c01ee7d34073bbaa` |
| `calc/test/unbound-adapter.test.js` | `dfbfac5371b01177feb31ad1b2ad70fbbba5f4e0` | `062236b3b8f70e849990c0f5c01ee7d34073bbaa` |
| `calc/test/unbound-gen8.test.js` | `9206e204220d4df23246b0df0108d474030c0240` | `062236b3b8f70e849990c0f5c01ee7d34073bbaa` |
| `calc/test/unbound-savereader.test.js` | `700180e2a04727c087fbe6ab697194d8f6c6af16` | `062236b3b8f70e849990c0f5c01ee7d34073bbaa` |
| `calc/LICENSE` | `ca0abe742222fd1c2ee0a97176af1f90d76dd6e5` | `f9939bc393412cacbaf5150a2760fc13467d8ae8` |

The base routing is `calc/mechanics/gen789.js` (gen 7/8/9), with the vanilla fallback in
`calc/mechanics/vanilla/gen789.js`, shared mechanics in `calc/mechanics/util.js`, and
the Unbound profile registered by `calc/mechanics/romhacks/index.js` / `helpers.js`.
There is no separate `cfru.js` profile in this snapshot. This is a reference subset, not a runnable calc clone.
The Unbound tests include synthetic fixtures and references to external Unbound-Cloud saves;
no binary `.sav` / `.srm` Unbound fixture is stored in the hzla tree.

Re-fetch into a NEW staging directory; never overwrite the shared source inputs:

```powershell
git clone --filter=blob:none https://github.com/hzla/Dynamic-Calc-Decomps.git <staging>
git -C <staging> checkout --detach ff6c3e339e276e6b4e8e44db58750b6534bc26aa
git -C <staging> rev-parse HEAD:<path-from-table>
```

Copy each table path preserving directories to `.src/repos/hzla/`; verify `git hash-object <file>`
against its blob SHA above. The constants' actual path includes `js/savereaders/save_constants/`,
not a root-level `save_constants/`. `backups/unbound.js` requires the globals from
`js/unbound_adapter.js` plus `pokedex`; `tools/calcbackup.js` alone fails. For teams-only research,
load the adapter and evaluate the backup in an isolated VM with `pokedex: {}`; this deliberately
does NOT produce a complete dex. Use `unboundModes.expert`, not the default Insane `formatted_sets`.

## Pinned Unbound-Cloud reference (2026-10-29)

Repository: https://github.com/Skeli789/Unbound-Cloud
Snapshot: `3d20f323b3f4690504f638fc8a6d491067f69194` (shallow clone of `main`). Local: `.src/repos/Unbound-Cloud/`.
Both package manifests explicitly say **UNLICENSED**; no repository LICENSE was found.
Read as format/data reference only; do not copy implementation into the guide. Public availability is not a licence.

| Path | Git blob SHA |
| --- | --- |
| `server/src/data/unbound_2_1/Species.json` | `a7daa09f6a7e4a074280473496a31be8ed5e8289` |
| `server/src/data/unbound_2_1/BaseStats.json` | `7517e816b0ff292d2ec7275f9509b6a3fa3d6c97` |
| `server/src/data/unbound_2_1/Moves.json` | `35ab2b2da384c81f7f91525215525b4d242869a5` |
| `server/src/data/unbound_2_1/Items.json` | `850f2731a07fa9c99116f719ecfd4ad5cd39ad5f` |
| `server/src/data/unbound_2_1/BallTypes.json` | `49110c2cab584665a777ea445acc52e9aeaee216` |
| `src/data/AbilityNames.json` | `ceae4d0f9f101c34b4651cb5c5853bb688981b07` |
| `src/data/SpeciesNames.json` | `ce75f7ea66ad7c0947ca05adeb364c95bd402b38` |
| `src/data/SpeciesNamesAlts.json` | `b936002b22abbca61fd15acf82245a26e4ed613c` |
| `src/data/MoveNames.json` | `c3edeef85e6969695fb91688c9ddf90285d9af23` |
| `src/data/ItemNames.json` | `aa0f3d5739165565b9d6186edd6239543a553483` |
| `src/data/ExperienceCurves.json` | `b0da680a6957e82657e9eb640bfe4feb29d6122e` |
| `server/src/Defines.py` | `9c6c74e83141d5f50f94ad7cde0ba84542b8ae71` |
| `server/src/SaveBlocks.py` | `0e14d6d5e70cde9fe9881080c09deeaf606d6601` |
| `server/src/SaveBlockProcessing.py` | `57cb975fed387a93afc5da9d176801f7827dbbcb` |
| `server/src/PokemonProcessing.py` | `46971e69111438f7223fda6a366cf5b8ac37ea58` |
| `server/src/PokemonUtil.py` | `6620f9699fb40088f056602225143f8ce57ecfb9` |
| `server/src/Util.py` | `dfe430c992d732629784a30f945d9bf40835ad2f` |
| `server/src/data/Natures.json` | `ee86ea098c74a58c9a0381adca2f9d89b4bbf500` |
| `server/src/data/Languages.json` | `55aafb8652ed26e1373ab0759ad9209c80c7878a` |
| `server/src/data/charmap.tbl` | `68092f108589c4215b07493b2f44bd7b2d9efb9d` |
| `package.json` | `5d5c043237add0bb2921ba4d873e91948ba0048e` |
| `server/pytests/test_Integrated.py` | `e5a1ced0f33c89986ca775dfc1ac59ba8ca34f77` |
| `server/pytests/test_SaveBlockProcessing.py` | `351bb475082f63a5a13b7ac619a44768dc8c3d1b` |
| `server/pytests/test_Saveblocks.py` | `0becdd0128a0962517628954761d236be1e160ea` |

`unbound_2_1/` is mandatory: `unbound/` is a newer profile, NOT interchangeable.
`Species.json`: 1,181 ID entries including sentinel/form IDs; `Moves.json`: 767; `Items.json`: 523.
All three mappings and the 1,264 `BaseStats.json` records match hzla exactly (zero differing entries).
`AbilityNames.json` maps **symbolic defines to display strings, not integer IDs**: 343 entries vs hzla's 336,
seven additional names. Numeric save ability interpretation comes from the per-species slot in BaseStats,
not dictionary insertion order. Species/form display names are `SpeciesNames.json` + `SpeciesNamesAlts.json`.

Save oracle: 53 binary `.sav` fixtures in `server/pytests/data/saves/`; 37 contain the Unbound 2.1 signature
`0x01121999` in at least one slot. Those 37 were copied preserving subpaths into `.src/saves/Unbound-Cloud/`.
They include intentional corrupt/randomised controls; signature presence alone does not establish validity.
File URLs, hashes and reader results are in `plans/unbound-sources.md`. No licence is granted for these fixtures;
keep local only. The 2.1 signature identifies 2.1.0 through 2.1.1.1, not an exact point release.
Current Cloud `Defines.py` calls 2.1 an old version: don't use its current upload rejection as a format failure.
hzla's Unbound test file already references these Cloud fixtures as well as synthetic fixtures.

```powershell
git clone --depth 1 https://github.com/Skeli789/Unbound-Cloud.git <new-staging>
git -C <new-staging> fetch --depth 1 origin 3d20f323b3f4690504f638fc8a6d491067f69194
git -C <new-staging> checkout --detach FETCH_HEAD
git -C <new-staging> rev-parse HEAD
```

Inspect `server/pytests/data/saves/` and copy candidates into a NEW oracle folder; never overwrite existing inputs.
The older snapshot can be recovered with the recorded commit even after `main` advances.

## Files

TODO: document files.


## Game files

TODO: document game files.


## Source checks

TODO: document source checks.
