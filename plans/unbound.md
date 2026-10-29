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
(Units add theirs here.)
- Unit 6 round 2 (2026-10-29, `worktree-unbound-tr3`, WIP): readers `extract/bosssheet.py` (439 Expert slots, 102
  column groups, level-row labels that name each fight's cap) and `wiki.py` `trainer_locations()` (309 rows; the 15
  name-only rows share the row above's place and combined team through a rowspan). New sources: 130 cell comments
  (gimmick rules, per-slot evolution / move-by-level notes, other-cap level ladders, the rival partner's Mega movesets),
  and the ordinary workbook's pair blocks split the wiki's combined teams. Design and placement plan: notes.md → Trainers.
  Unit 7: the split points there (Maxima 40 is its own split; Ivory 1 / Zeph 1 open the Alice split; Lily and the
  other "Tessy Cap" Mega Trainers come after Big Mo). Unit 8: field gimmicks with the sheet's own rule text,
  Boss Wild "Boosts" rows (Omniboost, Raid Shields), 60 slots without IVs (58 sheet-only + Route 9 pair).
- Unit 6 WIP/source checkpoint (2026-10-29): independently reproduced 101 structural Expert teams / 439 slots,
  wiki 309 = 294 with teams + 15 name-only, hzla 383 Expert sets, and every LEVEL CAPS!D2:D11 value.
  **Stopped before implementation for a player-facing decision:** four partner Vaporeon slots carry question-mark
  EVs (exact cells in notes.md -> Trainers); the matched hzla Route9 Shadow Warrior set also has no IVs.
  The shared trainer renderer requires numeric IV/EV arrays and otherwise crashes or prints invented/NaN speeds.
  Recommend the main chat/template owner add unknown-stat handling and hide uncomputable Speed before resuming,
  rather than silently defaulting stats or bringing forward unit 8's assumed sets. No template edits authorised here.
  `cfg.starter` should become `pick` (sheet headers name Gible/Beldum/Larvitar); not changed yet. Unit 7 should retain
  the extra Maxima split. Unit 8 must distinguish joined hzla sets from sourced IV coverage and preserve unknown EVs.
  No extraction, keys, workbook joins, field review, builds, scenarios or screenshots yet; not a completed unit.
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
