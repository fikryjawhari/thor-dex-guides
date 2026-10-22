# Plan: Eternal X guide (first build)

Branch `worktree-eternal-x` (worktree `.claude/worktrees/eternal-x`), started 2026-10-22. Model: Photonic Sun's
extract (`hacks/photonic-sun/extract/`), ported stage by stage. Sources: `hacks/eternal-x/SOURCES.md`; the romfs
zip and extracted folders stay in the main checkout's `hacks/eternal-x/.src/romfs-dl/` (312 MB, not copied); the
worktree's `.src/` has everything else plus `txt/` (pdftotext copies).

## Decisions (the user, 2026-10-22)

- **Rebalanced only.** Insanity - Rebalanced trainers can be added later (same dex; 336 of 785 trainers differ).
- **Viola nerf:** Viola's normal team, then a second card tagged "Viola nerf patch" (trainer 6 from
  `trainers-rebalanced-viola-nerf.json`, nothing else from that file).
- **Rival: a player picker** (boy / girl) beside the starter picker; only your rival (Serena if you play the boy,
  Calem if the girl) shows. Small template change (every guide; hidden unless the hack's data has player-dependent
  trainers). Teams follow starter and player.

## Stages

1. [x] **Game data regenerated** with the current tools: `dex-rebalanced.json`, `dex-vanilla.json` (vanilla X
   alone), `trainers-rebalanced.json`, `trainers-vanilla.json` (for matching Bulbapedia's vanilla teams),
   `trainers-rebalanced-viola-nerf.json`. Two shared-tool fixes: `ctr_dex.py` form names (XY's species text has 78
   blank lines after Volcanion; form names were off by 78, Mega Venusaur came out "Arceus") and `garc.py` decodes
   U+FFFD as é (Flabébé, Poké Ball).
2. [x] **dex.py** (M, MV, AB, P, TC): 786 Pokémon and forms, 30 Megas, 23 form changes, 514 changed from X, 38 moves
   changed. Pumpkaboo's sizes have blank evolution rows in XY: the base form's apply.
3. [x] **locs.py** (Haiku agent, 150k tokens; gifts added by hand): 38 doc areas + Lumiose City (ARO), 79 sections, 270 tables, game wins over ~79 doc rate typos; open: other vanilla gifts and statics (Snorlax, legendaries) not added (LOC, AR, P.w): XY tables have methods and rates already (Grass, flowers, Rough Terrain, Surf,
   Rock Smash, rods, Hordes); areas from `Wild Pokemon Locations.pdf` order; gifts, statics, trades from the docs.
4. [x] **trainers.py** (Sonnet agent, 166k tokens): 708 cards, 13 boxes, 64 sections; `st` + `pl` ("m" boy / "f" girl) on rivals and partners; Viola nerf card own `bt`; cfg.evs false. Open: 28 leftovers ("Other trainers"), Hotel Richissime and a 156-trainer nameless Battle Maison pool are guesses; template must filter `pl` and know Triple / Rotation tags (TR): Bulbapedia's X / Y walkthrough for places and story order, matched on vanilla teams
   (`trainers-vanilla.json`), hack teams by id. Rivals: t.st starter, plus the player tag for the picker. Viola nerf
   card. Gyms / Elite Four / Champion boxes; level caps if the docs give any.
5. [x] **items.py** (Sonnet agent, 140k tokens): 7 boxes (Shops 145, TMs 100, Evolution 26, Held 134 by class, Stats and Abilities 18, Fossils 11, Key 33); Mega stones in shops from five badges (doc). Open: Venusaurite / Charizardite X / Blastoisinite and TM54 have no place; `order()` untested until walk.py (IT): `Item Changes _ Locations.pdf` + Bulbapedia / Serebii item lists for X.
6. [ ] **walk.py** (WK): one split per Bulbapedia walkthrough part; game docs (Changelog, Evolution / Move Changes).
7. [ ] **Template: player picker** (mockup first, small).
8. [ ] Sprites check (`tools/sprite_keys.py eternal-x`), `assemble.py`, viewer-size checks, domcompare of the other
   guides if the template changed, phone preview in the Thor frame.
