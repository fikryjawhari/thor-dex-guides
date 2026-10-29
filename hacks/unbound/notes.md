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
  Typhlosion), Metal Bash (the game's MOVE_STEELYHIT; notes → Trainers); the mirror's data for the first two isn't Ceaseless Edge's / Infernal Parade's.
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
  `common.location_aliases` agrees), "Indeedee♀️" is Indeedee (Female).
- **Availability (P.g):** EI's rule (any row, plus evolution families both ways; a form change follows its base) and
  `locs.VARIANTS` (female Frillish / Unfezant, Pumpkaboo / Gourgeist sizes, Toxtricity Low Key, Minior's core,
  Wishiwashi School follow their base: no location names them). 21 not found, and **pruned** (`prune.py`, EI's rule;
  the user's call 2026-10-29): Pikachu's five cosplay forms and Cosplay, Alolan Cubone, Zygarde 10%, Zacian / Zamazenta
  (both forms), Eternatus, Kubfu, both Urshifu, Glastrier, Spectrier and the three Calyrex. A save holding one imports
  without it (GID maps it to nothing).

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

### Damage calc

#### Mechanics (unit 8b)

`cfg.calc` uses the Gen 8 `cfru` base, keeps EVs, enables Z-moves and the existing Mega-form controls,
and selects the `cfru` save reader. No Dynamax. Storage keys are unchanged.
Reference: hzla `ff6c3e339e276e6b4e8e44db58750b6534bc26aa`, Unbound profile plus `gen789.js`;
the source files are reference-only, not copied into the engine. `tools/calc/unbound_oracle.mjs` runs the pinned
local calculator with its Expert adapter and independent move flags. `unbound_expected.json` records all 16 rolls
per hit for 85 cases; `unbound_check.mjs` is already registered in `npm test`.

82 cases match exactly, including Vicious Sandstorm's Ground/Rock special defence, Weather Ball, Solar Beam/Blade,
Sand Force, Grass Dash / Slippery Tail priority (also at 1 HP, Psychic Terrain and Dazzling), Bellow / Sound Waves,
Crabby Tactics, Honey Armor, Multieye / Multiscale / Shadow Shield (hazards, boots, damaged HP, Flying and multihit), Icy Skin / Dusty Scales,
Portal Power, Evaporate, Drill Beak, Shadowy Veil, Gen 8 crit/burn/EV/Z baselines and all three custom moves.
The stock-equivalent aliases are behaviour mappings, not copies of hzla's profile.

Three disagreements are explicit regression expectations, not waived comparisons: the user confirmed Brain Bond
as Gen 7+ Parental Bond (quarter-power child) and Face Shield as Gen 8 Dauntless Shield (+1 Defence every entry);
Subterfuge changes type for its move (Protean). hzla recognises none of those names and returns unmodified damage.
Honey Armor's description says entry defence, but hzla doubles physical defence (Fur Coat): the calc follows hzla.
Vicious Sandstorm is selectable, with normal sand mechanics and 1/8 HP residual; its permanence is a trainer-field
decision, not globally applied. Shadowy Veil halves damage against Ghost types, matching the profile.

Focus Belt and Nine Lives are **assumed Sturdy**, as agreed with the user. Knockout boosts use Moxie (Pride),
Chilling Neigh (Fiery / Shocking Neigh) and Grim Neigh (Royal Roar); Cotton Cloud / Tangling Wool use Cotton Down.
Those action effects are tested separately: hzla's damage-only oracle does not simulate a knockout or a later turn.
Endless Edge / InfernalRage / Metal Bash keep their guide power/type/category, rather than aliasing differently named
official moves. InfernalRage's supplied 1 BP and Fire typing are surprising but match this reference input; an
in-game check is still needed before changing game data.

In-game tests left: every custom ability alias, Brain Bond's second-hit ratio, Honey Armor vs Face Shield's timing,
Focus Belt / Nine Lives survival and bypass, Vicious Sandstorm chip/permanence, the three custom moves, and Z/Mega
battles. The oracle is evidence of calculator behaviour, not an independent run of Unbound's battle engine.

The Brain Bond 1/4 child and Face Shield +1 entry stage are settled user decisions (2026-10-30), overriding hzla's
no-effect custom names. They are not numeric claims made by the short game descriptions. Cotton Down aliases
only simulate the two displayed battlers, not an absent ally's Speed. InfernalRage's description also claims doubled
power on a statused target; neither this calc nor the pinned oracle implements that custom-name effect yet.

The hazard fixtures exercise real `isSR` / `spikes` inputs on both engines. `battleField` and the oracle adapter now
map the existing public `defStealthRock` / `defSpikes` keys into those properties: without that mapping both engines
would appear to agree while neither tested the hazard branch. The fixtures additionally assert that hazards change
the shield's damage, and Boots restore the full-HP result. Rock/Ground SpD fixtures use Flamethrower, not a Psychic
attack against Dark-type Tyranitar (which would prove nothing).

| Fixture (level 50 Mew unless the case names another species) | Our damage | hzla damage |
| --- | --- | --- |
| Gen 8 neutral / critical / burn | 16-19 / 23-28 / 8-9 | same |
| Gen 8 EVs / Z Tackle | 20-24 / 39-46 | same |
| Vicious Weather Ball / Solar Beam / Solar Blade | 39-46 / 23-28 / 24-29 | same |
| Vicious Sand Force Earthquake | 50-59 | 50-59 |
| Vicious SpD Garchomp / Tyranitar / Rhyperior / Mew | 13-16 / 11-14 / 18-22 / 34-41 | same |
| Grass Dash Energy Ball / Slippery Tail Iron Tail | 34-41 / 39-46, priority 1 | same |
| Bellow / Sound Waves Hyper Voice attack / defence | 45-53 / 17-20 | same |
| Multieye / Multiscale / Shadow Shield full / rocks / spikes / Boots | 12-15 / 25-30 / 25-30 / 12-15 | same |
| Crabby Tactics Tackle / Honey Armor defending Tackle | 23-28 / 8-10 | same |
| Icy Skin / Dusty Scales defending Psychic | 12-15 | 12-15 |
| Portal Power defending Psychic / Evaporate defending Surf | 19-22 / 0 | same |
| Drill Beak Drill Peck / Shadowy Veil Gengar defending Psychic | 46-55 / 66-78 | same |
| Brain Bond Tackle | 16-19 + 4-5 | 16-19, one hit |
| Face Shield defending Tackle | 11-13 | 16-19 |
| Subterfuge Flamethrower | 51-61 | 34-41 |
| Endless Edge / InfernalRage / Metal Bash | 46-56 / 1-2 / 23-28 | same |
| Vicious end-turn chip on 175 HP Mew | -21 HP (sheet's 1/8) | 0 HP; ordinary Sand is -10 HP |

The residual discrepancy is separate from the three damage-roll disagreements. The harness runs hzla's own
`getEndOfTurn` in its VM (test-only export, no oracle source changes): Vicious has no chip branch there. The positive
ordinary-Sand control proves the harness measures weather chip. This calc follows Moleman's sheet comment for 1/8.
All 85 named inputs, negative cases, exact per-hit distributions and priority values are in
`tools/calc/unbound_cases.mjs` / `unbound_expected.json`; the table is only a readable index, not a weaker min/max check.

#### Unit 8c gimmicks and independent ledger

User decisions dated 2026-10-30 supersede the old 8b proposals. `tools/trainer_fields.py` applies Fog, typed
Tailwind/Magnet Rise on both sides, weight Speed, Camomons, locked Heavy Rain/Vicious Sandstorm, Shadowy Veil,
Inverse, Negative Energy, Pixies, Rainbow, and ordinary Rain. Rebuilt data has **27 gimmick evidence records,
zero review flags**; Doubles remains 36 cards, 34 tag-backed and 2 partner-only. Unknown Sky/Dynamax/Butterfree
rules are explicitly text-only, not guessed mechanics. Other guides' data and fixtures were not rewritten.

Authority: Expert workbook's Fight Gimmicks cells/comments and the user's answers. Alice `Gym Leaders!B42` /
`Battleground!B42`, Galavan `B102` / `B82`, Big Mo `B122` / `B102`, and Tessy `B142` / `B122` have **no comments**.
Tessy's cell says only `Camomons Battle, Permanent Heavy Rain`; the first-two-move typing definition is the user's
Smogon-format answer, corroborated by the saved official controls (`UpdateCamomons`, lines 510-531), which copy
each side's first two displayed move types into that side's type selectors. Equal types collapse to one.
Mirskle comments (`Gym Leaders!B2`, `Battleground!B2`) say Fog reduces accuracy 40%, exempts Keen Eye/Infiltrator/
Utility Umbrella, returns after temporary weather, and is permanently removed by Defog. The 20% Battle Frontier
exception is not applied to Battleground. Moleman `Pokemon League!B2` says sand chip 1/8, unremovable, with Ground
Sp.Def boosted alongside Rock. Elias `Pokemon League!B22` explicitly limits Ghost half damage/hazard immunity
to full HP and blocks non-Ghost Safeguard/Substitute. Vega `Gym Leaders!B22`, `Team Light Of Ruin Bosses!B3`,
`Battleground!B22` describe 8.33% chip except Dark/Ghost/Psychic and Unaware/Oblivious/Magic Guard. Arabella
`Pokemon League!B42` says Fairy entry +1 lower defence (Def on tie). Penny `Pokemon League!B62` says Dragon
secondary chances double, including Poison Touch; stack with Serene Grace except flinches. Marlon
`Team Shadow Bosses!B83` simply says Rain (no comment, no permanence claim).

`tools/calc/unbound_gimmicks.mjs` is part of `npm test` via `unbound_check.mjs`. Its roll reference is independent:
level-50 base damage `B=floor(floor(22*power*Atk/Def)/50)+2`; rolls 85..100 apply floor(random), half-down STAB,
effectiveness, then half-down final modifiers. It asserts **all 16 rolls**, not just the readable ranges below.
Mew: 175 HP and 120 in other stats, Hardy/31 IV/0 EV. No oracle output is copied into our hand expectations.

| Fixture group | Hand computation and checked result | Authority / second oracle |
| --- | --- | --- |
| Brain Bond | Tackle B=19; first 16-19. Child half-down(19/4)=5 before random, 4-5. Multi-hit distributions remain separate. | User; **hzla says** one hit 16-19. Official native Brain Bond also one hit; its standard Parental Bond exactly matches our alias. |
| Face Shield | Defence 120 -> 180 on entry; B=13, 11-13. `entry:false` restores 16-19; fresh entry gives +1 again without mutating the input. | User; **hzla says** no boost, 16-19. Saved official Face Shield agrees with +1. |
| Weight Speed | floor(135.5)=135 Abomasnow; floor(185)=185 Mega Abomasnow; floor(6)=6 Pikachu; floor(6.9)=6 Bulbasaur. Mew 4 vs Pikachu 6 gives Gyro Ball floor(25*6/4)+1=38 BP. | User; saved official matches all four unmodified speeds. Literal final replacement ignores stages/items/paralysis/Tailwind; modifier-order disagreement below. |
| Typed Tailwind | Charizard Speed 120 -> 240, Mew stays 120, both sides. Gyro Ball vs doubled Charizard =51 BP; Camomons Flying changes eligibility. | Alice cell value + user; shared stock Tailwind applied only to matching current types. |
| Typed Magnet Rise | Ground move vs Electric Pikachu / Steel Metagross =0; nonmatching Mew takes damage. Gravity/Iron Ball/Grounded override immunity; matching player's Spikes/Toxic Spikes/Web do not apply. | Galavan cell value + user. Hand immunity assertions; not a claimed official typed-field match. |
| Camomons | Mew Flamethrower/Ice Beam -> Fire/Ice; opponent Vine Whip/Tackle -> Grass/Normal. 90 BP B=41, Fire STAB x1.5, Grass weakness x2 =>102-122. Original Psychic STAB disappears (34-41 into Grass/Normal). | User format; no sheet comment. Saved official selector behaviour agrees; equal 90 BP inputs agree exactly. |
| Heavy Rain / lock | 90 BP Surf B=41 -> half-down(41*1.5)=61 before random =>51-61; Fire =0. Conflicting Sun/manual/Drought setter cannot replace the active lock. | Tessy + user; official Fire =0. Ordinary Marlon Rain gives same Surf boost, but has no lock. |
| Vicious Sandstorm / lock | 110 HP Pikachu loses floor(110/8)=13; Mew 175 loses21. Lock keeps custom divisor and Ground Sp.Def modifier even with conflicting Sun input. | Moleman comment; original exact hzla damage fixtures retained. **hzla says** zero Vicious end-turn chip. |
| Mel Inverse | Actual Mel lead (Normal) takes no ordinary Shadow Ball, x2 inverse Shadow Ball and x0.5 inverse Fighting. Levitate Ground immunity survives inverse. | User; existing per-type inverse rule, same mechanism as Photonic/Eternal; saved official equal-input inverse rolls agree. |
| Shadowy Veil | Psychic into Gengar: Sp.Def95, B=52, Mew STAB x1.5, Poison weakness x2 =>132-156; full-HP veil halves to66-78. At134/135 HP no veil. First of two hits halves, second does not. Full HP ignores all hazards; damaged HP takes them. | Elias comment; old full-HP hzla fixture still matches. Saved official **says**66-78 even when damaged, contrary to sheet. Non-Ghost Substitute HP action is refused; API lists both blocked moves. |
| Fog | Accuracy multiplier0.6, exempt abilities/active Umbrella1.0; Klutz suppresses Umbrella. Damage-neutral Tackle stays16-19. | Mirskle comment. Chance metadata only, no invented damage/accuracy simulation. |
| Negative Energy | floor(110/12)=9 HP per turn on Pikachu; immune typings/abilities0, separate from weather and stacking with sand. | Vega comments; repeating 8.33% interpreted as standard 1/12 residual, rounded down with minimum1. |
| Pixies | Clefable Defence93 < Sp.Def110: +1 Def ->139; Mew Tackle B=17 =>14-17. Mawile Defence105 > Sp.Def75: +1 Sp.Def. Camomons Fairy Mew ties120 -> Def. | Arabella comment; both sides, `entry:false`, Simple +2 and Contrary -1 tested through normal stage engine. |
| Rainbow | Dragon ordinary secondary10% ->20%; Dragon+Serene Grace30% ->100% (capped), flinch30% ->60% (not120%), Poison Touch30% ->60%. Non-Dragon unchanged except its own Serene Grace. | Penny comment. `fieldEffects` exposes multipliers, `secondaryChance` calculates percentages; it does not simulate random outcomes. |

The optional saved official page **exists and was used**, not fetched around host protection. `unbound_saved_oracle.mjs`
executes only local engine/data scripts in a VM with no filesystem/network require. `unbound_official_manifest.json`
pins 32 SHA-256s (31 executed scripts plus the read-only Camomons UI source); raw page/JS remain ignored `.src/`.
The tests keep native source disagreements visible: official Flamethrower is95 BP (B43, Camomons108-128), not
the guide's90 BP (B41,102-122); equal-input90 BP comparison separately passes. Official native Brain Bond is a
no-op, Face Shield is recognised, and Shadowy Veil is always-on for Ghosts. The player's confirmed Brain Bond /
Face Shield answers and sheet's full-HP Shadowy Veil rule win here. These are calculator comparisons, not in-game proof.

**Open questions, finish in the main chat:** Sky Battle (`Mega Trainers!B241`, Almuth7.5.9), Dynamax Battle
(`Other Bosses!B141`, Scientist7.6.2), Benjamin Butterfree metagame (`Gym Leaders!B162`, `Battleground!B142`,
Benjamin8.3.0/10.7.7) all have **no comments defining a rule**. Keep visible labels, ask for rules before enabling
new behaviour. Dynamax trainer tag also conflicts with the earlier raids-only/no-calc-Dynamax decision.
**Weight modifier ordering:** literal user final Speed=floor(kg) is implemented, so Scarf Abomasnow remains135;
official first substitutes weight then applies Speed modifiers, giving202. Both expectations are tested explicitly.
Recommend retaining the literal answer until the user chooses otherwise; do not call this parity.

#### D2 and template integration (main-chat pass, not built here)

Exact function/state/control/persistence spec: `plans/unbound.md` -> Findings -> **Unit 8c: engine/data and exact UI
handoff (for the main chat)**. It names `areaField`, `updateField`, `fieldHTML`, `toEngine`, `resolve`, `effSpe`,
`entered`, `newFight`, `fieldFor`, `clearAreaFog`, all engine keys and stable `ST.areaByTrainer[t.k]` effect keys.
Keep the existing `unbounddmg` storage key. Current `calc.js` still ignores the new field kinds: **engine/data
completion is not end-to-end UI completion**. No UI/browser/gate checks were run in unit8c.

Unit8c checks: full `npm test` passes (other guides' expected rolls unchanged), `trainer_fields_check.py unbound`
passes27 source gimmick records/zero review, Unbound extract build/check pass, and `python assemble.py` builds
all six guides. Existing missing-sprite notices are unchanged (BB2R's four custom species and Unbound Shadow
Warrior). Logs: `.tmp/unbound-gimmicks/`. No full gate, browser sweep, push or merge.

D2 is implemented only on the data side, as the task's no-template limit requires:
`tools/calc/unbound_assumed.mjs` computes four most recent distinct level-up moves at the resolved level, Hardy,
31 IVs and 0 EVs, preserving species/held item and source objects. It never replaces supplied moves. `cfg.calc.assumedSets`
is `level-up`; the caller must restrict this to ordinary `Moves unknown` cards. All 292 ordinary cards remain unknown
on the trainer page (unit 6 reconciled the original 310 target: 309 catalogue rows = 292 ordinary + 17 boss rows).
No guessed data or data positions are written to localStorage by this helper.

**Template handoff:** `calc.js` `foeBase` must call that helper after `monLv`, before constructing the calc-only set,
carry `mGuess` / `naGuess` / `ivGuess` / `evGuess`, and show a short visible `Assumed` marker and tooltip for those
fields. Clear a guess when that field is explicitly edited; Reset restores it. Recompute the defaults when the
cap changes without replacing manual edits. `aGuess` already marks an unknown ability, but no moves/IV/EV/nature
guess marker exists. Do not fill `TR.p.m`, change trainer cards or save data indices. The D2 page scenario stays
strictly failing until this integration exists; it is not skipped or asserted against the current empty moves.

Other template gaps: `importBytes` rejects a boxes-only save before mapping boxes (unit 8a's NG+ case); inspect both
party and boxes before emitting `empty`, allow selecting a box when party is empty or entirely unmapped. The new
engine APIs and accepted field records still need the UI hooks and lock/layer handling specified in the plan.

Historical unit8b browser status (not rerun by8c): layout/import/field/smoke pass; Mega/Z-holder/field-review checks pass at every
viewer size, normal and dvkb. D2 fails pending the forbidden template hook. Existing generic scenarios also expose
fixture assumptions: `trainerRoles` treats partner-backed Vega (5.3.0) as singles, controls assumes the fixture's
Cloyster outspeeds its opponent, and `calc-zmove` hardcodes Photonic's absent `totem-gumshoos` plus Totem-only tests.
Those are not fixed or weakened in this unit. EI and BB2R smoke/field regressions pass after the shared engine change.

#### Save import

Reader `cfru` (profile `unbound21`, signature 0x01121999 = Unbound 2.1.0-2.1.1.1); format: `template/calc/readers/README.md`
→ cfru. Unit 8b enables `cfg.calc.save = "cfru"` with the calc profile. IDs: `GID` above
(no `ab`: the reader returns the ability slot, resolved as the game does against the guide's species).

Checked 2026-10-29 against both oracles, Unbound-Cloud (Skeli789's) and hzla's reader, on the 37 local saves with the
2.1 signature (`.src/saves/Unbound-Cloud/`, from Unbound-Cloud's tests, not committed): every party and box slot, 0
unexplained differences (`node tools/calc/cfru_oracles.mjs && node tools/calc/cfru_compare.mjs`; the regression check
`node tools/calc/cfru_check.mjs` asserts the oracle-written fixtures in `hacks/unbound/.src/saves/expected/` (git-ignored: they describe UNLICENSED saves; regenerate with `cfru_compare.mjs --write-fixtures`). Battle-only forms
(Darmanitan Zen, Meloetta Pirouette, Aegislash Blade, Eiscue Noice, Necrozma Ultra, Zygarde Complete, Zacian / Zamazenta
Crowned, Ash-Greninja) read as their base species (`gid.BATTLE_ONLY`, as both oracles show them); Shaymin Sky stays, 12,177
Pokémon; it is in `npm test` and skips without the saves). 27 saves read, 10 refused as the oracles do: 3 randomised
(`wrong`), 2 with no valid slot (`unreadable`), 5 with no Pokémon (`empty`). The saves are real 2.1.x game saves
(the game wrote them: counters up to 3,189, a flashcart save, Expert / Insane / Sandbox variants, NG+), some edited
through Unbound-Cloud; which 2.1 point release is unknown, and the format is the same for all of them. **Open:** the
user's own RetroArch `.srm` imported on the Thor (with 8b, once `cfg.calc` is on).

Findings for GID (`extract/gid.py`, not changed here): a save can hold in-battle-only forms (the test saves have
Galarian Darmanitan Zen, Meloetta Pirouette, Shaymin Sky); `GID.sp` maps them to their own pages, where both
oracles show the base species (Unbound-Cloud keeps Shaymin Sky). Experience: Unbound's growth tables differ from
pokefirered's formulas at a few levels (README → cfru → Derived values); `GID.gr` is right, the reader carries the
table.
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
**Metal Bash** (Rival 1 / 2 Beldum, Rival!P5 / Q24): the game's MOVE_STEELYHIT, named "Metal Bash" in the game's
own table (Unbound-Cloud `src/data/MoveNames.json`); the dex has it as Metal Bash (`cfru.CFRU_NAMES` 'Steelyhit').
RomHackDex has two entries for it: "Metal Bash" (60 BP, 5 PP, lowers the user's Defense and Sp. Def; 4 species learn it)
and "Steelyhit" (40 BP, 35 PP, no learners); the dex keeps the first (RomHackDex is the move source). hzla says 40 BP.

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
Scientists, Swizer & Bullo). **Reena** (5 more, 81 in all): sheet and hzla say Lv 59-61 "at E4 Cap", its notes 75-77 at the E4 cap (every
other Mega Trainer's pattern): relative to the notes, each mon with "Sheet says Lv N" (main chat 2026-10-29). Kept
absolute (4, a trainer note says so): **Barbs** (minimum levels 57-59, above the Big Mo cap she's met at).
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
coverage. Locations: every rated wiki row in P.w (method, rate, time, floor), the sections reproduce the wiki's
rates, every species resolves, one slot per area, the counts (`LOC_EXPECTED`). Items (`check_items`,
ITEMS_EXPECTED): the wiki counts (67 Locations pages / 687 rows, 128 machines, 49 stones, 34 Z-Crystals, 29
tutors, 140 shop rows, 83 missions, 34 NPCs), every Locations row's place a page title and its item placed
there, the GID item names, the workbook's TM / Mega Stone / Z-Crystal sheets. Trainers (`trainer_checks`: the
sheet's slots per worksheet on the cards, the hzla join and its explained differences, the wiki's 309 rows,
LEVEL CAPS, unknown-stat slots, relative levels). Unit 7 adds its own. Calc stubs remain: calc is disabled.
Before enabling it, replace the null in tools/scenarios/calc-doubles.mjs EXPECTED with an audited count and add
tools/trainer_fields_check.py DOUBLES_EXPECTED (DOUBLES_PARTNER_ONLY if needed). The engine stub is registered
in tools/calc/package.json; review tools/calc/test.mjs field-profile fixtures. Never copy another hack's counts.
Review tools/itemstd.py RULES only for source-backed quirks; shared defaults need no entry.
Fill sources/watch.json, version/mode, GID/save reader and sprite additions by hand.

## History

TODO: document history.
