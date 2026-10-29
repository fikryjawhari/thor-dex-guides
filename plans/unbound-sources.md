# Unbound 2.1.1.1 Expert: Unit 1 source audit

Audit: 2026-10-29. Base `72edc56`; branch `worktree-unbound-sources`. Research only: no extract, template or game-data changes. Counts below are reproduced source records, not game completeness claims. D1-D7 remain unchanged. All paths beginning `.src/` mean `hacks/unbound/.src/`. Raw inputs and scratch scripts are intentionally not committed.

## 1. Sources and reproducibility

Pinned file blobs, per-file last-touch commits, licence restrictions and re-fetch commands are in `hacks/unbound/SOURCES.md`. hzla is read-only reference; Unbound-Cloud explicitly declares UNLICENSED. Neither grants permission to copy its implementation. No licence is granted for the community workbooks; keep raw workbooks and saves local.

| Source | Pinned input / evidence | Reproduced contents |
| --- | --- | --- |
| RomHackDex | `.src/romhackdex/`; fetched 2026-10-18/19 | 1,268 actual pokedex HTML files (not the old 1,269 claim); 94 location pages; 352 item pages |
| RomHackDex moves / abilities | `moves.json`, `moves/index.html`, `abilities/index.html` | 993 move rows; 992 normalised names (V-create case duplicate); 258 ability names with descriptions |
| Wiki | `.src/unboundwiki/unboundwiki.json` | 1,545 records including category/index pages; category and URL counts below |
| Boss docs | `trainers-{difficult,expert,insane}.xlsx` | 14 worksheets each: 4 helper sheets + 10 content sheets; per-sheet counts below |
| hzla | `repos/hzla/` at `ff6c3e339e276e6b4e8e44db58750b6534bc26aa` | Insane 417 sets / 97 label groups; Expert 383 / 93; Difficult 357 / 94. Species-key counts are not set counts. |
| Unbound-Cloud | `repos/Unbound-Cloud/` at `3d20f323b3f4690504f638fc8a6d491067f69194` | 1,181 species IDs; 767 move IDs; 523 item IDs; 1,264 BaseStats records. Correct profile is unbound_2_1. |
| New docs hub | `research-2026-10-29/trainer-index.xlsx`; [source](https://docs.google.com/spreadsheets/d/1Ha06sD9mKw5yXXT2icVZjVQapcArU5C5gLEvA-hkq9o/edit) | Intro identifies version 2.1.1.1; LEVEL CAPS table supplies every cap including Maxima. |
| New ordinary-trainer doc | `research-2026-10-29/ordinary-trainers.xlsx`; [source](https://docs.google.com/spreadsheets/d/1s7f-S_d9WNK6vUKUJcTr7xX_dsbJ8eSebvYFSNPo9FU/edit) | 49 worksheets; 418 populated Name blocks; evolution lines, minimum levels and some held items; no Moves or Ability rows. |
| New location guide | `research-2026-10-29/location-guide.xlsx`; linked by trainer-index Intro!E6 | 10 sheets; encounter tables, gifts/statics, legends, trades, swarms, wild held items, TMs, Mega Stones and Z-crystals; no wild-level field. |
| Author DPE Unbound branch | `research-2026-10-29/dpe/`; commit fe058e0e3ac23cf968cf950de43332135bc1549d | Base_Stats.c and species/ability headers; alternative data for missing forms. This branch is not a verified 2.1.1.1 release pin. |

### Scratch reproduction (preserved locally)

Run `node .tmp/unbound-sources/hzla.cjs`, then `uv run python -I .tmp/unbound-sources/audit.py`, `uv run python -I .tmp/unbound-sources/cloud-audit.py`, and `node .tmp/unbound-sources/save-check.cjs`. Other scripts: `inspect.py` (workbook layout), `wiki-probe.py`, `probe-more.py`, `report.py`. Always use `-I`: the scratch filename inspect.py otherwise shadows Python inspect. Logs and machine-readable comparisons are under `.tmp/unbound-sources/`. Later units should implement readers from the schema findings below, not import scratch code.

### Wiki inventory: category membership versus URL families

Category membership is not mutually exclusive: one page belongs to Items and Mega Stones. URL-family counts include parent index pages. Snorunt has no Pokédex category but is an individual Pokémon page, so there are **968 individual species pages**, not 967 or 969.

| Category | Pages |
| --- | --- |
| Items | 90 |
| Locations | 104 |
| Mega Stones | 49 |
| Missions | 84 |
| Pokédex | 967 |
| TMs & HMs | 129 |
| Uncategorized | 1 |
| Walkthrough | 41 |

| URL family | Pages |
| --- | --- |
| (home) | 1 |
| about | 1 |
| categories | 1 |
| contact | 1 |
| elite-four | 1 |
| extras | 11 |
| game-mechanics | 6 |
| gyms | 9 |
| items | 86 |
| locations | 68 |
| mega-stones | 49 |
| misc-info | 51 |
| missions | 84 |
| pokemon | 969 |
| privacy-policy | 1 |
| raid-dens | 33 |
| sitemap | 1 |
| terms-conditions | 1 |
| tms-hms | 129 |
| walkthrough | 41 |
| z-crystals | 1 |

Wild-table heading test: **60 location pages** have a Wild Pokémon heading; this counts pages, not floors, encounter methods or table rows. Raid URL family: 33 pages (includes parent listing); walkthrough: 41 pages (parent + Parts 1-40); gyms: 9 pages (parent + 8 gyms). Do not call these 41 walkthrough parts or 33 individual dens without subtracting the index.

[Trainer Locations List](https://unboundwiki.com/extras/all-trainers/): **309 named rows**, **294 with roster/location cells**, **15 name-only rows**. Count all named rows for the catalogue, but do not invent a party for the name-only entries. Rows include Mega Trainers and rematches, so this is not a clean set of ordinary-only trainers. Pokémon level tokens: 717 (`Lv.` occurrences in roster HTML). The wiki has obvious naming/type slips (Scrappy for Scraggy, Aurora for Aurorus, Inkay labelled Poison/Psychic); do not propagate types from trainer prose.

### Boss workbook layout and counts

Exact per-Pokémon cell pattern: column A `Pokemon Names` (or singular `Pokemon Name` on Boss Wild Battles), same-row species across columns B:G; next row level, +2 ability, +3 item, +4..+7 moves, +8 nature, +9..+14 EVs in HP/Atk/Def/SpA/SpD/Spe order. +15 often contains the calc export trainer label. Parse numeric level cells only: sidebar aura move lists are not Pokémon. Rival has three six-column groups B:G / I:N / P:U, for PLAYER CHOSE GIBLE / BELDUM / LARVITAR. Shadow/Light bosses have partner columns I:K. Boss Wild E:G at row 193 are partner Pokémon, not bosses. Abilities may be alternatives separated by `/` or pre-Mega → post-Mega, not a single definite ability. Blank EVs become zero only where the source cell is genuinely blank; retain question-mark EVs as unknown.

| Worksheet | Dimensions | Difficult teams / mons | Expert teams / mons | Insane teams / mons |
| --- | --- | --- | --- | --- |
| Template | 415 rows × 7 cols | helper | helper | helper |
| EV Spreads | 142 rows × 12 cols | helper | helper | helper |
| Abilities | 912 rows × 9 cols | helper | helper | helper |
| Abilities2 | 910 rows × 6 cols | helper | helper | helper |
| Gym Leaders | 435 rows × 8 cols | 9 / 39 | 9 / 45 | 9 / 49 |
| Pokemon League | 340 rows × 8 cols | 5 / 26 | 5 / 30 | 5 / 30 |
| Rival | 309 rows × 21 cols | 15 / 48 | 15 / 51 | 15 / 51 |
| Team Shadow Bosses | 345 rows × 11 cols | 10 / 37 | 10 / 39 | 10 / 43 |
| Team Light Of Ruin Bosses | 290 rows × 11 cols | 9 / 39 | 9 / 42 | 9 / 42 |
| Boss Wild Battles | 497 rows × 8 cols | 12 / 18 | 12 / 18 | 13 / 19 |
| Mega Trainers | 395 rows × 8 cols | 13 / 62 | 13 / 63 | 13 / 63 |
| Other Bosses | 435 rows × 8 cols | 12 / 55 | 12 / 55 | 12 / 61 |
| Title Defense | 340 rows × 8 cols | 8 / 48 | 8 / 48 | 8 / 48 |
| Battleground | 415 rows × 8 cols | 8 / 40 | 8 / 48 | 8 / 48 |

Teams above are structural groups (block + six-column group), including partners and variants, NOT distinct game trainer IDs. Double opponents can occupy two exported trainer labels within one structural group; postgame battles and repeated species do not have stable IDs here. Expert totals: 101 groups / 439 populated numeric-level Pokémon slots.

## 2. Expert sheet versus hzla: exhaustive audit

Sources: [Expert workbook](https://docs.google.com/spreadsheets/d/1yl1AXKfarFb8_8-iF8We9zmLB135kxJ82yOGQDoMHOs/edit) (worksheet + cell in every record), [pinned hzla backup](https://github.com/hzla/Dynamic-Calc-Decomps/blob/ff6c3e339e276e6b4e8e44db58750b6534bc26aa/backups/unbound.js). Sheets remain authoritative under D1; no code-wins rule applied. The comparison uses all 439 numeric-level sheet slots, including partners. Join the exported trainer label, never species alone across the entire database. Rival 3 and Mega Trainer Almuth lack export labels: their explicit battle identity supplies the label. Wild-boss event labels map to Route9 / Ruins of Void / Cinder Volcano / Vivill Hideout / Distortion World / Crystal Peak. Starter alternatives stay distinct.

| Measure | Count |
| --- | --- |
| Sheet Pokémon slots | 439 |
| Matched sheet slots | 381 |
| Distinct matched hzla sets | 380 |
| Matched slots agreeing on every compared field | 365 |
| Matched slots with one or more differences | 16 |
| Sheet-only / unresolvable species slots | 58 |
| hzla-only malformed species entries | 3 |
| species matches / differences | 381 / 0 |
| level matches / differences | 375 / 6 |
| ability matches / differences | 377 / 4 |
| item matches / differences | 381 / 0 |
| moves matches / differences | 375 / 6 |
| nature matches / differences | 377 / 4 |
| evs matches / differences | 377 / 4 |

Normalisation: case/punctuation and standard Mega/Primal/regional aliases; Aegislash-Shield = the sheet Aegislash; Meowstic M = male/default Meowstic. Moves compare as a multiset (order is not a set difference). Slash-separated ability alternatives and both sides of a Mega arrow accept the hzla-selected member; the raw ambiguity is still retained in the sheet. Empty EV dictionaries are six zeros; the raw hzla key `def` is NOT silently treated as `df`. No absent sets or IVs are inferred.

### Every matched-field disagreement (sheet first, hzla second)

| Sheet cell / species | Trainer label | Field | Sheet | hzla |
| --- | --- | --- | --- | --- |
| Pokemon League!B85 Mega Salamence [1st lead] | Champion Jax | nature | Jolly | Adamant |
| Pokemon League!D85 Magnezone | Champion Jax | evs | {"hp": 6.0, "at": 0, "df": 252.0, "sa": 252.0, "sd": 0, "sp": 0} | {"hp": 6, "def": 252, "sa": 252} |
| Pokemon League!F85 Naganadel | Champion Jax | nature | Timid | Jolly |
| Rival!J43 Swinub | Rival 3 &#124;Player Chose Beldum&#124; | evs | {"hp": 6.0, "at": 252.0, "df": 0, "sa": 0, "sd": 0, "sp": 252.0} | {} |
| Rival!M62 Gabite | Rival 4 &#124;Player Chose Beldum&#124; | moves | ["Dragon Claw", "Bulldoze", "Crunch", "Hone Claws"] | ["Dragon Claw", "Stomping Tantrum", "Crunch", "Fire Blast"] |
| Rival!B81 Mamoswine | Rival 5 &#124;Player Chose Gible&#124; | moves | ["Ice Fang", "Earthquake", "Ice Shard", "Stealth Rock"] | ["Ice Fang", "Bulldoze", "Ice Shard", "Stealth Rock"] |
| Rival!N81 Mega Garchomp | Rival 5 &#124;Player Chose Beldum&#124; | moves | ["Dragon Rush", "Earthquake", "Crunch", "Fire Blast"] | ["Dragon Rush", "Stomping Tantrum", "Crunch", "Sandstorm"] |
| Rival!P81 Mamoswine | Rival 5 &#124;Player Chose Larvitar&#124; | moves | ["Ice Fang", "Earthquake", "Ice Shard", "Stealth Rock"] | ["Ice Fang", "Bulldoze", "Ice Shard", "Stealth Rock"] |
| Team Shadow Bosses!B86 Zapdos | Shadow Admin Marlon2  | level | 41 | 40 |
| Team Shadow Bosses!D86 Mega Sharpedo | Shadow Admin Marlon2  | level | 41 | 40 |
| Team Shadow Bosses!E86 Swoobat | Shadow Admin Marlon2  | level | 40 | 39 |
| Team Shadow Bosses!F86 Krookodile | Shadow Admin Marlon2  | level | 42 | 41 |
| Team Light Of Ruin Bosses!B86 Meloetta [1st lead] | Light of Ruin Aklove3  | ability | Competitive | Serene Grace |
| Team Light Of Ruin Bosses!D86 Manaphy | Light of Ruin Aklove3  | ability | Soul-Heart |  |
| Mega Trainers!E225 Kangaskhan | Mega Trainer Ravonna: Kangaskhan4  | level | 75 | 72 |
| Mega Trainers!E225 Kangaskhan | Mega Trainer Ravonna: Kangaskhan4  | ability | Inner Focus | Limber |
| Mega Trainers!E225 Kangaskhan | Mega Trainer Ravonna: Kangaskhan4  | moves | ["Circle Throw", "Sucker Punch", "Wish", "Protect"] | ["Dark Pulse", "Burning Jealousy", "Thunder Wave", "Nasty Plot"] |
| Mega Trainers!E225 Kangaskhan | Mega Trainer Ravonna: Kangaskhan4  | nature | Impish | Modest |
| Mega Trainers!E225 Kangaskhan | Mega Trainer Ravonna: Kangaskhan4  | evs | {"hp": 252.0, "at": 0, "df": 252.0, "sa": 0, "sd": 4.0, "sp": 0} | {"hp": 6, "at": 252, "df": 252, "sa": 252, "sd": 252, "sp": 252} |
| Battleground!G65 Avalugg | Battleground Mel | level | 82 | 83 |
| Battleground!G65 Avalugg | Battleground Mel | ability | Sturdy | Iron Fist |
| Battleground!G65 Avalugg | Battleground Mel | moves | ["Avalanche", "Recover", "Curse", "Body Press"] | ["Double Iron Bash", "Thunder Punch", "Ice Punch", "High Horsepower"] |
| Battleground!G65 Avalugg | Battleground Mel | nature | Careful | Adamant |
| Battleground!G65 Avalugg | Battleground Mel | evs | {"hp": 252.0, "at": 0, "df": 4.0, "sa": 0, "sd": 252.0, "sp": 0} | {"hp": 6, "at": 252, "df": 4, "sa": 252, "sd": 252, "sp": 252} |

The Ravonna Kangaskhan4 and Battleground Mel Avalugg entries look like misattached species/sets in hzla, not plausible in-game species changes. Preserve raw evidence rather than repairing the authority. hzla also has `def` instead of `df` on Champion Jax Magnezone, and empty EVs on Rival 3 / player Beldum Swinub. The Expert workbook is not byte-identical to the calculator import.

### Per-trainer reconciliation (including matches)

| Worksheet / trainer | Sheet slots | Matched | All fields equal | Field differences |
| --- | --- | --- | --- | --- |
| Gym Leaders / Leader Mirskle | 4 | 4 | 4 | none among matched; inspect missing slots below |
| Gym Leaders / Leader Vega | 4 | 4 | 4 | none among matched; inspect missing slots below |
| Gym Leaders / Leader Alice | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Gym Leaders / Leader Mel | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Gym Leaders / Sucessor Maxima | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Gym Leaders / Leader Galavan | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Gym Leaders / Leader Big Mo | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Gym Leaders / Leader Tessy | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Gym Leaders / Leader Benjamin | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Pokemon League / Elite Four Moleman | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Pokemon League / Elite Four Elias | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Pokemon League / Elite Four Arabella | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Pokemon League / Elite Four Penny | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Pokemon League / Champion Jax | 6 | 6 | 3 | nature:2, evs:1 |
| Rival / Rival 1 [Player Chose Gible] | 1 | 0 | 0 | none among matched; inspect missing slots below |
| Rival / Rival 1 [Player Chose Beldum] | 1 | 0 | 0 | none among matched; inspect missing slots below |
| Rival / Rival 1 [Player Chose Larvitar] | 1 | 0 | 0 | none among matched; inspect missing slots below |
| Rival / Rival 2 [Player Chose Gible] | 2 | 0 | 0 | none among matched; inspect missing slots below |
| Rival / Rival 2 [Player Chose Beldum] | 2 | 0 | 0 | none among matched; inspect missing slots below |
| Rival / Rival 2 [Player Chose Larvitar] | 2 | 0 | 0 | none among matched; inspect missing slots below |
| Rival / Rival 3 &#124;Player Chose Gible&#124; | 3 | 3 | 3 | none among matched; inspect missing slots below |
| Rival / Rival 3 &#124;Player Chose Beldum&#124; | 3 | 3 | 2 | evs:1 |
| Rival / Rival 3 &#124;Player Chose Larvitar&#124; | 3 | 3 | 3 | none among matched; inspect missing slots below |
| Rival / Rival 4 &#124;Player Chose Gible&#124; | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Rival / Rival 4 &#124;Player Chose Beldum&#124; | 5 | 5 | 4 | moves:1 |
| Rival / Rival 4 &#124;Player Chose Larvitar&#124; | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Rival / Rival 5 &#124;Player Chose Gible&#124; | 6 | 6 | 5 | moves:1 |
| Rival / Rival 5 &#124;Player Chose Beldum&#124; | 6 | 6 | 5 | moves:1 |
| Rival / Rival 5 &#124;Player Chose Larvitar&#124; | 6 | 6 | 5 | moves:1 |
| Team Shadow Bosses / Shadow Admin Marlon1 | 3 | 3 | 3 | none among matched; inspect missing slots below |
| Team Shadow Bosses / Shadow Grunt w/ Marlon1 | 2 | 2 | 2 | none among matched; inspect missing slots below |
| Team Shadow Bosses / Jax 1 [Expert] | 3 | 0 | 0 | none among matched; inspect missing slots below |
| Team Shadow Bosses / Shadow Admin Ivory1 | 3 | 3 | 3 | none among matched; inspect missing slots below |
| Team Shadow Bosses / Boss Zeph1 | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Team Shadow Bosses / Shadow Admin Ivory2 | 3 | 3 | 3 | none among matched; inspect missing slots below |
| Team Shadow Bosses / Shadow Grunt w/ Ivory2 | 2 | 2 | 2 | none among matched; inspect missing slots below |
| Team Shadow Bosses / Jax 2 [Expert] | 3 | 0 | 0 | none among matched; inspect missing slots below |
| Team Shadow Bosses / Shadow Admin Marlon2 | 5 | 5 | 1 | level:4 |
| Team Shadow Bosses / Boss Zeph2 | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Team Shadow Bosses / Shadow Admin Marlon3 | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Team Shadow Bosses / Rival | 3 | 0 | 0 | none among matched; inspect missing slots below |
| Team Light Of Ruin Bosses / Light of Ruin Vega | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Team Light Of Ruin Bosses / Light of Ruin Vega - Expert | 1 | 0 | 0 | none among matched; inspect missing slots below |
| Team Light Of Ruin Bosses / Shadow Admin Marlon | 3 | 0 | 0 | none among matched; inspect missing slots below |
| Team Light Of Ruin Bosses / Light of Ruin Aklove1 | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Team Light Of Ruin Bosses / Light of Ruin Admin Ivory3 | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Team Light Of Ruin Bosses / Rival | 6 | 0 | 0 | none among matched; inspect missing slots below |
| Team Light Of Ruin Bosses / Light of Ruin Aklove2 | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Team Light Of Ruin Bosses / Light of Ruin Aklove3 | 6 | 6 | 4 | ability:2 |
| Team Light Of Ruin Bosses / Pokemon Trainer Jax | 3 | 0 | 0 | none among matched; inspect missing slots below |
| Boss Wild Battles / Route9 | 2 | 2 | 2 | none among matched; inspect missing slots below |
| Boss Wild Battles / Ruins of Void | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Boss Wild Battles / Cinder Volcano | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Boss Wild Battles / Vivill Hideout | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Boss Wild Battles / Distortion World | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Boss Wild Battles / Crystal Peak | 7 | 4 | 4 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Lily | 3 | 3 | 3 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Vivian | 2 | 2 | 2 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Mathis | 2 | 2 | 2 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Yale | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Ernesto | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Timothy | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Aloysius | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Osean | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Travon | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Reena | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Krystal | 5 | 5 | 5 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Sterling | 3 | 3 | 3 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Portia | 3 | 3 | 3 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Ravonna: Kangaskhan1 | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Ravonna: Kangaskhan2 | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Ravonna: Kangaskhan3 | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Mega Trainers / Mega Trainer Ravonna: Kangaskhan4 | 1 | 1 | 0 | level:1, ability:1, moves:1, nature:1, evs:1 |
| Mega Trainers / Mega Trainer Almuth | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Other Bosses / Ace Trainer Alexa | 5 | 0 | 0 | none among matched; inspect missing slots below |
| Other Bosses / Pokemon Breeder Annie | 6 | 0 | 0 | none among matched; inspect missing slots below |
| Other Bosses / Black Emboar James | 4 | 4 | 4 | none among matched; inspect missing slots below |
| Other Bosses / Sinnoh Leader Candice | 4 | 4 | 4 | none among matched; inspect missing slots below |
| Other Bosses / Terror Granbull Gruff | 4 | 4 | 4 | none among matched; inspect missing slots below |
| Other Bosses / Black Ferrothorn Rory | 2 | 2 | 2 | none among matched; inspect missing slots below |
| Other Bosses / Black Ferrothorn Chad | 2 | 2 | 2 | none among matched; inspect missing slots below |
| Other Bosses / Science Society Scientist (Supply and Demand) - Expert | 3 | 0 | 0 | none among matched; inspect missing slots below |
| Other Bosses / Science Society Scientist (Rogue Electivire) - Expert | 4 | 0 | 0 | none among matched; inspect missing slots below |
| Other Bosses / Burglar Switzer | 3 | 3 | 3 | none among matched; inspect missing slots below |
| Other Bosses / Black Ferrothorn Bullo | 2 | 2 | 2 | none among matched; inspect missing slots below |
| Other Bosses / Expert Ryuzoji: Mimikyu1 | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Other Bosses / Expert Ryuzoji: Mimikyu2 | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Other Bosses / Expert Ryuzoji: Mimikyu3 | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Other Bosses / Expert Kenlawa: Mimikyu1 | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Other Bosses / Expert Kenlawa: Mimikyu2 | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Other Bosses / Expert Kenlawa: Mimikyu3 | 1 | 1 | 1 | none among matched; inspect missing slots below |
| Other Bosses / Black Ferrothorn Barbs | 4 | 4 | 4 | none among matched; inspect missing slots below |
| Other Bosses / Sinnoh Leader Candice &#124;Rematch&#124; | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Title Defense / Title Defense Zeph | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Title Defense / Title Defense Marlon | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Title Defense / Title Defense Solenk | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Title Defense / Title Defense Milo | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Title Defense / Title Defense Jax | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Title Defense / Title Defense Rival &#124;Player Chose Gible&#124; | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Title Defense / Title Defense Rival &#124;Player Chose Beldum&#124; | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Title Defense / Title Defense Rival &#124;Player Chose Larvitar&#124; | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Battleground / Battleground Mirskle | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Battleground / Battleground Vega | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Battleground / Battleground Alice | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Battleground / Battleground Mel | 6 | 6 | 5 | level:1, ability:1, moves:1, nature:1, evs:1 |
| Battleground / Galavan | 6 | 0 | 0 | none among matched; inspect missing slots below |
| Battleground / Battleground Big Mo | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Battleground / Battleground Tessy | 6 | 6 | 6 | none among matched; inspect missing slots below |
| Battleground / Battleground Benjamin | 6 | 6 | 6 | none among matched; inspect missing slots below |

### Every missing sheet slot / malformed hzla species

| Sheet cell | Trainer / event | Species | Reason |
| --- | --- | --- | --- |
| Rival!B5 | Rival 1 [Player Chose Gible] | Larvitar | no canonical species match |
| Rival!I5 | Rival 1 [Player Chose Beldum] | Gible | no canonical species match |
| Rival!P5 | Rival 1 [Player Chose Larvitar] | Beldum | no canonical species match |
| Rival!B24 | Rival 2 [Player Chose Gible] | Swinub | no canonical species match |
| Rival!C24 | Rival 2 [Player Chose Gible] | Larvitar | no canonical species match |
| Rival!I24 | Rival 2 [Player Chose Beldum] | Swinub | no canonical species match |
| Rival!J24 | Rival 2 [Player Chose Beldum] | Gible | no canonical species match |
| Rival!P24 | Rival 2 [Player Chose Larvitar] | Swinub | no canonical species match |
| Rival!Q24 | Rival 2 [Player Chose Larvitar] | Beldum | no canonical species match |
| Team Shadow Bosses!I6 | Jax 1 [Expert] | Staravia | no canonical species match |
| Team Shadow Bosses!J6 | Jax 1 [Expert] | Magnemite | no canonical species match |
| Team Shadow Bosses!K6 | Jax 1 [Expert] | Golett | no canonical species match |
| Team Shadow Bosses!I66 | Jax 2 [Expert] | Staraptor | no canonical species match |
| Team Shadow Bosses!J66 | Jax 2 [Expert] | Magneton | no canonical species match |
| Team Shadow Bosses!K66 | Jax 2 [Expert] | Gastrodon | no canonical species match |
| Team Shadow Bosses!I126 | Rival | Toucannon | no canonical species match |
| Team Shadow Bosses!J126 | Rival | Vaporeon | no canonical species match |
| Team Shadow Bosses!K126 | Rival | Starter (mega) | no canonical species match |
| Team Light Of Ruin Bosses!C6 | Light of Ruin Vega - Expert | Honchkrow [2nd lead] | no species in labelled trainer |
| Team Light Of Ruin Bosses!I6 | Shadow Admin Marlon | Krookodile | no canonical species match |
| Team Light Of Ruin Bosses!J6 | Shadow Admin Marlon | Cacturne | no canonical species match |
| Team Light Of Ruin Bosses!K6 | Shadow Admin Marlon | Dusclops | no canonical species match |
| Team Light Of Ruin Bosses!I46 | Rival | Toucannon | no canonical species match |
| Team Light Of Ruin Bosses!J46 | Rival | Vaporeon | no canonical species match |
| Team Light Of Ruin Bosses!K46 | Rival | Mamoswine | no canonical species match |
| Team Light Of Ruin Bosses!I66 | Rival | Toucannon | no canonical species match |
| Team Light Of Ruin Bosses!J66 | Rival | Vaporeon | no canonical species match |
| Team Light Of Ruin Bosses!K66 | Rival | Starter (mega) | no canonical species match |
| Team Light Of Ruin Bosses!I86 | Pokemon Trainer Jax | Staraptor | no canonical species match |
| Team Light Of Ruin Bosses!J86 | Pokemon Trainer Jax | Magnezone | no canonical species match |
| Team Light Of Ruin Bosses!K86 | Pokemon Trainer Jax | Golurk | no canonical species match |
| Boss Wild Battles!E193 | Crystal Peak | Toucannon | no canonical species match |
| Boss Wild Battles!F193 | Crystal Peak | Vaporeon | no canonical species match |
| Boss Wild Battles!G193 | Crystal Peak | Mamoswine | no canonical species match |
| Other Bosses!B5 | Ace Trainer Alexa | Breloom | no canonical species match |
| Other Bosses!C5 | Ace Trainer Alexa | Magmar | no canonical species match |
| Other Bosses!D5 | Ace Trainer Alexa | Sealeo | no canonical species match |
| Other Bosses!E5 | Ace Trainer Alexa | Florges | no canonical species match |
| Other Bosses!F5 | Ace Trainer Alexa | Gardevoir | no canonical species match |
| Other Bosses!B25 | Pokemon Breeder Annie | Ninetales | no canonical species match |
| Other Bosses!C25 | Pokemon Breeder Annie | Cherrim | no canonical species match |
| Other Bosses!D25 | Pokemon Breeder Annie | Clefable | no canonical species match |
| Other Bosses!E25 | Pokemon Breeder Annie | Gardevoir | no canonical species match |
| Other Bosses!F25 | Pokemon Breeder Annie | Florges | no canonical species match |
| Other Bosses!G25 | Pokemon Breeder Annie | Liepard | no canonical species match |
| Other Bosses!B125 | Science Society Scientist (Supply and Demand) - Expert | Electrode | no species in labelled trainer |
| Other Bosses!C125 | Science Society Scientist (Supply and Demand) - Expert | Electrode | no species in labelled trainer |
| Other Bosses!D125 | Science Society Scientist (Supply and Demand) - Expert | Electrode | no species in labelled trainer |
| Other Bosses!B145 | Science Society Scientist (Rogue Electivire) - Expert | Rotom Mow | no species in labelled trainer |
| Other Bosses!C145 | Science Society Scientist (Rogue Electivire) - Expert | Manectric | no species in labelled trainer |
| Other Bosses!D145 | Science Society Scientist (Rogue Electivire) - Expert | Magnezone | no species in labelled trainer |
| Other Bosses!E145 | Science Society Scientist (Rogue Electivire) - Expert | Vikavolt | no species in labelled trainer |
| Battleground!B85 | Galavan | Empoleon [1st lead] | no canonical species match |
| Battleground!C85 | Galavan | Togedemaru [2nd lead] | no canonical species match |
| Battleground!D85 | Galavan | Alolan Raichu | no canonical species match |
| Battleground!E85 | Galavan | Rotom Mow | no canonical species match |
| Battleground!F85 | Galavan | Mega Manectric | no canonical species match |
| Battleground!G85 | Galavan | Melmetal | no canonical species match |

| hzla species key | Trainer | Level | Meaning |
| --- | --- | --- | --- |
| [2nd | Light of Ruin Vega | 47 | Not a valid species key; inspect the sheet party, do not import literally |
| Supply and Demand | Science Society Scientist &#124;Supply and Demand&#124; | 53 | Not a valid species key; inspect the sheet party, do not import literally |
| Rogue Electivire | Science Society Scientist &#124;Rogue Electivire&#124; | 59 | Not a valid species key; inspect the sheet party, do not import literally |

The duplicated Route9 Shadow Warrior pair maps to one hzla species/label dictionary entry (two sheet columns, one unique hzla set). The Science Society Scientist trio of identical Electrode slots is collapsed/malformed as `Supply and Demand`; the other scientist is represented only by malformed `Rogue Electivire`. Light of Ruin Vega has species `[2nd` instead of Honchkrow. Missing full teams include rival battles 1-2, partners, Alexa, Annie and Battleground Galavan. These are coverage differences, not field matches. All 383 raw hzla Expert sets are accounted for: 380 distinct joins + 3 malformed unmatched keys.

## 3. RomHackDex versus wiki: types, abilities and form identity

Sources: `.src/romhackdex/pokedex/<slug>/index.html` and `.src/unboundwiki/unboundwiki.json`; every wiki row links to its page. Match by URL slug plus explicit regional/form aliases, **not h1**: RHD reuses base h1 names for many distinct forms. 968 wiki individual pages matched, 0 type disagreements. The wiki does not expose a Base Stats/HP/Attack/Defense/Speed table in these pages: **zero stat comparisons are possible**; lack of a wiki stat difference is not evidence of agreement. Sample stat cross-check against Unbound-Cloud is supplementary below.

**41 displayed ability-list disagreements** after case/punctuation normalisation; 927 agreeing lists. This includes spelling/description aliases and gender-combined wiki pages as well as substantive differences: do not report all 41 as mechanics differences. Ability-slot order is not established by the wiki. RHD duplicated ordinary abilities are collapsed for this comparison.

| Wiki page | RHD slug | Wiki abilities | RHD abilities |
| --- | --- | --- | --- |
| [Moltres](https://unboundwiki.com/pokemon/moltres/) | moltres | Pressure / Flame Body / Berserk (Hidden) | Pressure / Flame Body / Berserk |
| [Calyrex Shadow Rider](https://unboundwiki.com/pokemon/calyrex-shadow-rider/) | calyrex-shadow-rider | Asone Grim | As One |
| [Calyrex Ice Rider](https://unboundwiki.com/pokemon/calyrex-ice-rider/) | calyrex-ice-rider | Asone Chilling | As One |
| [Basculin](https://unboundwiki.com/pokemon/basculin/) | basculin-red |  | Reckless / Adaptability / Speed Boost |
| [Barraskewda](https://unboundwiki.com/pokemon/barraskewda/) | barraskewda | Swift Swim / Propeller Tail | Swift Swim / Propellor Tail |
| [Arrokuda](https://unboundwiki.com/pokemon/arrokuda/) | arrokuda | Swift Swim / Propeller Tail | Swift Swim / Propellor Tail |
| [Stonjourner](https://unboundwiki.com/pokemon/stonjourner/) | stonjourner | Power Spot / Filter | Power Spot / Solid Rock |
| [Flygon](https://unboundwiki.com/pokemon/flygon/) | flygon | Levitate / Sound Waves | Levitate / Levitate / Punk Rock |
| [Vibrava](https://unboundwiki.com/pokemon/vibrava/) | vibrava | Levitate / Sound Waves | Levitate / Levitate / Punk Rock |
| [Alolan Muk](https://unboundwiki.com/pokemon/alolan-muk/) | muk-a | Poison Touch / Gluttony / Power Of Alchemy | Poison Touch / Gluttony / Alchemic Power |
| [Alolan Grimer](https://unboundwiki.com/pokemon/alolan-grimer/) | grimer-a | Poison Touch / Gluttony / Power Of Alchemy | Poison Touch / Gluttony / Alchemic Power |
| [Meowstic](https://unboundwiki.com/pokemon/meowstic/) | meowstic | Keen Eye (Male) / Competitive (Female) / Infiltrator / Prankster (Male) / Psychic Surge (Female) | Keen Eye / Infiltrator / Prankster |
| [Carracosta](https://unboundwiki.com/pokemon/carracosta/) | carracosta | Filter / Solid Rock / Swift Swim | Solid Rock / Sturdy / Swift Swim |
| [Tirtouga](https://unboundwiki.com/pokemon/tirtouga/) | tirtouga | Filter / Solid Rock / Swift Swim | Solid Rock / Sturdy / Swift Swim |
| [Unfezant](https://unboundwiki.com/pokemon/unfezant/) | unfezant | Rivalry / Super Luck / Pride | Rivalry / Super Luck / Proud |
| [Tranquill](https://unboundwiki.com/pokemon/tranquill/) | tranquill | Rivalry / Super Luck / Pride | Rivalry / Super Luck / Proud |
| [Pidove](https://unboundwiki.com/pokemon/pidove/) | pidove | Rivalry / Super Luck / Pride | Rivalry / Super Luck / Proud |
| [Noivern](https://unboundwiki.com/pokemon/noivern/) | noivern | Frisk / Infiltrator / Sound Waves | Frisk / Infiltrator / Punk Rock |
| [Noibat](https://unboundwiki.com/pokemon/noibat/) | noibat | Frisk / Infiltrator / Sound Waves | Frisk / Infiltrator / Punk Rock |
| [Seviper](https://unboundwiki.com/pokemon/seviper/) | seviper | Shed Skin / Infiltrator / Slippery Tail | Shed Skin / Infiltrator / Gale Wings |
| [Exploud](https://unboundwiki.com/pokemon/exploud/) | exploud | Soundproof / Below / Scrappy | Soundproof / Bellow / Scrappy |
| [Loudred](https://unboundwiki.com/pokemon/loudred/) | loudred | Soundproof / Below / Scrappy | Soundproof / Bellow / Scrappy |
| [Whismur](https://unboundwiki.com/pokemon/whismur/) | whismur | Soundproof / Below / Rattled | Soundproof / Bellow / Rattled |
| [Magcargo](https://unboundwiki.com/pokemon/magcargo/) | magcargo | Evaporate / Flame Body / Weak Armor | Storm Drain / Flame Body / Weak Armor |
| [Jynx](https://unboundwiki.com/pokemon/jynx/) | jynx | Oblivious / Dry Skin / Icy Skin | Oblivious / Dry Skin / Ice Scales |
| [Smoochum](https://unboundwiki.com/pokemon/smoochum/) | smoochum | Oblivious / Hydration / Icy Skin | Oblivious / Hydration / Ice Scales |
| [Camerupt](https://unboundwiki.com/pokemon/camerupt/) | camerupt | Magma Armor / Filter / Anger Point | Magma Armor / Solid Rock / Anger Point |
| [Sunflora](https://unboundwiki.com/pokemon/sunflora/) | sunflora | Chlorophyll / Solar Power / Grass Dash | Chlorophyll / Solar Power / Gale Wings |
| [Galarian Weezing](https://unboundwiki.com/pokemon/galarian-weezing/) | weezing-g | Levitate / Neutralizinggas / Misty Surge | Levitate / Neutralize Gas / Misty Surge |
| [Medicham](https://unboundwiki.com/pokemon/medicham/) | medicham | Huge Power / Telepathy | Pure Power / Telepathy |
| [Meditite](https://unboundwiki.com/pokemon/meditite/) | meditite | Huge Power / Telepathy | Pure Power / Telepathy |
| [Rhyperior](https://unboundwiki.com/pokemon/rhyperior/) | rhyperior | Lightning Rod / Filter / Reckless | Lightning Rod / Solid Rock / Reckless |
| [Persian](https://unboundwiki.com/pokemon/persian/) | persian | Limber / Technician / Sturdy | Limber / Technician / Nine Lives |
| [Meowth](https://unboundwiki.com/pokemon/meowth/) | meowth | Pickup / Technician / Sturdy | Pickup / Technician / Nine Lives |
| [Weezing](https://unboundwiki.com/pokemon/weezing/) | weezing | Levitate / Neutralizinggas / Stench | Levitate / Neutralize Gas / Stench |
| [Koffing](https://unboundwiki.com/pokemon/koffing/) | koffing | Levitate / Neutralizinggas / Stench | Levitate / Neutralize Gas / Stench |
| [Machamp](https://unboundwiki.com/pokemon/machamp/) | machamp | Guts / No Guard / Sturdy | Guts / No Guard / Focus Belt |
| [Machoke](https://unboundwiki.com/pokemon/machoke/) | machoke | Guts / No Guard / Sturdy | Guts / No Guard / Focus Belt |
| [Fearow](https://unboundwiki.com/pokemon/fearow/) | fearow | Keen Eye / Sniper / Drill Beak | Keen Eye / Sniper / Merciless |
| [Spearow](https://unboundwiki.com/pokemon/spearow/) | spearow | Keen Eye / Sniper / Drill Beak | Keen Eye / Sniper / Merciless |
| [Glaceon](https://unboundwiki.com/pokemon/glaceon/) | glaceon | Snow Cloak / Icy Skin | Snow Cloak / Snow Cloak / Ice Scales |

### Sample check and custom-ability traps

| Species | Wiki / RHD types | Wiki stats | Ability status |
| --- | --- | --- | --- |
| [Bulbasaur](https://unboundwiki.com/pokemon/bulbasaur/) | Grass/Poison = Grass/Poison | not supplied | same displayed set |
| [Pikachu](https://unboundwiki.com/pokemon/pikachu/) | Electric = Electric | not supplied | same displayed set |
| [Flygon](https://unboundwiki.com/pokemon/flygon/) | Ground/Dragon = Ground/Dragon | not supplied | disagreement above |
| [Vibrava](https://unboundwiki.com/pokemon/vibrava/) | Ground/Dragon = Ground/Dragon | not supplied | disagreement above |
| [Stonjourner](https://unboundwiki.com/pokemon/stonjourner/) | Rock = Rock | not supplied | disagreement above |
| [Calyrex Shadow Rider](https://unboundwiki.com/pokemon/calyrex-shadow-rider/) | Psychic/Ghost = Psychic/Ghost | not supplied | disagreement above |
| [Alolan Raichu](https://unboundwiki.com/pokemon/alolan-raichu/) | Electric/Psychic = Electric/Psychic | not supplied | same displayed set |
| [Pumpkaboo](https://unboundwiki.com/pokemon/pumpkaboo/) | Ghost/Grass = Ghost/Grass | not supplied | same displayed set |
| [Minior](https://unboundwiki.com/pokemon/minior/) | Rock/Flying = Rock/Flying | not supplied | same displayed set |
| [Moltres](https://unboundwiki.com/pokemon/moltres/) | Fire/Flying = Fire/Flying | not supplied | disagreement above |

Wiki display names missing from the 258-entry RHD ability index (includes annotations/typos, not all new abilities): `Analytic`, `Asone Chilling`, `Asone Grim`, `Aura Break`, `Below`, `Berserk`, `Berserk (Hidden)`, `Bulletproof`, `Competitive (Female)`, `Cotton Down`, `Cursed Body`, `Drill Beak`, `Early Bird`, `Evaporate`, `Fairy Aura`, `Filter`, `Forecast`, `Grass Dash`, `Honey Gather`, `Icy Skin`, `Keen Eye (Male)`, `Multiscale`, `Neutralizinggas`, `No Guard`, `Overcoat`, `Power Construct`, `Power Of Alchemy`, `Prankster (Male)`, `Pride`, `Propeller Tail`, `Protean`, `Psychic Surge`, `Psychic Surge (Female)`, `Run Away`, `Simple`, `Slippery Tail`, `Sound Waves`, `Suction Cups`, `Technician`, `Victory Star`, `Water Absorb`, `Water Veil`.

Custom-mechanics reference is `repos/hzla/calc/mechanics/romhacks/profiles/unbound.js`: Grass Dash, Slippery Tail, Bellow / Sound Waves, Crabby Tactics, Vicious Sandstorm and full-HP shields. RHD can use vanilla aliases instead (Flygon/Vibrava Punk Rock versus wiki Sound Waves). Cloud has symbolic AbilityNames and per-species ability slots, not a standalone integer ability-ID array. Do not generate a numeric ability ID from JSON key order. The seven new Cloud names absent from hzla (Aura Guard, Dragonize, Eelevate, Fire Mane, Mega Sol, Piercing Drill, Spicy Spray) are cross-repository additions, not proof of their availability in 2.1.1.1.

### Every wiki/RHD display-name mismatch and every ambiguous RHD form h1

| Wiki name | RHD h1 | RHD slug |
| --- | --- | --- |
| Blacephalon | Blacphalon | blacephalon |
| Eternal Flower Floette | Floette | floette-eternal |
| Original Color Magearna | Magearna | magearna-p |
| Urshifu (Rapid Strike Style) | Urshifu | urshifu-rapid |
| Urshifu (Single Strike Style) | Urshifu | urshifu-single |
| Calyrex Shadow Rider | Calyrex | calyrex-shadow-rider |
| Calyrex Ice Rider | Calyrex | calyrex-ice-rider |
| Galarian Corsola | Corsola | corsola-g |
| Hoopa (Unbound Form) | Hoopa | hoopa-unbound |
| Hoopa (Confined Form) | Hoopa | hoopa |
| Lycanroc (Dusk Form) | Lycanroc | lycanroc-dusk |
| Lycanroc (Midnight Form) | Lycanroc | lycanroc-n |
| Lycanroc (Midday Form) | Lycanroc | lycanroc |
| Basculegion | Basculegon | basculegion-m |
| Hisuian Basculin | Basculin | basculin-h |
| Galarian Slowking | Slowking | slowking-g |
| Galarian Slowbro | Slowbro | slowbro-g |
| Galarian Slowpoke | Slowpoke | slowpoke-g |
| Galarian Yamask | Yamask | yamask-g |
| Barraskewda | Baraskewda | barraskewda |
| Polteageist | Poltegeist | polteageist |
| Galarian Darmanitan | Darmanitan | darmanitan-g |
| Galarian Darumaka | Darumaka | darumaka-g |
| Stonjourner | Stonjorner | stonjourner |
| Centiskorch | Centskorch | centiskorch |
| Corviknight | Corvknight | corviknight |
| Corvisquire | Corvsquire | corvisquire |
| Hisuian Sneasel | Sneasel | sneasel-h |
| Hisuian Qwilfish | Qwilfish | qwilfish-h |
| Galarian Meowth | Meowth | meowth-g |
| Galarian Linoone | Linoone | linoone-g |
| Galarian Zigzagoon | Zigzagoon | zigzagoon-g |
| Galarian Mr. Mime | Mr. Mime | mr-mime-g |
| Galarian Farfetch’d | Farfetch'd | farfetchd-g |
| Hisuian Arcanine | Arcanine | arcanine-h |
| Hisuian Growlithe | Growlithe | growlithe-h |
| Alolan Ninetales | Ninetales | ninetales-a |
| Alolan Vulpix | Vulpix | vulpix-a |
| Hisuian Typhlosion | Typhlosion | typhlosion-h |
| Galarian Stunfisk | Stunfisk | stunfisk-g |
| Hisuian Lilligant | Lilligant | lilligant-h |
| Hisuian Decidueye | Decidueye | decidueye-h |
| Spiky-Eared Pichu | Pichu | pichu-spiky |
| Alolan Exeggutor | Exeggutor | exeggutor-a |
| Hisuian Electrode | Electrode | electrode-h |
| Hisuian Voltorb | Voltorb | voltorb-h |
| Galarian Rapidash | Rapidash | rapidash-g |
| Galarian Ponyta | Ponyta | ponyta-g |
| Alolan Sandslash | Sandslash | sandslash-a |
| Alolan Sandshrew | Sandshrew | sandshrew-a |
| Galarian Zapdos | Zapdos | zapdos-g |
| Galarian Moltres | Moltres | moltres-g |
| Galarian Articuno | Articuno | articuno-g |
| Hisuian Samurott | Samurott | samurott-h |
| Hisuian Braviary | Braviary | braviary-h |
| Hisuian Avalugg | Avalugg | avalugg-h |
| Crabominable | Crabminble | crabominable |
| Alolan Raticate | Raticate | raticate-a |
| Alolan Rattata | Rattata | rattata-a |
| Hisuian Sliggoo | Sliggoo | sliggoo-h |
| Hisuian Goodra | Goodra | goodra-h |
| Alolan Muk | Muk | muk-a |
| Alolan Grimer | Grimer | grimer-a |
| Alolan Persian | Persian | persian-a |
| Alolan Meowth | Meowth | meowth-a |
| Alolan Dugtrio | Dugtrio | dugtrio-a |
| Alolan Diglett | Diglett | diglett-a |
| Hisuian Zoroark | Zoroark | zoroark-h |
| Hisuian Zorua | Zorua | zorua-h |
| Fletchinder | Fletchindr | fletchinder |
| Alolan Golem | Golem | golem-a |
| Alolan Graveler | Graveler | graveler-a |
| Alolan Geodude | Geodude | geodude-a |
| Alolan Raichu | Raichu | raichu-a |
| Galarian Weezing | Weezing | weezing-g |
| Alolan Marowak | Marowak | marowak-a |
| Nidoran (Male) | Nidoran | nidoran-m |
| Nidoran (Female) | Nidoran | nidoran-f |

78 wiki/RHD display-name mismatches listed above. Separately, **126 RHD h1 names are shared by 378 form pages**; all collision groups are listed below, including forms with no separate wiki page. Every slug is a distinct source identity until explicitly collapsed by a later unit. RHD sprite dex tags: 158 >=10000 tags, 5 unparsed/missing; these are not a reliable form count or GID. Exact page/form count is 1,268 with 1,016 distinct h1 strings; neither is an authoritative base-species count. Do not deduplicate by h1 or sprite ID. The 968 wiki pages likewise include regional forms (see the 78-name mismatch table), not 968 National Dex species.

| Shared RHD h1 | All colliding form slugs |
| --- | --- |
| Aegislash | aegislash, aegislash-blade |
| Alcremie | alcremie-berry, alcremie-clover, alcremie-flower, alcremie-love, alcremie-ribbon, alcremie-star, alcremie-strawberry |
| Arcanine | arcanine, arcanine-h |
| Arceus | arceus, arceus-bug, arceus-dark, arceus-dragon, arceus-electric, arceus-fairy, arceus-fight, arceus-fire, arceus-flying, arceus-ghost, arceus-grass, arceus-ground, arceus-ice, arceus-poison, arceus-psychic, arceus-rock, arceus-steel, arceus-water |
| Articuno | articuno, articuno-g |
| Avalugg | avalugg, avalugg-h |
| Basculegon | basculegion-f, basculegion-m |
| Basculin | basculin-blue, basculin-h, basculin-red |
| Braviary | braviary, braviary-h |
| Burmy | burmy, burmy-sandy, burmy-trash |
| Calyrex | calyrex, calyrex-ice-rider, calyrex-shadow-rider |
| Cherrim | cherrim, cherrim-sun |
| Corsola | corsola, corsola-g |
| Cramorant | cramorant, cramorant-gorging, cramorant-gulping |
| Cubone | cubone, cubone-a |
| Darmanitan | darmanitan, darmanitan-g, darmanitan-g-zen, darmanitanzen |
| Darumaka | darumaka, darumaka-g |
| Decidueye | decidueye, decidueye-h |
| Deerling | deerling, deerling-autumn, deerling-summer, deerling-winter |
| Deoxys | deoxys, deoxys-attack, deoxys-defense, deoxys-speed |
| Dialga | dialga, dialga-origin |
| Diglett | diglett, diglett-a |
| Dugtrio | dugtrio, dugtrio-a |
| Eiscue | eiscue, eiscue-noice |
| Electrode | electrode, electrode-h |
| Enamorus | enamorus, enamorus-therian |
| Eternatus | eternatus, eternatus-eternamax |
| Exeggcute | exeggcute, exeggcute-a |
| Exeggutor | exeggutor, exeggutor-a |
| Farfetch'd | farfetchd-g, farfetched |
| Flabébé | flabebe, flabebe-blue, flabebe-orange, flabebe-white, flabebe-yellow |
| Floette | floette, floette-blue, floette-eternal, floette-orange, floette-white, floette-yellow |
| Florges | florges, florges-blue, florges-orange, florges-white, florges-yellow |
| Frillish | frillish, frillish-f |
| Furfrou | furfrou, furfrou-dandy, furfrou-debutante, furfrou-diamond, furfrou-heart, furfrou-kabuki, furfrou-la-reine, furfrou-matron, furfrou-pharoah, furfrou-star |
| Gastrodon | gastrodon, gastrodon-east |
| Genesect | genesect, genesect-burn, genesect-chill, genesect-douse, genesect-shock |
| Geodude | geodude, geodude-a |
| Gigantamax Toxtricity | toxtricity-giga, toxtricity-low-key-giga |
| Gigantamax Urshifu | urshifu-rapid-giga, urshifu-single-giga |
| Giratina | giratina, giratina-origin |
| Golem | golem, golem-a |
| Goodra | goodra, goodra-h |
| Gourgeist | gourgeist, gourgeist-l, gourgeist-m, gourgeist-xl |
| Graveler | graveler, graveler-a |
| Greninja | ashgreninja, greninja |
| Grimer | grimer, grimer-a |
| Growlithe | growlithe, growlithe-h |
| Hippopotas | hippopotas, hippopotas-f |
| Hippowdon | hippowdon, hippowdon-f |
| Hoopa | hoopa, hoopa-unbound |
| Indeedee | indeedee, indeedee-female |
| Jellicent | jellicent, jellicent-f |
| Keldeo | keldeo, keldeo-resolute |
| Koffing | koffing, koffing-g |
| Kyurem | kyurem, kyurem-black, kyurem-white |
| Landorus | landorus, landorus-therian |
| Lilligant | lilligant, lilligant-h |
| Linoone | linoone, linoone-g |
| Lycanroc | lycanroc, lycanroc-dusk, lycanroc-n |
| Magearna | magearna, magearna-p |
| Marowak | marowak, marowak-a |
| Meloetta | meloetta, meloetta-pirouette |
| Meowstic | meowstic, meowstic-female |
| Meowth | meowth, meowth-a, meowth-g |
| Mime Jr. | mime-jr, mime-jr-g |
| Mimikyu | mimikyu, mimikyu-busted |
| Minior | minior-blue, minior-green, minior-indigo, minior-orange, minior-red, minior-shield, minior-violet, minior-yellow |
| Moltres | moltres, moltres-g |
| Morpeko | morpeko, morpeko-hangry |
| Mr. Mime | mr-mime, mr-mime-g |
| Muk | muk, muk-a |
| Necrozma | necrozma, necrozma-dawn-wings, necrozma-dusk-mane, necrozma-ultra |
| Nidoran | nidoran-f, nidoran-m |
| Ninetales | ninetales, ninetales-a |
| Oricorio | oricorio, oricorio-p, oricorio-s, oricorio-y |
| Palkia | palkia, palkia-origin |
| Persian | persian, persian-a |
| Pichu | pichu, pichu-spiky |
| Pikachu | pikachu, pikachu-belle, pikachu-cap-hoenn, pikachu-cap-kalos, pikachu-cap-original, pikachu-cap-partner, pikachu-cap-sinnoh, pikachu-cap-unova, pikachu-cosplay, pikachu-flying, pikachu-libre, pikachu-phd, pikachu-pop-star, pikachu-rock-star, pikachu-surfing |
| Poltegeist | polteageist, polteageist-chipped |
| Ponyta | ponyta, ponyta-g |
| Pumpkaboo | pumpkaboo, pumpkaboo-l, pumpkaboo-m, pumpkaboo-xl |
| Pyroar | pyroar, pyroar-female |
| Qwilfish | qwilfish, qwilfish-h |
| Raichu | raichu, raichu-a |
| Rapidash | rapidash, rapidash-g |
| Raticate | raticate, raticate-a |
| Rattata | rattata, rattata-a |
| Rotom | rotom, rotom-fan, rotom-frost, rotom-heat, rotom-mow, rotom-wash |
| Samurott | samurott, samurott-h |
| Sandshrew | sandshrew, sandshrew-a |
| Sandslash | sandslash, sandslash-a |
| Sawsbuck | sawsbuck, sawsbuck-autumn, sawsbuck-summer, sawsbuck-winter |
| Shaymin | shaymin, shaymin-sky |
| Shellos | shellos, shellos-east |
| Silvally | silvally, silvally-bug, silvally-dark, silvally-dragon, silvally-electric, silvally-fairy, silvally-fight, silvally-fire, silvally-flying, silvally-ghost, silvally-grass, silvally-ground, silvally-ice, silvally-poison, silvally-psychic, silvally-rock, silvally-steel, silvally-water |
| Sinistea | sinistea, sinistea-chipped |
| Sliggoo | sliggoo, sliggoo-h |
| Slowbro | slowbro, slowbro-g |
| Slowking | slowking, slowking-g |
| Slowpoke | slowpoke, slowpoke-g |
| Sneasel | sneasel, sneasel-h |
| Stunfisk | stunfisk, stunfisk-g |
| Thundurus | thundurus, thundurus-therian |
| Tornadus | tornadus, tornadus-therian |
| Toxtricity | toxtricity, toxtricity-low-key |
| Typhlosion | typhlosion, typhlosion-h |
| Unfezant | unfezant, unfezant-f |
| Urshifu | urshifu-rapid, urshifu-single |
| Vivillon | vivillon, vivillon-archipelago, vivillon-continental, vivillon-elegant, vivillon-fancy, vivillon-garden, vivillon-high-plains, vivillon-icy-snow, vivillon-jungle, vivillon-marine, vivillon-modern, vivillon-monsoon, vivillon-ocean, vivillon-pokeball, vivillon-polar, vivillon-river, vivillon-sandstorm, vivillon-savanna, vivillon-sun, vivillon-tundra |
| Voltorb | voltorb, voltorb-h |
| Vulpix | vulpix, vulpix-a |
| Weezing | weezing, weezing-g |
| Wishiwashi | wishiwashi, wishiwashi-s |
| Wormadam | wormadam, wormadam-sandy, wormadam-trash |
| Xerneas | xerneas, xerneas-natural |
| Yamask | yamask, yamask-g |
| Zacian | zacian, zacian-crowned |
| Zamazenta | zamazenta, zamazenta-crowned |
| Zapdos | zapdos, zapdos-g |
| Zarude | zarude, zarude-dada |
| Zigzagoon | zigzagoon, zigzagoon-g |
| Zoroark | zoroark, zoroark-h |
| Zorua | zorua, zorua-h |
| Zygarde | zygarde, zygarde-10, zygarde-cell, zygarde-complete, zygarde-core |

Special aliases used in the cross-check: Alolan/Galarian/Hisuian prefixes map to `-a`/`-g`/`-h`; eternal-floette→floette-eternal; original-color-magearna→magearna-p; lycanroc-midnight→lycanroc-n; lycanroc-midday→lycanroc; hoopa-unbound-form→hoopa-unbound; farfetchd→farfetched. Wiki Alcremie/Basculin/Minior/Basculegion are umbrella/default pages: matched to strawberry/red/shield/male respectively only for displayed type/ability comparison, not proof that those are the sole forms. Wiki Spiky-Eared Pichu→pichu-spiky. Full forms still require Cloud species defines and the source-specific mappings.

### Reader hazards reproduced

`tools/romhackdex.py` Species currently raises on the evolution-level HTML entity `&mdash;` (rendered em dash) in 399 pages. For this research only, those nonnumeric level cells were temporarily mapped to zero in memory; **no source was edited**, and those zero values are NOT usable learnset levels. Unit 3 must explicitly represent evolution-learned moves (and preserve source ordering), rather than adopt this research placeholder. For exact naming mismatches (including Blacphalon) use the exhaustive name table above; use slugs/defines to avoid missed joins.

## 4. Unbound-Cloud numbering and save-oracle map

| Table (under server/src/data/unbound_2_1/) | Cloud records | hzla records | Differing entries |
| --- | --- | --- | --- |
| Species | 1181 | 1181 | 0 |
| Moves | 767 | 767 | 0 |
| Items | 523 | 523 | 0 |
| BaseStats | 1264 | 1264 | 0 |
| AbilityNames | 343 | 336 | 7 |

Species/Moves/Items/BaseStats have no first mismatch: every key/value agrees. AbilityNames is `src/data/AbilityNames.json`, symbolic not numeric; its first extra token is ABILITY_AURAGUARD. All seven extras are listed in section 3. Species 0, move 0 and item 0 are NONE sentinels, so table lengths are not counts of usable choices. Forms use internal IDs, not National Dex numbers. `SpeciesNamesAlts.json` supplies form display labels; preserve the internal define as identity. BaseStats has more entries than Species because not every data/form record has a save ID in this profile.

Save reader path map: `server/src/SaveBlocks.py` validates/chooses the Gen 3 slot and fixed blocks 30/31; `SaveBlockProcessing.py` assembles box sections, names, flags and vars; `PokemonProcessing.py` decodes the 58-byte CFRU boxed struct, packed moves and stat fields; `PokemonUtil.py` / `Util.py` provide conversion and naming helpers; `Defines.py` chooses the profile/signature. Party records remain Gen 3 100-byte structs. Current Cloud labels 0x01121999 old (2.1.0-2.1.1.1), whereas hzla deliberately supports it. Never replace this with Cloud's current `unbound` profile or 0x01122000 signature.

53 binary saves searched; **37 contain 2.1-signature sectors**, copied under `.src/saves/Unbound-Cloud/`. hzla directly parsed **32** and rejected **5** of those candidates; acceptance does not mean the input is an untouched human playthrough. `_new` files are upstream test-write outputs and corrupt/randomizer filenames are controls. The signature narrows version to 2.1.x, not exactly 2.1.1.1. Expert fixture is var_test/expert_difficulty.sav (the upstream test asserts difficulty var == 2). This closes the no-binary-oracle gap, not the real Thor .srm import check.

Every file below has licence status **UNLICENSED / no separate save grant found**, inherited repository context only; local research use, never commit/distribute them. Links are immutable at the pinned Cloud commit. Exact copied paths omit `server/pytests/data/saves/` below. For raw expected box objects see `server/pytests/data/flex.json`, `flex_titles.json`, `test_hoopa_shaymin_preset_box.json` and the corresponding upstream tests. These are independent expected-data candidates, not runtime assertions executed by this audit.

| Save (immutable URL) | Bytes | hzla reader result | SHA-256 |
| --- | --- | --- | --- |
| [corrupt_blocks_30_31.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/corrupt_blocks_30_31.sav) | 131072 | accepted: 1 party, 576 boxed | 466a0d60099b1533051d5dd310e06b218803690b3b40f4742c8679a8eb21a4a7 |
| [corrupt_blocks_30_31_new.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/corrupt_blocks_30_31_new.sav) | 131072 | accepted: 1 party, 576 boxed | 0617432c073e6fd6e696621627c736da44e7de2a2bc4fe67f3b74176f0b100f9 |
| [duplicate_block_id.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/duplicate_block_id.sav) | 131072 | accepted: 1 party, 597 boxed | 605909330a0d88e40f8d987d402399b6a1765af7cff826fa88af122c28e72ed2 |
| [flag_test/unbound_easy_puzzles.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/flag_test/unbound_easy_puzzles.sav) | 131072 | accepted: 0 party, 0 boxed | fbdcc1b1b01d71ab82ab6c16fb29c15f1f35a0d5a0b95ded6276c874809ab17a |
| [flag_test/unbound_hard_puzzles.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/flag_test/unbound_hard_puzzles.sav) | 131072 | accepted: 0 party, 0 boxed | 70b6ebaf73577b58ff7ef82542d2f4aa561ab75209e667694b1454a4ce7edd08 |
| [flag_test/unbound_randomizers.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/flag_test/unbound_randomizers.sav) | 131072 | Randomized Pokemon Unbound 2.1 saves are not supported yet. | 4592765aa85f35879bd48a7cfdf58f3bc58103148765b819a21976ef792f42ea |
| [flashcart.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/flashcart.sav) | 131088 | accepted: 6 party, 45 boxed | dafeb9afbf9717e9eed755aa6eaf8a978b5477098533b7479ab9ab187d767eb2 |
| [flashcart_new.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/flashcart_new.sav) | 131088 | accepted: 6 party, 45 boxed | 727b2cdf7f3a88ff9702101f70d5eb7018c14946960d1018d9531b0d874768a0 |
| [flex.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/flex.sav) | 131072 | accepted: 3 party, 598 boxed | 0528f870c0a282cd8ec9e933fa24e96643b91aaa3d756f041d60136bfbcc5c57 |
| [flex_new.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/flex_new.sav) | 131072 | accepted: 3 party, 598 boxed | f8f9c2a67e5bf8e775ea6a72a3a57e99a26d951c5ab9d3328415d8c40a63e54b |
| [invalid_block_id.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/invalid_block_id.sav) | 131072 | accepted: 1 party, 597 boxed | 32b2f34d0b7d06338465067a690f3ca8b29d7bc147652cf0538c8eb627a2e359 |
| [invalid_checksum.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/invalid_checksum.sav) | 131072 | accepted: 1 party, 597 boxed | 9f19dfcf6b5157f0469ebd813ce3aae5cbc4284df62197b1e46d1f9a5ba1a081 |
| [invalid_file_signature.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/invalid_file_signature.sav) | 131072 | accepted: 1 party, 597 boxed | 4a472dd4979ee89bbbc067ca493d6a4fe6ffc5e0d738d1a496f1071e56ae9a55 |
| [mismatched_file_signature.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/mismatched_file_signature.sav) | 131072 | accepted: 1 party, 597 boxed | 02949350870c58089afdbd528280d8ba5d02df5003985f04c8e3ad195ee139a0 |
| [mismatched_file_signature_new.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/mismatched_file_signature_new.sav) | 131072 | accepted: 1 party, 597 boxed | 99f264575844d353b8cca24681fe5d60d1dd70025e576728118c115be429b8bb |
| [mismatched_save_index.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/mismatched_save_index.sav) | 131072 | accepted: 1 party, 597 boxed | 56d79d5743da505e7cec78615de70605c145e820e071541c787836385f3eefcc |
| [missingno.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/missingno.sav) | 131072 | accepted: 5 party, 586 boxed | c35a1b87b876e9fa42f007dd1a5e6ccc023a7d1581cda99e4b655a7c80bda437 |
| [missingno_new.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/missingno_new.sav) | 131072 | accepted: 5 party, 586 boxed | 6f3a19d1c9a8046a67a19ebdac1fe49151e015fe38fcbb74da780840382e7f9e |
| [ng+.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/ng+.sav) | 131072 | accepted: 6 party, 24 boxed | 55a724ff827ebc73ee5c10edec9f254e7e80256740a88bc8cb2381b669460707 |
| [ng+_new.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/ng+_new.sav) | 131072 | accepted: 6 party, 80 boxed | 9f46b296352c0431d7c79e9539ee813d8cae04ad11604458ec804947c827da8a |
| [single_save.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/single_save.sav) | 131072 | accepted: 0 party, 0 boxed | d83e23ede3a6e47a27c175ec8e89ebf8186e24cfeaa4f22fe810b2beb2d185bc |
| [single_save_2.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/single_save_2.sav) | 131072 | accepted: 0 party, 0 boxed | 8c04d8bb9c975a40d7c587f4e93c8efbe726ad075480461be9d16b6a23752f81 |
| [single_save_corrupt_save_1.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/single_save_corrupt_save_1.sav) | 131072 | Only Pokemon Unbound 2.1.x non-randomized saves are supported. | 61fba1f9ff3ceb2ec930d18bea92f38ffe0ee5709f3aa6b6a5f314e2ee9a9bac |
| [single_save_corrupt_save_2.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/single_save_corrupt_save_2.sav) | 131072 | Only Pokemon Unbound 2.1.x non-randomized saves are supported. | 86d19b52be46bb4c65105862bd98d8cc11fd13cebdd8640ab49dc0a601ad2d9a |
| [single_save_new.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/single_save_new.sav) | 131072 | accepted: 3 party, 598 boxed | 4c97b9b7104e2f5fc3cfa1e284a360a949bf3869d5c84853fae28c4321fabdaa |
| [single_save_randomizer.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/single_save_randomizer.sav) | 131072 | Randomized Pokemon Unbound 2.1 saves are not supported yet. | c6d1b16926ac5933c6a7ae5a1b4a0459e63d8508715b557a5cd27947e9cda4f5 |
| [single_save_randomizer_new.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/single_save_randomizer_new.sav) | 131072 | Randomized Pokemon Unbound 2.1 saves are not supported yet. | 0460fd42fc9bfa7c16a66df029b69511db3e8e34faaa9d8b3ebde09de1adfddd |
| [test_hoopa_shaymin_preset_box.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/test_hoopa_shaymin_preset_box.sav) | 131072 | accepted: 3 party, 598 boxed | d688bd0ae3541ac251446570afc9363b7442b4c0957a735b784e6801fa057e84 |
| [test_hoopa_shaymin_preset_box_new.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/test_hoopa_shaymin_preset_box_new.sav) | 131072 | accepted: 3 party, 598 boxed | 045cebda7b51a189628ab3ac98213a4dfa72a3f614b598a67580edacab302924 |
| [var_test/difficult_difficulty.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/var_test/difficult_difficulty.sav) | 131072 | accepted: 3 party, 598 boxed | fc314c90b5c42f95411fc2422401b3dd86635d45d56dbb202952d2fdba258e73 |
| [var_test/expert_difficulty.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/var_test/expert_difficulty.sav) | 131072 | accepted: 3 party, 598 boxed | 0528f870c0a282cd8ec9e933fa24e96643b91aaa3d756f041d60136bfbcc5c57 |
| [var_test/expert_sandbox.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/var_test/expert_sandbox.sav) | 131072 | accepted: 6 party, 5 boxed | d7dcbdfb7599d7da1ad178ccb301e91be2cbbef9e764432cc7f1c8cb38ab572d |
| [var_test/expert_sandbox_post_game.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/var_test/expert_sandbox_post_game.sav) | 131072 | accepted: 6 party, 5 boxed | cfc1cebe44efbb1690223a3897ef874707f1c5636898bc6e3a539df7ee6e526f |
| [var_test/insane_difficulty.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/var_test/insane_difficulty.sav) | 131072 | accepted: 3 party, 598 boxed | 1bfb74e2e74e4f8807732a6bb292ea889b5f1101e75e06701be5cb000cc1e8d3 |
| [var_test/insane_main_game.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/var_test/insane_main_game.sav) | 131072 | accepted: 0 party, 0 boxed | de49aa7a7392cb9ef0f9e7c3525ba98cd1d4c201708ad9cfad41861d3f1649a0 |
| [var_test/insane_ng+.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/var_test/insane_ng+.sav) | 131072 | accepted: 0 party, 6 boxed | 23203a0d6432f86eecb4c6c377f397bd83dbf8e52ff8d80f0a2d67c635ec53bf |
| [var_test/vanilla_difficulty.sav](https://github.com/Skeli789/Unbound-Cloud/blob/3d20f323b3f4690504f638fc8a6d491067f69194/server/pytests/data/saves/var_test/vanilla_difficulty.sav) | 131072 | accepted: 3 party, 598 boxed | d4e522e9ff89b28ccd1e91a2d912d605dd9ae0b1485bc1ebf9223c4788f62120 |

Repository releases API returned an empty list; all 20 issue/PR records were searched for saves/attachments (no additional downloadable save beyond checked-in fixtures). hzla has no binary Unbound fixture of its own, but calc/test/unbound-savereader.test.js explicitly loads the Cloud fixture directory. Web searches included `Pokemon Unbound 2.1 save github`, `Pokemon Unbound 2.1 save file download`, and the official Cloud repo/tests; unverifiable Drive/player posts were not promoted over the author's fixtures. No Discord-private files were accessible or claimed searched.
