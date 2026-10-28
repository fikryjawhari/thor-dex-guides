# Damage calc: open work

What's left before the damage calc merges, in order (2026-10-27, after the auto-effects and retest builds). Branch
`worktree-damage-calc` (`.claude/worktrees/damage-calc`), not merged into `main`. What is built:
`template/README.md` → Damage calculator (page), `tools/calc/README.md` (engine contract, Not modelled, licences,
oracles), each calc guide's notes.md → Damage calc (profile, fixtures, In-game tests). Every calc session: claim the
worktree, one template / engine session at a time, commit per sub-step, run Checks (below), ask before pushing.

## The list, in order

1. **calc-team: built 2026-10-28** (`template/README.md` → Both teams in the first frame; review points in PROGRESS.md).
2. **Save readers and the file picker** (below): built on `worktree-damage-calc-saves`, merged here 2026-10-28
   (`506c25c`). Left: the app repo's Thor test and real saves (PROGRESS.md → Damage calc → Open after the build).
   Done before the merge: "a calc is useless if I have to import Pokémon by hand" (the user).
3. **The user's mechanics check**: each guide's notes.md → Damage calc → In-game tests. They stay open and merge
   into `main` with the branch; Hardlove stays provisional until then (no independent oracle). Rule: the source
   wins over the docs.
4. **The merge into `main`** (below), then footer credits (PROGRESS.md → Open).

Small, take with a nearby job:
- Hardlove Easy mode (enemy trainer levels − (1 + floor(lv / 25))): not doing (user, 2026-10-26).

## Merging into main

