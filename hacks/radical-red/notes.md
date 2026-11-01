# Pokémon Radical Red build notes

Scaffold only, based on `unbound`. Feature switches need review.

## Build

`uv run python -I hacks/radical-red/extract/build.py`

TODO: implement extract modules; audit inherited cfg switches and cfg.txt wording.

## Sources and rules

The official 4.1 dex's pinned `data.js` is the numerical authority (SOURCES.md). Its object literal is tokenised,
converted to JSON, and cached in memory only: no JavaScript evaluation or writes to the shared source junction.

### Dex

`common.py` exports `DATA`, `SPECIES`, `SPECIES_IDS`, `SPECIES_NAMES`, `FORM_KEYS`, `CAPS`, `sid`, `move`, `ability`,
`item`, `type_name`, `area`, `cap_step`, and `cap`. IDs are lowercase underscore slugs of the official dex keys,
not National Dex numbers. `sid(int)` means the game's data.js ID. Names accept sheet/Showdown ordering, regional
prefixes and suffixes, and punctuation-insensitive CFRU short move/ability names. Unknown lookups return None.
Ability pairs `[ID, variant]` preserve aliases sharing one game ID; a bare ability ID selects variant zero.
Species ability slots are **hidden, primary, secondary**, not the other way round. Source stats are HP/Atk/Def/Spe/SpA/SpD.
Area keys are progression steps, not levels; `cap(step)` returns `cap[1]` (Hardcore), normal is `cap[0]`.
Cosmetic species IDs are kept distinct for now, including the source's otherwise indistinguishably named records;
Pumpkaboo/Gourgeist order 0/1/2/3 means Average/Small/Large/Super. The base lookup always selects Average.
The 827 named ordinary moves exclude Placeholder and generated Z/Max records (IDs >=848); no learnset uses those.
Do not index M/AB until dex.build has run: their final lists are sorted by name, independently of game IDs.

Dex cross-check: all 1,343 official species records match all 1,343 RomHackDex pages, one-to-one (including
its numeric cosmetic suffixes). 1,026 distinct National Dex numbers include Chillet (#2001); 68 Mega/Primal forms.
827 ordinary game move IDs become 826 names after CFRU spelling normalisation; 176 generated/placeholder IDs
are excluded. AB has 281 names, expanded from 255 game IDs and their name variants; descriptions are the game's
actual text, not the mirror's incorrectly paired text. Species differences against RomHackDex: stats 285,
types 39, regular abilities 981, hidden ability 987, TM/HM sets 80, tutor sets 77; level-up and egg sets agree.
The complete per-species differences are in report.txt; official data wins. The mirror has old stats/types and
frequently swapped hidden slots, so these are intentionally not presented as a dispute with the game itself.
Every one of the 826 moves is mirrored. Differences are Struggle's type (official type 9 is typeless, shown as ???,
mirror Normal) and Leech Life's PP (canonical game ID 141 has 15 PP, mirror/unused Leech Fang ID 355 has 10).
The two Leech Life IDs resolve to one name, retaining the canonical, actually learned ID's numbers; never take
the last duplicate's record just because it appears last. The 18-type chart agrees in every cell. The v4.0/v4.1 changelogs make no
type-chart change; this is the standard modern chart, not an assumed Ice/Bug buff.
Learnsets resolve every referenced move strictly. TM slots 0-119 are TM01-120, slots 120-126 HM01-07; zero-valued
TM/tutor placeholders are ignored. Evolutions explicitly decode every source method; 254 denotes Mega/form
change, never ordinary evolution. Items and Mega stones are decoded from those records, including Primal orbs;
Mega Rayquaza uses Dragon Ascent and has no fictitious stone. Wild held slots default to 50/5, equal nonzero
slots to 100%; 416 species have held items. Historical changelog statements name common/rare slots and agree
with the FRLG odds. `dex.egg_groups` exposes the 16 breeding groups; the existing P schema reserves `eg` for egg
moves and has no breeding-group field. The 667 source species `changes` records are retained in common.DATA and
logged, not injected as an unsupported P field or the prohibited changes-from-vanilla card. Move/ability changed
markers use the existing MV/AB schema. No template change is made.

