# Hardlove Gold build notes

Hardlove Gold 0.8.3, an hg-engine hack of Pokémon HeartGold. Built from the hack's own source code (the authority) and
its sheets. 986 species and forms (596 obtainable, 74 Megas, 316 trainer-only), 782 moves, 284 abilities, 62 tracker
areas (the Starter area is index 61), 329 trainers in 18 boxes, 94 walkthrough stops.

## Build

```bash
uv run python -I hacks/hardlove-gold/extract/build.py                     # raw sources in .src/ -> data.json + extract/report.txt
uv run python -I hacks/hardlove-gold/extract/build.py --published [data.json]   # source-free: finish a published data.json
uv run python -I hacks/hardlove-gold/extract/check.py [baseline.json]
python assemble.py hardlove-gold
```

`--published` loads the committed data.json and re-applies only the finishing steps (Starter area, the shared
finalisers in `tools/extractlib.py`: Items standard, split names). Idempotent. The published data.json is made this
way, because the 0.8.2 raw sources cannot reproduce the 0.8.3 corrections to WK and TR (History); the plain raw run is the
check that the extract scripts still agree with the old pipeline (it differs on seven trainer records and keeps the two
duplicate trainer keys `9.0.2` / `9.0.5`). A complete raw rebuild needs the matching 0.8.3 source and sheets.

Modules: `dex.py` (M MV AB P TC; `dexsite.py` the docs site's pages, `hgsource.py` / `hgengine.py` the hg-engine C
files), `locs.py` (LOC, P.w, the Starter area; `enccheck.py` checks the wild tables against the game), `trainers.py`
(TR), `items.py` (IT), `walk.py` (AR, WK), `xlsx.py` (sheet reader). The steps run in the order the data needs, so the
modules are called several times and share the working state `X` (`common.py`). Fetch the sources with `SOURCES.md`.

## Sources and rules

