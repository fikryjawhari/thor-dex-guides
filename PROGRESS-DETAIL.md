# Progress: detail

The sections behind PROGRESS.md. Read only the section a PROGRESS.md line points to (grep the heading, then read
that section), not the whole file.

## Recent merges

- **Merged 2026-11-02 from `worktree-radical-red`:** the Radical Red guide (units 1-11; decisions in
  `hacks/radical-red/notes.md`), and the fixes from its audit, so every check now passes with no standing exceptions:
  EI pickup keys stay put across item spellings (`tools/pickup_keys.py`; Empoleonite D / O keep p246 / p247), EI's
  Striker reads the `kick` flag (hzla EI 142 + 12, 0 mismatch), RR's item text in the shared pool (EI Link Cable,
  five Unbound items), reproducible item icons (`sprites/items/retained.json`; `worktree_setup.py` links the cache),
  jumpcheck finds item rows by `data-ri` and exits 1 on a bad jump, domcompare visits every item and move-property
  page, shared scenario fixtures fit every guide's data (hittable foes, aura toggles only where the ability exists,
  the real starter area). Audit round 2: 259 / 259 scenarios (one load flake passed alone), domcompare, jump / page /
  walk / zoom / consistency checks 14 / 14 each, saved state 7 / 7.
- **Merged 2026-11-02 from `worktree-move-pages`** (none of it on the Thor yet: Open 1):
  - Move and ability pages; shared move properties / targets / effect odds and ability-item rules
    (`tools/moveprops.py`, `MV.f` / `tg` / `se`, `MI`, per-hack `extract/move_rules.json`).
  - Calc fight state: moves that change a type, ability or item do it for the fight (Worry Seed, Trick, Soak ...),
    effect odds and KO chance on move rows, the new calc layout. `template/README.md`, `tools/calc/README.md`.
  - Item pages (`#/i/<item>`), links from every place that names an item, the Items tab as one card per item in boxes
    by kind, pickup ticks shared with the walkthrough (`LS.items.g`, stable keys `extract/pickup_keys.json`), the move
    page's In battle box / Also TM / Where card, the Pokémon page's Held items (wild odds). `template/README.md` →
    Item page, Items tab.
  - Item data: bag text per guide (`extract/item_desc.json`, pooled across guides by `tools/item_text.py`, gaps in
    `extract/item_text_extra.json`), hand-written In battle text (`tools/battle_text/`, per-hack
    `extract/battle_text.json`), wild held-item odds (`P.hi`), one spelling per item, one line per pickup labelled
    Found / Also / Shop, item icons (`sprites/items/`, per-guide sheets by `tools/item_sheets.py`).
  - Hardlove 0.8.6 and 0.8.7, Heartfelt Gold v1.0.0 sources (formerly HeartGold Retiled; no guide yet).

## Hack families

Write a family's first guide with its siblings in mind; lift shared code when the second comes.
3DS (`tools/ctrguide.py`; next Meissa Moon, Navy Sapphire), pokeemerald-expansion (Emerald Imperium; SoulGold), CFRU (Unbound, `tools/cfru.py`; Radical Red), NDS (Hardlove Gold; Blaze Black 2 Redux with the Drayano family's `tools/drayano.py` / `tools/romhackdex.py`; Renegade Platinum reuses them; Heartfelt Gold, formerly HeartGold Retiled, is hg-engine like Hardlove).

## Decided while the user was away (2026-11-01 / 02; reverse any)

- Battle text: ≤ 230 characters, main effect + numbers + 1-2 interactions (the user picked this). Gen 4 variants in
  `tools/battle_text/` match no guide (Hardlove runs Gen 9 mechanics); left in, unused.
- Item names: when a guide spells an item two ways, the spelled-out form wins (Silver Powder, Thunder Stone,
  Empoleonite D), then the Items tab's spelling; rows renamed onto one item join.
- Item text: Mega Stones with no text get the games' standard sentence; Unbound's Dream Mist = "gives a Pokémon its
  Hidden Ability" and Max Powder = "gives a Pokémon the Gigantamax Factor" (guesses from where they're sold: check in
  game); Pokégear Upgrade 1 = the Radio Card.
