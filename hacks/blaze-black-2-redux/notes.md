# Blaze Black 2 Redux build notes

Built unit by unit (plans/blaze-black-2-redux.md → Units): the dex is done; locations, items, trainers, walkthrough
and calc are open. Feature switches need review.

## Build

`python -I hacks/blaze-black-2-redux/extract/build.py` (stdlib only), then `python -I hacks/blaze-black-2-redux/extract/check.py`.

Modules: `dex.py` (M, MV, AB, P, TC) is written; `locs.py`, `trainers.py`, `items.py`, `walk.py` are the next units'
and raise NotImplementedError until then: `build.py` leaves their parts empty (LOC / AR / IT [], WK / TR with no
splits or trainers, said in the report) and writes no `trainer_keys.json` while there are no trainers (the trainers
unit's first build seeds it). Docs are read with `tools/drayano.py`, the mirror with `tools/romhackdex.py`
(`tools/README.md` → Drayano family). `common.py` holds the name fixers (species, moves, abilities) every module
resolves doc names through; `build.py` lists every fix they made at the end of `extract/report.txt`.

`cfg.txt` (2026-10-30): the scaffold's "TODO: <key>" placeholders replaced with BB2R wording (`nw` "Trainer only":
the four Pokestar species are the only g 3; `ns` names Aspertia City, the only no-slot area; `capl` / `capnone` are
unused: no relative-level trainers). `assemble.py` now refuses to build a guide whose hack.json still has TODO / TBD /
FIXME text.

## Sources and rules

Complete version, Challenge Mode, EVless patch; NDS, documentation pin 1.4.1 (SOURCES.md). No public source code:
the docs are the authority, the RomHackDex mirror (`.src/romhackdex/`) fills what they don't list.
TODO: audit watch.json.

Dex (2026-10-29):
- **Species**: the mirror's 649 pages in dex order, plus 22 forms (below). Stats, types and abilities from Pokemon
  Changes where it lists them (the Complete field: `Ability (Complete)` or `(Complete / Classic)`, never `(Classic)`),
  else the mirror. Abilities are three slots, regular / regular / hidden; a hidden slot equal to a regular one shows
  no separate hidden ability. Types: Pokemon Changes' `Type (Complete)` (54 species) and Type Changes' table (51 rows)
  agree on every species both list; the table omits Bayleef, Slugma and Cacnea.
- **The mirror shows pre-Complete stats**: all 189 species the doc gives stats for differ from the mirror; for 186 the
  mirror equals the doc's Old line; Pikachu, Stoutland and Unfezant's Old lines are vanilla Gen V where the mirror has
  Gen VIII values. The doc's New line is used. The mirror's types are the Complete ones; its abilities are not
  consistently (Bulbasaur's are the Complete line, Pidgey's the Old one), so the doc's line is used wherever it has one.
- **Learnsets**: level-up from Pokemon Changes (638 ordinary lists plus the form lists), else the mirror. After the
  name fixes they equal the mirror except Poliwag (its heading lacks the colon; the mirror shows the vanilla list) and
  the form lists of Deoxys, Wormadam and Shaymin (the mirror has the vanilla Normal / Plant / Land list). TM / HM,
  tutor and egg moves from the mirror; the doc's "Now compatible with TMxx" lines add 652 the mirror lacks.
- **Replaced moves**: the 26 old moves of Move Replacements are not in M; where the mirror's lists still name one
  (87 rows naming 15 of them: Razor Wind, Slam, Thrash...) it is mapped to its replacement, which takes the old move's slot in game.
- **Moves**: the mirror's moves.json (V-create's duplicate merged; null accuracy = never misses) with Move Changes
  applied: Power / PP / Accuracy / Priority / Type values set, every bullet kept as a change note with its marker
  ("(Redux)" for [!], "(Legends: Arceus)" for [L:A]) and footnote text (Howl, Frost Breath / Storm Throw, Triple
  Axel). Where the mirror's value differs the move gets a "Sources disagree" card ("Move Changes says Power 35;
  RomHackDex says 20"): 154 fields (Power 64, PP 61, Accuracy 25, Type 3, Priority 1), the audit's count. The general
  "sound moves hit through Substitute" line names no move and stays in the report.
- **No move descriptions**: the BB2R mirror has none (moves.json and the move pages); MV.d is empty. MV.f (flags) and
  MV.cr (crit stage) are not set: the calc unit owns them (doc: Cut, Dragon Claw, Octazooka, X-Scissor gain high
  crit; Crabhammer loses it).
- **Abilities**: the names P uses, with the mirror's descriptions (all 166 have one).
- **Type chart**: the mirror's chart (types/index.html). Type Changes.txt has species types only; the chart agrees
  with what the docs state (Fairy added as in Gen VI; Steel no longer resists Ghost / Dark).