The scaffold's cfg.calc=false exposed a shared item_text.generation crash. The minimal fix accepts false and
registers Radical Red as generation 9 for item text (the Gen 9 additions), without enabling the calc or touching cfg.

Unit 1 shared-helper check: baseline 3400658 captured; `gate.py check unbound --data` passes 6/6, data identical
except build date and report byte-identical (16.1 s). `build.py` runs with the other units' expected stubs.
`python assemble.py radical-red` currently stops at the scaffold's ten cfg.txt TODO strings; replacing those is
outside this unit's hack.json ownership (sk only). No placeholder guard is disabled and no wording is borrowed.

Move metadata: 825 moves from RR Showdown's gen9rr overlay on its base moves, with RR calc MOVES[9] overriding
damage flags/targets. The one remaining move, Metal Bash, gets contact/normal-target metadata from its in-game
full-body-charge description (no guessed secondary effect or Protect flag). `move_metadata.json` is committed;
`moves.py --refresh` recreates it using the pinned TypeScript, without touching data.js or .src. Every build uses
the snapshot without Node. Inferno Parade is normalised to the docs'/Showdown's Infernal Parade, retaining the old
spelling as an alias. The 113 Showdown/official numerical and secondary-chance disagreements are in report.txt;
official numbers win, including Barb Barrage 50%, Dragon Rush 30%, Freezing Glare 30%, Diamond Storm 50%.
The source's freeze status is labelled frostbite in structured effects (v4.0 changelog: PLA frostbite replaced
freeze, even though the game still calls it freeze). Tri Attack/Dire Claw alternatives, first-turn Fake Out,
conditional Burning Jealousy, weather recovery, Secret Power terrain effects, Struggle's max-HP recoil, and
ally-only Pollen Puff healing are explicit, not unconditional effects guessed from callbacks. 253 moves have
changed markers relative to Showdown base and RR effect text; 48 abilities have RR Showdown change text, with
the official in-game description retained. Damage/calculator behaviour remains the calc unit's responsibility.

Ability IDs 73 and 77 both say As One in-game, but have distinct descriptions: Spectrier (Unnerve + Grim Neigh)
and Glastrier (Unnerve + Moxie) respectively. They remain distinct AB names, as `As One (Spectrier)` and
`As One (Glastrier)`, so neither the description nor save lookup is overwritten. Bare `ability('As One')` returns
None because it is ambiguous; numeric IDs and explicit names resolve. Normalise Neutralize Gas to Neutralizing
Gas and hzla's Pheonix Down typo to Phoenix Down. Canonical ability names as well as raw short names resolve.
Against hzla's Hardcore backup: 879/879 species names and 196/196 item names resolve; all 669 real move names
resolve (the remaining `(No Move)` is a sentinel). Four of 258 ability names do not exist in the official dex's
ability table: Forewarn, Guard Dog, Pickpocket, Snow Cloak. They are not fabricated or silently mapped to another
ability; trainer/save units should take the official numeric data and report a stale hzla ability as a conflict.

Sprites: 1,298 species use the shared set, 44 use the official dex's sprites exported by `dex.write_sprites()`.
The RGBA source PNGs are losslessly re-encoded as palette PNGs (all 64x64) so the stdlib assembly cropper can
read them. Pixel identity and square-crop round trips are checked for all 44. Supplements include RR's Megas,
Seviian forms, Surfing/Flying Pikachu, Primal Dialga and the two Hippopotas/Hippowdon female sprites missing from
the shared set. `sk` only was edited: remove stale Unbound IDs, set the actual Calyrex IDs, and distinguish Minior
cores from Meteor. The source's Minior order is red/blue/orange/yellow/indigo/green/violet (checked from the actual
sprite palettes), not the usual assumed colour order; stable numeric P IDs are preserved with descriptive names.
Arceus/Silvally Ice are not Ice Riders; Unown F/M are letters, not genders. The one unavailable sprite is Chillet:
data.js has the species but no sprite entry, and the shared set has no fakemon art. It intentionally keeps the
template's letter fallback; no placeholder image is substituted or invented. Twenty late species have no
data.js sprite, but the shared set covers the other nineteen.

