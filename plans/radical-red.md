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
- [unit 7] GID from data.js game ids; growth rates from RR's 2023 Base_Stats.c (derived `extract/growth.json`), the 16 later species Medium Fast; battle-only forms (Megas too) read as their base; hzla's by-name ability table not used (data.js, hzla id tables, ydarissep/Radical-Red-Pokedex 65712ed, RadicalHex build-data.py).
- [unit 7] cfru.js profile `radicalred41`: retail signature 0x08012025, named only (Unbound unchanged), a vanilla save refused by its retail checksum windows, only the ability randomiser (0x942) refused, pokefirered experience formulas; `cfg.calc.cfru = "radicalred41"` needed (RadicalHex 3697412 / PKForge 2df0443 from real RR saves, hzla's reader).
- [unit 2] Superseded: the main chat authorised one engine extension, `over.abilities[name].statusImmune` (Toxic Boost / Flare Boost chip; RR changes v3.1:46,49; Showdown gen9rr/abilities.ts:240,691); `cfg.calc` is enabled.
- [unit 2] EVs as Photonic Sun's EV-less play: `evs` stays on, player sets default to 0, trainer EVs count (Ghost Marowak 252 HP) (Hardcore Main!E95).
- [unit 2] `setterStays: true` for Hardcore's permanent AI weather / terrain; the player's setters follow the same switch (Main!E10; profile-level setting only).
- [unit 2] Draco Barrage turns Physical when boosted Atk > SpA (Showdown gen9rr/moves.ts:247-266, dex description) though RR calc keeps it Special; recoil 1/3 (Showdown), not RR calc's 33/100.
- [unit 2] Mega Stone records only for 4.1 Megas (`data.js` forms): Applite (Flapple, Appletun) added; Duraludite / Grimmsnite left out (4.1 changelog:14, no form in data.js).
- [unit 2] Engine gaps recorded, not built (main chat's answer 1): Speed modifiers (Quick Feet 2x, Flower Gift / Bull Rush / Upgrade / Leek Stick), Shield Dust hazard immunity, Soul Robbery theft, Defog keeping terrain (Main!E12), Bad Company self-drops.
- [unit 2] Move effects stay in `hack.json` `over.effects` until `data.json` exists (effects_check.mjs needs it for `calc_effects.json`); the finishing unit moves them.
- [unit 5] Items show the Hardcore view only: "(DEFAULT MODE(S) ONLY)" / "(REGULAR MODE)" rows, the Main tab's unobtainable items (pickups, shops, care packages, wild holders), the red / blue care package items (Hardcore turns MGM on) and the red tutors go; the swapped Mega Stones, quest wording and Route 4's 4 PP Ups are the Hardcore ones (Main E24-E40, E81, E95; item sheet notes and colours).
- [unit 5] The Overworld Items tab is the place text, data.js the check of what lies where: rows pair with data.js entries only within their heading's areas; data.js-only pickups get a data.js line, sheet-only gifts stay; Waterium Z stays with Gian in Saffron (both sheet tabs) though data.js files it under Cerulean Gym (data.js areas, item sheet).
- [unit 5] Consumables and sell items are not listed (shops still are), Valuables = Shards, Heart Scales, Beast Balls, as Unbound (the user's 2026-10-30 rule there); Poké Mart stock is one "Any Poké Mart" line at FireRed's prices, which the sheet doesn't give (pokefirered items.json).
- [unit 5] Care packages are Also lines "Care package · <when> · xN" (the sheet's headings), paired with data.js item-cheat areas for walk.py; data.js's Viridian City Rare Candy / Pomeg Berry (no package) left out (item sheet Care Packages, data.js).
- [unit 5] Leek Stick keeps RR's name (data.js, Showdown) and has no icon; Houndoomnite / Fight Memory are renamed to the standard spellings (item_text.ALIASES) so they get icons; item text "changed" = differs from FireRed's bag text or RR changed the effect (pokefirered items.json, gen9rr items.ts).

## Units

Each unit: a Sol agent in its own worktree, branch off `worktree-radical-red` at the SHA given in its brief, commits
after every working sub-step (`WIP:` when incomplete), touches only its files and its own notes.md heading. The main
chat merges units into `worktree-radical-red` one at a time and rebuilds data.json there.

| Unit | Files | After | Status |
| --- | --- | --- | --- |
| 1 Dex ✓ merged | common.py (data.js reader, `sid` / `move` / `ability` / `item` lookups), dex.py, moves.py, prune.py, gid.py's ID-table half if cheap, sprites.json, notes Dex | scaffold | |
| 2 Calc mechanics | hack.json `cfg.calc`, tools/calc/radical-red_check.mjs, notes Damage calc | scaffold | |
| 3 Walk research ✓ merged | plans/radical-red-walk.md (order table only; no code) | scaffold | |
| 4 Locations | locs.py, notes Locations | 1 | |
| 5 Items | items.py, item_desc / battle_text / item_text_extra json, `P.hi`, itemstd RULES entry if needed, notes Items | 1 | |
| 6 Trainers + caps | trainers.py, trainer fields review, notes Trainers / Caps | 1 | |
| 7 Save IDs ✓ merged (finish: set `cfg.calc.save` "cfru" and `cfg.calc.cfru` "radicalred41") | gid.py, notes Save ID tables | 1 | |
| 8 Walkthrough | walk.py, notes Walkthrough | 3, 4, 5, 6 | |
| 9 Finish | cfg wording, check.py, calc scenarios / doubles count / fields counts, sprites check, report review | 8 | |
| Audit | the user's review of decisions first, then the full gate | 9 | |

## Finishing unit inputs (collected from unit reports)

- `cfg.calc.save` / `cfru` are set (main chat, after units 2 / 7). Calc scenarios (`tools/scenarios/calc-radical-red.mjs`
  still throws), calc-doubles EXPECTED, trainer_fields_check counts.
- Move `cfg.calc.over.effects` into `hacks/radical-red/calc_effects.json` now that data.json exists (`effects_check.mjs`).
- `tools/cfru.py` names: "Inferno Parade" -> Infernal Parade, "Soupercell Slam" -> Supercell Slam; then prune the
  profile's raw-name aliases.
- data.js item misspellings the engine won't know (Charzardite X/Y, Blastoisnite, Aerodactlite, Houndoomnite,
  Kangaskanite, Alorichium Z, Pikshunium Z): standard names (unit 5 may have done it; check).
- In-game checks in notes → Damage calc and Save import go to PROGRESS.md → Open.
