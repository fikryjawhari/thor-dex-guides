# Damage calc: open work

Everything not built yet, in one place (2026-10-26, after the docs reconcile). Branch `worktree-damage-calc`
(`.claude/worktrees/damage-calc`), not merged into `main`. What is built: `template/README.md` → Damage calculator
(page), `tools/calc/README.md` (engine contract, licences, oracles), each calc guide's notes.md → Damage calc (profile,
fixtures, In-game tests). Every calc session: claim the worktree, one template / engine session at a time, commit per
sub-step, run Checks (below), ask before pushing.

## The list, in order

1. **Build `plans/calc-auto-effects.md`** (spec settled 2026-10-26; mockup `plans/calc-auto-effects-mockup/`): fight
   state as scratch, automatic weather / terrain / Intimidate / Orb / berries / Sash, area conditions from trainer
   `field` evidence, HP − actions with the log overlay, Reset fight, Trick Room. Units A-E in the spec.
2. **HP-move follow-ups** (below): settled by the user, not built. Engine + page, so not alongside unit A / D of 1:
   in the same build sequence or right after it.
3. **Decide `plans/calc-team.md`** (drag-and-drop team row): its own decide session, mockup in the Thor frame first.
4. **Scenario harness gap**: `calc-controls`, `-import`, `-layout`, `-persist`, `-smoke` hard-code EI trainers and
   `calc-entry` / `calc-field` pick party slot 5, so they fail on Photonic / Eternal / Hardlove under `gate.py check
   --template` (same on the pre-calc baseline; the gate reads 88/117 because of them plus the intended `#/calc`
   DOM change). Make them read the guide's own trainers / party.
5. **The user's mechanics check**, then merge into `main` (below). In-game tests: each guide's notes.md → Damage calc
   → In-game tests. Hardlove stays provisional until then (no independent oracle).
6. After the merge: **save readers and the file picker** (below), then footer credits (PROGRESS.md → Open).

Smaller, take with a nearby job:
- Crit inputs not built: Laser Focus, Lucky Chant, Dragon Cheer (proposed keys `atkLaserFocus` / `atkLuckyChant` /
  `atkDragonCheer` and `def*`; not approved). Hardlove's area +1 crit comes with auto-effects (`atkCritBonus`).
- Photonic `hack.json` still has the always-crit rule for Self-Destruct / Explosion, now redundant with `MV.cr` 6:
  harmless, drop it at the next Photonic calc change.
- Code comments that cite deleted plans (`template/calc.js` HP moves, `tools/calc/src/adapter.js` fixed damage and
  `DMG.hp`, `hacks/hardlove-gold/extract/dex.py` crit stages): point them at the READMEs at the next touch.
- Hardlove Easy mode (enemy trainer levels − (1 + floor(lv / 25))): a possible calc option, not asked for.
- Known engine limits, not planned: a later hit of Foul Play doesn't read the target's new Attack; the Gen 7 Rollout
  storage glitch; Floral Healing / Heal Pulse and Life Dew's ally share (no ally modelled).

## HP-move follow-ups (settled by the user 2026-10-26)

1. **Disguise / Ice Face**: the first hit is absorbed (Disguise: Mimikyu undisguised; Ice Face: physical hits on
   Eiscue Ice Face). Stock doesn't model them, so multi-hit totals, KO text and the one-use tap count hit 1 at full
   damage. Build: hit 1 does 0 while the form is intact (Gen 8+ Disguise also costs 1/8 max HP), later hits full; an
   "already broken" state on the card (the ability checkbox pattern, like Disguised for Illusion). Check each hack's
   source (EI expansion, Hardlove hg-engine, Gen 7 for Photonic; Eternal X, Gen 6, has neither). Auto-effects' HP −
   action turns the box off when it busts.
