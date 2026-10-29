# Pokémon Unbound build notes

Scaffolded from `emerald-imperium`. Built so far: the dex (unit 3 of `plans/unbound.md`) and trainers (unit 6); locations, items
and the walkthrough are stubs that `build.py` skips (empty tables). Feature switches and cfg.txt wording still need
review by those units.

## Build

`uv run python -I hacks/unbound/extract/build.py` (then `python assemble.py unbound`). Order: `dex.py`, the stub
modules (skipped while they raise NotImplementedError), `finalise()`, then `gid.py` (GID indexes M as it ends up).
`extract/trainer_keys.json` was seeded by the first build with trainers (unit 6); later builds only add entries.

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

### Trainers (unit 6, 2026-10-29)

`extract/trainers.py` (TR), readers `bosssheet.py` (the Expert workbook) and `wiki.py` → `trainer_locations()`;
`check.py` → `trainer_checks` reproduces every count below from the raw sources.

**Boss teams: the Expert workbook** (`trainers-expert.xlsx`, D1). 439 numeric-level slots in 84 blocks (102 column
groups): Gym Leaders 45, Pokemon League 30, Rival 51, Team Shadow Bosses 39, Team Light Of Ruin Bosses 42, Boss Wild
Battles 18, Mega Trainers 63, Other Bosses 55, Title Defense 48, Battleground 48; 415 foe slots on 101 boss cards and
24 partner slots. One card per block (`BOSSES`, in walkthrough order); a pair block (Vivian & Mathis, Marlon & Grunt,
Ivory & Grunt, Rory & Chad, Swizer & Bullo, Sterling & Portia, Ryuzoji & Kenlawa) is split into one card each by its
"[X's lead]" marks, with a shared `bt`. Rival: one card per player starter (`t.st` Gible / Beldum / Larvitar, Rival!B1 /
I1 / P1 "PLAYER CHOSE ..."), Title Defense's three rivals likewise. Partners `pt` (Jax, Marlon, the rival); the rival's
"Starter (mega)" (Team Shadow K126, Light of Ruin K66, Lv 64) is one partner team per starter: Gible → Mega Tyranitar,
Beldum → Mega Garchomp, Larvitar → Mega Metagross, moves from the cell comments (K130 / K70, which differ: Garchomp
Stomping Tantrum vs Earthquake), ability from the "Sand Stream // Tough Claws // Sand Force" cell, item the stone,
nature and EVs from Rival 5's Mega ("check corresponding spread"); `x` says so.
Normalised (each in `x` or the report): "Hidden Power <Type>" → Hidden Power + `hp`; "Heatt Wave" (Mega Trainers!E205,
hzla too) → Heat Wave; "A / B" → `ao` (`a` = hzla's pick, else the first); "A → B" → `a0` / `a` (a random pre-Mega
"Swarm / Sniper → Adaptability" keeps the whole text in `ao`); "[1st lead]" / "[2nd lead]" → `ld`; "(pre-burned)" →
`pre` Burned; "(respawnable)" → `x`; Rival 2 Swinub "default moveset" → no moves, `x`. Boss Wild "Boosts" → `au`
(Claydol Def +3 SpD +1, the beasts Spe +1, Ho-Oh / Lugia, Zekrom / Reshiram, Omniboost +1 = all +1); "Raid Shields"
and "none?" → `x`. Route 9's "MOVES BLOCKED BY AURAS" sidebar → a trainer note. Block notes: the header's place text,
"Minimum levels (the sheet)." on Minimum Level blocks, "unsure" for Almuth, Trainer Items, "NOT UPDATED TO 2.1.0"
(Rory & Chad), and the Fight Gimmicks cell's comment (Fog, Negative Energy, Vicious Sandstorm, Shadowy Veil, Pixies,
Rainbow Battle). Gimmicks are tags (Double Battle, Tag Battle with X, Inverse Battle, Camomons Battle, Sky Battle,
Dynamax Battle, ...). All 130 cell comments are used (the build reports any that isn't).
**Metal Bash** (Rival 1 / 2 Beldum, Rival!P5 / Q24): the game's own move (MOVE_STEELYHIT, 40 BP Steel in hzla); the
dex merges the mirror's "Metal Bash" into Behemoth Blade (`tools/cfru.py` alias), so the card shows Behemoth Blade
with `x` "the sheet says Metal Bash". Needs a dex fix (a Metal Bash M entry); then drop the `x`.

**hzla** (`backups/unbound.js`, `formatted_sets["expert"]`, 383 sets): joined on (species id, label) with the sheet's
export label (minus " - Expert" / "[Expert]"; `LABEL_FIX` for Almuth, Rival 3, the Boss Wild blocks). 381 slots
joined (380 sets: the Route 9 Shadow Warrior pair shares one), 58 sheet only, 3 malformed hzla species keys (`[2nd` =
Light of Ruin Vega's Honchkrow, `Supply and Demand`, `Rogue Electivire`). Sheet only: no hzla team 50 (rivals 1-2 9,
the 24 partner slots, Alexa 5, Annie 6, Battleground Galavan 6); the malformed keys' teams 8 (Honchkrow 1, Electrode
×3, Rogue Electivire 4). Joined slots take hzla's IVs (all 31) and its differences as `hn` ("hzla says ..."): 16
slots differ, 15 shown: Champion Jax Salamence / Naganadel nature, Rival 3 Beldum Swinub EVs (hzla none), Rival 4
Beldum Gabite and Rival 5 Gible / Beldum / Larvitar moves, Marlon 2 four levels (hzla 1 lower), Aklove 3 Meloetta /
Manaphy ability, and two misattached hzla sets (Ravonna's Kangaskhan 4, Battleground Mel's Avalugg: every field).
The 16th, Champion Jax Magnezone, is hzla's EV key `def`, read as Defense: no difference shown.

