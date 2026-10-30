# Unbound docs

Fetched 2026-10-18/19 (original mirrors and boss sheets); references, cap/regular-trainer/location workbooks
and save fixtures added 2026-10-29. Target: **Unbound 2.1.1.1, Expert**. Original shared inputs were not modified.
The 2026-10-29 source audit (inventory, sheet-vs-hzla join, wiki-vs-RomHackDex forms, gap searches) was built into
the extract and notes.md; the full report is in git history (`plans/unbound-sources.md`, deleted 2026-10-30).

| Path | Contents |
| --- | --- |
| `romhackdex/pokedex/` | 1,268 actual Pokémon/form HTML files: stats, abilities, evolutions, learnsets, wild locations; h1 names are not unique form keys |
| `romhackdex/locations/`, `romhackdex/items/` | 94 locations, 352 items |
| `romhackdex/moves/index.html`, `abilities/index.html` | Move table and 258 named abilities with descriptions |
| `romhackdex/moves.json` | **Use this for moves**: all 993 with type, category, power, accuracy, PP, priority and description (`tools/rhd_moves.py`) |
| `trainers-difficult.xlsx`, `trainers-expert.xlsx`, `trainers-insane.xlsx` | Gym leaders, league, rival, Shadow and Light of Ruin bosses, boss wild battles, mega trainers, Title Defense, Battleground, with EV spreads |
| `unboundwiki/unboundwiki.json` | 1,545 records; 968 individual Pokémon pages (967 categorised + Snorunt), 84 mission-category pages, walkthrough parent + 40 parts, 104 Locations-category pages versus 67 individual location URLs, 129 TMs/HMs, 90 Items-category memberships, 49 Mega Stones-category memberships; category counts are not disjoint |
| `research-2026-10-29/trainer-index.xlsx` | Public 2.1.1.1 document hub; LEVEL CAPS!D2:D11 gives Expert caps 20/26/32/36/40/45/52/57/61/75 (includes non-badge Maxima) |
| `research-2026-10-29/ordinary-trainers.xlsx` | 49 location sheets; 418 trainer blocks, 1,003 evolution-name cells, 73 nonempty held-item cells; no moves/abilities |
| `research-2026-10-29/location-guide.xlsx` | Public 2.1.1.1 location guide: encounter methods, gifts/statics, legends, trades, swarms, wild held items, TMs, Mega Stones, Z-crystals; no wild-level field |
| `research-2026-10-29/dpe/`, `cfru/` | Supplemental author source files; immutable commit URLs and per-file SHA-256 in the audit; not verified release-matched |
| `repos/hzla/`, `repos/Unbound-Cloud/`, `saves/Unbound-Cloud/` | Pinned reference files / full shallow Cloud clone / 37 copied 2.1-signature save candidates; manifests and licence limits below |

## Re-fetch

Source updates: `watch.json` (`uv run python -I tools/check_updates.py unbound`).

2026-10-29 audit run: exit **1** (changes detected, no errors), 4 GitHub API requests.
All seven pre-existing sources and Unbound-Cloud were unchanged. hzla's live `decomp` branch
differs from the pinned snapshot in `calc/mechanics/gen789.js` and `calc/mechanics/vanilla/gen789.js`.
The pinned input is deliberately retained; no `--accept` was run. Full log:
`.tmp/unbound-sources/check-updates.log`. The two repository watches compare live branches
against the file-blob baselines, not a fixed ref against itself.

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

