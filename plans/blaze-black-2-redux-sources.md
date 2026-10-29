# Blaze Black 2 Redux: Unit 1 source audit

Audit: 2026-10-29; base `23a42e1`; branch `worktree-bb2r-audit`. Research only, no guide/extract/template changes.
Target: **Blaze Black 2 Redux v1.4.1, Complete, Challenge Mode**. Docs outrank RomHackDex; neither is executable game evidence.
Sources are the read-only `.src/` junctions pinned by each hack's `SOURCES.md`, fetched 2026-10-18. This audit did not refresh them.
Counts are source records, not a promise that the documentation enumerates every vanilla encounter, trainer or item.

## 1. Inventory and reproducibility

Every BB2R input is covered by the filename/pattern tables below: **2,087 files = 19 text docs + 2,067 HTML files + 1 JSON**.
The complete local path/byte manifest is `.tmp/bb2r-audit/manifest.json`; no raw author documents are committed.
All text docs have the boxed title/version banner, `====` section boundaries and optional `~~~~` subsections. Preserve source line numbers.
Examples below use `<br>` for real line breaks; they are 3-5 source lines, not invented parser fixtures.

| File | Lines; structure / count | Real example (line breaks retained) | Gaps / oddities |
| --- | --- | --- | --- |
| `Pokemon Changes.txt` | 21,543; 649 species headers, 638 ordinary `Level Up:` blocks; optional Old/New fields | `001 - Bulbasaur`<br>`===================`<br>`Ability (Complete):`<br>`Old     Overgrow / Overgrow / Chlorophyll`<br>`New     Solar Power / Overgrow / Chlorophyll` | Duplicate dex number, trailing separator spaces, forms and missing ordinary level-up blocks; section 2. |
| `Trainer Changes.txt` | 3,987; 468 battle records, 68 location/group sections, 1,867 roster rows | `● Youngster Terrell:`<br>`Patrat [Analytic], lv.6: Foresight, Bide, Tackle, Leer`<br>`Zigzagoon [Pickup], lv.6: Tackle, Tail Whip, Sand Attack` | Both modes, partners and variants coexist; section 3. |
| `Wild Area Changes.txt` | 2,971; 81 normal-area headers, 2,057 numeric-rate rows; 20 grotto headers / 206 rarity-list entries | `Surf, Normal:                            Surf, Dark Spot:`<br>`---------------------------------------- ----------------------------------------`<br>`Ducklett Lv. 30-40 90%                   Ducklett Lv. 30-40 60%` | Positional two-column tables; seasonal/floor/form names, one missing `Lv.`, one missing header colon; section 4. |
| `Item Changes.txt` | 1,180; 69 placement areas; 655 placement lines before dropping 3 empty replacements; 95 TM rows | `Pokéball x10 -> Pokéball x50`<br>`Potion x1 -> Bike`<br>`TM27 Return -> TM54 False Swipe` | Seven mode-footnote lines are not items; hidden markers, quantity, arrows and difficulty stars matter; section 5. |
| `Move Changes.txt` | 669; 26 replacements, 167 named modified moves under normalised aliases | `Absorb`<br>` - Power 20 -> 35 [!]`<br>``<br>`Acid`<br>` - Power 20 -> 35 [!]` | Numeric changes, prose effects and footnotes are different data types; section 6. |
| `Type Changes.txt` | 76; 51 Complete-only species rows, fixed-width old/new types and justification | `Pokémon                 Old Type            New Type                Justification`<br>`  ---                     ---                 ---                     ---`<br>`#005 Charmeleon         Fire                Fire / Dragon           Draconic appearance, gives it useful resistances early on.` | General prose says 'Vanilla' where other docs say Classic; this is not a third patch. Chart changes are in general information/mirror, not this table. |
| `Evolution Changes.txt` | 121; 85 numbered species, 94 `Now evolves` methods, with continuation rows | `021 Spearow          Now evolves into Fearow at Level 21.`<br>`023 Ekans            Now evolves into Arbok at Level 21.`<br>`048 Venonat          Now evolves into Venomoth at Level 28.` | One species can have several methods; the list is changes, not all evolutions. |
| `Gift Pokemon.txt` | 206; 13 gift blocks plus 4 special encounters; 17 Location / 16 Level fields | `Snivy, Tepig or Oshawott.`<br>`---`<br>`Location: Aspertia City, Lookout Spot.`<br>`Level: 5` | Choices are not simultaneous gifts; starter-dependent monkey, random 17-species ranch egg, version gifts, fossil pool; Stantler lacks a Level field. |
| `Legendary Locations.txt` | 460; 25 narrative groups covering 47 legendary/mythical species | `Articuno`<br>` - Found outside the Giant's Chasm.`<br>` `<br>`Zapdos`<br>` - Found within Chargestone Cave.` | Prerequisite/quest prose rather than a uniform encounter table; generally no rates or full battle sets; Phione is in Trades. |
| `Trade Changes.txt` | 60; 3 named trades with Location and trait bullets | `Togepi Trade.`<br>`---`<br>`Location: Route 4.` | Meowth -> Togepi, Feebas -> Ditto, Lumineon -> Phione. Phione says Route 7 but its NPC prose says Humilau City. Curtis/Yancy trades explicitly unchanged and not enumerated. |
| `Important NPCs.txt` | 75; 6 service sections after General Notes | `Wii Cheat Codes`<br>`=========================================================`<br>` `<br>`Location: Aspertia City, player's house.` | Wii, ranch Audino, deleter, EV/level brothers, tutors, fossil reviver. Says 'Audino egg' where Gifts gives a random egg; `Drfitveil` typo. |
| `Important and General Information.txt` | 107; 5 sections; feature bullets, 3 difficulty descriptions, 2 main versions | `Regarding difficulty`<br>`=========================================================`<br>` `<br>`Black and White 2 feature an inbuilt difficulty selection system. Redux has expanded upon this significantly.` | High-level claims, not complete mechanic tables; EVless detail lives in Items. States all 649 obtainable. |
| `Important Nuzlocke Information.txt` | 46; 2 sections, 19 dash bullets; 3 difficulty subheads | `Normal Mode`<br>` - The standard difficulty of Dray's other work. For example, Normal mode is equivalent in difficulty to Renegade Platinum or BB2 and VW2.`<br>` - Trainers shouldn't be impossible to beat and generally stick to single battles, but are definitely a much greater challenge than in Black 2 and White 2.` | Switching difficulty can break scripts; Challenge has healing before most bosses and restricted vendors. Not a Nuzlocke ruleset or encounter-clause definition. |
| `Redux FAQ.txt` | 73; 4 tilde-delimited Q&A topics | `~~~~~ Can I use Redux as a base for my own projects? ~~~~~`<br>` `<br>`Yes!` | Project ownership/future hacks/reuse/donations, not a gameplay walkthrough. |
| `Known Bugs and Hardware Information.txt` | 90; compatible/incompatible setup lists; 5 Location/Cause/Severity bug records | `Challenge mode Level Bug`<br>`---`<br>`Location: Almost everywhere!`<br>`Cause: Gamefreak Spaghetti Code :/`<br>`Severity: Medium` | Historical hardware assertions, not a current Thor test; includes cosmetic sprites, fossil menu, stone animation, Infestation text. |
| `Changelog.txt` | 1,059; 10 release blocks, v1.0.0 through v1.4.1; 879 dash bullets | `~~~~~ v1.4.1 (24/06/23) ~~~~~`<br>` `<br>` `<br>`Balance Changes:` | Latest local release dated 24 June 2023. History may explain discrepancies, but current tables win over old releases. |
| `Credits.txt` | 262; 9 equal-delimited headings, 85 dash bullets; people/tools grouped under tildes | `Various Areas of Development/Significant Contributions`<br>`=========================================================`<br>` `<br>`~~~~~ Dray (@Drayano60) ~~~~~` | Credit AphexCubed and Drayano plus contributing resources in footer, not page introductions. |
| `Patching Guide.txt` | 43; one main section, procedural prose / 5 dash bullets | `How to obtain a copy of Redux`<br>`=========================================================`<br>` `<br>`Obtain either a Black 2 or White 2 Vanilla ROM. Ideally this would be a dump of your personal American/ European cartridge.` | Installation reference only; no ROM or patch input is present here. |
| `Useful Action Replay Codes.txt` | 79; 3 named code topics, 26 hex-pair lines, BB2/VW2 blocks | `Instant Shaking Grass/Water Ripple/Dust Cloud:`<br>`---`<br>` - Hold 'L' for an instant Shaking Grass/Water Ripple/Dust Cloud!` | Says codes became redundant/baked in as of v1.1.0. Keep out of ordinary item/encounter records. |

