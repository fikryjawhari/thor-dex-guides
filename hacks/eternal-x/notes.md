# eternal-x build notes

Eternal X 2.67 (Buffel Saft), **Rebalanced** version, a 3DS hack of Pokémon X. Built 2026-10-22:
`uv run python -I hacks/eternal-x/extract/build.py` writes `data.json` and `extract/report.txt` (every guess and
conflict), then `python assemble.py eternal-x`. Sources: `SOURCES.md` (game data regenerated 2026-10-22; the extract
reads `.src/txt/`, `pdftotext -layout -enc UTF-8` copies of the PDFs, made by build.py). Plan and open items:
`plans/eternal-x.md`. Model: Photonic Sun's extract; schema as `hacks/photonic-sun/notes.md` → Data schema, plus
`t.pl` below.

786 Pokémon and forms (30 Megas, 23 form changes, 514 changed from X), 617 moves (38 changed), 39 areas, 708
trainer cards, 7 item boxes, 17 walkthrough parts with 69 stops.

## Sources and rules

- **Game data is the authority**: `dex-rebalanced.json` (tools/ctr_dex.py on the hack's romfs + code.ips over
  vanilla X v1.0) and `trainers-rebalanced.json` (tools/xy_trainers.py). Insanity - Rebalanced has the same dex; its
  trainers aren't in this guide (the user's choice). Vanilla comparison: `dex-vanilla.json`, `trainers-vanilla.json`.
- **Dex** (dex.py): as Photonic Sun. Cosmetic duplicates fold into the lowest form (Unown, Vivillon, Furfrou...);
  Floette Red and Yellow stay apart (their data differs somewhere). Pumpkaboo's sizes have blank evolution rows in XY:
  the base form's apply. Move Changes.pdf is MV.e.
- **Wild tables** (locs.py): areas = the Wild Pokemon Locations doc's titles, in its order ("the order they become
  accessible"); the 53 game zones are matched to the doc's sub-areas by species overlap, one to one, and sub-areas
  (1F, B2F, Outside) are sections named by floor. Sections: Grass, flowers, Rough Terrain = grass; Surf and rods =
  water; Rock Smash and hordes = other. Hordes: one group per horde table ("Horde 60%"). Slots of one species in a
  table are summed. Cosmetic forms the dex folds (Scatterbug, Munchlax, Misdreavus, Whiscash) use the base form.
  ~79 of 694 doc rates differ from the game (doc typos, missing hordes): the game wins. Route 17 is "Snow" in the doc,
  Rough Terrain in the game.
- **Gifts and fixed encounters**: levels and held items from the hack's own `DllField.cro` (`.src/cro/`, from the
  zip; vanilla's from the dump; `cro_specials()` in locs.py: statics 12-byte entries at 0xEE46C, gifts 24-byte at
  0xF805C, level byte 3 / 5, item at 4 / 12). The hack changes: Kanto starters Lv 15 with Eviolite, Lapras Lv 35,
  fossils Lv 25, Kalos starters hold a Big Nugget, Torchic (Blazikenite) replaces the Route 2 Pidgey, Xerneas 60,
  birds 85, Zygarde and Mewtwo 90. Places are vanilla X's (Bulbapedia; no script edits): Lumiose City and Team
  Flare Secret HQ are appended areas (ARO puts them in place); the roaming bird follows the starter (Chespin
  Articuno, Fennekin Zapdos, Froakie Moltres; "Starter: X" in the note). Frost Cavern's Abomasnow (Lv 45) is a battle,
  not a catch. In-game trades aren't added.
- **Trainers** (trainers.py): Bulbapedia's X / Y walkthrough matched on vanilla teams (class + name, species,
  levels); the hack's trainer with that id is used. 54 placeholders dropped. Rival / Shauna / Tierno / Trevor ids are
  fixed (RIVAL, FRIEND). Boxes are CHAPTERS. Hand placements (guesses): Hotel Richissime (38), Battle Chatelaines,
  4 by id neighbour, 156 nameless trainers (id 614+) as a Battle Maison pool in the post-game box (all post-game:
  levels near or above Diantha's 87, or Maison's fixed levels). 28 trainers no Bulbapedia page names (Drivers, a
  Gardener "●"...) are vanilla X's unused data and are dropped. No natures or EVs (cfg.evs false); IVs are the trainer byte / 8. No level caps. Tags from the battle
  field (Double / Triple / Rotation, Multi Battle with a partner). Moves default to the last four level-up moves.
- **Rivals, player picker**: `t.st` = starter name, `t.pl` = the player character the team appears for ("m" boy,
  you fight Serena; "f" girl, you fight Calem), on rival cards and partner entries (`pt`). Partners: Route 7,
  Glittering Cave, Poké Ball Factory, Team Flare Secret HQ. Viola nerf: a second Viola card with its own `bt`,
  tagged "Viola nerf patch" (only trainer 6 of `trainers-rebalanced-viola-nerf.json`).
- **Items** (items.py): Bulbapedia's Kalos pages (`{{Itemlist}}` X rows, `{{shop}}` stocks) with the Item Changes doc
  applied (DOC_SWAPS, TM_WAS, Mega Stones in every Mart from five badges); TMs teach the hack's moves (code.ips).
  Boxes: Shops, TMs, Evolution Items, Held Items (by class, Mega Stones a class), Stats and Abilities, Fossils, Key
  Items. Rows with only `y=yes` are Y-only and skipped. Items no location page places take the walkthrough pages'
  `{{itemlist}}` rows (the Kanto stones from Sycamore with your Kanto starter, TM54, the lenses...).
- **Walkthrough** (walk.py): one split per Bulbapedia part, a stop per place heading; ALIAS Starter → Aquacorde
  Town; ITEM_ALIAS files gyms and buildings under their town; a Lumiose item goes to the earliest part whose Lumiose block
  lists it (8 move to parts 8 and 11), the rest stay at the first visit (part 3).
  Lost Hotel and Terminus Cave are "on the way" stops. Game docs: Evolution Changes, Move Changes, Changelog.

## Local storage (prefix ex)

`exdex`, `excalc`, `extrack` (tracker {s starter, pl player, e, t}), `exwalk`, `excap`, `extr`, `exrecent`,
`expos`, `exmgm`, `exloc`, `exitems`, `excapset`. Keep them once published.
