---
name: rom-hack-offline-dex
description: Build, extract data for, update or audit ROM hack guides in thor-dex-guides with the shared template and assemble.py. Use for dex, location, trainer, item, walkthrough, sprite and Dex Viewer UI work, not Android app changes.
---

# ROM hack offline dex builder

Goal: one self-contained HTML file (no network needed) that merges every doc for a ROM hack into sections: Pokémon, Locations, Trainers, Items, Walkthrough, Calc. It runs in two places:

- **Dex Viewer** (the user's Android app on the AYN Thor): a small floating window, non-focusable so the game keeps the controller. The page gets no Android keyboard, `<select>`/`alert`/`prompt` only work through the app's shims, and the window can be as small as 260 x 316 CSS px.
- **A phone browser**, where it behaves like a normal web page with real inputs.

Dark by default, touch only, Australian spelling, no em or en dashes in text.

## Repository build: reuse the shared template

This is the repo's copy of the skill (Claude and Codex); when it changes, the claude.ai account copy needs a
re-upload. Read `CLAUDE.md` / `AGENTS.md`, `PROGRESS.md`, `template/README.md`, the hack's `SOURCES.md` and
`notes.md`. Model choice is in those instruction files, not here.

The reference is Emerald Imperium's data and `template/shell.html`, `template/dex.css`, `template/dex.js`.
Do not hand-build an old standalone guide or implement guide UI in the sibling Android app.

- Raw docs belong in `hacks/<hack>/.src/` (git-ignored); fetch with `SOURCES.md` and existing tools.
- `hacks/<hack>/extract/` generates `hacks/<hack>/data.json` in the shared layout (`tools/extractlib.py` docstring;
  `check.py` checks the result). Follow `hacks/emerald-imperium/notes.md`'s schema; `extractlib.finalise()` applies
  the shared rules (Items standard, cap split names, Trainers in walkthrough order, key order).
- Wording, feature switches and storage keys belong in `hacks/<hack>/hack.json` (`cfg`). Preserve published keys,
  walkthrough stop keys and the trainer key table (`extract/trainer_keys.json`, written by the first build).
- Saved state never stores a position in the data (an index into `M` / `MV` / `AB` / `P` / `LOC` / `TR` / `WK` / `IT`): names or stable keys, mapped back on load, a gone one handled, older formats
  still loading (`template/README.md`). `tools/scenarios/guide-update.mjs` checks every kind on every guide.
  Adapt Emerald Imperium-only features through existing configuration and schema.
- Shared sprites live in `sprites/`; hack-specific additions go in `hacks/<hack>/sprites.json`.
- Build `dist/<hack>.html` with `python assemble.py <hack>`. Template changes require `python assemble.py` and
  checks on every guide, including `tools/domcompare.mjs` against a baseline built before the change.
- Use `uv run python -I` for tools needing dependencies; keep `assemble.py` stdlib-only.

**Read `references/viewer-ui.md` before UI code**, and `template/README.md` for the page design and what was
rejected.

## Getting the sources (in order of preference)

1. **Existing fetchers and downloads (preferred).** Follow `SOURCES.md` and reuse local files first. If a manual download is needed, ask for each Google Sheet as .xlsx (File > Download > Microsoft Excel), any GitHub doc site or calc repo as a ZIP (Code > Download ZIP, or `codeload.github.com/<owner>/<repo>/zip/HEAD`, which has no API rate limit), and PDFs as files. Parse in the workspace with Python: openpyxl reads every tab and cell notes via `cell.comment`; pdfplumber reads PDF tables by word position (columns by x band). Only summaries enter the context, so this is the most token efficient and robust route.
2. **Google Drive connector, if connected.** Discover integration tools before assuming access. Fine for locating files; export sheets as xlsx so cell notes survive. Some shared sheet ids can't be opened by the connector; ask for a download or a pasted text copy.
3. **Browser fallback.** Use available tools when downloads are unavailable. In T3 prefer `preview_*`; inspect ownership and do not drive a human-controlled tab. Tricks below are optional extraction techniques, not a requirement for Claude tools.

Also look for: a dex site's GitHub repo (EI's site is built from JSON in `src/data/`: species, moves, abilities, items, types, wild encounters, sprites); an hzla-style dynamic calc (search GitHub for `<hack> calc`; `backups/title_to_backup_mappings.js` maps the hack's title to `backups/<file>.js`, which holds every trainer set); the `pokemon-showdown` npm package for move priority, descriptions and newer forms.

## Workflow

1. **Inventory** every source: sheets and tab names (including hidden and outdated duplicate tabs, which you skip), doc site data files, calc data, PDFs, walkthrough pages. Match the target version and documented source precedence (public game source code wins over docs); write its `watch.json` with the fetched state (`tools/README.md` → Source update checks).
2. **Scope before building:** which species are obtainable (a locations or availability doc is the source of truth, not a dex site's wild data), what trainer data exists (IVs, EVs, natures, cell notes, relative levels), level-cap splits, item locations, the official tracker area order. Tell the user what you found and any gaps before the big build.
3. **Extract** with the hack's `extract/build.py` (copy a built hack's layout) into `data.json`; `assemble.py`
   inlines it, the template and the sprites. Never hand-edit a built file.
4. **`hack.json`:** title, game, platform, version (the `dex-viewer:` meta tags come from it), a new localStorage
   prefix in `cfg.ls` (`dvkb` stays shared: the "force the in-page keyboard" test switch), the hack's wording in
   `cfg.txt`, feature switches (`template/README.md`).
5. **Sprites:** the shared set; `tools/sprite_keys.py <hack>` lists the forms only the hack has, which go in its
   `sprites.json`.
6. **Test** (`CLAUDE.md` → Making a new guide): `check.py`, `tools/tabs_check.py`, `tools/consistency-check.mjs`,
   `walkcheck` / `pagecheck`, page errors on every route, nothing wider than 260. On the Thor when adb is available.
7. **Write the notes** in `hacks/<hack>/notes.md` (headings: Build, Sources and rules, Local storage, Hack-only data,
   Checks, History) so a later session can extend it.
8. **Deliver** the build in the Thor frame on the phone preview (`tools/preview.py`) for the user's review.

With the template in hand, aim for: batch 1 Pokémon + moves + abilities, batch 2 Locations + tracker, batch 3 Items + Walkthrough, batch 4 Trainers (in walkthrough stops and on Pokémon pages). Trainers boxes and walkthrough splits are the same cap splits. Combine batches when the sources are small.

## Chrome fallback tricks

- Google Sheets data via JSONP from another origin: `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=responseHandler:<cb>&headers=0&sheet=<name>`; add `&range=A1:ZZ1` for merged header rows, which gviz drops.
- Cell notes are not in gviz: fetch `/export?format=xlsx` from a foreground docs.google.com tab (background tabs stall), unzip with `DecompressionStream('deflate-raw')`, regex-parse `xl/commentsN.xml` (Trusted Types blocks DOMParser there).
- play.pokemonshowdown.com blocks CORS; jsDelivr, GitHub API and raw.githubusercontent.com allow it.
- Extension calls time out on long work: run un-awaited async jobs that log to `window.__log`, poll, and keep results in localStorage because tabs reload.
- When injecting code via `function(){/* ... */}.toString()`, no regex may contain a star followed by a slash.

## Data rules learned

- **Obtainable set** = encounter tables, gifts, statics, eggs, random pools, trades, game corner, starters, plus evolution family both ways, minus the hack's unavailable list. Form changes (Rotom, Castform, Aegislash...) take their base form's availability. Megas/Primals are their own class, shown after the base form.
- **Fold cosmetic duplicates:** same dex number with identical types, stats, abilities and level-up moves keep one entry (Vivillon, Alcremie, Unown, Minior colours...). Remap evolution targets to the kept form. Drop totem, Gigantamax and Tera forms unless the hack uses them.
- **Typos:** match species, moves, items and abilities by normalised key, then nearest Levenshtein (up to 2). Keep readable names (game data often truncates item names). Record every fix in the data (`TR.fix`-style) and report them.
- **Form suffixes vary per doc** (-A/-G/-H/-P regional; -M is Mega only when holding the matching stone; -M-X/Y/Z). Check held items before deciding.
- **Trainer sets:** the calc's backup file is the game's own data (AI flags included) and is the authority; the sheet supplies order, titles, places, leads, pre-status, rewards and paste links. Skip vanilla leftovers in the calc (Hardy, no item, no ability). Fold "-Mega" copies into the base slot. When sheet and calc differ, the calc wins and the card shows "Sheet says ...". Levels at or below 0 in the calc are relative to the player's highest level ("Highest Lv -1"): store them as relative and let the user set their level per trainer.
- **Stat formula:** HP = floor((2B+IV+floor(EV/4))L/100)+L+10; others = floor((floor((2B+IV+floor(EV/4))L/100)+5) x nature). Check it against any speed or stat values the sheet prints at its stated level cap; mismatches are usually sheet slips, but count them.
- **Level caps:** a trainer's default cap is the cap of the next boundary fight in the hack's cap list. Check this reproduces the sheet's own "level cap used" notes.
- **Locations:** use the official tracker's area order and grouping when one exists; merge areas it says count as one; areas missing from the tracker get no slot. Cross-check every encounter source against the others slot by slot and list conflicts in the notes.
- **Walkthrough placement:** anchor each tracker area to its first mention at or after the previous one (a far-ahead mention doesn't move the pointer); unmentioned areas become "on the way" stops. File items under the earliest place named in their location text; trainers by location within the split (gym leaders take the last matching stop).
- Dex sites can have gaps (Hardlove's was missing Fairy types); cross-check against calc species data. Compare moves with Showdown to flag the hack's changes and originals.

## Features the user wants

- **Pokémon list** with chip filters from search results (type, ability, move, location), sort by dex or a stat (the row then shows that stat), Megas right after their base form, trainer-only species included and tagged, fully unavailable species dropped. **No BST anywhere.**
- **Pokémon page:** types, abilities, stats, stat calculator (level, nature, IVs, EVs) with a speed-by-level row for rare candy planning, where to find, evolutions, move tables with type, category, power and accuracy, source conflicts, trainers who use it. Move and ability pages list their users (ability slot per Pokémon). No "changes from vanilla" card, no evo/breed tags.
- **Trainers** by cap split (`<Boss> Split [Cap N]`), in walkthrough order: cards with sprite, level, types, one speed (with EVs, or without under MGM), ability, item, nature, moves, and notes (guards or gives an item, partner or back-to-back battles, weather, lead slot, pre-status). No IVs. Below 500 px a sprite strip and one Pokémon at a time; wider, blocks three across at most.
- **Items** in the shared box set (`tools/itemstd.py`), missable items flagged, TMs and Mega stones linked to their move or Pokémon.
- **Locations and Walkthrough** as collapsible sections that remember their state; a Starter area first; walkthrough grouped by the same cap splits as Trainers, then place (steps, items, compact encounters, trainers built on first open).
- **Encounter tracker** shared by both tabs: dropdown per area, "Other..." opens a Pokémon picker (keyboard strip in the viewer), small clear button, reset all with confirm, export code, starter selector, dupes clause on whole evolution lines (regional forms separate), failed entries do not count, trades recorded separately, rates rescaled live, roamers have no slot. Import by pasting a code can't work in the viewer (no typing into `prompt`); keep it for the browser and don't depend on it.
- **Calc** rail entry: a placeholder page until the damage calc exists; the stat calculator lives on each Pokémon page.
- **Viewer behaviour** (details in `references/viewer-ui.md`): left icon rail, in-page keyboard, full-window search across every section, number pad, reopen on the last page and place.

## UI changes

The user wants a mockup before any UI change that isn't already in the template: a plain interactive HTML page at the window's real size. Wrap with `tools/mockup/thor-frame/build.py`, publish with `python -I tools/preview.py <page.html> [name.html]`, and give the phone-preview link. Then build the agreed design and record the decision in `template/README.md`.

## Planned work

Read `PROGRESS.md` → Open → Damage calc and `tools/calc/README.md` for calc / save-import work. Use the selected `@smogon/calc` (MIT)
engine; hzla's unlicensed code is read-only format reference, not code to copy. Keep each guide self-contained;
do not introduce a multi-game runtime or expand agreed scope speculatively.
Every new guide's extract writes its save ID tables (`GID`: the game's own numbers for species / forms, moves, items,
abilities, from the game source or game files; forms are the hard part) so the calc's save import works; procedure
`.agents/references/calc-save-reader.md`, readers `template/calc/readers/README.md`.
