# Update checker (plan, not built)

Goal: one command that tells you, for every hack with a guide or compiled sources, whether its sources changed since
they were fetched, and for most source types shows what changed. It doesn't rebuild guides. It points at what to
re-fetch, and a session then patches or rebuilds the guide from that.

Scoped 2026-10-19 after the Hardlove Gold 0.8.3 update, which was checked by hand this way: find the release commit by
date, list the commits since the pin, filter to the files the guide is built from (only `data/Trainers.c` changed), read
that one diff, then compare the Drive sheet. That took about 30 GitHub API calls and one sheet download.

## Shape

- `tools/check_updates.py`: one shared script, Python stdlib + curl like the other tools. Run with no
  arguments to check every hack, or `check_updates.py <hack>` for one.
- `hacks/<hack>/watch.json`: one per hack, committed next to its `SOURCES.md`. Lists that hack's sources, each with a
  type, its id or URL, and the last state seen (commit sha, modified date, content hash or version string). The pins
  become tracked in git with the sources.
- Output: a report per hack saying what changed and, where possible, the diff. For repos, the diff is limited to the
  files that hack's guide is built from.
- `check_updates.py --accept <hack>` writes the new state into `watch.json` once the guide is updated. Until then each
  run keeps reporting the change.
- The `rom-hack-offline-dex` skill gets one step: when a guide is built, write its `watch.json`.

Each source type is a small checker (a function) in the script. Adding a hack only means writing its `watch.json`.

## Source types

| Type | Used by (now) | Detects a change | Shows what changed |
| --- | --- | --- | --- |
| GitHub repo commits / releases | Hardlove (`beta_hardlove`), HeartGold Retiled, Emerald Imperium (eidex, Dynamic-Calc), SoulGold data files | Yes, per file (commits API with `path=`; the compare API caps at 300 files, so don't rely on it) | Yes, the exact diff of the watched files |
| Google Drive folder | Most hacks: Drayano, Buffel Saft, Meissa Moon, Navy Sapphire, Emerald Imperium, Hardlove sheets | Yes: `embeddedfolderview` (what `drive_ls.py` reads) shows each file's last-modified date; today's files show a time instead | Sheets: yes, cell by cell (see below). PDFs and text files: only that they changed (text files can be diffed after downloading) |
| Single Google Sheet | Radical Red, Unbound trainer sheets | Only by downloading (Hardlove's trainer sheet is ~10 MB) and comparing cells | Yes, cell by cell |
| Version on a web page | PokeCommunity threads (via Wayback `id_`), RomHackDex, Hackdex, as a cross-check for all hacks | Yes, with one search pattern per page | No, only "new version X" |
| Static site / wiki pages | Unbound wiki, RomHackDex, Hardlove docs site | Yes, page hashes or sitemap `lastmod` | Roughly (text diff of the page) |
| 3DS game data (romfs) | Eternal X, Photonic Sun | Through their Drive or thread | No: needs the new patch dumped by hand (`plans/romfs-extraction.md`) |

Everything can be checked for changes. Only version strings on web pages and the 3DS game data can't be diffed.

## Things learned while scoping

- **Sheet exports aren't byte-stable.** Two back-to-back downloads of the same Sheet had different hashes. Compare cell
  values: the builders' `xl.py` loads xlsx into `{(row, col): value}`. Hash or diff that, per tab.
- **The GitHub API limit without a token is 60 requests an hour.** One `commits?path=` call per watched file is fine
  for one hack (Hardlove watches ~23 files) but not for all of them in one run. Either check per hack, or use one
  `commits?since=<pin date>` call and read the changed files of each commit returned (`commits/<sha>`).
- **Repos have no release tags.** Match the release to a commit by time (the changelog or Hackdex date, converted to
  UTC) and the changelog's top item. `beta_hardlove` moves ahead of releases, so watch up to the release commit, not the
  branch head.
- **The docs can lag the code, or the reverse.** Hardlove's sheet had 0.8.3 trainer changes before the repo did, and
  vice versa. A sheet-only change is still worth reporting.
- **Where a hack's source is public, the code wins.** Data comes from the repo (it parses cleanly and diffs exactly). The
  docs only supply what the code lacks (trainer order and splits, places, tags, notes, item locations), and
  differences show in the guide as "Sheet says …". Agreed 2026-10-19 for Hardlove Gold after a calc import of the
  0.8.3 ROM matched `Trainers.c` where the sheet didn't. For those hacks, watch the docs' Drive dates only, to catch new
  trainers or reordered splits. Hacks without public source keep the docs as the main source.
