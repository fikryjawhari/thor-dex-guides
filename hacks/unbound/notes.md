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
  have no description anywhere. 23 abilities are Unbound originals (`AB[2]`, tag `cfg.orig` "Unbound"): the ones the
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

### Items

Unit 5 source-reader checkpoint (2026-10-29; extraction not implemented yet): additive readers in `wiki.py`
cover the 67 individual location pages, 687 item-list rows (requirements retained in their location text),
128 individual TM/HM pages, 34 Z-crystal rows, 72 key/evolution-item pages, 140 shop-stock rows, and 83
individual mission pages. The 29 tutors and 48 individual Mega Stone pages already have readers; the combined
Red Orb/Blue Orb page represents two items (49 stones/orbs total). RomHackDex has 352 individual item pages.

Acceptance question before building: the requested 129 TMs/HMs is category membership, not machine count.
The wiki has TM001 through TM120 plus HM01 through HM08, with no gaps: 128 machines. Its 129th category
member is the `TMs & HMs` index. The public 2.1.1.1 `location-guide.xlsx`, sheet `TM & HM`, agrees: 120 TMs
and eight HMs; its second `No.` header must not be counted. Recommendation: approve 128 as the machine
acceptance count, never create an extra item for the index page. There is no Wiki/Doc machine-count conflict.

Likewise, the 84 Missions-category records are 83 individual pages plus `All Missions`. Mission #001,
`A Hero's Journey`, has its requirements and post-game-access reward in the index, not an individual page.
Recommendation: account for all 84 missions using the index for #001, keeping non-item rewards out of IT.
Resume by implementing `items.py`, completing reward-field handling (some infoboxes use colspan/multiple
cells), normalising names/GID after finalise, adding checks, workbook comparisons and the requested browser
checks. No IT data, GID mappings or item-standard rules have changed at this checkpoint.

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
  is White-Striped; Eiscue Noice Face; Calyrex's riders). No art (type circle): Pikachu Surfing and Flying (the shared
  set lacks them; Emerald Imperium has its own), Shadow Warrior. `sprites.json` is empty.

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
