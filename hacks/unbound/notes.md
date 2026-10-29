# Pokémon Unbound build notes

Scaffolded from `emerald-imperium`. Built so far: the dex (unit 3 of `plans/unbound.md`); locations, items, trainers
and the walkthrough are stubs that `build.py` skips (empty tables). Feature switches and cfg.txt wording still need
review by those units.

## Build

`uv run python -I hacks/unbound/extract/build.py` (then `python assemble.py unbound`). Order: `dex.py`, the stub
modules (skipped while they raise NotImplementedError), `finalise()`, then `gid.py` (GID indexes M as it ends up). With
no trainers yet no `trainer_keys.json` is written: unit 6's first build seeds it.

Modules: `common.py` (paths, the readers, the name lookups every module uses), `wiki.py` (the unboundwiki.com export:
Pokédex pages, Mega Stones, the Move Tutors page), `dex.py`, `gid.py`, `check.py`. The CFRU family part is
`tools/cfru.py` (below).

## Sources and rules

### Dex

Sources: the RomHackDex mirror (`.src/romhackdex/`: 1,268 Pokémon pages, `moves.json` 993 entries, the ability index
258, the type chart) is the dex; the wiki export (`.src/unboundwiki/unboundwiki.json`) is the cross-check and gives what
the mirror lacks; the game's own tables (Skeli's Unbound-Cloud at `.src/repos/Unbound-Cloud`, and hzla's
`unbound_2_1_constants.js` generated from it) settle disagreements and give `GID`. Unbound is closed source: no "code
wins" rule.

- **Species and forms.** Every mirror page is placed (`check.py` proves it): 1,114 P entries (906 species, 58 regional
  forms, 50 Megas / Primals, 100 other forms), 116 pages merged into a species, 38 dropped. Names: `tools/cfru.py`.
  Dex numbers are the mirror's sprite numbers, except Type: Null (the mirror shows #773, Silvally's; the wiki's #772
  taken). The wiki's "National Dex" field is not used otherwise: it is wrong for many (Gible #496).
- **Merged** (listed under their species; their pages differ from it only in looks, or in stale tutor / egg lists, all
  in the build report): Alcremie's sweets, Burmy's cloaks, Cherrim Sunshine, Cramorant Gulping / Gorging,
  Deerling / Sawsbuck seasons, Flabébé / Floette / Florges colours, Furfrou trims, Shellos / Gastrodon East Sea,
  Genesect's drives, Hippopotas / Hippowdon / Jellicent / Pyroar females, Keldeo Resolute, Magearna Original Color,
  Mimikyu Busted, Morpeko Hangry, Pichu Spiky-eared, Pikachu's caps, Sinistea / Polteageist Antique, Unown's letters,
  Vivillon's patterns, Xerneas Neutral, Zarude Dada, and Minior's seven cores into one "Minior (Core)".
- **Dropped:** 34 Gigantamax pages and Eternamax (Dynamax is raid-only in Unbound; a save's Gigantamax species id maps
  to its base in GID), Zygarde Cell / Core (collectibles), MissingNo.
- **Kept forms** with their own data: Unfezant / Frillish female (separate species in the game, 100% female),
  Meowstic / Indeedee / Basculegion female, Pumpkaboo / Gourgeist sizes (the mirror's plain page is Small, CFRU's base
  species), Oricorio, Lycanroc, Toxtricity, Urshifu, Basculin, Wormadam, Floette Eternal Flower, Zygarde 10% /
  Complete, Pikachu's six cosplay forms and Surfing / Flying (own abilities), and the battle / item form changes with
  other stats (`fc`).
