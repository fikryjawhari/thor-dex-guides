# Eternal X build notes

Eternal X 2.67 (Buffel Saft), **Rebalanced** version, a 3DS hack of Pokémon X. 782 Pokémon and forms (29 Megas, 23 form
changes), 617 moves (38 changed), 39 areas, 680 trainer cards, 7 item boxes, 21 walkthrough splits with 74 stop
fragments (retaining 69 original stop keys).

## Build

```bash
uv run python -I hacks/eternal-x/extract/build.py        # .src/ -> data.json + extract/report.txt (every guess and conflict)
uv run python -I hacks/eternal-x/extract/check.py [baseline.json]
python assemble.py eternal-x
```

Modules: `dex.py` (M MV AB P TC), `locs.py` (LOC AR P.w), `trainers.py` (TR), `items.py` (IT), `walk.py` (WK), then
`items.order` (game order, needs WK), `prune.py` (species kept) and `finalise()` in `tools/extractlib.py` (Items
standard, prune, shared split names). `build.py` first makes `.src/txt/` (`pdftotext -layout -enc UTF-8` copies of the
PDFs). Fetch the sources with `SOURCES.md` (game data regenerated 2026-10-22). Modelled on Photonic Sun's extract.

## Sources and rules

- **Game data is the authority**: `dex-rebalanced.json` (tools/ctr_dex.py on the hack's romfs + code.ips over vanilla X
  v1.0) and `trainers-rebalanced.json` (tools/xy_trainers.py). Insanity - Rebalanced has the same dex; its trainers
  aren't in this guide (the user's choice). Vanilla comparison: `dex-vanilla.json`, `trainers-vanilla.json`.
- **Dex** (dex.py): cosmetic duplicates fold into the lowest form (Unown, Vivillon, Furfrou...); Floette Red and Yellow
  stay apart (their data differs somewhere). Pumpkaboo's sizes have blank evolution rows in XY: the base form's apply.
  Move Changes.pdf is MV.e.
- **Wild tables** (locs.py): areas = the Wild Pokemon Locations doc's titles, in its order ("the order they become
  accessible"); the 53 game zones are matched to the doc's sub-areas by species overlap, one to one, and sub-areas (1F,
  B2F, Outside) are sections named by floor. Sections: Grass, flowers, Rough Terrain = grass; Surf and rods = water; Rock
  Smash and hordes = other. Hordes: one group per horde table ("Horde 60%"). Slots of one species in a table are summed.
  Cosmetic forms the dex folds (Scatterbug, Munchlax, Misdreavus, Whiscash) use the base form. About 79 of 694 doc rates
  differ from the game (doc typos, missing hordes): the game wins. Route 17 is "Snow" in the doc, Rough Terrain in the
  game.
- **Gifts and fixed encounters**: levels and held items from the hack's own `DllField.cro` (`.src/cro/`, from the zip;
  vanilla's from the dump; `cro_specials()` in locs.py: statics 12-byte entries at 0xEE46C, gifts 24-byte at 0xF805C,
  level byte 3 / 5, item at 4 / 12). The hack changes: Kanto starters Lv 15 with Eviolite, Lapras Lv 35, fossils Lv 25,
  Kalos starters hold a Big Nugget, Torchic (Blazikenite) replaces the Route 2 Pidgey, Xerneas 60, birds 85, Zygarde and
  Mewtwo 90. Places are vanilla X's (Bulbapedia; no script edits): Lumiose City and Team Flare Secret HQ are appended
  areas (ARO puts them in place); the roaming bird follows the starter (Chespin Articuno, Fennekin Zapdos, Froakie
  Moltres; "Starter: X" in the note). Frost Cavern's Abomasnow (Lv 45) is a battle, not a catch. In-game trades aren't
  added.
- **Trainers** (trainers.py): Bulbapedia's X / Y walkthrough matched on vanilla teams (class + name, species, levels); the
  hack's trainer with that id is used. 54 placeholders dropped. Rival / Shauna / Tierno / Trevor ids are fixed (RIVAL,
  FRIEND). Boxes follow the single cap list, including mini caps, named with `tools/splits.py`; the league is Elite Four
  Split [Cap 82], then Post-game. The old gym grouping still assigns trainer keys before the cap regroup, keeping every
  published trainer key unchanged. Hand placements (guesses): Hotel Richissime (38), Battle Chatelaines, 4 by id
  neighbour, 156 nameless trainers (id 614+) as a Battle Maison pool in the post-game box (all post-game: levels near or
  above Diantha's 87, or Maison's fixed levels). 28 trainers no Bulbapedia page names (Drivers, a Gardener "●"...) are
  vanilla X's unused data and are dropped. No natures or EVs (cfg.evs false); IVs are the trainer byte / 8. Tags from the
  battle field (Double / Triple / Rotation, Multi Battle with a partner). Moves default to the last four level-up moves.
