# photonic-sun build notes

Photonic Sun 2.38 (Buffel Saft), **Rebalanced** version, a 3DS hack of Ultra Sun. Built 2026-10-19 in this repo:
`uv run python -I hacks/photonic-sun/extract/build.py` writes `data.json` and `extract/report.txt` (every guess and
conflict), then `python assemble.py photonic-sun`. Sources: `SOURCES.md` (all fetched into `.src/`; the extract also
makes `.src/txt/`, `pdftotext -layout -enc UTF-8` copies of the PDFs).

931 Pokémon and forms (876 obtainable, 50 Megas/Primals, 34 form changes, 364 changed from Ultra Sun), 728 moves (38
changed), 233 abilities, 72 encounter areas, 513 trainers (488 placed), 35 walkthrough parts with 136 stops.

## Sources and rules

- **Game data is the authority** (PROGRESS.md → Source data check): `dex-rebalanced.json` (tools/ctr_dex.py on the
  hack's romfs and code.ips over the user's Ultra Sun v1.2 dumps) for species, moves, abilities, TMs and wild tables;
  `trainers-rebalanced.json` (tools/usum_trainers.py) for every trainer set, natures, IVs and EVs included. The docs
  are the check and give what the game data can't (wild methods, specials, shops).
- **Vanilla comparison:** `dex-vanilla.json` and `trainers-vanilla.json`, the same two tools on the vanilla dumps
  alone. P.vc (Changes from vanilla card, "Changed from vanilla" filter) and MV.h (move change notes) are the
  differences between the two dex files; the Move Changes doc's paragraph is MV.e (shown as "Move Changes doc").
- **Forms** (dex.py): totem forms (unnamed forms in the personal table) are dropped, except Own Tempo Rockruff, which
  evolves into Dusk Lycanroc. Cosmetic duplicates (same types, stats, abilities and level-up moves as a lower form of
  the same species: Pikachu caps, Unown, Arceus, Silvally, Minior colours, Furfrou, Vivillon, Flabébé line, Genesect...)
  fold into the lowest form. Megas and Primals are g 1; battle, item and fusion forms are P.fc (FC in dex.py).
  The two Zygarde 10% forms (Aura Break, Power Construct) both stay, named by ability. Shedinja and the Sandy / Trash
  Wormadam evolutions are added by hand (the evolution table can't say them once Burmy's cloaks are folded).
- **Wild tables** (locs.py): the game's tables have no method and repeat for every grass patch and fishing spot.
  Identical tables merge; each is labelled from `Wild Pokemon Locations.pdf`, read by word position (area titles are
  the 18 pt lines; a table is a bold heading, a bold "Levels: a-b" line, species in the first column). A game table
  takes the PDF table under a matching area title that shares at least half its species, scored on species and the
  level range; the bubbling fishing spot is the copy whose levels run higher. Small partial matches that aren't water
  tables are "Ambush Encounters" (shaking trees and grass the PDF doesn't always list); same label, different
  contents become "(spot 2)". Tables differing by time become "(day)" / "(night)". The game's leftover placeholder
  tables (Route 1 copies at level 2-3, Pikipek 100% in towns) are left out.
  Weather SOS tables come from the PDF only (no levels). SOS allies (the game tables' `sos` lists) are listed only
  for Pokémon with no other source (all Kantonian forms, the Pansage line, Mareanie, Sableye, Baltoy...).
- **Areas** (tracker slots) are the PDF's area titles in its order, plus Iki Town (starter choice, first so the rival
  filter has a place) and the places of the Special Encounters doc. TITLE_FIX tidies three titles.
- **Specials** (SPECIALS in locs.py): Special Encounters.pdf transcribed by hand from word positions (Island Scan by
  weekday with special moves, the Ultra Wormhole legendaries, gifts, totem stickers, fossils). The doc says
  legendaries it doesn't list "can be found in their usual locations ... at higher levels", so Ultra Sun's places are
  listed for those (Ultra Wormhole legendaries, Tapus in their Ruins, Necrozma, Nihilego / Xurkitree / Guzzlord) with
  no level. Trades: levels and items from the doc, the Pokémon you give from Bulbapedia's In-game trade page.
  Not found (5): Original Cap Pikachu (event), Eternal Floette, the Zygarde forms other than 50%.
- **Trainers** (trainers.py): the game data has no places. Bulbapedia's Ultra Sun / Ultra Moon walkthrough lists the
  trainers in story order with vanilla teams (Trainerentry for regular trainers, Party for bosses); each entry is
  matched to a vanilla trainer by class + name, then species and levels (pairs like "Twins Isa and Nico" by either
  name), and the hack's trainer with that id is used (the hack edits trainers in place). Leftovers are placed from
  the location pages' trainer lists, the rest go in "Other trainers" (25 real trainers: unused leftovers like the
  level 29 Kantonian Gym copies, Hau as a Multi Battle partner, Battle Buffet). 140 placeholder entries (no name, or
  one level 5 Yungoos with no moves) are dropped. "If the player chose X" (PlayerChoice) is t.st: rival and other
  starter-dependent teams follow the starter picker. Pokémon with no moves set use their last four level-up moves
  (the Gen 7 default). A Mega stone holder is shown as its Mega with a0 = the base ability. Bag items are a note.
  Boxes are story chapters (CHAPTERS); sections are places in walkthrough order. No level caps (TR.caps is empty and
  the template then hides the caps table).
  Checked: Captain Ilima's three teams match Important Trainers, Rebalanced.pdf (species, levels, abilities, items,
  moves). The PDFs are not compared field by field (no "Sheet says" notes); the game data wins anyway.
