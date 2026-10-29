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
| `Redux FAQ.txt` | 73; 4 tilde-delimited Q&A topics | `~~~~~ Can I use Redux as a base for my own projects? ~~~~~`<br>` `<br>`If you'd like to use Redux as a base for your own project, drop me a DM on Twitter or Discord! I'll be happy to sort something out with you. I'll also ask if Koji and Dray are happy with things!` | Project ownership/future hacks/reuse/donations, not a gameplay walkthrough; do not interpret as unconditional reuse permission. |
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
| Stats/types | 186 `Base Stats (Complete)` headings, plus malformed `Base Stats):`, Wormadam's 3 cloaks and Rotom's regular form; 54 `Type (Complete)` headings. Standalone Type Changes table has 51 rows, omitting **Bayleef, Slugma, Cacnea**; it is not the sole source for Complete typing. |
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
| Not safe autocorrections | Banette's quoted `"Grab"` has no known move match; Noctowl `[Wacan Berry] @Colbur Berry` puts an item in the ability slot; Jellicent `[Water Absorb] @Water Absorb` puts an ability in the held-item slot. Keep unresolved until checked. |

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
| Definite corruption examples | Mirror invents items `**Challenge mode only.`, `*Easy and Normal mode only.`, `Modified TMs + Locations`, `TM # Move Location in Redux`. `Aura Sphere Victory Road *` is an item placed in Humilau; source TM46 is Aura Sphere at Victory Road. `Power Gem Route 16` is similarly placed at Humilau, rather than TM66 at Route 16. |

| Other doc | What can be built / unresolved |
| --- | --- |
| Gifts | 13 gift blocks plus Stantler/Volcarona/Lapras/Rotom; 17 random ranch-egg possibilities; choice groups, fossils and version-dependent Zorua must stay choices. Cross-link gifts/static catches to encounter tracking rather than silently treating them as grass slots. |
| Legendary guide | 25 groups / 47 species; location, unlock NPC, quest dependencies, version exclusions and one-time warnings. Looker/Unity Tower chain supplies postgame order. 'Speak to Key Gift Guy' prerequisite is explicit. No universal per-species level/rate record to manufacture. |
| Trades | 3 changes, with given/requested species, NPC, item, nature and IV prose; Togepi has Attack 0 and other IVs 30, Ditto/Phione all 31. Phione's Humilau prose conflicts with Route 7 header; unchanged Curtis/Yancy roster is missing. |
| Evolutions | 85 numbered source species / 94 methods, not 94 species. Direct-use items replace trades; continuation rows for branches. Mirror evolution chains fill unchanged methods, but doc exceptions override them. |
| NPCs | 6 service records; trainer doc has 9 unlock tiers for EV/level training (10 through 90), independent of selected difficulty. Tutor town names and unlock dependencies are prose; no complete shop/tutor prices table. |

## 6. Mechanics, moves and calc inputs

