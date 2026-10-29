# Pokémon Unbound guide: plan

The goal and acceptance are in the session prompt. First guide of the **CFRU family** (Radical Red next): write the
shared parts so Radical Red reuses them. Readiness check: 2026-10-29 (main `e06dbd6`).

## Sources (what we have, what's missing)

Unit 1 audit (2026-10-29): `plans/unbound-sources.md` is the detailed map (counts, exact paths/cells,
every source conflict, immutable links, save manifest and limitations). Original 2026-10-18/19 inputs
were not modified. Added references and public linked documents live in NEW `.src/` folders:
- **RomHackDex** (`romhackdex/`): **1,268 actual species/form HTML pages**, 993 move rows / 992
  normalised names, 258 abilities, 94 location pages, 352 item pages. Names/h1 are not form keys:
  126 h1 names collide across 378 pages. Reader `tools/romhackdex.py` needs explicit handling for
  evolution-learned move rows (399 pages currently fail its numeric level parse).
- **Wiki** (`unboundwiki/unboundwiki.json`): 1,545 records; **968 individual Pokémon pages** (967
  Pokédex-category members + uncategorised Snorunt); walkthrough parent + **40 parts**; 67 individual
  location URLs, 60 with a Wild Pokémon table/heading (54 with numeric rate rows; others can be gifts,
  trades or statics), no wild-level column; raid parent + 32 dens; 84 mission-category members;
  129 TM/HM-category members; 90 Items-category / 49 Mega Stones-category memberships (overlap).
  Trainer Locations list has **309 named rows**, only 294 with roster/location cells and 15 name-only.
  This differs from D2's 310 target: reconcile the count, do not invent the missing roster or silently change D2.
- **Three boss workbooks** (`trainers-{difficult,expert,insane}.xlsx`): 14 sheets each (4 helper,
  10 content). Expert has **439 numeric-level Pokémon slots**, including partners/variants.
  Authority remains the sheets. Compared against hzla: 381 matched slots / 380 distinct sets;
  16 differing slots; 58 unmatched sheet slots; 3 malformed hzla species keys. Every difference
  and per-trainer summary is in the audit. Rival is three player-starter groups; do not merge them.
- **hzla** pinned in `repos/hzla/` at `ff6c3e339e276e6b4e8e44db58750b6534bc26aa`:
  Expert **383 sets / 93 label groups**; Insane 417/97; Difficult 357/94. Backup + adapter, profile,
  gen789 base/fallback, save reader/constants/generator and tests; per-file blobs and last-touch
  SHAs in SOURCES.md. **Reference only: not copied into the guide.** No blanket licence for additions.
- **Unbound-Cloud** pinned in `repos/Unbound-Cloud/` at
  `3d20f323b3f4690504f638fc8a6d491067f69194`: use `server/src/data/unbound_2_1/`, NOT
  `unbound/`. Species 1,181; moves 767; items 523; BaseStats 1,264; all match hzla exactly.
  AbilityNames is symbolic, not numeric; 343 vs hzla 336 (7 extra tokens). Both manifests UNLICENSED.
- **New public docs** in `research-2026-10-29/`: `trainer-index.xlsx` (explicit 2.1.1.1 title;
  LEVEL CAPS!D2:D11), `ordinary-trainers.xlsx` (49 sheets, 418 trainer blocks, 1,003 evo-name cells,
  73 held-item cells, no moves/abilities), `location-guide.xlsx` (10 sheets; no wild-level field).
  Public links/hashes in SOURCES.md and audit; linked General Guide export returned HTTP 401.
- **Save candidates** in `saves/Unbound-Cloud/`: 37 binary 2.1-signature fixtures copied from
  Cloud tests (including generated/corrupt/randomised controls); hzla accepts 32, rejects 5.
  Signature 0x01121999 proves 2.1.x, not exact point release. Expert fixture and expected-box JSON
  pointers are in the audit. Keep local: no separate redistribution licence found.
- **Supplemental author DPE/CFRU references** in `research-2026-10-29/dpe/` and `cfru/`:
  missing-form stats/learnsets and configurable wild-scaling code; commits/hashes in the audit.
  These branches are not verified 2.1.1.1 releases and do not change the settled source authority.

Missing / closed by unit 1:
- **Closed:** hzla and Cloud pinned with hashes/licence warnings/re-fetch paths; both watched.
  `uv run python -I tools/check_updates.py unbound`: exit 1, no errors, 4 GitHub API calls;
  only hzla gen789.js / vanilla/gen789.js drifted. Pins retained; no --accept.
- **Closed, D3:** caps **20 / 26 / 32 / 36 / 40 / 45 / 52 / 57 / 61 / 75**, each cited to
  trainer-index LEVEL CAPS column D. **Maxima cap 40 is an extra non-badge boundary** between
  Mel 36 and Galavan 45; after Mel, four badges span two successive cap stages.
