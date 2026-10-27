# Tools

Trainer field preparation: `python -I tools/trainer_fields.py` checks derived trainer `field` records; `--write`
refreshes them without changing existing notes, teams, keys or build dates. `extractlib.finalise()` does this
automatically on rebuild. `python -I tools/trainer_fields_check.py` checks parsing, inheritance, unresolved labels,
schema compatibility and idempotence. Add `--sources` under the project Python environment to check every field
comment in Hardlove's active Trainer Battles tabs (requires local `.src/` and openpyxl). The calc's use of it
(area conditions): `template/README.md` → Damage calculator (Field).

Each hack's downloaded docs go in `hacks/<hack>/.src/` (git-ignored: raw docs from hack authors are never committed to
this public repo), and its `SOURCES.md` says exactly how to fetch them again. Run its commands from the repo root in Git Bash.

**Python environment:** `uv sync` (repo root) builds `.venv` from `pyproject.toml` + `uv.lock`, the same on every
machine; run tools with `uv run python -I tools/<script>` (or `.venv/Scripts/python.exe`). The fetch and extract
scripts below are stdlib only; the venv adds what checking the docs needs (openpyxl for xlsx, pdfplumber for PDFs).
Add a package with `uv add <name>` and commit both files. `assemble.py` stays stdlib only: the Pages workflow runs
it on a bare runner. `pdftotext` (Git for Windows ships it) is also used.

