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

TODO: audit inherited cfg switches and cfg.txt wording.

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
- Settled fixes: Banette Grab -> Snatch; Normal Winona Noctowl Tinted Lens @ Colbur Berry; Challenge Shauntal
  rematch Jellicent Cursed Body @ Leftovers; postgame Colress Klinklang Air Balloon / Earthquake, displayed 92,
  stat 88. Each card keeps a "Doc says ..." repair note. Name repairs are in `extract/report.txt`.
- Disagreement counts: **329 displayed levels / 85 stat levels / 140 abilities / 92 moves / 25 items / 11 species**.
  `hn` displays "hzla says ..." independently of sheet `cf`. A stat-model note does not print the unboosted value
  as a visible level. The complete ledger below retains the source values; joins/name fixes are in the report.

Caps, exactly the user's order (only these end splits): Cheren 14; Roxie 21; Brycen 23; Burgh 29; Lenora and Hawes
33; Subway Masters 36; Elesa 38; Charles 39; Rood 41; Clay 45; Colress 53; Skyla 55; Bianca 56; Hugh 58; Benga 62;
Drayden 64; Marlon 68; Ghetsis 72; Lance 76; Elite Four et al 78; Iris 79. Optional Hoenn bosses stay in these
splits with spoiler-guide section/trainer caps: Roxanne 13, Brawly 20, Wattson 29, Flannery 37, Norman 44, Juan 54,
Winona 63, Tate and Liza 67. Charles follows Elesa despite the earlier Route 5 doc section. Gated revisits use a
later listed cap without adding splits. Source order within each split remains for the walkthrough finaliser.
Walkthrough must review Surf/Waterfall revisit placement and TM Protectors' access, then place stable trainer keys.

Five explicit split-cap exceptions, doc levels retained (also in report):
- Hugh, Floccesy Ranch, player's Snivy branch: Pansage doc 19 -> displayed 20 before cap 14 (hzla says 10).
- Relic Passage TM Protectors Melody (six) and Nikola (three): displayed 72 in Colress 53 split; optional late teams.
- Black / White Kyurem: doc 70 + section 4 = displayed 74 in Ghetsis 72 split. No matching hzla encounter sets:
  the calc unit must settle these scripted encounters, not borrow the unrelated level-100 trainer sets.

Six unmatched IV/nature slots: the two scripted Kyurem; N Spring Pelipper and Beartic (hzla Politoed / Dragonite);
N winter Vanilluxe (hzla Clefable); rematch Cheren Dodrio (hzla Zangoose). Docs retained, uncertainty on card;
zero IV is an explicit placeholder, not authoritative evidence.

Field reviews: ten records across Caroll, Elmer, Porta, Sterling and Lance, two each: "Weather Trainers and Lance"
and the gauntlet/healing note. Neither infers permanent weather from abilities. The four explicit Permanent Rain /
Sandstorm boss conditions are separately retained. User settles reviews later. `calc-doubles` EXPECTED is **72**
from data; cfg.calc stays false, so the scenario still skips until the calc unit enables it, not bypassing its gate.

Baseline: `8242fed580bc30dbb0a683a1ac9b1f252b88c9e7`, `.tmp/baseline` (git archive, five guides). Unit logs:
`.tmp/bb2r-trainers/`. Final check results are recorded after verification.

<details>
<summary>Complete hzla disagreement / unmatched ledger (Trainer Changes.txt line numbers)</summary>