- **The mirror's two 404s:** Minior Red Meteor is Minior's own page; `minior-shield` (the Meteor form, #774) stands in
  for it (the Meteor colours share its data). Pumpkaboo Average: the mirror's `pumpkaboo-m` page is the Average size,
  so nothing is missing.
- **Unbound's own species:** Shadow Warrior (mirror page "Warrior", Ghost / Dark; a Route 9 / Vivill Hideout boss in
  hzla's sets). No national number (dex 0), not in the game's save tables, no art (type circle).
- **Abilities:** the mirror's names, except 15 species where it shows one of Unbound's own abilities under another
  ability's name (Sound Waves as Punk Rock, Grass Dash / Slippery Tail as Gale Wings, Icy Skin as Ice Scales, Drill Beak
  as Merciless, Evaporate as Storm Drain, Pride as Proud, Mega Medicham's Huge Power as Pure Power, Wyrdeer, Unfezant
  female): `dex.py` ABILITY_FIX sets them from the game's species table; the wiki and hzla's boss sets agree where they
  list them. Calyrex's riders have "As One (Glastrier)" / "As One (Spectrier)" (the game's and the calc's names).
  Descriptions: the mirror's text, except for Unbound's own and the names the mirror lacks, which take the wiki's game
  text (the mirror's index pairs its short names with another ability's text); Neutralizing Gas, Power of Alchemy and
  As One take the official Sword / Shield text (no source has theirs). Focus Belt and Nine Lives (Unbound originals)
  have no description anywhere; the wiki lists Sturdy for every species that has them (its pattern: the vanilla
  equivalent, as Huge Power for Pure Power), so the guide says "Probably works like Sturdy ...; not confirmed" (user
  2026-10-29; an in-game check settles it). 23 abilities are Unbound originals (`AB[2]`, tag `cfg.orig` "Unbound"): the ones the
  calc's data doesn't know.
- **Wiki says** (not shown in the guide: the game's tables agree with the dex on every one; `check.py` counts 16):
  Meowth / Persian Sturdy (game: Nine Lives), Machoke / Machamp Sturdy (game: Focus Belt), Meditite / Medicham Huge
  Power (game: Pure Power), Camerupt / Rhyperior / Stonjourner / Tirtouga / Carracosta Filter (game: Solid Rock,
  Sturdy), Noibat / Noivern Sound Waves (game: Punk Rock), Wyrdeer Scrappy (game: Frisk), Meowstic's per-gender list,
  Moltres' "(Hidden)" label. Types: none differ. Learnsets differ for most species (TM 935, level-up 53, egg 14): the
  wiki's lists are older (old names like "Petalblizzard" at Venusaur's 31); the mirror's are used.
- **Moves:** `moves.json` with official names (`cfru.official`); 70 entries are a second CFRU spelling of a move and are
  merged (the entry species use is kept; the build report lists them and the fields where they differ); 102 Max /
  G-Max and 36 Z-move copies are left out (no species learns them; the calc's Z-moves are unit 8's). Three names the
  calc doesn't know stay as Unbound originals (`MV.x`): Endless Edge (Hisuian Samurott), InfernalRage (Hisuian
  Typhlosion), Steelyhit (no learner); the mirror's data for the first two isn't Ceaseless Edge's / Infernal Parade's.
  Crit stages: the Gen VIII lists (`cfru.HIGH_CRIT`, `ALWAYS_CRIT`). Descriptions: the mirror's, cleaned (`cfru.clean`).
- **Evolutions:** the wiki's Evolution Line tables (they name each child's parent; the mirror draws a family as one
  flattened chain), worded by `dex.wiki_how` / `cfru.evo_text`; the mirror's "Lv. N" wins on a level (no conflicts
  now). Edges the wiki lacks come from the mirror (Burmy's cloaks, Espurr -> female Meowstic, Hisuian Basculin ->
  female Basculegion, Galarian Koffing / Mime Jr., the size forms; `EVO_FIX` words them); chain artefacts the mirror
  draws through forms are dropped (`NOT_EVO`). Report: 475 edges, 9 mirror-only, 19 wiki-only.
- **Mega Stones:** `p.stone` / `p.sloc` from the wiki's 48 Mega Stone pages (the Location line; the Red Orb / Blue Orb
  page gives both Primals). Mega Rayquaza has none (Dragon Ascent).
- **Wild held items** (`p.hi`): the wiki's "Wild Held Items", names only.
- **Tutors** (`p.tu`): the mirror's per-species lists. Against the wiki's Move Tutors page (29 tutors, 152 moves): the
  lists also hold the HMs (Rock Climb included) and 3 moves no wiki tutor teaches (Dazzling Gleam, Draining Kiss, Power-Up Punch), and the
  special tutors' moves (Draco Meteor, Dragon Ascent, Relic Song, Secret Sword, Volt Tackle, Steel Beam) are in no
  species list. Left as the mirror has them.
