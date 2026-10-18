# Hack docs tools

Each hack's downloaded docs go in `hacks/<hack>/.src/` (git-ignored: raw docs from hack authors are never committed to
this public repo), and its `SOURCES.md` says exactly how to fetch them again. Run its commands from the repo root in Git Bash. Python 3 and curl are all you need.

| Script | What it does |
| --- | --- |
| `drive_ls.py <folder-id> [out-dir]` | Lists a public Google Drive folder; with `out-dir`, downloads every file in it (Sheets as .xlsx, Docs as .txt, other files as-is). Skips subfolders and archives (.zip etc.). |
| `mirror.py <start-url> <out-dir> [max-pages] [skip ...]` | Mirrors a static site's pages under the start URL's folder. URLs containing any `skip` substring are not followed. |
| `wp_dump.py <site> <out.json> [types ...]` | Dumps a WordPress site (pages and custom post types) through its REST API into one JSON file. |
| `wiki_dump.py <api.php> <out-dir>` | Dumps every page of a MediaWiki as wikitext. Not used by any hack right now. |
| `rp_item_locations.py` | Builds Renegade Platinum's `item-locations.csv` from its docs plus vanilla Platinum (pret decomp). |
| `hge_species.py` | Extracts per-species dex data from hg-engine data files, and diffs two extracts (HeartGold Retiled). |
| `sprites_pee.py <expansion dir> [out-dir]` | Builds the shared sprite set (`sprites/png/`, `sprites/index.json`) from a pokeemerald-expansion checkout (`sprites/SOURCES.md`). |
| `garc.py` | Reads 3DS GARC archives, LZ11 entries, mini packs and Gen 6/7 game text. Used by the scripts below. |
| `xy_trainers.py <romfs> <out.json> [vanilla-romfs]` | Dumps every trainer from an XY-engine romfs (Eternal X), names from its own text. |
| `ex_rivals.py <trainers.json> <out.md>` | Eternal X's rival fights by battle and starter, from `xy_trainers.py` output. |
| `usum_trainers.py <romfs> <out.json> [fallback-romfs ...]` | Dumps every trainer from a USUM-engine romfs (Photonic Sun), with natures and EVs. |
| `serebii_usum_items.py <items.shtml> <tm.shtml> <out.csv>` | Vanilla Ultra Sun item locations from Serebii's pages. |

## Source log

When each hack's sources were compiled, and the version they cover. **Whenever a hack's sources are fetched again,
update its row here and the "Fetched <date> (<version>)" line at the top of its `SOURCES.md`.** To spot an update,
compare the hack's current version (its thread, Drive file names or changelog) with this table; for repos, compare
`curl -s "https://api.github.com/repos/<repo>/commits?per_page=1"` with the commit pinned in `SOURCES.md`.

| Hack | Version | Sources compiled | Guide built | Where to look for updates |
| --- | --- | --- | --- | --- |
| Blaze Black 2 Redux | v1.4.1 | 2026-10-18 | – | Drayano's Drive (Documentation folder) |
| Emerald Imperium | v1.3 / 1.3.1 | 2026-10-18 (guide built from the same sources) | 2026-10-02 | emeraldimperium.info Drive folder; eidex and Dynamic-Calc-Decomps repos |
| Eternal X | v2.67 | 2026-10-18 (docs + romfs) | – | Buffel Saft's Drive, PokeCommunity thread |
| Hardlove Gold | 0.8.3 (source `kumakuma1/hardlove` `f1b2363001`, trainer sets patched onto the 0.8.2 build; docs site `bb5862f` is older) | 2026-10-18 | 2026-10-19 | `kumakuma1/hardlove` branch `beta_hardlove` commits, the changelog, Drive sheets |
| HeartGold Retiled | v6.12.1 | 2026-10-18 | – | GitHub repo releases |
| Meissa Moon | v2.2.2 | 2026-10-18 | – | Author's Drive, PokeCommunity thread |
| Navy Sapphire | v2.1.5 | 2026-10-18 | – | Hack's Drive, PokeCommunity thread |
| Photonic Sun | v2.38 | 2026-10-18 (docs + romfs) | – | Buffel Saft's Drive, PokeCommunity thread |
| Radical Red | v4.1 | 2026-10-18 | – | RomHackDex; the two trainer sheets |
| Renegade Platinum | v1.3.0 | 2026-10-18 | – | Drayano's Drive (Documentation folder) |
| SoulGold | no version number | 2026-10-18 | – | eemeliri.github.io/soulgold data files |
| Unbound | – | 2026-10-18 | – | RomHackDex, unboundwiki.com; the three trainer sheets |

Plans for work not yet done live in `plans/`.

3DS hacks (LayeredFS) ship only the archives they change, so diff against vanilla dumps of the base game. The user's
Azahar dumps are in `%APPDATA%/Azahar/dump/romfs/<title id>/`; a title update dumps as `0004000E…` and holds only the
files it replaces. Archive numbers: pk3DS `GARCReference.cs`, summarised in `plans/romfs-extraction.md`.

A single Google Sheet: `curl -sL "https://docs.google.com/spreadsheets/d/<id>/export?format=xlsx" -o <file>.xlsx`.
A single Drive file: `curl -sL "https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t" -o <file>`.

## Gotchas found on 2026-10-18

- **PokeCommunity returns 403** to scripts and to Claude's fetcher. Read its threads through the Wayback Machine
  instead: `https://web.archive.org/web/2026id_/<thread url>` (the `id_` gives the raw page). The
  `archive.org/wayback/available` API rate-limits quickly; the direct URL did not.
- **Drive folder pages only render about 10 entries.** `drive_ls.py` uses `embeddedfolderview`, which lists all.
- **Reddit, the Radical Red site (radicalred.net no longer resolves) and Fandom pages block or fail.** The Fandom
  `api.php` still answers.
- **RomHackDex per-move and per-ability pages** are huge and repeat what the Pokémon pages say; skip them.
