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

### Locations

`locs.py` (LOC, AR, P.w, P.g). Sources: the wiki's 67 location pages (Wild Pokémon tables: floor, method, time, rate;
54 pages have 1,161 rated rows), its 32 raid den pages, the Legendary Pokémon, Mystery Gift Codes and Swarms pages; the
public 2.1.1.1 location guide workbook (`.src/research-2026-10-29/location-guide.xlsx`) is the cross-check ("Doc
says"); the RomHackDex location pages only a membership report. No source has wild levels: the guide shows none.

- **Areas:** 69 = Starter (the picker; Beldum / Gible / Larvitar at Shadow Base) + the 67 wiki pages in walkthrough
  order (the Parts' headings, Part 1-40; post-game Battle Frontier and Cube Corp. last) + Mystery Gift. One tracker slot
  per area (EI's floor rule): floors, sub-places (Rift Cave in Dehara City, Tomb of Borrius in Great Desert, Safari Zone
  in Polder Town, Cave of Being in Route 10, Distortion World via the Rift Cave portal) and raid dens are sections.
  No slot (AR.ns): Tarmigan Mansion, Antisis Port, Ferrothorn Turf, S.S. Marine, Battle Frontier (no encounters in any
  source) and Mystery Gift (codes, any Pokémon Center after the Elite Four). New areas go at the end of AR (saved
  trackers are keyed by AR index).
- **Rated rows** -> AR.es: a floor is a section with a group per method (· qualifier), a page without floors gets a
  section per method (· qualifier). Day / Night rows share one row, r [day, night]; "Requires Gen 8 Activation" ->
  "· Gen 8", Safari Zone modes -> "· Easy" etc.; Special Encounter = DexNav. One row is listed twice in one table and
  summed. 22 tables don't total 100% as the wiki gives them (Route 3 Good Rod 120%, Epidimy Town Old Rod 200%, Route 14
  / 15 / 16 Super Rod 80%...; report: WIKI RATE TOTALS): shown as given.
- **Other wiki rows** (gifts, statics, trades, fossils, Game Corner, missions, swarms: 247) are P.w rows with the
  wiki's time cell as the note. Swarms: the wiki's rate-less Swarm rows get the Swarms page's hour for each day of the
  month; area note "Swarm: 50% ... one swarm at a time" (the Swarms page).
- **Raid dens:** a section per den, a group per star level as listed; a Gigantamax species is its base with
  "Gigantamax"; the den's access text (its lead "The X Raid Den is found" trimmed) is the area note. 462 rows.
- **Legendary page:** 40 rows the location pages lack, worded as the page has them (Entei / Raikou roam from the Tomb
  of Borrius portal: Great Desert; Tornadus / Thundurus: Magnolia Fields; Latios / Latias: Fallshore City; Phione:
  Ruins of Void with Manaphy). Wiki says two places for Deoxys (location page Route 5, Legendary page Route 13 with
  Jirachi), Magearna (Frozen Heights reward / Tomb of Borrius mission), Entei and Raikou (Ruins of Void / roaming):
  both shown.
- **Mystery Gift:** the 34 codes (reward, code, held item); "Mega" rewards are the base species holding the stone.
- **Doc says** (the workbook lists it, the wiki doesn't; shown in the area with "Doc says"): 52 wild rows (88 cells:
  Rift Cave's ghosts, Tomb of Borrius's Unown / Sigilyph, Victory Road B1F's fire types, Epidimy Town and Antisis City
  surfing and fishing, Thundercap Mountain outside Rock Smash, DexNav rows for Indeedee F, Eiscue, Galarian Weezing,
  Drizzile, Dracovish, Arctovish...) and 21 gifts / statics (the other two Borrius starters post-game at the Rival's
  House and Shadow Base, daily Lombre / Voltorb / Electrode in the gyms, Trubbish at Antisis City, the Shark Bait
  Sharpedo, Carbink, Snorlax / Zoroark in Redwood Forest, the Magnolia Café eggs). Matched: 1,101 wild
  cells, 54 gift / static / trade / Game Corner cells, 78 of the legend sheet's species. The workbook's swarms and wild
  held items agree with the wiki (0 differences). Full list: report.txt -> LOCATION SOURCE DIFFERENCES.
- **Gen 8:** areas with Gen 8 rows note "register any Galar Pokémon first (a trade, or a Mystery Gift after the Elite
  Four)" (the wiki's Activate Gen 8 Encounters page).