Authority (settled at the decision round, notes.md → Sources and rules): RomHackDex for dex data; the Expert workbook for boss teams,
hzla for IVs and discrepancies; wiki for locations/items/walkthrough/missions/catalogue trainers. Do not silently
replace these with a newly discovered source. The two missing RHD form pages have Cloud/DPE alternatives:
Minior meteor `SPECIES_MINIOR_SHIELD` / ID 991; Pumpkaboo average `SPECIES_PUMPKABOO_M` / ID 855.
The bare Pumpkaboo entry is small, not average (`SPECIES_PUMPKABOO` / 818: 44/66/70/44/55/56). Learnsets: DPE
`Learnsets.c:21780` (Pumpkaboo_M shares the sizes' list), `Egg_Moves.c:3998`; `Learnsets.c:21916` (Minior shield).

New workbook re-fetch (always into a new folder, never over existing shared inputs):

```powershell
curl.exe -fL 'https://docs.google.com/spreadsheets/d/1Ha06sD9mKw5yXXT2icVZjVQapcArU5C5gLEvA-hkq9o/export?format=xlsx' -o <new-folder>/trainer-index.xlsx
curl.exe -fL 'https://docs.google.com/spreadsheets/d/1s7f-S_d9WNK6vUKUJcTr7xX_dsbJ8eSebvYFSNPo9FU/export?format=xlsx' -o <new-folder>/ordinary-trainers.xlsx
curl.exe -fL 'https://docs.google.com/spreadsheets/d/1PyGm-yrit5Ow6cns2tBA9VEMwLVMzn3YhDRipABjLUM/export?format=xlsx' -o <new-folder>/location-guide.xlsx
```

SHA-256: trainer-index `413e522356a78cc27131e98ac92ab5802132173c5f41c724d0bad2069ac60dca`;
ordinary-trainers `21b1d4858b6ba261d523dfbf846e9322baf9edf373d68b6b7ba6f9f8ddd74fca`;
location-guide `cc268f58ac91288a6841d4e9897177aadc04d723ca0f976f00b464f4fbb8c218`.
Google can regenerate workbook containers: compare cells too, not only byte hashes. The linked General Guide
returned HTTP 401 and was not fetched. Public author source commits: DPE Unbound
`fe058e0e3ac23cf968cf950de43332135bc1549d`; generic CFRU master
`b637a27898b14e25dd24d0f69a3e302f0069deb8` (the CFRU Unbound branch does not exist: API 422). Not release-matched.
General Guide ID `1LFSBZuPDtJrwAz7t6ZkJ-il4j8M3qCdaKLNe6EZdPmQ`.

| File under `.src/research-2026-10-29/` | SHA-256 |
| --- | --- |
| `cfru/src/exp.c` | `aa1d1b96aa0e3f4677b60244cf23bacc22958891fa21b2f8c0769aac4f16c6e2` |
| `cfru/src/wild_encounter.c` | `2435592ce801088d51d78db45b3f36adb0097a5ec9ed89c3279511334fbf3651` |
| `dpe/include/abilities.h` | `6277f77cd8a637708bad50ce3508dd01990ecaf092cfc4649b7b42d4e34bdef8` |
| `dpe/include/base_stats.h` | `579e15678703bf7ccabf9ed4a1884d3dfe76adfc0db0d77eaa0a296b3c4cde1a` |
| `dpe/include/species.h` | `46a140dd639a0ff93396c0767abbcba9db4b2c76e5e69f829bd580889584376b` |
| `dpe/src/Base_Stats.c` | `b1f9811e59fb26f876c8ddc222b3f52c83d48e3625d76037d3ed61107ac456cd` |
| `dpe/src/Egg_Moves.c` | `63b69cfbae89cd9d4f61e797bc59d7e61a2b4f6866bf93c2b16d0a5e97d7c3fe` |
| `dpe/src/Learnsets.c` | `674e86a4b5e1ac8c22beb04ff0982c080c0f3cd564fb9034f83f83f7804870b2` |

Wild levels: no source has them (RomHackDex says so; wiki and location guide have no level column; generic CFRU
`wild_encounter.c` 96-106 has an optional scaling flag, not proof Unbound enables it).


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

Windows scratch files have CRLF checkout endings. The table pins canonical Git blobs (LF); this repo's
`git hash-object <file>` applies its text normalisation. A raw byte-SHA1 is not the same check.
Local byte SHA-256 values are retained in `.tmp/unbound-sources/hzla-manifest.json`; validation checked
both the unchanged copied bytes and all 15 canonical blob IDs without rewriting shared inputs.

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
Paths, hashes and hzla reader results: Files below. No licence is granted for these fixtures;
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

The inventory table above covers input groups. The 37 save candidates under `.src/saves/Unbound-Cloud/` (paths
relative to the pinned Cloud `server/pytests/data/saves/`; expected box data in `server/pytests/data/flex.json`,
`flex_titles.json`, `test_hoopa_shaymin_preset_box.json`). `_new` files are upstream test-write outputs; corrupt /
randomiser names are controls. Expert fixture: `var_test/expert_difficulty.sav` (the upstream test asserts difficulty
var 2).

| Save | Bytes | hzla reader | SHA-256 |
| --- | --- | --- | --- |
| `corrupt_blocks_30_31.sav` | 131072 | 1 party, 576 boxed | `466a0d60099b1533051d5dd310e06b218803690b3b40f4742c8679a8eb21a4a7` |
| `corrupt_blocks_30_31_new.sav` | 131072 | 1 party, 576 boxed | `0617432c073e6fd6e696621627c736da44e7de2a2bc4fe67f3b74176f0b100f9` |
| `duplicate_block_id.sav` | 131072 | 1 party, 597 boxed | `605909330a0d88e40f8d987d402399b6a1765af7cff826fa88af122c28e72ed2` |
| `flag_test/unbound_easy_puzzles.sav` | 131072 | 0 party, 0 boxed | `fbdcc1b1b01d71ab82ab6c16fb29c15f1f35a0d5a0b95ded6276c874809ab17a` |
| `flag_test/unbound_hard_puzzles.sav` | 131072 | 0 party, 0 boxed | `70b6ebaf73577b58ff7ef82542d2f4aa561ab75209e667694b1454a4ce7edd08` |
| `flag_test/unbound_randomizers.sav` | 131072 | rejected (randomised) | `4592765aa85f35879bd48a7cfdf58f3bc58103148765b819a21976ef792f42ea` |
| `flashcart.sav` | 131088 | 6 party, 45 boxed | `dafeb9afbf9717e9eed755aa6eaf8a978b5477098533b7479ab9ab187d767eb2` |
| `flashcart_new.sav` | 131088 | 6 party, 45 boxed | `727b2cdf7f3a88ff9702101f70d5eb7018c14946960d1018d9531b0d874768a0` |
| `flex.sav` | 131072 | 3 party, 598 boxed | `0528f870c0a282cd8ec9e933fa24e96643b91aaa3d756f041d60136bfbcc5c57` |
| `flex_new.sav` | 131072 | 3 party, 598 boxed | `f8f9c2a67e5bf8e775ea6a72a3a57e99a26d951c5ab9d3328415d8c40a63e54b` |
| `invalid_block_id.sav` | 131072 | 1 party, 597 boxed | `32b2f34d0b7d06338465067a690f3ca8b29d7bc147652cf0538c8eb627a2e359` |
| `invalid_checksum.sav` | 131072 | 1 party, 597 boxed | `9f19dfcf6b5157f0469ebd813ce3aae5cbc4284df62197b1e46d1f9a5ba1a081` |
| `invalid_file_signature.sav` | 131072 | 1 party, 597 boxed | `4a472dd4979ee89bbbc067ca493d6a4fe6ffc5e0d738d1a496f1071e56ae9a55` |
| `mismatched_file_signature.sav` | 131072 | 1 party, 597 boxed | `02949350870c58089afdbd528280d8ba5d02df5003985f04c8e3ad195ee139a0` |
| `mismatched_file_signature_new.sav` | 131072 | 1 party, 597 boxed | `99f264575844d353b8cca24681fe5d60d1dd70025e576728118c115be429b8bb` |
| `mismatched_save_index.sav` | 131072 | 1 party, 597 boxed | `56d79d5743da505e7cec78615de70605c145e820e071541c787836385f3eefcc` |
| `missingno.sav` | 131072 | 5 party, 586 boxed | `c35a1b87b876e9fa42f007dd1a5e6ccc023a7d1581cda99e4b655a7c80bda437` |
| `missingno_new.sav` | 131072 | 5 party, 586 boxed | `6f3a19d1c9a8046a67a19ebdac1fe49151e015fe38fcbb74da780840382e7f9e` |
| `ng+.sav` | 131072 | 6 party, 24 boxed | `55a724ff827ebc73ee5c10edec9f254e7e80256740a88bc8cb2381b669460707` |
| `ng+_new.sav` | 131072 | 6 party, 80 boxed | `9f46b296352c0431d7c79e9539ee813d8cae04ad11604458ec804947c827da8a` |
| `single_save.sav` | 131072 | 0 party, 0 boxed | `d83e23ede3a6e47a27c175ec8e89ebf8186e24cfeaa4f22fe810b2beb2d185bc` |
| `single_save_2.sav` | 131072 | 0 party, 0 boxed | `8c04d8bb9c975a40d7c587f4e93c8efbe726ad075480461be9d16b6a23752f81` |
| `single_save_corrupt_save_1.sav` | 131072 | rejected (not 2.1.x) | `61fba1f9ff3ceb2ec930d18bea92f38ffe0ee5709f3aa6b6a5f314e2ee9a9bac` |
| `single_save_corrupt_save_2.sav` | 131072 | rejected (not 2.1.x) | `86d19b52be46bb4c65105862bd98d8cc11fd13cebdd8640ab49dc0a601ad2d9a` |
| `single_save_new.sav` | 131072 | 3 party, 598 boxed | `4c97b9b7104e2f5fc3cfa1e284a360a949bf3869d5c84853fae28c4321fabdaa` |
| `single_save_randomizer.sav` | 131072 | rejected (randomised) | `c6d1b16926ac5933c6a7ae5a1b4a0459e63d8508715b557a5cd27947e9cda4f5` |
| `single_save_randomizer_new.sav` | 131072 | rejected (randomised) | `0460fd42fc9bfa7c16a66df029b69511db3e8e34faaa9d8b3ebde09de1adfddd` |
| `test_hoopa_shaymin_preset_box.sav` | 131072 | 3 party, 598 boxed | `d688bd0ae3541ac251446570afc9363b7442b4c0957a735b784e6801fa057e84` |
| `test_hoopa_shaymin_preset_box_new.sav` | 131072 | 3 party, 598 boxed | `045cebda7b51a189628ab3ac98213a4dfa72a3f614b598a67580edacab302924` |
| `var_test/difficult_difficulty.sav` | 131072 | 3 party, 598 boxed | `fc314c90b5c42f95411fc2422401b3dd86635d45d56dbb202952d2fdba258e73` |
| `var_test/expert_difficulty.sav` | 131072 | 3 party, 598 boxed | `0528f870c0a282cd8ec9e933fa24e96643b91aaa3d756f041d60136bfbcc5c57` |
| `var_test/expert_sandbox.sav` | 131072 | 6 party, 5 boxed | `d7dcbdfb7599d7da1ad178ccb301e91be2cbbef9e764432cc7f1c8cb38ab572d` |
| `var_test/expert_sandbox_post_game.sav` | 131072 | 6 party, 5 boxed | `cfc1cebe44efbb1690223a3897ef874707f1c5636898bc6e3a539df7ee6e526f` |
| `var_test/insane_difficulty.sav` | 131072 | 3 party, 598 boxed | `1bfb74e2e74e4f8807732a6bb292ea889b5f1101e75e06701be5cb000cc1e8d3` |
| `var_test/insane_main_game.sav` | 131072 | 0 party, 0 boxed | `de49aa7a7392cb9ef0f9e7c3525ba98cd1d4c201708ad9cfad41861d3f1649a0` |
| `var_test/insane_ng+.sav` | 131072 | 0 party, 6 boxed | `23203a0d6432f86eecb4c6c377f397bd83dbf8e52ff8d80f0a2d67c635ec53bf` |
| `var_test/vanilla_difficulty.sav` | 131072 | 3 party, 598 boxed | `d4e522e9ff89b28ccd1e91a2d912d605dd9ae0b1485bc1ebf9223c4788f62120` |


## Game files

No ROM or private game dump fetched. Cloud test saves are local, git-ignored research fixtures; no save licence
was found. 32 of 37 2.1-signature candidates parse in hzla; 5 reject as randomised/invalid. The signature proves
2.1.x compatibility only, not exact 2.1.1.1 provenance. Actual RetroArch .srm import on the Thor remains untested.


## Source checks

2026-10-29: reproduced file/table counts; compared all 439 Expert numeric-level sheet slots against 383 hzla sets
(381 matched slots, 380 distinct sets, 16 differing slots, 58 unmatched sheet slots, 3 malformed hzla species keys).
Compared 968 wiki Pokémon pages by explicit form slugs (0 type disagreements, 41 displayed ability-list differences;
wiki stats absent). All Cloud 2.1 species/move/item/BaseStats entries match hzla; AbilityNames has 7 extra tokens.
Caps and supplemental sources are pinned above. Checks and caveats: the audit in git history. No browser/gate/build checks
are relevant to this research-only unit. No source baseline was accepted and no shared input was overwritten.