Local audit commands (scripts intentionally remain ignored, not committed):
```text
python -I -X utf8 tools/drayano_check.py "hacks/blaze-black-2-redux/.src/Pokemon Changes.txt" hacks/blaze-black-2-redux/.src/romhackdex/pokedex
python -I -X utf8 .tmp/bb2r-audit/inspect.py
python -I -X utf8 .tmp/bb2r-audit/measure.py
python -I -X utf8 .tmp/bb2r-audit/compare.py
python -I -X utf8 .tmp/bb2r-audit/details.py
python -I -X utf8 .tmp/bb2r-audit/final_metrics.py
```
Run in that order: measure writes trainer/mirror records; compare consumes them; details inventories items; final_metrics rechecks permissive headers and moves.
Logs and structured results are beside the scripts. `measure.py` compares each explicitly labelled Normal block with the immediately following Challenge block, requiring the Normal label; it never guesses from an adjacent ordinary trainer.
No baseline/gate/assemble run: this is docs-only research and the verify skill requires no checks for Markdown-only changes.

## 2. Pokemon Changes and naming audit

| Measurement | Finding / extraction rule |
| --- | --- |
| Coverage | **649 species names**, but **648 unique printed IDs**: `546 - Kyurem` duplicates Cottonee's number; resolve by canonical name to #646, do not lose either. Reproduces the overall docs' 649-species claim, not the helper's 642. |
| Why the supplied helper says 642 | Strict `=+\n` skips Pidgeot, Drapion and Gliscor separators with trailing spaces; its slug heuristic then misses Nidoran-f, Nidoran-m, ho-oh and porygon-z. These are present in the mirror. |
| Helper result, reproduced unchanged | **642 compared, 4 missing pages, 188 stat differences, 74 level-up differences**. The four 'missing' are alias failures, not missing inputs. |
| Corrected audit | Trim separator whitespace, resolve pages by displayed name including sex symbols: **649 compared, 0 missing; 189 stat-bearing species checked, all 189 differ; 638 ordinary level lists, 75 differing**. Pidgeot adds the stat conflict omitted by the helper. |
| Fields | Optional `Base Stats`, `Type`, `Ability`, `Moves`, `Evolution` prose and `Level Up`; Old/New lines, slash-separated type/ability/stat values. Missing field means unchanged, not zero/empty. |
| Complete vs Classic | Consecutive blocks, not spreadsheet columns: `Ability (Complete)` 141, `Ability (Classic)` 60, `Ability (Complete / Classic)` 296. Three ability slots = regular 1 / regular 2 / hidden. Missing Classic block can mean no Classic change. |
| Stats/types | 186 `Base Stats (Complete)` headings, plus malformed `Base Stats):`, Wormadam's 3 cloaks and Rotom's regular form; 54 `Type (Complete)` headings. Standalone Type Changes table has 51 rows, so it is not the sole source for Complete typing. |
| Learnsets/forms | 638 `Level Up:` blocks, 380 `Moves:` blocks (TM compatibility/prose). Deoxys, Wormadam, Shaymin and other special layouts need form-aware parsing; do not take the first form's data for all forms. |
| Apparent omissions | No literal ordinary `Level Up:` heading for Poliwag, Walrein, Deoxys, Wormadam, Shaymin, Throh, Sawk, Sewaddle, Swadloon, Leavanny, Joltik. Some are form-specific layouts; use mirror lists as fallback only after reading the relevant block. Four further headings have trailing spaces, not missing lists. |
| Meaning of 75 list differences | After aliases, ordinary lists differ by naming, not established move/level content: Faint Attack (55 doc-only pairs), Autonomize (15), Ominous Mind (2), Twinneedle (1), Sliver Wind (1), Acid Armour (1), Will-O-Wiisp (1). Counts overlap on Magby's list. The old SOURCES summary's four-name explanation is incomplete. |