- **Partially closed, D2:** ordinary trainer **held items** and a larger evolution-line catalogue found.
  Moves and abilities remain undocumented. Ask before using 73 item cells / expanding to 418 blocks;
  no D2 change made. Also reconcile 309 mirrored catalogue rows vs the settled 310 count.
- **Still missing:** release-matched ordinary wild-level ranges/scaling rules. Generic CFRU has an
  optional lowest-party-level path; activation in this exact game release is unverified. Leave wild levels out.
- **Closed:** alternatives for Minior Red Meteor = `SPECIES_MINIOR_SHIELD` / ID 991 and Pumpkaboo
  Average = `SPECIES_PUMPKABOO_M` / ID 855; Cloud target-profile stats + DPE corroboration.
  Bare Pumpkaboo is small (44 HP), not average (49 HP).
- **Partially closed, D6:** binary oracles found; still need independent field-by-field expected-JSON
  comparisons, exact point-release provenance and a real RetroArch .srm import on the Thor.
- **Source limitation:** wiki provides no species base-stat table. Types agree on all 968 matched
  pages; 41 displayed ability-list disagreements and 78 name mismatches are enumerated in the audit.

## Decisions

Settled by the readiness check (change only with the user):
- **Data sources:** RomHackDex for the dex (stats, abilities, learnsets, evolutions, moves); the boss sheets are the
  authority for boss teams, hzla for IVs and a cross-check ("hzla says ..." where they disagree, as BB2R); the wiki
  for locations, rates, items, gifts, walkthrough, missions and ordinary trainers. Unbound is closed source: no
  "code wins" rule; differences between sources show as "Wiki says ..." / "Sheet says ..." and go in notes.md.
- **Boss levels** are the sheets' "Level at Cap" (the game scales them to the player); the card says so once in the
  trainer box (not at the top of the page). Title Defense: "Minimum Level".
- **Rival:** one team per starter through `t.st` (the starter picker), like BB2R's rival.
- **Calc:** profile from hzla's Unbound profile (gen 8 base `cfru`), Megas, Z-moves (`zmove`, Unbound has
  Z-crystals); Dynamax only exists in raids: not in the calc. Fight gimmicks (Fog, Negative Energy, ...) go through
  the field review (`tools/trainer_fields_check.py`) with the user.
- **Save:** a new `template/calc/readers/cfru.js` (Gen 3 sections + CFRU blocks 30 / 31, 58-byte box mons), written
  for both Unbound and Radical Red; `cfg.calc.save = "cfru"`. Randomised saves are refused, like hzla's.
- **CFRU family code:** `tools/cfru.py` (naming / forms, Unbound-Cloud ID tables → `GID`, shared RomHackDex
  handling), reused by Radical Red.

User's answers (2026-10-29):
- **D1 Difficulty: Expert.** Expert teams on every card; Difficult and Insane are left out (hzla's other modes stay
  in `.src/` for later). Mode `Expert` in hack.json.
- **D2 Ordinary trainers:** all 310 in Trainers and the walkthrough with species, levels and location, marked
  "moves unknown". The calc gives them the last four level-up moves at that level, a neutral nature (Hardy) and 31
  IVs, marked assumed.
- **D3 Caps:** the in-game level cap per badge (unit 1 finds the values, each with a source); these split the Trainers
  page and the walkthrough.
- **D4 Missions:** walkthrough steps at the point each unlocks, **each mission its own collapsible level** inside the
  stop (title line closed; its steps inside), so stops stay short. Steps today are flat (`stop.s` = [step, note]):
  this is a **template change** with new saved state (a mission's open state and ticks, keyed by a stable mission
  key, never a position; `guide-update.mjs` snapshot). Mockup first (unit 7a), then build.
- **D5 Extras:** raid dens as location sections; DexNav / swarms / Gen 8 activation as area notes; Battle Frontier,
  Battleground and Title Defense in the postgame box.
- **D6 Save:** the user plays on RetroArch (`.srm`, a 128 KB Gen 3 flash save) and has **no save to provide**. The
  reader is checked against Unbound-Cloud and hzla on whatever saves unit 1 finds (Unbound-Cloud's tests, hzla's
  fixtures, public sample saves); with none, the reader ships marked provisional and a real import on the Thor is a
  follow-up check (PROGRESS.md), as BB2R's was.
- **D7 Version:** 2.1.1.1.
- **EVs (2026-10-29):** Unbound has no way to turn EVs off, so they stay: `cfg.evs` true, `cfg.mgm` false (new switch:
  no MGM toggle, one speed per Pokémon with its EVs). Trainer cards and the calc use the sheets' EVs as given.