- **Evolutions**: the mirror's family chains (branches put back on their real parent: Bellossom, Politoed, Slowking,
  Cascoon, Gallade, Froslass, Mothim, Shedinja, the Hitmons), Evolution Changes over them (94 methods for 86 species;
  the doc's method replaces the old one unless it says "in addition to"), then Pokemon Changes' own Evolution prose
  for pairs Evolution Changes doesn't give (Burmy's Sandy / Trash cloaks). For 48 unchanged methods the mirror only
  says "Evolution item", "Friendship", "Level up at special location", "Trade" or "Lv. Special": those are the Gen V
  games' methods (`dex.py` GEN5_EVO, listed in the report).
- **Forms** (`dex.py` FORMS): Deoxys Attack / Defense / Speed, Wormadam Sandy / Trash, Rotom's five appliances,
  Giratina Origin, Shaymin Sky, the three Therians, Kyurem Black / White, Darmanitan Zen, Meloetta Pirouette (form
  changes, `fc`), Basculin Blue Striped, Shellos / Gastrodon East Sea (wild in their own right; docs write
  Basculin-B, Shellos-E). The mirror has no form pages, so a form's stats / types / abilities are the canonical Gen
  VIII ones (the docs: "updated to match Sword and Shield") and the doc's fields for its label go over them (Deoxys
  forms' abilities and lists, Wormadam's cloaks, Rotom Fan's Motor Drive, Shaymin Sky's list). Kyurem's fused forms:
  the doc lists only four level 70 moves each, read as additions to Kyurem's list. All 671 sprite keys match the
  shared set. Unown letters, Burmy cloaks, Deerling / Sawsbuck seasons, Castform / Cherrim weather and Arceus types
  stay one entry.