Distinct misspellings found in structured Pokemon/trainer move, ability and held-item fields, plus explicit replacement/mart/gift names:

| Kind | Source spelling -> fix candidate |
| --- | --- |
| Move | `Twinneedle` -> Twineedle; `Faint Attack` -> Feint Attack (legacy spelling); `Sliver Wind` -> Silver Wind; `Autonomize` -> Autotomize; `Will-O-Wiisp` -> Will-O-Wisp; `Ominous Mind` -> Ominous Wind |
| Move | `Accupressure` -> Acupressure; `Scorching Sand` -> Scorching Sands; `Magic Leaf` -> Magical Leaf; `Acid Amor` -> Acid Armor; `Bonomerang` -> Bonemerang; `Sword Dance` -> Swords Dance |
| Move | `Sleep Power` / `Slee Powder` -> Sleep Powder; `Mystic Fire` -> Mystical Fire; `ock Slide` -> Rock Slide; `V-Creat` -> V-create; `Dragon Meteor` -> Draco Meteor; `Sheel Smash` -> Shell Smash; `Stength` -> Strength; `Submisson` -> Submission |
| Ability | `Screne Grace` -> Serene Grace; `Bad Breams` -> Bad Dreams; `Water Abosrb` -> Water Absorb; `Study` -> Sturdy |
| Item | `Air Ballon` -> Air Balloon; `Cobat Berry` -> Coba Berry; `Wide Lense` -> Wide Lens; `Perism berries` -> Persim Berries; `Gracadia` -> Gracidea |
| Regional/format aliases, not necessarily errors | Acid Armour/Armor, Judgement/Judgment, Minimise/Minimize, Synchronise/Synchronize, Normalise/Normalize, BubbleBeam/Bubble Beam, Razorwind/Razor Wind, NeverMeltIce/Never-Melt Ice, Sitrus Berries/Sitrus Berry. Canonicalise without claiming altered mechanics. |
| Not safe autocorrections | Banette's quoted `"Grab"` has no known move match; Noctowl `[Wacan Berry] @Colbur Berry` puts an item in the ability slot; another Noctowl `[Water Absorb] @Water Absorb` puts an ability in the held-item slot. Keep unresolved until checked. |