**Unknown stats** (no speed on the card): no IVs on the 58 sheet-only slots and the Route 9 Shadow Warrior pair
(hzla's set has no `ivs`): 60; no EVs on the four partner Vaporeon (Team Shadow Bosses!J126, Team Light Of Ruin
Bosses!J46 / J66, Boss Wild Battles!F193: "252?" cells, raw in `x`). "?" items / natures are left out with the cell in
`x`: J126 / J66 Wacan Berry? Hardy?, F193 Leftovers? Hardy?, E193 Toucannon Sharp Beak?, G193 Mamoswine Occa Berry?.

**Levels.** A block's level row names its cap ("Level at Cap", "Level at Tessy Cap", ...). Where a mon's level cell
has a later-cap comment ("Benjamin Cap: 61 Elite Four Cap: 75"), the card shows it as `x` ("Lv 61 at Benjamin cap ·
75 at E4 cap"), and when every given level is cap + one offset and the sheet's level is the named cap + that offset,
the level is relative (`r`, `t.cap` = the split's cap; the card's "Your level" box moves it): 76 mons (Lily, Vivian &
Mathis, Yale, Ernesto, Timothy, Aloysius, Osean, Travon, Almuth, Alexa, James, Candice, Gruff, Rory & Chad, the two
Scientists, Swizer & Bullo). Kept absolute (9, a trainer note says so): **Reena** (sheet and hzla Lv 59-61 "at E4 Cap",
its notes 75-77 at the E4 cap: they disagree) and **Barbs** (minimum levels 57-59, above the Big Mo cap she's met at).
Every trainer in a capped box has `t.cap` = its box's cap.

**Ordinary trainers: the wiki's 309 rows** = 292 ordinary cards + 17 rows that are boss cards (the Mega Trainers,
Ace Trainer Alexa, Expert Ryuzoji / Kenlawa). Species and levels as the wiki gives them (typos: Aurora → Aurorus,
Scrappy → Scraggy, Wash Rotom → Rotom Wash; Youngster Ben's Nidoran ♂ from the workbook, Picnicker Nancy's Nidoran
unknown, shown ♀ with `x`), no moves (tag "Moves unknown"), no IVs / EVs; the wiki's place text is the first note.
The 15 name-only rows: 3 are boss cards (Vivian, Portia, Kenlawa), 12 get their team from the workbook (a pair block's
"[X's lead]" split, or their own block: Bird Keeper Reed, Ace Trainer Roland); none is "team unknown".
Ordinary-trainer workbook (`research-2026-10-29/ordinary-trainers.xlsx`): 287 of the 292 matched (area sheet + name;
"Picknicker" = Picnicker), 50 held items placed, the note "Scales with your level, evolving as it does: minimum Lv
N (workbook)." and Trainer Items; `x` where its species or minimum level differs from the wiki's. Pair blocks get a
shared `bt` ("Fought together with ...") and Double Battle when the block says so. Wiki and workbook team sizes
differ for Cyclist Gerald (1 / 2), Super Nerd Avery (3 / 4) and the Crystal Peak Science Society Scientist (3 / 2):
the wiki's team stands. **Workbook-only blocks: 143** (not added): Dehara City 15, Thundercap Mountain 12, Tarmigan
Mansion 12, Seaport City 11, Route 9 11, Fallshore City 11, Antisis City 11, Dresco Town 8, Blizzard City 7, Vivill
Warehouse 6, Crystal Peak 5, Route 10 / Redwood Village / Polder Town / KBT Expressway / Crater Town 4 each, Shadow
Base 3, one each in Valley Cave, Ruins of Void, Route 5, Route 17, Route 14, Frozen Heights, Frozen Forest, Frost
Mountain, Cinder Volcano, Bellin Town, Antisis Sewers (the build report lists every block).

**Placement.** Boxes are the cap splits (Caps below) then Post-game (Aklove 3, Krystal, Ravonna, Ryuzoji & Kenlawa,
Annie, the Candice rematch, Title Defense, Battleground; Battle Frontier left out). Each split's places in walkthrough
order (`SECTIONS`, the wiki walkthrough parts 1-40); bosses as `BOSSES` lists them, ordinary trainers before the
bosses of their place, at the area's earliest visit whose cap covers the team's highest wiki level. Route 3's three
fishermen (Lv 41-42, Surf) have no such visit: placed by cap in the Galavan split (report). Not done: moving a
trainer to the walkthrough part that names it (unit 7; `trainers_follow_walk` orders boxes once WK has stops).

**Field records** (`tools/trainer_fields.py`): 36 doubles (tags Double Battle / Tag Battle, partners), Arabella's
Permanent Misty Terrain, 11 records to review: Fog (Mirskle ×2), Permanent Tailwind for Flying-types (Alice ×2),
Permanent Magnet Rise (Galavan ×2), Trick Room for Weight (Big Mo ×2), Permanent Heavy Rain (Tessy ×2), Vicious
Sandstorm (Moleman). Not evidence yet (no CANDIDATE word): Negative Energy, Shadowy Veil, Pixies, Rainbow Battle,
Inverse / Camomons / Sky / Dynamax Battle, Marlon 2's "Rain": unit 8.

**Trainer keys**: `extract/trainer_keys.json`, seeded by the first build with trainers (393 trainers, keys "g.s.t" as
they were); rematches are distinct by place / team. Saved state uses them only.

### Caps

`trainer-index.xlsx` → LEVEL CAPS, column D (Difficult / Expert / Insane), re-read and asserted on every build:
Mirskle 20 (D2), Vega 26 (D3), Alice 32 (D4), Mel 36 (D5), Successor Maxima 40 (D6, not a badge: its own split),
Galavan 45 (D7), Big Mo 52 (D8), Tessy 57 (D9), Benjamin 61 (D10), Elite Four 75 (D11). `TR.caps` lists them; boxes
`<Boss> Split [Cap N]` (Maxima Split [Cap 40]), `Elite Four Split [Cap 75]`, `Post-game` (no cap: no postgame cap row
exists). The first box's note says once that boss levels are at the cap unless a trainer says "minimum levels".

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
coverage; trainers (`trainer_checks`: the sheet's slots per worksheet on the cards, the hzla join and its
explained differences, the wiki's 309 rows, LEVEL CAPS, unknown-stat slots, relative levels). Units 4, 5, 7 add theirs. Calc stubs remain: calc is disabled.
Before enabling it, replace the null in tools/scenarios/calc-doubles.mjs EXPECTED with an audited count and add
tools/trainer_fields_check.py DOUBLES_EXPECTED (DOUBLES_PARTNER_ONLY if needed). The engine stub is registered
in tools/calc/package.json; review tools/calc/test.mjs field-profile fixtures. Never copy another hack's counts.
Review tools/itemstd.py RULES only for source-backed quirks; shared defaults need no entry.
Fill sources/watch.json, version/mode, GID/save reader and sprite additions by hand.

## History

TODO: document history.