| Mechanic | Document-backed requirement / uncertainty |
| --- | --- |
| Baseline | Gen V battle engine, not Gen VIII wholesale. Species modernisation does not prove modern damage, abilities or item effects. No separate Ability Changes document exists. |
| Types | Add Fairy and canonical Fairy species; Complete additionally has custom combinations. Steel loses Ghost/Dark resistance (general info). Mirror has an 18 x 18 matrix and its Ghost/Dark -> Steel cells are neutral; Fairy -> Fighting/Dragon/Dark 2x, Fairy -> Fire/Poison/Steel half. Use a full chart, not just Fairy STAB. |
| Ability assignments | Complete/Classic three-slot mapping including hidden-slot swaps, plus form-specific overrides, comes from Pokemon Changes; trainer `*` means Complete-only assignment. No evidence to globally modernise existing ability effects. Iron Fist flags on Needle Arm/Rock Smash are explicit move exceptions. |
| Criticals / flags | **2x Gen V critical damage**, explicit Frost Breath/Storm Throw 50 BP adjustments; new high-crit flags on Cut, Dragon Claw, Octazooka, X-Scissor. Crabhammer loses high crit for a 10% Defence drop. |
| Other effects | Sound moves bypass Substitute; Wild Charge has **no recoil**; Rock Smash always drops Defence and gains Iron Fist; Needle Arm gains Iron Fist; Leaf Tornado/Octazooka accuracy-drop chance 30%; Poison Fang bad poison 50%; Power Gem SpD drop 10%; Scald burn 10%; Strength Attack boost 10%; String Shot -2 Speed. |
| Engine limitations | Howl remains user-only (starred limitation). Triple Axel uses Triple Kick mechanics: first hit 30, successive-hit power increment 10 (30/40/50), not canonical 20/40/60; preserve accuracy-per-hit semantics. The footnote, not a modern move default, is authority. |
| Legends: Arceus ports | Esper Wing 70 BP / 100 accuracy / 10 PP / **+1 priority**; Headlong Rush 120/90/5, both defences -1; Psyshield Bash 70/95/10, both defences +1; Raging Fury 95/100/10, Outrage confusion behaviour; Wave Crash 110/100/5, Double-Edge-style recoil. These are explicit noncanonical implementations, not LA battle mechanics. |
| Modern effects not established | No doc assertion of Rapid Spin's modern Speed boost or Knock Off's modern held-item multiplier, despite raised BP. No terrain system described. Do not infer these from a recent Showdown move record. |
| Doc contradiction needing a decision | `Shadow Claw - PP 70 -> 90 [!]` looks like a mislabeled **Power** change. Record as unresolved; the literal 90-PP value is included in mismatch measurements, not endorsed for implementation. |

**Move mirror comparison:** JSON has **604 entries / 603 unique normalised names and detail slugs** (V-create/V-Create duplicated). **604/604 descriptions are empty**, despite the fetcher's intended description field. All 26 replacement names exist, but many replaced old moves also remain in the index; presence is not availability.
After Acid Armour/Armor, Judgement/Judgment and Minimise/Minimize aliases, compare **221 explicit scalar assertions on 167 named move blocks: 154 mismatching fields across 118 moves**. Assertions: 94 BP, 77 PP, 39 accuracy, 6 priority, 5 type. Mismatches: **63 BP, 62 PP, 25 accuracy, 1 priority, 3 type**. Count ignores prose-effect/category claims the docs do not numerically specify; it is not proof the other moves are correct.
Examples: Absorb doc 35 vs mirror 20 BP; Aura Sphere 90 vs 80; Judgement 150 vs 100; Wave Crash 110 vs 75; Triple Axel first-hit 30 vs 20; Esper Wing priority +1 vs 0; Cut Grass/Covet Fairy/Rock Climb Rock vs mirror Normal. Charm/Moonlight Fairy do agree.

Replacement mapping (old move IDs must retain their slots in the future save `GID.mv`, not gain guessed modern IDs):

| Old -> new, in source order |
| --- |
| Sand Tomb -> Accelerock; Horn Drill -> Boomburst; Spike Cannon -> Breaking Swipe; Slam -> Brutal Swing; Luster Purge -> Dazzling Gleam; Round -> Disarming Voice; Sweet Kiss -> Draining Kiss |
| Vice Grip -> Dual Wingbeat; Bubble -> Esper Wing; Razorwind -> Fire Lash; Constrict -> Infestation; Rolling Kick -> Headlong Rush; Mega Kick -> High Horsepower; Barrage -> Lunge |
| Mist Ball -> Moonblast; Sacred Fire -> Mystical Fire; Sharpen -> Nuzzle; Submisson -> Play Rough; Comet Punch -> Power-Up Punch; Egg Bomb -> Psychic Fangs |
| Smelling Salts -> Psyshield Bash; Thrash -> Raging Fury; Metal Sound -> Scorching Sands; Mega Punch -> Smart Strike; Triple Kick -> Triple Axel; Punishment -> Wave Crash |