- `546 - Kyurem` (Cottonee's number) is placed by name as #646.

### Doc fixes

Every name the docs misspell or spell another way goes through `tools/drayano.py` Names; the build report lists each
fix with its lines. In the dex docs (Pokemon / Move / Type / Evolution Changes): 14 name fixes and one value.
- Moves: Faint Attack -> Feint Attack (50 rows, the legacy name), Autonomize -> Autotomize (15), Ominous Mind ->
  Ominous Wind (2), Acid Armour -> Acid Armor (2), Twinneedle -> Twineedle, Sliver Wind -> Silver Wind, Will-O-Wiisp
  -> Will-O-Wisp, Submisson -> Submission (Move Replacements), Vice Grip -> Vise Grip (the mirror's name), Judgement
  -> Judgment, Minimise -> Minimize.
- Abilities: Synchronise -> Synchronize (11 rows).
- Species: Snubull -> Snubbull, Grabull -> Granbull (Type Changes), Poliswine -> Piloswine (Evolution Changes).
- Value: Shadow Claw "PP 70 -> 90 [!]" is read as Power 70 -> 90 (the user's decision; its PP stays 15); the move's
  note says the doc prints PP.
- Structure: Beldum's "Catch Rate" and Poliwag's "Level Up" headings lack their colon; Spinarak's "Base Stats):" has
  a stray bracket; separators with trailing spaces (Pidgeot, Drapion, Gliscor); Woobat's Evolution Changes row has
  extra spaces after its number (the audit read it as a continuation row: 85 species there, 86 here, 94 methods both).
The trainer, item and wild docs' fixes (Banette's "Grab", Noctowl's berry ability...) are the next units'.

### Locations

Unit 5 (2026-10-29): `extract/locs.py`; the `wild`, `gifts`, `trades` readers in `tools/drayano.py`.
Complete EVless, Challenge. Wild Area Changes is the authority; the local RomHackDex pages are a cross-check,
not a replacement for omitted methods. No template change or browser sweep in this unit.

- **Counts:** 81 printed wild-area headers, 384 numeric method groups, 2,057 rate rows; 20 Hidden Grotto sections,
  206 entries (78 common, 67 uncommon, 60 rare, one guaranteed Stantler). Published: 104 AR entries, 104 LOC entries,
  352 encounter sections (332 ordinary/seasonal + 20 grottos), 2,263 section rows, 2,398 P.w rows. There are 13 gift
  blocks (52 species/choice rows, including the nine fossil revivals), four gift-doc static encounters, 47 legendary
  species, and 30 trade offers (three changed, three other vanilla, 12 Yancy + 12 Curtis). Wild event rows add the
  BB2 Mandibuzz, male Jellicent and Crustle: seven non-legendary static encounters including the four gift-doc ones.
- **81 is a source count, not a tracker count.** Six duplicate seasonal headings fold into their parent areas:
  Route 20's four seasons, Route 6 and Route 7's winter/non-winter tables, Dragonspiral Tower's outdoor seasons.
  The general notes explicitly give Castelia Gardens a separate encounter name: Castelia's grass is filed there;
  Castelia City keeps its gifts. Named floors add 14 further wild areas: 89 areas have numeric wild tables, plus
  Starter and 14 special/trade-only places. Those places are Castelia City, Floccesy Town, Anville Town, Driftveil
  City, Faraway Island, Entralink, Abyssal Ruins, Nacrene City, Unity Tower, Liberty Garden, Dragonspiral Tower's roof,
  Pledge Grove, Accumula Town, Nimbasa City. Guidance Chamber is not an extra area.
- **Floors:** EI's committed AR has separate Granite Cave floors, Mt. Pyre floors, Seafloor Cavern rooms and Victory
  Road floors. BB2R follows that rule: separately named floors/rooms get their own tracker slots, not just sections.
  `FLOOR_AREAS` / `FLOOR_ALIASES` split Relic Castle's six lower rooms, Celestial Tower's four floors, Victory Road's
  main/dark and dragons/top caves, Dragonspiral's first/second room and roof, Dreamyard's surface/basement, Twist
  Mountain's Ice Room and the Underground Ruins' Regi Rooms (normal/dust methods on the same floor stay together).
  An undivided Both Floors/All Areas table does not invent more floors; Strange House's repeating Type One/Type Two
  table categories are not uniquely named rooms. Original doc heading prefixes remain in the names. Seasons and all 20 grottos
  are sections of their route/area; two grottos on one route still share its single encounter. Giant Chasm's grotto
  belongs to the inner crater/Plasma Airship Area; Pinwheel's woods/Challenger's Rock grottos use inside/outside.
- **Gifts/statics:** EI's normal P.w methods, in the existing town/route's tracker slot; gift buildings are folded
  into the town, not new catches. Starter alone has `st: 1`. No EI-specific hatch-town egg sub-slots are invented.
  Choices stay choices; the monkey is a deterministic gift whose notes end in `Starter: ...` for the existing filter. The ranch egg is random
  from the 17 documented species, never Audino. The Battle Company egg has four possibilities; fossils include
  Aerodactyl (the gift doc explicitly says all nine can be revived). Roark's random gift is one of eight, not a
  one-of-nine choice including Aerodactyl; Old Amber comes from elsewhere. Eevee's note preserves Challenge postgame
  availability. Stantler appears once, as the guaranteed Lv. 30 Route 5 grotto demonstration, not a second static.
- **Rates/levels/forms:** every numeric row keeps its method, exact level range and printed rate. Table totals are
  not silently repaired: 337 total 100%; the other 47 total 90/95/96/105/110/130%, exactly as printed. All totals
  and source lines are in `extract/report.txt`; checks fingerprint all 384 groups and compare published rows back
  to them. Grottos show rarity labels with blank percentages, never invented rarity rates; ordinary grotto levels
  are unknown. Their section rows use the existing zero-weight/blank-cell representation while P.w says the rarity.
  Unown's 35 letter/punctuation rows retain their form labels in notes over the dex unit's cosmetic Unown entry;
  Basculin, Shellos/Gastrodon and Zen Darmanitan resolve to their kept forms. Both table columns, Porygon2,
  Dreamyard's missing colon and Route 6 Winter's missing Lv. marker are covered. --% events are not wild slots.
- **EVless:** no ordinary wild held items. Only Latios/Latias (Soul Dew; Legendary Locations) and Giratina
  (Griseous Orb, 100%; Pokemon Changes) get P.hi. Gift/trade items are not wild held items.
- **Mirror result:** all 81 pages match through the eight explicit `MIRROR_ALIASES`: 1,296 matching multiset rows,
  761 doc-only omissions, zero mirror-only rows and zero slot disagreements. Comparison preserves duplicate
  area/species/form/rate/min/max tuples and ignores method names as in the audit. Aspertia's five dark-spot rows are
  present. Real doc-internal conflicts: Volcarona's gift location says Relic Passage, but Wild Area Changes puts it
  in Relic Castle's Volcarona room (the latter wins); Victini's quest prose says Liberty Garden lighthouse while its
  summary says Castelia Gardens (Liberty Garden provisional, both statements kept in the note); Phione's trade
  header says Route 7 but the NPC prose says Humilau (Humilau provisional, per user). The legendary guide's later
  two-dragon quest overrides the wild event table's B2/W2 first-dragon exclusions: both Reshiram and Zekrom stay.
- **Walkthrough joins:** append-only `AREA_ALIASES` and `area_names(heading)` in `extract/locs.py` map Trainer/Item
  headings to tuples of exact AR names; `wild_area_name()` handles the explicit Castelia Gardens rename. Includes
  multi-floor areas, typo aliases Adundant/Striaton/Straiton, Marvellous/Marvelous, Giant(s) Chasm, gift buildings,
  and seasonal headers. Unknown headings return themselves, not a fuzzy guess; item-only stops need no encounter.
  `check.py` fingerprints the first 104 AR names/indexes; `extract/report.txt` lists every index/name. Future tracker
  additions append; ARO alone changes page order.
- **Vanilla trade fill:** Bulbapedia's B2W2 in-game trade list, Yancy and Curtis pages, checked 2026-10-29. Route 4's
  Petilil, Route 7's Gigalith and Humilau's Tangrowth are replaced by the three doc trades, never re-added. The other
  vanilla trades are Rotom for Ditto (Route 15), Ambipom for Excadrill and Alakazam for Hippowdon (Accumula).
  They are explicitly marked vanilla/not independently verified in Redux. The doc explicitly preserves Yancy/Curtis;
  both 12-offer rosters stay, labelled by player gender, daily order and level 50 (West/East Shellos respectively).
  The template has no encounter-side player-gender gate; the note distinguishes them, not a new setting. Trades
  use the standard separate trade recorder and are excluded from the area's normal caught-species dropdown.
  Sources: `https://bulbapedia.bulbagarden.net/wiki/List_of_in-game_trade_Pok%C3%A9mon_in_Pok%C3%A9mon_Black_2_and_White_2`,
  `https://bulbapedia.bulbagarden.net/wiki/Yancy`, `https://bulbapedia.bulbagarden.net/wiki/Curtis`.
- **Open for integration/review:** walkthrough split attachments; the two provisional placements above; on-device
  review by the trainers/UI unit (no concurrent browser checks here). Unrated grotto rows are in area/tracker lists
  and Locations, but the shared walkthrough compact numeric-rate summary does not print zero-weight rows. No
  undocumented legendary levels/rates or invented version exclusions are added. Doc quest unlock/order prose is
  retained for every legendary group. Logs are `.tmp/bb2r-locs/`; baseline is `8242fed` in `.tmp/baseline/`.
- **Verification:** the exact build, extract check and assembly commands pass. Non-browser `gate.py check
  blaze-black-2-redux --data` passes rebuild/counts/extract-check; data/report baseline differences are the intended
  new Locations output. Its trainer-keys check fails because the baseline scaffold deliberately has no
  `extract/trainer_keys.json` until the trainers unit builds real trainers; this unit does not invent that table.

### Items
`extract/items.py` (IT; `item_locations()` and `area_join()` for the walkthrough), checked in `extract/check.py`.
- **Sources, in order:** Item Changes (652 placement statements in 69 areas, the 95-TM table, 6 modified marts,
  8 price changes, 13 Use-option items, 4 Pickup substitutions), Trade Changes / Gift Pokemon (held items), then
  Bulbapedia for vanilla gaps (placements, HMs, every unmodified shop, the Pickup table; a snapshot in `VANILLA` /
  `PICKUP`, no network at build time). RomHackDex's 558 item pages are a scrape of Item Changes' own placement list
  (one item + one place per page; the mart headings scraped as items, no stock, no vanilla placements), so they add
  nothing: the loop stays as a cross-check (`items cross-check` in the report) and fills any gap it ever has first.
- **Page text carries no sources.** Rows are `Found:` / `Also:` lines and shop lines (`Place — vendor; price; note`).
  A Bulbapedia placement ends "(vanilla)" (Hardlove's marker); shop lines are not marked (every mart is vanilla bar
  the 6 modified ones). Where each line came from (doc line, Bulbapedia page) is in the report (`item sources:`).
- **Doc conflicts:** TM57: the TM table still says Lentimas Town, the placement list moves it to Chargestone Cave
  (Escape Rope -> TM57) and puts TM24 in its Lentimas slot; the placement list wins. The Route 9 mall prose says
  "TM66 Giga Impact"; the TM table has Giga Impact as TM68 ("Doc says TM66" on the shop line).
- **Modes:** the doc's 5 Easy/Normal-only placements say "Easy/Normal only, not in Challenge"; its 3 Challenge-only
  ones "Challenge only". BP vendors (Battle Subway, PWT) and the Castelia berry Harlequin (taken to be the doc's
  "Castelia Cafe artist"; unconfirmed, Bulbapedia refused the fetch) carry "Challenge: absent until the postgame
  Route 3 Suicune sighting".
- **Names:** Bulbapedia's "Amulet Coin III" style suffixes and "Dowsing MCHN" fold into the item (`ALIASES`). GID
  (`gid.py` `GAME_ITEMS`): PKHeX's Bike / Leek / Feathers / Dropped Item (M, F) are the guide's Bicycle / Stick / Wings
  / Dropped Item; BB2R's reused slots Red Scarf = Ice Stone and Oval Stone = Link Cable (Item Changes, Modified
  Items); TMs / HMs map by number. 440 / 441 IT names map; Old Sea Map (BB2R's "God/Grey Stone" slot, no PKHeX
  name) stays unmapped: a key item, never held.
- **Walkthrough join:** `area_join(area, LOC names)` gives each item place (record area or shop place) its LOC areas;
  places with none are `NO_WILD` (towns and buildings with no wild encounters: Black City, Black Tower, Join Avenue,
  Lacunosa, Lentimas, Marine Tube, Mistralton, Nuvema, Opelucid, PWT, Plasma Frigate, Pokémon League, Royal Unova,
  Tubeline Bridge); the check asserts every place is one or the other.

### Walkthrough
`extract/walk.py` (WK), checked in `extract/check.py`. 22 splits = the Trainers boxes (21 caps, then Post-game), 117
stops, every trainer card in one stop, every AR area and every Found / shop line placed (WK.np empty).
- **Stops:** each box's places in Trainer Changes order (a run of one place is one stop: an optional Hoenn leader joins
  the gym stop after it). Places the doc has no trainers for are on-the-way stops in game order (`ON_THE_WAY`):
  Aspertia City (the Starter area), Route 19 and Floccesy Town before Route 20; Royal Unova after Burgh (opens with
  the third badge; game order from memory, unconfirmed); Join Avenue on Route 4; Anville Town from Nimbasa; Driftveil
  Drawbridge after Route 5; the PWT after Clay; Lentimas Town after Skyla; Marine Tube before Humilau.
- **Areas:** at the first stop whose place names them (`locs.area_names`); `AREA_STOP` fixes four (Starter; Relic
  Passage centre room with the Driftveil side; Route 8 / Moor of Icirrus with Icirrus postgame; Marvellous Bridge).
  Seasons and Surf / fishing sections show at the first visit (one tracker slot per area).
- **Items:** each line at the first stop of its place (`items.area_join`, else a stop of that name; `ITEM_PLACE`,
  `STOP_PLACE` for the rest) that is reachable: Surf notes from Route 6 (HM03, Clay split), Waterfall notes from the
  Benga split, postgame notes from Post-game, "N Badges" shop lines from the box after the Nth gym leader, and a gym
  TM at the stop of the leader whose reward it is (`rw`).
- **Surf / Waterfall revisits:** the doc's "after Surf" trainers already sit in the Colress split (Castelia Sewers,
  Castelia). The Route 20 Rangers (Autumn) and Lostlorn's Veteran Murphy need Surf and Waterfall (HM05, Undella Town,
  end of the Hugh split): `trainers.py` now floors them at the Benga split (they were Rood / Colress by level); their
  stops lead that split and show the area again (`REVISIT`).
