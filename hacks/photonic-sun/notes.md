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
  level range. Small partial matches that aren't water tables are "Ambush Encounters" (shaking trees and grass the
  PDF doesn't always list). The game's leftover placeholder tables (Route 1 copies at level 2-3, Pikipek 100% in
  towns) are left out.
- **Sections** (2026-10-20, `sections()` in locs.py, the user's design A): each area's Locations page is one section
  per game table, named from the PDF (Grass 1, Hau'oli Outskirts, Cave...), with day and night in one row ([day,
  night] rates). The same table in two game areas counts once (it used to double Route 1's Grass 2/3 rates); copies of
  a table in other patches merge, and a species only some copies have says "Only in some patches" (Route 1 Grass 3:
  Scatterbug at night). Water = Fishing + Surfing; of an area's fishing copies, the higher-level ones are the
  bubbling spot, shown as a second rate (the PDF's level ranges don't always match the game's, so they can't decide
  it). Berry piles, ambush, dust clouds, shadows, splashes and Wimpod share an "Other" section. 0% slots are dropped
  (Poni Grove's Stakataka / Blacephalon).
- **SOS** (tools/ctr_dex.py `sosBy`): each slot's allies, so a row knows exactly whom it calls (Corsola → Mareanie,
  Clamperl → Gorebyss by day, Huntail at night); allies the same as the caller are left out, other forms kept
  (Kantonian Rattata, East Sea Shellos). Every ally gets a P.w row "SOS ally", note "Called by ...", so Pokémon pages,
  search and the tracker know it. Weather allies (rain, sand, hail) come from the game's tables (`sosWeather`).
  This found Eternal Floette (Poni Meadow) and Diancie (Carbink) as allies, so they're obtainable now.
- **Maps** (`pdf_maps()`): the PDF's numbered grass maps (Route 1, Hau'oli City, Routes 2, 3, 5, 6, Mount Hokulani),
  rendered from the page (the circles are drawn over the picture), at most 520 px wide, 96 colours, as data URIs
  in AR.map (134 KB). Credited to the doc in the guide. The island overview pictures are skipped.