Full scalar destination inventory for the profile audit (not a resolution of Shadow Claw). Preserve the `[!]`/`[L:A]` evidence when parsing; unmarked changes are official modernisation, not safe to omit under a Gen V baseline.

| Field | Document destinations |
| --- | --- |
| BP | Absorb 35; Acid 35; Air Cutter 60; Aqua Tail 100; Arm Thrust 20; Assurance 60; Astonish 35; Aura Sphere 90; Aurora Beam 75; Blizzard 110; BubbleBeam 70; Chatter 90; Cross Poison 90; Draco Meteor 130 |
| BP | Dive 100; Dragon Breath 70; Dragon Claw 85; Dragon Pulse 90; Draining Kiss 70; Echoed Voice 50; Energy Ball 90; Fire Blast 110; Fire Pledge 75; Flame Charge 60; Flame Wheel 75; Flash Cannon 90; Fly 80 |
| BP | Frost Breath 50; Fury Cutter 30; Future Sight 120; Gear Grind 65; Giga Drain 80; Glaciate 85; Grass Pledge 75; Heart Stamp 75; Heat Wave 100; Hex 65; Hurricane 110; Hydro Pump 110; Ice Beam 90; Incinerate 60 |
| BP | Judgement 150; Knock Off 65; Leaf Storm 130; Leaf Tornado 70; Leech Life 80; Lick 30; Low Sweep 65; Magma Storm 120; Mega Drain 65; Meteor Mash 95; Muddy Water 90; Mud-Slap 30; Needle Arm 100; Octazooka 90 |
| BP | Overheat 130; Pin Missile 25; Poison Fang 65; Poison Sting 30; Poison Tail 80; Power Gem 90; Power-Up Punch 50; Psycho Cut 90; Rapid Spin 50; Rock Climb 80; Rock Smash 55; Rock Tomb 60; Rollout 40; Shadow Punch 90 |
| BP | Sludge 70; Smelling Salts 70; Smog 35; Steam Roller 100; Storm Throw 50; Strength 85; Sucker Punch 70; Surf 90; Synchronoise 120; Tackle 50; Techno Blast 140; Thief 50; Triple Axel 30; Thunder 110 |
| BP | Thunderbolt 90; Twineedle 40; Twister 50; Vine Whip 40; Wake-Up Slap 70; Water Pledge 75; Esper Wing 70; Headlong Rush 120; Psyshield Bash 70; Raging Fury 95; Wave Crash 110 |
| PP | Acid Armour 20; Air Cutter 15; Air Slash 10; Barrier 20; Bite 20; Bulk Up 10; Bullet Punch 20; Calm Mind 10; Charge Beam 15; Chatter 10; Confusion 20; Covet 20; Cross Poison 15 |
| PP | Crunch 10; Dark Pulse 10; Dragon Claw 10; Extrasensory 15; False Swipe 30; Fire Punch 10; Flame Wheel 20; Flamethrower 10; Focus Energy 20; Gear Grind 10; Growth 20; Gust 25; Heart Stamp 15 |
| PP | Hex 15; Hurricane 5; Ice Punch 10; Ice Shard 20; Leech Life 10; Lick 25; Mach Punch 20; Minimise 10; Mud-Slap 20; Octazooka 5; Poison Gas 20; Poison Jab 10; Poison Powder 20 |
| PP | Poison Sting 20; Poison Tail 10; Power Gem 10; Psycho Cut 10; Quick Attack 20; Rock Climb 10; Rock Tomb 15; Sacred Sword 15; Scald 10; Shadow Ball 10; Shadow Claw **90 unresolved**; Shadow Sneak 20; Slash 15 |
| PP | Sludge 15; Spore 10; Steam Roller 10; Strength 10; Stun Spore 20; Swords Dance 20; Synchronoise 10; Tackle 30; Tailwind 15; Thief 15; Thunder 5; Thunder Punch 10; Thunder Shock 25 |
| PP | Thunderbolt 10; Twister 20; Venoshock 15; Waterfall 10; Wild Charge 10; X-Scissor 10; Zen Headbutt 10; Esper Wing 10; Headlong Rush 5; Psyshield Bash 10; Raging Fury 10; Wave Crash 5 |
| Accuracy | Aqua Tail 85; Blaze Kick 100; Dark Pulse never-miss; Dark Void 90; Dragon Pulse never-miss; Dragon Rush 80; Dragon Tail 95; Fly 100; Gear Grind 95; Glaciate 100; Glare 100; Grass Whistle 65; Gunk Shot 80 |
| Accuracy | Head Smash 85; Hurricane 80; Inferno 65; Leaf Tornado 100; Pin Missile 95; Poison Fang 95; Poison Gas 100; Razor Shell 100; Roar never-miss; Rock Climb 95; Rock Tomb 95; Smog 90; Snarl 100 |
| Accuracy | Steam Roller 90; Stun Spore 90; Swagger 85; Psycho Shift 100; Psywave 100; Thunder Wave 90; Will-O-Wisp 85; Whirlwind never-miss; Esper Wing 100; Headlong Rush 90; Psyshield Bash 95; Raging Fury 100; Wave Crash 100 |
| Priority | Ally Switch +2; Follow Me +2; Rage Powder +2; Magic Room 0; Wonder Room 0; Esper Wing +1 |
| Type | Charm Fairy; Moonlight Fairy; Covet Fairy; Cut Grass; Rock Climb Rock. No explicit numeric category-change table; replacement categories require a validated base/replacement mapping. |

