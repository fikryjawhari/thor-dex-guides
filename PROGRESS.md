# Progress

Guides for Dex Viewer, split out of the app repo (`thor-dex-viewer`, private) on 2026-10-19; that repo's
`docs/PROGRESS.md` keeps the app's history. History here is in git, each hack's `notes.md` → History, and
`template/README.md` (design decisions). This file is the current state and what's left.

## Current status (2026-10-24)

- **Live on GitHub Pages** (https://fikryjawhari.github.io/thor-dex-guides/), built by the Action from `main`:
  Emerald Imperium 1.3.1 (GBA), Hardlove Gold 0.8.4 (NDS), Photonic Sun 2.38 Rebalanced (3DS), Eternal X 2.67
  Rebalanced (3DS). All four share one template, one extract layout (`tools/extractlib.py`), one data schema
  (`tools/schema.py`), one Items standard (`tools/itemstd.py`) and one notes / SOURCES layout.
- Done and merged: the split UI, search (full-window, results with actions, search stays set), trainer cards, the
  consistency pass (2026-10-24) and the walkthrough / Trainers agreement (2026-10-24: walkthrough splits = Trainers
  boxes, same order, caps never go down, `tools/tabs_check.py`). Audits passed headless; the user approved the phone
  previews.
- Done and merged 2026-10-24 (data byte-identical and pages DOM-identical where nothing was meant to change):
  - **Code cleanup:** dead template code out, shared 3DS extract code in `tools/ctrguide.py` (dex conversion,
    trainer matching, walkthrough stops) and `tools/wikitext.py`, shared `tools/browser.mjs` for every browser check;
    domcompare's EI `--kb` flake and the walk-state check (stale fixtures, checked the wrong migration) fixed.
  - **Text zoom vs collapse bars:** a ResizeObserver on `#app` rechecks the bars (`tools/mockup/zoomcheck.mjs`).
  - **Update checker:** `tools/check_updates.py` + `hacks/<hack>/watch.json` for all twelve hacks.
  - **Standard tooling:** `tools/gate.py` (baseline + every check in one command), `tools/scenarios/`,
    `tools/worktree_setup.py` (claim, `uv sync`, `.src/` junctions to the main checkout), `preview.py --frame`, and
    `.agents/references/` (worker brief, spec skeleton, big-job ledger).
- Open elsewhere: `worktree-damage-calc` (the damage calc, built 2026-10-25 / 26, **not merged**: the user wants the
  mechanics confirmed first). See Open → Damage calc.
- **Hack families** (write a family's first guide with its siblings in mind; lift shared code when the second comes):
  3DS (done: `ctrguide.py`; next Meissa Moon, Navy Sapphire), pokeemerald-expansion (Emerald Imperium, SoulGold),
  CFRU (Radical Red, Unbound), NDS (Hardlove Gold built; Renegade Platinum, Blaze Black 2 Redux, HeartGold Retiled).
- **Shipping a guide update:** push `main`, wait for the Pages Action, then on the Thor long-press the guide → Update
  from link. Same library id, so saved state (tracker, ticks, calc) is kept.
- The other eight hacks in `hacks/` have sources compiled (`SOURCES.md`; complete `.src/` on the PC, checked
  2026-10-19) but no guide: Meissa Moon, Navy Sapphire (3DS), Renegade Platinum, Blaze Black 2 Redux, HeartGold
  Retiled (NDS), SoulGold, Radical Red, Unbound (GBA). See "Source data" below.

## Open, in order

1. **Test on the Thor.** Nothing since the consistency pass has been on the device (EI and HG were last checked there
   2026-10-19; Photonic Sun and Eternal X may not be in the library yet: add them from their Pages URLs). Include the
   text zoom fix: open Items, press A−/A+ without toggling, the collapse bars should follow.
2. **Damage calc** (branch `worktree-damage-calc`, `.claude/worktrees/damage-calc`; pushed to `origin` up to
   `457386a`, **not merged**: it waits for the user's mechanics check before `main`). Start every calc session from
   `plans/calc-open.md` (the open list, in order, plus the checks, the merge steps and the save-reader notes).
   - **Built** (all four guides with `cfg.calc`: EI, Hardlove, Photonic, Eternal X): `@smogon/calc` engine on each
     guide's own data with a per-hack profile and fixtures (hzla oracle matches for EI / Photonic / Eternal X;
     Hardlove provisional, source-checked only), the calc page (compact one-window UI at every viewer size), battle
     state (counters, toggles, pledges, crit stages, stat changes before the hit, Download / Sword / Shield), stackable
     field states and entry hazards, turn end, Z-moves and Totem auras (Photonic), HP moves (fixed damage, Taken,
     one-tap use, Dealt / You), Return / Frustration at 102, the import flow with a test reader. EI's last scope check
     (2026-10-26): Explosion halves Defense (EI's `B_EXPLOSION_DEFENSE` is Gen 4), Ruin abilities confirmed, no inverse
     battles and no Shadowy Veil in EI; every calc scenario reads each guide's own trainers / party and passes on all
     four guides, except `calc-layout` check 20 on EI (rows with an HP chip are taller: `plans/calc-open.md`). Lasting decisions:
     `template/README.md` → Damage calculator, `tools/calc/README.md`, each guide's notes.md → Damage calc.
   - **Session 2026-10-27 (auto-effects build, handover):** `plans/calc-auto-effects.md` built in units A1-A3 (engine:
     `DMG.hit / turn / berry / derived / intimidate / settings`, Disguise / Ice Face, contact and crash damage,
     Stockpile, crit inputs, Foul Play, EI scope gaps), B (trainer `field` decisions, all four guides 0 review), C / C2
     (page state model: scratch vs kept HP / status, FIGHT-class `broken` / `mega`, foe edits kept for the fight, Reset
     fight, migration), D1-D3 (Field layers + Auto, area conditions, Trick Room, Intimidate box, Orb, HP actions, berry
     chip, log overlay, Broken box, crash / Stockpile controls, crit toggles, row-height fix, Global group), E audit (all
     76 calc scenario jobs pass; domcompare vs `9b1fb22`: only `#/calc` differs on all four, normal and kb, 0 errors;
     gaps: no calc text-zoom check, Foul Play engine-only). Agent handovers in `.tmp/D1-D3/report.md` (not committed).
     Decisions made on the way are in the spec's last two sections.
   - **Now:** unit F1 (Sol) fixes the user's first Thor-preview test: preset cards built through the real data paths
     (items didn't show in Edit), Sitrus shown twice, used items visible as used and kept for the fight, HP −min / −max
     inside the move also apply the user's recoil / contact change, Intimidate a plain box (no text), Orb status not
     applied on entry, Gravity / Wonder Room / Magic Room into Global, Laser Focus / Lucky Chant missing on EI. Then the
     user tests again (previews below), then the **docs step**: fold the spec's decisions into `template/README.md` /
     `tools/calc/README.md` / notes (HP follow-ups as built; "not modelled": Gen 7 Rollout glitch, Floral Healing /
     Life Dew's ally share), CLAUDE.md → Making a new guide step 2 (settle `review` field records; `setterStays`), delete
     the spec and `plans/calc-auto-effects-mockup/`, cut `plans/calc-open.md` to calc-team, the mechanics check + merge,
     save readers / file picker (+ the "apply −HP from the closed row" UI item), update this section.
   - **Open after that:** decide `plans/calc-team.md`; the user's UI pass (hide unwanted EI-gap toggles, −HP from the
     closed row); the user's mechanics check, then the merge into `main`; save readers and the file picker.
   - **Phone previews (current):** `https://windows-pc.tail1846b8.ts.net/preview/` + `calc-auto-ei.html`,
     `calc-auto-hardlove.html`, `calc-auto-photonic.html`, `calc-auto-eternal.html` (each in the Thor frame with the
     preset panel). Older `calc-*` previews are superseded.
3. **Footer credits:** `cfg.credit` is the hook (template reads it, no guide sets it). Hack authors from `SOURCES.md`,
   Bulbapedia / Serebii where used (Photonic Sun, Eternal X), the sprite set's credits (`sprites/SOURCES.md`), hzla's
   calc as a reference once the calc exists. Agreed, not done.
4. **Skill:** the repo copy (`.agents/skills/rom-hack-offline-dex/`) is current; the claude.ai account skill Claude
   sessions load is the 2026-10-18 hand-build version. Re-upload the repo copy (zip with forward-slash paths).
5. **T3 worktree setup hook** (the user, in T3's project settings; sessions can't change them): a project script
   `python -I tools/worktree_setup.py`, icon Configure, run on worktree create. Until then run it by hand (CLAUDE.md → Git).
6. **Source updates found 2026-10-24** (`check_updates.py`): SoulGold's data files changed (Mega Lopunny innates,
   Clefable / Mega Clefable and Unown learnsets, ability usage): re-fetch before its guide. Emerald Imperium's was
   accepted 2026-10-26 on `worktree-damage-calc` (hzla's backup index: other hacks' titles and a variant list, EI's
   entry `imp13` EVs / no EVs; `imp_1-3.js` unchanged; the calc oracle pin ff6c3e3 differs from the new head only in
   a battle-log UI fix): no re-fetch, no fixture change.
7. **New-guide scaffold** (`tools/new_hack.py <hack> --like <built hack>`): build it during the first new guide, from
   what that session actually copies.

**Next guide:** say which hack; `CLAUDE.md` → Making a new guide is the whole procedure.

## Decisions

- Public repo, served by GitHub Pages (built by the Action from `dist/`, nothing built is committed). The app repo
  stays private.
- Guides stay single self-contained HTML files that work offline with or without the app. Shared sprites are not
  shipped with the app.
- One shared sprite set for every guide: pokeemerald-expansion (`sprites/`). A hack keeps its own art only for forms
  it adds. Sprites are cropped to their visible pixels and fill their box (the user likes the box fill; no relative
  size). No-sprite species show a type-coloured circle with the first letter.
- Raw docs are never committed; `SOURCES.md` says how to fetch them.
- For hacks with public source code, the code wins over the docs ("Sheet says ..."). 3DS hacks: the game data is the
  source, the docs are the check ("Doc says ...").
- Credits: the index page and each guide's footer credit the hack's authors and sources and the sprite set.

## Viewer sizes (the app's contract; copy of the app repo's table)

1 dp = 1 CSS px in the guide (viewport `width=device-width`). Text zoom (A−/A+, 50–200%) scales text, not the
viewport. The title bar takes 44 dp; the guide gets the rest.

| Case | Window (dp) | Guide viewport (CSS px) |
| --- | --- | --- |
| **Minimum window** (either screen) | 260 × 360 | **260 × 316** |
| Default first open, bottom screen | 480 × 436 | 480 × 392 |
| Maximised, bottom screen | 537 × 468 | 537 × 424 |
| Maximised, top screen | 832 × 468 | 832 × 424 |

- Bottom screen 1240×1080 px, top 1920×1080 px, both 369 dpi (density 2.30625).
- The user's everyday bottom-screen window is the minimum width, nearly full height: 260 × 394 dp, so a 260 × 350
  viewport is a realistic everyday size.

## Testing on the Thor

From the app repo's Build environment (adb is at `$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe`):
- Replace a guide in place: `adb push dist/<hack>.html /data/local/tmp/g.html`, then
  `adb shell "run-as app.dexviewer cp /data/local/tmp/g.html files/guides/<id>/index.html"` (Git Bash:
  `MSYS_NO_PATHCONV=1`), then reopen the viewer. Same id, so its saved state stays. Each guide's library id is in
  the app repo's PROGRESS.md (device details stay in that private repo). The library has no adb import: a new guide
  is added from its Pages URL (or a file in `/sdcard/Emulation/ROM Hacks and Mods/`) by hand.
- Inspect over CDP: `adb shell cat /proc/net/unix | grep webview_devtools`, `adb forward tcp:9333
  localabstract:webview_devtools_remote_<pid>`, then any CDP client (Node 24 has `fetch` and `WebSocket`). The
  viewer's WebView serves only the open guide; the user has to open another.
- Small windows without resizing: CDP `Emulation.setDeviceMetricsOverride` (260 × 316, deviceScaleFactor 2.30625,
  mobile), `Page.captureScreenshot`, then always `Emulation.clearDeviceMetricsOverride`. CDP screenshots hang while
  the screens are off (`input keyevent KEYCODE_WAKEUP` first).
- Screenshots of the real screens: `adb exec-out screencap -p -d <id> > file.png` (top `4630946441858561667`,
  bottom `4630946482288158084`; screens must be on).

## Environment

- `gh` CLI installed and authenticated. Commits use the GitHub no-reply email (repo-local `git config user.email`),
  not the user's Gmail.
- `python -I` ignores `PYTHONIOENCODING`, so call `sys.stdout.reconfigure(encoding='utf-8')` when printing ♂/é
  (`extractlib` does).
- The 3DS hacks need the user's vanilla Azahar romfs dumps (PC only): `tools/README.md` → 3DS game data.

## Source data (checked 2026-10-19)

Every hack's `.src/` on the PC opens cleanly and matches the counts in its `SOURCES.md`. The dex source per hack (the
extract step turns it into `data.json`):

| Hack | Dex source (stats, abilities, learnsets, evolutions) | Moves | Wild | Trainers |
| --- | --- | --- | --- | --- |
| Meissa Moon | `.src/dex.json` (game data) | same | same | `trainers.json` (natures, EVs) |
| Navy Sapphire | `.src/dex.json` (game data) | same | same, by method with rates | `trainers.json` |
| Renegade Platinum | `romhackdex/pokedex/` | `romhackdex/moves.json` | `WildPokemon.txt` (+ RomHackDex) | `TrainerPokemon.txt` |
| Blaze Black 2 Redux | `romhackdex/pokedex/` **but stats from `Pokemon Changes.txt`** (RomHackDex shows vanilla stats for 188 changed species) | `romhackdex/moves.json` | `Wild Area Changes.txt` | `Trainer Changes.txt` |
| HeartGold Retiled | `hg-engine/species-pinned.json` | `hg-engine/pinned/Moves.c` | `source/Encounters.c` + guide | `source/Trainers.c` + guide |
| SoulGold | `data/species.json` + `data/species-details/` | `data/moves.json` | `data/encounters.json` | `data/trainers.json` |
| Radical Red | `romhackdex/pokedex/` | `romhackdex/moves.json` | RomHackDex | the two sheets |
| Unbound | `romhackdex/pokedex/` | `romhackdex/moves.json` | RomHackDex | the three sheets |

Questions for those builds:
- **HG Retiled:** never hg-engine `main`. Retiled's repo only carries the tables it changes; species / moves come from
  the last upstream commit before its release (`dcbe17a`).
- **BB2R** has Complete and Classic versions (the doc has both ability sets): pick Complete like RomHackDex, or ask.
- Gen 7 wild tables have no method field (label them from the docs, as Photonic Sun does). Static and gift
  encounters of the 3DS games come from the game's `DllField.cro` (Eternal X's `locs.py`) or the docs.
