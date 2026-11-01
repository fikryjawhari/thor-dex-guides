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

## User's answers (2026-11-02; these override any unit decision below)

- **Splits = the 18 Hardcore caps** (Main E44:E78): Pre-Brock 16, Pre-Mt. Moon Archer 23, Pre-Misty 28, Pre-Lt. Surge
  36, Pre-Erika 44, Pre-Game Corner Giovanni 47, Pre-Silph Co. Archer & Ariana 56, Pre-Giovanni Silph Co. 57,
  Pre-Sabrina 59, Pre-Koga 68, Pre-May 73, Pre-Blaine 76, Pre-Cerulean Cave Archer & Ariana 79, Pre-Cerulean Cave
  Giovanni 80, Pre-Clair 81, Pre-Brendan 82, Pre-Elite 4 85, Post Game 100. Split names in the guide follow these.
- **The Trainer Order sheet wins over data.js caps** for which split a mini boss is in: Justin (Route 12) in the Koga
  split (68, not 36); Lewis (Pokémon Mansion B1F) in the May split (73, not 76).
- **Variable-cap trainers:** a Trainer Order entry with a range or open cap ("28/36", "36+", "59/68", "81+") is
  fought at whichever cap the player is at; its card gets the "Your level" cap box (Unbound's relative levels: `r`
  = level − cap, default the split's cap, saved per trainer key in `LS.cap`). Use data.js's scaled-level codes
  (101-104) where they say how a level follows the cap.
- **Gym rematches (Hardcore):** Brock / Misty / Surge / Erika rematches: at least 3 of the 4 must be beaten before
  Koga. They go in the Koga split as required-choice fights (one note: "beat at least 3 of these 4 before Koga"),
  with the cap box (sheet 59/68).

## Decisions taken in units

(units append here: `- [unit] decision (source)`)

- [unit 3] Use the Trainer Order spine with 18 unchanged Hardcore caps, but keep recommended visit split separate from source unlock/default cap; a bucket is not a physical door lock (Main E44-E78, Trainer Order's 28/36 and 36/44 ranges, data.js areas/caps; full route in radical-red-walk.md).
- [unit 3] Place all 221 source areas and 464 trainer identities; resolve duplicate area references for Simon 218, Tammy 447 and Anthony 531 using each trainer's own cap/areaName, not the stale area membership (data.js trainers and areas 12/13, 86/88, 173/183).
- [unit 3] Silph Brendan 55 and Cave Lance 39 are partners, not enemies; Ketchup 20 then 19 is a next-day rematch, Oak 200 then 210 is back-to-back, and numbered gauntlets override source array order (Team Rocket E240/E409, Optional Bosses E148/E176, Postgame E28 and gauntlet headers; locations Statics F116).
- [unit 3] Brock/Misty/Surge rematches are optional in Hardcore; Bugsy 47/8 are pre-/post-Surge versions, not two mandatory battles; genuine team alternatives remain distinct source identities (v4.0 changelog opening, Johto Leaders E27/E52, data.js).
- [unit 3] Retain data's Justin u3/36 and Lewis u11/76 while flagging Trainer Order F231=68 and F366=73; recommend Justin on the post-Sabrina southbound circuit and Lewis after May (data.js trainers 477/219, Main caps, Trainer Order).
- [unit 3] Postgame ticket prerequisites are only the NPC's suggested opponents plus Gengarite, not an invented exhaustive boss list; ring gates chambers, and optional circuit order/ordinary spatial paths stay labelled guesses (item sheet F422, v3.0 changelog; unresolved Red/Abigail geography and Seafoam race floor recorded in radical-red-walk.md).
- [unit 1] Preserve all 1,343 game species/form IDs until D8 pruning; distinguish numeric cosmetic mirror forms, expose egg groups through dex.egg_groups, and log source species changes rather than adding unsupported P fields or a prohibited changes card (data.js, tools/schema.py, shared UI rule).
- [unit 1] Exclude unused Placeholder and generated Z/Max move records; normalise CFRU names, keep Struggle typeless, and preserve hidden/primary/secondary source ability order (data.js, official dex src/displayMethods.js).
- [unit 1] Allow disabled calc in item_text.generation and register Radical Red's item-text generation as 9; cfg remains untouched (scaffold cfg.calc=false, RR 4.1 Gen 9 additions).
- [unit 1] Use official dex secondary chances over Showdown, label freeze effects frostbite, and derive only Metal Bash's contact/target metadata from its in-game description; normalise Inferno Parade to Infernal Parade (data.js, gen9rr/moves.ts, v4.0 changelog).
- [unit 1] Split the game's two As One IDs into Spectrier/Glastrier names and use learned canonical Leech Life ID 141 (15 PP), not the unused Leech Fang copy 355 (10 PP); do not invent the four absent hzla abilities (data.js, hzla radredhc.js).
- [unit 1] Preserve source sprite pixels using palette PNG conversion; leave Chillet's letter fallback because neither data.js nor the shared set has its art, and use actual transformation parents for regional Mega pruning (data.js sprites/evolutions, sprites/index.json).

- [unit 4] One sublocation per data.js area (221) and one tracker slot per place with floor / room suffixes removed (153 places, 67 with no encounters as `ns`) (data.js areas, Unbound's floor grouping).
- [unit 4] Each encounter key's cap step shown as its Hardcore level in the group label and row notes ("cap 22"): the template has no per-row cap field (template/dex.js encounter sections, data.js keys).
- [unit 4] Grass uses FRLG's 12 slot rates, Surf / Rock Smash 60/30/5/4/1, rods 70/30, 60/20/20, 40/40/15/4/1; the data.js entries are in slot order (standard FRLG, data.js).
- [unit 4] Obtainable = found, or first same-dex base found, or evolved from an obtainable species (Unbound rule): 1192 obtainable, 83 not found, Megas g 1 (Unbound locs.py, data.js).
- [unit 4] Multi-entry fixed gift lists are "Gift (pick one)" with "1 of N" until the sheet says otherwise (data.js fixed-gift lists; sheet check in step 2).

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