## 7. RomHackDex file families (every HTML/JSON input)

Counts include directory indexes where stated; see the closed manifest in section 1. Examples are actual displayed headings/rows from a representative page, shown on 3-5 lines rather than copying site chrome/scripts.

| Pattern | Files / page structure | Real displayed example | Adds beyond docs / cautions |
| --- | --- | --- | --- |
| `index.html` | 1; hack landing page, nav links and overview | `Blaze Black 2 & Volt White 2 Redux`<br>`Pokedex`<br>`Moves` | Site navigation, not gameplay order or raw game data. Strip ads/scripts/footer when parsing. |
| `pokedex/index.html`, `pokedex/*/index.html` | 650 = index + 649 species; H1 identity, type/abilities, stats, chart, evolution, locations, H3 learnset tables | Abomasnow: `Level Up`<br>`1 Focus Punch`<br>`1 Leech Seed` | Full dex scaffold: **649 Level Up, 631 TM/HM, 644 Tutor, 260 Egg Moves tables**. Supplies unchanged/egg/tutor compatibility missing from docs. Stats conflict; per-row learnset power/type cells may be blank and must join move data. No reliable game IDs/form ID map. |
| `locations/index.html`, `locations/*/index.html` | 82 = index + 81; H1 area; H2 method; `tr.encounter-row` with data-name/id/rate/level and td level range | Abundant Shrine: `Grass (10)`<br>`Cottonee 20% 41-44`<br>`Petilil 20% 41-44` | 1,296 rows for cross-checks; filters/search UI, not additional authoritative slots. data-level gives minimum; td supplies range. Missing right columns/floors/grottos; section 4. |
| `items/index.html`, `items/*/index.html` | 558 = index + 557 placement pages; H1 item, category/description, Where to Find text | `Absorb Bulb`<br>`Found in Opelucid City (Drayano BB2/VW2 Redux placement).`<br>`Where to Find`<br>`Opelucid City` | Per-placement links, not a canonical item database. Generic 'key' categories/placeholder descriptions, malformed table-header items, lost difficulty and quantities. |
| `abilities/index.html`, `abilities/*/index.html` | 171 = index + 170; H1, effect description, species/slot table | `Adaptability`<br>`Increases the same-type attack bonus from 1.5× to 2×.`<br>`Pokemon with Adaptability` | Actual ability descriptions and reverse slot lookup missing from docs. Still secondary website text, not evidence of every hack-specific ability implementation. |
| `types/index.html` | 1; 18 attack rows x 18 defence columns, entity-encoded multipliers | `ATK \ DEF`<br>`NOR FIR WAT ELE GRA ICE FIG POI GRO FLY PSY BUG ROC GHO DRA DAR STE FAI`<br>`FAIRY` | Full chart; decode `&frac12;`, `&middot;` and zero. TC schema uses multipliers x10, not literal source strings. |
| `moves/index.html`, `moves/*/index.html` | 604 = index + 603 details; table/data attributes, detail numeric cards and learner tables | Absorb: `Absorb`<br>`Best Users`<br>`Pokemon That Learn This Move` | Index + detail cards feed JSON; effect description absent on the inspected details, not recovered by re-reading JSON. Do not run network fetcher during a read-only audit. |
| `moves.json` | 1; array of 604 objects, keys slug/n/t/c/bp/ac/pp/pr/d | `"n": "Pound"`<br>`"t": "Normal", "c": "Physical"`<br>`"bp": 40, "ac": 100, "pp": 35`<br>`"pr": 0, "d": ""` | Priority and table stats, not correctness. Deduplicate V-create case alias and apply document deltas. `null` accuracy for never-miss is not 0%. |