2. **Rocky Helmet / Rough Skin / Iron Barbs**: contact damage to the attacker (Helmet 1/6, the abilities 1/8, 1/16 in
   Gen 4, of the attacker's max HP, per contact hit; Magic Guard none). Add to `DMG.hp` for contact moves, per hit
   (multi-hit, Parental Bond), so the one-use tap includes it.
3. **Crash damage on a miss** (Jump Kick, High Jump Kick, Axe Kick, Supercell Slam): a separate `−HP` amount like the
   recoil one, labelled as the miss; tapping it does no damage to the target, only the crash to the user (Gen 5+ half
   max HP; Gen 4 the damage-based rule: check Hardlove's source; Magic Guard none).
4. **Swallow / Spit Up**: a Stockpile count (1-3) in the opened row's details: Swallow heals 1/4, 1/2, full; Spit Up
   power 100 × count. Now Swallow assumes one Stockpile and Spit Up shows — until a power is typed.

## Merging into main

When the user trusts the mechanics (their call). Opus main chat: merge `main` into the branch, rebuild, audit (Haiku
medium: `python assemble.py`, `uv run python -I tools/gate.py check <hack>` for every guide, `node tools/domcompare.mjs`
against main's build with `--routes '#/calc'` and `--kb`, `tools/scenarios/calc-*.mjs`, `node
tools/calc_save_check.mjs`), every calc guide in the Thor frame on the phone preview, the user approves, merge into
`main` (CLAUDE.md → Merge order), ask before pushing, delete the worktree and branch locally and on `origin`. Delete
the plans that are done then.

## Checks (every session that changes calc data or code)

`npm test --prefix tools/calc` (engine, stock parity, every `calc_states.json`), `node tools/calc/hzla_compare.mjs
<hack>` for EI / Photonic / Eternal X (counts unchanged: EI 123 + 9 known, Photonic 118 + 28, Eternal X 116 + 3),
`python assemble.py`, the calc scenarios for the guide (one browser sweep at a time), the build in the Thor frame on the
phone preview (`python -I tools/preview.py dist/<hack>.html <name>.html --frame`, live presets:
`--panel tools/mockup/thor-frame/calc-presets.html`) when the page changed.

## Save readers and the file picker

Order: Gen 3 + Emerald Imperium's ID tables (tested against the user's save), the viewer's file picker (app repo),
Gen 4 (Hardlove Gold), Gen 6/7 (Photonic Sun, then Eternal X); Gen 5 waits for the Blaze Black 2 Redux guide. From then
on every new guide's extract writes its ID tables (add it to CLAUDE.md → Making a new guide and the skill then).
Procedure: `.agents/references/calc-save-reader.md`. Each needs the user's save in `hacks/<hack>/.src/saves/` plus its
`.expected.json`: ask for it first. Licences: `tools/calc/README.md` → Licences.

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
| Gen 6/7 (XY / ORAS / SM / USUM) | Photonic Sun, Eternal X, Meissa Moon, Navy Sapphire | 232-byte PK6 / PK7, same shuffle and LCRNG. Azahar keeps the save unencrypted, known by size (XY 0x65600, ORAS 0x76000, SM 0x6BE00, USUM 0x6CC00) and a `BEEF` footer; party at 0x14200 (XY / ORAS), 0x1400 (SM), 0x1600 (USUM). |

The hard part is per hack: **the ID tables**. Our data has no game IDs, so each extract writes `GID` from its own sources
(expansion constants, CFRU tables, the NDS NARCs, the 3DS game files). Forms are the tricky part (each family stores
them its own way). References (read only): hzla/Dynamic-Calc-Decomps `js/savereaders/` (Gen 3 incl. EI constants, Gen
4/5, Gen 6 / 7; sample saves in `cypress/fixtures/saves/`), PKHeX (check a reader by opening the same save there).

**File picker** (app repo `../thor-dex-viewer`, after the Gen 3 reader works with a dropped file): Android WebView
ignores `<input type=file>` unless the app handles `onShowFileChooser` (Android's document picker, remembering the last
folder; check first whether the viewer already does). Later: "reload from the same file" in one tap (persistent URI
permission). Outside the viewer the file input already works in any browser.

Not doing: reading the game's memory while it runs (only an emulator can), writing to saves.