- **Level caps** (CAPS, `level_caps()` in trainers.py): one `TR.caps` list, no `TR.mini`; each story section has one
  `[level, who, where, battles left]` entry. Eight Gym Leaders and the Elite Four's highest level (82, not Diantha),
  plus the retained rival / Flare mini caps. Sycamore Lumiose 18 and Couriway 70 are removed; Route 19 is Shauna, Tierno
  & Trevor 72. Tierno 18 and Victory Road's rival 78 are excluded (redundant). Battles left count one per battle, one
  starter and player's rival version, no Battle Chateau, no Viola nerf card.
- **Rivals and the player picker**: `t.st` = starter name, `t.pl` = the player character the team appears for ("m" boy,
  you fight Serena; "f" girl, you fight Calem), on rival cards and partner entries (`pt`). Partners: Route 7, Glittering
  Cave, Poké Ball Factory, Team Flare Secret HQ. Viola nerf: a second Viola card with its own `bt`, tagged "Viola nerf
  patch" (only trainer 6 of `trainers-rebalanced-viola-nerf.json`).
- **Items** (items.py): Bulbapedia's Kalos pages (`{{Itemlist}}` X rows, `{{shop}}` stocks) with the Item Changes doc
  applied (DOC_SWAPS, TM_WAS, Mega Stones in every Mart from five badges); TMs teach the hack's moves (code.ips). Rows
  with only `y=yes` are Y-only and skipped. Items no location page places take the walkthrough pages' `{{itemlist}}` rows
  (the Kanto stones from Sycamore with your Kanto starter, TM54, the lenses...). Rules: `itemstd.RULES['eternal-x']`.
  Key Items: no Holo Caster, Running Shoes, Town Map, Adventure Rules (automatic / tutorial), Lens Case (cosmetic), Honor
  of Kalos (trophy); kept: movement tools, all rods / HMs, Dowsing Machine, Exp. Share, Mega Ring, Poké Flute, story /
  access keys and passes, Poké Radar, Prof's Letter, Looker Ticket, Intriguing Stone (Sun Stone exchange), form-change
  items, Vs. Recorder.
- **Walkthrough** (walk.py): the Trainers page's cap splits, then Post-game. A place spanning cap boundaries is split into
  trainer fragments; encounters, items and steps stay on the first fragment, without duplication. Every fragment carries
  a unique persistent `k`: the original gym-split stop coordinate for the first fragment, then `.f1`, `.f2`... within
  the original stop (not from the cap / split index, so a later layout insertion does not change an identity). Without
  its `.fN` suffix, `k` is the stop's position before the regroup (what `dex.js` `migrateWalkState` reads; there is no
  separate map). PLACE puts Team Flare Secret HQ (Xerneas) at part 11's Geosenge Town; ALIAS Starter → Aquacorde Town;
  ITEM_ALIAS files gyms and buildings under their town; a Lumiose item goes to the earliest part whose Lumiose block lists
  it (8 move to parts 8 and 11), the rest stay at the first visit (part 3). Lost Hotel and Terminus Cave are "on the way"
  stops. Game docs: Evolution Changes, Move Changes, Changelog. Zero checklist steps.
- **Availability** (prune.py, last build stage): direct encounters and gifts seed a fixed point over evolution and
  breeding links. Form changes need an obtainable base; Megas additionally need a located stone. Shown trainers and
  partner teams keep their exact used forms even when unobtainable, marked trainer-only. 763 entries are obtainable
  including forms and Megas; 19 are trainer / partner-only. No species IDs are renumbered; evolution and alternate-form
  links are filtered to retained IDs. `p.vc` is not generated; move changes remain.

## Local storage (prefix ex)

`exdex`, `excalc`, `extrack` (tracker {s starter, pl player, e, t}), `exwalk`, `excap`, `extr`, `exrecent`, `expos`,
`exmgm`, `exloc`, `exitems`, `excapset`. Keep them once published.

## Hack-only data