## 8. Walkthrough options

| Source order | Strength | Limitation / recommendation |
| --- | --- | --- |
| Full Challenge cap guide | Explicit main-story battle chronology, optional markers and late bosses | **Primary spine**: 37 anchors + separate Iris 79 from spoiler-free list; confirm whether optional bosses create caps or sit within mandatory splits. |
| Trainer Changes | Broad route/visit sequence, gyms, branches and explicit rematch sections | Put every documented trainer under that spine; split revisits by availability. Not a literal playthrough: optional high-level trainers can appear with their location early. |
| Item Changes | 69 areas in broadly visitable order, useful route tasks/rewards | Supplement stop contents, never infer a story trigger from a replacement item line. Some route order differs from trainer traversal. |
| Wild Area Changes | Main Story / Postgame boundary, route/season/floor labels | Supplement location/encounter tasks; fishing/surf can be available later than a route's first visit. Group season variants under one visit, not four mandatory stops. |
| Gifts / NPCs / Legendary guide | Concrete service unlocks and Looker/Unity Tower quest chain | Supply nonbattle tasks and a doc-backed postgame dependency order. Keep optional branches labelled; vanilla story transitions need clearly identified external support or user acceptance. |

Recommendation: cap-guide spine, trainer document within each split, gifts/items/NPCs/wild as stop contents, legendary dependency chain for postgame. Do not claim an author-supplied complete walkthrough exists.

## 9. Renegade Platinum comparison and shared code boundaries

RP input: **13 text docs**, `item-locations.csv`, and its RomHackDex mirror. PokemonChanges v1.3.0 has **493 species headers**; TypeChanges has **29** custom rows. Existing CSV has **698 rows: 270 RP-doc, 428 vanilla** (not an independent hack-only item oracle).

