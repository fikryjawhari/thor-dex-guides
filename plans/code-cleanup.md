# Code cleanup (brief for a Codex session, written 2026-10-24)

Everything works; this is a quality pass, not a bug hunt. Goal: less old and useless code, and repeated logic pulled
into shared files, so the next guides are cheaper to build. It runs in two phases. **Phase 1 is read-only and ends
with a findings list for the user. Nothing is changed until the user has picked from it.**

## Read first
`AGENTS.md`, `PROGRESS.md`, `template/README.md` (what the template does, the shared rules, what was rejected),
`tools/README.md`, `tools/extractlib.py` (docstring: the extract layout), `hacks/emerald-imperium/notes.md` → Data
schema. Each hack's `notes.md` says how its data was built and which parts are deliberate.

## Scope
| Area | Files |
| --- | --- |
| Template | `template/dex.js` (~124 KB, one file inlined into every guide), `template/dex.css`, `template/shell.html` |
| Build | `assemble.py` (must stay stdlib only: the Pages workflow runs it bare) |
| Shared extract code | `tools/extractlib.py`, `schema.py`, `itemstd.py`, `splits.py`, `datajson.py`, `sprite_keys.py`, `pngpal.py` |
| Per-hack extracts | `hacks/<hack>/extract/*.py` for emerald-imperium, hardlove-gold, eternal-x, photonic-sun |
| Source tools | the rest of `tools/*.py` / `*.js` (fetchers, 3DS readers `garc.py`, `ctr_dex.py`, trainer dumpers) |
| Checks | `tools/domcompare.mjs`, `consistency-check.mjs`, `walk-state-check.mjs`, `tabs_check.py`, `tools/mockup/*.mjs` |

Out of scope: `data.json`, `sprites/`, `dist/`, `uv.lock`, the docs (cleaned on 2026-10-24), the hacks without a guide.

## What to look for
1. **Dead code:** functions, CSS rules, cfg / `cfg.txt` keys, data fields and branches nothing reaches any more.
   Features removed earlier left traces (the "Changes from vanilla" card, the trials / mini caps switch, IVs on
   cards, evo/breed tags, the old `#sugg` dropdown, `cfg.starter: 'slot'`). Prove it's dead with a search, not a
   guess.
   **Not dead:** migrations and fallbacks for saved state from published builds (`migrateWalkState`, legacy cap
   formats, old localStorage shapes). People's saved trackers depend on them. Flag them as "kept for saved state"
   instead. `cfg.ls` keys are never removed.
2. **Repeated logic** between the four hacks' extracts (Photonic Sun and Eternal X were ported from each other:
   compare their `trainers.py`, `locs.py`, `items.py`, `walk.py`, `dex.py`), between the extracts and `tools/`, and
   inside `dex.js` (near-identical render or bind code across pages). For each: the copies (file:line), what a
   shared function would look like, and where it would live (`extractlib.py`, a new `tools/<name>.py`, or a helper
   in `dex.js`). Only propose it when 2+ copies already exist, or the next 3DS / Gen 3 guide would clearly copy it
   again.
3. **Stale comments and names:** comments describing behaviour that changed, references to deleted plans or files,
   leftover debug code, unused imports.
4. **Tools nothing uses** (check every `SOURCES.md`, the extracts and the READMEs before calling one unused).
5. **Small structural smells** worth fixing: very long functions that do several jobs, magic numbers that appear
   more than once, inconsistent naming for the same thing across hacks.

Don't flag style preferences, a different architecture, new dependencies, type hints, or "add tests". The repo's
style is compact on purpose (short names in `dex.js`, one-line rows in data files).

## Phase 1 output
Write the findings into this file under **Findings**, ranked by value for the next guides. One entry each:
`[id] area · file:line(s) · what · proposed change · risk (none / low / needs a rebuild check / touches saved state)
· rough size`. Then stop and give the user the summary. No edits, branches or commits in phase 1 apart from this
file (on `main`, if nobody else is on it).

## Phase 2 (only the entries the user picks)
- Branch `worktree-code-cleanup` from `main` (AGENTS.md → Where a session works). `template/` is one session at a
  time: check that no other branch with template changes is unmerged.
- **The gate, after every change:**
  - Extracts: each hack's `data.json` must come out **byte-identical**. Raw rebuilds need `.src/` (copy it from the
    main checkout; the 3DS hacks also read `romfs-dl/` and the Azahar dumps through main's paths, see each
    `SOURCES.md`). Emerald Imperium's full raw pipeline and Hardlove Gold's raw 0.8.2 snapshot don't reproduce their
    published data. For those, check with the re-finish path (`build.py --published` for HG, `tools/itemstd.py
    <hack>`) and leave the raw-only code alone unless the user says otherwise.
  - Template: `python assemble.py`, then `node tools/domcompare.mjs <main build> <new build>` for all four guides,
    normal and `--kb`: 0 differing routes, 0 page errors. Also `node tools/consistency-check.mjs` and
    `python -I tools/tabs_check.py`.
- Small commits, one finding (or one group) each. Ask the user before every push; never push or merge `main` without
  a yes.
- At the end: update `tools/README.md` / `template/README.md` if something moved, tick the findings here, and say
  what merges next. Once it's merged, delete this file (the AGENTS.md rule for finished plans).

## Findings
(phase 1 writes here)