- Pickups: one line per pickup (walkthrough rows match the Items line at the same place); Found = in the world,
  Also = given / reward / raid drop, Shop = bought; Key Items, TMs / HMs (not Hardlove's single-use TMs), Mega Stones
  and Z-Crystals get a tick on Shop lines too; a TM Found line that only restates its shop goes. Disputed pairs
  settled from the Unbound wiki and Bulbapedia (each hack's notes.md → Items).
- Item page: "changed" is a small accent word after the description. Held by and the Pokémon page's Held items list
  only base forms and forms with their own wild encounters (no Castform Sunny, Shaymin Sky, evolve-only regional
  forms). The Pokémon page shows wild items only (the user: trainer counts belong on the item page).
- Items tab: tutors are cards per tutor (the user liked it); without groups the box counts tutors by place; no tick
  bar on search results.

## Open

1. **Thor / in-game tests** (the user, per guide). Nothing since the consistency pass has been on the device: the item
   pages, Items tab and ticks, move / ability pages, the calc fight state, the Pokémon page, the text zoom fix, the
   collapsed pages and Show switch, the hazard chip, rail-tab memory, and the calc in the offline viewer with the save
   bridge (the app repo `../thor-offline-viewer`: `docs/_plans/save-file-picker.md` → Left to do; if
   `docs/SAVE_BRIDGE.md` changes, update `template/calc.js` (import block) and `tools/scenarios/calc-bridge.mjs`).
   BB2R and Unbound may not be in the library yet (add them from their Pages URLs). In game: each guide's notes.md →
   In-game tests (BB2R: trainer levels vs hzla, TM57, Giga Impact's TM, Triple Axel, Psyshield Bash; Unbound: Focus
   Belt / Nine Lives as Sturdy, Camomons with two moves of one type, Shelter Def +1 Spe +1, Dream Mist, Max Powder;
   Photonic Sun: no EVs gained on the EV-less copy, a Totem still hard, Toxic Thread −2 each; Hardlove: Thief / Covet
   steal nothing, Growth SpA only, Rapid Spin no Speed, Pokégear Upgrade 1, so its calc stays provisional until
   then). Calc page: is the `+2 −1` label style (Shell Smash) clear on the device?
2. **Real save tests.** Hardlove: the user plays on and reports what imports wrong (a 0.8.x save, mints, regional
   forms). One real import per guide on the Thor (EI RetroArch `.srm`, Hardlove DraStic `.dsv`, Photonic Sun / Eternal
   X Azahar `main`, BB2R melonDS / DraStic `.sav`, Unbound RetroArch `.srm`), compared with PKHeX on the PC; keep each
   in `hacks/<hack>/.src/saves/` with an expected.json (`.agents/references/calc-save-reader.md`).
3. **Footer credits:** `cfg.credit` is the hook (template reads it, no guide sets it). Hack authors from `SOURCES.md`,
   Bulbapedia / Serebii where used, the sprite set's credits (`sprites/SOURCES.md`), hzla's calc
   (Dynamic-Calc-Decomps, the oracle and save-reader reference). Agreed, not done.
4. **Skill re-upload:** the repo copy (`.agents/skills/rom-hack-offline-dex/`) is the one to upload, once its
   references cover the item pages (5); the claude.ai account skill is the 2026-10-18 hand-build version.
5. **New-guide scaffold for the item data:** `tools/new_hack.py` stubs and the skill's references don't know
   `extract/item_desc.json`, `item_text_extra.json`, `battle_text.json`, the generation entry in
   `tools/item_text.py`, or `P.hi` odds yet (CLAUDE.md → Making a new guide lists them).
6. **T3 worktree setup hook** (the user, in T3's project settings; sessions can't change them): a project script
   `python -I tools/worktree_setup.py`, icon Configure, run on worktree create. Until then run it by hand (CLAUDE.md → Git).
7. **Source updates** (`uv run python -I tools/check_updates.py`; last full pass 2026-11-01, Hardlove 0.8.7 on
   2026-11-02): SoulGold's data files changed since 2026-10-24 (Mega Lopunny innates, Clefable / Mega Clefable and
   Unown learnsets, ability usage): re-fetch before its guide. hzla's live `decomp` branch differs from Unbound's pin
   in `gen789.js` (an Electromorphosis fix; pin kept).
8. **Small data leftovers:** item icons missing (no pinned art): Unbound 19 (key items, Costume Box), Radical Red
   17, Hardlove 1 (Pokégear Upgrade 1), BB2R 1; tutor cards are
   parsed from each row's " · " text (structured tutor fields from the extracts would be sturdier); a `nomerge` flag
   in the data instead of the template inferring it; an unused `.phi .sh` rule in dex.css.

9. **Radical Red follow-ups:** the in-game checks in `hacks/radical-red/notes.md` (Damage calc, Save import, the
   Walkthrough's open order questions); one real `.srm` import compared with PKHeX; Gulp Missile's change not
   modelled; Chillet has no sprite (type-coloured circle).

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
| Heartfelt Gold | `hg-engine/species-retiled.json` | `source/data/Moves.c` | `source/data/Encounters.c` + guide | `source/data/Trainers.c` + guide |
| SoulGold | `data/species.json` + `data/species-details/` | `data/moves.json` | `data/encounters.json` | `data/trainers.json` |
| Radical Red | `repos/Radical-Red-Pokedex/data.js` (official dex) | same + Showdown flags | same | `data.js` hardcore teams + `trainers-hardcore.xlsx` |

Questions for those builds:
- **Heartfelt Gold** (HeartGold Retiled renamed at v1.0.0, 2026-10-31; source pass 2026-11-01): the repo now carries its
  own `Species.c` / learnsets / `Moves.c`, which win; upstream hg-engine only for ability text, at `61b510c` (never a
  later `main`). Its Walkthrough and Item-Locations guides are still the Retiled-era ones (the author says they need an
  audit), so walkthrough order and item locations need another source. `hacks/heartfelt-gold/SOURCES.md`.
- Gen 7 wild tables have no method field (label them from the docs, as Photonic Sun does). Static and gift
  encounters of the 3DS games come from the game's `DllField.cro` (Eternal X's `locs.py`) or the docs.
- Renegade Platinum: the Drayano family code (`tools/drayano.py`, `tools/romhackdex.py`) was written for it to reuse.