| Area | Shared grammar / source shape | Material difference: do not force one parser |
| --- | --- | --- |
| Pokemon | Box banner, equal delimiters, `NNN - Name`, Old/New, level-number move rows, form variants | RP plain `Ability:` with **two** regular slots; BB2R three including hidden and explicit Complete/Classic. RP baseline USUM; BB2R Sword/Shield plus selected LA. BB2R's trailing spaces/ID errors need tolerant lexer + validation. |
| Moves / types | Fixed-width replacement columns, move heading + change bullets; numbered old/new type/justification rows | RP 11 move replacements, no LA ports; its Fairy replaces ??? and Rotom changes are Gen IV-specific. Never share a calc profile or replacement ID table between hacks. |
| Trainers | Location sections, trainer identities, parties and rematches | RP normal lines are inline `Name  Species Lv. n, ...`; detailed boss rows are `Species (Lv. n) @ item / nature / ability / moves`, including `?` natures, Vs. Seeker badge/C/S rematches and random E4 teams. BB2R uses bracket abilities, difficulty offsets and left/right/tag partners, random natures. |
| Wild | Area/method/rate/species concepts can share output records | RP comma lists, shared `Levels:` headings, Morning/Day/Night, Radar, honey and **three rods** fixed at 10/25/50; BB2R positional parallel tables, seasonal variants, shaking spots/grottos and one rod. |
| Items | Deltas, use-as-stone rules, prices, TMs and prose locations | RP groups item categories; BB2R overworld old -> new lines + mode stars. `rp_item_locations.py` depends on vanilla Platinum decomp placements and must not become a BW2 fallback. |
| Evolution / events | Normalised species, trigger, item/level/time, prerequisite and choice records | RP evolution bullet sections, BB2R numbered species + continuation methods. RP `SpecialEvents.txt` combines gifts/events/legendaries; BB2R separates three docs plus NPCs. RP trades give slash-stat IVs/natures; BB2R traits are prose. |

| Proposed component | Responsibility |
| --- | --- |
| `tools/drayano.py` | Read-only doc lexer with line spans; tolerant separators; Old/New/type/ability/stat blocks; level-up rows; move replacements/deltas; shared typed records, diagnostic counts and explicit alias hooks. Separate BB2R/RP trainer/wild dialect functions, not one giant permissive regex. |
| RomHackDex reader (`tools/romhackdex.py`, proposed) | Local HTML only: species identity/forms, stats, ability slots, evolutions, learnsets by acquisition method, locations, ability descriptions, chart and move JSON. Return provenance, report missing/duplicate fields; no fetch/build/runtime network dependency. |
| Per-hack `extract/` | Source paths/version checks, aliases and unresolved overrides, difficulty selection/offsets, partners/starter/version branches, cap/visit spine, item/gift/quest semantics, doc-over-mirror precedence, profile and save-ID mapping. Existing `extractlib.finalise()` handles shared standardisation/stable keys. |
| Existing helpers | Keep `drayano_check.py` as a reference cross-check, not production parser; `rhd_moves.py` is a fetch/cache producer, not a trusted move oracle; `rp_item_locations.py` is RP-specific enrichment. Never run helpers that mutate shared sources in this audit. |

Scaffold recommendation: **`--like hardlove-gold`**, the built NDS guide with modular dex/locs/trainers/items/walk/gid/check and shared finalisation. Copy layout/schema/testing pattern only; discard its XLSX/hg-engine-specific extract logic, source IDs, Megas and calc assumptions. Emerald Imperium remains the schema/template reference, not the closest input/game family. RP can reuse doc/mirror infrastructure, not BB2R's Gen V reader or roster grammar.

Save-import gap: these docs/mirror do not give reliable complete species/form, move, ability and item **game ID tables**. Gen V save blocks/checksums are not covered by the built Hardlove Gen IV reader. Plan a separate validated BW2 reader + legally supplied game tables + real save/PKHeX comparison; replacement moves retain old slots. Do not synthesize GID from alphabetical indexes or assume canonical modern move IDs.

## 10. Questions for the user's decision round

Each is a decision or missing evidence, not a reason for this research unit to implement anything.