When the user trusts the mechanics (their call). Opus main chat: merge `main` into the branch, rebuild, audit (Haiku
medium: `python assemble.py`, `uv run python -I tools/gate.py check <hack>` for every guide, `node tools/domcompare.mjs`
against main's build with `--routes '#/calc'` and `--kb`, `tools/scenarios/calc-*.mjs`, `node
tools/calc_save_check.mjs`), every calc guide in the Thor frame on the phone preview, the user approves, merge into
`main` (CLAUDE.md → Merge order), ask before pushing, delete the worktree and branch locally and on `origin`. Delete
the plans that are done then.

## Checks (every session that changes calc data or code)

`npm test --prefix tools/calc` (engine, stock parity, every `calc_states.json`), `node tools/calc/hzla_compare.mjs
<hack>` for EI / Photonic / Eternal X (counts unchanged: EI 142 + 12 known, Photonic 118 + 28, Eternal X 116 + 3),
`python assemble.py`, the calc scenarios (`uv run python -I tools/gate.py scenarios --only <calc-...> --jobs 8`;
the full set once at the end: CLAUDE.md → Commands), the build in the Thor frame on the
phone preview when the page changed: with the live presets, `python -I tools/mockup/thor-frame/build.py
dist/<hack>.html .tmp/<name>.html --panel tools/mockup/thor-frame/calc-presets.html`, then `python -I tools/preview.py
.tmp/<name>.html <name>.html` (`preview.py --frame` has no panel).

## Save readers and the file picker

Order: Gen 3 + Emerald Imperium's ID tables (**done 2026-10-28**: `readers/expansion.js`, tested against hzla's EI 1.3
save, not the user's: they had none), the viewer's file picker (app repo), Gen 6/7 (Photonic Sun, then Eternal X:
**Photonic Sun and Eternal X done 2026-10-28**, `gen67.js` + shared `ctrguide.build_save_ids` after finalise/prune;
PKHeX USUM oracle matches all 38 Pokémon for Photonic Sun; Eternal X's own XY oracle matches all 85 Pokémon
through the file picker, with Eternal X growth rates/names and form/cosmetic aliases. SM / ORAS are verified
layouts but wrong-game controls for both guides; XY is wrong for Photonic, USUM wrong for Eternal X.
No retained species/move/ability is unmapped. Eternal X excludes four already-pruned forms; its notes record them.
Blank USUM / SM / XY / ORAS oracle saves and the local recipe
are in readers/README.md; no GPL-linked code is committed), Gen 4 (Hardlove Gold: waits for the
user's save, no hg-engine save is public); Gen 5 waits for the Blaze Black 2 Redux guide. Public test saves
(2026-10-27): hzla/Dynamic-Calc-Decomps `cypress/fixtures/saves/` (EI 1.3 + an mGBA state + a paste of it, Renegade
Platinum, Heart & Soul); none for hg-engine or the 3DS. From then
on every new guide's extract writes its ID tables (add it to CLAUDE.md → Making a new guide and the skill then).
Procedure: `.agents/references/calc-save-reader.md`. Each needs a save in `hacks/<hack>/.src/saves/` plus its
`.expected.json` (the user's, or a public / PKHeX-made one when they have none; `tools/calc_paste_expected.py` turns an
hzla paste into one). Licences: `tools/calc/README.md` → Licences.

**Interface** (built with the `test` reader, `template/calc/readers/test.js`): `READERS[family] = (bytes, D) => {game,
party [mon], boxes [[mon]]}`, or throw `{code: 'wrong' | 'state' | 'unreadable' | 'empty', game?}` (the four banners:
Wrong game, Save state, Unreadable, No Pokémon yet). mon: `{pid, sp, lv, nat (0-24), ab or abs (ability id, or slot
0/1/2), it, mv [4], iv [6], ev [6]}` in game IDs; the template maps them through `data.json` → `GID {sp, mv, ab, it}`
(game id → our species id / `M` index / `AB` index / item name, written by the hack's extract). The profile's `save`
picks the family; without it Import is hidden. Done-check: `tools/calc_save_check.mjs <guide> <save> <expected.json>`.

| Family | Hacks | Format |
| --- | --- | --- |
| Gen 3 (pokeemerald / pokefirered) | Emerald Imperium, SoulGold | 14 sections in two slots (newest by save index); each Pokémon's 4 blocks ordered by personality value and XOR-encrypted with it. Expansion hacks change the struct (bigger species / move / ability IDs, hidden ability bit) per hack. |
| CFRU | Radical Red, Unbound | Gen 3 layout with CFRU's changes (expanded IDs, extra blocks). |
| Gen 4 (Pt / HGSS) | Hardlove Gold, HeartGold Retiled, Renegade Platinum | Two slots, newest by a save counter; blocks shuffled by PV and encrypted with the LCRNG (0x41C64E6D / 0x6073) seeded by the checksum; party stats stored separately (encrypted with the PV). |
| Gen 5 (BW2) | Blaze Black 2 Redux | Gen 4's Pokémon encryption; other block offsets and checksum table. |
| Gen 6/7 (XY / ORAS / SM / USUM) | Photonic Sun and Eternal X done; Meissa Moon, Navy Sapphire later | `readers/gen67.js`: 232-byte stored / 260-byte party PK6/PK7, encryption-constant shuffle and LCRNG, footer/block CRCs and per-Pokémon checksums. Main sizes XY 0x65600, ORAS 0x76000, SM 0x6BE00, USUM 0x6CC00; party at 0x14200 (XY/ORAS), 0x1400 (SM), 0x1600 (USUM). A Gen 7 guide accepts USUM, a Gen 6 guide XY. PKHeX oracle: 38 USUM / 85 XY Pokémon through each guide's picker. Format/coverage: readers/README.md. |

The hard part is per hack: **the ID tables**. Our data has no game IDs, so each extract writes `GID` from its own sources
(expansion constants, CFRU tables, the NDS NARCs, the 3DS game files). Forms are the tricky part (each family stores
them its own way). References (read only): hzla/Dynamic-Calc-Decomps `js/savereaders/` (Gen 3 incl. EI constants, Gen
4/5, Gen 6 / 7; sample saves in `cypress/fixtures/saves/`), PKHeX (check a reader by opening the same save there).

**File picker**: built in the app (`../thor-offline-viewer`, 2026-10-27; contract `docs/SAVE_BRIDGE.md`,
`window.dexViewerApp`), **not yet run on the Thor**. Guide side built 2026-10-28 (`template/README.md` → Import;
`tools/scenarios/calc-bridge.mjs` against a fake bridge, every calc guide). Left: the app's on-device tests
(its `docs/_plans/save-file-picker.md`), then one real import per emulator on the Thor (RetroArch `.srm`, DraStic
`.dsv`, Azahar `main`); if the contract changes there, update `calc.js` and the scenario.

Not doing: reading the game's memory while it runs (only an emulator can), writing to saves.