Beyond the shared schema (hacks/emerald-imperium/notes.md → Data schema): ARO (Locations order; Lumiose City and Team
Flare Secret HQ sit last in AR), AR.es (sections per area), trainer `bt` (battle id shared by trainers fought at once),
`pl` (player character "m" / "f"), `st` (starter), `pt` partners, mon `ao`; TR.caps one list (no `TR.mini`); WK.docs holds
the game docs; stop `k` with `.fN` fragment suffixes.

### Damage calc

Retest (2026-10-27): Protect is now offered (the guide has Protect-family moves). Hail-setting moves set Hail.

W2 checked 2026-10-25: all 782 stock Gen 6 weights stand (36 form fallbacks, 29 Megas, no 1 kg defaults or regional forms); 38 explicit form/Nidoran verdicts, 67 exact form/Mega checks, 54 weight/ratio boundaries, 470 HP and 338 speed cases confirm stock bands; ten automatic-power fixtures without `bp` all match legacy Dynamic-Calc (119 total: 116 exact, 3 existing always-critical differences, zero errors); no profile overrides or new Needs Opus rows. Evidence and Bulbapedia reference: `plans/calc-refine-eternal.md` (git history) → W2; checks: `tools/calc/eternal_check.mjs`.

Field mechanics pass, 2026-10-25. `cfg.calc.base = "gen6"`: standard Generation 6 singles/doubles damage and types,
with the guide's Rebalanced species stats, types, move power/category/priority and ability assignments. The user's
requested field list is explicit: all eight weather choices (including none and the three harsh weather states),
Electric/Grassy/Misty terrain, Gravity, Magic Room, Wonder Room, inverse, and both sides' Reflect, Light Screen,
Helping Hand, Tailwind, Flower Gift and Friend Guard. No Psychic terrain, Aurora Veil or Battery. Field sides are
relative to the current attacker/defender, as in the shared calc UI; the existing `excalc` storage key is unchanged.
No shared template, engine or base-profile change was needed.

| Configuration | Source / check |
| --- | --- |
| Gen 6 damage/types/critical damage | User's standard Gen 6 requirement; older hzla link `data=8d1ab90a3b3c494d8485&dmgGen=6&gen=6`, not Decomps. `backups/title_to_backup_mappings.js:15,59` identifies `exwy`, Eternal X/Wilting Y Insanity Rebalanced. |
| Inverse effectiveness rule | Per defending type: immunity becomes x2, otherwise reciprocal. Oracle `calc/mechanics/gen56.js:119-134`; ability immunities remain, with Levitate tested. Freeze-Dry/Flying Press special effectiveness is inverted too. |
| Ally Flower Gift toggles | Standard x1.5 Attack / Sp. Def in Sun and Harsh Sunshine; oracle `calc/mechanics/gen56.js:871-876,944-949`. Rain/no-weather and wrong-category negative cases included. |
| Always-critical moves | Declarative `critical` rule (`value: true`) for Cut, Self-Destruct and Explosion (Move Changes, Rebalanced; data `h`/`e` notes agree). The oracle (gen 6) crits them only with the crit flag: its no-flag rolls are 1/1.5 of its crit rolls. Fixtures `cut-neutral`, `self-destruct-neutral`, `explosion-neutral` are known differences (source: the doc; the oracle lacks the rule), their `-critical` pairs and the Cut type fixtures (`cut-rock-defender`, `cut-ghost-defender`, both with the crit flag) match. Check: neutral rolls equal crit rolls. |
| Cut / Strength types | Types come from the guide data (Grass / Rock, `MV` 14 / 69), no rule needed: Cut vs Rock 2x; Strength vs Fire 2x; Rock-type user gets STAB (`strength-rock-user-stab`). Matches the oracle. |
| Drill Peck | Crit stage 1 from the game data (`MV.cr`); the calc counts it in the crit chance it reports (engine pass below). |
| Triple Kick | Power 20 (data) x the hit number: 20 / 40 / 60, as the expansion source does it (shared engine fix, `tools/calc/test.mjs`). The oracle keeps a flat 20, so no oracle fixture. Check in game. |
| Remaining field controls | Native Gen 6 mechanics; oracle `calc/mechanics/gen56.js`, `calc/mechanics/util.js` and independent stock `@smogon/calc` 0.12.0 Gen 6 comparisons. |