- **Items** (items.py): Serebii's Ultra Sun item lists (the hack's zone scripts are vanilla, SOURCES.md), vanilla mart
  rows dropped except the Battle Tree's BP shop; shops from Vendor Changes.pdf (SHOPS, transcribed). TMs teach the
  hack's moves (TM59 Sucker Punch, TM60 Aura Sphere, TM67 Rock Climb, TM79 Freeze-Dry, TM100 Curse). Mega stones
  link to their Mega through the game's Mega table and fill P.stone / P.sloc.
- **Walkthrough** (walk.py): one split per Bulbapedia part, one stop per place heading. Areas join the first stop with
  their name (ALIAS for Routes 15 and 16 and others); areas with no stop are "on the way" stops after the previous
  area's stop. Items file under the first stop named in their location (ITEM_ALIAS for rooms like Shady House); the
  rest are in Guide info. Game docs: Evolution, Type and Move Changes, Totem Battles (preformatted, scrolls sideways),
  the Mega Evolution guide and the changelog.

## Conflicts and findings (report.txt)

- The Move Changes doc says Triple Kick 10 → 20 power; the game data still has 10. Toxic Thread's new effect isn't a
  number the move data shows.
- Wild tables that differ from the PDF: Vast Poni Canyon grass has Boldore (not in the PDF), Poni Grove grass has
  Stakataka / Blacephalon (post-game), Malie Garden fishing spots swap Goldeen and Seaking, Route 1 Grass 3 has
  Scatterbug at night. The game is shown.
- Not in the hack's sources at all: totem battle sets (Totem Battles.pdf is a game doc, not trainer cards).

## Data schema

As Hardlove Gold (hacks/hardlove-gold/notes.md → DATA SCHEMA), with: P ids are slugs of the display name
("raichu-alola", "mega-charizard-x"); P.vc {s, t, a} vanilla values; MV.h always a list; MV.e + MV.dc the doc's
paragraph; P.w rows [area, method, rate "%"/"", level, note] where the note of a Trade is its tracker label
("For Spearow"); AR.note (trade items, Ultra Space Wilds); TR trainers carry `id` (the game's trainer id) and
`note` (bag items); mons carry `ao` ("Stakeout / Strong Jaw") when the ability slot is random; WK has no cheats or
checklist steps, and WK.docs holds the game docs.

## Local storage (prefix ps)

`psdex` list filters, `pscalc:<id>` + `pscalc:lastlv` stat calc, `pstrack` tracker {s starter, e, t}, `pswalk`
walkthrough open state, `pscap` levels per trainer, `pstr` open trainer boxes, `psrecent` search picks, `pspos` last
route, `psmgm` Minimal Grinding Mode, `psloc` / `psitems` open boxes. Keep them once published.