| One-line question | Recommended answer |
| --- | --- |
| Is this the regular Complete v1.4.1 patch, or Complete EVless? | Regular Complete unless the user says EVless; EVless changes wild held items/EV expectations and must be explicit. |
| Should this guide expose Normal/Easy toggles as well as Challenge? | Challenge-only initial build; retain parsed source variants for audits, not extra UI. All 31 paired rosters change composition, not just levels. |
| Are all optional bosses, postgame/rematches and Challenge-only encounters in scope? | Yes, matching 'every trainer'; separate availability/optional flags, including missable pre-Burgh Victini Guardian. |
| Should optional cap-guide bosses create mandatory split boundaries? | Show their suggested caps but use required progression as the default spine; confirm before assigning tracker/save keys. |
| Use displayed Challenge caps, bug-adjusted caps, or an intermediate community convention? | Display the author's caps (Iris 79 separately) and model displayed versus stat level independently in calc; no undocumented midpoint policy. |
| How should Red's level 100 plus +7 note be treated? | Keep raw evidence, cap policy unresolved until in-game verification; never silently emit level 107 or clamp without evidence. |
| What nature/IV defaults are acceptable where trainer docs are incomplete? | Random nature / unknown IVs visibly uncertain; EV 0 is documented. A 31-IV neutral-nature calc preset must be labelled an assumption, not the trainer's exact set. |
| Can you verify Banette 'Grab', Noctowl's berry ability, Jellicent's item and Klinklang's empty item? | Keep unresolved notes and no invented replacements until screenshots/game evidence or an accepted explicit override. |
| Should Shadow Claw's 'PP 70 -> 90' be interpreted as Power 90? | Likely Power typo, but mark provisional and request a game-summary screenshot; do not apply PP 90 as fact. |
| Accept documented move deltas over the mirror's 154 field conflicts? | Yes, with unresolved exceptions retained; do not modernise unspecified Gen V secondary effects. |
| Is the cap-guide/trainer-order reconstructed walkthrough acceptable with spoilers? | Yes; label optional/postgame dependencies and use source-backed tasks, without pretending the docs contain a vanilla step-by-step walkthrough. |
| What is one encounter-tracker area: route, floor, season, grotto, gift or static? | Route/visit as parent, explicit method/season/floor children, gifts/statics separately addressable; no invented Nuzlocke clause or duplicate season ticks. |
| Include undocumented vanilla item placements, HM locations and Curtis/Yancy trades? | Only from a separately approved pinned vanilla BW2 source; otherwise report missing coverage, never assume the changed-item doc is exhaustive. |
| How should conflicting Phione and ranch egg descriptions be resolved? | Provisional Humilau for Phione (NPC prose); random 17-species egg from Gifts over NPCs' 'Audino egg', with explicit accepted overrides. |
| Can you provide your legally obtained BW2 data tables and a representative Thor save with expected party/box contents? | Yes, before promising validated Gen V save import; pin IDs/forms/replaced moves and compare against PKHeX. Never request a ROM redistribution. |
| Which Thor emulator and save format will you use (.sav, DraStic .dsv, other)? | Record the actual emulator/container and a real fixture; save states are not saves. Validate imported abilities/forms/moves/items and boxes. |
| What should calc do for Triple/Rotation/Tag battles it cannot faithfully model? | Preserve format/partners in trainer data; do not disguise them as Singles. Put unsupported targeting/adjacency limitations in the build plan and validate representative battles. |
| Who can perform independent mechanics checks without public source? | User in-game tests for level bug, Triple Axel, sound/Substitute, recoil/critical/ability flags; keep the profile provisional until checked. |

## Handover checks

Research scope: only this report is tracked; all scripts/results stay under ignored `.tmp/bb2r-audit/`. No source, data, extract, template or guide output edited; no network/source refresh, build, merge or push.
Checks passed: supplied checker reproduced; all five local audit scripts rerun in order; `.tmp/bb2r-audit/validate.py` checks inventory closure, raw roster coverage, mode/cap arithmetic, wild coverage, item/move counts and all 19 text filenames; scratch scripts compile; report is 291 lines; `git diff --check` clean. Only this report is staged for the final commit, then the `bb2r-audit` claim is released.
The next unit is the user's decision round and `plans/blaze-black-2-redux.md`, not an unauthorised build. Integrate the reviewed report into `worktree-blaze-black-2-redux` next; no merge has been performed.