| Script | What it does |
| --- | --- |
| `gate.py baseline [ref]` / `check [hack ...] [--data] [--template] [--jobs N]` / `scenarios [hack ...] [--only a,b] [--jobs N]` | Captures committed HTML/data/reports at a ref; rebuilds data and runs serial DOM, consistency, tabs, migration, mockup and scenario checks; `--jobs N` runs the scenario × guide runs N at a time (each its own browser; same results as serial). `scenarios` runs only `scenarios/` on the built dist (no rebuild or baseline), `--only` some of them by name. Stdlib orchestration; run with `uv run python -I`. Standard gates below. |
| `worktree_setup.py [hack ...] [--session name] [--release]` | Claims a worker checkout, links `.src/` to the main checkout (Windows junctions, no copying), then `uv sync`; no hacks means every built guide. Refuses other claims or existing source copies. Release removes only the matching claim. |
| `scenarios/tracker-reload.mjs <guide.html>` | Seeded tracker state, Clear and reload at 260 × 316 in `dvkb`; assertions on the control and saved state. `scenarios/README.md` describes new spec checks. |
| `scenarios/calc-layout.mjs <guide.html>` | Calc layout, spec checks 1, 17–20, 22 (+ 18b, 18c): fit at 260 × 316 (and 537 × 424, 832 × 424), long names, scroll stops, box size, wide columns and foe list / strip (480 × 392 to 832 × 316), the 222 px resize, the 61-Pokémon box. Skips without `cfg.calc`. |
| `scenarios/calc-controls.mjs <guide.html>` | Calc controls, checks 2–11, 13, 16, 23: tap to attack, cap box, trainer stepping and sheet, Spe and stages, HP, crit, multi-hit, move swap, Mega, custom set, unknown set, per-slot crit. |
| `scenarios/calc-import.mjs <guide.html>` | Calc import, checks 12, 14, 15: save / reset and re-import, the four error banners, empty states. Uses the test reader and the fixtures in `scenarios/fixtures/calc/` (written in EI's ids, copied into each guide's own ids). |
| `scenarios/calc-persist.mjs <guide.html>` | Calc persistence, check 26 (every kind of state back after a reload) and Clear saved state in the Thor frame built by `thor-frame/build.py`. |
| `scenarios/calc-entry.mjs <guide.html>` | Calc entry points, check 21: Calc vs ▸ on a trainer card and Use in calc ▸ on a Pokémon page. |
| `scenarios/calc-field.mjs <guide.html>` | Calc field from data, check 25: a copy of the profile field list is drawn exactly; a selection reaches the engine and survives a reload. |
| `scenarios/calc-hidden.mjs [guide.html]` | Calc hidden without data, check 24: a guide without `cfg.calc` has five tabs and no entry buttons; with `cfg.calc` the Calc tab and both buttons show. Runs as built, no copy. |
| `calc_check_lib.mjs` | Shared harness for the calc checks (outside `scenarios/` because the gate runs every `*.mjs` there): prepares a copy of a built guide (test reader, fixture data edits, the trainers each check needs picked by role from the guide's own data, the save fixtures in its ids; a check whose role the guide lacks is skipped), one isolated page per case with real taps (hit-tested), number boxes as the input or the dvkb pad, the real `#calc-file` input, page-error capture, and the PASS / FAIL matrix with screenshots in `.tmp/calc-checks/`. |
| `expansion_ids.py` | pokeemerald-expansion headers -> game ids (`#define`s), names (`[CONST] = { .name = … }`) and growth rates (species_info blocks and family macros), for a hack's `GID` (EI `extract/gid.py`; SoulGold's later). |
| `calc_paste_expected.py <paste> <hack> <out.json> --layout …` | A save's `expected.json` from a Showdown-style paste of it (hzla's calc importer makes one): names in the guide's own spelling; `--layout` places the paste's Pokémon in party / boxes. |
| `calc_save_check.mjs <guide.html> <save file> <expected.json>` | The done-check for a save reader: imports the save through the guide's real file input and compares its party and boxes with `expected.json` (names: species, level, nature, ability, item, moves in order, IVs, EVs). Exit 0 on a match; 1 with a printed diff on a mismatch; 2 when the import or setup fails. Format and proof: below. |
| `extractlib.py` | The shared start and end of every hack's `extract/` (layout in its docstring): paths, build report, PDF text, `finalise()` (Items standard, prune, Trainers in walkthrough order, split names, schema) and the `data.json` writer. |
| `schema.py` | The `data.json` schema: key order per object, dead fields dropped, stop keys. Raises on a key it doesn't know (add it there and to the EI notes' Data schema). |
| `calcbackup.js <backup.js> <out.json>` | An hzla-style damage-calc backup file (trainer sets, moves) as JSON. |
| `showdown.js <dist/data dir> <out.json>` | pokemon-showdown data files (moves, texts, dex, abilities) as one JSON. |
| `drive_ls.py <folder-id> [out-dir]` | Lists a public Google Drive folder; with `out-dir`, downloads every file in it (Sheets as .xlsx, Docs as .txt, other files as-is). Skips subfolders and archives (.zip etc.). |
| `mirror.py <start-url> <out-dir> [max-pages] [skip ...]` | Mirrors a static site's pages under the start URL's folder. URLs containing any `skip` substring are not followed. |
| `source_http.py` | Shared retrying byte reads for `mirror.py` and `rhd_moves.py`; each caller keeps its headers, timeout and delay policy. |
| `check_updates.py [hack]` | Reports source changes against each hack's `watch.json`; `--accept <hack>` saves checked state after updating the guide/sources. No rebuilds or patch downloads. |
| `wp_dump.py <site> <out.json> [types ...]` | Dumps a WordPress site (pages and custom post types) through its REST API into one JSON file. |
| `wiki_dump.py <api.php> <out-dir>` | Dumps every page of a MediaWiki as wikitext. Not used by any hack right now. |
| `rp_item_locations.py` | Builds Renegade Platinum's `item-locations.csv` from its docs plus vanilla Platinum (pret decomp). |
| `hge_species.py` | Extracts per-species dex data from hg-engine data files, and diffs two extracts (HeartGold Retiled). |
| `sprites_pee.py <expansion dir> [out-dir]` | Builds the shared sprite set (`sprites/png/`, `sprites/index.json`) from a pokeemerald-expansion checkout (`sprites/SOURCES.md`). |
| `sprite_keys.py <hack>` | Lists the sprite key each species gets (from dex number and name; `assemble.py` uses it) and the species not in the shared set, i.e. the hack's own forms. |
| `datajson.py` | `load()` / `save()` for a hack's `data.json` in its own layout (one line per entry for M, MV, AB, P, LOC, AR); for extract steps that edit the finished file (`itemstd.py`). |
| `splits.py` | Shared `split_name(name, cap=None)` for trainer and walkthrough split names; normalises `[Level Cap N]`, league names and post-game labels. |
| `wikitext.py` | Shared `split_args(text)` splits template arguments around nested wikitext templates and links; each caller interprets and cleans its own fields. |
| `ctrguide.py` | Shared 3DS guide dex conversion, form names, move-doc parsing, trainer matching, default level-up moves and initial walkthrough stop/area attachment; game-specific evolution handling, item routing and cap regrouping stay in each extract. |
| `itemstd.py` | Items tab standard (the rules are its docstring): `standardise(D, RULES.get(hack, {}))` puts `D['IT']` and the walkthrough's item rows in the shared box set, sub-headings and Found / Wild / Also / Shop lines; idempotent. CLI: `python -I tools/itemstd.py <hack> [data.json]`. |
| `tabs_check.py` | `python -I tools/tabs_check.py [hack ...]` after a build: Walkthrough and Trainers pages list the same trainers in the same order, and the cap a place / stop shows never goes down (optional boxes left out). Exit 1 on a problem. |
| `browser.mjs` | Shared `startBrowser({profilePrefix, flags, onEvent, onDisconnect})` for domcompare, consistency, walk-state and mockup checks. Discovers Chrome / Edge (`CHROME` overrides), starts an isolated profile and CDP connection, and returns `{send, close}`; `close()` stops Chrome and removes the profile. Scenarios, navigation waits, assertions and per-check flags stay in callers. Requires Node 22+. |
| `domcompare.mjs <old.html> <new.html> [--kb]` | Renders two builds route by route in headless Chrome and compares the DOM (options in its header; timing below). The check after any template change. |
| `consistency-check.mjs [hack ...]` | After `python assemble.py`: starter / player pickers and rival filtering, single caps, MGM, saved ticks, five viewer sizes, expanded pages and light theme, normal and `dvkb`, on every built guide (or the ones named). Requires Chrome or Edge. |
| `walk-state-check.mjs` | `node tools/walk-state-check.mjs <old.html> <new.html> <legacy-stop-key>` checks walkthrough layout migration, every stop's saved state using the new build's migration function, fragment inheritance, real checkbox rendering (synthetic steps), Next step, uncheck/reset and reload, normal and `dvkb`. For an old build from before stop keys were stamped, use `1.8` for Eternal X or `1.0` for Photonic Sun; a current keyed baseline also works at `0.0`. With no arguments, compares each `.tmp/state-before/<hack>.html` snapshot against its `dist/` build at stop `0.0`; save those snapshots before rebuilding. Requires Chrome or Edge. |
| `pngpal.py` | Reads, writes and crops palette PNGs (used by `sprites_pee.py` and `assemble.py`). |
| `garc.py` | Reads 3DS GARC archives, LZ11 entries, mini packs and Gen 6/7 game text. Used by the scripts below. |
| `ctr_dex.py <game> <out.json> <romfs> [fallback ...] [--code code.bin \| --ips code.ips]` | The whole dex from a 3DS romfs (`x`, `oras`, `sun`/`moon`, `usun`/`umoon`): species and forms with stats, abilities, every learnset, evolutions, Megas; moves; abilities; TM list; wild tables. Used for Photonic Sun, Eternal X, Meissa Moon, Navy Sapphire. |
| `buffel_check.py <dex.json> <doc>` | Checks a `ctr_dex.py` extract against Buffel Saft's `Pokemon Changes.pdf` (new moves, abilities) or `Level Up Moves, *.txt` (every learnset). |
| `xy_trainers.py [--oras] <romfs> <out.json> [vanilla-romfs]` | Dumps every trainer from an XY (Eternal X) or ORAS (Navy Sapphire) romfs, names from its own text. |
| `ex_rivals.py <trainers.json> <out.md>` | Eternal X's rival fights by battle and starter, from `xy_trainers.py` output. |
| `usum_trainers.py [--sm] <romfs> <out.json> [fallback-romfs ...]` | Dumps every trainer from a USUM (Photonic Sun) or SM (Meissa Moon) romfs, with natures and EVs. |
| `bulba_pages.py <out-dir> cat:<Category> \| pre:<Title prefix> ...` | Bulbapedia pages as wikitext through its API (category members or a title prefix; `Walkthrough:` prefixes work). Photonic Sun's trainer places and story order. |
| `serebii_usum_items.py <items.shtml> <tm.shtml> <out.csv>` | Vanilla Ultra Sun item locations from Serebii's pages. |
| `rhd_moves.py <moves/index.html> <hack-slug> <out.json>` | Every RomHackDex move with priority and description (the index lacks both); reads each move page, saves only those fields. |
| `drayano_check.py <Pokemon Changes.txt> <romhackdex/pokedex>` | Compares Drayano's change doc with a RomHackDex mirror (new base stats, full level-up lists) for every species the doc changes. |
| `preview.py <page.html> [name.html] [--frame] [--title T] [--rm name ...]` | Puts a page on the phone preview (below) and prints its link; `--frame` wraps it with `mockup/thor-frame/build.py` first. Existing usage unchanged. |

