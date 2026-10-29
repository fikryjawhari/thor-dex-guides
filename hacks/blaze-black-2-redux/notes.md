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

## Hack-only data

TODO: document hack-only data.

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