Oracle: `hzla/Dynamic-Calc`, pinned at `42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74` in ignored
`.tmp/hzla-eternal-x/`, backup `exwy`. Its title says Insanity Rebalanced; the hack's Rebalanced and Insanity
Rebalanced dex are identical (SOURCES.md), and the comparison supplies our guide's Rebalanced sets, not its trainers.
`hzla_compare.mjs` loads this older calculator's original `calc/` scripts in `index.html` order with its shared-export
browser shim. This is necessary because its CommonJS gen78 dependency references a nonexistent custom stats module;
no oracle source was edited, copied into tracked files or bundled. Legacy-only UI defaults: `invert=false` (inverse
uses `field.isInverseBattle`), `switchIn=0`, `challengeMode=false`; `npoint_data` / `backup_moves` use `backup_data`.

`calc_matchups.json`: **109 cases: 106 match all 16 oracle rolls; 3 known differences (always-critical neutral fixtures, see the Always-critical row); no unexplained mismatches**.
Includes singles/doubles spread and single-target attacks; screens and critical bypass; Helping Hand/Friend Guard;
all weather choices, harsh-weather immunities, Strong Winds, sand's Rock Sp. Def boost and Air Lock; each terrain
with grounded/airborne cases; Magic Room suppressing Choice Band/Eviolite; Wonder Room physical/special/Psyshock;
inverse single/dual weakness, resistance and immunity; both Flower Gift sides; Tailwind via Payback's turn-order
power; Gravity removing Flying/Levitate immunity and grounding terrain recipients; combined doubles support.

`tools/calc/eternal_check.mjs` independently compares every non-inverse fixture to uninstrumented stock Gen 6,
asserts inverse effectiveness and positive/negative field relationships, and hand-checks the Wonder Room/defensive
Flower Gift rolls. Those fixtures share the Photonic check's relevant stats: base damage 20 before STAB for Wonder
Room Tackle, 136 for Psychic, 25 for Psyshock, and 20 for defensive Flower Gift Psychic. Included in
`npm test --prefix tools/calc`: 81 shared + 53 Hardlove + 111 Photonic + 109 Eternal fixtures/checks pass.
Existing oracle comparisons remain 47/47 Emerald Imperium and 101 matches / 6 documented differences Photonic Sun.

Validation: all four guides assemble; the other three built HTML files are byte-identical to before this pass.
`gate.py baseline HEAD` captured pre-pass commit `32c9b80`; `gate.py check eternal-x --data` passes 5/5 (rebuilt data
identical except timestamp, report byte-identical, counts and extract assertions pass). `calc-eternal.mjs` verifies
actual field controls/options, damage rendering and reload persistence at five viewer sizes, normal/dvkb: 10/10.
`consistency-check.mjs eternal-x` passes both modes, all five sizes and light theme. Phone preview:
`calc-eternal.html` (Thor frame); manually checked the fields at 260x316, with no horizontal overflow.

Not checked: in-game damage on the Thor, exhaustive individual move/ability/item effects,
switch-in/history automation or save import. Oracle agreement isolates mechanics:
sharing guide stats/types/power does not independently validate extracted data. The hack's Pokemon Changes doc
describes changed stats/types/ability assignments/movepools, including later-generation additions; those do not
upgrade the requested battle mechanics to Gen 7. Future refinements add fixtures here rather than change other
guides' base profiles.

#### In-game tests

Rolls are the engine's 16 rolls. Level 50, Serious nature, 31 IVs, 0 EVs, no item, no field unless stated. For the
always-crit points, watch several uses: every use should show the crit list, never the ordinary list.