Other structural repairs: Brawly's Meditite has `lv.17: @Light Clay: ...`, similarly a Sitrus Berry prefix on another move list; Colress's postgame Klinklang has `lv.88 @:` with no item; Phanphy -> Phanpy has `27:` without `lv.`; Gift heading `Treeko` -> Treecko. These are not new moves or abilities.
The typo table is a scoped lexical audit, not permission to silently invent the unresolved ability/item/move values.

## 3. Trainers, caps, modes and ordering

| Measure | Exact result / definition |
| --- | --- |
| Source battle records | **468** = 466 `●`/`○` records with teams + unmarked Victini Guardian + N's introductory battle (BB2/VW2 alternative). Repeated people/rematches and mode alternatives count separately. |
| Roster rows | **1,867** species/ability/level/move lines; includes partners, both version alternatives and starter alternatives, not 1,867 unique opponents. |
| Separate Challenge rosters | **34**: **31 paired** with explicitly labelled Easy/Normal teams + **3 Challenge-only** (Grunt #884, Victini Guardian, Lance). Guardian's restriction is section prose, not a bracket label. |
| Paired changes ignoring levels | **0 level-only; 31 species/moves/items changes**. Each pair also changes ability arrays. Compare ordered roster arrays excluding `level`; unequal team lengths are changes, not 'extra slots to ignore'. |
| Source selections | **437 Challenge battle records**, **434 Normal/Easy**, before expanding starter/game/partner branches: 468 minus 31 unused mode alternatives, and Normal additionally drops the three exclusive encounters. These are not unique NPC headcounts. |
| Easy vs Normal | **0 separately documented Easy rosters / 0 composition changes**. Easy shares Normal teams, subtracts section difficulty increments and has easier AI. This is not simply loading Normal levels unchanged. |
| Battle format markers | Across all source alternatives: `(2x)` 30, `(3x)` 19, `(Rot)` 3, `(Tag)` 8. Also unmarked joint teams (Shanta/Webster); parse left/right/partner prose, not only marker counts. |
| Trainer data certainty | Species, level, moves, held item, named ability, location, rewards, optional/mandatory and battle format are given. Natures random, EVs zero per general notes; 'stronger' IVs 30/31, **no complete per-trainer IV table**. Do not label guessed IVs/natures authoritative. |
| Variants/rematches | Hugh starter branches, Nate/Rosa partner, BB2/VW2 N dragon, seasonal N teams; first/second/third Frigate visits, E4 round two and eight Unovan leader rematches. Team rows must not be concatenated into illegal oversized parties. |

Counts by the document's **68 location/group sections**, retaining mode duplicates (sum 468); cap split assignment is later authoring, not an existing source column:

| Sections in document order, counts | Sections in document order, counts |
| --- | --- |
| Route 20 13; Floccesy Ranch 5; Floccesy Town 6; Aspertia school/gym 6 | Virbank Complex 6; Virbank city/gym 9; Route 4 pre-Burgh 4; Battle Company 5 |
| Castelia Sewers 8; Liberty Garden 1; Relic Passage Castelia 3; Castelia various/gym 15 | Route 4 post-Burgh 17; Desert Resort 9; Relic Castle 3; Nimbasa City 7 |
| Route 16 6; Lostlorn Forest 4; Route 5 6; Amusement Park/Elesa 7 | Driftveil City 4; Route 6 9; Clay Tunnel 9; Clay's Gym 9 |
| Frigate first 4; Chargestone 13; Relic Passage Driftveil 9; Mistralton Cave 4 | Route 7 9; Celestial Tower 10; Twist Mountain Mistralton 2; Mistralton City 9 |
| Reversal Mountain 12; Strange House 2; Undella Town 1; Undella Bay 6 | Route 14 8; Adundant Shrine 4; Route 13 11; Lacunosa Town 1 |
| Route 12 5; Village Bridge 9; Route 11 3; Opelucid City 7 | Route 9 7; Drayden's Gym 7; Seaside Cave 7; Route 21 7 |
| Route 22 6; Humilau/Marlon 10; Frigate second 12; Chasm/Frigate third 20 | Route 23 12; Victory Road 28; League 10; Important Postgame Trainers 2 |
| E4 second matches 10; Hugh postgame 2; Frigate postgame 1; Icirrus postgame 3 | Castelia postgame 2; Nature Preserve 2; Striation 3; Benga postgame 2 |
| Wellspring Cave 1; Faraway Island 1; N 5; Unovan leader rematches 8 | `Adundant` -> Abundant; group headings do not themselves define progression splits. |

`Full Level Cap and Guide for Challenge mode (Spoilers!)`, lines 116-171: **37 ordered battle anchors, 33 distinct level values, 28 mandatory / 9 optional**. Legend uses ●/○ and crown markers. It reads as a main-story battle order, not a full location walkthrough; it stops at League 78, omitting a separate Iris row and postgame order.

| Ordered anchors (○ optional; others mandatory) |
| --- |
| Hugh 11; ○ Roxanne 13; Cheren 14; ○ Brawly 20; Roxie 21; Brycen 23; ○ Wattson 29; Burgh 29; Colress 30 |
| Lenora and Hawes 33; ○ Subway Bosses 36; ○ Flannery 37; Elesa 38; Charles 39; Rood 41; ○ Norman 44; Clay 45; Hugh 47 |
| Colress 53; ○ Juan 54; Skyla 55; Bianca 56; Hugh 58; Zinzolin 60; Benga 62; ○ Winona 63; Drayden 64; Zinzolin 64 |
| ○ Tate and Liza 67; Marlon 68; Zinzolin 68; Zinzolin 70; Colress 70; Ghetsis 72; Lance 76; Hugh 77; Pokémon League 78 |

Spoiler-free tables have **11 Normal** and **21 Challenge** entries; Challenge explicitly gives **Iris 79**. Reconcile that with the final League 78 anchor, do not erase the champion cap.
Critical calc issue: generic Challenge levels are displayed after +1/+2/+3/+4 (late exception Red +7), but underlying stats use the unshifted level; damage uses displayed level. Easy reverses the stat disadvantage. Explicit unique-team/no-shift sections use stated levels. A single `level` with modern stat recalculation cannot reproduce both values; preserve raw level, displayed level, stat level and evidence in the future plan.
Section increments must not leak across headings. Red is documented at 100 plus a Challenge +7 note: actual clamp/display is unverified. Do not invent a 107-cap policy.

## 4. Wild tables versus the mirror

| Measure | Result |
| --- | --- |
| Area mapping | Docs **81** normal-area headers; mirror **81** detail pages. **73** names match after punctuation/case normalisation; **8** explicit aliases below; **0** unmatched on either side after aliases. Grottos are a separate 20-header list, not 20 missing mirror area pages. |
| Slot comparison | **2,057 doc rows vs 1,296 mirror rows; 1,296 match, 761 doc-only, 0 mirror-only** after area/form aliases. Multiset key = area, species/form, rate, min/max level; duplicates retained, methods intentionally ignored for this cross-check because mirror headings collapse them. Thus 761 is a measured omission count / lower bound on complete method-sensitive differences, not 761 proven changed species. |
| Method coverage | Docs retain ordinary/double grass, shaking grass, caves/dust clouds, sand, bridges, surf, fishing and water dark spots, sewer, swamp, rooms/floors, seasons; only Super Rod exists. Mirror often drops right-hand columns, merges caves/floors and uses generic method names. Never rebuild the tracker from mirror rows alone. |
| Rates/levels | Every normal numeric percentage occurrence accounted for: **2,057 parsed = 2,057 numeric `%` values** before Grotto Guide. Values are aggregate rows, not underlying ROM slot IDs; listed ranges may contain only one real encounter level. |
| Grottos | **20 headers, 206 species-list entries** = 78 common + 67 uncommon + 60 rare + 1 guaranteed-name bullet. Do not convert categories into invented percentages. Stantler guarantee prose specifies level 30; ordinary grotto species generally lack levels/rates. |

| Doc name(s) requiring aliases | Mirror name(s) |
| --- | --- |
| Driftveil Drawbridge, Charizard Bridge | Driftveil Drawbridge |
| Giants Chasm - Route 13 / Entrance Cave / Plasma Airship Area / Kyurems Cave | Giant Chasm - corresponding suffix (four mappings) |
| Route 8, Moor of Icirrus - All Seasons | Route 8 - Moor of Icirrus |
| Icirrus City - All Seasons; Twist Mountain - All Seasons | Icirrus City; Twist Mountain |

Five concrete missing rows: **Aspertia** Surf Dark Spot Ducklett 30-40 60%, Surskit 30-40 40%; Fish Dark Spot Remoraid 6-14 60%, Surskit 6-14 30%, Feebas 6-14 10%. All exist in the doc and are absent from the mirror's ordinary surf/fishing-only tables.
Normalisations used: Basculin-B/R -> blue/red-striped; Shellos/Gastrodon-W -> default west, -E -> East; Darmanitan-Z -> Zen; Unown letter/!? rows -> mirror's undifferentiated Unown for this comparison only. Keep individual forms in the eventual doc-backed guide.
Parser traps: Route 6 Winter `Mime Jr. 32-36 05%` lacks `Lv.`; Dreamyard normal surface heading lacks its colon; Unown !/? and Porygon2 require punctuation/digits in species names. Separate event rows such as `Volcarona Lv. 40* Event --%` are **not** numeric-rate wild slots.

## 5. Items and supplementary encounter docs

| Item source | Count / meaning |
| --- | --- |
| Placement list | 69 areas, 662 nonblank post-heading lines: subtract **7 mode-footnote lines** -> **655** placement statements, including **3 empty arrow destinations** (Adamant/Lustrous/Griseous Orb removed there) -> **652 nonempty destinations**. Includes repeats and 162 lines containing Hidden. |
| Rules | 3 replacement items (Red Scarf -> Ice Stone, Oval Stone -> Link Cable, unused God/Grey Stone -> Old Sea Map); 8 prices; 13 item-use entries; 4 Pickup substitutions. Pickup is a delta, not a full probability table. |
| Vendors / TMs | 6 modified mart subsections; item families sometimes prose, not expanded SKU lists. **TM01-TM95, 95 rows**, old -> new moves and new locations, stars for changed locations. No complete HM/vanilla shop inventory. Challenge removes BP vendors and Castelia artist until postgame. |
| Mirror | **557 item-placement pages**, not 557 unique items: **222 distinct raw displayed names** before spelling/corruption cleanup. Slugs often join item and location; descriptions are frequently generic placeholders, and all sampled changed placements need doc precedence. |
| Textual pair cross-check | Doc destinations + TM table: **644 unique normalised (item, area) pairs**; mirror **557**; **520 agree, 124 doc-only, 37 mirror-only** (symmetric difference 161). Remove deleted RHS, mode footnotes and quantities/Hidden; strip TM number; Bike/Bicycle alias. Do not equate these 161 textual differences to 161 proven game-placement errors: gym-vs-city granularity and fossil naming still need adjudication. |
| Definite corruption examples | Mirror invents items `**Challenge mode only.`, `*Easy and Normal mode only.`, `Modified TMs + Locations`, `TM # Move Location in Redux`. `Aura Sphere Victory Road *` is an item placed in Humilau; source TM87 is Aura Sphere at Victory Road. `Power Gem Route 16` is similarly placed at Humilau, rather than TM59 at Route 16. |

| Other doc | What can be built / unresolved |
| --- | --- |
| Gifts | 13 gift blocks plus Stantler/Volcarona/Lapras/Rotom; 17 random ranch-egg possibilities; choice groups, fossils and version-dependent Zorua must stay choices. Cross-link gifts/static catches to encounter tracking rather than silently treating them as grass slots. |
| Legendary guide | 25 groups / 47 species; location, unlock NPC, quest dependencies, version exclusions and one-time warnings. Looker/Unity Tower chain supplies postgame order. 'Speak to Key Gift Guy' prerequisite is explicit. No universal per-species level/rate record to manufacture. |
| Trades | 3 changes, with given/requested species, NPC, item, nature and IV prose; Togepi has Attack 0 and other IVs 30, Ditto/Phione all 31. Phione's Humilau prose conflicts with Route 7 header; unchanged Curtis/Yancy roster is missing. |
| Evolutions | 85 numbered source species / 94 methods, not 94 species. Direct-use items replace trades; continuation rows for branches. Mirror evolution chains fill unchanged methods, but doc exceptions override them. |
| NPCs | 6 service records; trainer doc has 9 unlock tiers for EV/level training (10 through 90), independent of selected difficulty. Tutor town names and unlock dependencies are prose; no complete shop/tutor prices table. |

## 6. Mechanics, moves and calc inputs

WIP: measurements are complete; calc list, mirror schemas, family comparison and questions follow in the final pass.
