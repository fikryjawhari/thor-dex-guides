# emerald-imperium build notes

## Items standard (2026-10-23)

`tools/itemstd.py` (shared, idempotent) puts every guide's Items in one box set: Valuables, Key Items, Shops, TMs and HMs, Move Tutors, Held Items, Evolution Items, Stats and Abilities, Mega Stones / Z-Crystals, Fossils, Useful NPCs; a sub-heading on every row (`r[4]`), `Found:` / `Wild:` / `Also:` / `Shop:` lines, and the walkthrough's item rows rewritten to match. Run by `stage8_consistency.finalise` (rules: `itemstd.RULES['emerald-imperium']`). TMs + HMs are one box (182, game order); Shops is one row per item (shops one per line, price after the shop; the six berry lists split into single berries; the stray Pomeg Berry row dropped; kind from the item name, `EI_KIND`); the 40 Battle item rewards moved into Held Items (class by item), Evolution Items (Leaf, Shiny, Ice Stone) and Stats and Abilities (PP Max), as `Also: reward, defeat <trainer> <place>` (Leftovers x3 merged); capitalisation fixed (`rename`). Mega Stones (A to Z) and Useful NPCs (A to Z) keep their place text.

## Consistency pass Part B (2026-10-23)

`extract/stage8_consistency.py` is the final, idempotent data extraction step. Stage 7 calls it automatically
after assembling eggs, gifts, shops and trainer boxes; for an already-stage-7 build run
`python -I hacks/emerald-imperium/extract/stage8_consistency.py`. It uses the source-derived encounter availability
and actual trainer teams, not a hand-edited species blacklist. No additional raw inputs are needed for this step.
Historical stages 1-6 still use their original `/home/claude/ei` and upload paths; a complete raw-doc rebuild
was not run in this pass. Those stages need a separate portability pass, not shared extractor changes here.

- Species: 1,275 -> 1,208. Drop 63 unavailable, unused ordinary/form entries and four unused Megas whose base
  species is unavailable (Mega Mewtwo X/Y, Mega Latias/Latios). Megas/Primals require an obtainable base dex number
  or actual trainer use; retain trainer-only Primal Dialga/Palkia with their existing Mega/Primal category.
  Retain all trainer-used species.
- Keep original species IDs, order among survivors, all move/ability/location indices and encounter records.
  Filter links to removed species from `ef`/`et`/`of`; retain Mega Stone item facts but clear any removed-species
  links, including their walkthrough copies. No item regrouping or Part C changes.
- AR[0] is now `Starter`, `st:1`; its location list and index are unchanged. All 159 tracker area indices, egg
  subslots and saved tracker species meanings survive. `cfg.starter: type` was already supplied by Part A.
- Walkthrough retains its nine splits, every stop and step in the same order, now Roxanne 15, Brawly 25,
  Wattson 34, Flannery 47, Norman 59, Winona 68, Tate & Liza 76, Juan 82, Elite Four 85, all named through
  `tools/splits.py` as `<Boss> Split [Cap N]`. Trainers retains 20 boxes; only Champion's box becomes
  `Elite Four Split [Cap 85]`. Trainer keys, sets, placement, cap list and Hot House tiers do not change.
- Published `hack.json` and all localStorage keys remain byte-for-byte unchanged. `LS.dex` stores filter/sort
  state, not species array offsets; tracker `TK.e[area].p` and trades store species IDs. Walkthrough ticks use
  split/stop/step indices, which are unchanged. Saved links to intentionally removed species can no longer open
  a detail page, but no saved ID is reassigned to a different species.

Preservation/rebuild check against the pre-Part-B data:
`python -I hacks/emerald-imperium/extract/check_consistency.py <baseline-data.json>`.
The check verifies the exact keep rule, source-to-output regeneration, idempotence, trainer and encounter
preservation, references, unchanged tables, tracker indices, split count and walkthrough stop/tick keys.