- Line 253, Hiker Jerome, wooper, level: doc 14; hzla says 13 (trainer 206)
- Line 253, Hiker Jerome, wooper, stat level: doc 13; hzla says 12 (trainer 206)
- Line 302, Ranger♀ Naoko - {Sitrus Berry}, stoutland, level: doc 41; hzla says 40 (trainer 387)
- Line 302, Ranger♀ Naoko - {Sitrus Berry}, stoutland, stat level: doc 40; hzla says 39 (trainer 387)
- Line 325, HUGH, pansage, level: doc 20; hzla says 10 (trainer 166)
- Line 325, HUGH, pansage, stat level: doc 19; hzla says 9 (trainer 166)
- Line 359, School Kid Seymour, pansage, level: doc 12; hzla says 11 (trainer 747)
- Line 359, School Kid Seymour, pansage, stat level: doc 11; hzla says 10 (trainer 747)
- Line 360, School Kid Seymour, snivy, level: doc 12; hzla says 11 (trainer 747)
- Line 360, School Kid Seymour, snivy, stat level: doc 11; hzla says 10 (trainer 747)
- Line 361, School Kid Seymour, treecko, level: doc 12; hzla says 11 (trainer 747)
- Line 361, School Kid Seymour, treecko, stat level: doc 11; hzla says 10 (trainer 747)
- Line 364, School Kid Cassie, panpour, level: doc 12; hzla says 11 (trainer 748)
- Line 364, School Kid Cassie, panpour, stat level: doc 11; hzla says 10 (trainer 748)
- Line 365, School Kid Cassie, oshawott, level: doc 12; hzla says 11 (trainer 748)
- Line 365, School Kid Cassie, oshawott, stat level: doc 11; hzla says 10 (trainer 748)
- Line 366, School Kid Cassie, mudkip, level: doc 12; hzla says 11 (trainer 748)
- Line 366, School Kid Cassie, mudkip, stat level: doc 11; hzla says 10 (trainer 748)
- Line 366, School Kid Cassie, mudkip, ability: doc Torrent; hzla says Water Veil (trainer 748)
- Line 370, School Kid Seymour, pansear, level: doc 12; hzla says 11 (trainer 749)
- Line 370, School Kid Seymour, pansear, stat level: doc 11; hzla says 10 (trainer 749)
- Line 371, School Kid Seymour, tepig, level: doc 12; hzla says 11 (trainer 749)
- Line 371, School Kid Seymour, tepig, stat level: doc 11; hzla says 10 (trainer 749)
- Line 372, School Kid Seymour, torchic, level: doc 12; hzla says 11 (trainer 749)
- Line 372, School Kid Seymour, torchic, stat level: doc 11; hzla says 10 (trainer 749)
- Line 375, School Kid Cassie, pansage, level: doc 12; hzla says 11 (trainer 750)
- Line 375, School Kid Cassie, pansage, stat level: doc 11; hzla says 10 (trainer 750)
- Line 376, School Kid Cassie, snivy, level: doc 12; hzla says 11 (trainer 750)
- Line 376, School Kid Cassie, snivy, stat level: doc 11; hzla says 10 (trainer 750)
- Line 376, School Kid Cassie, snivy, moves: doc ['Pursuit', 'Vine Whip', 'Twister', 'Leer']; hzla says ['Twister', 'Pursuit', 'Vine Whip', 'Tackle'] (trainer 750)
- Line 377, School Kid Cassie, treecko, level: doc 12; hzla says 11 (trainer 750)
- Line 377, School Kid Cassie, treecko, stat level: doc 11; hzla says 10 (trainer 750)
- Line 377, School Kid Cassie, treecko, ability: doc Overgrow; hzla says Unburden (trainer 750)
- Line 381, School Kid Seymour, panpour, level: doc 12; hzla says 11 (trainer 169)
- Line 381, School Kid Seymour, panpour, stat level: doc 11; hzla says 10 (trainer 169)
- Line 382, School Kid Seymour, oshawott, level: doc 12; hzla says 11 (trainer 169)
- Line 382, School Kid Seymour, oshawott, stat level: doc 11; hzla says 10 (trainer 169)
- Line 383, School Kid Seymour, mudkip, level: doc 12; hzla says 11 (trainer 169)
- Line 383, School Kid Seymour, mudkip, stat level: doc 11; hzla says 10 (trainer 169)
- Line 383, School Kid Seymour, mudkip, ability: doc Torrent; hzla says Water Veil (trainer 169)
- Line 386, School Kid Cassie, pansear, level: doc 12; hzla says 11 (trainer 170)
- Line 386, School Kid Cassie, pansear, stat level: doc 11; hzla says 10 (trainer 170)
- Line 387, School Kid Cassie, tepig, level: doc 12; hzla says 11 (trainer 170)
- Line 387, School Kid Cassie, tepig, stat level: doc 11; hzla says 10 (trainer 170)
- Line 388, School Kid Cassie, torchic, level: doc 12; hzla says 11 (trainer 170)
- Line 388, School Kid Cassie, torchic, stat level: doc 11; hzla says 10 (trainer 170)
- Line 425, Lass Serena, eevee, moves: doc ['Quick Attack', 'Swift', 'Tackle']; hzla says ['Quick Attack', 'Swift', 'Tickle'] (trainer 172)
- Line 436, LEADER CHEREN - {TM83 Work Up} [Challenge Mode], doduo, item: doc Silk Scarf; hzla says Expert Belt (trainer 764)
- Line 456, Worker Mitchell, elekid, ability: doc Vital Spirit; hzla says Static (trainer 204)
- Line 510, Guitarist Billy Jo, stunky, level: doc 16; hzla says 17 (trainer 179)
- Line 510, Guitarist Billy Jo, stunky, stat level: doc 16; hzla says 17 (trainer 179)
- Line 511, Guitarist Billy Jo, seviper, level: doc 16; hzla says 17 (trainer 179)
- Line 511, Guitarist Billy Jo, seviper, stat level: doc 16; hzla says 17 (trainer 179)
- Line 512, Guitarist Billy Jo, nidorina, level: doc 16; hzla says 17 (trainer 179)
- Line 512, Guitarist Billy Jo, nidorina, stat level: doc 16; hzla says 17 (trainer 179)
- Line 517, LEADER ROXIE - {TM09 Venoshock} [Easy and Normal mode], croagunk, item: doc Oran Berry; hzla says Fighting Gem (trainer 157)
- Line 538, Plasma Grunt #690 (2x), beedrill, ability: doc Swarm; hzla says Sniper (trainer 690)
- Line 543, BRYCEN - {NeverMeltIce} [Easy and Normal mode], spheal, ability: doc Snow Warning; hzla says Thick Fat (trainer 848)
- Line 545, BRYCEN - {NeverMeltIce} [Easy and Normal mode], vanillite, ability: doc Ice Body; hzla says Snow Cloak (trainer 848)
- Line 545, BRYCEN - {NeverMeltIce} [Easy and Normal mode], vanillite, item: doc Life Orb; hzla says Icy Rock (trainer 848)
- Line 546, BRYCEN - {NeverMeltIce} [Easy and Normal mode], cubchoo, ability: doc Rattled; hzla says Snow Cloak (trainer 848)
- Line 572, Fisherman Andrew, basculin, species: doc basculin; hzla says basculin_blue_striped (trainer 211)
- Line 572, Fisherman Andrew, basculin, ability: doc Reckless; hzla says Rock Head (trainer 211)
- Line 581, Policeman Braven, darumaka, ability: doc Hustle; hzla says Sheer Force (trainer 212)
- Line 578, Backpacker Clifford, meowth, level: doc 22; hzla says 27 (trainer 213)
- Line 578, Backpacker Clifford, meowth, stat level: doc 20; hzla says 25 (trainer 213)
- Line 579, Backpacker Clifford, sandile, level: doc 22; hzla says 27 (trainer 213)
- Line 579, Backpacker Clifford, sandile, stat level: doc 20; hzla says 25 (trainer 213)
- Line 580, Backpacker Clifford, dwebble, ability: doc Shell Armor; hzla says Sturdy (trainer 213)
- Line 581, Backpacker Clifford, darumaka, ability: doc Hustle; hzla says Sheer Force (trainer 213)
- Line 581, Backpacker Clifford, darumaka, moves: doc ['Facade', 'Uproar', 'Fire Fang']; hzla says ['Facade', 'Uproar', 'Fire Punch'] (trainer 213)
- Line 594, Clerk♂ Clemens, kadabra, ability: doc Synchronize; hzla says Magic Guard (trainer 501)
- Line 599, Clerk♂ Warren, metang, ability: doc Clear Body; hzla says Iron Fist (trainer 502)
- Line 666, Plasma Grunts #342, #356 - (Tag), dewott, level: doc 26; hzla says 24 (trainer 589)
- Line 667, Plasma Grunts #342, #356 - (Tag), swellow, level: doc 26; hzla says 24 (trainer 589)
- Line 668, Plasma Grunts #342, #356 - (Tag), simisear, level: doc 26; hzla says 24 (trainer 589)
- Line 670, Plasma Grunts #342, #356 - (Tag), servine, level: doc 26; hzla says 24 (trainer 590)
- Line 671, Plasma Grunts #342, #356 - (Tag), swellow, level: doc 26; hzla says 24 (trainer 590)
- Line 672, Plasma Grunts #342, #356 - (Tag), simipour, level: doc 26; hzla says 24 (trainer 590)
- Line 672, Plasma Grunts #342, #356 - (Tag), simipour, ability: doc Torrent; hzla says Gluttony (trainer 590)
- Line 674, Plasma Grunts #342, #356 - (Tag), pignite, level: doc 26; hzla says 24 (trainer 588)
- Line 674, Plasma Grunts #342, #356 - (Tag), pignite, moves: doc ['Body Slam', 'Mud Bomb', 'Flame Charge', 'Rock Tomb']; hzla says ['Body Slam', 'Flame Charge', 'Arm Thrust', 'Rock Tomb'] (trainer 588)
- Line 675, Plasma Grunts #342, #356 - (Tag), swellow, level: doc 26; hzla says 24 (trainer 588)
- Line 676, Plasma Grunts #342, #356 - (Tag), simisage, level: doc 26; hzla says 24 (trainer 588)
- Line 676, Plasma Grunts #342, #356 - (Tag), simisage, ability: doc Overgrow; hzla says Gluttony (trainer 588)
- Line 661, Plasma Grunts #342, #356 - (Tag), raticate, moves: doc ['Hyper Fang', 'Sucker Punch', 'Flame Wheel', 'Quick Attack']; hzla says ['Hyper Fang', 'Sucker Punch', 'Endeavor', 'Quick Attack'] (trainer 342)
- Line 683, Scientist♂ Clarke, magnemite, level: doc 46; hzla says 44 (trainer 463)
- Line 683, Scientist♂ Clarke, magnemite, stat level: doc 44; hzla says 42 (trainer 463)
- Line 683, Scientist♂ Clarke, magnemite, ability: doc Sturdy; hzla says Analytic (trainer 463)
- Line 683, Scientist♂ Clarke, magnemite, moves: doc ['Flash Cannon', 'Discharge', 'Light Screen', 'Thunderbolt']; hzla says ['Magic Coat', 'Gyro Ball', 'Signal Beam', 'Lock-On'] (trainer 463)
- Line 684, Scientist♂ Clarke, magneton, level: doc 46; hzla says 44 (trainer 463)
- Line 684, Scientist♂ Clarke, magneton, stat level: doc 44; hzla says 42 (trainer 463)
- Line 684, Scientist♂ Clarke, magneton, moves: doc ['Tri Attack', 'Flash Cannon', 'Discharge', 'Light Screen']; hzla says ['Gyro Ball', 'Signal Beam', 'Lock-On', 'Tri Attack'] (trainer 463)
- Line 685, Scientist♂ Clarke, magnezone, level: doc 47; hzla says 45 (trainer 463)
- Line 685, Scientist♂ Clarke, magnezone, stat level: doc 45; hzla says 43 (trainer 463)
- Line 685, Scientist♂ Clarke, magnezone, moves: doc ['Tri Attack', 'Flash Cannon', 'Discharge', 'Light Screen']; hzla says ['Gyro Ball', 'Signal Beam', 'Lock-On', 'Tri Attack'] (trainer 463)
- Line 688, Janitor Brady, azumarill, level: doc 47; hzla says 45 (trainer 462)
- Line 688, Janitor Brady, azumarill, stat level: doc 45; hzla says 43 (trainer 462)
- Line 689, Janitor Brady, cinccino, level: doc 47; hzla says 45 (trainer 462)
- Line 689, Janitor Brady, cinccino, stat level: doc 45; hzla says 43 (trainer 462)
- Line 745, Gamefreak Nishino, snorlax, level: doc 28; hzla says 26 (trainer 357)
- Line 745, Gamefreak Nishino, snorlax, stat level: doc 26; hzla says 24 (trainer 357)
- Line 748, Gamefreak Morimoto, blitzle, level: doc 26; hzla says 24 (trainer 592)
- Line 748, Gamefreak Morimoto, blitzle, stat level: doc 24; hzla says 22 (trainer 592)
- Line 749, Gamefreak Morimoto, swoobat, level: doc 26; hzla says 24 (trainer 592)
- Line 749, Gamefreak Morimoto, swoobat, stat level: doc 24; hzla says 22 (trainer 592)
- Line 750, Gamefreak Morimoto, liepard, level: doc 26; hzla says 24 (trainer 592)
- Line 750, Gamefreak Morimoto, liepard, stat level: doc 24; hzla says 22 (trainer 592)
- Line 760, Gamefreak Nishino, excadrill, ability: doc Mold Breaker; hzla says Sand Force (trainer 140)
- Line 763, Gamefreak Nishino, zebstrika, ability: doc Sap Sipper; hzla says Lightning Rod (trainer 140)
- Line 770, Gamefreak Morimoto, porygon2, ability: doc Trace; hzla says Analytic (trainer 591)
- Line 771, Gamefreak Morimoto, blissey, item: doc Leftovers; hzla says Chople Berry (trainer 591)
- Line 782, WATTSON - Hoenn Leader {Tanga Berry x2} [Easy and Normal mode], electrike, moves: doc ['Quick Attack', 'Thunder Wave', 'Shock Wave', 'Howl']; hzla says ['Shock Wave', 'Leer', 'Howl', 'Quick Attack'] (trainer 828)
- Line 791, WATTSON - Hoenn Leader {Tanga Berry x2} [Challenge Mode], manectric, level: doc 28; hzla says 27 (trainer 829)
- Line 791, WATTSON - Hoenn Leader {Tanga Berry x2} [Challenge Mode], manectric, stat level: doc 28; hzla says 27 (trainer 829)
- Line 802, Harlequin Clarence, combee, level: doc 24; hzla says 26 (trainer 734)
- Line 803, Harlequin Clarence, burmy, level: doc 24; hzla says 26 (trainer 734)
- Line 804, Harlequin Clarence, pinsir, level: doc 24; hzla says 26 (trainer 734)
- Line 807, Harlequin Jack, shelmet, level: doc 24; hzla says 26 (trainer 735)
- Line 808, Harlequin Jack, karrablast, level: doc 24; hzla says 26 (trainer 735)
- Line 808, Harlequin Jack, karrablast, ability: doc No Guard; hzla says Swarm (trainer 735)
- Line 809, Harlequin Jack, beautifly, level: doc 24; hzla says 26 (trainer 735)
- Line 810, Harlequin Jack, dustox, level: doc 24; hzla says 26 (trainer 735)
- Line 813, Harlequin Gary, paras, level: doc 23; hzla says 25 (trainer 736)
- Line 814, Harlequin Gary, yanma, level: doc 23; hzla says 25 (trainer 736)
- Line 815, Harlequin Gary, butterfree, level: doc 23; hzla says 25 (trainer 736)
- Line 816, Harlequin Gary, beedrill, level: doc 23; hzla says 25 (trainer 736)
- Line 817, Harlequin Gary, mothim, level: doc 23; hzla says 25 (trainer 736)
- Line 820, Harlequin Anders, dwebble, level: doc 24; hzla says 26 (trainer 737)
- Line 821, Harlequin Anders, parasect, level: doc 24; hzla says 26 (trainer 737)
- Line 822, Harlequin Anders, durant, level: doc 24; hzla says 26 (trainer 737)
- Line 847, Roughneck Ricky, beedrill, level: doc 50; hzla says 52 (trainer 754)
- Line 848, Roughneck Ricky, drapion, level: doc 50; hzla says 52 (trainer 754)
- Line 849, Roughneck Ricky, zoroark, level: doc 50; hzla says 52 (trainer 754)
- Line 850, Roughneck Ricky, escavalier, level: doc 50; hzla says 52 (trainer 754)
- Line 851, Roughneck Ricky, azumarill, level: doc 50; hzla says 52 (trainer 754)
- Line 854, Dancer Jean-Paul (2x), gardevoir, level: doc 50; hzla says 52 (trainer 755)
- Line 855, Dancer Jean-Paul (2x), slaking, level: doc 50; hzla says 52 (trainer 755)
- Line 856, Dancer Jean-Paul (2x), darmanitan, level: doc 50; hzla says 52 (trainer 755)
- Line 857, Dancer Jean-Paul (2x), gastrodon, level: doc 50; hzla says 52 (trainer 755)
- Line 860, Guitarist Tina (3x), blastoise, level: doc 50; hzla says 52 (trainer 756)
- Line 861, Guitarist Tina (3x), charizard, level: doc 50; hzla says 52 (trainer 756)
- Line 862, Guitarist Tina (3x), venusaur, level: doc 50; hzla says 52 (trainer 756)
- Line 863, Guitarist Tina (3x), meganium, level: doc 50; hzla says 52 (trainer 756)
- Line 864, Guitarist Tina (3x), typhlosion, level: doc 50; hzla says 52 (trainer 756)
- Line 865, Guitarist Tina (3x), feraligatr, level: doc 50; hzla says 52 (trainer 756)
- Line 886, Policeman Braven, meowth, level: doc 27; hzla says 22 (trainer 212)
- Line 886, Policeman Braven, meowth, stat level: doc 25; hzla says 20 (trainer 212)
- Line 886, Policeman Braven, meowth, ability: doc Technician; hzla says Unnerve (trainer 212)
- Line 887, Policeman Braven, sandile, level: doc 27; hzla says 22 (trainer 212)
- Line 887, Policeman Braven, sandile, stat level: doc 25; hzla says 20 (trainer 212)
- Line 888, Policeman Braven, dwebble, level: doc 27; hzla says 22 (trainer 212)
- Line 888, Policeman Braven, dwebble, stat level: doc 25; hzla says 20 (trainer 212)
- Line 888, Policeman Braven, dwebble, ability: doc Sturdy; hzla says Shell Armor (trainer 212)
- Line 889, Policeman Braven, darumaka, level: doc 27; hzla says 22 (trainer 212)
- Line 889, Policeman Braven, darumaka, stat level: doc 25; hzla says 20 (trainer 212)
- Line 889, Policeman Braven, darumaka, ability: doc Hustle; hzla says Sheer Force (trainer 212)
- Line 889, Policeman Braven, darumaka, moves: doc ['Facade', 'Fire Punch', 'Uproar']; hzla says ['Facade', 'Uproar', 'Fire Fang'] (trainer 212)
- Line 913, Roughneck Silvester, houndoom, ability: doc Intimidate; hzla says Flash Fire (trainer 217)
- Line 929, Backpacker Clifford, meowth, ability: doc Technician; hzla says Unnerve (trainer 213)
- Line 931, Backpacker Clifford, dwebble, level: doc 27; hzla says 22 (trainer 213)
- Line 931, Backpacker Clifford, dwebble, stat level: doc 25; hzla says 20 (trainer 213)
- Line 932, Backpacker Clifford, darumaka, level: doc 27; hzla says 22 (trainer 213)
- Line 932, Backpacker Clifford, darumaka, stat level: doc 25; hzla says 20 (trainer 213)
- Line 932, Backpacker Clifford, darumaka, ability: doc Hustle; hzla says Sheer Force (trainer 213)
- Line 962, Pokéfan Norbert, misdreavus, moves: doc ['Disarming Voice', 'Psybeam', 'Night Shade', 'Pain Split']; hzla says ['Pain Split', 'Psybeam', 'Night Shade', 'Spit Up'] (trainer 224)
- Line 965, Backpacker Roland, togetic, moves: doc ['Air Cutter', 'Future Sight', 'Metronome', 'Draining Kiss']; hzla says ['Air Cutter', 'Future Sight', 'Metronome', 'Spit Up'] (trainer 222)
- Line 977, Nurse Mariah, bayleef, moves: doc ['Mega Drain', 'Ancient Power', 'Light Screen', 'Reflect']; hzla says ['Mega Drain', 'Spit Up', 'Light Screen', 'Reflect'] (trainer 670)
- Line 978, Nurse Mariah, chansey, moves: doc ['Counter', 'Soft-Boiled', 'Uproar', 'Seismic Toss']; hzla says ['Counter', 'Spit Up', 'Uproar', 'Seismic Toss'] (trainer 670)
- Line 982, Ranger♀ Anja - {Rawst Berry}, ponyta, moves: doc ['Double Kick', 'Charm', 'Flame Charge', 'Double Hit']; hzla says ['Double Kick', 'Raging Fury', 'Flame Charge', 'Double Hit'] (trainer 667)
- Line 1004, Backpacker Clara, swinub, ability: doc Snow Cloak; hzla says Thick Fat (trainer 665)
- Line 1009, Backpacker Sam, machop, level: doc 29; hzla says 28 (trainer 663)
- Line 1009, Backpacker Sam, machop, stat level: doc 27; hzla says 26 (trainer 663)
- Line 1014, Backpacker Tami, archen, moves: doc ['Pluck', 'Rock Tomb', 'Dragon Breath', 'Quick Attack']; hzla says ['Pluck', 'Rock Tomb', 'Spit Up', 'Quick Attack'] (trainer 664)
- Line 1027, Psychic Perry, gastly, ability: doc Levitate; hzla says Cursed Body (trainer 511)
- Line 1028, Psychic Perry, xatu, moves: doc ['Air Cutter', 'Ominous Wind', 'Future Sight', 'Miracle Eye']; hzla says ['Air Cutter', 'Future Sight', 'Ominous Wind', 'Quick Attack'] (trainer 511)
- Line 1055, LENORA AND HAWES - (2x) [Challenge mode], gigalith, level: doc 31; hzla says 33 (trainer 851)
- Line 1056, LENORA AND HAWES - (2x) [Challenge mode], machamp, level: doc 31; hzla says 33 (trainer 851)
- Line 1058, LENORA AND HAWES - (2x) [Challenge mode], stoutland, level: doc 31; hzla says 33 (trainer 850)
- Line 1059, LENORA AND HAWES - (2x) [Challenge mode], unfezant, level: doc 31; hzla says 33 (trainer 850)
- Line 1070, SUBWAY BOSSES INGO AND EMMET (Tag), servine, level: doc 33; hzla says 31 (trainer 361)
- Line 1071, SUBWAY BOSSES INGO AND EMMET (Tag), simipour, level: doc 32; hzla says 30 (trainer 361)
- Line 1073, SUBWAY BOSSES INGO AND EMMET (Tag), pignite, level: doc 33; hzla says 31 (trainer 362)
- Line 1074, SUBWAY BOSSES INGO AND EMMET (Tag), simisage, level: doc 32; hzla says 30 (trainer 362)
- Line 1076, SUBWAY BOSSES INGO AND EMMET (Tag), dewott, level: doc 33; hzla says 31 (trainer 360)
- Line 1077, SUBWAY BOSSES INGO AND EMMET (Tag), simisear, level: doc 32; hzla says 30 (trainer 360)
- Line 1063, SUBWAY BOSSES INGO AND EMMET (Tag), eelektross, level: doc 36; hzla says 34 (trainer 733)
- Line 1063, SUBWAY BOSSES INGO AND EMMET (Tag), eelektross, stat level: doc 34; hzla says 32 (trainer 733)
- Line 1064, SUBWAY BOSSES INGO AND EMMET (Tag), umbreon, level: doc 36; hzla says 34 (trainer 733)
- Line 1064, SUBWAY BOSSES INGO AND EMMET (Tag), umbreon, stat level: doc 34; hzla says 32 (trainer 733)
- Line 1066, SUBWAY BOSSES INGO AND EMMET (Tag), chandelure, level: doc 36; hzla says 34 (trainer 732)
- Line 1066, SUBWAY BOSSES INGO AND EMMET (Tag), chandelure, stat level: doc 34; hzla says 32 (trainer 732)
- Line 1067, SUBWAY BOSSES INGO AND EMMET (Tag), espeon, level: doc 36; hzla says 34 (trainer 732)
- Line 1067, SUBWAY BOSSES INGO AND EMMET (Tag), espeon, stat level: doc 34; hzla says 32 (trainer 732)
- Line 1089, FLANNERY - Hoenn Leader {Choice Band} [Easy and Normal mode], torkoal, ability: doc White Smoke; hzla says Shell Armor (trainer 830)
- Line 1104, Plasma Grunt #359, magneton, level: doc 34; hzla says 36 (trainer 359)
- Line 1105, Plasma Grunt #359, mothim, level: doc 34; hzla says 36 (trainer 359)
- Line 1106, Plasma Grunt #359, watchog, level: doc 34; hzla says 36 (trainer 359)
- Line 1107, Plasma Grunt #359, vaporeon, level: doc 34; hzla says 36 (trainer 359)
- Line 1108, Plasma Grunt #359, donphan, level: doc 34; hzla says 36 (trainer 359)
- Line 1111, Plasma Grunt #751, scolipede, level: doc 34; hzla says 36 (trainer 751)
- Line 1112, Plasma Grunt #751, kingler, level: doc 34; hzla says 36 (trainer 751)
- Line 1113, Plasma Grunt #751, archen, level: doc 34; hzla says 36 (trainer 751)
- Line 1114, Plasma Grunt #751, swoobat, level: doc 34; hzla says 36 (trainer 751)
- Line 1142, Cyclist Hector, ambipom, ability: doc Technician; hzla says Skill Link (trainer 260)
- Line 1154, Cyclist Krissa, munchlax, ability: doc Thick Fat; hzla says Pickup (trainer 261)
- Line 1165, Breeder Galen, audino, ability: doc Healer; hzla says Natural Cure (trainer 299)
- Line 1169, Ranger♂ Forrest - {Cheri Berry}, heracross, ability: doc Moxie; hzla says Skill Link (trainer 298)
- Line 1176, Ranger♀ Serenity - {Pecha Berry}, mudkip, moves: doc ['Rock Throw', 'Aqua Tail', 'Avalanche', 'Curse']; hzla says ['Rock Throw', 'Aqua Tail', 'Curse'] (trainer 297)
- Line 1199, Artist Horton, smeargle, ability: doc Own Tempo; hzla says Moody (trainer 254)
- Line 1283, LEADER ELESA - {TM72 Volt Switch} [Easy and Normal mode], lanturn, ability: doc Water Absorb; hzla says Illuminate (trainer 153)
- Line 1340, Breeder April, chansey, ability: doc Natural Cure; hzla says Healer (trainer 752)
- Line 1366, School Kid♂ Alvin, tangela, ability: doc Leaf Guard; hzla says Regenerator (trainer 265)
- Line 1370, Parasol Lady Tihana, poliwag, level: doc 39; hzla says 37 (trainer 268)
- Line 1370, Parasol Lady Tihana, poliwag, stat level: doc 36; hzla says 34 (trainer 268)
- Line 1371, Parasol Lady Tihana, poliwhirl, level: doc 39; hzla says 37 (trainer 268)
- Line 1371, Parasol Lady Tihana, poliwhirl, stat level: doc 36; hzla says 34 (trainer 268)
- Line 1372, Parasol Lady Tihana, politoed, level: doc 39; hzla says 38 (trainer 268)
- Line 1372, Parasol Lady Tihana, politoed, stat level: doc 36; hzla says 35 (trainer 268)
- Line 1372, Parasol Lady Tihana, politoed, ability: doc Water Absorb; hzla says Drizzle (trainer 268)
- Line 1375, Ranger♂ Richard - {Pecha Berry}, starmie, ability: doc Regenerator; hzla says Analytic (trainer 292)
- Line 1376, Ranger♂ Richard - {Pecha Berry}, sealeo, moves: doc ['Aurora Beam', 'Brine', 'Slack Off', 'Whirlpool']; hzla says ['Whirlpool', 'Super Fang', 'Slack Off', 'Aurora Beam'] (trainer 292)
- Line 1387, HUGH, swellow, level: doc 49; hzla says 46 (trainer 854)
- Line 1387, HUGH, swellow, stat level: doc 46; hzla says 43 (trainer 854)
- Line 1388, HUGH, eelektrik, level: doc 49; hzla says 46 (trainer 854)
- Line 1388, HUGH, eelektrik, stat level: doc 46; hzla says 43 (trainer 854)
- Line 1389, HUGH, flygon, level: doc 50; hzla says 47 (trainer 854)
- Line 1389, HUGH, flygon, stat level: doc 47; hzla says 44 (trainer 854)
- Line 1392, HUGH, lilligant, level: doc 49; hzla says 46 (trainer 854)
- Line 1392, HUGH, lilligant, stat level: doc 46; hzla says 43 (trainer 854)
- Line 1393, HUGH, samurott, level: doc 50; hzla says 47 (trainer 854)
- Line 1393, HUGH, samurott, stat level: doc 47; hzla says 44 (trainer 854)
- Line 1387, HUGH, swellow, level: doc 49; hzla says 46 (trainer 855)
- Line 1387, HUGH, swellow, stat level: doc 46; hzla says 43 (trainer 855)
- Line 1388, HUGH, eelektrik, level: doc 49; hzla says 46 (trainer 855)
- Line 1388, HUGH, eelektrik, stat level: doc 46; hzla says 43 (trainer 855)
- Line 1389, HUGH, flygon, level: doc 50; hzla says 47 (trainer 855)
- Line 1389, HUGH, flygon, stat level: doc 47; hzla says 44 (trainer 855)
- Line 1396, HUGH, camerupt, level: doc 49; hzla says 46 (trainer 855)
- Line 1396, HUGH, camerupt, stat level: doc 46; hzla says 43 (trainer 855)
- Line 1397, HUGH, serperior, level: doc 50; hzla says 47 (trainer 855)
- Line 1397, HUGH, serperior, stat level: doc 47; hzla says 44 (trainer 855)
- Line 1387, HUGH, swellow, level: doc 49; hzla says 46 (trainer 853)
- Line 1387, HUGH, swellow, stat level: doc 46; hzla says 43 (trainer 853)
- Line 1388, HUGH, eelektrik, level: doc 49; hzla says 46 (trainer 853)
- Line 1388, HUGH, eelektrik, stat level: doc 46; hzla says 43 (trainer 853)
- Line 1389, HUGH, flygon, level: doc 50; hzla says 47 (trainer 853)
- Line 1389, HUGH, flygon, stat level: doc 47; hzla says 44 (trainer 853)
- Line 1400, HUGH, starmie, level: doc 49; hzla says 46 (trainer 853)
- Line 1400, HUGH, starmie, stat level: doc 46; hzla says 43 (trainer 853)
- Line 1400, HUGH, starmie, ability: doc Regenerator; hzla says Analytic (trainer 853)
- Line 1401, HUGH, emboar, level: doc 50; hzla says 47 (trainer 853)
- Line 1401, HUGH, emboar, stat level: doc 47; hzla says 44 (trainer 853)
- Line 1415, Hiker Teppei, sableye, moves: doc ['Octazooka', 'Shadow Claw', 'Pain Split', 'Feint Attack']; hzla says ['Octazooka', 'Shadow Force', 'Pain Split', 'Feint Attack'] (trainer 487)
- Line 1419, Worker Morgann, maractus, ability: doc Water Absorb; hzla says Storm Drain (trainer 489)
- Line 1443, Worker Leo, lairon, level: doc 42; hzla says 41 (trainer 506)
- Line 1443, Worker Leo, lairon, stat level: doc 39; hzla says 38 (trainer 506)
- Line 1443, Worker Leo, lairon, moves: doc ['Rock Tomb', 'Metal Burst', 'Body Slam', 'Rock Tomb']; hzla says ['Avalanche', 'Metal Burst', 'Body Slam', 'Rock Tomb'] (trainer 506)
- Line 1460, Worker Brand, onix, ability: doc Weak Armor; hzla says Sturdy (trainer 507)
- Line 1479, Worker Tavarius, marshtomp, ability: doc Anticipation; hzla says Torrent (trainer 323)
- Line 1491, Worker Maynard, gliscor, item: doc Toxic Orb; hzla says  (trainer 319)
- Line 1537, Plasma Grunt #372, vanillish, ability: doc Ice Body; hzla says Snow Cloak (trainer 372)
- Line 1541, Plasma Grunt #373, liepard, ability: doc Unburden; hzla says Prankster (trainer 373)
- Line 1543, Plasma Grunt #373, rotom_wash, species: doc rotom_wash; hzla says rotom (trainer 373)
- Line 1557, Plasma Grunts #375 and #374 - (Tag), stoutland, level: doc 43; hzla says 40 (trainer 371)
- Line 1558, Plasma Grunts #375 and #374 - (Tag), snorlax, level: doc 42; hzla says 39 (trainer 371)
- Line 1558, Plasma Grunts #375 and #374 - (Tag), snorlax, ability: doc Thick Fat; hzla says Immunity (trainer 371)
- Line 1559, Plasma Grunts #375 and #374 - (Tag), cinccino, level: doc 42; hzla says 39 (trainer 371)
- Line 1553, Plasma Grunts #375 and #374 - (Tag), sneasel, ability: doc Pickpocket; hzla says Inner Focus (trainer 374)
- Line 1573, Plasma Grunts #377 and #376 - (Tag), samurott, level: doc 43; hzla says 40 (trainer 369)
- Line 1574, Plasma Grunts #377 and #376 - (Tag), lilligant, level: doc 42; hzla says 39 (trainer 369)
- Line 1582, Plasma Grunts #377 and #376 - (Tag), vibrava, level: doc 42; hzla says 39 (trainer 369)
- Line 1576, Plasma Grunts #377 and #376 - (Tag), serperior, level: doc 43; hzla says 40 (trainer 370)
- Line 1577, Plasma Grunts #377 and #376 - (Tag), camerupt, level: doc 42; hzla says 39 (trainer 370)
- Line 1577, Plasma Grunts #377 and #376 - (Tag), camerupt, ability: doc Simple; hzla says Solid Rock (trainer 370)
- Line 1582, Plasma Grunts #377 and #376 - (Tag), vibrava, level: doc 42; hzla says 39 (trainer 370)
- Line 1579, Plasma Grunts #377 and #376 - (Tag), emboar, level: doc 43; hzla says 40 (trainer 368)
- Line 1579, Plasma Grunts #377 and #376 - (Tag), emboar, ability: doc Mold Breaker; hzla says Reckless (trainer 368)
- Line 1580, Plasma Grunts #377 and #376 - (Tag), starmie, level: doc 42; hzla says 39 (trainer 368)
- Line 1580, Plasma Grunts #377 and #376 - (Tag), starmie, ability: doc Regenerator; hzla says Analytic (trainer 368)
- Line 1582, Plasma Grunts #377 and #376 - (Tag), vibrava, level: doc 42; hzla says 39 (trainer 368)
- Line 1564, Plasma Grunts #377 and #376 - (Tag), mightyena, ability: doc Intimidate; hzla says Moxie (trainer 377)
- Line 1618, Ace Trainer Mary, quagsire, ability: doc Water Absorb; hzla says Unaware (trainer 548)
- Line 1631, Doctor Kit, audino, ability: doc Healer; hzla says Natural Cure (trainer 671)
- Line 1632, Doctor Kit, leavanny, ability: doc Chlorophyll; hzla says Swarm (trainer 671)
- Line 1633, Doctor Kit, blissey, ability: doc Serene Grace; hzla says Natural Cure (trainer 671)
- Line 1634, Doctor Kit, slowbro, ability: doc Own Tempo; hzla says Regenerator (trainer 671)
- Line 1638, Ranger♀ Briana - {Chesto Berry}, lumineon, ability: doc Storm Drain; hzla says Swift Swim (trainer 543)
- Line 1646, Scientist♀ Lumi, dragonair, ability: doc Marvel Scale; hzla says Shed Skin (trainer 542)
- Line 1666, Ace Trainer Shaye, noctowl, ability: doc Insomnia; hzla says Tinted Lens (trainer 547)
- Line 1667, Ace Trainer Shaye, cacturne, ability: doc Water Absorb; hzla says Unnerve (trainer 547)
- Line 1679, Hiker Keith, aron, ability: doc Sturdy; hzla says Filter (trainer 562)
- Line 1690, Backpacker Randall, gabite, moves: doc ['Bulldoze', 'Slash', 'Dual Chop', 'Rock Slide']; hzla says ['Bulldoze', 'Dual Chop', 'Rock Slide', 'Scorching Sands'] (trainer 564)
- Line 1705, Backpacker Annie, monferno, level: doc 46; hzla says 43 (trainer 565)
- Line 1705, Backpacker Annie, monferno, stat level: doc 43; hzla says 40 (trainer 565)
- Line 1705, Backpacker Annie, monferno, ability: doc Blaze; hzla says Iron Fist (trainer 565)
- Line 1706, Backpacker Annie, nosepass, level: doc 46; hzla says 43 (trainer 565)
- Line 1706, Backpacker Annie, nosepass, stat level: doc 43; hzla says 40 (trainer 565)
- Line 1762, Ace Trainer Belle, gabite, ability: doc Rough Skin; hzla says Sand Veil (trainer 683)
- Line 1843, Pokéfan Jude, poliwrath, ability: doc Swift Swim; hzla says Water Absorb (trainer 549)
- Line 1853, Psychic Micki, bronzor, ability: doc Heatproof; hzla says Levitate (trainer 555)
- Line 1856, Psychic Micki, banette, ability: doc Cursed Body; hzla says Frisk (trainer 555)
- Line 1875, Gentleman Daniel, gallade, ability: doc Hyper Cutter; hzla says Justified (trainer 551)
- Line 1878, Psychic Sarah, gothitelle, level: doc 48; hzla says 50 (trainer 556)
- Line 1878, Psychic Sarah, gothitelle, stat level: doc 45; hzla says 47 (trainer 556)
- Line 1894, COLRESS - [Easy and Normal mode], F00, level: doc 52; hzla says 48 (trainer 867)
- Line 1894, COLRESS - [Easy and Normal mode], F00, stat level: doc 52; hzla says 48 (trainer 867)
- Line 1895, COLRESS - [Easy and Normal mode], MT, level: doc 52; hzla says 48 (trainer 867)
- Line 1895, COLRESS - [Easy and Normal mode], MT, stat level: doc 52; hzla says 48 (trainer 867)
- Line 1942, Pilot Winslow, tropius, ability: doc Solar Power; hzla says Chlorophyll (trainer 150)
- Line 1972, LEADER SKYLA - {TM62 Acrobatics} [Easy and Normal mode], archeops, item: doc Sitrus Berry; hzla says Flying Gem (trainer 155)
- Line 2073, Battle Girl Chan - (3x), electivire, moves: doc ['Volt Switch', 'Close Combat', 'Ice Punch', 'Follow Me']; hzla says ['Volt Tackle', 'Close Combat', 'Ice Punch', 'Follow Me'] (trainer 524)
- Line 2085, Ranger♂ Lewis - {Persim Berry}, furret, level: doc 58; hzla says 54 (trainer 515)
- Line 2085, Ranger♂ Lewis - {Persim Berry}, furret, stat level: doc 54; hzla says 50 (trainer 515)
- Line 2086, Ranger♂ Lewis - {Persim Berry}, stantler, level: doc 58; hzla says 54 (trainer 515)
- Line 2086, Ranger♂ Lewis - {Persim Berry}, stantler, stat level: doc 54; hzla says 50 (trainer 515)
- Line 2087, Ranger♂ Lewis - {Persim Berry}, vileplume, level: doc 58; hzla says 54 (trainer 515)
- Line 2087, Ranger♂ Lewis - {Persim Berry}, vileplume, stat level: doc 54; hzla says 50 (trainer 515)
- Line 2127, HUGH, starmie, ability: doc Regenerator; hzla says Natural Cure (trainer 380)
- Line 2130, HUGH, starmie, ability: doc Regenerator; hzla says Analytic (trainer 378)
- Line 2170, Swimmer♀ Arissa, lumineon, ability: doc Storm Drain; hzla says Swift Swim (trainer 317)
- Line 2212, Ace Trainer Kipp, staraptor, moves: doc ['Final Gambit', 'Agility', 'Tailwind', 'Sky Attack']; hzla says ['Final Gambit', 'Take Down', 'Sky Attack', 'Agility'] (trainer 279)
- Line 2218, Fisherman Sid, luvdisc, ability: doc Swift Swim; hzla says Hydration (trainer 283)
- Line 2250, Youngster Jaye, scolipede, ability: doc Poison Point; hzla says Speed Boost (trainer 557)
- Line 2273, Ace Trainer Miguel, jolteon, ability: doc Volt Absorb; hzla says Quick Feet (trainer 134)
- Line 2313, Ranger♂ Daryl - (Rot) {Sitrus Berry}, luxray, moves: doc ['Volt Tackle', 'Crunch', 'Ice Fang', 'Fire Fang']; hzla says ['Volt Tackle', 'Crunch', 'Ice Fang', 'Ice Fang'] (trainer 294)
- Line 2342, ZINZOLIN (and Plasma Grunt #705) - (2x), samurott, level: doc 56; hzla says 52 (trainer 702)
- Line 2348, ZINZOLIN (and Plasma Grunt #705) - (2x), eelektross, level: doc 55; hzla says 51 (trainer 702)
- Line 2349, ZINZOLIN (and Plasma Grunt #705) - (2x), flygon, level: doc 55; hzla says 51 (trainer 702)
- Line 2344, ZINZOLIN (and Plasma Grunt #705) - (2x), serperior, level: doc 56; hzla says 52 (trainer 703)
- Line 2348, ZINZOLIN (and Plasma Grunt #705) - (2x), eelektross, level: doc 55; hzla says 51 (trainer 703)
- Line 2349, ZINZOLIN (and Plasma Grunt #705) - (2x), flygon, level: doc 55; hzla says 51 (trainer 703)
- Line 2346, ZINZOLIN (and Plasma Grunt #705) - (2x), emboar, level: doc 56; hzla says 52 (trainer 701)
- Line 2346, ZINZOLIN (and Plasma Grunt #705) - (2x), emboar, ability: doc Reckless; hzla says Mold Breaker (trainer 701)
- Line 2348, ZINZOLIN (and Plasma Grunt #705) - (2x), eelektross, level: doc 55; hzla says 51 (trainer 701)
- Line 2349, ZINZOLIN (and Plasma Grunt #705) - (2x), flygon, level: doc 55; hzla says 51 (trainer 701)
- Line 2377, BENGA - [Easy and Normal mode], garchomp, ability: doc Rough Skin; hzla says Sand Veil (trainer 885)
- Line 2378, BENGA - [Easy and Normal mode], metagross, item: doc Focus Sash; hzla says Shuca Berry (trainer 885)
- Line 2380, BENGA - [Easy and Normal mode], conkeldurr, item: doc Flame Orb; hzla says Leftovers (trainer 885)
- Line 2419, Gentleman Stonewall - (2x), breloom, moves: doc ['Rock Tomb', 'Protect', 'Force Palm', 'Bullet Seed']; hzla says ['Bullet Punch', 'Force Palm', 'Protect', 'Rock Tomb'] (trainer 177)
- Line 2432, Artist Gough, simisage, ability: doc Gluttony; hzla says Overgrow (trainer 338)
- Line 2441, Hoopster Derrick - (3x), electivire, ability: doc Vital Spirit; hzla says Motor Drive (trainer 726)
- Line 2487, WINONA - Hoenn Leader {Old Amber} [Easy and Normal mode], swellow, item: doc Life Orb; hzla says Flame Orb (trainer 836)
- Line 2487, WINONA - Hoenn Leader {Old Amber} [Easy and Normal mode], swellow, moves: doc ['Protect', 'Brave Bird', 'Quick Attack', 'Facade']; hzla says ['Protect', 'Hurricane', 'Brave Bird', 'Facade'] (trainer 836)
- Line 2532, Shadow Triad - First Battle, bisharp, level: doc 63; hzla says 62 (trainer 583)
- Line 2532, Shadow Triad - First Battle, bisharp, stat level: doc 59; hzla says 58 (trainer 583)
- Line 2533, Shadow Triad - First Battle, crobat, level: doc 63; hzla says 62 (trainer 583)
- Line 2533, Shadow Triad - First Battle, crobat, stat level: doc 59; hzla says 58 (trainer 583)
- Line 2534, Shadow Triad - First Battle, scyther, level: doc 63; hzla says 62 (trainer 583)
- Line 2534, Shadow Triad - First Battle, scyther, stat level: doc 59; hzla says 58 (trainer 583)
- Line 2565, Biker Phillip, honchkrow, moves: doc ['Sucker Punch', 'Astonish', 'Night Slash', 'Drill Peck']; hzla says ['Night Slash', 'Drill Peck', 'Sucker Punch', 'Perish Song'] (trainer 331)
- Line 2566, Biker Phillip, liepard, ability: doc Unburden; hzla says Prankster (trainer 331)
- Line 2619, LEADER DRAYDEN - {TM02 Dragon Claw} [Easy and Normal mode], druddigon, moves: doc ['Thunder Punch', 'Superpower', 'Sucker Punch', 'Dragon Rush']; hzla says ['Dragon Rush', 'Thunder Punch', 'Superpower', 'Dragon Rush'] (trainer 159)
- Line 2665, Black Belt Drago, onix, level: doc 66; hzla says 64 (trainer 469)
- Line 2665, Black Belt Drago, onix, stat level: doc 62; hzla says 60 (trainer 469)
- Line 2666, Black Belt Drago, primeape, level: doc 66; hzla says 64 (trainer 469)
- Line 2666, Black Belt Drago, primeape, stat level: doc 62; hzla says 60 (trainer 469)
- Line 2693, Fisherman Kenzo, corsola, moves: doc ['Icicle Spear', 'Ingrain', 'Bubble Beam', 'Rock Blast']; hzla says ['Spit Up', 'Ingrain', 'Icicle Spear', 'Rock Blast'] (trainer 312)
- Line 2710, Swimmer Harold, octillery, ability: doc Sniper; hzla says Mold Breaker (trainer 310)
- Line 2779, TATE AND LIZA (2x) - {TM17 Protect} [Challenge mode], jynx, moves: doc ['Aura Sphere', 'Psyshock', 'Ice Beam', 'Draining Kiss']; hzla says ['Lovely Kiss', 'Draining Kiss', 'Ice Beam', 'Psyshock'] (trainer 841)
- Line 2793, Ace Trainer Doyle, lanturn, ability: doc Water Absorb; hzla says Volt Absorb (trainer 350)
- Line 2829, LEADER MARLON - {TM51 Wave Crash} [Easy and Normal mode], tentacruel, ability: doc Rain Dish; hzla says Liquid Ooze (trainer 160)
- Line 2854, Plasma Grunt #500, masquerain, level: doc 65; hzla says 64 (trainer 500)
- Line 2855, Plasma Grunt #500, rhyperior, level: doc 65; hzla says 64 (trainer 500)
- Line 2856, Plasma Grunt #500, dusknoir, level: doc 65; hzla says 64 (trainer 500)
- Line 2857, Plasma Grunt #500, beartic, level: doc 65; hzla says 64 (trainer 500)
- Line 2858, Plasma Grunt #500, rapidash, level: doc 65; hzla says 64 (trainer 500)
- Line 2871, Plasma Grunts #798 and #799 - (Tag), eelektross, level: doc 66; hzla says 62 (trainer 794)
- Line 2872, Plasma Grunts #798 and #799 - (Tag), flygon, level: doc 66; hzla says 62 (trainer 794)
- Line 2875, Plasma Grunts #798 and #799 - (Tag), emboar, level: doc 67; hzla says 63 (trainer 794)
- Line 2875, Plasma Grunts #798 and #799 - (Tag), emboar, ability: doc Reckless; hzla says Mold Breaker (trainer 794)
- Line 2871, Plasma Grunts #798 and #799 - (Tag), eelektross, level: doc 66; hzla says 62 (trainer 796)
- Line 2872, Plasma Grunts #798 and #799 - (Tag), flygon, level: doc 66; hzla says 62 (trainer 796)
- Line 2878, Plasma Grunts #798 and #799 - (Tag), serperior, level: doc 67; hzla says 63 (trainer 796)
- Line 2871, Plasma Grunts #798 and #799 - (Tag), eelektross, level: doc 66; hzla says 62 (trainer 795)
- Line 2872, Plasma Grunts #798 and #799 - (Tag), flygon, level: doc 66; hzla says 62 (trainer 795)
- Line 2881, Plasma Grunts #798 and #799 - (Tag), samurott, level: doc 67; hzla says 63 (trainer 795)
- Line 2881, Plasma Grunts #798 and #799 - (Tag), samurott, ability: doc Water Veil; hzla says Shell Armor (trainer 795)
- Line 2863, Plasma Grunts #798 and #799 - (Tag), chatot, ability: doc Tangled Feet; hzla says Soundproof (trainer 799)
- Line 2904, Plasma Grunt #436/451, bisharp, level: doc 66; hzla says 62 (trainer 436)
- Line 2904, Plasma Grunt #436/451, bisharp, stat level: doc 62; hzla says 58 (trainer 436)
- Line 2905, Plasma Grunt #436/451, vileplume, level: doc 66; hzla says 62 (trainer 436)
- Line 2905, Plasma Grunt #436/451, vileplume, stat level: doc 62; hzla says 58 (trainer 436)
- Line 2906, Plasma Grunt #436/451, tyranitar, level: doc 66; hzla says 62 (trainer 436)
- Line 2906, Plasma Grunt #436/451, tyranitar, stat level: doc 62; hzla says 58 (trainer 436)
- Line 2916, Plasma Grunt #440, scrafty, level: doc 66; hzla says 62 (trainer 440)
- Line 2917, Plasma Grunt #440, liepard, level: doc 66; hzla says 62 (trainer 440)
- Line 2922, Plasma Grunt #428/443, weezing, level: doc 67; hzla says 63 (trainer 428)
- Line 2922, Plasma Grunt #428/443, weezing, stat level: doc 63; hzla says 59 (trainer 428)
- Line 2946, ZINZOLIN (and Plasma Grunt #797) - Plasma Frigate 1st Match (Tag), eelektross, level: doc 66; hzla says 62 (trainer 794)
- Line 2947, ZINZOLIN (and Plasma Grunt #797) - Plasma Frigate 1st Match (Tag), flygon, level: doc 66; hzla says 62 (trainer 794)
- Line 2950, ZINZOLIN (and Plasma Grunt #797) - Plasma Frigate 1st Match (Tag), emboar, level: doc 67; hzla says 63 (trainer 794)
- Line 2950, ZINZOLIN (and Plasma Grunt #797) - Plasma Frigate 1st Match (Tag), emboar, ability: doc Reckless; hzla says Mold Breaker (trainer 794)
- Line 2946, ZINZOLIN (and Plasma Grunt #797) - Plasma Frigate 1st Match (Tag), eelektross, level: doc 66; hzla says 62 (trainer 796)
- Line 2947, ZINZOLIN (and Plasma Grunt #797) - Plasma Frigate 1st Match (Tag), flygon, level: doc 66; hzla says 62 (trainer 796)
- Line 2953, ZINZOLIN (and Plasma Grunt #797) - Plasma Frigate 1st Match (Tag), serperior, level: doc 67; hzla says 63 (trainer 796)
- Line 2946, ZINZOLIN (and Plasma Grunt #797) - Plasma Frigate 1st Match (Tag), eelektross, level: doc 66; hzla says 62 (trainer 795)
- Line 2947, ZINZOLIN (and Plasma Grunt #797) - Plasma Frigate 1st Match (Tag), flygon, level: doc 66; hzla says 62 (trainer 795)
- Line 2956, ZINZOLIN (and Plasma Grunt #797) - Plasma Frigate 1st Match (Tag), samurott, level: doc 67; hzla says 63 (trainer 795)
- Line 2956, ZINZOLIN (and Plasma Grunt #797) - Plasma Frigate 1st Match (Tag), samurott, ability: doc Water Veil; hzla says Shell Armor (trainer 795)
- Line 2969, Plasma Grunt #724, girafarig, level: doc 66; hzla says 62 (trainer 724)
- Line 2969, Plasma Grunt #724, girafarig, stat level: doc 62; hzla says 58 (trainer 724)
- Line 3055, Shadow Triad - (2x), feraligatr, level: doc 70; hzla says 69 (trainer 348)
- Line 3055, Shadow Triad - (2x), feraligatr, stat level: doc 66; hzla says 65 (trainer 348)
- Line 3058, Shadow Triad - (3x), bisharp, moves: doc ['Sucker Punch', 'Iron Head', 'Substitute', 'Aerial Ace']; hzla says ['Sucker Punch', 'Metal Burst', 'Substitute', 'Aerial Ace'] (trainer 498)
- Unmatched Pokemon, line 3076, Black Kyurem - Blaze Black 2 Redux, kyurem_black
- Unmatched Pokemon, line 3079, White Kyurem - Volt White 2 Redux, kyurem_white
- Line 3148, Ace Trainer Miki, mismagius, ability: doc Levitate; hzla says Infiltrator (trainer 486)
- Line 3216, Ace Trainer Chandra, swampert, ability: doc Anticipation; hzla says Torrent (trainer 611)
- Line 3266, Ace Trainer Chandra, swampert, ability: doc Anticipation; hzla says Torrent (trainer 611)
- Line 3316, Battle Girl Chalina, hitmonchan, ability: doc Iron Fist; hzla says Keen Eye (trainer 609)
- Line 3381, Veteran Hugo, starmie, ability: doc Regenerator; hzla says Analytic (trainer 612)
- Line 3406, HUGH - Victory Road, starmie, ability: doc Regenerator; hzla says Natural Cure (trainer 686)
- Line 3409, HUGH - Victory Road, starmie, ability: doc Regenerator; hzla says Analytic (trainer 684)
- Line 3423, SHAUNTAL - [Easy and Normal mode], jellicent, ability: doc Water Absorb; hzla says Cursed Body (trainer 38)
- Line 3423, SHAUNTAL - [Easy and Normal mode], jellicent, item: doc Leftovers; hzla says Sitrus Berry (trainer 38)
- Line 3423, SHAUNTAL - [Easy and Normal mode], jellicent, moves: doc ['Scald', 'Icy Wind', 'Shadow Ball', 'Recover']; hzla says ['Ice Beam', 'Shadow Ball', 'Scald', 'Will-O-Wisp'] (trainer 38)
- Line 3424, SHAUNTAL - [Easy and Normal mode], drifblim, ability: doc Flare Boost; hzla says Aftermath (trainer 38)
- Line 3427, SHAUNTAL - [Easy and Normal mode], sableye, ability: doc Prankster; hzla says Keen Eye (trainer 38)
- Line 3433, SHAUNTAL - (3x) [Challenge mode], mismagius, ability: doc Levitate; hzla says Infiltrator (trainer 772)
- Line 3443, GRIMSLEY - [Easy and Normal mode], krookodile, ability: doc Intimidate; hzla says Moxie (trainer 40)
- Line 3443, GRIMSLEY - [Easy and Normal mode], krookodile, item: doc Leftovers; hzla says Choice Scarf (trainer 40)
- Line 3443, GRIMSLEY - [Easy and Normal mode], krookodile, moves: doc ['Earthquake', 'Crunch', 'Superpower', 'Stone Edge']; hzla says ['Earthquake', 'Sucker Punch', 'Superpower', 'Stone Edge'] (trainer 40)
- Line 3444, GRIMSLEY - [Easy and Normal mode], scrafty, item: doc Focus Sash; hzla says Leftovers (trainer 40)
- Line 3460, CAITLIN - [Easy and Normal mode], musharna, moves: doc ['Trick Room', 'Psyshock', 'Shadow Ball', 'Moonblast']; hzla says ['Trick Room', 'Psyshock', 'Shadow Ball', 'Moonlight'] (trainer 41)
- Line 3471, CAITLIN - (2x) [Challenge mode], xatu, ability: doc Magic Bounce; hzla says Synchronize (trainer 775)
- Line 3471, CAITLIN - (2x) [Challenge mode], xatu, item: doc Focus Sash; hzla says Leftovers (trainer 775)
- Line 3478, MARSHAL - [Easy and Normal mode], lucario, ability: doc Justified; hzla says Inner Focus (trainer 39)
- Line 3478, MARSHAL - [Easy and Normal mode], lucario, moves: doc ['High Jump Kick', 'Ice Punch', 'Bullet Punch', 'Dark Pulse']; hzla says ['High Jump Kick', 'Extreme Speed', 'Ice Punch', 'Dark Pulse'] (trainer 39)
- Line 3479, MARSHAL - [Easy and Normal mode], sawk, moves: doc ['Close Combat', 'Stone Edge', 'Earthquake', 'Poison Jab']; hzla says ['Close Combat', 'Stone Edge', 'Earthquake', 'Ice Punch'] (trainer 39)
- Line 3482, MARSHAL - [Easy and Normal mode], conkeldurr, ability: doc Iron Fist; hzla says Sheer Force (trainer 39)
- Line 3495, CHAMPION IRIS - [Easy and Normal mode], dragonite, item: doc Leftovers; hzla says Yache Berry (trainer 341)
- Line 3495, CHAMPION IRIS - [Easy and Normal mode], dragonite, moves: doc ['Dragon Dance', 'Dual Wingbeat', 'Dragon Claw', 'Fire Punch']; hzla says ['Dragon Dance', 'Hurricane', 'Outrage', 'Fire Punch'] (trainer 341)
- Line 3497, CHAMPION IRIS - [Easy and Normal mode], hydreigon, moves: doc ['Draco Meteor', 'Flash Cannon', 'Focus Blast', 'Dark Pulse']; hzla says ['Draco Meteor', 'Fire Blast', 'Focus Blast', 'Dark Pulse'] (trainer 341)
- Line 3536, STEVEN, metagross, level: doc 96; hzla says 97 (trainer 842)
- Line 3537, STEVEN, claydol, level: doc 94; hzla says 95 (trainer 842)
- Line 3538, STEVEN, empoleon, level: doc 94; hzla says 95 (trainer 842)
- Line 3539, STEVEN, aerodactyl, level: doc 94; hzla says 95 (trainer 842)
- Line 3540, STEVEN, aggron, level: doc 94; hzla says 95 (trainer 842)
- Line 3541, STEVEN, cradily, level: doc 94; hzla says 95 (trainer 842)
- Line 3545, WALLACE, pelipper, level: doc 96; hzla says 97 (trainer 843)
- Line 3546, WALLACE, ludicolo, level: doc 94; hzla says 95 (trainer 843)
- Line 3547, WALLACE, milotic, level: doc 94; hzla says 95 (trainer 843)
- Line 3548, WALLACE, gyarados, level: doc 94; hzla says 95 (trainer 843)
- Line 3549, WALLACE, kabutops, level: doc 94; hzla says 95 (trainer 843)
- Line 3550, WALLACE, sharpedo, level: doc 94; hzla says 95 (trainer 843)
- Line 3550, WALLACE, sharpedo, ability: doc Speed Boost; hzla says Rough Skin (trainer 843)
- Line 3564, SHAUNTAL - [Normal mode] - Round Two, sableye, ability: doc Prankster; hzla says Keen Eye (trainer 143)
- Line 3570, SHAUNTAL - [Challenge mode] - Round Two, gengar, moves: doc ['Disable', 'Thunderbolt', 'Shadow Ball', 'Focus Blast']; hzla says ['Sludge Bomb', 'Nasty Plot', 'Shadow Ball', 'Focus Blast'] (trainer 777)
- Line 3571, SHAUNTAL - [Challenge mode] - Round Two, golurk, moves: doc ['Earthquake', 'Shadow Punch', 'Thunder Punch', 'Ice Punch']; hzla says ['Earthquake', 'Shadow Sneak', 'Thunder Punch', 'Shadow Punch'] (trainer 777)
- Line 3599, CAITLIN - [Normal mode] - Round Two, gothitelle, ability: doc Shadow Tag; hzla says Frisk (trainer 146)
- Line 3605, CAITLINE - (2x) [Challenge mode] - Round Two, gothitelle, ability: doc Shadow Tag; hzla says Frisk (trainer 780)
- Line 3607, CAITLINE - (2x) [Challenge mode] - Round Two, darmanitan, species: doc darmanitan; hzla says darmanitan_zen (trainer 780)
- Line 3607, CAITLINE - (2x) [Challenge mode] - Round Two, darmanitan, ability: doc Levitate; hzla says Sheer Force (trainer 780)
- Line 3609, CAITLINE - (2x) [Challenge mode] - Round Two, metagross, ability: doc Iron Fist; hzla says Clear Body (trainer 780)
- Line 3615, MARSHAL - [Normal mode] - Round Two, lucario, ability: doc Justified; hzla says Inner Focus (trainer 144)
- Line 3619, MARSHAL - [Normal mode] - Round Two, conkeldurr, ability: doc Iron Fist; hzla says Sheer Force (trainer 144)
- Line 3624, MARSHAL - [Challenge mode] - Round Two, lucario, ability: doc Justified; hzla says Inner Focus (trainer 779)
- Line 3625, MARSHAL - [Challenge mode] - Round Two, mienshao, ability: doc Regenerator; hzla says Reckless (trainer 779)
- Line 3635, CHAMPION IRIS - [Normal mode] - Round Two, excadrill, ability: doc Mold Breaker; hzla says Sand Force (trainer 536)
- Line 3642, CHAMPION IRIS - [Challenge mode] - Round Two, dragonite, ability: doc Multiscale; hzla says Inner Focus (trainer 781)
- Line 3666, HUGH - Undella Town, starmie, ability: doc Analytic; hzla says Natural Cure (trainer 695)
- Line 3669, HUGH - Undella Town, starmie, ability: doc Analytic; hzla says Natural Cure (trainer 693)
- Line 3669, HUGH - Undella Town, starmie, item: doc Red Card; hzla says Sitrus Berry (trainer 693)
- Line 3675, HUGH - Driftveil City, swellow, level: doc 86; hzla says 85 (trainer 697)
- Line 3676, HUGH - Driftveil City, eelektross, level: doc 86; hzla says 85 (trainer 697)
- Line 3677, HUGH - Driftveil City, flygon, level: doc 86; hzla says 85 (trainer 697)
- Line 3680, HUGH - Driftveil City, lilligant, level: doc 86; hzla says 85 (trainer 697)
- Line 3681, HUGH - Driftveil City, samurott, level: doc 88; hzla says 87 (trainer 697)
- Line 3682, HUGH - Driftveil City, camerupt, level: doc 86; hzla says 85 (trainer 697)
- Line 3675, HUGH - Driftveil City, swellow, level: doc 86; hzla says 85 (trainer 698)
- Line 3676, HUGH - Driftveil City, eelektross, level: doc 86; hzla says 85 (trainer 698)
- Line 3677, HUGH - Driftveil City, flygon, level: doc 86; hzla says 85 (trainer 698)
- Line 3685, HUGH - Driftveil City, camerupt, level: doc 86; hzla says 85 (trainer 698)
- Line 3686, HUGH - Driftveil City, serperior, level: doc 88; hzla says 87 (trainer 698)
- Line 3687, HUGH - Driftveil City, starmie, level: doc 86; hzla says 85 (trainer 698)
- Line 3687, HUGH - Driftveil City, starmie, ability: doc Analytic; hzla says Natural Cure (trainer 698)
- Line 3675, HUGH - Driftveil City, swellow, level: doc 86; hzla says 85 (trainer 696)
- Line 3676, HUGH - Driftveil City, eelektross, level: doc 86; hzla says 85 (trainer 696)
- Line 3677, HUGH - Driftveil City, flygon, level: doc 86; hzla says 85 (trainer 696)
- Line 3690, HUGH - Driftveil City, starmie, level: doc 86; hzla says 85 (trainer 696)
- Line 3690, HUGH - Driftveil City, starmie, ability: doc Analytic; hzla says Natural Cure (trainer 696)
- Line 3690, HUGH - Driftveil City, starmie, item: doc Red Card; hzla says Sitrus Berry (trainer 696)
- Line 3691, HUGH - Driftveil City, emboar, level: doc 88; hzla says 87 (trainer 696)
- Line 3692, HUGH - Driftveil City, lilligant, level: doc 86; hzla says 85 (trainer 696)
- Line 3701, COLRESS, rotom, species: doc rotom; hzla says rotom_wash (trainer 813)
- Line 3703, COLRESS, magnezone, ability: doc Analytic; hzla says Magnet Pull (trainer 813)
- Line 3704, COLRESS, beheeyem, ability: doc Analytic; hzla says Synchronize (trainer 813)
- Line 3713, Shadow Triad, bisharp, level: doc 85; hzla says 86 (trainer 687)
- Line 3713, Shadow Triad, bisharp, moves: doc ['Sucker Punch', 'Iron Head', 'Swords Dance', 'Brick Break']; hzla says ['Sucker Punch', 'Iron Head', 'X-Scissor', 'Brick Break'] (trainer 687)
- Line 3714, Shadow Triad, crobat, level: doc 85; hzla says 86 (trainer 687)
- Line 3715, Shadow Triad, scizor, level: doc 85; hzla says 86 (trainer 687)
- Line 3715, Shadow Triad, scizor, moves: doc ['U-turn', 'Bug Bite', 'Bullet Punch', 'Pursuit']; hzla says ['U-turn', 'Acrobatics', 'Bullet Punch', 'Pursuit'] (trainer 687)
- Line 3716, Shadow Triad, flygon, level: doc 85; hzla says 86 (trainer 687)
- Line 3716, Shadow Triad, flygon, moves: doc ['Quiver Dance', 'Bug Buzz', 'Flamethrower', 'Dragon Pulse']; hzla says ['U-turn', 'Outrage', 'Flamethrower', 'Earthquake'] (trainer 687)
- Line 3717, Shadow Triad, absol, level: doc 87; hzla says 88 (trainer 687)
- Line 3717, Shadow Triad, absol, moves: doc ['Night Slash', 'Megahorn', 'Sucker Punch', 'Psycho Cut']; hzla says ['Me First', 'Megahorn', 'Sucker Punch', 'Psycho Cut'] (trainer 687)
- Line 3720, Shadow Triad, banette, level: doc 85; hzla says 86 (trainer 688)
- Line 3721, Shadow Triad, bisharp, level: doc 85; hzla says 86 (trainer 688)
- Line 3722, Shadow Triad, weezing, level: doc 85; hzla says 86 (trainer 688)
- Line 3723, Shadow Triad, electrode, level: doc 85; hzla says 86 (trainer 688)
- Line 3724, Shadow Triad, accelgor, level: doc 87; hzla says 88 (trainer 688)
- Line 3724, Shadow Triad, accelgor, ability: doc Unburden; hzla says Sticky Hold (trainer 688)
- Line 3727, Shadow Triad, bisharp, level: doc 85; hzla says 86 (trainer 689)
- Line 3727, Shadow Triad, bisharp, moves: doc ['Sucker Punch', 'Iron Head', 'X-Scissor', 'Substitute']; hzla says ['Sucker Punch', 'Iron Head', 'X-Scissor', 'Guillotine'] (trainer 689)
- Line 3728, Shadow Triad, ninjask, level: doc 85; hzla says 86 (trainer 689)
- Line 3729, Shadow Triad, venomoth, level: doc 85; hzla says 86 (trainer 689)
- Line 3730, Shadow Triad, weavile, level: doc 85; hzla says 86 (trainer 689)
- Line 3730, Shadow Triad, weavile, moves: doc ['Feint Attack', 'Ice Shard', 'Low Kick', 'Fake Out']; hzla says ['Night Slash', 'Ice Shard', 'Low Kick', 'Fake Out'] (trainer 689)
- Line 3731, Shadow Triad, gengar, level: doc 87; hzla says 88 (trainer 689)
- Line 3744, Gamefreak Morimoto, braviary, level: doc 94; hzla says 92 (trainer 140)
- Line 3745, Gamefreak Morimoto, excadrill, level: doc 94; hzla says 92 (trainer 140)
- Line 3745, Gamefreak Morimoto, excadrill, ability: doc Mold Breaker; hzla says Sand Force (trainer 140)
- Line 3746, Gamefreak Morimoto, alomomola, level: doc 94; hzla says 92 (trainer 140)
- Line 3747, Gamefreak Morimoto, liepard, level: doc 94; hzla says 92 (trainer 140)
- Line 3748, Gamefreak Morimoto, zebstrika, level: doc 94; hzla says 92 (trainer 140)
- Line 3748, Gamefreak Morimoto, zebstrika, ability: doc Sap Sipper; hzla says Lightning Rod (trainer 140)
- Line 3749, Gamefreak Morimoto, mew, level: doc 96; hzla says 94 (trainer 140)
- Line 3749, Gamefreak Morimoto, mew, ability: doc Levitate; hzla says Synchronize (trainer 140)
- Line 3752, Gamefreak Nishino, clefable, level: doc 94; hzla says 92 (trainer 591)
- Line 3753, Gamefreak Nishino, audino, level: doc 94; hzla says 92 (trainer 591)
- Line 3754, Gamefreak Nishino, wigglytuff, level: doc 94; hzla says 92 (trainer 591)
- Line 3755, Gamefreak Nishino, porygon2, level: doc 94; hzla says 92 (trainer 591)
- Line 3756, Gamefreak Nishino, blissey, level: doc 94; hzla says 92 (trainer 591)
- Line 3757, Gamefreak Nishino, snorlax, level: doc 96; hzla says 94 (trainer 591)
- Line 3766, HILBERT, archeops, moves: doc ['Acrobatics', 'Head Smash', 'Accelerock', 'Aqua Tail']; hzla says ['Acrobatics', 'Head Smash', 'Rollout', 'Aqua Tail'] (trainer 822)
- Line 3769, HILBERT, musharna, moves: doc ['Moonblast', 'Psyshock', 'Psych Up', 'Shadow Ball']; hzla says ['Moonblast', 'Psychic', 'Charge Beam', 'Shadow Ball'] (trainer 822)
- Line 3774, HILDA, carracosta, moves: doc ['Shell Smash', 'Stone Edge', 'Waterfall', 'Aqua Jet']; hzla says ['Shell Smash', 'Stone Edge', 'Waterfall', 'Aqua Tail'] (trainer 823)
- Line 3777, HILDA, musharna, moves: doc ['Moonblast', 'Psyshock', 'Psych Up', 'Shadow Ball']; hzla says ['Moonblast', 'Psychic', 'Charge Beam', 'Shadow Ball'] (trainer 823)
- Line 3786, LEADER CILAN, ferrothorn, level: doc 86; hzla says 87 (trainer 496)
- Line 3786, LEADER CILAN, ferrothorn, moves: doc ['Power Whip', 'Gyro Ball', 'Rock Climb', 'Leech Seed']; hzla says ['Power Whip', 'Gyro Ball', 'Bulldoze', 'Leech Seed'] (trainer 496)
- Line 3787, LEADER CILAN, lilligant, level: doc 86; hzla says 87 (trainer 496)
- Line 3787, LEADER CILAN, lilligant, moves: doc ['Petal Dance', 'Sleep Powder', 'Extrasensory', 'Quiver Dance']; hzla says ['Petal Dance', 'Sleep Powder', 'Hidden Power', 'Quiver Dance'] (trainer 496)
- Line 3788, LEADER CILAN, simisage, level: doc 88; hzla says 89 (trainer 496)
- Line 3788, LEADER CILAN, simisage, ability: doc Overgrow; hzla says Gluttony (trainer 496)
- Line 3791, LEADER CRESS, azumarill, level: doc 86; hzla says 87 (trainer 495)
- Line 3791, LEADER CRESS, azumarill, ability: doc Huge Power; hzla says Thick Fat (trainer 495)
- Line 3791, LEADER CRESS, azumarill, item: doc Muscle Band; hzla says Wide Lens (trainer 495)
- Line 3791, LEADER CRESS, azumarill, moves: doc ['Aqua Tail', 'Play Rough', 'Ice Punch', 'Aqua Jet']; hzla says ['Aqua Tail', 'Superpower', 'Ice Punch', 'Aqua Jet'] (trainer 495)
- Line 3792, LEADER CRESS, slowking, level: doc 86; hzla says 87 (trainer 495)
- Line 3793, LEADER CRESS, simipour, level: doc 88; hzla says 89 (trainer 495)
- Line 3793, LEADER CRESS, simipour, ability: doc Torrent; hzla says Gluttony (trainer 495)
- Line 3796, LEADER CHILI, arcanine, level: doc 86; hzla says 87 (trainer 494)
- Line 3796, LEADER CHILI, arcanine, item: doc Passho Berry; hzla says Muscle Band (trainer 494)
- Line 3796, LEADER CHILI, arcanine, moves: doc ['Will-O-Wisp', 'Flare Blitz', 'Extreme Speed', 'Wild Charge']; hzla says ['Howl', 'Flare Blitz', 'Extreme Speed', 'Wild Charge'] (trainer 494)
- Line 3797, LEADER CHILI, darmanitan, level: doc 86; hzla says 87 (trainer 494)
- Line 3798, LEADER CHILI, simisear, level: doc 88; hzla says 89 (trainer 494)
- Line 3798, LEADER CHILI, simisear, ability: doc Blaze; hzla says Gluttony (trainer 494)
- Line 3807, BENGA - White Tree Hollow, zekrom, moves: doc ['Bolt Strike', 'Dragon Claw', 'Rock Slide', 'Dragon Dance']; hzla says ['Bolt Strike', 'Outrage', 'Zen Headbutt', 'Hone Claws'] (trainer 201)
- Line 3810, BENGA - White Tree Hollow, volcarona, moves: doc ['Quiver Dance', 'Bug Buzz', 'Hurricane', 'Giga Drain']; hzla says ['Quiver Dance', 'Bug Buzz', 'Hurricane', 'Roost'] (trainer 201)
- Line 3813, BENGA - Black Skyscraper, groudon, moves: doc ['Earthquake', 'Dragon Tail', 'Stone Edge', 'Stealth Rock']; hzla says ['Earthquake', 'Fire Punch', 'Stone Edge', 'Bulk Up'] (trainer 202)
- Line 3815, BENGA - Black Skyscraper, ho_oh, moves: doc ['Flame Charge', 'Brave Bird', 'Earthquake', 'Roost']; hzla says ['Mystical Fire', 'Brave Bird', 'Earthquake', 'Roost'] (trainer 202)
- Line 3816, BENGA - Black Skyscraper, latias, moves: doc ['Dragon Pulse', 'Psychic', 'Solar Beam', 'Mystical Fire']; hzla says ['Dragon Pulse', 'Psychic', 'Solar Beam', 'Roost'] (trainer 202)
- Line 3825, BLUE, pidgeot, level: doc 89; hzla says 90 (trainer 856)
- Line 3826, BLUE, arcanine, level: doc 89; hzla says 90 (trainer 856)
- Line 3827, BLUE, rhyperior, level: doc 89; hzla says 90 (trainer 856)
- Line 3828, BLUE, exeggutor, level: doc 89; hzla says 90 (trainer 856)
- Line 3829, BLUE, gyarados, level: doc 89; hzla says 90 (trainer 856)
- Line 3830, BLUE, machamp, level: doc 89; hzla says 90 (trainer 856)
- Line 3830, BLUE, machamp, moves: doc ['Dynamic Punch', 'Stone Edge', 'Thunder Punch']; hzla says ['Dynamic Punch', 'Stone Edge', 'Thunder Punch', 'Knock Off'] (trainer 856)
- Line 3852, N - First battle, zekrom, moves: doc ['Bolt Strike', 'Outrage', 'Dragon Dance', 'Stone Edge']; hzla says ['Bolt Strike', 'Outrage', 'Zen Headbutt', 'Stone Edge'] (trainer 5)
- Line 3859, N - N's Castle, species: doc ['pelipper', 'beartic', 'kingdra', 'toxicroak', 'gorebyss', 'rotom']; hzla says ['politoed', 'dragonite', 'kingdra', 'toxicroak', 'gorebyss', 'rotom_wash'] (trainer 782)
- Unmatched Pokemon, line 3860, N - N's Castle, pelipper
- Unmatched Pokemon, line 3861, N - N's Castle, beartic
- Line 3862, N - N's Castle, kingdra, level: doc 94; hzla says 95 (trainer 782)
- Line 3863, N - N's Castle, toxicroak, level: doc 94; hzla says 95 (trainer 782)
- Line 3864, N - N's Castle, gorebyss, level: doc 94; hzla says 95 (trainer 782)
- Line 3865, N - N's Castle, rotom, species: doc rotom; hzla says rotom_wash (trainer 782)
- Line 3865, N - N's Castle, rotom, level: doc 94; hzla says 95 (trainer 782)
- Line 3870, N - N's Castle, ninetales, level: doc 96; hzla says 97 (trainer 783)
- Line 3870, N - N's Castle, ninetales, moves: doc ['Heat Wave', 'Moonblast', 'Solar Beam', 'Hypnosis']; hzla says ['Overheat', 'Psyshock', 'Solar Beam', 'Hypnosis'] (trainer 783)
- Line 3871, N - N's Castle, venusaur, level: doc 94; hzla says 95 (trainer 783)
- Line 3871, N - N's Castle, venusaur, moves: doc ['Growth', 'Solar Beam', 'Sludge Bomb', 'Sleep Powder']; hzla says ['Growth', 'Solar Beam', 'Earthquake', 'Sleep Powder'] (trainer 783)
- Line 3872, N - N's Castle, darmanitan, level: doc 94; hzla says 95 (trainer 783)
- Line 3872, N - N's Castle, darmanitan, item: doc Choice Scarf; hzla says Life Orb (trainer 783)
- Line 3872, N - N's Castle, darmanitan, moves: doc ['Flare Blitz', 'U-turn', 'Earthquake']; hzla says ['Flare Blitz', 'U-turn', 'Earthquake', 'Superpower'] (trainer 783)
- Line 3873, N - N's Castle, salamence, level: doc 94; hzla says 95 (trainer 783)
- Line 3874, N - N's Castle, rotom, species: doc rotom; hzla says rotom_heat (trainer 783)
- Line 3874, N - N's Castle, rotom, level: doc 94; hzla says 95 (trainer 783)
- Line 3875, N - N's Castle, sawsbuck, level: doc 94; hzla says 95 (trainer 783)
- Line 3880, N - N's Castle, hippowdon, level: doc 96; hzla says 97 (trainer 784)
- Line 3881, N - N's Castle, excadrill, level: doc 94; hzla says 95 (trainer 784)
- Line 3881, N - N's Castle, excadrill, item: doc Air Balloon; hzla says Life Orb (trainer 784)
- Line 3881, N - N's Castle, excadrill, moves: doc ['Earthquake', 'Swords Dance', 'Rock Slide', 'Iron Head']; hzla says ['Earthquake', 'X-Scissor', 'Rock Slide', 'Iron Head'] (trainer 784)
- Line 3882, N - N's Castle, gliscor, level: doc 94; hzla says 95 (trainer 784)
- Line 3882, N - N's Castle, gliscor, moves: doc ['Facade', 'Earthquake', 'Roost', 'Protect']; hzla says ['Ice Fang', 'Earthquake', 'Roost', 'Protect'] (trainer 784)
- Line 3883, N - N's Castle, cacturne, level: doc 94; hzla says 95 (trainer 784)
- Line 3883, N - N's Castle, cacturne, ability: doc Sand Veil; hzla says Unnerve (trainer 784)
- Line 3883, N - N's Castle, cacturne, moves: doc ['Sucker Punch', 'Needle Arm', 'Thunder Punch', 'Protect']; hzla says ['Sucker Punch', 'Bullet Seed', 'Thunder Punch', 'Protect'] (trainer 784)
- Line 3884, N - N's Castle, mandibuzz, level: doc 94; hzla says 95 (trainer 784)
- Line 3884, N - N's Castle, mandibuzz, ability: doc Overcoat; hzla says Weak Armor (trainer 784)
- Line 3885, N - N's Castle, stoutland, level: doc 94; hzla says 95 (trainer 784)
- Line 3885, N - N's Castle, stoutland, moves: doc ['Retaliate', 'Return', 'Crunch', 'Wild Charge']; hzla says ['Retaliate', 'Attract', 'Crunch', 'Wild Charge'] (trainer 784)
- Line 3889, N - N's Castle, species: doc ['abomasnow', 'walrein', 'rotom', 'vanilluxe', 'mamoswine', 'jynx']; hzla says ['abomasnow', 'walrein', 'rotom_frost', 'clefable', 'mamoswine', 'jynx'] (trainer 785)
- Line 3890, N - N's Castle, abomasnow, level: doc 96; hzla says 97 (trainer 785)
- Line 3890, N - N's Castle, abomasnow, item: doc Occa Berry; hzla says Focus Sash (trainer 785)
- Line 3891, N - N's Castle, walrein, level: doc 94; hzla says 95 (trainer 785)
- Line 3892, N - N's Castle, rotom, species: doc rotom; hzla says rotom_frost (trainer 785)
- Line 3892, N - N's Castle, rotom, level: doc 94; hzla says 95 (trainer 785)
- Unmatched Pokemon, line 3893, N - N's Castle, vanilluxe
- Line 3894, N - N's Castle, mamoswine, level: doc 94; hzla says 95 (trainer 785)
- Line 3895, N - N's Castle, jynx, level: doc 94; hzla says 95 (trainer 785)
- Line 3895, N - N's Castle, jynx, ability: doc Trace; hzla says Dry Skin (trainer 785)
- Line 3895, N - N's Castle, jynx, moves: doc ['Psycho Boost', 'Blizzard', 'Psyshock', 'Focus Blast']; hzla says ['Lovely Kiss', 'Blizzard', 'Psychic', 'Focus Blast'] (trainer 785)
- Line 3907, LEADER CHEREN - Nacrene City, species: doc ['cinccino', 'porygon_z', 'dodrio', 'snorlax', 'exploud', 'stoutland']; hzla says ['cinccino', 'porygon_z', 'zangoose', 'snorlax', 'exploud', 'stoutland'] (trainer 814)
- Line 3908, LEADER CHEREN - Nacrene City, cinccino, level: doc 89; hzla says 90 (trainer 814)
- Line 3908, LEADER CHEREN - Nacrene City, cinccino, ability: doc Skill Link; hzla says Cute Charm (trainer 814)
- Line 3908, LEADER CHEREN - Nacrene City, cinccino, moves: doc ['Aqua Tail', 'Tail Slap', 'Rock Blast', 'Bullet Seed']; hzla says ['Sing', 'Tail Slap', 'Rock Blast', 'Bullet Seed'] (trainer 814)
- Line 3909, LEADER CHEREN - Nacrene City, porygon_z, level: doc 89; hzla says 90 (trainer 814)
- Line 3909, LEADER CHEREN - Nacrene City, porygon_z, moves: doc ['Tri Attack', 'Ice Beam', 'Thunderbolt', 'Nasty Plot']; hzla says ['Tri Attack', 'Ice Beam', 'Thunderbolt', 'Dark Pulse'] (trainer 814)
- Unmatched Pokemon, line 3910, LEADER CHEREN - Nacrene City, dodrio
- Line 3911, LEADER CHEREN - Nacrene City, snorlax, level: doc 89; hzla says 90 (trainer 814)
- Line 3911, LEADER CHEREN - Nacrene City, snorlax, moves: doc ['Heavy Slam', 'Slack Off', 'Strength', 'Crunch']; hzla says ['Rest', 'Sleep Talk', 'Body Slam', 'Crunch'] (trainer 814)
- Line 3912, LEADER CHEREN - Nacrene City, exploud, level: doc 89; hzla says 90 (trainer 814)
- Line 3912, LEADER CHEREN - Nacrene City, exploud, ability: doc Scrappy; hzla says Rattled (trainer 814)
- Line 3912, LEADER CHEREN - Nacrene City, exploud, moves: doc ['Boomburst', 'Surf', 'Fire Blast', 'Extrasensory']; hzla says ['Hyper Voice', 'Surf', 'Fire Blast', 'Hammer Arm'] (trainer 814)
- Line 3913, LEADER CHEREN - Nacrene City, stoutland, level: doc 91; hzla says 92 (trainer 814)
- Line 3913, LEADER CHEREN - Nacrene City, stoutland, moves: doc ['Strength', 'Thunder Wave', 'Crunch', 'Ice Fang']; hzla says ['Return', 'Thunder Wave', 'Crunch', 'Ice Fang'] (trainer 814)
- Line 3921, LEADER ROXIE - Nacrene City, weezing, level: doc 87; hzla says 88 (trainer 815)
- Line 3921, LEADER ROXIE - Nacrene City, weezing, moves: doc ['Sludge Bomb', 'Toxic Spikes', 'Flamethrower', 'Thunderbolt']; hzla says ['Sludge Bomb', 'Explosion', 'Flamethrower', 'Thunderbolt'] (trainer 815)
- Line 3922, LEADER ROXIE - Nacrene City, toxicroak, level: doc 87; hzla says 88 (trainer 815)
- Line 3923, LEADER ROXIE - Nacrene City, garbodor, level: doc 87; hzla says 88 (trainer 815)
- Line 3923, LEADER ROXIE - Nacrene City, garbodor, ability: doc Aftermath; hzla says Sticky Hold (trainer 815)
- Line 3924, LEADER ROXIE - Nacrene City, nidoqueen, level: doc 87; hzla says 88 (trainer 815)
- Line 3924, LEADER ROXIE - Nacrene City, nidoqueen, ability: doc Sheer Force; hzla says Rivalry (trainer 815)
- Line 3925, LEADER ROXIE - Nacrene City, crobat, level: doc 87; hzla says 88 (trainer 815)
- Line 3926, LEADER ROXIE - Nacrene City, scolipede, level: doc 89; hzla says 90 (trainer 815)
- Line 3926, LEADER ROXIE - Nacrene City, scolipede, ability: doc Speed Boost; hzla says Poison Point (trainer 815)
- Line 3926, LEADER ROXIE - Nacrene City, scolipede, moves: doc ['Megahorn', 'Earthquake', 'Poison Tail', 'Swords Dance']; hzla says ['Megahorn', 'Earthquake', 'Rock Slide', 'Swords Dance'] (trainer 815)
- Line 3931, LEADER BURGH - Nacrene City, crustle, level: doc 87; hzla says 88 (trainer 816)
- Line 3932, LEADER BURGH - Nacrene City, masquerain, level: doc 87; hzla says 88 (trainer 816)
- Line 3933, LEADER BURGH - Nacrene City, scizor, level: doc 87; hzla says 88 (trainer 816)
- Line 3934, LEADER BURGH - Nacrene City, yanmega, level: doc 87; hzla says 88 (trainer 816)
- Line 3934, LEADER BURGH - Nacrene City, yanmega, moves: doc ['Bug Buzz', 'Air Slash', 'Hypnosis', 'Giga Drain']; hzla says ['Bug Buzz', 'Air Slash', 'Hypnosis', 'Psychic'] (trainer 816)
- Line 3935, LEADER BURGH - Nacrene City, heracross, level: doc 87; hzla says 88 (trainer 816)
- Line 3935, LEADER BURGH - Nacrene City, heracross, item: doc Metronome; hzla says Toxic Orb (trainer 816)
- Line 3935, LEADER BURGH - Nacrene City, heracross, moves: doc ['Pin Missile', 'Arm Thrust', 'Rock Blast', 'Swords Dance']; hzla says ['Megahorn', 'Close Combat', 'Stone Edge', 'Protect'] (trainer 816)
- Line 3936, LEADER BURGH - Nacrene City, leavanny, level: doc 89; hzla says 90 (trainer 816)
- Line 3936, LEADER BURGH - Nacrene City, leavanny, moves: doc ['Leaf Blade', 'X-Scissor', 'Aerial Ace', 'Swords Dance']; hzla says ['Leaf Blade', 'X-Scissor', 'Aerial Ace', 'Return'] (trainer 816)
- Line 3941, LEADER ELESA - Nacrene City, emolga, level: doc 87; hzla says 88 (trainer 817)
- Line 3942, LEADER ELESA - Nacrene City, ampharos, level: doc 87; hzla says 88 (trainer 817)
- Line 3942, LEADER ELESA - Nacrene City, ampharos, moves: doc ['Thunderbolt', 'Dragon Pulse', 'Signal Beam', 'Focus Blast']; hzla says ['Thunderbolt', 'Power Gem', 'Signal Beam', 'Focus Blast'] (trainer 817)
- Line 3943, LEADER ELESA - Nacrene City, galvantula, level: doc 87; hzla says 88 (trainer 817)
- Line 3944, LEADER ELESA - Nacrene City, electivire, level: doc 87; hzla says 88 (trainer 817)
- Line 3944, LEADER ELESA - Nacrene City, electivire, moves: doc ['Wild Charge', 'Close Combat', 'Ice Punch', 'Volt Switch']; hzla says ['Wild Charge', 'Flamethrower', 'Ice Punch', 'Cross Chop'] (trainer 817)
- Line 3945, LEADER ELESA - Nacrene City, eelektross, level: doc 87; hzla says 88 (trainer 817)
- Line 3946, LEADER ELESA - Nacrene City, zebstrika, level: doc 89; hzla says 90 (trainer 817)
- Line 3946, LEADER ELESA - Nacrene City, zebstrika, ability: doc Sap Sipper; hzla says Lightning Rod (trainer 817)
- Line 3946, LEADER ELESA - Nacrene City, zebstrika, item: doc Focus Sash; hzla says Power Herb (trainer 817)
- Line 3946, LEADER ELESA - Nacrene City, zebstrika, moves: doc ['Wild Charge', 'Flare Blitz', 'High Horsepower', 'Volt Switch']; hzla says ['Wild Charge', 'Overheat', 'Bounce', 'Double Kick'] (trainer 817)
- Line 3951, LEADER CLAY - Nacrene City, hippowdon, level: doc 87; hzla says 88 (trainer 818)
- Line 3951, LEADER CLAY - Nacrene City, hippowdon, moves: doc ['Earthquake', 'Stealth Rock', 'Ice Fang', 'Thunder Fang']; hzla says ['Earthquake', 'Stone Edge', 'Ice Fang', 'Thunder Fang'] (trainer 818)
- Line 3952, LEADER CLAY - Nacrene City, mamoswine, level: doc 87; hzla says 88 (trainer 818)
- Line 3952, LEADER CLAY - Nacrene City, mamoswine, item: doc Metronome; hzla says Choice Scarf (trainer 818)
- Line 3952, LEADER CLAY - Nacrene City, mamoswine, moves: doc ['Earthquake', 'Icicle Crash', 'Stone Edge', 'Ice Shard']; hzla says ['Earthquake', 'Icicle Crash', 'Stone Edge', 'Superpower'] (trainer 818)
- Line 3953, LEADER CLAY - Nacrene City, seismitoad, level: doc 87; hzla says 88 (trainer 818)
- Line 3953, LEADER CLAY - Nacrene City, seismitoad, ability: doc Water Absorb; hzla says Swift Swim (trainer 818)
- Line 3953, LEADER CLAY - Nacrene City, seismitoad, moves: doc ['Hydro Pump', 'Earthquake', 'Ice Punch', 'Power Whip']; hzla says ['Hydro Pump', 'Earthquake', 'Ice Punch', 'Focus Blast'] (trainer 818)
- Line 3954, LEADER CLAY - Nacrene City, krookodile, level: doc 87; hzla says 88 (trainer 818)
- Line 3955, LEADER CLAY - Nacrene City, golurk, level: doc 87; hzla says 88 (trainer 818)
- Line 3956, LEADER CLAY - Nacrene City, excadrill, level: doc 89; hzla says 90 (trainer 818)
- Line 3956, LEADER CLAY - Nacrene City, excadrill, moves: doc ['Swords Dance', 'Earthquake', 'Rock Slide', 'Iron Head']; hzla says ['Swords Dance', 'Earthquake', 'Rock Slide', 'X-Scissor'] (trainer 818)
- Line 3961, LEADER SKYLA - Nacrene City, swanna, level: doc 89; hzla says 90 (trainer 819)
- Line 3962, LEADER SKYLA - Nacrene City, drifblim, level: doc 87; hzla says 88 (trainer 819)
- Line 3963, LEADER SKYLA - Nacrene City, sigilyph, level: doc 87; hzla says 88 (trainer 819)
- Line 3963, LEADER SKYLA - Nacrene City, sigilyph, ability: doc Magic Guard; hzla says Wonder Skin (trainer 819)
- Line 3964, LEADER SKYLA - Nacrene City, togekiss, level: doc 87; hzla says 88 (trainer 819)
- Line 3964, LEADER SKYLA - Nacrene City, togekiss, moves: doc ['Moonblast', 'Air Slash', 'Heat Wave', 'Roost']; hzla says ['Hurricane', 'Tri Attack', 'Heat Wave', 'Roost'] (trainer 819)
- Line 3965, LEADER SKYLA - Nacrene City, archeops, level: doc 87; hzla says 88 (trainer 819)
- Line 3966, LEADER SKYLA - Nacrene City, staraptor, level: doc 87; hzla says 88 (trainer 819)
- Line 3971, LEADER DRAYDEN - Nacrene City, flygon, level: doc 91; hzla says 92 (trainer 820)
- Line 3971, LEADER DRAYDEN - Nacrene City, flygon, moves: doc ['Quiver Dance', 'Bug Buzz', 'Dragon Pulse', 'Fire Blast']; hzla says ['Outrage', 'Bug Buzz', 'Earthquake', 'Fire Blast'] (trainer 820)
- Line 3972, LEADER DRAYDEN - Nacrene City, druddigon, level: doc 91; hzla says 92 (trainer 820)
- Line 3973, LEADER DRAYDEN - Nacrene City, salamence, level: doc 91; hzla says 92 (trainer 820)
- Line 3973, LEADER DRAYDEN - Nacrene City, salamence, moves: doc ['Dragon Dance', 'Earthquake', 'Dual Wingbeat', 'Outrage']; hzla says ['Draco Meteor', 'Earthquake', 'Hydro Pump', 'Outrage'] (trainer 820)
- Line 3974, LEADER DRAYDEN - Nacrene City, hydreigon, level: doc 91; hzla says 92 (trainer 820)
- Line 3974, LEADER DRAYDEN - Nacrene City, hydreigon, item: doc White Herb; hzla says Life Orb (trainer 820)
- Line 3974, LEADER DRAYDEN - Nacrene City, hydreigon, moves: doc ['Draco Meteor', 'Nasty Plot', 'Dark Pulse', 'Flash Cannon']; hzla says ['Draco Meteor', 'Earth Power', 'Dark Pulse', 'Flamethrower'] (trainer 820)
- Line 3975, LEADER DRAYDEN - Nacrene City, garchomp, level: doc 91; hzla says 92 (trainer 820)
- Line 3976, LEADER DRAYDEN - Nacrene City, haxorus, level: doc 93; hzla says 94 (trainer 820)
- Line 3976, LEADER DRAYDEN - Nacrene City, haxorus, moves: doc ['Outrage', 'Earthquake', 'Cross Poison', 'Dragon Dance']; hzla says ['Outrage', 'Earthquake', 'Aqua Tail', 'Dragon Dance'] (trainer 820)
- Line 3982, LEADER MARLON - Nacrene City, politoed, level: doc 87; hzla says 88 (trainer 821)
- Line 3983, LEADER MARLON - Nacrene City, kingdra, level: doc 87; hzla says 88 (trainer 821)
- Line 3984, LEADER MARLON - Nacrene City, cloyster, level: doc 87; hzla says 88 (trainer 821)
- Line 3985, LEADER MARLON - Nacrene City, floatzel, level: doc 87; hzla says 88 (trainer 821)
- Line 3986, LEADER MARLON - Nacrene City, ludicolo, level: doc 87; hzla says 88 (trainer 821)
- Line 3987, LEADER MARLON - Nacrene City, jellicent, level: doc 89; hzla says 90 (trainer 821)
- Unmatched trainer, line 3075, Black Kyurem - Blaze Black 2 Redux, side , starter None
- Unmatched trainer, line 3078, White Kyurem - Volt White 2 Redux, side , starter None

</details>

## Checks

`uv run python -I tools/gate.py check blaze-black-2-redux`

`extract/check.py` (dex, 2026-10-29): one entry per dex number 1-649 plus the 22 forms; the doc's counts (649 species
blocks, 189 with stats, 51 Type Changes rows, 94 evolution methods for 86 species, 26 replacements); every
doc-changed species' stats / types / abilities equal the doc (Complete); 189 stat conflicts with the mirror; every doc
evolution is an edge both ways and no method is left vague; every move name in Pokemon / Move Changes resolves; 154
move fields where the mirror disagrees; Shadow Claw, Esper Wing, the type-changed moves; no replaced move in M.

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
slots, including the 26 replacements at the old slot; 164/164 B2W2 ability slots. IT is currently empty:
all 638 item IDs are deferred, automatically mapped by name when the items unit merges. The check proves
future IT matching (Leftovers, NeverMeltIce alias and an unmapped-name control).

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