- **Ordinary trainers (2026-10-29, after unit 1):** the wiki's Trainer Locations list (309 named rows) is the list;
  where `research-2026-10-29/ordinary-trainers.xlsx` matches a trainer, add its held items and say its team scales
  with the player (evolution line + minimum level). Workbook-only trainers are reported (notes.md), not added. The
  15 name-only rows are listed with name and place and "team unknown" (or the workbook's team where it has one).
  The "310" in the session prompt is the wiki's 309 named rows.
- **Bosses at several caps (2026-10-29, after unit 6 round 3):** where the Expert sheet's comments give a boss's
  levels at later caps too, the card shows one short line ("Lv 61 at Benjamin cap · 75 at E4 cap") **and** the
  levels are relative to the cap like EI's (`r` = level − cap, default `t.cap` = the fight's split cap; the card's
  "Your level" box sets another cap, saved per trainer key in `LS.cap`, and the calc follows it). Where a mon's
  levels at the given caps aren't cap + one offset, keep absolute levels and note it.
- **Battle Frontier: left out** (no fixed teams; user 2026-10-29). Postgame box: Battleground and Title Defense.
- **Calc gimmicks (user 2026-10-30): all of them in the calc**, with the official Unbound calc
  (https://unboundcalc.byethost3.com/?i=1, "the official Unbound calc with all the extra effects") as the oracle
  next to hzla: Mirskle's Fog, Alice's Tailwind for Flying types, Galavan's Magnet Rise for Electric / Steel types,
  Big Mo's "Trick Room for Weight" (each Pokémon's Speed = its weight in kg, rounded down: Abomasnow 135, Mega
  Abomasnow 185), Tessy's permanent Heavy Rain and Camomons Battle, Moleman's Vicious Sandstorm, Elias's Shadowy Veil,
  Mel's Inverse Battle. Both sides where the sheet doesn't say otherwise.
- **Brain Bond = Parental Bond; Face Shield = Gen 8 (pre-nerf) Dauntless Shield** (user 2026-10-30; overrides hzla).
- **Missions (7a, 2026-10-29):** bordered mission card, auto-close on the final tick (`plans/unbound-missions.md`).
- **Mode:** hack.json has no mode field; "Expert" goes in the trainer wording (`txt`), not a new key.