- **Type chart:** the mirror's; the wiki states no changes; it matches the Gen VI+ chart.

### CFRU family (`tools/cfru.py`)

Shared with Radical Red (its mirror was checked for the same quirks, 2026-10-29). CFRU-general:
- Names: the game stores moves / abilities in 12 characters and species in 10, so the mirror shows "Dazzle Gleam",
  "Wandering Soul", "Fletchindr"; its move list also has the constants' run-together spellings ("Petalblizzard").
  `official()` / `species_name()` give the official names (the calc and the sheets use them); `CFRU_NAMES` and
  `CFRU_SPECIES` hold the short ones.
- Forms: one page per form, slug `<base>-<suffix>` with CFRU's suffixes (`-a` / `-g` / `-h`, `-mega`, `-mega-x`,
  `-primal`, `-giga`, `-f`...); `forms()` places each page (base, kind, label) and names it: regional "Alolan Raichu",
  Mega "Mega Charizard X", other forms "Lycanroc (Midnight)", peer default forms "Pumpkaboo (Small)" (`NAME_BASE`).
  `merge_into()` applies the cosmetic merges, `define_slug()` maps a `SPECIES_` constant to its page.
- `save_ids()`: GID from an Unbound-Cloud checkout (Radical Red's tables are in the same repo).
- Unbound-specific stays in this hack's `dex.py` (ABILITY_FIX, EVO_FIX / NOT_EVO, the wiki) and `common.py` (OWN,
  NAME_FIX, the wiki's typos).

### Save ID tables (GID)

`gid.py` from Unbound-Cloud `server/src/data/unbound_2_1/` (Species / Moves / Items by game id, BaseStats growth
rates; names from `src/data/`): 1,180 species ids reach every P entry a save can hold (Megas are reverted before a
save; Shadow Warrior has no id), 766 moves, 522 items (Unbound-Cloud's display names; unit 5 reconciles them with
the Items page). No `ab`: a CFRU box Pokémon stores its ability slot, so the reader returns `abs`. hzla's generated
constants give the same id -> constant tables (checked every build). The reader itself is unit 8.

### Trainers (unit 6, 2026-10-29: readers done, trainers.py not written yet)

Source inspection reproduced the Expert workbook's numeric-level inventory. These are structural teams,
including partner groups and starter branches, not the final number of trainer cards or stable keys.

| Expert worksheet | Structural teams | Pokemon slots |
| --- | ---: | ---: |
| Gym Leaders | 9 | 45 |
| Pokemon League | 5 | 30 |
| Rival | 15 | 51 |
| Team Shadow Bosses | 10 | 39 |
| Team Light Of Ruin Bosses | 9 | 42 |
| Boss Wild Battles | 12 | 18 |
| Mega Trainers | 13 | 63 |
| Other Bosses | 12 | 55 |
| Title Defense | 8 | 48 |
| Battleground | 8 | 48 |
| Total | 101 | 439 |

The pinned hzla Expert object contains 383 sets. Unit 1's join audit remains the comparison authority pending
implementation: 381 joined sheet slots (380 distinct sets), 365 agreeing, 16 differing, 58 sheet-only, and
three malformed hzla keys (`[2nd`, `Supply and Demand`, `Rogue Electivire`). Unit 6 has not yet reproduced that
join or added the card-level discrepancies; `plans/unbound-sources.md` lists every difference and missing slot.
An additional IV coverage detail was directly verified: hzla's `Shadow-Warrior` / `Lvl 37 Route9 ` set has no
`ivs` member. Both matching sheet slots therefore lack sourced IVs even though the species/team join succeeds.
Do not confuse a matched set with complete IV coverage.

The wiki Trainer Locations list was independently counted through the existing Wiki reader: 309 named rows,
294 with roster/location cells (292 four-cell rows and two three-cell rows), plus 15 name-only rows.
Workbook joins, held-item coverage and workbook-only trainers are not implemented or counted yet.
Rival!B1/I1/P1 explicitly say PLAYER CHOSE GIBLE/BELDUM/LARVITAR, so the eventual `cfg.starter` should be
`pick`, with `t.st` Gible/Beldum/Larvitar, not Grass/Fire/Water. Configuration remains unchanged at this checkpoint.

**Unknown stats (settled 2026-10-29, template `16b9650`):** a trainer Pokémon with no `iv`, or no `ev` (EVs count in
Unbound), shows no speed. Omit `iv` where hzla has no set (sheet-only slots, Route 9 Shadow Warrior); omit `ev` for
the four partner Vaporeon below and keep the raw cells as `x` ("Sheet: EVs 252? / 0? / ...").

| Expert slot | Question-mark cells |
| --- | --- |
| Team Shadow Bosses!J126 | J135:J140 EVs 252? / 0? / 0? / 0? / 252? / 0?; item Wacan Berry?, nature Hardy? |
| Team Light Of Ruin Bosses!J46 | J55:J60 EVs 252? / 0? / 0? / 252? / 0? / 0? |
| Team Light Of Ruin Bosses!J66 | J75:J80 EVs 252? / 0? / 0? / 252? / 0? / 0?; item Wacan Berry?, nature Hardy? |
| Boss Wild Battles!F193 | F202:F207 EVs 252? / 0? / 0? / 252? / 0? / 0?; item Leftovers?, nature Hardy? |

Also unsure in the sheet (value kept, `x` says so): Boss Wild Battles!E193 Toucannon item Sharp Beak?, G193 Mamoswine
item Occa Berry?; Boss Wild Battles!B153 boosts "none?".

#### Readers (round 2: `extract/bosssheet.py`, `wiki.py` → `trainer_locations()`)

- `bosssheet.blocks()` reproduces the 439 numeric-level slots per sheet as in the table above (Gym 45, League 30,
  Rival 51, Shadow 39, Light 42, Boss Wild 18, Mega 63, Other 55, Title Defense 48, Battleground 48). It returns 102
  column groups: unit 1's 101 counted Boss Wild Battles' Crystal Peak block (row 191: foe B:D, rival partner E:G) as one
  group. Route 9's sidebar "MOVES BLOCKED BY AURAS:" (F2:F13) is `Block.side`, not Pokémon.
- `Block.levelrow` is the level row's own label, and it places the fight: "Level at Cap" (gyms, League, Rival, Light
  of Ruin 1-4, Boss Wild), "Level at Big Mo / Tessy / Maxima / E4 / Mel / Vega / Alice Cap" (Mega Trainers, Other
  Bosses), "Level at Cap (UNSURE)" (Almuth), "Minimum Level" (every Team Shadow block, Aklove 3, Krystal, Ravonna,
  Annie, Barbs, Ryuzoji & Kenlawa, the Candice rematch, Title Defense, Battleground). The txt line says levels are at
  the cap; a "Minimum Level" or "(UNSURE)" block needs a trainer note saying so.