Validation on 2026-10-23: the preservation check passes for all 481 trainer-used species, 159 areas, 106
walkthrough stops and 141 steps. Reapplying stage 8 leaves data.json byte-identical; the three affected Python
scripts compile; `python assemble.py emerald-imperium` builds with 1,208 sprites and no missing-sprite warning.
An EI-only local copy of `tools/consistency-check.mjs` passes normal/dvkb, all five viewer sizes and light theme,
including old area-0 starter migration, picker/type-rival synchronisation, failed/cleared starters, saved ticks,
MGM state and expanded layouts. A local extension compares the old/new runtime FAM maps: every obtainable
species keeps its dupes-clause family ID in both modes. `walkcheck.mjs` and `pagecheck.mjs` pass at 260x316 in
both modes, with no page errors or width overflow; minimum-size screenshots were inspected.
`domcompare.mjs` sweeps all 2,716 baseline routes per mode: zero page errors, hashchange timeouts or unsettled
routes; all routes differ as expected because the footer's species count changes (not an identical-DOM pass).
Logs, baseline data/build and screenshots are local under `.tmp/`, not tracked. No Thor-device testing or
complete stages-1-6 raw-document rebuild was performed; no source refetch was needed.

Moved from the guide's top comment on 2026-10-19 (it was in every built file).