- **TM Protectors** (Melody, Nikola, Lv 72, optional, any time): at Relic Passage (Driftveil side) in the Colress
  split, where they stand (user, 2026-10-29). **Black / White Kyurem** (Lv 74): Giant Chasm stop of the Ghetsis split,
  just before Ghetsis, above the cap as the doc gives it (user, 2026-10-29).
- **Postgame:** the doc's postgame sections in its order, with the postgame-only places of the Wild Areas doc between
  them (Dragonspiral Tower ... Route 3; Dreamyard ... P2 Laboratory; Entralink ... Pledge Grove; Nacrene City before
  the gym rematches there).
- **Stop keys:** the first build's positions ("split.stop", `tools/schema.py`), published with the guide; a later
  regroup keeps a stop's key (`template/README.md` → saved walkthrough state). The check pins this build's keys.
- **tabs_check:** clean (0 problems). Optional bosses take their split's cap (below), so no cap goes down.

## Local storage

Prefix `bb2r`. Keep these keys once published.

- `dex`: `bb2rdex`
- `calc`: `bb2rcalc`
- `track`: `bb2rtrack`
- `walk`: `bb2rwalk`
- `cap`: `bb2rcap`
- `tr`: `bb2rtr`
- `recent`: `bb2rrecent`
- `pos`: `bb2rpos`
- `mgm`: `bb2rmgm`
- `loc`: `bb2rloc`
- `items`: `bb2ritems`
- `dmg`: `bb2rdmg`

