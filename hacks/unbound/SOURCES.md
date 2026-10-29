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
The three Unbound tests are synthetic JS fixtures; no `.sav` / `.srm` Unbound fixture exists here.

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

## Files

TODO: document files.


## Game files

TODO: document game files.


## Source checks

TODO: document source checks.