Sources (numbered as in SOURCES.md's table):

0. **The hack's source**: github.com/kumakuma1/hardlove, branch `beta_hardlove`, pinned at 0.8.2 `8ac661afda` /
   0.8.3 `f1b2363001` (`repos/hardlove/COMMIT`). This is what the ROM is built from, so it wins wherever it has the data:
   `data/Species.c` + `HiddenAbilityTable.c` (types, base stats, abilities and hidden abilities of every species and
   form), `data/learnsets/learnsets.json` (level-up, TM, tutor and egg moves; forms without an entry use their base
   form), `data/Evolutions.c` (methods rewritten to words), `data/Moves.c` + `include/config.h` (type, category, power,
   accuracy, PP, priority; the CHAMPIONS_* changes are on), `data/Trainers.c` (every trainer set: species, level, item,
   ability, nature, moves, IVs, battle type), `data/Encounters.c` + `SafariEncounters.c` (wild tables),
   `data/MachineMoves.c` (TM / HM numbers), `src/field/encounter_check.c` (read online: the hack's slot odds: land 8 x
   10% + 4 x 5%, surf / rod 30 / 30 / 25 / 10 / 5, rock smash 60 / 40; the Good and Super Rod tables are one-species
   placeholders: the hack only gives the Old Rod). Not in the source: map scripts (item balls, NPC gifts, trades,
   marts), so item locations, tutors, gifts and statics come from the sheets; `HiddenItems.c` has vanilla leftovers in
   unused Kanto areas, so it is not used. Findings: the dex site predates 0.8.0 (learnsets) and 0.8.1 (abilities),
   never listed hidden abilities and had 5 wrong Mega / Crowned stat lines; the sheet's "Lycanroc-M" is Midnight; Mt.
   Mortar 1F / 2F have Surf and Fishing swapped in the sheet; HM05 / HM06 are swapped in the items sheet; Hiker Schorsch
   has the wrong trainer id in the sheet (11, game 233).
1. **Docs site** kumakuma1.github.io/hardlove-docs (repo `bb5862f`), `site/pokedex`: 1,364 pages, one per species / form,
   in the index's dex order. Used now only for the species list and order, display names, other forms and sprites
   (160x80 two-frame sheets; the left 80x80 frame, trimmed). Its stats, types, abilities, moves and evolutions are
   replaced by source 0 (the report lists every change). Quirks: Fairy types show "Typing not found" (filled from the
   calc's species data, a few from the previous build); "Wild Locations" are stale and not used; female-only species have
   no sprite (0-byte files), taken from the hack source (`repos/sprites`, `data/graphics/sprites/<id>/female/front.png`).
   Bounsweet has none.
2. **Pokemon Locations sheet** (xlsx), the source of truth for availability. Encounter Tables (location names in merged
   row 1, Level / Pokemon column pairs, col A method, col B rate as a fraction), Safari Zone (same, areas after the
   gate), Random Pools ("Pool, Location" headers; cell notes kept), Game Corner (by badge), Trades, Unavailable Pokemon.
   Cell notes are read: per encounter ("Starter: Litten.", "Requires 7th Badge."), per location (Azalea headbutt trees,
   Safari layout) and the roamer note. Name suffixes -A / -G / -H / -P regional, -T Therian, -D Defense. The player's
   starter choice (Turtwig, Litten, Froakie) is in no tab: added from Mechanics.txt as "Starter choice" at New Bark Town.
3. **Trainer Battles sheet** (xlsx): split tabs in order (Falkner Split ... Clair Split, Victory Road, Elite Four, Mini
   Bosses). Block per trainer: "Name - <id>" row, Pokemon row, species row, Level, Ability, Held Item, Nature, 4 Moves
   rows. Section header rows ("Falkner Split [Level Cap 16], Ruins of Alph") give the split, cap and place. Brackets in
   names become tags ([Optional], [Double], [Back2Back]...); [Starter X] becomes the trainer's starter filter. Cell notes
   (column I) on a name row go to that trainer, on a section row to the section, otherwise to the trainer whose block
   holds the row. "-M" is Mega only when the item is the matching stone; "-M-X/Y/Z" Mega X / Y / Z;
   Floette-Eternal-M is Mega Floette. "X-2" levels (Mini Bosses) are relative to the level cap (r:-2). The hidden
   "Example - Vanilla" tab and the "Pokemon", "Trainers" and "import" tabs are not used. The sheet gives order, places,
   tags and notes; the sets come from the game (source 0), paired by the "Name - <id>" trainer id and species.
4. **Move Changes sheet**: changed moves only ("20 > 40") plus the effect side table, kept as notes; the numbers come
   from the game. Notes say where the sheet disagrees with the game and which game changes the sheet doesn't list.
5. **Item Location sheet**: Held Items (+ Berries side table), Heart Scales, Rare Candies, HM / TMs and Move Tutors
   (TMs, tutor side table, HMs after the "HM" row), Evolution Items, Mega Stones ("Unavailable." when not obtainable),
   Other.
6. **Hardlove calc** github.com/kumakuma1/hardlovecalc `backups/hardlove.js` (Jan 2026): no longer used for sets (the
   game's Trainers.c replaced it); only a fallback for missing types.
7. **pokemon-showdown** 0.11.11: move and ability descriptions, dex numbers, the Z-A Mega list (their data comes from
   source 0), and the Gen 9 baseline the move notes compare against.
8. **Mechanics.txt** (level caps, starter choice table, removed EVs and other rules), **Hardlove Gold AI document_WIP.txt**
   and **Post-KO Switch-in AI.xlsx**: shown as "Game docs" in the Walkthrough tab. Move Performance.txt (generic move
   order notes from a wiki) is not used.

Data rules:

- **Availability**. P.g: 0 obtainable, 1 Mega (P.nu = stone unavailable, kept only because a trainer uses it), 3 trainer
  only. Obtainable = everything found + evolution family both ways, minus the Unavailable tab (Chimecho, Forretress, Great
  Tusk and Iron Bundle are in both a table and the Unavailable tab; kept as obtainable). Megas: Other Forms of
  obtainable species; stone matched by name (X / Y / Z suffix must agree); dropped when the stone is unavailable and no
  trainer uses them (Mega Latias). Megas sit right after their base form.
- **Locations**: order = Encounter Tables column order, Safari areas after the gate, Blackthorn City after Ice Path.
  Areas merge sub-locations (`areaOf` in walk.py); the area list is unchanged from the first build, so tracker slots
  carry over. The Starter area (AR 61, LOC 95) is appended last; only the three Turtwig / Litten / Froakie `Starter
  choice` encounters sit there. `ARO` (Locations order) puts it first on the Locations page, above New Bark Town. Wild tables are checked against the game slot by slot (85 locations, 11 with differences;
  the game wins and replaces Route 46, Violet City, Route 5, Mt. Mortar 1F (Entrance) and 2F, Lake of Rage, Whirl Islands
  1F and B2F, Mt. Silver (Snowy Area); Ice Path 1F and Mt. Silver (Moltres Room) match no game table: statics / gifts).
- **Walkthrough**: no written walkthrough exists. Stops come from the trainer sheet's sections in order, split by level
  cap header; each area is anchored to its first stop when that keeps the order monotonic, else becomes an "on the way"
  stop. Items are filed by the earliest area name in their location text (`ALIASW` in walk.py). The New Bark Town stop
  includes Starter before its original area.
- **Level caps**: TR.caps from Mechanics.txt; a trainer's cap is its split header's cap. Boxes are the sheet's mini-splits;
  both tabs end `Victory Road Split [Cap 81]`, `Elite Four Split [Cap 81]`, then Mini Bosses.
- **Trainers**: the game set wins; where the sheet differs the card says "Sheet says ..." (70 sets differ, 6 game Pokémon
  are missing from the sheet: Nuzlocker Ethan's random team). Sheet typos are fixed ("Msytic Water", "Scope Lense",
  "Letfovers", Mega stone names; Sailor Garrett's rows shifted). The 0.8.3 Trainers.c changes are in the data (History).
  The sheet lists Will [Double] (702) and Koga [Double] (703) twice; the game has one of each, so the duplicates `9.0.2`
  (Mr. Mime row; confirmed in game: Slowbro) and `9.0.5` (same team as `9.0.4`, but Thundurus "Covert Cloak") are removed
  (the raw 0.8.2 run keeps them).
- **Moves**: 188 changes in the sheet, 183 on moves in the data; 45 changed in the game but not in the sheet; the sheet
  disagrees with the game on Dragon Tail ac, Screech pp, Reflect ac, Double Slap ac, Pain Split bp, Snarl pp; Collision
  Course is not in the game data. TM / HM numbers come from the game (the items sheet's HM05 Rock Smash is HM06 in the
  game, HM06 Whirlpool is HM05; about 25 TM names fixed).
- **Dex changes from the dex site** by source 0 (first build): hidden abilities 647, level-up moves 311, TM 157, tutor 70,
  egg 59, abilities 28, stats 5, evolutions 2 (growlithe, koffing).
- **Stats**: EVs are 0 everywhere (the hack removes them). TC is the standard Gen 9 chart (Mechanics: assume Gen 9).
  Evolution methods the text can't describe (SPIN_* variants) show as unknown.
- **Items**: rules in `itemstd.RULES['hardlove-gold']`, the `Other` box mapped in `HG_OTHER` (History → Items standard).

## Local storage (prefix hg)

`hgdex4` list filters, `hgcalc:<id>` + `hgcalc:lastlv` stat calc, `hgtrack` tracker {s starter, e {areaIdx: {p: id} or
{f: 1}}, t {"area|For X": id}}, `hgwalk2` walkthrough open state (EI's shape), `hgcap2` level cap per trainer (+ _last),
`hgtr` open trainer groups, `hgrecent` search picks, `hgpos` last route and anchor, `hgmgm`, `hgloc`, `hgitems`. `dvkb` =
"1" forces viewer mode (shared test switch). Keep them once published. The template seeds the Starter slot from a saved
`hgtrack.s`, independent of area 0's New Bark Town encounter.

## Hack-only data

Beyond the shared schema (hacks/emerald-imperium/notes.md → Data schema): P.nu (Megas that cannot be used), P.tu tutors,
P.stone / P.sloc; MV.h = Hardlove change notes, no MV.e / dc; AB has no original flags; WK.docs (game docs) and WK.ko
(post-KO switch-in AI) instead of cheat codes; no checklist steps; TR trainers carry no `id` / `pp` / `c`; mons carry
`a0`, `hp`, `cf` (what the sheet says instead), `ev` is [0 x6]. UI parts: Tutor move tab, starter selector in the tracker
bar (filters rival teams, trades, starter-only items), trade slots in the tracker, no EV row in the stat calculator, a
"Level cap" box for cap-relative teams, availability filter "Trainer only" instead of "Changed from vanilla". No
Minimal Grinding Mode, Hot House, changes doc or conflict cards.

## Checks

`check.py` [baseline.json]: reference integrity (species, trainer teams, area rows), the Starter area, Trainers / Walkthrough
box names and trainer references, unique stop keys, no checklist steps, the Items box set and row sub-headings; given an
earlier data.json, that species order, move / ability tables, area names, trainer keys and stop keys are kept. Then
`python assemble.py hardlove-gold`, `tools/domcompare.mjs` against the previous build, and the viewer-size checks
(CLAUDE.md). Known from the build report: sprites missing or borrowed: bounsweet, mega_golisopod (base sprite).

## History

- **2026-10-24, Charcoal reads `Also:`.** The Azalea Cutters' Charcoal (after Bugsy and getting Cut) was a `Found:` line, so
  it looked like it lay on the ground; it is a reward. `itemstd.RULES['hardlove-gold']['also']` relabels it (Items and the
  walkthrough stop); `_ALSO` also knows "after <Leader> and getting/beating".

- **2026-10-24, Starter box first.** `locs.starter` writes `ARO`: the Starter area first on the Locations page, like the
  other guides (area indices unchanged). The Morty box lists its places in walkthrough order (Route 37, Ecruteak City
  Theater, Burned Tower, Route 38, Gym; shared finaliser `trainers_follow_walk`). Template, same day: a Trainers place's
  button shows its box's cap, `n/N | cap`.
- **2026-10-23, Items standard.** `tools/itemstd.py` (shared, idempotent; run by `finalise()`) puts Items in the shared
  box set (rules: `itemstd.RULES['hardlove-gold']`, the `Other` box mapped in `HG_OTHER`). Held Items classes renamed (Type
  boosting -> Type boosters, Battle -> Battle gear, Consumable -> One-use items); the four evolution items (Metal Coat,
  King's Rock, Razor Claw, Razor Fang) stay in Evolution Items only; `Other` split: 8 Key Items, 6 Valuables (Master
  Ball, Big Nugget, Rage Candy Bar, Escape Rope), 3 Useful NPCs (texts hand-written in `HG_OTHER`). TMs + HMs one box in
  game order. Prose places became Found / Also / Shop lines (`Sold at` = Shop; given by / gift / from the X / reward =
  Also; else Found); `Starter:` and `Possible to miss permanently` stay last.
- **2026-10-23, Part B (consistency pass).** The Starter area is appended as area 61 and location 95, never inserted
  before existing entries; New Bark Town keeps every other encounter. Published species IDs and order, all 61 original
  area indices and 95 location indices, trainer keys and teams, cap lists, item data, walkthrough split / stop indices and
  checklist contents are unchanged; the existing pruning of unobtainable / unused species is untouched. Walkthrough split
  labels use `[Cap N]` through `tools/splits.py`. All `hack.json` storage keys unchanged; failed / cleared New Bark
  encounters are not mistaken for the starter, and the named starter picker writes only the new slot. Checked: the
  finaliser reproduces the data byte for byte from its parent commit and is idempotent; 986 species, 329 trainer keys, 18
  splits / 94 stops preserved; full DOM sweeps of 2,481 routes per mode with no page errors; consistency check (five
  viewer sizes, light theme), `pagecheck` / `walkcheck` at 260x316; browser migration tests with caught / failed /
  unchosen baseline state.
- **2026-10-19, 0.8.3 patch.** `8ac661afda..f1b2363001` changes only `data/Trainers.c` among the source files, so these
  sets were patched into the data (not a full rebuild; the sheet, updated the same day, matches them and their old "sheet
  says" notes were dropped): Elite Four Lance Aerodactyl Psychic Fangs > Crunch; Karen Gholdengo Nasty Plot > Night
  Shade; Red Greninja-Ash Hydro Pump, Dark Pulse, Grass Knot > Liquidation, Night Slash, Low Kick; Will (702)
  Farigiraf Energy Ball > Dazzling Gleam, Solgaleo Rock Slide > Close Combat; Koga (703) Landorus-T Lv 82 > 81,
  Dragalge removed, Darkrai to slot 5, Weavile (Lv 82 Jolly Ice Gem Inner Focus; Icicle Crash, Knock Off, Fake Out,
  Protect) in slot 6.
- **2026-10-19, sheet recheck.** Trainer Battles re-downloaded: it now matches Bug Catcher Josh's Charjabug and Hiker
  Michael's Medicham (notes dropped); the other ~60 differences remain and the game sets stay (Trainers.c is what the ROM
  uses; a calc import of the 0.8.3 ROM confirms Will's Slowbro has Psychic, not the sheet's Future Sight). The builder
  and these notes moved out of the guide's top comment into `extract/` and this file.
- **2026-10-18, first build** for 0.8.2 (claude.ai), replacing the dex-site based guide: species data from the hack
  source, Locations sheet checked against `Encounters.c`, trainer sets from `Trainers.c`, Starter choice added (the
  earlier build missed it, so Froakie, Greninja and Mega Greninja showed as trainer-only).