Trainer keys are committed in `extract/trainer_keys.json` (466 initial identities). Normal-team open state is
not saved; no localStorage key was added or changed.

## Hack-only data

TODO: document hack-only data.

Trainers use optional shared `normal`, `sl` and `hn` schema fields (Trainers below). Four trainer-only Pokestar
species come from the pinned hzla table; everything stays in the one offline HTML.

### Trainers

Unit 7 (2026-10-29), Complete / EVless / Challenge. All **468 battle records / 1,867 source Pokemon rows** parse,
including 31 Normal alternatives. Selecting 437 Challenge records, then expanding starters, versions and joint
sides, gives **466 cards / 1,711 opponent Pokemon**. Plus **150 Normal / 54 independently joined partner Pokemon**
gives **1,915 roster slots, 1,909 with hzla IVs+nature (99.69%)**. Challenge opponents: **1,705/1,711** covered.
Partner teams copied onto both opponents produce 120 final partner slots, not 120 independent joins.

- Docs win for species, Complete abilities, moves, items and levels; all names go through `drayano.Names` and
  unresolved doc names fail the build. Structural repairs include missing comma/dot after abilities, lv. whitespace,
  Phanpy's missing lv. prefix and Meditite's item after an extra colon. RP remains a separate trainer dialect.
- hzla uses the pinned `403c2669` sets and `da8a533` trainer navigation (SOURCES.md). Join whole parties by species
  content, moves/items/levels and order proximity, then Pokemon by species/moves. Related forms can share individual
  IV/nature evidence while retaining their doc identity; different species never borrow one another's natures/IVs.
  Repeated documented encounters can reuse a matching party. Every join and trainer ID is recorded in the report.
- Bryce/Micki: doc Psychic Micki's five-Pokemon party joins hzla **555 (Bryce)**; doc Psychic Bryce's Reuniclus
  joins **553 (Micki)**. Do not join these by name alone.
- `l` is displayed level; optional `sl` is a different stat level. Shared parties add the section increment to the
  doc level, continuing the regional increment (default +4 after Skyla) unless a section says no shift. Explicit
  Challenge parties use their stated levels; when hzla's `level + diff` agrees, its base level supplies `sl`.
  Normal retains doc levels; `normal.easy` is the regional Easy decrement. Red stays 100, +7 retained as text.
  The trainer speed uses `sl`; visible levels remain `l`. Generic stat-model disagreements do not replace the doc.