## Standard gates

```
uv run python -I tools/gate.py baseline main
uv run python -I tools/gate.py check
uv run python -I tools/gate.py check eternal-x --data
uv run python -I tools/gate.py check --template
```

Capture the accepted pre-change ref once. `git archive` extracts committed files into a temporary directory under
`.tmp/`, builds there, then retains HTML, data and reports in `.tmp/baseline/`; it never switches the working tree
or registers a temporary worktree. The manifest records ref/SHA/date and SHA-256 hashes (verified before checks).
Raw inputs are not needed to capture a baseline. A new guide needs a baseline ref containing its reviewed,
committed first data build; without that the gate fails explicitly rather than silently self-comparing.

Neither flag means both halves; both flags also run both. No hack names means every built guide. Data rebuilds
use the explicit `REBUILDS` table: EX/PS/HG raw, EI `itemstd.py`; unknown paths fail until added.
Data compares ignore only the top-level `built` stamp; reports compare byte-for-byte. Counts report species,
trainer cards, item rows and walkthrough stops. Stamp-only rebuilds restore the original data file bytes.

Template checks assemble every guide, then compare each selected guide normal/keyboard (four DOM jobs within one
sweep), consistency, tabs and keyed-stop migration. The four existing mockup checks run on EI in both modes;
if EI was not selected, the first selected guide is used. Every `scenarios/*.mjs` runs on every selected guide.
Mockup tools that only print diagnostics are treated as failures on page errors, bad jumps or wrong route bars;
their detailed geometry output remains a review log, not an invented assertion. Logs: `.tmp/gate/<run>/`, with
one PASS/FAIL line per check and a total time; any failure exits 1. No baseline refreshes or DOM ignores on failure.