- **Triple Kick scales per hit.** Settles: power 20, 40, 60 on hits 1-3 (Eternal's Triple Kick is 20 per hit, multiplied by the hit number).
  - Attacker: Hitmontop (Atk 115), no ability effect on Triple Kick (not Technician). Defender: Blastoise (HP 154, Def 120).
  - Expected: hit 1 `12 12 12 12 12 13 13 13 13 13 13 13 13 13 13 15`; hit 2 `22 22 22 22 24 24 24 24 24 24 25 25 25 25 25 27`;
    hit 3 `33 34 34 34 36 36 36 36 37 37 37 37 39 39 39 40`.
  - Other way (flat 20): all three hits show the hit 1 list.
- **Cut always crits.** Settles: Cut is a critical hit on every use (Rebalanced move changes), without the crit roll.
  - Attacker: Snorlax (Cut is Grass here, super effective on Blastoise). Defender: Blastoise (HP 154, Def 120).
  - Expected on every use: `62 62 64 64 64 66 66 68 68 68 70 70 70 72 72 74`.
  - Other way (ordinary hit): `42 42 42 44 44 44 44 46 46 46 46 48 48 48 48 50`.
- **Self-Destruct always crits.** Same setup with Self-Destruct (power 200).
  - Expected on every use: `184 186 189 190 193 195 196 199 201 204 205 208 210 213 214 217`.
  - Other way (ordinary hit): `123 124 126 127 129 130 132 133 135 136 138 139 141 142 144 145`.
- **Explosion always crits.** Same setup with Explosion (power 250, faints the user).
  - Expected on every use: `229 232 235 238 241 243 246 249 252 255 256 259 262 265 268 271`.
  - Other way (ordinary hit): `153 156 157 159 160 162 165 166 168 169 171 174 175 177 178 181`.

Engine pass (2026-10-26): crit stages are `MV.cr` from the game data's per-move `crit`
(`tools/ctrguide.py`, 26 moves: Drill Peck 1, Cut / Self-Destruct / Explosion / Frost Breath 6; the always-critical
rule above repeats `cr` 6: harmless, kept). The calc now reports the crit chance (`crit`), so Drill Peck's stage shows.
Frost Breath: the game data is vanilla X's (60 power, 90 accuracy, always a crit); the changelog's buff is most likely
the Gen 6 change 40 → 60 that vanilla X already had. No data change. Weak Armor raises Speed by 1 (Gen 6). Battle
state, crit and `pre`: `tools/calc/README.md`. Fixtures: `calc_states.json` (320 cases).

## Checks

`check.py` [baseline.json]: an availability fixture (evolution / breeding, usable Mega, form change, trainers, partners,
pruning); references (evolution, forms, trainer and partner teams, area rows); the cap list and matching Trainers /
Walkthrough box names; unique stop keys (74) with all 69 legacy roots; key-item decisions; every trainer key in a stop.
Given a pre-Part-B data.json: species IDs and order, identical AR / ARO / LOC and trainer cards, area attachments,
trainer references and checklist arrays per legacy stop. Then `python assemble.py eternal-x` (782 shared sprites, no
missing ones), `tools/domcompare.mjs` against the previous build, and the viewer-size checks (CLAUDE.md).

## History

- **2026-10-24, gifts read `Also:`.** Poké Radar, King's Rock (Lysandre) and the three Kanto Mega Stones from Sycamore
  were `Found:` lines; `itemstd.RULES['eternal-x']['also']` relabels them (Items and the walkthrough).

- **2026-10-23, Items standard.** `tools/itemstd.py` (shared, idempotent; run by `finalise()`) puts Items in the shared
  box set (rules: `itemstd.RULES['eternal-x']`; `python -I tools/itemstd.py eternal-x` on a published data.json). The 29
  stones under Held Items moved to Mega Stones (linked to the Mega page by `P.stone`); Genesect Drives -> Memories and
  Drives; the five HMs moved from Key Items to TMs and HMs (HMs sub-heading, linked to the move); Exp. Share stays in Key
  Items only. Fossils, Mega Stones and Evolution Items A to Z.
- **2026-10-23, Part B (consistency pass).** Removed IDs `mega-mewtwo-y`, `wormadam-sandy`, `wormadam-trash`,
  `floette-eternal` (786 -> 782). Key Items 33 -> 28 (rules above; Poké Radar row added, previously omitted by the
  whitelist). Cap list, split names and the cap regroup as above (Sycamore Lumiose 18 and Couriway 70 removed). All 680
  trainer cards (keys, partners), AR, ARO and LOC unchanged as parsed objects. Saved state: `LS.dex` stores `{f,sort,av}`,
  not species-array indices; `TK.e[area].p` and `TK.t` hold string species IDs; calc inputs use `LS.calc + ':' + p.id`;
  config key names untouched. A removed species ID previously selected stays in stored state (it is not rewritten).
  Checks: repeat builds byte-identical, `pagecheck` / `walkcheck` in both modes at 260x316, consistency check (five
  viewer sizes, light theme), `domcompare` over 2,316 routes per mode with no page errors. No Thor-device test.
- **2026-10-23, stable fragment keys.** Stops regrouped by cap shared one original key across fragments, which would have
  coupled their saved state. Extraction now emits 74 unique keys keeping all 69 legacy roots (the Shalour stops at
  `3.4`, `4.0`, `5.0` use `2.4`, `2.4.f1`, `2.4.f2`), and the shared template's `migrateWalkState` moves saved ticks,
  open state and anchors to the new positions by key. (Part B first found that the template used positional coordinates
  for stop state; the template fix is in `template/dex.js`.)
- **2026-10-22, first build** (Rebalanced version, from the game files and Bulbapedia; game data regenerated that day).