```text
EMERALD IMPERIUM OFFLINE DEX - BUILD NOTES (read this first if you are extending the file)
==========================================================================================

WHAT THIS FILE IS
One self-contained HTML page that works fully offline, built for an Android handheld (AYN Thor).
Same template as the Hardlove Gold dex (CSS, router, list/detail renderers, stat calc), new data.
BATCH 1: Pokemon tab, move pages, ability pages. BATCH 2 (2026-10-02): changes doc, Locations PDF and encounter tracker merged; Locations tab live. BATCH 3: Items tab, Walkthrough tab with cheat codes. BATCH 4 (2026-10-02): Trainers tab (138 boss
trainers, 677 Pokemon) from the boss sheet + hzla calc, trainers inside walkthrough stops, "Used by trainers" on Pokemon pages.
All five tabs are live.

FILE LAYOUT
  <script id="data" type="application/json">   all game data (schema below)
  <script id="spr" type="application/json">    sprite map {speciesId: "data:image/png;base64,..."}
  <script id="build-source" type="text/plain"> the Python builder (build.py), not executed
  <script> (last)                              the app: hash router + renderers
Routes: #/ (list) #/p/<speciesId> (Pokemon) #/m/<moveIndex> (move) #/a/<abilityIndex> (ability)
        #/locs #/l/<LOC index> #/trainers #/tr/<group.section.trainer> #/items #/walk

SOURCES
 1. EI Dex (dex.emeraldimperium.net). Its source is github.com/miriamlefae/eidex (iriv24/eidex is an identical
    fork). Downloaded with codeload.github.com/<repo>/zip/HEAD (no API rate limit). Data files dated March 2026;
    the live site could be newer, so recheck before a rebuild. src/data/:
      speciesData.json   1,534 species/forms keyed by speciesId: types (ids), stats, abilities [a1,a2,hidden]
                         (0 = none), heldItems (wild), levelUpMoves [[moveId,level]], tmMoves (TM/HM, no separate
                         tutor list), eggMoves, dexId, evolutions [[method, targetSpeciesId, param]], forms tags,
                         formId, nameKey, siblings
      moveData.json      type id, power (1 = variable), acc (999 = never misses, 0 on status = never misses),
                         pp, cat (0 Physical, 1 Special, 2 Status), description, properties (flags). No priority.
      abilityData.json   name + description (includes EI originals)
      itemData.json      names (used for evolution items and wild held items)
      typeData.json      type ids 1-19 (10 unused), matchup[defType] x10 for each attacking type
      wild_encounters.json  pokeemerald-style wild tables (land 12 slots, water/rock smash 5, fishing 11
                         split old 0-2, good 3-5, super 6-10). No time-of-day tables in this file.
      speciesLabelMap.json  SPECIES_X label -> speciesId
    Sprites: public/sprites/front/<speciesId>.png, 64x64 RGBA, at most 16 colours, so they convert to palette
    PNGs losslessly (about half the size).
    The site's evolution method codes are in src/utils/parseEvo.ts (copied into EVO in the builder).
 1b. Official "1.3.1 Emerald Imperium Changes (Stats, Types, Abilities, Moves)" xlsx (by Vicfis). Sheets: Pokemon
    Changes, Move Changes (124 moves: type, category, BP, acc, PP, effect text), Ability Changes (30, effect text),
    Data Clean (vanilla cols 0-12 and EI cols 14-26 per species; used for comparison). Merged by stage2_changes.py:
    P.vc vanilla values where they differ, P.cf / MV.cf source conflicts, MV.e + MV.dc doc effect text, AB[3].
    Doc typos ignored (not conflicts): Wartortle "ARAIN DISH", Alolan Grimer/Muk "POWER OF ALCH.", Nosepass type
    "STURDY" (shifted cell), Ash Greninja row shifted, Calyrex "AS ONE ICE/SHADOW RIDER", move "Strange Stream".
    Conflicts kept and shown on pages: Togepi and Snubbull (doc Fairy/Normal, dex Fairy), Kyurem Black/White (stats
    and abilities swapped), Meowstic M/F (Prankster/Competitive swapped), Oricorio Pa'u/Pom-Pom (types swapped),
    Zygarde 10% (doc Inner Focus, dex Aura Break), moves Aqua Fang, Charge Beam, Fly, Octazooka, Strength Sap,
    Thunder Wave, Fury Attack (PP/power/accuracy). 55 moves differ from Showdown Gen 9 but are not in the doc.
 1c. Official "Pokemon Routes, Gift Mons, and Eggs" PDF (EI 1.3, Aug 2025, 77 pages). Wild tables parsed by word
    position with pdfplumber (parse_pdf.py: columns by x band land<165<surf<300<fish<435<rock, rows "name" then
    "lo – hi rate%"). cmp_locs.py: all 124 locations identical to the EI Dex wild data, every slot. Pages 70-77
    (statics, gifts, eggs, roamers, multiple choice) transcribed by hand into ck/specials.py because the
    continuation pages shift columns.
 1d. Official "Emerald Imperium 1.3 Encounter Tracker" Google Sheet (received as pasted text, not a file). Header
    (128 areas, the official order and grouping) and the two 20% grass rows saved in ck/tracker_rows.txt;
    cmp_tracker.py checks them against the dex. Underwater Routes 124/126 merged (tracker: "count as one
    encounter"). Tracker-only data used: Littleroot starter choice (27 starters), Hot House badge tiers, egg pools
    placed in hatch-here areas (Oldale, Verdanturf, Fallarbor, Mt. Chimney, Lavaridge, Fortree), Galarian forms
    of the static birds. Areas not in the tracker (Altering Cave, Artisan Cave, Battle Frontier, Marine Cave,
    Terra Cave, Sky Pillar Top, Roaming) are listed with no tracker slot (AR.ns).
    Conflicts: Mirage Tower 3F slot 1 (tracker Rhydon, PDF/dex Rhyhorn); Route 130 grass Shedinja missing from
    the tracker; tracker omits Sudowoodo, Kyogre, Groudon, Rayquaza, Regigigas, Meltan and the roamers.
 1e. Official "Item, TMs, Mega Stones etc and Useful NPC Locations" xlsx (stage4_items.py): TM & HM Locations (TMs
    cols 0-1, HMs cols 5-6, "TM001 - Move"), Mega Stones (pairs in cols 1-2 and 5-6), Poké Marts items (header row then
    item/price rows; Slateport berries in col 3), Useful NPC Locations (town header, "- " lines), Battle Item Rewards.
    Fixes: "Drain Kiss" = Draining Kiss; "Luxite" (sheet) = Luxrite (game item). Gaps: Mega Flapple has no stone in the
    sheet (Applite maps to Mega Appletun); Mega Rayquaza uses Dragon Ascent. Game item data has no TM move names.
 1f. Walkthrough page https://emeraldimperium.info/walkthrough.html (fetched 2026-10-02), transcribed into ck/walk.txt
    (S split, P place, - step, > note). stage5_walk.py: tracker area groups are anchored to their first mention in a
    place heading or step text at or after the previous group (a far-ahead first mention, like Route 118 via Wake
    in Split 5, does not move the pointer); unmentioned areas become "on the way" stops after the previous group.
    Items are filed under the earliest area or town name in their location text; Latiasite, Latiosite (Southern
    Island) and Diancite (Navel Rock) have no walkthrough place. The page also links the boss sheet and the hzla
    dynamic calc (data=imp13), which should hold real trainer sets for the trainers batch.
 1g. Cheat Codes docx (typed into WK.cheats). The DexNav site (map.emeraldimperium.net) is a JS app built from the same
    encounter data; not used.
 1h. Official boss sheet "Boss Battles" (Google Sheet 1A9iN3N2bZ8-0YCVrhfeZ0qo2runkbHd-HCgaH_TVyr4, by LightGlory, Flash
    Ketchum, iamguitar, PrincessGlaceon, Cap), downloaded as xlsx. NO cell notes exist in the export (only pokepast links and
    type-icon images). parse_sheet.py reads the 12 split tabs (Badge 1..8, Hot House, Evergrande City, Victory Road, Elite 4 /
    Champion; xlsx truncates names to 31 characters, full names came from the text copy). Block layout: title in col C (with
    rewards in col R), species above the "Pokemon:" row in cols F/K/P (may carry "(Lead Slot n)" or "PRE-BURNED"), then
    Level/Nature/Ability/Item/Moves in cols C/H/M, stats/IV/EV in +2/+3/+4, "Speed Stat: a (b)" (a = no EVs, b = with EVs,
    at the cap in the "level cap used" note), extra speed lines (Scarfed, Sun Up, Ability Proc...). Unlabelled rows near
    Ability hold "-> Mega ability". Hot House tab: one section per badge tier with "Player Choice" rewards; the 7 badge
    block has no title for its second team (the calc shows it is Sailor Dwayne). Hidden tabs (Types, the two "Horizontal"
    tabs) and the "Hoenn/Sinnoh Gyms Only" duplicates are not used; the Horizontal tabs are an older version (Roark on
    Route 116 with Shieldon, Candice on Route 125, Flannery with Torkoal). A text copy of the sheet (pasted, from the user's
    Drive; the connector cannot open the sheet id) was spot-checked against the xlsx: 16 of 20 lines identical.
 1i. hzla Dynamic Calc (https://hzla.github.io/Dynamic-Calc-Decomps/?data=imp13, used by the official site). Repo
    github.com/hzla/Dynamic-Calc-Decomps via codeload zip; backups/title_to_backup_mappings.js maps "Emerald Imperium 1.3"
    to backups/imp_1-3.js (backup_moves + backup_data: species -> "Lvl L Trainer Name" -> set with ivs, evs, item,
    level (<=0 = relative to the highest level, like "Highest Lv -1"), nature, ability, moves, tr_id, sub_index,
    battle_type, ai_tags, status). Evaluated with node into calc.json. 1,198 of 2,396 sets are vanilla leftovers (Hardy, no
    item, no ability) and are skipped; the other 1,198 are exactly the boss set (213 trainer names incl. numbered copies
    such as Roxanne2..5, and Hot House tiers under one tr_id). Mega/Primal forms appear twice (base set + "-Mega" copy
    with sub_index 6+); they are folded into the base slot. This is the game's own trainer data (AI flags included), so
    it is the AUTHORITY for sets; the sheet supplies order, titles, places, leads, pre-status, rewards and paste links.
    Pairing (stage6): whole trainers by species overlap + name tokens (127/137), then per Pokemon (doubles with two calc
    trainers search every calc trainer; same dex number allows form names such as Wishiwashi-School). 674 of 677 Pokemon
    have a calc set; the 3 without are the Route 103 rival starters (calc has only vanilla data there).
    Speed check: our formula reproduces the sheet's Speed Stat for 592 of 609 checkable Pokemon at the sheet's own cap;
    the 17 misses are sheet slips (Badge 3 Fantina computed at cap 44 though her note says 34, Wally's Skarmory, etc.).
 1j. stage7_split_ui.py (run in this repo on data.json after stage 6; no sources): the split UI's data. Hatch towns
    (Verdanturf, Fallarbor, Mt. Chimney, Lavaridge, Fortree) get one tracker slot per egg (Fire / Water / Grass egg =
    starter egg by shard, Lavaridge, Pacifidlog egg; the user: any of them can hatch at any of those towns), appended to
    AR; Oldale keeps only its own egg (the user never hatches one elsewhere); Gardenia (Petalburg Woods, cap 20) moved
    to the Wattson split at cap 34 (the user delays her for a stronger team; the walkthrough keeps her stop);
    Littleroot's lab and the gift houses of Rustboro, Mossdeep, Sootopolis fold into the town ("Gift (Devon Corp 2F)");
    trainers regrouped into level cap boxes (the cap 84 box, named "Wally in Victory Road" in the cap list, holds the
    Ever Grande trainers too: called "Victory Road"); shop rows get their shop as a sub-heading ("All free" dropped from
    Verdanturf's rows: gifts there, and the mart sells more).
 2. pokemon-showdown npm 0.11.11 (npm pack, extract dist/data/moves.js and abilities.js): move PRIORITY only,
    plus a comparison to flag EI changes (MV.h) and EI originals (MV.x, AB[2]).
 Not used: NBurhans/emerald-imperium (third-party analysis of v1.3; its world data cites the official
 "General Documents - Locations.xlsx", useful for the Locations batch). A repo containing the ROM was ignored.

DATA RULES
  Dropped: forms tagged totem, gigantamax, tera. Cosmetic duplicates folded: same dexId + identical types,
  stats, abilities and level-up moves keep the lowest speciesId (Alcremie, Vivillon, Unown, Furfrou, Minior
  colours and so on); evolution targets are remapped to the kept form.
  Availability (P.g): 0 = in the wild tables or in the evolution family (both directions) of something that is;
  1 = Mega/Primal; 3 = not in the wild tables (starters, gifts, fossils, statics, legendaries, or unobtainable;
  to be settled by the Locations batch). P.fc = form change (Rotom appliances, Arceus plates, Castform,
  Aegislash and so on: CHANGE dex list in builder) and takes its base form's availability.
  Altering Cave has 9 tables; only the first is live, the rest are skipped. UNUSED_RUBY_SAPPHIRE maps skipped.
  Location order is a hand-written rough Hoenn progression (ORDER in builder); the Locations batch should
  replace it with the official order.
  Move changes compare EI data with Showdown Gen 9; status moves with a nominal 100 accuracy and
  variable-power moves (Showdown power 0) are not counted as changes.

DATA SCHEMA (the JSON in #data; the same for every guide. Key order and what is dropped: tools/schema.py, applied by the
extract's finalise(); hack.json: tools/datajson.py HACK_ORDER. [x] = only guides that have that data, the others omit it)
  Top level, in order: M MV AB P LOC AR [ARO] IT WK TR TC built   (no build markers, no source strings)
  M   [moveName]
  MV  [{t type, c category, bp power or "Varies", ac accuracy or null, pp, pr priority, d description, f flags[],
        h change notes[], [dc 1 = the changes doc lists it, e the doc's paragraph], [cf doc-vs-data conflicts[]],
        [x 1 = hack original]}]
  AB  [[name, description, [1 if hack original, [changed]]]]   (trailing falsy values are not written)
  P   [{id speciesId string, n display name, dex, t[types], a[abilityIdx], ha hidden abilityIdx or -1,
        s[HP,Atk,Def,SpA,SpD,Spe], ef/et [[how, id]] evolves from/into, of[ids] other forms, lv[[level, moveIdx]]
        (level 0 = learned on evolution), tm[moveIdx], [tu[moveIdx] tutors], eg[moveIdx], w[[LOCidx, method, rate,
        levels, note]], g availability (0 obtainable, 1 Mega/Primal, 3 not found / trainer only),
        [hi wild held item names], [stone, sloc: a Mega's stone and where to get it], [nu 1 = Mega not usable],
        [fc 1 = form change], [cf doc-vs-data conflicts[] ("Sources disagree" card)]}]   dex order, base form then other forms
  LOC [sublocationName] in tracker order
  AR  [{n area name, l[LOC idx], [st 1 = the starter picker is this area's tracker], [sub [AR idx] tracker slots the
        area is split into (hatch towns, one per egg), in = the area a slot belongs to], [es the area's encounter
        sections], [map [data URI]], [ns 1 = no tracker slot], [note]}]   (slots are appended after the tracker's areas
        so saved trackers, keyed by AR index, keep their meaning)
  ARO [AR idx] [optional] the Locations page's area order, where areas added later sit at the end of AR (same reason)
  P.w methods: Grass/cave, Surf, Old/Good/Super Rod, Rock Smash (rates are %), Static, Gift, Egg / Starter egg /
  Pseudo egg, Starter choice, Hot House (N+ badges), Choice (...), Roaming (rates "1 of N"); w[4] = how to get it.
  IT  [{n section, k tm|mega|gen|npc, note, r:[[item, text, link (move idx or mega id), missable 1?, sub-heading]]}]
      (the Items standard: plans/items-standard.md)
  WK  {splits:[{n "Name Split [Cap N]" (the cap is read from the name; none after the League), [note],
       st:[{k stop key, n place, a[AR idx], s:[[step, note]], [note], it:[[section, item, text, link]],
       tr [trainer keys], [x 1 = "on the way" stop]}]}], np unplaced items, [docs [[title, text]]],
       [ko {rows, note}], [cheats [[code, alias, text, toggle]], cnote]}
       Stop key k: the stop's identity for saved state. A guide's first build sets it to "split.stop" (its position
       then) and it never changes; when stops are regrouped or reordered the old key stays (a stop split in two gets
       "<key>.f1"), and dex.js migrateWalkState moves the saved ticks / collapse state to the new positions by key.
       Positions in state are "split.stop"; there is no separate legacy table (the root of a key is its legacy position).
  TR  {g:[{n box (= the walkthrough split name), cap, tab sheet tab, [note[]], sec:[{h place, [cap [level, who, where,
       battles left]], [note[]], [opt 1 = optional place], [rw reward choices], tr:[trainer]}]}], caps:[[label, cap]]
       (the page's Level caps table)}
       (boxes are level cap runs named from caps, places runs of one location; Hot House stays one box)
       trainer {k "g.s.t" key, n name, loc place, tags[] (Optional, Double Battle, Back to Back #1, Permanent Rain, Trick
       Room...), [st "Water"/"Grass"/"Fire" or the starter's name = shown if that is YOUR starter], [cap default level
       cap], note[], [rw rewards], [pp pokepast url], [c calc trainer names], [bt battle id shared by trainers fought at
       once], [pl "m"/"f" = shown for that player character], [pt partners [{n, st, pl, p}]], p:[mon]}
       mon {id speciesId (Mega/Primal form when it holds the stone), l absolute level OR r relative to the cap, i item,
       [a0 ability before Mega Evolution], a ability idx (Mega ability for Megas), [ao "A / B" when the slot is random],
       [na nature], iv[6], [ev[6]] (HP,Atk,Def,SpA,SpD,Spe), m[moveIdx], [hp Hidden Power type (from IVs)], [ld lead
       slot], [pre[status]], [x[sheet extra speed lines]], [cf[sheet values that differ from the calc]],
       [src "s" = sheet only]}
  WK stop .tr [trainer keys]: placed by location name within the walkthrough split (gym leaders take the last matching
       stop, others a forward pointer; Route 111 desert fights in Split 5 sit with Mirage Tower; Elite Four with Victory
       Road; fallbacks: Gardenia (post 3rd badge) -> Verdanturf Town, Crasher Wake -> Mauville City).
  Level caps: a trainer's default cap is the cap of the next boundary fight in the Navigation list (Roxanne 15, Rustboro
       rival 20 ... Champion 85); Hot House tiers 2-7 badges = 30/44/56/64/71/80. This reproduces every "level cap used
       for the speed calculation" note in the sheet.
  TC {attackType: {defendType: multiplier x10}}   built (date)

STAT FORMULA (Gen 3+)
  HP    = floor((2B + IV + floor(EV/4)) x L / 100) + L + 10
  Other = floor((floor((2B + IV + floor(EV/4)) x L / 100) + 5) x nature)

LOCAL STORAGE
  "eiwalk" walkthrough {c:{split.stop.step:1}, o:{open splits, gi: Guide info}, x:{closed stops, doc*: open docs}, s:{split.stop.c/e/i/t: section open 1 / closed 0}}, "eitrack" tracker {e:{areaIdx:{p:id} or {f:1}}}, "eidex1" list filters/sort/availability, "eicalc:<id>" calc inputs, "eicalc:lastlv", "eicap" {trainerKey: your highest level},
  "eimgm" "1" = Minimal Grinding Mode (speeds without EVs), "eitr" open trainer groups.
  Rival teams are filtered by the type of the starter recorded in tracker area 0 (Littleroot). The walkthrough's Starter
  picker sets that same tracker value.

TRAINER CONFLICTS (sheet vs calc; the calc wins, the card shows "Sheet says ...")
  68 Pokemon (72 fields): 39 EV rows (mostly shifted rows), 11 IVs, 6 species names (form names or a base name for a Mega holder),
  4 natures (Gardenia Vileplume Bashful/Bold, Hot House Sceptile, Jessica Blastoise, Grace Typhlosion), 4 levels (Edwin
  Ludicolo -3/-2, Charlotte x3 -1/-2), 3 items (Hot House Arcanine "Jolly", Swellow Flame Orb/Muscle Band), 3 moves (rival
  Crobat Haze vs Leech Life on Route 119), 1 ability. Calc gives Battle Girl Jenny's Mega Flapple an Applite (items sheet:
  Applite = Mega Appletun, no stone for Flapple). Walkthrough says Roark on Route 116 in Split 1; the current sheet has
  Candice there and Roark outside Shoal Cave (Split 7).
  Name fixes (the build report lists them): (Lycaroc, Farigaraf, Crygonal, Thunderus, Iron Jugulus, Mabostiff, Trevanant, Bannette; items
  Roseradeite, Infernite, Slakingite, Luxrayite/Luxite, Grimmsnarlite, Alakazamite; moves Extrasensroy, Fishous Rend,
  Stealth Rocks, Scorching Sand; abilities Emperor's Prescence, Gulp Missle, Tablet of Ruin). Items keep readable names
  (the game's item data truncates to 12 letters). Keldeo-Resolute uses Keldeo (folded cosmetic form). New move added to M:
  Behemoth Bash.

NEXT
  Damage calc (the hzla calc engine and imp_1-3.js sets are a good base); save file import (GBA saves are well documented).
```
