# Progress

Guides for Dex Viewer, split out of the app repo (`thor-offline-viewer`, private) on 2026-10-19; that repo's
`docs/PROGRESS.md` keeps the app's history. History here is in git, each hack's `notes.md` → History, and
`template/README.md` (design decisions). This file is the current state and what's left.

## Current status (2026-10-30)

- **Six guides on `main`**, one template, one extract layout (`tools/extractlib.py`), one data schema
  (`tools/schema.py`), one Items standard (`tools/itemstd.py`), one notes / SOURCES layout, and the damage calc with
  save import on every one: Emerald Imperium 1.3.1 (GBA), Hardlove Gold 0.8.5 (NDS), Photonic Sun 2.38 Rebalanced
  (3DS, EV-less), Eternal X 2.67 Rebalanced (3DS), Blaze Black 2 Redux 1.4.1 (NDS, Complete EVless / Challenge),
  Unbound 2.1.1.1 (GBA, Expert). Live on GitHub Pages (https://fikryjawhari.github.io/thor-dex-guides/), built by the
  Action from `main`.
- **`main` is ahead of `origin/main`, not pushed** (the user decides): BB2R fixes (cfg.txt placeholders, `assemble.py`
  stops on TODO / TBD / FIXME in a hack.json; Aspertia City has no tracker slot; curated Valuables) and the calc's
  move effects (every guaranteed move effect: status-move buttons, secondaries on Use, one resolver with a
  generation-aware blocker table, per-hack `calc_effects.json`; `template/README.md` and `tools/calc/README.md` → Move
  effects). Accuracy / evasion stages and volatiles (confusion and the like) are logged only, not stored.
  Then calc resets and page states (2026-10-31, merged from `worktree-calc-resets`): card ↺ resets that Pokémon's
  battle state; entry hazards are a card chip offered on a switch-in, never automatic (Field's Apply hazards gone);
  double tap on a calc Pokémon opens its dex page; rail tabs keep their own page and place; pages open collapsed
  (Locations places open) with targeted Expand / Collapse bars, a walkthrough Show switch (Stops / Sections / All) and
  Reset all; Pokémon sprites and tracker tags link to the dex page. Decisions in `template/README.md` and
  `tools/calc/README.md`. Not yet on the Thor (Open 1).
- **Dex page built** on `worktree-dex-page` (2026-10-31, not merged): collapsible sections (one open state, `LS.dex`
  `o`), name bar, ‹ › through the list as it stands, forms menu, kept place on switching, family evolution, compact
  moves, vertical stat calc; `template/README.md` → Pokémon page. Checked: `tools/scenarios/dex-page.mjs` on all six
  guides, domcompare against `main` (only the Pokémon pages differ, normal and dvkb), `gate.py check --template`
  (only the expected Pokémon-page DOM diffs). Waiting on the user: point 12 (Use in calc ▸ in the top card) on the
  preview, then the Thor. Merge next; after it delete `plans/dex-page.md` and `tools/mockup/dex-page/`.
- Where things are decided: `template/README.md` (template, UI, calc page), `tools/calc/README.md` (engine),
  `template/calc/readers/README.md` (save readers), each hack's `notes.md` (data, Damage calc, In-game tests / checks).
- **Hack families** (write a family's first guide with its siblings in mind; lift shared code when the second comes):
  3DS (`tools/ctrguide.py`; next Meissa Moon, Navy Sapphire), pokeemerald-expansion (Emerald Imperium; SoulGold),
  CFRU (Unbound, `tools/cfru.py`; Radical Red), NDS (Hardlove Gold; Blaze Black 2 Redux with the Drayano family's
  `tools/drayano.py` / `tools/romhackdex.py`; Renegade Platinum reuses them; HeartGold Retiled).
- **Shipping a guide update:** push `main`, wait for the Pages Action, then on the Thor long-press the guide → Update
  from link. Same library id, so saved state (tracker, ticks, calc) is kept.
- **Next guide:** say which hack; `CLAUDE.md` → Making a new guide is the whole procedure.

## Open

1. **Thor / in-game tests** (the user, per guide). Nothing since the consistency pass has been on the device; BB2R
   and Unbound may not be in the library yet (add them from their Pages URLs). On the Thor: the text zoom fix (Items,
   A−/A+, the collapse bars follow), the collapsed pages and Show switch, the hazard chip, rail-tab memory, and the calc in the offline viewer with the save bridge (the app repo
   `../thor-offline-viewer`: `docs/_plans/save-file-picker.md` → Left to do; if `docs/SAVE_BRIDGE.md` changes, update
   `template/calc.js` (import block) and `tools/scenarios/calc-bridge.mjs`). In game: each guide's notes.md → In-game
   tests (BB2R: In-game checks: trainer levels vs hzla, TM57, Giga Impact's TM, Triple Axel, Psyshield Bash; Unbound:
   Focus Belt / Nine Lives as Sturdy, Camomons with two moves of one type, Shelter Def +1 Spe +1; Photonic Sun: no EVs
   gained on the EV-less copy, a Totem still hard, Toxic Thread −2 each; Hardlove: Thief / Covet steal nothing, Growth
   SpA only, Rapid Spin no Speed, so its calc stays provisional until then). Calc page: is the `+2 −1` label style
   (Shell Smash) clear on the device?
2. **Real save tests.** Hardlove: the user plays on and reports what imports wrong (a 0.8.x save, mints, regional
   forms). One real import per guide on the Thor (EI RetroArch `.srm`, Hardlove DraStic `.dsv`, Photonic Sun / Eternal
   X Azahar `main`, BB2R melonDS / DraStic `.sav`, Unbound RetroArch `.srm`), compared with PKHeX on the PC; keep each
   in `hacks/<hack>/.src/saves/` with an expected.json (`.agents/references/calc-save-reader.md`).
3. **Footer credits:** `cfg.credit` is the hook (template reads it, no guide sets it). Hack authors from `SOURCES.md`,
   Bulbapedia / Serebii where used, the sprite set's credits (`sprites/SOURCES.md`), hzla's calc
   (Dynamic-Calc-Decomps, the oracle and save-reader reference). Agreed, not done.
4. **Skill re-upload:** the repo copy (`.agents/skills/rom-hack-offline-dex/`) is current; the claude.ai account skill
   is the 2026-10-18 hand-build version. Re-upload the repo copy (zip with forward-slash paths).
5. **T3 worktree setup hook** (the user, in T3's project settings; sessions can't change them): a project script
   `python -I tools/worktree_setup.py`, icon Configure, run on worktree create. Until then run it by hand (CLAUDE.md → Git).
6. **Source updates** (`uv run python -I tools/check_updates.py`): SoulGold's data files changed since 2026-10-24
   (Mega Lopunny innates, Clefable / Mega Clefable and Unown learnsets, ability usage): re-fetch before its guide.
   hzla's live `decomp` branch differs from Unbound's pin in `gen789.js` (pin kept).
7. **Pokémon page redesign**: built on `worktree-dex-page`; the user's preview check (Use in calc ▸ placement, spec
   point 12) and a Thor test before the merge.

## Decisions

- **3DS hacks are played EV-less** (2026-10-29, the user): `tools/ctr_evless.py` makes a copy of the mod (the
  original is kept, for normal EVs) where no species grants EVs and no trainer Pokémon has EVs; static fights (USUM
  Totems and their allies) keep theirs. A 3DS guide follows the copy: trainer data dumped from it, `cfg.mgm` false.
  Done: Photonic Sun (guide + copy), Eternal X (copy only: Gen 6 trainers have no EVs, so the guide is unchanged).
  New 3DS guides: make the copy (each SOURCES.md → EV-less copy) and dump trainers from it.
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

Every hack's `.src/` on the PC opens cleanly and matches the counts in its `SOURCES.md`. The six hacks with no guide
yet, and the dex source each extract will turn into `data.json`:

| Hack | Dex source (stats, abilities, learnsets, evolutions) | Moves | Wild | Trainers |
| --- | --- | --- | --- | --- |
| Meissa Moon | `.src/dex.json` (game data) | same | same | `trainers.json` (natures, EVs) |
| Navy Sapphire | `.src/dex.json` (game data) | same | same, by method with rates | `trainers.json` |
| Renegade Platinum | `romhackdex/pokedex/` | `romhackdex/moves.json` | `WildPokemon.txt` (+ RomHackDex) | `TrainerPokemon.txt` |
| HeartGold Retiled | `hg-engine/species-pinned.json` | `hg-engine/pinned/Moves.c` | `source/Encounters.c` + guide | `source/Trainers.c` + guide |
| SoulGold | `data/species.json` + `data/species-details/` | `data/moves.json` | `data/encounters.json` | `data/trainers.json` |
| Radical Red | `romhackdex/pokedex/` | `romhackdex/moves.json` | RomHackDex | the two sheets |

Questions for those builds:
- **HG Retiled:** never hg-engine `main`. Retiled's repo only carries the tables it changes; species / moves come from
  the last upstream commit before its release (`dcbe17a`).
- Gen 7 wild tables have no method field (label them from the docs, as Photonic Sun does). Static and gift
  encounters of the 3DS games come from the game's `DllField.cro` (Eternal X's `locs.py`) or the docs.
- Renegade Platinum: the Drayano family code (`tools/drayano.py`, `tools/romhackdex.py`) was written for it to reuse.