- **Areas** (tracker slots) are the PDF's area titles in its order, plus Starter (first, so the rival filter has a
  place; Ultra Sun gives the starter on Route 1, so the walkthrough files it under Route 1) and the places of the
  Special Encounters doc. TITLE_FIX tidies three titles. SPLIT makes a game table an area of its own (Route 1's
  Hau'oli Outskirts table, 2026-10-21); new areas go at the end of AR so saved trackers keep their slots, and AFTER
  puts them in place in D.ARO, the Locations order (Starter, Route 1, Hau'oli Outskirts, Trainers' School, Hau'oli City).
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
  the location pages' trainer lists (exact team first, then exact place name, never a prefix in the middle of a
  number: "Route 17" isn't "Route 1"). Mallow's level 100 team is her post-game Kantonian Gym battle (the Important
  Trainers doc; Bulbapedia doesn't list it), Ryuki's level 50 the optional pre-League Kantonian Gym, Battle Buffet,
  Tristan (= Taro) and Harper and Sarah are placed by hand (PLACE), so nothing is left in "Other trainers". 140
  placeholder entries (no name, or one level 5 Yungoos with no moves) are dropped. 5 walkthrough entries match no
  trainer (a Fomantis grunt, an Arbok grunt in RR, Rada and Lillie at the Battle Tree, a level 61 Faba): the game
  data wins, they're left out.
  Read from the walkthrough: `{{Party/2}}` and `{{tt|lv|...}}` levels, trainerdiv captions (notes), `=== sub-places ===`
  in Parts 14, 21, 31 (`==== VS X ====` stays in its room). `prize = none` parties are partners (t.pt, shown first in
  the battle's card; Hau's Aether copies kept once), except the Battle Royal. Trainers fought at once share t.bt
  (one row per battle); tags Double / Multi Battle / Battle Royal / Prismatic Moon (the MOON table, with "Prismatic
  Moon only. In Photonic Sun you fight X instead."). Story trainers repeated after the League go to the post-game
  box; location-page trainers at post-game levels go to "<place>: post-game". "If the player chose X" (PlayerChoice) is t.st: rival and other
  starter-dependent teams follow the starter picker. Pokémon with no moves set use their last four level-up moves
  (the Gen 7 default). A Mega stone holder is shown as its Mega with a0 = the base ability. Bag items are a note.
  Boxes are story chapters (CHAPTERS); sections are places in walkthrough order. Aether Paradise's second visit is a
  box by floor; the first (no trainers, the Nihilego fight) is a section at the end of Akala; Episode RR splits by room.
- **Level caps** (CAPS in trainers.py): the next trial or grand trial (totem levels from Totem Battles.pdf), or with
  mini caps (story boss fights between trials). A mini cap is left out when it doesn't raise the cap, sits at or
  above the next trial (Ultra Necrozma 100 before Mina 95) or comes right before it. Each place shows its next cap
  and the battles left before it: one per battle (t.bt), one starter's rival fight, no optional places, Kantonian
  Gym, Battle Buffet or Prismatic Moon teams. Route trainers you can walk around all count: no source marks them
  (Bulbapedia's walkthrough and location pages don't, Serebii doesn't), so there's no "forced" count.
  Checked: Captain Ilima's three teams match Important Trainers, Rebalanced.pdf (species, levels, abilities, items,
  moves). The PDFs are not compared field by field (no "Sheet says" notes); the game data wins anyway.
- **Items** (items.py): Serebii's Ultra Sun item lists (the hack's zone scripts are vanilla, SOURCES.md), vanilla mart
  rows dropped except the Battle Tree's BP shop; shops from Vendor Changes.pdf (SHOPS, transcribed). TMs teach the
  hack's moves (TM59 Sucker Punch, TM60 Aura Sphere, TM67 Rock Climb, TM79 Freeze-Dry, TM100 Curse). Mega stones
  link to their Mega through the game's Mega table and fill P.stone only (no place: the stones are generated in).
  Boxes (pass 2, `plans/ps-items.md`): Shops (a row per item under its kind, every shop on its own line), TMs,
  Z-Crystals, Evolution Items, Held Items (sub-headings by class: HELD), Stats and Abilities (STATS), Key Items. No
  Battle Items, Fossils (Poké Pelago only) or Mega Stones box. Each item is in one box (plus Shops); items in two
  Serebii lists (King's Rock: hold and evolution) go to Evolution Items. Rows read Found / Wild / Also / Shop, one line
  each, Found in game order; the walkthrough files them by `_itp` (the old '; ' place list). Game order (Key Items,
  Stats and Abilities, TMs, Z-Crystals) = the walkthrough stop of the earliest place (`items.order`, after walk.py);
  wild holders count where they live, the left clerk by trials; vanilla marts don't count. The rest A to Z.
- **Walkthrough** (walk.py): one split per Bulbapedia part, one stop per place heading. Areas join the first stop with
  their name (ALIAS for Routes 15 and 16 and others; PLACE picks the stop by hand: Route 1's wild Pokémon with part 2's
  Route 1 visit, part 1 keeps the starter; Hau'oli Outskirts and Trainers' School in part 2); areas with no stop are
  "on the way" stops after the previous area's stop. NEW_STOP adds Trainers' School after part 2's Route 1 (Hau'oli
  Outskirts), with Youth Athlete Hiromi through Teacher Emily from there (the Trainers tab still has them under Route 1
  (Hau'oli Outskirts): it follows trainers.py). Items file under the first stop named in their location (ITEM_ALIAS for rooms like Shady House); the
  rest are in Guide info. ITEM_IN files a place inside a stop's ("Route 1 - Trainer School") under that building. Game docs: Evolution, Type and Move Changes, Totem Battles (preformatted, scrolls sideways),
  the Mega Evolution guide and the changelog.

## Conflicts and findings (report.txt)

- The Move Changes doc says Triple Kick 10 → 20 power; the game data still has 10. Toxic Thread's new effect isn't a
  number the move data shows.
- Wild tables that differ from the PDF (the game is shown; the full list, rates and levels included, is
  `tools/mockup/ps-locations/pdfcmp.py`'s output, summed up in the round 1 mockup's Findings tab): fishing rates on
  Routes 7 and 9, Akala Outskirts, Seafolk Village (Dhelmise 50%, doc 5%), Poni Breaker Coast, Malie Garden (Goldeen
  and Seaking swap by spot); grass rates on Route 5, Brooklet Hill, Ula'ula Meadow, Vast Poni Canyon (plus Boldore),
  Poni Meadow, Route 16, Ancient Poni Path, Thrifty Megamart; levels at Verdant Cavern, Route 3 shadows, Route 8
  surfing and most bubbling spots; Poni Wilds berry piles are half Crabrawler; Route 1 Grass 3 has Scatterbug at
  night in one patch; Poni Grove's Stakataka / Blacephalon slots are 0%.
- Not in the hack's sources at all: totem battle sets (Totem Battles.pdf is a game doc, not trainer cards).

## Data schema

As Hardlove Gold (hacks/hardlove-gold/notes.md → DATA SCHEMA), with: P ids are slugs of the display name
("raichu-alola", "mega-charizard-x"); P.vc {s, t, a} vanilla values; MV.h always a list; MV.e + MV.dc the doc's
paragraph; P.w rows [area, method, rate "%"/"", level, note, 1?] where the note of a Trade is its tracker label
("For Spearow"), the rate may say "20% (day)" / "15% day, 20% night", and a 6th field 1 means the row repeats the
area's sections (the template lists only the other rows, gifts and trades, apart); AR.es the area's sections
[{n, k grass|water|other, g:[{m label, lv, bl bubbling levels, rows:[{p, r:[day,night], b:[day,night], sos:[[ally,
""|"day"|"night"]], note}]}]}]; AR.st 1 = the starter picker is this area's tracker; AR.map [data URI]; AR.note (trade items, Ultra Space Wilds); ARO the Locations order (EI's notes); TR trainers carry `id` (the game's trainer id) and
`note` (bag items), `bt` (battle id, shared by trainers fought at once), `pt` partners [{n, st, p}], `tags`; sections
carry `cap` [trial set, with-mini set], each [level, who, where, battles left] or null, and `opt` (optional place);
TR.mini [name, where, level, "trial"|"mini", left out 0/1]; mons carry `ao` ("Stakeout / Strong Jaw") when the ability slot is random; WK has no cheats or
checklist steps, and WK.docs holds the game docs.

## Local storage (prefix ps)

`psdex` list filters, `pscalc:<id>` + `pscalc:lastlv` stat calc, `pstrack` tracker {s starter, e, t}, `pswalk`
walkthrough open state, `pscap` levels per trainer, `pstr` open trainer boxes, `psrecent` search picks, `pspos` last
route, `psmgm` Minimal Grinding Mode, `pscapset` level cap set, `psloc` / `psitems` open boxes. Keep them once published.