D8 pruning waits until **both** locations and trainer groups exist. Once integrated, locations must mark the
availability `g` values: g=0 obtainable (including evolution/breeding closure), g=3 unavailable/trainer-only;
g=1 is Mega/Primal. Prune keeps g=0, trainer-used IDs and Megas of obtainable parents. It uses actual source
transformation parents so normal Centiskorch cannot make an unobtainable Seviian Mega obtainable. Dead
evolution/form links and Mega item/walkthrough links are removed. Incomplete-location/trainer no-op paths,
trainer-only preservation, regional Mega parentage and link cleanup are exercised with synthetic fixtures.

Final unit checks (2026-11-02): build.py passes and repeated builds reproduce the committed data/report; remaining
locs/trainers/items/walk/gid stubs report not built yet. Parser escape/key/comment tests and executable-input
rejection pass. Every one of the 1,343 species is checked against source stats, regular/hidden ability slots and
resolved learnset/evolution/form links. Lookup, cap, area, Mega-item, source-effect odds and type-chart assertions
pass. All 44 exported sprites are pixel-identical to the source and accepted by pngpal.crop; source/shared
coverage is 1,342/1,343, with only Chillet absent. `git diff --check` passes. Logs are local `.tmp/rr-dex/`.
Assembly remains blocked solely by the scaffold cfg.txt TODO strings, outside unit 1 ownership. Therefore no
dist render or browser check is claimed. The integration/wording unit must fill those ten strings, then run
`python assemble.py radical-red`. No full gate, scenario sweep or domcompare was run.

Next units: import common directly; its tables/lookups are ready before dex.build. Read raw records through
`DATA`, not through a second parser, and never write caches under H.src/H.cache. Call `dex.build` before using M/AB
indices; canonical `MOVE_RECORDS` chooses the learned Leech Life record. Source IDs are not National Dex numbers.
Pass ability pairs intact; choosing the first name of an ID loses aliases such as Shell Armor and Shadow Shield.
For save IDs use `sid`, `move`, `ability`, `item`, then index the final sorted M/AB; skip zero/placeholders and flag
unknown IDs. Item IDs map through the same stone-spelling corrections as P.stone, preserving item links. Location
progression keys use `cap_step`/`cap`, and trainers must use Hardcore `cap[1]`, not normal `cap[0]`. Obtainability
and evolution/breeding closure must be assigned before D8 pruning is enabled by the locations/trainers merge.

### Locations

Source: data.js `areas` (221, game order; index = LOC index). Built by `extract/locs.py` (step 1 of unit 4).

- LOC: one sublocation per data.js area. AR: one tracker slot per place, the area name without its floor / room
  suffix (Mt. Moon 1F / B1F / B2F = Mt. Moon): 153 places, 67 with no encounters (`ns`, no slot), then the
  Mystery Gift place (below).
- Encounter keys: wild-day / wild-night (grass, 12 FRLG slots 20/20/10/10/10/10/5/5/4/4/1/1), wild-surf and
  wild-smash (60/30/5/4/1), rods (old 70/30, good 60/20/20, super 40/40/15/4/1), raids 1-6 (12 drop items in
  the row note, each with its slot's chance 100/80/80/50/50/30/30/25/25/5/4/1%, the Raid Dens tab's fixed slot
  rates; an item in two slots "Big Nugget 80/80%"), fixed-overworld (Static), fixed-gift (Gift; more than one entry = "Gift (pick one)", "1 of N"),
  fixed-trade (Trade), fixed-roaming (Roaming, "1 of N"). Trainers and item keys are other units'.