- **RomHackDex** (report only): its 94 location pages fold into 52 of our areas with differences; 297 species we
  list that it lacks (mostly fishing / surfing and Gen 8 rows) and 40 it lists that no other source has here: 16 more
  Safari Zone species (Blitzle, Kangaskhan, Tauros...; the wiki and the workbook agree without them), Cinder Volcano's
  Camerupt / Excadrill / Heatmor / Magmar (the wiki has them in Cinder Volcano Depths), Minior Blue Core / Grim Woods
  Pumpkaboo Average (form choices), Route 7 Raticate (the wiki: Alolan), and a few single rows. Not added.
- **Names:** "Balloon Pikachu" (the wiki), "Flying Pikachu" / "Surfing Pikachu" are Pikachu (Flying) / (Surfing) here (`locs.NAME_FIX`;
  `common.location_aliases` maps "Flying Pikachu" to Pikachu, unit 3's), "Indeedee♀️" is Indeedee (Female).
- **Availability (P.g):** EI's rule (any row, plus evolution families both ways; a form change follows its base): 30
  not found: Pikachu's five cosplay forms and Cosplay, Alolan Cubone, Unfezant / Frillish female, Pumpkaboo / Gourgeist
  Large and Average, Zygarde 10%, Wishiwashi School, Minior (Core), Toxtricity Low Key, Zacian / Zamazenta (both forms),
  Eternatus, Kubfu, both Urshifu, Glastrier, Spectrier and the three Calyrex.

### Items

`items.py` from the unboundwiki.com export (`wiki.py` readers); the 2.1.1.1 `location-guide.xlsx` (TM & HM,
Megastone, Z-Crystal sheets) cross-checks it in `check.py`. IT after the Items standard (1,241 rows): Valuables 419,
Key Items 32, Shops 204 items, TMs and HMs 128, Move Tutors 192, Held Items 97, Evolution Items 35, Stats and
Abilities 17, Mega Stones 49, Z-Crystals 34, Useful NPCs 34. No `itemstd.RULES` entry: the extract writes the
`Found:` / `Also:` / `Wild:` lines itself.
- **Locations pages** (67 pages, 66 with an item table, 687 rows; KBT Expressway has none): every row is placed. A row
  reads `Found: <page title> · requires Rock Climb · hidden · <the wiki's place text>`; `(Gift)` rows are `Also:`.
  The wiki's flags become words: `requires X` (HMs, ADM, the Crystal Peak crystals, Mission #070), `hidden`,
  `repeatable daily`, sub-places ("Fallshore Beach"), and the item name's own brackets ("gate opens 12pm", "x5").
  Valuables keep one row per place (sub-heading = the item); other boxes merge an item's places into one row.
  TMs / HMs, Mega Stones and Z-Crystals on these pages only cross-check their own pages (check.py: every number,
  stone and crystal matches). `items.PLACED` keeps every row's page title for the walkthrough (unit 7).
  Two rows list several items: Tehl Town's Underground Pass (15 hidden items, "one spot per item") and Shadow Base's
  "Metagrossite or Tyranitarite or Garchompite" (the two stones the starter didn't give; Mega Stones has them).
- **TMs and HMs**: the 128 machine pages (TM001-TM120, HM01-HM08; the TMs & HMs category's 129th member is its
  index page). Text = the page's Location; `needs ...` from its prerequisites (HMs, bicycle) and the HMs' badge.
- **Mega Stones / orbs**: the dex's P.stone / P.sloc (49, Red / Blue Orb included; Rayquaza has none). Wiki says
  "Houndoomite"; the game (Unbound-Cloud) says Houndoominite, which IT and P.stone use.
- **Z-Crystals**: the Z-Crystals page (34). Doc says Incinium Z exists but is "Currently Unavailable"; the wiki leaves
  it out and so does IT.
- **Key and evolution items**: their item pages give the places the Locations pages lack (20, listed in report.txt:
  S.S. Ticket, Mega Keystone, Shiny Charm, Old Rod, ...), raid drops (`Also: Route 12 Raid Den · raid drop`), wild held
  items (`Wild:`), Mystery Gift, the Fallshore evolution-item merchant and BP prices. Town Map and Costume Box are left
  out (Items standard: no value).
- **Shops**: All Shop Inventories (140 stock rows: marts by badge, the second clerks, Dehara Dept. Store floors, the
  Fallshore / Seaport bazaars), the Battle Frontier page's three Exchange Service vendors (BP, post-game) and the
  Fallshore evolution-item merchant (item pages). Wiki says Up-Grade costs 32 BP at the exchange; the Battle
  Frontier's vendor list doesn't have it (kept, from the Up-Grade page). Sea / other incenses: "post-game only".
- **Mission rewards**: 83 mission pages + `All Missions` (#001 A Hero's Journey: post-game access, no item). 70 item
  rewards; each reads `Also: Mission #021 Extreme Hyperosmia · Route 5, Pokémon Day-Care` (× quantity). Rewards that
  are TMs, Mega Stones or Z-Crystals are in those boxes' own text. Left out: Pokémon / eggs, services (Lucky Egg,
  Amulet Coin, DexNav upgrades, nature change), BP, the HeartGold / SoulSilver costume, #027 (no reward).
- **Move tutors**: the Move Tutors page, 29 tutors, 192 rows (one per move and tutor: `tutor · place · cost (days) ·
  requirement`). Six moves are in no species' tutor list (Draco Meteor, Dragon Ascent, Relic Song, Secret Sword,
  Steel Beam, Volt Tackle): the Battle Frontier page says the Draco Meteor trainer "teaches any Dragon-type with max
  friendship" (on that row); for the other five ("Ancient Moves") no source names the learners, so they are listed
  with their tutor only. Their move pages show the tutor and no learners.
- **Useful NPCs**: the 34 Useful NPC pages (`<NPC>: purpose · cost · where`).
- **Names** (`items.canon`): the game's names (Unbound-Cloud `src/data/ItemNames.json`), the official one where it
  differs. Wiki spellings fixed: CFRU short names (Nevermeltice, Parlyz Heal, Terrain Ext., Protect Pads, Whip Dream,
  Heavy Boots, Utility Parasol, Adrenal Orb, Charizite X, Aerodactite, Alorichium Z, Ultranecronium Z; TMs "Dazzle
  Gleam", "Power-Up Hit", "Drain Kiss" take the machine pages' move names), plurals / "(x5)" quantities, typos in the
  shop list (Pomeg betty, Pinab Berry). Kept as the wiki names them (no game item): Zygarde Cell, Sea Salt, Sea Shell,
  "Random healing item", Money (₽10,000), Silvally Memory (random), the key items Unbound-Cloud doesn't list.
- **GID items**: `gid.py` renames Unbound-Cloud's names to IT's (`items.GAME_ITEMS`: Hp Up, Guard Spec, Dream Mist
  (Unbound), Heavy Duty Boots); check.py: every game item that is in IT is spelled as IT spells it (350 of them).

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
  is White-Striped; Eiscue Noice Face; Calyrex's riders). Pikachu Surfing and Flying: `sprites.json` has Emerald
  Imperium's art for them (the shared set lacks them; the user chose to reuse EI's, 2026-10-29, an exception to "a
  guide never copies another guide's art"). No art (type circle): Shadow Warrior.

## Checks

`uv run python -I tools/gate.py check unbound`

`uv run python -I hacks/unbound/extract/check.py`: dex counts (every mirror page placed, M and AB reproduced),
integrity, the wiki differences (EXPECTED), every species against the game's table (types, stats, abilities), GID
coverage. Locations: every rated wiki row in P.w (method, rate, time, floor), the sections reproduce the wiki's rates, every species resolves, one slot per area, the counts (`LOC_EXPECTED`). Units 5-7 add theirs. Calc stubs remain: calc is disabled.

coverage. Items (`check_items`, ITEMS_EXPECTED): the wiki counts (67 Locations pages / 687 rows, 128 machines, 49
stones, 34 Z-Crystals, 29 tutors, 140 shop rows, 83 missions, 34 NPCs), every Locations row's place a page title and
its item placed there, the GID item names, the workbook's TM / Mega Stone / Z-Crystal sheets. Units 4, 6, 7 add theirs.
Calc stubs remain: calc is disabled.
Before enabling it, replace the null in tools/scenarios/calc-doubles.mjs EXPECTED with an audited count and add
tools/trainer_fields_check.py DOUBLES_EXPECTED (DOUBLES_PARTNER_ONLY if needed). The engine stub is registered
in tools/calc/package.json; review tools/calc/test.mjs field-profile fixtures. Never copy another hack's counts.
Review tools/itemstd.py RULES only for source-backed quirks; shared defaults need no entry.
Fill sources/watch.json, version/mode, GID/save reader and sprite additions by hand.

## History

TODO: document history.