Browser sweeps are serial, across worktrees too; the gate checks running Node check commands before each browser
invocation and refuses contention. Standalone checks need the same busy check. Do not run a second sweep in parallel.
The gate replaces the cleanup's one-off `.tmp/cleanup-baseline/datacmp.py`.

T3 exposes project scripts with `runOnWorktreeCreate`; no repo project-config file is present. Set a Configure
script to `python -I tools/worktree_setup.py` with that flag after integration. This worker could read the schema
but the project update was denied (`capability_denied`: requires a full-access/default thread); the orchestrator
must apply it. Setup does not imply permission to edit shared source inputs or commit, merge or push.

## Phone preview

Mockups and unmerged builds are tested on the phone and the Thor over Tailscale, from anywhere: `tools/preview.py`
copies a page into `preview/` in the main checkout (git-ignored), and `tailscale serve` serves that folder on the
tailnet only, at `https://<pc>.<tailnet>.ts.net/preview/` (the index lists every page, newest first). Nothing is public.

One-time setup per PC (serve keeps running across reboots):
1. Serve enabled on the tailnet (the first `tailscale serve` prints the admin-console link; it also turns on HTTPS).
2. Serve it under `/preview`. Permanent, from an admin terminal: `tailscale serve --bg --set-path /preview "<main
   checkout>\preview"`. Without admin (lasts until the server stops): `python -m http.server 8765 --bind 127.0.0.1
   --directory "<main checkout>/preview"` and `tailscale serve --bg --set-path /preview http://127.0.0.1:8765`
   (Git Bash: `MSYS_NO_PATHCONV=1`, or `/preview` becomes a Windows path). `tailscale serve status` shows both.

