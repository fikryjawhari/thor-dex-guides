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

- [unit 1] Preserve all 1,343 game species/form IDs until D8 pruning; distinguish numeric cosmetic mirror forms, expose egg groups through dex.egg_groups, and log source species changes rather than adding unsupported P fields or a prohibited changes card (data.js, tools/schema.py, shared UI rule).
- [unit 1] Exclude unused Placeholder and generated Z/Max move records; normalise CFRU names, keep Struggle typeless, and preserve hidden/primary/secondary source ability order (data.js, official dex src/displayMethods.js).
- [unit 1] Allow disabled calc in item_text.generation and register Radical Red's item-text generation as 9; cfg remains untouched (scaffold cfg.calc=false, RR 4.1 Gen 9 additions).
- [unit 1] Use official dex secondary chances over Showdown, label freeze effects frostbite, and derive only Metal Bash's contact/target metadata from its in-game description; normalise Inferno Parade to Infernal Parade (data.js, gen9rr/moves.ts, v4.0 changelog).
- [unit 1] Split the game's two As One IDs into Spectrier/Glastrier names and use learned canonical Leech Life ID 141 (15 PP), not the unused Leech Fang copy 355 (10 PP); do not invent the four absent hzla abilities (data.js, hzla radredhc.js).
- [unit 1] Preserve source sprite pixels using palette PNG conversion; leave Chillet's letter fallback because neither data.js nor the shared set has its art, and use actual transformation parents for regional Mega pruning (data.js sprites/evolutions, sprites/index.json).

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