- Cap step: each key's step is shown as its Hardcore level cap ("cap 22") in the group label and row notes.
- P.g: 0 = found in a location, or the first same-dex base form found, or evolved from an obtainable species
  (Unbound's rule), or the pre-evolution of one (breeding: Pichu, Cleffa, Igglybuff, Azurill), or a form in
  `sheet_locs.json` → follow whose base is (Greninja-Ash by Ability Pill, Cherrim-Sunshine, Unfezant-F); 3 = not
  found or on the sheet's Unobtainables tab; Megas keep 1 (prune.py decides them). Counts: 1,235 obtainable, 40 not
  (Arceus, Eternatus, Magearna-Original and their / Dialga / Palkia's forms: the sheet's "1023/1025"; check.py fails
  on any other species not found), 68 Megas. Step 1 (data.js only) had 1,192 / 83.

Sheet additions (`extract/sheet_locs.json`, hand-copied from "Pokémon Locations & Raid Dens v4.1"; data.js stays the
encounter source, the sheet fills what it lacks):
- Oak's Lab's 27-entry gift list is the Starter choice (method `Starter choice`, "1 of 27", its AR has `st`), the
  starter picker's list (`cfg.starter = "pick"`). Not on the sheet.
- Mystery Gift: the 19 Lv 85 legendaries of the Mystery Gifts tab (Ho-Oh ... Groudon, with the sheet's held item /
  Gift Move notes; codes left out: "Code at a Pokémon Center Nurse after the Hall of Fame"). LOC 221 and an AR place
  appended after the data.js areas, `ns` (no tracker slot), no cap in the label.
- Gift levels and how-to from the Gifts tab on data.js's gift rows (Finizen 5 ... Mew 100); One Island Poké Center
  Cosmog (Battle Simulator, 50 BP) added. Enamorus (Statics tab: Lv 100, roams Kanto after an 8-win streak, 6 in
  Hardcore Simulator mode, at the One Island Battle Simulator) added as a Roaming row on Viridian City, where
  data.js puts its 10 roamers, at the postgame step. Lapras is Lv 25 at Silph 7F (data.js cap 56), Kubfu 30.
- Vermilion Fan Club: data.js's 10-entry gift list is the Hiker's shard trade (method `Shard trade`, the shard
  colour in the note, no "1 of N": each shard buys the one you pick); the Mt. Moon Helix / Dome Fossil pair added as
  `Fossil (pick one)` (revived in the same building). Aerodactyl stays a Fan Club gift (data.js, cap 36) noted "Old
  Amber from Pewter Museum, revived here": the sheet's "Pewter Museum" column is where the fossil is found.
- Celadon Mansion 1F: data.js's 42-entry list is the shard eggs (method `Shard egg`): each shard gives a random egg of
  its colour, "1 of 9" (Green / Blue / Red starters) or "1 of 8" (Yellow: 7 Pikachu forms + one "Any Cap" slot shared
  by the 7 cap Pikachu). Pikachu-Cosplay is in data.js but not on the sheet ("Doc doesn't list it").
- Trades: each row says what the NPC wants ("for a Snom"). Route 2's reward is "?" on the sheet; data.js: Chillet.
- Water tables data.js has none for, from the Fishing & Surfing tab, rows "Doc only": Fuchsia City (all 3 rods, Surf),
  S.S. Anne Port (Super Rod, Surf: Tentacool / Tentacruel / Barraskewda). Cap step = the step data.js gives the same
  table kind at the same levels. Not added: Route 11 Surf (Tentacool Lv 5-40, FRLG's unedited table).
- Eggs (Wonder Egg Pokémon Pools v4.1 workbook, copied into `sheet_locs.json` → eggs): the egg NPC in Pewter,
  Cerulean and Vermilion City (5,000$) sells a Wonder Egg (Pewter's pool 256, Cerulean / Vermilion's 339) or a
  Paldea Egg (42); the Aide in the Celadon (after the 4th badge) and Fuchsia Pokémon Centers gives a Sevii Egg (12,
  the two never the same). Methods `Wonder Egg` / `Paldea Egg` / `Sevii Egg`, "1 of N" (random), on the city's area
  at its badge step (Pewter 0, Cerulean 1, Vermilion 2, Celadon / Fuchsia 4): 1,084 rows. They make 12 more species
  obtainable; the rest of the pools are found in the wild too. Sheet colour names mapped to the dex's
  (Squawkabilly-Green, Tatsugiri-Red, Tauros-Paldea-Fire / -Water).
- Unobtainables tab: Arceus, Dialga-Origin, Eternatus, Magearna-Original, Palkia-Origin forced to g 3 (Magearna-Original
  was g 0 through its base, Dialga / Palkia-Origin would be through the Mystery Gifts).

Sheet vs data.js (name-matched, `.tmp` compare; data.js kept):
- Grass & Caves: 121 of 125 bands match. The sheet's Seafoam floors are one floor up (its 1F / B1F / B2F / B3F = data.js
  B1F / B2F / B3F / B4F, all matching); its extra "Seafoam B4F" band has no data.js table. "Three Island" = Three Isle
  Port. Rock Tunnel 1F: sheet Minior (Red Core), data.js Minior (Meteor) (the same wild Minior). Pokémon Tower 8F at
  night: sheet Gengar, data.js Sinistcha / Ursaluna-Bloodmoon (as by day): row notes "Doc says Gengar at night".
- Fishing & Surfing: every band data.js has matches (sheet "Seafoam B2F" = data.js B3F, "B3F-B4F" = B4F); the gaps
  are the doc-only tables above.
- Safari Zone: all 30 bands match. Game Corner: the 15 match. Trades: the 9 match. Fossils: the 10 match.
- Statics: the raid-den legendaries are data.js Raid rows; Keldeo (Seafoam B2F) and Marshadow (Pokémon Tower 9F) are
  data.js statics the sheet doesn't list.
- Raid Dens: the 45 dens' 167 species all match. Stars: Route 2, 8, 9, 10, 12, 16, Rock Tunnel and Diglett's Cave
  dens are ★★ on the sheet, data.js `raid1` (kept); the Loyal Three den is the sheet's "Safari Zone Far-Western Area"
  ★★★★, data.js Moltres' Den `raid3` (kept). Drops: the 12 per species match as sets except Rock Tunnel B1F ★★★★★
  Iron Leaves / Iron Crown (sheet Star Piece, data.js Nugget; kept); the sheet's "Ability Capsule" = Ability Pill.

## Local storage

Prefix `rr`. Keep these keys once published.

- `dex`: `rrdex`
- `calc`: `rrcalc`
- `track`: `rrtrack`
- `walk`: `rrwalk`
- `cap`: `rrcap`
- `tr`: `rrtr`
- `recent`: `rrrecent`
- `pos`: `rrpos`
- `mgm`: `rrmgm`
- `loc`: `rrloc`
- `items`: `rritems`
- `dmg`: `rrdmg`

## Hack-only data

TODO: document hack-only data.

## Checks

`uv run python -I tools/gate.py check radical-red`

TODO: replace extract/check.py and calc stubs with source-backed assertions. Calc remains disabled.
Before enabling it, replace the null in tools/scenarios/calc-doubles.mjs EXPECTED with an audited count and add
tools/trainer_fields_check.py DOUBLES_EXPECTED (DOUBLES_PARTNER_ONLY if needed). The engine stub is registered
in tools/calc/package.json; review tools/calc/test.mjs field-profile fixtures. Never copy another hack's counts.
Review tools/itemstd.py RULES only for source-backed quirks; shared defaults need no entry.
Fill sources/watch.json, version/mode, GID/save reader and sprite additions by hand.

## History

TODO: document history.