## Calc checks and the save check

The calc checks (`tools/scenarios/calc-*.mjs`, from the calc's UI spec checks 1–26) are run by `gate.py check --template` on every
guide with `cfg.calc` (the others skip, except `calc-hidden`, which checks that they hide the feature). Run one by hand:

```
node tools/scenarios/calc-controls.mjs dist/emerald-imperium.html
```

Each prints one PASS / FAIL line per check × size × mode and a matrix, writes `.tmp/calc-checks/<scenario>.json`, saves a
`…-FAIL.png` screenshot for each failure, and exits 1 on any failure. Every case opens its own page (fresh storage),
and page exceptions and console errors fail the case. Each case also asserts `documentElement.scrollWidth` equals the
viewport. Sizes: 260 × 316 in normal and `dvkb` for every check; checks 1 and 20 also at 537 × 424 and 832 × 424 (20:
480 × 392 and 832 × 316). The checks run on a copy of the built guide (`.tmp/calc-checks/`): the test reader is
injected and used even when the profile names a real save reader (the fixtures are test-reader files; real readers have
the save check), and `calc_check_lib.mjs`'s `fixturePatches` renames two trainers and
strips one sheet-only Pokémon's set, because the EI data has no trainer with those names or gaps. The built `dist/` is
never changed.

**Save check** (`tools/calc_save_check.mjs`): the done-check for a save reader.

- Usage: `node tools/calc_save_check.mjs <guide.html> <save file> <expected.json>`. The save goes through the guide's
  real `#calc-file` input. A `.json` save is a fixture in the test format (`tools/scenarios/fixtures/calc/*.json`) and
  goes through the `test` reader; any other file through the guide's own reader (`cfg.calc.save`) as built.
- `expected.json`: `{"party": [mon, ...], "boxes": [[mon, ...], ...]}`, with a mon written in the guide's own names:
  `{"species", "level", "nature", "ability", "item", "moves": [4 names, "" for an empty slot], "ivs": [6], "evs": [6]}`.
  The counts of party and boxes must match exactly. Inside a mon, every field present is compared (omit a field to skip
  it). Write the file from `data.json` (species `P[].n`, abilities `AB[i][0]`, moves `M[i]`), not by reading the page's
  output back, or the check compares the page with itself.
- Exit 0: `OK: 61 Pokémon (6 party, 55 boxed) match …`. Exit 1: `MISMATCH` with one line per difference, e.g.
  `party[0].level: expected 35, got 34`. Exit 2: the setup or the import failed (the banner text is printed).
- An hzla paste of the save (Showdown format) becomes `expected.json` with `tools/calc_paste_expected.py`; check the
  paste's levels and EVs before trusting them (EI's had no EVs).
- Proof on the test reader (`tools/scenarios/fixtures/calc/`): `good.json` with `good.expected.json` exits 0;
  `good.json` with `good.wrong.expected.json` (two deliberate differences) exits 1 and prints both.

## Source log