- All **31** paired bosses carry `normal: {easy, p}`: native collapsed Normal team below Challenge, not a mode
  toggle or saved preference. Grunt #884, Victini Guardian and Lance are tagged **Challenge only**. Guardian's
  before-Burgh / postgame access restriction is on the card.
- Formats: Double Battle / Triple Battle / Tag Battle supply Doubles calc evidence (no true triples in the calc).
  Rotation Battle stays singles. Joint parties, including unmarked Shanta/Webster and Grunts #807/#809, split into
  <=6-Pokemon side cards sharing `bt`; partners stay separate `pt` teams. Reversal Mountain tag fights use Bianca's
  Normal party regardless of mode. School children and Hugh branches carry the player's starter type. Both N
  introductory game versions, four seasonal teams, both Braven/Clifford versions, optional fights, postgame,
  rematches, E4 round two and Route 4 game-only teams are retained and flagged.
- Four trainer-only Pokestar creations F-00/MT/MT2/UFO are added to P using hzla's pinned species table (types,
  100-all stats, Pound placeholder learnset, documented abilities). Docs give actual party moves. No borrowed
  ordinary-species sprite: these four deliberately use the template's coloured initial fallback.
- Recorded fixes (each card keeps its "Doc says ..." note; report: `trainer recorded fix`): Banette Grab -> Snatch;
  Normal Winona Noctowl Tinted Lens @ Colbur Berry; Challenge Shauntal rematch Jellicent Cursed Body @ Leftovers;
  postgame Colress Klinklang Air Balloon / Earthquake, displayed 92, stat 88; Floccesy Hugh's Snivy-branch Pansage
  lv.19 -> lv.9 (the other branches and hzla have 9; 19 would be 20 at the cap-14 split). Name repairs: report.