- `trainer_locations()`: 309 rows = 293 with species + Mega Trainer Reena (empty team cell, Route 18) + 15 rows with no
  cells of their own. Those 15 sit under a rowspan: they share the row above's place and team cell (`shared`), i.e.
  the wiki lists the pair's combined team under the first name (Skier Anna and Ruby, Picnicker Kelsey under Camper
  Chad, ...). Two 3-cell rows (Ace Trainer Lia: no picture cell; Bug Catcher Greg: no place). The page says "310".

#### Sources found this round (use them)

- **Cell comments** (130, openpyxl `cell.comment`): gimmick explanations on the Fight Gimmicks cells (Fog, Negative
  Energy, Vicious Sandstorm, Shadowy Veil, Pixies, Rainbow Battle) → trainer notes (field evidence); per-slot notes
  (Rival "Trumbeak on levels lower than 28", Other Bosses "Night Slash on lvl 50 or higher", "Regenerator if Walrein")
  and other-cap level ladders ("Benjamin Cap: 61 / Elite Four Cap: 75") → `mon.x`; Team Shadow K130 / Light K70: the
  rival partner's "Starter (mega)" moveset per Mega (Tyranitar / Garchomp / Metagross).
- "Starter (mega)" (Shadow K126, Light K66, level 64): one partner `pt` per starter (`st`): player Gible → Mega
  Tyranitar, Beldum → Mega Garchomp, Larvitar → Mega Metagross (ability cell "Sand Stream // Tough Claws // Sand
  Force"), moves from the comment, nature / EVs from Rival 5's Mega ("Check corresponding spread in Rival sheet").
- Sheet values to normalise (record each): "Hidden Power <Type>" → Hidden Power + `hp`; "Heatt Wave" (Mega Trainers
  E205) → Heat Wave; Rival 2 Swinub "default moveset" → no moves, `x`; "A / B" ability → `ao`; "A → B" → `a0` / `a`;
  species suffixes "[1st lead]" / "[X's lead]" → `ld`, "(pre-burned)" → `pre` Burned, "(respawnable)" → note;
  "Sucessor Maxima" label typo.
- hzla Expert (the `formatted_sets["expert"]` line of backups/unbound.js is JSON): 383 sets, labels "Lvl N <label>";
  all 382 IV sets are 31s. Join on (sid(species), key(label)) with the sheet label minus " - Expert" / "[Expert]".
  Label overrides: Rival row 40 → "Rival 3 |Player Chose X|", Almuth → "Mega Trainer Almuth", Boss Wild blocks →
  Route9 / Ruins of Void / Cinder Volcano / Vivill Hideout (= Vivill Warehouse) / Distortion World / Crystal Peak.
  Ravonna "Kangaskhan1-4" and Ryuzoji / Kenlawa "Mimikyu1-3" are calc labels: strip ": ..." for the trainer.
- Ordinary-trainer workbook: 418 Name blocks, 1,000 Evo Names cells, 73 Held Item cells (column-aligned with the evo
  names). Pair blocks ("Skier Anna & Ruby [Double Battle]", "Camper Phillip & Picnicker Tina") mark each trainer's
  first Pokémon "[Anna's lead]": that splits the wiki's combined team. Trainer Items row (X Speed, Full Restore) → note.
  Spellings differ ("Picknicker", "Ferrothon", sheet "Anthisis City"): match on key + area, report loose matches.
- Wiki Trainer Locations includes the Mega Trainers and Expert Ryuzoji / Kenlawa: those rows are the sheet's boss
  cards (one card, counted present), not ordinary duplicates. Wiki levels are lower than Expert (Lily 49-52 vs the
  sheet's 57-60 at the Tessy cap).

#### Placement plan (walkthrough parts 1-40 on the wiki)

Mirskle 20: Frozen Heights (part 1, Rival 1), Icicle Cave (2, Rival 2), Route 2, Dresco Town, Route 3, Dresco Gym (4).
Vega 26: Grim Woods, Route 4, Cinder Volcano (5, Marlon 1 tag), Route 5, Crater Town, KBT Expressway (7, James), Crater
Gym. Alice 32: Ivory 1 + Zeph 1 (7, after Vega), Valley Cave, Route 6, Route 7, Frost Mountain (9, Rival 3), Route 8,
Blizzard City (Candice, "Level at Alice Cap"), Frozen Forest, Blizzard Gym. Mel 36: Route 11 (11), Cinder Volcano 2F
(Alexa, "Mel Cap"), Route 10 (12, Gruff), Route 9 (13, Ivory 2 tag, Shadow Warriors), Fallshore Gym. Maxima 40:
Thundercap Mt. (15, Marlon 2), Cinder Volcano 3F (Yale, "Maxima Cap"), Tarmigan Mansion (16). Galavan 45: Route 12 (17,
Rival 4), Dehara, Ruins of Void (18: Claydol, beasts, birds), Cinder Volcano (Light of Ruin Vega tag, Primal Groudon),
Shadow Base (19, Zeph 2), Dehara Gym. Big Mo 52: Routes 13-14 (21, Osean), Route 2 (Vivian & Mathis, "Big Mo Cap"),
Auburn Waterway (22), Thundercap (23), Great Desert (24), Vivill Woods / Warehouse / Distortion World (25: Aklove 1,
Shadow Warrior, Giratina), Routes 15-16 (26), Antisis City (27: Rory & Chad, Supply and Demand), Antisis Sewers /
Ferrothorn Turf (28, Barbs: minimum levels 57-59, above the cap), Antisis Gym (29). Tessy 57: Icicle Cave (29, Lily),
Route 10 (Ernesto), Route 11 (Timothy), Thundercap (30, Aloysius), Great Desert (Travon), Route 17 (31, Almuth),
Seaport City (31-32: Swizer & Bullo, Rogue Electivire), Polder Gym (33). Benjamin 61: Cootes Bog (34, Rival 5), Crystal
Peak (35: Zekrom / Reshiram with the rival partner, Ivory 3, Aklove 2, Marlon 3, Rayquaza / Hoopa), Magnolia Fields,
Redwood Gym (36). Elite Four 75: Route 18 (37, Reena), Victory Road (38, Sterling & Portia), League (39). Post-game:
Ruins of Void (40, Aklove 3 tag with Jax), Crystal Peak (Krystal), Redwood Forest (Ravonna), Frost Mountain 2F
(Ryuzoji & Kenlawa), Day Care (Annie), Blizzard City (Candice rematch); then Title Defense and Battleground sections
(Battle Frontier: no fixed teams found yet). Ordinary trainers: the area's earliest visit whose cap is at least the
wiki's highest level, moved to the walkthrough part that names the trainer when one does (Skier Charlie: parts 29-30).

### Caps (unit 6 source checkpoint)

All ten values independently re-read from `research-2026-10-29/trainer-index.xlsx`, worksheet LEVEL CAPS,
column D (Difficult Expert Insane). Not yet wired into Trainers or the walkthrough.

| Boundary | Cap | Cell |
| --- | ---: | --- |
| Mirskle | 20 | LEVEL CAPS!D2 |
| Vega | 26 | LEVEL CAPS!D3 |
| Alice | 32 | LEVEL CAPS!D4 |
| Mel | 36 | LEVEL CAPS!D5 |
| Successor Maxima (non-badge boundary) | 40 | LEVEL CAPS!D6 |
| Galavan | 45 | LEVEL CAPS!D7 |
| Big Mo | 52 | LEVEL CAPS!D8 |
| Tessy | 57 | LEVEL CAPS!D9 |
| Benjamin | 61 | LEVEL CAPS!D10 |
| Elite Four / first League | 75 | LEVEL CAPS!D11 |

Maxima must retain her own cap split between Mel and Galavan; do not collapse the two four-badge stages.
The shared cap split naming rule applies when implemented. No postgame 100-cap source row was found.

## Local storage

Prefix `unbound`. Keep these keys once published.

- `dex`: `unbounddex`
- `calc`: `unboundcalc`
- `track`: `unboundtrack`
- `walk`: `unboundwalk`
- `cap`: `unboundcap`
- `tr`: `unboundtr`
- `recent`: `unboundrecent`
- `pos`: `unboundpos`
- `mgm`: `unboundmgm`
- `loc`: `unboundloc`
- `items`: `unbounditems`
- `dmg`: `unbounddmg`

## Hack-only data

- Sprites: every species uses the shared set; `hack.json` -> `sk` points 8 forms at the shared art they share
  (Unbound's Alolan Exeggcute / Cubone and Galarian Koffing / Mime Jr. look like their base species; Hisuian Basculin
  is White-Striped; Eiscue Noice Face; Calyrex's riders). Pikachu Surfing and Flying: `sprites.json` has Emerald
  Imperium's art for them (the shared set lacks them; the user chose to reuse EI's, 2026-10-29, an exception to "a
  guide never copies another guide's art"). No art (type circle): Shadow Warrior.

## Checks

`uv run python -I tools/gate.py check unbound`

`uv run python -I hacks/unbound/extract/check.py`: dex counts (every mirror page placed, M and AB reproduced),
integrity, the wiki differences (EXPECTED), every species against the game's table (types, stats, abilities), GID
coverage. Units 4-7 add theirs. Calc stubs remain: calc is disabled.
Before enabling it, replace the null in tools/scenarios/calc-doubles.mjs EXPECTED with an audited count and add
tools/trainer_fields_check.py DOUBLES_EXPECTED (DOUBLES_PARTNER_ONLY if needed). The engine stub is registered
in tools/calc/package.json; review tools/calc/test.mjs field-profile fixtures. Never copy another hack's counts.
Review tools/itemstd.py RULES only for source-backed quirks; shared defaults need no entry.
Fill sources/watch.json, version/mode, GID/save reader and sprite additions by hand.

## History

TODO: document history.