When each hack's sources were compiled, and the version they cover. **Whenever a hack's sources are fetched again,
update its row here and the "Fetched <date> (<version>)" line at the top of its `SOURCES.md`.** To spot an update,
run `uv run python -I tools/check_updates.py [hack]`; its pins and coverage are described below.

| Hack | Version | Sources compiled | Guide built | Where to look for updates |
| --- | --- | --- | --- | --- |
| Blaze Black 2 Redux | v1.4.1 | 2026-10-18 (docs), 2026-10-19 (RomHackDex) | – | Drayano's Drive (Documentation folder), RomHackDex |
| Emerald Imperium | v1.3 / 1.3.1 | 2026-10-18 (guide built from the same sources) | 2026-10-02 | emeraldimperium.info Drive folder; eidex and Dynamic-Calc-Decomps repos |
| Eternal X | v2.67 | 2026-10-18 (docs + romfs), dex extract 2026-10-19, regenerated + Bulbapedia 2026-10-22 | 2026-10-22 | Buffel Saft's Drive, PokeCommunity thread |
| Hardlove Gold | 0.8.3 (source `kumakuma1/hardlove` `f1b2363001`, trainer sets patched onto the 0.8.2 build; docs site `bb5862f` is older) | 2026-10-18 | 2026-10-19 | `kumakuma1/hardlove` branch `beta_hardlove` commits, the changelog, Drive sheets |
| HeartGold Retiled | v6.12.1 | 2026-10-18, ability text 2026-10-19 | – | GitHub repo releases |
| Meissa Moon | v2.2.2 | 2026-10-18 (docs), 2026-10-19 (romfs) | – | Author's Drive, PokeCommunity thread |
| Navy Sapphire | v2.1.5 | 2026-10-18 (docs), 2026-10-19 (romfs) | – | Hack's Drive, PokeCommunity thread |
| Photonic Sun | v2.38 | 2026-10-18 (docs + romfs), dex extract 2026-10-19, vanilla extracts + Bulbapedia 2026-10-19 | 2026-10-19 | Buffel Saft's Drive, PokeCommunity thread, Bulbapedia (USUM) |
| Radical Red | v4.1 | 2026-10-18, move details 2026-10-19 | – | RomHackDex; the two trainer sheets |
| Renegade Platinum | v1.3.0 | 2026-10-18 (docs), 2026-10-19 (RomHackDex) | – | Drayano's Drive (Documentation folder), RomHackDex |
| SoulGold | no version number | 2026-10-18, species details 2026-10-19 | – | eemeliri.github.io/soulgold data files |
| Unbound | – | 2026-10-18, move details 2026-10-19 | – | RomHackDex, unboundwiki.com; the three trainer sheets |

## Source update checks

`uv run python -I tools/check_updates.py` checks all twelve hacks; give one hack name for a smaller run.
Exit 0 means unchanged, 1 changed, 2 a failed check. Manual entries always print a reminder: they are not checked.
After updating the guide or compiled sources, run `uv run python -I tools/check_updates.py --accept <hack>`.
Acceptance is atomic per hack and refused if any automatic check fails. It does not update this source log,
the fetched version in `SOURCES.md`, the guide, or local baseline files. Review those separately.

Each `hacks/<hack>/watch.json` has a `sources` list. Every entry has `name`, `type`, `state` and its configuration:

| Type | Configuration | State / report |
| --- | --- | --- |
| `github` | `repo`, `ref`, `paths` (exact files or directory prefixes ending `/`); optional `release` guard | Commit SHA and watched blob SHAs; exact watched-file text diffs, including additions/deletions. Unrelated files and commit-only changes are ignored. |
| `drive` | `id` of a folder; optional `ids` or `exclude_ids` | File IDs, names and modified dates from `embeddedfolderview`. Includes patch archives; skips subfolders (watch their IDs separately). |
| `sheet` | `id`; optional `baseline` xlsx path relative to the hack | Hash per tab of cell values and cell notes, using Hardlove's existing stdlib xlsx reader. Shows cell diffs if a local baseline tab matches the saved hash, otherwise names the changed tabs. |
| `version` | `url`, regex `pattern` with one capturing group; optional `select: "latest"` for numeric dotted versions | Version string. No match or ambiguous matches fail instead of silently accepting. |
| `page` | `url`; optional `baseline` path relative to the hack | Normalised page-text hash; text diff when a matching local baseline is present. A map state checks every relative page in that map with six workers. `projection: "move-details"` checks only RomHackDex move priority/description, matching `rhd_moves.py`. |
| `sitemap` | `url`; optional URL `prefix` | Each URL's lastmod. Without lastmod it checks membership only, explicitly labelled in state. |
| `manual` | One-line `note` | Reminder only, never a claim of unchanged data. |

Initial states use fetched files and published pins; `baseline_note` marks exceptions seeded from current metadata
on 2026-10-24 (Drive dates and sitemaps were not retained with the original downloads). No downloaded document text
is committed. Sheet hashes include hidden tabs and notes, but ignore formatting and ZIP metadata: two exports of
the same Sheet can have different bytes. Update local baseline files only after checking the reported diff.

GitHub allows 60 unauthenticated requests/hour. A full check uses fourteen API requests (two per repository/ref),
plus raw-file requests for diffs. A run caps itself at fifty; that is not an hourly allowance, so count earlier
runs too. Recursive trees avoid one request per watched path and the compare API's 300-file truncation; a truncated
tree fails loudly. No token is required. No release tags are assumed.

Hardlove watches its reviewed 0.8.3 release commit, not `beta_hardlove` head. Its Drive patch filenames guard that
pin. A new version blocks accepting the source until the release commit is matched by UTC date and changelog;
then update `ref` and `release.version`. Retiled's upstream engine is likewise release-matched, never upstream
main; its own guides/tables may be checked on head. Code wins over docs; docs' Drive dates independently signal
trainer order/split/location changes, since code and docs can update at different times.