- Level increment (`_bb2r_trainers`): a `~~~` sub-heading resets to the section's value (set before its first sub-heading); unscoped "No level shift" only. Reversal Mountain B1F (Ranger Lewis): no shift line of its own; kept at the MAIN AREA's +4 by an explicit exception; the section default would be +3; settle in game.
- hzla disagreements (doc wins, card shows `hn` "hzla says ..."): **328 displayed levels / 84 stat levels / 140
  abilities / 92 moves / 25 items / 11 species**. Most level ones are hzla's older sets (doc stat level 1-5 off) or
  a different increment (postgame: the doc's "old documentation" carries +4, hzla often +5). The per-Pokemon ledger is
  the report's `hzla disagreement` lines; joins are its `hzla join` lines.

Caps, exactly the user's order (only these end splits): Cheren 14; Roxie 21; Brycen 23; Burgh 29; Lenora and Hawes
33; Subway Masters 36; Elesa 38; Charles 39; Rood 41; Clay 45; Colress 53; Skyla 55; Bianca 56; Hugh 58; Benga 62;
Drayden 64; Marlon 68; Ghetsis 72; Lance 76; Elite Four et al 78; Iris 79 ("New to Redux" rows named from the doc's
spoiler cap guide). Optional Hoenn bosses stay in these splits under the split's cap: the user's rule is that caps
come only from the 21 cap battles (the spoiler guide's Roxanne 13, Brawly 20, ... are not used; `OPTIONAL_CAPS`). Charles follows Elesa despite the earlier
Route 5 doc section. Gated revisits use a later listed cap without adding splits. Source order within each split
remains for the walkthrough, which reviews Surf/Waterfall revisit placement and TM Protectors' access.

Four split-cap exceptions, doc levels kept (report: `split-cap exception`): Relic Passage TM Protectors Melody (six)
and Nikola (three), displayed 72 in the Colress 53 split (optional, late); Black / White Kyurem, doc 70 + 4 = 74 in
the Ghetsis 72 split, with no hzla set (the calc unit settles these scripted encounters).

Six unmatched IV/nature slots: the two Kyurem; N Spring Pelipper and Beartic (hzla Politoed / Dragonite); N winter
Vanilluxe (hzla Clefable); rematch Cheren Dodrio (hzla Zangoose). Docs kept, uncertainty on the card; the zero IVs
are a placeholder, not a claim.

Field reviews: ten records across Caroll, Elmer, Porta, Sterling and Lance, two each: "Weather Trainers and Lance"
and the gauntlet/healing note. Neither infers permanent weather from abilities. The four explicit Permanent Rain /
Sandstorm boss conditions are separately retained. Settled 2026-10-29: both are text only, no field effect (the weather comes from the teams' abilities; `tools/trainer_fields.py`), no record left to review. `calc-doubles` EXPECTED is **72**
from data; cfg.calc stays false, so the scenario still skips until the calc unit enables it, not bypassing its gate.

## Checks

`uv run python -I tools/gate.py check blaze-black-2-redux`

`extract/check.py` (dex, 2026-10-29): one entry per dex number 1-649 plus the 22 forms; the doc's counts (649 species
blocks, 189 with stats, 51 Type Changes rows, 94 evolution methods for 86 species, 26 replacements); every
doc-changed species' stats / types / abilities equal the doc (Complete); 189 stat conflicts with the mirror; every doc
evolution is an edge both ways and no method is left vague; every move name in Pokemon / Move Changes resolves; 154
move fields where the mirror disagrees; Shadow Claw, Esper Wing, the type-changed moves; no replaced move in M.

`extract/check.py` (trainers, 2026-10-29): 468 records / 1,867 doc Pokemon resolved; 466 cards; caps = the plan's
21, only they end splits; 31 Normal teams (stated levels, Easy 1-4) + 3 Challenge-only; displayed level <= split cap
or one of the four reported exceptions; level pairs (Cheren Munchlax 14 / 13, Red 100, Klinklang 92 / 88); IVs and
nature or an explicit "unknown"; five recorded fixes; every card key in `trainer_keys.json`. Template (`normal`,
`hn`, `sl`): four live guides DOM identical normal + kb at baseline 8242fed; BB2R Trainers at 260 x 316 normal +
dvkb: 31 Normal lines, nothing past 260 px, no page errors (`tools/mockup/pagecheck.mjs` only knows EI's place names).
Walkthrough (2026-10-29): `extract/check.py` walk asserts; `gate.py scenarios --only guide-update,stable-keys` pass
(2 + 4); `tabs_check.py` clean.

TODO: replace extract/check.py and calc stubs with source-backed assertions. Calc remains disabled.
Before enabling it, replace the null in tools/scenarios/calc-doubles.mjs EXPECTED with an audited count and add
tools/trainer_fields_check.py DOUBLES_EXPECTED (DOUBLES_PARTNER_ONLY if needed). The engine stub is registered
in tools/calc/package.json; review tools/calc/test.mjs field-profile fixtures. Never copy another hack's counts.
Review tools/itemstd.py RULES only for source-backed quirks; shared defaults need no entry.
Fill sources/watch.json, version/mode, GID/save reader and sprite additions by hand.

Scaffold verification (2026-10-29, baseline 23a42e1): tools/new_hack_test.py 13/13; four live guides' data gate
24/24 and template gate (--jobs 4) 137/137. All eight normal / dvkb DOM comparisons: 19,850 routes, zero
differences or page errors; four HTML files byte-identical. Calc npm test passes, including this disabled stub.
Renegade Platinum dry-run lists 17 writes without creating its config. Logs: .tmp/bb2r-scaffold/.

### Damage calc

Profile (`hack.json` → `cfg.calc`): base **gen5** (Gen V engine: crits x2, Gen V crit table, Gen V damage order),
`save: "gen5"`, `evs: false` (EVless: no player EVs; trainers have none), `setterStays: true` (no doc changes Gen V's
permanent ability weather). Type chart: data `TC` (Fairy, Gen VI Steel). Overrides, each from the docs:

| Change | Source | How | Fixtures |
|---|---|---|---|
| Cut, Dragon Claw, Octazooka, X-Scissor high crit; Crabhammer not | Move Changes | `MV.cr` (extract/dex.py, with Gen V's high-crit list, Bulbapedia) | `crit ratio changes` (check) |
| Wild Charge: no recoil | Move Changes | `over.moves` `recoil: null` | `wild-charge`, check |
| Triple Axel hits 30 / 40 / 50 (power 30, later hits +10, "Triple Kick mechanics") | Move Changes; the user's call 2026-10-29 | `over.moves` `step: 10` (engine: each later hit adds the step; hit actions too) | `triple-axel` (known difference: hzla 30 x 3), check |
| Needle Arm, Rock Smash boosted by Iron Fist | Move Changes; Changelog 291 | `over.moves` punch flag | `iron-fist-*` (known differences: hzla doesn't flag them), negatives |
| Sound moves hit through Substitute | Move Changes, Further Modifications | nothing: the calc has no Substitute state | sound flags (Soundproof) |
| Power / type / category / accuracy | Move Changes | data (`MV`) | `frost-breath`, `shadow-claw-90`, `esper-wing`, `wave-crash`, `hex-*` |

`MV.f` is omitted, so the engine keeps stock Gen V flags (modern ones for the replacement moves); an empty list
meant "no flags" and switched off Iron Fist / Soundproof.

**Level bug** (Challenge; hzla's model): a trainer Pokemon with `sl` has stats at `sl`; the damage formula uses the
shown level `l`; Night Shade / Seismic Toss / Psywave use `sl` (hzla `handleFixedDamageMoves`); the player's Pokemon
are unaffected. Engine: `tools/calc/README.md` → Level bug. Page: the foe card shows Lv `l` and a small grey `s<sl>`
after it (tooltip "Stats at Lv 13 (Challenge level bug)"); edits keep the difference, the stat level never below 1; nothing new is saved.

**Oracle** (`node tools/calc/hzla_compare.mjs blaze-black-2-redux`): hzla Decomps at the reviewed pin `403c2669`
(`oracle.sha`), `challengeMode` on, a shim giving its Challenge branch the trainer side of each case. 50 cases
(early / mid / late bosses, level-bug Pokemon incl. Cheren's Munchlax, changed moves, doubles, weather): **46 match,
4 known differences** (Iron Fist x2 and Triple Axel: doc over hzla's data; one hzla UI artefact: a player Pokemon of the trainer's
species at its stat level also gets the +N).

**Imported abilities:** Competitive and Neutralizing Gas have no Gen V ability ID, so an imported Pokemon's ability
ID the tables don't know becomes the species' one ability with no ID (Koffing / Weezing: Neutralizing Gas, Milotic:
Competitive), else its first, marked `?` like a guessed trainer ability (`template/calc.js` `abilityGuess`).

**Page checks:** `tools/scenarios/calc-blaze-black-2-redux.mjs` (Gen V field: Hail, no terrain; no EV row; the
`s<sl>` marker fits the level row at every viewer size, normal and dvkb; foe stats at `sl`, its Seismic Toss deals
`sl`, the player's its own level); the shared calc scenarios run on BB2R (`gate.py scenarios blaze-black-2-redux`).

Open / in-game tests: Triple Axel's 30 / 40 / 50 (compare a hit in game);
Night Shade / Seismic Toss from a level-bug Pokemon (hzla: stat level; the game may use the shown level); Kyurem
(no hzla set); which slot ID the hack gives Competitive / Neutralizing Gas (a save with Milotic or Weezing settles it).

### Save import

Unit 9a supplies the `gen5` reader for raw B2W2 `.sav` (melonDS / DraStic export), with an optional
bounded DeSmuME footer. It returns party and all 24 boxes in game IDs, explicit nature/ability, held item,
moves, calc-order IVs/EVs and levels; additive nickname/current PP/PP-Up fields are covered by the oracle.
Eggs are omitted; box-only saves work. Checks cover table, imported blocks, both CRC copies and each PK5.
The primary is read as PKHeX does: no silent fallback to an older backup. Format references, offsets,
reproduction and limitations: `template/calc/readers/README.md` → gen5.

`extract/gid.py` runs after shared finalisation. Its committed `gen5-ids.json` is the factual English
ID/name/form/growth export from PKHeX.Core 26.10.18; format-source commit
`bfe89c74a3f5265805e364b79bc04ad38ebbc5ea`. No PKHeX code or linked binaries are shipped.
Coverage: 712 species:form keys, all 649 base species and all 671 P entries; 559/559 real B2W2 move
slots, including the 26 replacements at the old slot; 164/164 B2W2 ability slots. Items map by IT name
(Items above: 440 / 441, Old Sea Map unmapped); the check also keeps the alias and unmapped-name controls.

Unmapped, deliberately not assigned invented IDs:
- Castform weather forms 351:1..3 and typed Arceus 493:1..16: no matching P entries. They are skipped
  rather than imported with the base's wrong type; the calc/data units can add supported form entries later.
- 18 unused mirror-only XD moves: Shadow Blast, Shadow Blitz, Shadow Bolt, Shadow Break, Shadow Chill,
  Shadow Down, Shadow End, Shadow Fire, Shadow Half, Shadow Hold, Shadow Mist, Shadow Panic, Shadow Rave,
  Shadow Rush, Shadow Shed, Shadow Sky, Shadow Storm, Shadow Wave. None occurs in P's learnsets.
- Competitive and Neutralizing Gas: post-Gen-5 names in AB (and P) with no documented replacement slots.
  The reader retains the actual stored ability ID; a vanilla-name table cannot prove these hack additions.

Verification 2026-10-29: all reader-module state controls and 42 standalone assertions pass;
PKHeX-generated Black 2 / White 2 / box-only saves compare **805 Pokemon × 12 fields = 9,660 fields,
zero mismatches**, covering all 731 source species/form combinations, all natures, all shuffle selectors
and every B2W2 move slot. All 17 controls reject correctly (BW1, Gen 4, CRCs, bad PK5 sanity/checksums,
bad count/game, truncation, state, empty/egg-only and valid backup with damaged primary).
The uncommitted generator is `.tmp/pkhex-oracle/`; fixtures and expected files are `.src/saves/pkhex-b2w2*`;
logs are `.tmp/bb2r-reader/`. Build + extract check pass; no browser checks were run for this unit.
No real BB2R save exists yet: the user chose this oracle; a real save remains a follow-up, not a claimed pass.

The later calc unit must wire `cfg.calc.save = "gen5"` and the calc import path, then rebuild after the
items/data units merge. This unit does not change calc.js, dex.js, shell.html or hack.json, enable imports,
or claim those unresolved catalogue names have proven hack game IDs.

## History

2026-10-29: dex unit: `tools/drayano.py`, `tools/romhackdex.py`, `extract/dex.py`; P 671, M 577, AB 166. The
scaffold's `cfg.calc: false` made `assemble.py` fail (any calc key turned the calc on); it now needs a truthy one.
2026-10-29: scaffold from Hardlove Gold with tools/new_hack.py; prefix bb2r, calc disabled, no data.json.
Four live guides' data gates pass and their built HTML is byte-identical to 23a42e1. Data / calc units fill TODOs.
Full template / calc checks passed; scaffold unit complete. No live guide, template or source-audit plan changed.
