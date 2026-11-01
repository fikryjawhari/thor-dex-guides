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

### Items

`items.py` (unit 5). Sources: `data.js` areas (what lies where: `item-standard` / `item-hidden` by cap step, `item-shop`
stock, `item-cheat` = the care packages, `tutors`), the author's item sheet (`drive/Item, TM, and Move Tutor Locations
v4.1`: Overworld Items is the master list with the place text, gifts and rewards; TMs & HMs, Mega Stones and Z-Crystals
tabs cross-check it; Shops gives prices; Care Packages; Move Tutors), the Hardcore Main tab. IT is written in the old
boxes and `extractlib.finalise` files it in the Items standard; `itemstd.RULES['radical-red']` = a card per tutor
(`keep_sub`) and game order once the walkthrough exists.

- **Pairing**: each Overworld row is paired with a data.js entry of the same item in the areas its heading covers
  (`HEADING_AREAS`; hidden first when the sheet says hidden). No pairing across headings: data.js files the follower
  finds (Safety Goggles, Red Card, Protective Pads, Eject Button, plus a Big Nugget and a Wishing Piece) under Viridian
  City's Poké Center, so a wider search pairs wrong pickups. 442 sheet rows; 11 have no data.js entry and stay (gifts
  data.js doesn't list: Time Changer, Poké Vial, DexNav, Infinite Repel, the PC Potion, follower finds, Waterium Z).
  25 data.js pickups the Overworld tab lacks get a line from data.js (area name, `hidden`, `post-game` at the post-game
  step) with the TM / Mega Stone / Z-Crystal tab's text where it has one: Berry Forest's hidden berries, Pokémon Tower
  7F-9F Soothe Bells, Gouging Fire's room Iron / Rare Candy, Cape Brink PP Max, One Island's Z-Power Ring / Meteorite /
  Fightinium Z, Magearna's chamber Gracidea, Kyogre's chamber Water Stone, the Saffron Gym Cameruptite. 8 more are
  the second branch of one gift (Cinnabar Lab's Soul Dew / Reveal Glass / Prison Bottle / Lati stones, a second TM032)
  or a key item data.js files elsewhere (Tri-Pass at One Island; the sheet: the Route 16 girl), absorbed.
- **Lines**: `Found:` / `Also:` + the sheet's heading (`Route 4 (East)`, `Mt. Moon`) + `requires X` (the sheet's "(Surf
  HM required)", "Requires Mega Ring -", "(Z-Ring required)", "(Keycard required)" -> Card Key) + `post-game` + `hidden`
  + `xN` + the sheet's text. "left from the entrance" becomes "left of" (the shared relabeller reads "from <person>" as
  a gift). Consumables and sell items are not listed (Unbound's rule: medicine, balls, X items, nuggets, pearls...);
  Valuables are Shards, Heart Scales and Beast Balls. Key Items leave out Town Map, Pokédex, Teachy TV and the Silph
  Scope costume. Fossils: Helix / Dome "(can only pick one)".
- **Hardcore** (D1): rows tagged "(DEFAULT MODE(S) ONLY)" / "(REGULAR MODE)" go (Psyshock on the Underground Path,
  Trick Room from Sabrina, Light Clay, Booster Energy in Cerulean Cave, the Power Plant Eject Button); "(HARDCORE)"
  rows stay. Main E36: Weakness Policy, Throat Spray, Air Balloon, Light Clay and the four weather rocks are gone
  everywhere (pickups, shops, care packages, `P.hi`: 17 wild species). TM sheet: TM012 Taunt, TM017 Protect (Game
  Corner) and TM116 Trick Room are unavailable; TM104 Psyshock is Sabrina's. Main E24 / E26 swaps: Charizardite Y on
  Route 16, X from Blaine, Gardevoirite in the Mansion, Cameruptite from Sabrina (data.js lists both of each pair;
  `LEFT_DROP` keeps the Hardcore one). Quest rows take the sheet's MGM / Hardcore wording (125+ base stat, a shiny
  for Sabrina; Main E81). Route 4's right Black Belt gives 4 PP Ups instead of the Macho Brace. Lucky Egg is not held
  by wild Pelipper (Other Useful Items C12). Electric / Misty / Psychic Seed: a `Wild:` line "only after beating Lt.
  Surge / Sabrina / Koga" (Main E14-E18). Care packages: red (not in Hardcore) and blue (not in MGM + Hardcore;
  Hardcore turns MGM on, Main E95) items left out: 25 of 136, mostly the EV items. Move tutors in red go: the Vermilion
  Fan Club, Pewter Museum, Fuchsia gate / Kangaskhan, Cinnabar R&D Room and Victory Road tutors, and Tailwind / Stealth
  Rock / Spikes / Toxic Spikes at the Testing Room (data.js lists the Testing Room twice: the 8-move list is
  Hardcore's). The report's "Hardcore leaves out" line lists every removal.
- **Shops**: the marts' common stock (the 19 items all 10 data.js marts sell) is one "Any Poké Mart" line at FireRed's
  price (pokefirered `items.json`; the sheet prices only the special shops); the rest per shop with the Shops tab's
  price (Cerulean TMs, Celadon Dept. Store 2F / 4F / 5F / rooftop, Game Corner TMs in ₽, Trainer Fan Club, Cinnabar
  Lab, Two Island, One Island's BP exchange). Two Island's Timer Ball / Lava Cookie take FireRed's price. TM113 Play
  Rough is bought from the Dept. Store 3F clerk (₽15,000). BP Z-Crystals, the Master Ball and the Necromizer are Shop
  lines in their own boxes.
- **Care packages** (`item-cheat`): one `Also: Care package · <when> · xN` line per item, paired with its data.js area
  by item overlap (walk.py gets the area and step). data.js also lists a Rare Candy and a Pomeg Berry at Viridian City
  that no package has: left out (reported).
- **Tutors**: a card per tutor, "<who> (<town>)"; moves with the tutor's place and cost. data.js's Uproar tutor in
  Saffron's Gian's House 2F is on no sheet: its own card. The relearner, deleter and egg move tutor are Useful NPCs.
- **Mega Stones**: P.stone of Mega / Primal forms; `P.sloc` = the stone's line without its label. Red Orb and Adamant
  Orb (Primal Groudon / Dialga) have no place in any source.
- **Cross-check** (report "tabs differ"): the TM, Mega Stone and Z-Crystal tabs name the same places as the lines for
  every item (proper-name words compared); only wording differs (TM034 Teleport: "large grassy patch" vs "south
  eastern corner near the Raid Den", both Route 3). The Z tab and Overworld tab put Waterium Z with Gian in Saffron City;
  data.js files it under Cerulean City's Gym (Saffron kept: both tabs agree, and the Mudkip kid lives there).
- **Item text**: `item_desc.json` is written by `items.py` from data.js (613 items; TMs and unused records left out).
  `changed` = differs from FireRed's text (case, line breaks and accents ignored) or RR changed the effect
  (`RR_EFFECT`): 41. `battle_text.json`: the RR effects from Showdown `gen9rr/items.ts` and the changelogs (Gems 1.5×,
  Bright Powder / Lax Incense / King's Rock no battle effect, the signature items Electirizer, Magmarizer, Up-Grade,
  Burnt Seed, Reaper Cloth, Leek Stick, the Adamant / Eternamax Orb Primal forms). `item_text_extra.json`: DexNav,
  Necromizer, Time Changer (made-up from the changelogs). `item_text.ALIASES`: Houndoomnite -> Houndoominite, Fight
  Memory -> Fighting Memory (icons). No icon: Leek Stick (RR's name for the Leek; the icon set's alias table would need a
  rebuild), the RR / Gen 8-9 key items, Alcremite, Eternamax Orb, Cornerstone Mask, Necrozium Z, Rusty Sword / Shield,
  and every TM / HM (the icon index has no radical-red guide map yet: `tools/item_icons.py` has to be rerun with
  `--fetch` once data.json is merged).
- **For walk.py**: `items.PICKUPS` = one record per Found / Also line `{box, item, line, area, step}` (data.js area index
  and cap step; None for sheet-only rows). Lines are final after the Items standard except the relabeller may swap
  Found / Also: match on item and place, not the label.

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