RomHackDex's sitemap has no lastmod on most data pages. The checks also hash every mirrored HTML page and compare
move priority/description against the fetched `moves.json`; this downloads thousands of pages and can take minutes.
Sitemap additions/removals signal when to re-mirror and add/drop content hashes. Sitemap timestamps are supplied by
the publisher, not a guarantee. Unbound's wiki uses its page/wiki sitemap index dates. Drive dates are day-resolution
(today's clock is normalised to the date); edits on the same day can be missed. 3DS patch archives are watched in
their actual folders, but a changed patch still needs manual romfs extraction, not an automatic ROM download.

## Timing `domcompare.mjs` (choosing `--jobs`)

`domcompare.mjs` (usage in its header) splits the routes over `--jobs` pairs of tabs. To pick a job count on a
machine, time one slice of routes rather than the full guide: compare a build with itself (always identical, so only
the sweep is timed), with `--routes` picking the slice, and read the `swept in` line. Use a big slice; on a short one
the fixed cost of booting each tab (each loads the whole 2.5 MB guide) hides the speedup.

```
MSYS_NO_PATHCONV=1 node tools/domcompare.mjs dist/emerald-imperium.html dist/emerald-imperium.html --routes=#/p/ --jobs=4
```

Check `no hashchange` is 0 in every timed run: each miss is a 5 s timeout and skews the numbers. Results:

| Machine | Slice | 1 | 2 | 4 | 6 | 8 | 12 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PC, 16 threads (2026-10-19) | EI `#/p/`, 1275 routes | 41.3 s | 21.9 s | **13.7 s** | 13.6 s | 15.5 s | 21.8 s |
| PC, 16 threads (2026-10-19) | EI `#/a/`, 284 routes | 10.4 s | 6.5 s | **5.6 s** | 6.8 s | 8.4 s | – |

Four jobs (the default, a quarter of the threads) is best on both the PC and the laptop; past 6 it gets slower.
Before `--disable-ipc-flooding-protection` was added (2026-10-19), Chrome throttled each tab for about 10 s every 100
routes (each route makes 2 history updates and Chrome allows 200 in 10 s). Those stalls showed as `no hashchange`
misses at the 100th route of every tab, and they caused most of the older numbers and the apparent speedup from more
jobs (EI `#/a/` at 1 job: 30.4 s with them, 10.4 s without).

Since 2026-10-24, snapshots force `content-visibility:visible`, wait for rendering frames after DOM quiet, and
recompute collapse bars after lazy cards fill. This removes skipped-layout and late-bar noise without ignoring DOM
differences. The slice table above predates that change; remeasure it before tuning job counts. Run whole sweeps
sequentially, not alongside another browser check. With four jobs, the current full EI guide (2649 routes) takes
about 150–153 s in normal / keyboard mode; a keyboard self-comparison took 152.0 s with no flagged routes or page
errors. The preceding worker recorded 139.1 s after the fix and 161.8 s with one spurious flag rechecked clean before
the final settling fix. These are full sweeps, not the historical slice timings; contention-heavy baseline logs
(including the 458.3 s EI keyboard run) are not a controlled performance comparison.

## 3DS game data (found 2026-10-19)

3DS hacks (LayeredFS) ship only the archives they change, so diff against vanilla dumps of the base game. The user's
Azahar dumps are in `%APPDATA%/Azahar/dump/romfs/<title id>/`; a title update dumps as `0004000E…` and holds only the
files it replaces. Archive numbers, record layouts and text encryption: `tools/romfs-extraction.md` (pk3DS
`GARCReference.cs`).

- Every 3DS hack here ships its romfs as a zip in its Drive folder, next to the docs. `drive_ls.py` skips zips, so
  they're fetched by id (each `SOURCES.md`). Meissa Moon and Navy Sapphire ship a full `code.bin`; Photonic Sun
  and Eternal X ship a small `code.ips`, applied by `ctr_dex.py` to the vanilla TM list (PKHeX) at the TM table
  offset (XY 0x464796, Ultra Sun v1.2 0x4BD98A).
- The docs are change lists (and Buffel's stat rows are images), so the full dex comes from the game data; the
  docs are the cross-check. Where they disagree the game wins, and the guide can say "Doc says ...".
- XY/ORAS encounter archives: every entry is one zone, an LZ11 `ZO` mini pack (file 0 = 56-byte zone header,
  location at 0x1C; file 3 = encounter table). Gen 7: area *i* is file 9 + 11*i* of the encounter GARC, zones map
  to areas through the world data. Forms text: form 0 at the species' line; forms 1+ of every multi-form species
  follow the species lines in dex order (cosmetic forms included).
- Never LZ11-decompress personal, trainer or move records: a record can start with 0x11 (a Fairy-type move).
- Hack data can hold IDs past the end of the game's text (Meissa Feraligatr's hidden ability 255) and 0xFFFF
  filler; the tools print them as `ability #255` instead of failing.

## Gotchas found on 2026-10-18

- A single Google Sheet: `curl -sL "https://docs.google.com/spreadsheets/d/<id>/export?format=xlsx" -o <file>.xlsx`.
  A single Drive file: `curl -sL "https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t" -o <file>`.
- **PokeCommunity returns 403** to scripts and to Claude's fetcher. Read its threads through the Wayback Machine
  instead: `https://web.archive.org/web/2026id_/<thread url>` (the `id_` gives the raw page). The
  `archive.org/wayback/available` API rate-limits quickly; the direct URL did not.
- **Drive folder pages only render about 10 entries.** `drive_ls.py` uses `embeddedfolderview`, which lists all.
- **Reddit, the Radical Red site (radicalred.net no longer resolves) and Fandom pages block or fail.** The Fandom
  `api.php` still answers.
- **RomHackDex per-move and per-ability pages** are huge and repeat what the Pokémon pages say; skip them.