## Units (in order; each an agent in its own worktree from `worktree-unbound`, ending at a commit)
1. **Source audit + gaps** (Sol): pin hzla and Unbound-Cloud (SOURCES.md, watch.json); inventory with counts like
   `plans/blaze-black-2-redux-sources.md` (deleted with BB2R's plan; in git history); RomHackDex vs wiki vs sheets
   vs hzla conflicts; the searches above (ordinary trainer sets, wild levels, cap values); the user's answers to
   D1-D7 recorded here.
2. **Scaffold** (main chat): `python -I tools/new_hack.py unbound --like emerald-imperium --title "Pokémon Unbound"
   --version 2.1.1.1` (keys `unbounddex`, ... by default); PROGRESS.md → Current status.
3. **CFRU shared code + dex tab** (Opus): `tools/cfru.py`, `extract/dex.py`: species and forms (RomHackDex, wiki
   cross-check), moves (`moves.json`), abilities with Unbound's custom ones, type chart, evolutions, tutors, Mega
   stones (`p.stone` / `p.sloc`), `GID` from Unbound-Cloud. `tools/sprite_keys.py unbound`: Unbound's own forms go
   in `sprites.json`.
4. **Locations** (Sol): wiki wild tables (method, time, rate), RomHackDex membership cross-check, gifts, statics,
   legendaries, raid dens, Gen 8 activation note; tracker one slot per area (EI's floor rule).
5. **Items** (Sol): wiki item locations (requirements: HM, mission), TMs, Mega Stones, Z-crystals, marts, mission
   rewards; RomHackDex items for descriptions.
6. **Trainers + caps** (Sol): boss sheets in the D1 mode, hzla IVs and cross-check, ordinary trainers (D2), rival
   `t.st`, Mega Trainers, doubles / gimmicks, postgame boxes; caps (D3); trainer keys seeded.
7. **Walkthrough** (Sol): the 41-part wiki walkthrough split at the caps, `tools/tabs_check.py`.
   7a. **Mission collapse decide** (Sol, a mockup at 260 × 316 in the Thor frame, user reviews on the phone): how a
   mission sits in a stop, closed / open, ticks, Next step, search hits inside a closed mission; spec in
   `plans/unbound-missions.md`. 7b. **Build** it in the template (main chat / Opus; one template session at a
   time), missions in data with stable keys, scenario + `guide-update.mjs` snapshot, all guides re-checked
   (`domcompare`: no change on the other four).
8. **Calc + save** (Opus for the reader if Sol stalls): Unbound profile with fixtures against hzla's calc, field
   review with the user, the D2 assumed sets, `cfru.js` reader checked against Unbound-Cloud / hzla (D6).
9. Player's-eye review (Thor frame, phone preview), then the sceptic audit (Haiku medium).
Units 4-6 can run in parallel after 3 (different extract files; data.json is rebuilt on merge).

## Findings for later units

- **Unit 8b (calc, `worktree-unbound-calc`, 2026-10-30): for the user.** Enabled the Gen 8 `cfru` profile,
  EVs, Megas, Z-moves and CFRU save reader; no Dynamax or storage-key changes. 85 pinned hzla fixtures:
  **82 exact matches, 3 explicit disagreements** (Brain Bond second hit, Face Shield entry defence, Subterfuge STAB).
  Honey Armor follows hzla's doubled physical defence, not its short description's entry boost. Focus Belt / Nine
  Lives are assumed Sturdy as requested. Numeric ledger and remaining in-game checks: notes.md → Damage calc.
  A fourth, **residual-only** disagreement is measured explicitly: 175 HP Mew loses 21 HP in Vicious Sandstorm here
  (Moleman's sheet says 1/8), hzla's `getEndOfTurn` gives 0; ordinary Sand gives -10 in the same oracle harness.
  Oracle command: `node tools/calc/unbound_oracle.mjs <clean ff6c3e3 checkout> .tmp/unbound-calc/oracle.json`;
  run here using `C:/Users/fikry/Documents/Personal/Dev/thor-dex-guides/.tmp/hzla`. Both engines now receive real
  hazard inputs in the full-HP shield fixtures (the old adapter silently omitted them).

  **Field proposals for the user (all 11 records still `review: true`; nothing accepted here):**

  | Trainer / stable key | Sheet evidence | Proposed calc field / card behaviour | Decision key |
  | --- | --- | --- | --- |
  | Mirskle `0.4.0` | `Gym Leaders!B2` comment: constant Fog, accuracy loss, weather replacement/return and Defog | Fog text/accuracy label; no damage modifier. No accuracy simulation. | `fog` |
  | Mirskle rematch `10.7.0` | `Battleground!B2`, same Fog comment | Same; do not infer the comment's Battle Frontier exception for Battleground. | `fog` |
  | Alice `2.6.1` | `Gym Leaders!B42` value; **no comment** | Tailwind only for selected Flying types on **both** sides, recomputed on selection/type changes; never unconditional foe Tailwind. Needs template support. Keep source text until then. | `flying_tailwind` |
  | Alice rematch `10.7.2` | `Battleground!B42` value; **no comment** | Same conditional Tailwind. | `flying_tailwind` |
  | Galavan `5.6.0` | `Gym Leaders!B102` value; **no comment** | Magnet Rise for selected Electric/Steel types, both sides; honour Gravity/grounding. Needs template support; card retains source text. | `magnet_rise` |
  | Galavan rematch `10.7.4` | `Battleground!B82` value; **no comment** | Same conditional Magnet Rise. | `magnet_rise` |
  | Big Mo `6.13.1` | `Gym Leaders!B122` value `Trick Room for Weight`; **no comment** | Text only: not ordinary speed-reversing Trick Room. Need the weight/order rule confirmed before engine/UI support. | `weight_room` |
  | Big Mo rematch `10.7.5` | `Battleground!B102` value; **no comment** | Same text-only recommendation. | `weight_room` |
  | Tessy `7.7.0` | `Gym Leaders!B142` value `Camomons Battle, Permanent Heavy Rain`; **no comment** | Weather = Heavy Rain, not Rain (Water boosted, Fire null); retain permanent-weather/Camomons source text. Permanent lock and move-derived typing are separate template gaps. | `heavy_rain` |
  | Tessy rematch `10.7.6` | `Battleground!B122` value; **no comment** | Same Heavy Rain proposal. | `heavy_rain` |
  | Moleman `9.2.0` | `Pokemon League!B2` comment: 1/8 chip, unremovable, Ground/Rock SpD | Weather = Vicious Sandstorm; engine applies sand effects, Ground/Rock SpD and 1/8 chip. Keep permanence text; template must stop weather setters replacing it. | `vicious_sand` |

  Exact answer edits: in `tools/trainer_fields.py`, `UNBOUND_FIELD_DECISIONS[key]` stays `None` pending an answer.
  Set `fog`, `heavy_rain` or `vicious_sand` to `'apply'` to emit the proposed field effects, or any key to `'text'`
  to close review with the original source text only. Rebuild Unbound data with its existing extract after an edit.
  For Alice/Galavan/Big Mo, `'apply'` deliberately raises until the stated template support exists; do **not** bypass
  that guard or turn them into whole-side Tailwind / generic Trick Room. A user's text-only answer is just `'text'`.
  Recommendations: apply Fog/Heavy Rain/Vicious defaults with the limitations above, implement conditional Alice/
  Galavan fields in the parent's template pass, and keep Big Mo text-only until the actual weight rule is confirmed.

  **D2 handoff (template explicitly out of scope):** data-only `tools/calc/unbound_assumed.mjs`,
  `assumedTrainerSet(data, sourceMon, resolvedLevel)`, is tested: last four distinct level-up moves, Hardy, 31 IVs,
  0 EVs; original objects and sourced moves unchanged. Profile sets `assumedSets: 'level-up'`. Main chat must call it
  in `template/calc.js` `foeBase` after resolving level, only for ordinary `Moves unknown` trainers; carry
  `mGuess/naGuess/ivGuess/evGuess`, add visible `Assumed` markers (only `aGuess` exists now), clear a marker on edit,
  restore/recompute defaults on Reset/cap changes without replacing manual edits. Keep trainer cards unknown and
  persisted moves/abilities name-based. 292 ordinary cards are present (unit 6's reconciled count, not 310).
  Also fix `importBytes`: read/map boxes before rejecting an empty party, accept a box-only save and offer its box.

  **Checks:** `cd tools/calc && npm test` passes, including 85 Unbound fixtures and 8a's 37-save CFRU oracle check
  (12,024 Pokémon; 10 saves refused as expected). `uv run python -I tools/trainer_fields_check.py unbound` passes:
  11 pending fields, 36 Doubles (34 tags + 2 partner-only). `python assemble.py unbound` passes.
  `uv run python -I tools/gate.py scenarios unbound --only calc-unbound,calc-import,calc-layout,calc-controls,calc-doubles,calc-field,calc-zmove,calc-smoke --jobs 4`
  is **4/8 PASS**, not merge-ready as an all-green unit: layout/import/field/smoke pass; new Unbound scenario is
  30 PASS / 10 FAIL (only the deliberately strict D2 integration assertion, every size/mode). Other failures are
  existing scenario assumptions: `calc_check_lib.mjs` `trainerRoles.singles` ignores partner-backed doubles and picks
  Vega `5.3.0` as singles (doubles: 1 pass / 3 fail), controls assumes the fixture's Cloyster is faster (24/2),
  `calc-zmove` hardcodes Photonic's absent `totem-gumshoos` and Totem aura tests (0/20). Fix those fixtures in the parent
  without weakening the behaviour assertions. No unrelated scenario helpers changed here.
  EI/BB2R: `python assemble.py emerald-imperium blaze-black-2-redux`, then
  `uv run python -I tools/gate.py scenarios emerald-imperium blaze-black-2-redux --only calc-smoke,calc-field --jobs 4`
  passes **4/4**. No full gate, stable-keys or guide-update run. Logs: `.tmp/unbound-calc/`, final Unbound browser
  `.tmp/gate/20261030-081518-526642/`, EI/BB2R `.tmp/gate/20261030-081153-161180/`.

  **Additional questions:** accept Brain Bond's standard 1/4 child and Face Shield's +1 entry as labelled assumptions,
  or follow hzla's no-effect handling until in-game tests? Recommendation: retain the documented behaviour mappings
  provisionally, but do not describe the numeric ratios as source-confirmed. InfernalRage keeps the guide's odd
  1 BP / Fire data and hzla's damage behaviour; its status-doubling description is not implemented in either calc.
  Tessy's Camomons typing is also not modelled; retain its source tag until the parent settles the UI/mechanics.
- **Unit 7 (walkthrough data, 2026-10-30, `worktree-unbound-walk`):** `extract/walk.py` is built: **40 actual wiki
  parts** (the index makes 41 pages, not 41 parts), **11 cap splits, 122 stops, 182 ordinary steps, 84 missions /
  475 child steps**, **703 Locations item rows**, **393 trainers** (101 boss / 292 ordinary), all placed; all 69 AR
  names covered. Build, extract-check, tabs_check (0 missing / 0 problems), assembly pass. No template changes or
  browser/gate scenarios; **7b is still needed before the guide can render missions**. Schema now accepts/rejects
  the accepted union; IT game-order sorting is enabled. IT rows and trainer card contents / keys / caps are unchanged,
  only display order follows WK. EI rebuilt unchanged apart from its date, restored; no other hack diff.
  **7b:** longest mission **#013 Basic Literacy has 47 children**; #008 has 34, #050 27, #065 25, #015 21. Eight
  mission-only Checklist stops: `postgame/mission-hq` (9 missions), `postgame/dehara-city` (2), and (one each)
  `postgame/magnolia-town`, `postgame/tehl-town`, `postgame/tarmigan-town`, `postgame/gurun-town`,
  `postgame/crater-town`, `postgame/tomb-of-borrius`. Treat them as real stops, not empty grey signs. Conditional
  hatching/fishing/pie chains keep full `u` and prerequisite order; long-running collection missions stay at unlock.
  Stop keys use source part / semantic visit; mission keys are literal slugs; child keys are semantic, including
  explicit target maps for numbered source tables. Missions append after ordinary pairs: 7b must count only pairs
  for legacy ordinary-step ordinals, never flatten mission children into them. #038 and #047 are post-game; malformed
  source HTML otherwise hides their requirements (also #007/#057/#060); #027's similarly hidden reward is recovered.
  Route 3's Surf fishermen stay in Galavan's Cap 45 box but appear **after Galavan**, Part 20. Charlie goes in Part 30
  (unchanged source/card location says Icicle Cave). Other revisit fixes and source-reader details: notes.md →
  Walkthrough. No unplaced entries or outstanding decisions.

(Units add theirs here.)
- Main chat after 8a (2026-10-29): fixtures moved to `hacks/unbound/.src/saves/expected/` (git-ignored; the save-reader
  procedure keeps expected.json beside the saves); `python-dotenv` added with uv; battle-only forms map to their base
  in `gid.py`. **8b:** the page says "No Pokémon yet" when the party is empty but boxes aren't (`insane_ng+`): fix in
  `calc.js`.
- Unit 5 (items, `worktree-unbound-it3`): IT built (`extract/items.py`, notes.md → Items; check.py `check_items`).
  Counts: 128 machines (TM001-TM120, HM01-HM08), 49 stones / orbs, 34 Z-Crystals (Doc's Incinium Z is "Currently
  Unavailable"), 29 tutors / 192 rows, 140 shop-stock rows (+ 91 Battle Frontier BP-exchange rows, Up-Grade from its page, 7 from the Fallshore evolution
  merchant), 83 missions + #001 (70 item rewards), 67 Locations pages / 687 rows all placed, 34 Useful NPCs.
  **Unit 7:** `items.PLACED` = [(Locations page title, item, IT box, line)] for every Locations row (703 after
  splitting multi-item rows): attach a stop's items by the stop's wiki location page; mission rewards read
  `Also: Mission #NNN Title · start place` (the mission's stop). The game-order boxes (Key Items, TMs and HMs, Move
  Tutors, Stats and Abilities, Z-Crystals) stay in extract order until the walkthrough exists: add
  `'unbound': {'reorder': set(GAME_ORDER_BOXES)}` to `itemstd.RULES` with WK. **Unit 8:** IT names = the game's
  (Unbound-Cloud) with the official spelling where they differ; GID it is renamed to match (`items.GAME_ITEMS`: HP Up,
  Guard Spec., Dream Mist, Heavy-Duty Boots), and check.py holds every game item in IT to IT's spelling. Mega Stones
  as P.stone (Houndoominite, not the wiki's Houndoomite; Red Orb / Blue Orb), Z-Crystals as the game names them
  (Aloraichium Z, Ultranecrozium Z ...). The IT schema has no description field: the RomHackDex item pages are not used.
- Unit 6 (trainers + caps, 2026-10-29, `worktree-unbound-tr4`): done; results in notes.md → Trainers / Caps,
  checks in `check.py` → `trainer_checks`. 393 cards: 101 boss (439 sheet slots, per-starter rivals and partners),
  292 ordinary (the wiki's 309 rows less 17 that are boss cards), 11 boxes (10 cap splits incl. Maxima 40, Post-game).
  **Unit 7:** trainer order is `BOSSES` / `SECTIONS` in `extract/trainers.py` (wiki walkthrough parts 1-40); not done:
  moving an ordinary trainer to the part that names it (Skier Charlie: parts 29-30) and Route 3's three Surf fishermen
  (Lv 41-42, placed by cap in the Galavan split). Split points: Ivory 1 / Zeph 1 open the Alice split; Maxima's own
  split at Tarmigan Mansion; Barbs and Big Mo share "Antisis City" (a second section after the Sewers); Reena, Sterling
  & Portia before the League. Stop keys should carry the trainer keys (`trainer_keys.json`). `trainers_follow_walk`
  will reorder boxes once WK has stops. **Unit 4:** `cfg.starter` is `pick`; the picker lists P entries with a
  `Starter choice` encounter: add Gible / Beldum / Larvitar ones (named as P names them), or the rival cards can't
  be filtered. **Unit 8:** IV source = hzla Expert (all 31s) on 379 slots; no IVs on 60 (58 sheet only + Route 9
  Shadow Warrior pair), no EVs on the 4 partner Vaporeon (no speed shown, settled). Mega holders on the cards
  (`a0` → `a`; random pre-Mega in `ao`); 10 Z-Crystal holders, all postgame (Ryuzoji / Kenlawa Mimikium Z, Title
  Defense Zeph Decidium Z, Battleground Vega / Alice / Mel / Galavan / Big Mo / Tessy / Benjamin); `au` carries the Boss Wild boosts (Omniboost =
  all +1); "Raid Shields" is text only. Field review list: Fog, Tailwind for Flying-types, Magnet Rise, Trick Room for
  Weight, Permanent Heavy Rain, Vicious Sandstorm (11 records); Negative Energy, Shadowy Veil, Pixies, Rainbow Battle,
  Inverse / Camomons / Sky / Dynamax battles are tags with no field record yet. Ordinary trainers have no moves / IVs /
  nature (D2's assumed sets are the calc's job). **Dex (main chat):** the game's own Metal Bash (MOVE_STEELYHIT, 40 BP)
  is merged into Behemoth Blade by `tools/cfru.py`'s alias; the rival's Beldum shows Behemoth Blade with an `x`.
  **Scenarios:** `guide-update` can't run on Unbound yet: it crashes on `GID.ab` (Unbound has none: a one-line guard
  in `tools/scenarios/guide-update.mjs`) and then needs WK splits (unit 7). `stable-keys` passes.
- Main chat (2026-10-29): Focus Belt / Nine Lives are probably Sturdy clones (the wiki lists Sturdy for their
  holders); unit 8: the calc treats them as Sturdy, marked assumed in notes.md → Damage calc. Pikachu Surfing / Flying
  use EI's art (`sprites.json`, the user's call).
- Unit 1 (sources): detailed audit `plans/unbound-sources.md`; pin/re-fetch/licence manifest
  `hacks/unbound/SOURCES.md`. No D1-D7 changes, no extracts/template edits. Research is on
  `worktree-unbound-sources`, to merge into `worktree-unbound` before later units.
- Unit 3 (dex/CFRU): RHD slugs, not h1 or sprite IDs, identify forms; 126 h1 collisions / 378 pages.
  The audit lists every wiki display-name mismatch and all collision groups. Handle evolution-learned
  `&mdash;` rows explicitly (399 current reader failures); never use the research zero placeholder.
  Cloud `server/src/data/unbound_2_1/{Species,BaseStats,Moves,Items}.json` matches hzla exactly;
  `src/data/{SpeciesNames,SpeciesNamesAlts,AbilityNames}.json` supplies display names. Abilities
  are symbolic slots, not an insertion-order numeric table. Wiki has no base stats; 41 displayed ability
  list disagreements need source-conflict notes. Missing Pumpkaboo average is _M / ID 855, not base.
- Units 4-5 (locations/items): wiki URL inventory includes parent pages: 67 individual locations,
  32 individual raid dens, 40 walkthrough parts. Wild headings/tables occur on 60 location pages,
  54 with numeric-rate rows; gifts/trades/statics can share the same table. New
  `.src/research-2026-10-29/location-guide.xlsx` (10 sheets) is a useful membership/items cross-check,
  not a settled replacement authority; no wild levels found. Keep 84 mission-category pages separate
  from mission unlock/order decisions. Source category counts and URL counts are not interchangeable.
- Units 6-7 (trainers/walkthrough): `.src/research-2026-10-29/trainer-index.xlsx`, LEVEL CAPS!D2:D11
  gives 20/26/32/36/40/45/52/57/61/75. Maxima 40 is a non-badge split before Galavan 45.
  Expert team audit: 439 sheet slots, 381 joins, 16 differing slots, 58 unmatched sheet slots;
  every discrepancy/cell and malformed hzla key is in the report. Sheets win, including missing
  partners/boss teams; do not import hzla default Insane or malformed species `[2nd`.
  Wiki catalogue is 309 rows (294 complete + 15 name-only), not the assumed 310; ask before changing
  scope or adopting the newly found ordinary-trainer workbook's 73 held-item cells / 418 blocks.
- Unit 8 (calc/save): `.src/repos/hzla/js/unbound_adapter.js` is required to select `unboundModes.expert`;
  existing `tools/calcbackup.js` alone fails on this backup. Gen-8 family base is gen789.js, not a
  separate cfru profile. `.src/saves/Unbound-Cloud/` contains 37 2.1-signature candidates; hzla accepts
  32 / rejects 5. Oracle manifest, expected-JSON paths, Expert var assertion and licence limits are
  in audit section 4. Current Cloud rejects its old 2.1 signature at upload: use the 2.1 profile/format,
  not that policy rejection. Independent expected-data assertions and actual Thor .srm import remain.
- Unit 8a (save reader, `worktree-unbound-reader`): `template/calc/readers/cfru.js` (profile `unbound21`) agrees
  with Unbound-Cloud and hzla on all 37 local 2.1 saves, every party and box slot, 0 unexplained (notes.md → Damage
  calc → Save import; README → cfru). **For 8b:** set `cfg.calc.save = "cfru"`; then `calc_save_check.mjs
  dist/unbound.html <save> tools/calc/fixtures/cfru/unbound/<save>.expected.json` works as is (e.g. `flashcart.sav`,
  6 party + 45 boxed; a fixture with `"same"` points at an identical one). Decide with the user: in-battle-only forms
  in a save (Darmanitan Zen, Meloetta Pirouette; Aegislash Blade, Wishiwashi School, Necrozma Ultra, Eiscue Noice,
  Zygarde Complete, Zacian / Zamazenta Crowned, Ash-Greninja the same way) map in `GID.sp` to their form pages; both
  oracles show the base. Recommendation: map them to the base in `gid.py` (as Cherrim Sunshine, Cramorant and
  Mimikyu Busted already are), keep Shaymin Sky (Unbound-Cloud, the author's tool, keeps it). The page throws "No
  Pokémon yet" when the party is empty even if boxes hold Pokémon (calc.js `importBytes`; one test save, NG+ start).
  **For Radical Red:** README → cfru → Radical Red (signature, box map, randomiser flags, experience table, own GID,
  `cfg.calc.cfru` in both guides).
- Unit 2 (scaffold, `worktree-unbound`): `new_hack.py --like emerald-imperium` done; `cfg.mgm: false` added to the
  template (`dex.js` HAS_MGM, `datajson.HACK_ORDER`, template/README.md cfg table); other guides differ by that one
  line only. `txt` wording is all TODO (units 4-7 fill theirs).
- Unit 7a (mission-collapse decide, `worktree-unbound-missions`): interactive sample and frame options in
  `tools/mockup/unbound-missions/`; draft build spec `plans/unbound-missions.md`. Phone preview:
  https://windows-pc.tail1846b8.ts.net/preview/unbound-missions.html . User chose bordered card and auto-close (spec accepted).
  Three real missions/three stops; no template/extract changes. 7b waits for phone approval; preserve ordinary
  tick identities when inserting groups, add stable mission **and child-step** keys plus guide-update snapshots.
- Unit 3 (dex, `worktree-unbound-dex`): look names up through `extract/common.py`, never by hand:
  `sid(name)` takes any source's spelling ("Raichu-Alola", "Alolan Raichu", "Charizard-Mega-X", "Lycanroc (Midnight
  Form)", "Urshifu-Rapid-Strike", "Indeedee-F", "Shadow-Warrior"; a cosmetic form -> its species, "-Gmax" -> the base)
  and returns the P id; `move(name)` / `ability(name)` give the M / AB name for CFRU short names ("Dazzle Gleam"), the
  run-together ones and the wiki's typos (`WIKI_MOVE_FIX`, `WIKI_ABILITY_FIX`); they are filled by `dex.build`, so
  call them after it. `WIKI` (`extract/wiki.py`) reads the wiki export: `pokemon()` has each page's `location` text
  (unit 4) and `held` items; `mega_stones()`, `tutors()` (29 tutors: location, requirement, moves with cost / days:
  units 5 / 7); extend it for Locations / Items / Missions pages rather than parsing the JSON again.
  Naming: regional "Alolan X" / "Galarian X" / "Hisuian X", Megas "Mega X [X|Y]", "Primal X", forms "X (Label)",
  peer defaults "Pumpkaboo (Small)", "Urshifu (Single Strike)", "Basculin (Red Striped)", "Lycanroc (Midday)"; Shadow
  Warrior is Unbound's own (dex 0). Cosmetic forms are one entry (Unown, Vivillon, Minior's cores -> "Minior (Core)",
  Burmy's cloaks...): a location listing "Burmy (Sandy)" is Burmy. Gigantamax forms are not species: a raid den's
  Gigantamax Pokémon is its base species with a note. P has every form; nothing is pruned yet: whoever adds the
  locations / trainers adds the prune to `build.py` (EI's `prune.py`, the shared rule).
  Surprises: the mirror misnames 15 species' abilities (Unbound's own shown as vanilla ones; fixed from the game
  table) and its ability descriptions for short names belong to other abilities; the wiki's National Dex numbers and
  learnsets are unreliable (its locations / evolution text are fine). The game's tables are now pinned
  (`.src/repos/Unbound-Cloud`, hzla's `unbound_2_1_constants.js`): `check.py` compares every species with them, and
  `gid.py` builds GID (sp / mv / it / gr; no ab: CFRU stores the slot). GID item names are Unbound-Cloud's: unit 5 makes
  them match IT's names. Unit 6: `trainer_keys.json` is not written until a build has trainers (the first one seeds
  it); hzla writes species Showdown-style, `sid` reads them. Unit 8: Z-move and Max-move entries are not in M (the
  mirror's "P" / "S" copies were left out); As One is "As One (Glastrier)" / "(Spectrier)"; three moves the calc
  doesn't know (Endless Edge, InfernalRage, Steelyhit) are MV.x.
- Unit 4 (locations, `worktree-unbound-loc3`): AR = Starter + the 67 wiki location pages in walkthrough order + Mystery
  Gift (no slot); one slot per area, AR index append-only. Unit 7: use the area names as LOC has them (exact wiki page
  titles: "Tehl Town / Underground Pass", "Cube Corp.", "S.S. Marine", "Thundercap Mountain"); sub-places with no page
  sit in an area: Rift Cave and Distortion World (portal in Rift Cave) -> Dehara City, Tomb of Borrius -> Great Desert,
  Safari Zone -> Polder Town, Cave of Being -> Route 10, Dream Lab / Fullmoon / Newmoon Island -> Tarmigan Town,
  Magnolia Café -> Magnolia Town, Battleground -> Seaport City, Mission HQ -> Fallshore City, Autl Woods -> Route 9.
  Order (walkthrough Parts): ... Frozen Forest, Fallshore City, Route 11, Epidimy Town, Route 10, Tehl Town, Route 9,
  Thundercap Mountain, Cliff Cave, Tarmigan Town ... Crystal Peak (35) before Magnolia Fields (36); Seaport Warehouses
  and S.S. Marine are Part 32; Redwood Forest, Battle Frontier, Cube Corp. have no Part heading (placed after Redwood
  Village / at the end). Unit 5: Mystery Gift codes are on the wiki's Mystery Gift Codes page (34 rows, held items).
  Main chat: P.g is set (EI's rule, 30 not found, notes.md -> Locations) for the prune; `common.location_aliases` maps
  "Flying Pikachu" to plain Pikachu (locs.py overrides to the Flying form). stable-keys can't run until TR / WK exist.
