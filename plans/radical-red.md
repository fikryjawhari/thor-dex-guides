# Pokémon Radical Red guide: plan

Goal: play Radical Red 4.1 **Hardcore** on the Thor with one guide: dex, every trainer's Hardcore team at the right
cap, walkthrough in order, items, encounters, and the calc with save import. Second guide of the **CFRU family**
(Unbound first): reuse `tools/cfru.py` and the `cfru` calc base / save reader; lift anything both need into shared
code. Sources: `hacks/radical-red/SOURCES.md` (its table and inventory are the map). Started 2026-11-02 from main
`c658a13`.

## Decisions (taken by the main chat while the user is away; the user reviews them before the audit)

Each unit adds the decisions it had to take to **Decisions taken in units** below (one line each, with the source).

- **D1 Mode: Hardcore** (SOURCES.md target). Every card shows the Hardcore team; normal-mode teams are left out
  (they stay in `.src/` for later). The mode goes in the trainer wording (`cfg.txt`), as Unbound's "Expert".
- **D2 Source authority:** the official dex's `data.js` (extracted from the ROM) is the source for species, moves,
  abilities, items, areas, trainers and caps. The author's docs are the check ("Doc says ..." / "Sheet says ..."
  where they differ, listed in notes.md); the Hardcore Main tab is the authority for Hardcore rules. RR Showdown /
  RR calc for move flags and what changed abilities / items do, not for numbers. hzla `radredhc.js` is a third
  check for trainer teams.
- **D3 Trainers:** all 464 `data.js` trainers with their full Hardcore teams (nature, ability, item, moves, IVs, EVs),
  grouped by cap (`TR.caps` = the 18 Hardcore caps from `data.js`). Rival: one team per starter through `t.st`, like
  BB2R / Unbound. Boss levels as given (no scaling unless the sources say a team scales).
- **D4 Walkthrough:** no walkthrough doc exists. Order: the Hardcore sheet's Trainer Order tab for bosses, `data.js`
  area order and cap steps for everything else; stops per area, items and encounters at the step they unlock.
- **D5 EVs:** follow what the sources say for player EVs (the unit records it); Hardcore bosses have no EVs except
  Ghost Marowak (Hardcore Main tab). `cfg.mgm` false.
- **D6 Calc:** `cfg.calc.base` = `cfru`, Megas and Z-moves on; the Hardcore AI's permanent weather / terrain through
  the trainer field review (`setterStays`); RR's changed abilities / moves as `over` entries from RR calc
  `gen789.ts` and Showdown `gen9rr`; RR calc (`repos/damage-calc`) is the oracle for engine fixtures.
- **D7 Save import:** `cfg.calc.save` = `cfru` (the Unbound reader), with RR's ID tables (`GID` from `data.js`
  game IDs, checked against hzla's `radical_red_*_constants.js`). No save file: ships provisional; a real import is a
  PROGRESS.md Open check (the user's `.srm`).
- **D8 Species kept:** EI's / Unbound's prune rule (obtainable species and forms, species trainers use, Megas whose
  base is obtainable).
- **D9 Version 4.1**, storage prefix `rr` (`rrdex`, ...).
- **D10 Sprites:** the shared set; RR's own forms from `data.js` sprites into `sprites.json`.

## Decisions taken in units

(units append here: `- [unit] decision (source)`)

- [unit 2] Superseded: the main chat authorised one engine extension, `over.abilities[name].statusImmune` (Toxic Boost / Flare Boost chip; RR changes v3.1:46,49; Showdown gen9rr/abilities.ts:240,691); `cfg.calc` is enabled.
- [unit 2] EVs as Photonic Sun's EV-less play: `evs` stays on, player sets default to 0, trainer EVs count (Ghost Marowak 252 HP) (Hardcore Main!E95).
- [unit 2] `setterStays: true` for Hardcore's permanent AI weather / terrain; the player's setters follow the same switch (Main!E10; profile-level setting only).
- [unit 2] Draco Barrage turns Physical when boosted Atk > SpA (Showdown gen9rr/moves.ts:247-266, dex description) though RR calc keeps it Special; recoil 1/3 (Showdown), not RR calc's 33/100.
- [unit 2] Mega Stone records only for 4.1 Megas (`data.js` forms): Applite (Flapple, Appletun) added; Duraludite / Grimmsnite left out (4.1 changelog:14, no form in data.js).
- [unit 2] Engine gaps recorded, not built (main chat's answer 1): Speed modifiers (Quick Feet 2x, Flower Gift / Bull Rush / Upgrade / Leek Stick), Shield Dust hazard immunity, Soul Robbery theft, Defog keeping terrain (Main!E12), Bad Company self-drops.
- [unit 2] Move effects stay in `hack.json` `over.effects` until `data.json` exists (effects_check.mjs needs it for `calc_effects.json`); the finishing unit moves them.

## Units

Each unit: a Sol agent in its own worktree, branch off `worktree-radical-red` at the SHA given in its brief, commits
after every working sub-step (`WIP:` when incomplete), touches only its files and its own notes.md heading. The main
chat merges units into `worktree-radical-red` one at a time and rebuilds data.json there.

| Unit | Files | After | Status |
| --- | --- | --- | --- |
| 1 Dex | common.py (data.js reader, `sid` / `move` / `ability` / `item` lookups), dex.py, moves.py, prune.py, gid.py's ID-table half if cheap, sprites.json, notes Dex | scaffold | |
| 2 Calc mechanics | hack.json `cfg.calc`, tools/calc/radical-red_check.mjs, notes Damage calc | scaffold | |
| 3 Walk research | plans/radical-red-walk.md (order table only; no code) | scaffold | |
| 4 Locations | locs.py, notes Locations | 1 | |
| 5 Items | items.py, item_desc / battle_text / item_text_extra json, `P.hi`, itemstd RULES entry if needed, notes Items | 1 | |
| 6 Trainers + caps | trainers.py, trainer fields review, notes Trainers / Caps | 1 | |
| 7 Save IDs | gid.py, notes Save ID tables | 1 | |
| 8 Walkthrough | walk.py, notes Walkthrough | 3, 4, 5, 6 | |
| 9 Finish | cfg wording, check.py, calc scenarios / doubles count / fields counts, sprites check, report review | 8 | |
| Audit | the user's review of decisions first, then the full gate | 9 | |
