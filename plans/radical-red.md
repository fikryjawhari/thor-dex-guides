# Pokémon Radical Red guide: plan

Goal: play Radical Red 4.1 **Hardcore** on the Thor with one guide: dex, every trainer's Hardcore team at the right
cap, walkthrough in order, items, encounters, and the calc with save import. Second guide of the **CFRU family**
(Unbound first): reuse `tools/cfru.py` and the `cfru` calc base / save reader; lift anything both need into shared
code. Sources: `hacks/radical-red/SOURCES.md` (its table and inventory are the map). Started 2026-11-02 from main
`c658a13`.

## Decisions (taken by the main chat while the user is away; the user reviews them before the audit)

Each unit adds the decisions it had to take to **Decisions taken in units** below (one line each, with the source).

- **D1 Mode: Hardcore** (SOURCES.md target). Every card shows the Hardcore team; normal-mode teams are left out
  (they stay in `.src/` for later). The mode goes in the trainer wording (`cfg.txt`), as Unbound's "Expert".
- **D2 Source authority:** the official dex's `data.js` (extracted from the ROM) is the source for species, moves,
  abilities, items, areas, trainers and caps. The author's docs are the check ("Doc says ..." / "Sheet says ..."
  where they differ, listed in notes.md); the Hardcore Main tab is the authority for Hardcore rules. RR Showdown /
  RR calc for move flags and what changed abilities / items do, not for numbers. hzla `radredhc.js` is a third
  check for trainer teams.
- **D3 Trainers:** all 464 `data.js` trainers with their full Hardcore teams (nature, ability, item, moves, IVs, EVs),
  grouped by cap (`TR.caps` = the 18 Hardcore caps from `data.js`). Rival: one team per starter through `t.st`, like
  BB2R / Unbound. Boss levels as given (no scaling unless the sources say a team scales).
- **D4 Walkthrough:** no walkthrough doc exists. Order: the Hardcore sheet's Trainer Order tab for bosses, `data.js`
  area order and cap steps for everything else; stops per area, items and encounters at the step they unlock.
- **D5 EVs:** follow what the sources say for player EVs (the unit records it); Hardcore bosses have no EVs except
  Ghost Marowak (Hardcore Main tab). `cfg.mgm` false.
- **D6 Calc:** `cfg.calc.base` = `cfru`, Megas and Z-moves on; the Hardcore AI's permanent weather / terrain through
  the trainer field review (`setterStays`); RR's changed abilities / moves as `over` entries from RR calc
  `gen789.ts` and Showdown `gen9rr`; RR calc (`repos/damage-calc`) is the oracle for engine fixtures.
- **D7 Save import:** `cfg.calc.save` = `cfru` (the Unbound reader), with RR's ID tables (`GID` from `data.js`
  game IDs, checked against hzla's `radical_red_*_constants.js`). No save file: ships provisional; a real import is a
  PROGRESS.md Open check (the user's `.srm`).
- **D8 Species kept:** EI's / Unbound's prune rule (obtainable species and forms, species trainers use, Megas whose
  base is obtainable).
- **D9 Version 4.1**, storage prefix `rr` (`rrdex`, ...).
- **D10 Sprites:** the shared set; RR's own forms from `data.js` sprites into `sprites.json`.

## User's answers (2026-11-02; these override any unit decision below)

- **Splits = the 18 Hardcore caps** (Main E44:E78): Pre-Brock 16, Pre-Mt. Moon Archer 23, Pre-Misty 28, Pre-Lt. Surge
  36, Pre-Erika 44, Pre-Game Corner Giovanni 47, Pre-Silph Co. Archer & Ariana 56, Pre-Giovanni Silph Co. 57,
  Pre-Sabrina 59, Pre-Koga 68, Pre-May 73, Pre-Blaine 76, Pre-Cerulean Cave Archer & Ariana 79, Pre-Cerulean Cave
  Giovanni 80, Pre-Clair 81, Pre-Brendan 82, Pre-Elite 4 85, Post Game 100. Split names in the guide follow these.
- **The Trainer Order sheet wins over data.js caps** for which split a mini boss is in: Justin (Route 12) in the Koga
  split (68, not 36); ~~Lewis (Pokémon Mansion B1F) in the May split (73, not 76)~~ superseded (unit 10): Lewis after
  May, Pre-Blaine, cap 76.
- **Variable-cap trainers:** a Trainer Order entry with a range or open cap ("28/36", "36+", "59/68", "81+") is
  fought at whichever cap the player is at; its card gets the "Your level" cap box (Unbound's relative levels: `r`
  = level − cap, default the split's cap, saved per trainer key in `LS.cap`). Use data.js's scaled-level codes
  (101-104) where they say how a level follows the cap.
- **Gym rematches (Hardcore):** Brock / Misty / Surge / Erika rematches: at least 3 of the 4 must be beaten before
  Koga. They go in the Koga split as required-choice fights (one note: "beat at least 3 of these 4 before Koga"),
  with the cap box (sheet 59/68).
- **Review of the built guide (2026-11-02, second round; units 10 / 11 applied it):** the Trainer Order tab's **row
  order** decides each mini boss's split (not its cap number); a hard line at Lt. Surge (Route 9, Rock Tunnel, Route
  10, Route 8 and the Dojo after Surge); S.S. Anne one visit after Misty; the optional Johto leaders and Whitney as one
  group in Pre-Erika (Bugsy's pre-Surge team in Pre-Lt. Surge, post-Surge team with the group; Pryce / Jasmine stay at
  their 73+ rows: Surf); mini bosses come before the ordinary trainers they gate; ordinary trainers sit in the split of
  their walkthrough visit; Route 16 north with Cut; Kindle Road / Bond Bridge / Mt. Ember order doesn't matter.
  The calc must match the game (per-guide engine switches are fine): unit 11 modelled all but Gulp Missile.
  Care-package (red / blue) and red tutor exclusions confirmed; egg pools reduced to one line per egg type.
  Every other unit decision below was reviewed and stands.

## Decisions taken in units

(units append here: `- [unit] decision (source)`)

- [unit 3] Use the Trainer Order spine with 18 unchanged Hardcore caps, but keep recommended visit split separate from source unlock/default cap; a bucket is not a physical door lock (Main E44-E78, Trainer Order's 28/36 and 36/44 ranges, data.js areas/caps; full route in radical-red-walk.md).
- [unit 3] Place all 221 source areas and 464 trainer identities; resolve duplicate area references for Simon 218, Tammy 447 and Anthony 531 using each trainer's own cap/areaName, not the stale area membership (data.js trainers and areas 12/13, 86/88, 173/183).
- [unit 3] Silph Brendan 55 and Cave Lance 39 are partners, not enemies; Ketchup 20 then 19 is a next-day rematch, Oak 200 then 210 is back-to-back, and numbered gauntlets override source array order (Team Rocket E240/E409, Optional Bosses E148/E176, Postgame E28 and gauntlet headers; locations Statics F116).
- [unit 3] Brock/Misty/Surge rematches are optional in Hardcore; Bugsy 47/8 are pre-/post-Surge versions, not two mandatory battles; genuine team alternatives remain distinct source identities (v4.0 changelog opening, Johto Leaders E27/E52, data.js).
- [unit 3] superseded (unit 10): Retain data's Justin u3/36 and Lewis u11/76 while flagging Trainer Order F231=68 and F366=73; recommend Justin on the post-Sabrina southbound circuit and Lewis after May (data.js trainers 477/219, Main caps, Trainer Order).
- [unit 3] Postgame ticket prerequisites are only the NPC's suggested opponents plus Gengarite, not an invented exhaustive boss list; ring gates chambers, and optional circuit order/ordinary spatial paths stay labelled guesses (item sheet F422, v3.0 changelog; unresolved Red/Abigail geography and Seafoam race floor recorded in radical-red-walk.md).
- [unit 1] Preserve all 1,343 game species/form IDs until D8 pruning; distinguish numeric cosmetic mirror forms, expose egg groups through dex.egg_groups, and log source species changes rather than adding unsupported P fields or a prohibited changes card (data.js, tools/schema.py, shared UI rule).
- [unit 1] Exclude unused Placeholder and generated Z/Max move records; normalise CFRU names, keep Struggle typeless, and preserve hidden/primary/secondary source ability order (data.js, official dex src/displayMethods.js).
- [unit 1] Allow disabled calc in item_text.generation and register Radical Red's item-text generation as 9; cfg remains untouched (scaffold cfg.calc=false, RR 4.1 Gen 9 additions).
- [unit 1] Use official dex secondary chances over Showdown, label freeze effects frostbite, and derive only Metal Bash's contact/target metadata from its in-game description; normalise Inferno Parade to Infernal Parade (data.js, gen9rr/moves.ts, v4.0 changelog).
- [unit 1] Split the game's two As One IDs into Spectrier/Glastrier names and use learned canonical Leech Life ID 141 (15 PP), not the unused Leech Fang copy 355 (10 PP); do not invent the four absent hzla abilities (data.js, hzla radredhc.js).
- [unit 1] Preserve source sprite pixels using palette PNG conversion; leave Chillet's letter fallback because neither data.js nor the shared set has its art, and use actual transformation parents for regional Mega pruning (data.js sprites/evolutions, sprites/index.json).
- [unit 7] GID from data.js game ids; growth rates from RR's 2023 Base_Stats.c (derived `extract/growth.json`), the 16 later species Medium Fast; battle-only forms (Megas too) read as their base; hzla's by-name ability table not used (data.js, hzla id tables, ydarissep/Radical-Red-Pokedex 65712ed, RadicalHex build-data.py).
- [unit 7] cfru.js profile `radicalred41`: retail signature 0x08012025, named only (Unbound unchanged), a vanilla save refused by its retail checksum windows, only the ability randomiser (0x942) refused, pokefirered experience formulas; `cfg.calc.cfru = "radicalred41"` needed (RadicalHex 3697412 / PKForge 2df0443 from real RR saves, hzla's reader).
- [unit 2] Superseded: the main chat authorised one engine extension, `over.abilities[name].statusImmune` (Toxic Boost / Flare Boost chip; RR changes v3.1:46,49; Showdown gen9rr/abilities.ts:240,691); `cfg.calc` is enabled.
- [unit 2] EVs as Photonic Sun's EV-less play: `evs` stays on, player sets default to 0, trainer EVs count (Ghost Marowak 252 HP) (Hardcore Main!E95).
- [unit 2] `setterStays: true` for Hardcore's permanent AI weather / terrain; the player's setters follow the same switch (Main!E10; profile-level setting only).
- [unit 2] Draco Barrage turns Physical when boosted Atk > SpA (Showdown gen9rr/moves.ts:247-266, dex description) though RR calc keeps it Special; recoil 1/3 (Showdown), not RR calc's 33/100.
- [unit 2] Mega Stone records only for 4.1 Megas (`data.js` forms): Applite (Flapple, Appletun) added; Duraludite / Grimmsnite left out (4.1 changelog:14, no form in data.js).
- [unit 2] Engine gaps recorded, not built (main chat's answer 1): Speed modifiers (Quick Feet 2x, Flower Gift / Bull Rush / Upgrade / Leek Stick), Shield Dust hazard immunity, Soul Robbery theft, Defog keeping terrain (Main!E12), Bad Company self-drops.
- [unit 2] Move effects stay in `hack.json` `over.effects` until `data.json` exists (effects_check.mjs needs it for `calc_effects.json`); the finishing unit moves them.
- [unit 5] Items show the Hardcore view only: "(DEFAULT MODE(S) ONLY)" / "(REGULAR MODE)" rows, the Main tab's unobtainable items (pickups, shops, care packages, wild holders), the red / blue care package items (Hardcore turns MGM on) and the red tutors go; the swapped Mega Stones, quest wording and Route 4's 4 PP Ups are the Hardcore ones (Main E24-E40, E81, E95; item sheet notes and colours).
- [unit 5] The Overworld Items tab is the place text, data.js the check of what lies where: rows pair with data.js entries only within their heading's areas; data.js-only pickups get a data.js line, sheet-only gifts stay; Waterium Z stays with Gian in Saffron (both sheet tabs) though data.js files it under Cerulean Gym (data.js areas, item sheet).
- [unit 5] Consumables and sell items are not listed (shops still are), Valuables = Shards, Heart Scales, Beast Balls, as Unbound (the user's 2026-10-30 rule there); Poké Mart stock is one "Any Poké Mart" line at FireRed's prices, which the sheet doesn't give (pokefirered items.json).
- [unit 5] Care packages are Also lines "Care package · <when> · xN" (the sheet's headings), paired with data.js item-cheat areas for walk.py; data.js's Viridian City Rare Candy / Pomeg Berry (no package) left out (item sheet Care Packages, data.js).
- [unit 5] Leek Stick keeps RR's name (data.js, Showdown) and has no icon; Houndoomnite / Fight Memory are renamed to the standard spellings (item_text.ALIASES) so they get icons; item text "changed" = differs from FireRed's bag text or RR changed the effect (pokefirered items.json, gen9rr items.ts).

- [unit 4] One sublocation per data.js area (221) and one tracker slot per place with floor / room suffixes removed (153 places, 67 with no encounters as `ns`) (data.js areas, Unbound's floor grouping).
- [unit 4] Each encounter key's cap step shown as its Hardcore level in the group label and row notes ("cap 22"): the template has no per-row cap field (template/dex.js encounter sections, data.js keys).
- [unit 4] Grass uses FRLG's 12 slot rates, Surf / Rock Smash 60/30/5/4/1, rods 70/30, 60/20/20, 40/40/15/4/1; the data.js entries are in slot order (standard FRLG, data.js).
- [unit 4] Obtainable = found, or first same-dex base found, or evolved from an obtainable species (Unbound rule): 1192 obtainable, 83 not found, Megas g 1 (Unbound locs.py, data.js).
- [unit 4] Multi-entry fixed gift lists are "Gift (pick one)" with "1 of N" until the sheet says otherwise (data.js fixed-gift lists; sheet check in step 2).
- [unit 4] data.js stays the encounter source; the locations sheet only adds what it lacks, from a committed hand table `extract/sheet_locs.json` (its tabs are irregular), and sheet-vs-data differences are kept in notes.md, as row notes only where they change what the player does (sheet, name-matched compare).
- [unit 4] Oak's Lab's 27 entries are the Starter choice (method `Starter choice`, AR `st`, the `cfg.starter = "pick"` picker), as Unbound / EI do (data.js Oak's Lab, Unbound locs.py).
- [unit 4] Vermilion Fan Club's 10 fossils are a Shard trade by colour (no "1 of N") and Celadon Mansion's 42 entries random Shard eggs ("1 of 9" / "1 of 8", the Yellow "Any Cap" slot shared by 7 cap Pikachu); Mt. Moon's Helix / Dome pair added as "Fossil (pick one)" at the Fan Club; Aerodactyl stays the Fan Club gift, noted Old Amber from Pewter Museum (sheet Fossils / Egg Vendor tabs).
- [unit 4] The 19 Lv 85 Mystery Gift legendaries go in an appended "Mystery Gift" LOC / AR place with no tracker slot (`ns`), codes left out, "Code at a Pokémon Center Nurse after the Hall of Fame" (sheet Mystery Gifts tab, Unbound's Mystery Gift area).
- [unit 4] Water tables data.js has none for (Fuchsia City rods and Surf, S.S. Anne Port Super Rod and Surf) added as "Doc only" rows; Route 11 Surf (Tentacool Lv 5-40, vanilla) not; the sheet's Seafoam floors are one floor off data.js, not differences (sheet Fishing & Surfing / Grass & Caves tabs).
- [unit 4] Raid notes give each drop slot's chance (100/80/80/50/50/30/30/25/25/5/4/1%); data.js's star tiers and drops kept where the sheet differs (8 dens ★★ vs raid1, Loyal Three den, Rock Tunnel B1F Star Piece / Nugget) (sheet Raid Dens tab, data.js).
- [unit 4] Wonder (256 / 339), Paldea (42) and Sevii (12) Egg pools are rows "1 of N" on the selling city at its badge step, 1,084 rows (Wonder Egg Pools workbook).
- [unit 4] Obtainable also by breeding (pre-evolution of an obtainable species) and for forms that follow their base (Greninja-Ash, Cherrim-Sunshine, Unfezant-F); the sheet's Unobtainables are g 3 and Enamorus is a postgame roamer: 1,235 obtainable, 40 not found (Arceus, Eternatus, Magearna-Original and forms), matching the sheet's 1023/1025 (sheet Unobtainables / Statics tabs).
- [unit 6] superseded (unit 10): A numeric Trainer Order cap places the trainer in that cap's split even when listed after its boss (Lewis 73 → Pre-May, Justin 68 → Pre-Koga); a range / open cap keeps its Trainer Order position (recommended split) and gets the cap box at that split's cap (Trainer Order F3 comment, the user's answers).
- [unit 6] Box names are the user's split names through the shared rule: "Pre-Brock Split [Cap 16]" ... "Post Game Split [Cap 100]"; the calc shows "Pre-Brock" (tools/splits.py, Main E44:E78).
- [unit 6] The rival follows the player's starter TYPE (`t.st` Fire / Grass / Water): 27 starters are offered, so hack.json `cfg.starter` must change from `pick` to `type` (unit 9 / main chat; not changed here) (Main E93, data.js area 3).
- [unit 6] data.js IVs / EVs are in game order (HP, Atk, Def, Spe, SpA, SpD) and are reordered; trainer ability slot 0/1/2 = hidden / primary / secondary, empty or 3 = primary; a Mega keeps the slot (RR calc and sheet agree).
- [unit 6] Jasmine 63 / 64 share 62's Hardcore team: one card; Brendan 55 and Lance 39 are partners (`pt`); 464 = 460 cards + 2 + 2 (data.js, unit 3).
- [unit 6] Sheet differences show as "Sheet says" (11 mons); hzla only where the sheet also differs (its ability slots contradict both data.js and the sheet elsewhere); RR calc differences in the report only (hardcore.js, radredhc.js).
- [unit 6] The sheet's BATTLE EFFECT lines are the field evidence: primal weathers locked, terrains permanent, Swamp / Magma Storm / Magnet Rise text only; "Permanent Tailwind" is the boss's side (guess); duo classes are doubles (47 doubles); the 71 setter teams without a battle effect rely on `setterStays` (Main E10).
- [unit 6] The four gym rematches are not tagged Optional (3 of 4 required) and carry one trainer note each; the Berry Forest Spirit block (Postgame!C1175) has no data.js trainer and is left out.
- [unit 8] superseded (unit 10, now route.py, shared with trainers.py): The walkthrough route is a hand table in walk.py (`ROUTE`), one line per stop, with semantic stop keys written there (Unbound's scheme), not "split.stop" positions (Unbound walk.py, the brief).
- [unit 8] superseded (unit 10): Places whose fights sit in two boxes are visited once per box (S.S. Anne cabins before Misty, halls and Cut after; Route 9 / Rock Tunnel / Route 10 / Route 8 ordinary trainers before Lt. Surge, their mini bosses before Erika; Mansion B1F Lewis before May) so every stop holds only its split's fights (unit 6 boxes, the user's answers).
- [unit 8] Pickups go to their area's stop in their own cap step's split, else the split before (boss rewards), else the first later visit; 8 area-less lines by item; all 451 placed, np empty (items.PICKUPS, data.js steps).
- [unit 8] Rock Smash / Strength return items (step 9 at Route 2, Viridian Forest Heart, Mt. Moon, Route 6, Rock Tunnel, Celadon) get small Pre-Koga stops beside the gym rematches; Surf ones (step 10) a Pre-May Surf circuit before May (data.js steps; the order is a guess).
- [unit 8] Story steps kept to gates and gifts (Tea, Cut, Card Key, Lapras, Lift Key, Poké Flute Snorlax, Gold Teeth, Secret Key, Kubfu, Mystery Gifts, Enamorus); no route prose (CLAUDE.md, unit 4 story stops).
- [unit 9] Eggs (the user's answer): each vendor place gets an AR note "Wonder Egg / Paldea Egg: a random Egg from an NPC here, 5,000$" / "Sevii Egg: from the Aide ..." (Pewter, Cerulean, Vermilion, Celadon, Fuchsia); only species no other way gives (not found, evolved or bred) keep one P.w row naming the egg type at its first vendor: 2 (Phione, Minior). P.w 2,635 -> 1,553 rows; the guide 4.50 -> 4.28 MB.
- [unit 9] Item names are fixed once, in common.ITEM_FIX (Houndoominite, Aloraichium Z, Pikashunium Z, Fighting Memory added: the calc engine's spellings), so GID shows them too; items.py's sheet alias Houndoominite -> Houndoomnite went (it now pointed backwards). Pickup keys p209 / p439 renamed in place (no new keys; the guide is unpublished).
- [unit 9] Move names: Inferno Parade / Soupercell Slam -> Infernal Parade / Supercell Slam in cfru.CFRU_NAMES (common.py's MOVE_FIX removed); cfg.calc's 12 raw ability aliases and the raw names in 4 rules removed; the check's alias variants became guards (override names are guide names, no CFRU short spelling in data or rules), still 71.
- [unit 9] Hardcore-removed tutor moves: one list, items.hardcore_gone_tutors() (red on the Move Tutors tab, no Hardcore tutor teaches it: 23 moves), used by the Items tab and dex.py's P.tu (and the mirror compare, so the report doesn't list them as mirror-only).
- [unit 9] Item icons: `item_icons.py --fetch` regenerates every guide's map, and the other guides' data changed after the index was built (a full regenerate drops BB2R's Bridge Mail art, Unbound's "5% ..." held-item keys ...): only the radical-red map, its 12 new PNGs and provenance were added; everything else is as committed (`item_sheets.py --check` passes for all). A full regenerate is a separate decision.
- [unit 10] The user's rulings (2026-11-02) replace unit 6's placement and unit 8's order: every Trainer Order entry in the split its row sits in (Justin Pre-Koga; Lewis Pre-Blaine at cap 76, after May); ordinary trainers in the split of their walkthrough visit (`route.visit_split`: the stop that lists them, else a stop at their place in their data.js cap step's split, else the first later one); ROUTE moved to `extract/route.py`, read by trainers.py and walk.py (Trainer Order, the user's rulings).
- [unit 10] Johto group = Bugsy after Lt. Surge (8), Whitney, Morty, Chuck: one Pre-Erika stop `johto-leaders` before the Celadon Gym, cap box, Optional; Bugsy before Lt. Surge (47) in Pre-Lt. Surge. Pryce (Seafoam) and Jasmine (Cinnabar Lab), "73+" in the sheet, need Surf, so they keep their rows (Pre-May / Pre-Blaine) though the brief named them (Johto Leaders tab, data.js areas 20 / Cinnabar Lab).
- [unit 10] Hard line at Lt. Surge: Pre-Lt. Surge = Bugsy 47, Dig House Grunt, Jeff, one S.S. Anne visit (cabins + hall doubles + Brendan + Cut), Route 2 / Pewter Museum by Cut, Vermilion Gym; Route 9 to Celadon, Route 16 north (first Cut-reachable visit: from Celadon) and the Dojo are Pre-Erika in row order (75 ordinary trainers moved: 12 cap 28 -> Pre-Lt. Surge, 63 cap 36 -> Pre-Erika).
- [unit 10] Mini bosses first, per place (data.js area name) in a stop, in row order; gyms keep trainers, mini boss, leader; the cap boss last, Archer with Ariana (Silph 11F tag battle, Cerulean Cave 1F). Gaps taken literally: S.S. Anne Brendan goes before the 2F cabins; Cerulean Cave Grunt 1 / Grunt 2 before their floor's grunts; Silph 7F's rival before 7F's grunts; Route 13's / Route 15's mini bosses before their ordinary trainers.
- [unit 10] Scaled-level ordinary trainers (the Lavender EXP Farm Friendly Coaches) follow their new box's cap, as the game scales them to the cap at the time of the fight. Stop keys gone (unpublished): ss-anne-cabins, route-11-whitney, route-9-picnickers, rock-tunnel-dana, route-10-herman, lavender-morty, route-8-aidan, saffron-chuck, mansion-lewis; new: johto-leaders. Trainer / pickup keys unchanged.
- [unit 9] Calc scenarios: the setterStays check picks the first setter team with no battle effect (Pokemaniac Herman, Drought Ninetales); the save check uses a synthetic Unbound 2.1 save (valid sectors and checksums, filled so it can't read as a vanilla save).
- [unit 11] Speed: one generic hook, a `speedMods` rule phase (the modifier list getFinalSpeed chains), so the readout, turn order, Electro Ball / Gyro Ball and Sonic Slash all follow; RR's five rules use the existing vocabulary. Quick Feet: remove stock's 6144, append 8192 (Showdown gen9rr abilities.ts:505-511; RR calc util.ts:115).
- [unit 11] Flower Gift reads the guide ability name (RR's profile switches stock Flower Gift off) and the guide's `Cherrim (Sunshine)`; the existing Attack rule only listed `Cherrim-Sunshine`, so the Sunshine form's 1.5x Atk was missing in the built guide: fixed (abilities.ts:251-263).
- [unit 11] Leek Stick Speed: Farfetch'd and Galarian Farfetch'd (Showdown keys on baseSpecies `farfetchd`; RR calc names both), not Sirfetch'd (items.ts:902-917).
- [unit 11] Shield Dust / Frozen Mist hazards: `hazardImmune`, Heavy-Duty Boots' stop; a Poison holder still absorbs Toxic Spikes, as Showdown checks Poison first (moves.ts:1129-1135). Frozen Mist shares Shield Dust's data.js text.
- [unit 11] Defog: a record key (`keepTerrain` on RR's Defog in calc_effects.json, next to the other Main!E12 moves) rather than a profile switch: the change is per move, and the other three already live there.
- [unit 11] Soul Robbery is not Spectral Thief renamed (Psychic, Special, 100 vs Ghost, Physical, 90; moves.ts:1000-1015) but steals the same way (scripts.ts:495-519; RR calc gen789.ts:465): `over.state['Soul Robbery'].theft = 'stock'`, no alias, so it keeps its own data.js record.
- [unit 11] Bad Company: `selfDropImmune` (Showdown onTryBoost drops negative boosts whose source is the holder: its own sb, Curse, Shell Smash) and `mindBlownRecoil: false` (onModifyMove); recoil stays the Rock Head alias (abilities.ts:2-20).
- [unit 11] Magmarizer: `items.afterHit` (Showdown onSourceHit, before self drops and secondaries, not stopped by Sheer Force / Shield Dust); skipped when the target's Tar Shot switch is on or its Speed is at −6; a landed one turns the switch on (items.ts:514-526).
- [unit 11] Parasitic Waste: drain 1/2 for damaging moves whose effect record has a psn / tox secondary, any chance (abilities.ts:400-416).
- [unit 11] Protosynthesis: stays on in Sun under Cloud Nine / Air Lock, but not in Harsh Sunshine: Showdown's check is `weather !== ('sunnyday' || 'desolateland')`, which is `!== 'sunnyday'` (abilities.ts:469-479). The calc can't tell whether it was on before the suppressor came in; it takes on (the case the code comment describes).
- [unit 11] Not modelled: Gulp Missile (the engine has no Gulp Missile reaction for any guide; RR only swaps Def −1 for Spe −1 inside it). No number changes: Sage Power's and Upgrade's move locks.

## Units

Each unit: a Sol agent in its own worktree, branch off `worktree-radical-red` at the SHA given in its brief, commits
after every working sub-step (`WIP:` when incomplete), touches only its files and its own notes.md heading. The main
chat merges units into `worktree-radical-red` one at a time and rebuilds data.json there.

| Unit | Files | After | Status |
| --- | --- | --- | --- |
| 1 Dex ✓ merged | common.py (data.js reader, `sid` / `move` / `ability` / `item` lookups), dex.py, moves.py, prune.py, gid.py's ID-table half if cheap, sprites.json, notes Dex | scaffold | |
| 2 Calc mechanics ✓ merged | hack.json `cfg.calc`, tools/calc/radical-red_check.mjs, notes Damage calc | scaffold | |
| 3 Walk research ✓ merged | plans/radical-red-walk.md (order table only; no code) | scaffold | |
| 4 Locations ✓ merged | locs.py, notes Locations | 1 | |
| 5 Items ✓ merged | items.py, item_desc / battle_text / item_text_extra json, `P.hi`, itemstd RULES entry if needed, notes Items | 1 | |
| 6 Trainers + caps ✓ merged | trainers.py, trainer fields review, notes Trainers / Caps | 1 | |
| 7 Save IDs ✓ merged (finish: set `cfg.calc.save` "cfru" and `cfg.calc.cfru` "radicalred41") | gid.py, notes Save ID tables | 1 | |
| 8 Walkthrough ✓ merged | walk.py, notes Walkthrough | 3, 4, 5, 6 | |
| 9 Finish ✓ merged | cfg wording, check.py, calc scenarios / doubles count / fields counts, sprites check, report review | 8 | |
| 10 Order rework ✓ merged | trainers.py, route.py, walk.py (the user's second-round rulings) | 9 | |
| 11 Calc mechanics ✓ merged | engine keys speedMods / hazardImmune / keepTerrain / selfDropImmune ..., RR profile | 9 | |
| Audit | below: Audit and merge | 10, 11 | next |

## Finishing unit inputs (collected from unit reports)

- ✓ (unit 9: scenarios, EXPECTED 47; trainer_fields_check already 47 / 108 records) `cfg.calc.save` / `cfru` are set (main chat, after units 2 / 7). Calc scenarios (`tools/scenarios/calc-radical-red.mjs`
  still throws), calc-doubles EXPECTED, trainer_fields_check counts.
- ✓ (unit 9) Move `cfg.calc.over.effects` into `hacks/radical-red/calc_effects.json` now that data.json exists (`effects_check.mjs`).
- ✓ (unit 9) `tools/cfru.py` names: "Inferno Parade" -> Infernal Parade, "Soupercell Slam" -> Supercell Slam; then prune the
  profile's raw-name aliases.
- ✓ (unit 9: four were still raw, in GID) data.js item misspellings the engine won't know (Charzardite X/Y, Blastoisnite, Aerodactlite, Houndoomnite,
  Kangaskanite, Alorichium Z, Pikshunium Z): standard names (unit 5 may have done it; check).
- In-game checks in notes → Damage calc and Save import go to PROGRESS.md → Open.
- ✓ (unit 9: 17 left without art) Item icons: 72 names with none (most TMs, FireRed key items): `tools/item_icons.py --fetch` to give the shared icon
  index a `radical-red` map, then `tools/item_sheets.py radical-red`; Gen 8-9 items with no art in any pinned set stay
  without.
- ✓ (unit 9) `P.tu` (dex.py) still lists the tutor moves Hardcore removes (unit 5 dropped them from the Items tab): drop them.
- Item text written by hand with no source: DexNav, Necromizer (a guess), Time Changer. Red Orb / Adamant Orb: no
  source places them.

## Audit and merge (next session)

State at handover (2026-11-02): `worktree-radical-red` HEAD `8c29623`, main `c658a13` (main has not moved since the
branch merged it). Nothing pushed. Leftover T3 agent worktrees under `C:\Users\fikry\.t3\worktrees\thor-dex-guides\`
(branches `t3/*`): all merged or abandoned; remove them after the merge (`git worktree list`, `git worktree remove`,
`git branch -D`). The old 2026-10-19 RR sources copy is parked in main's `.tmp/rr-src-old-2026-10-19` (superseded by
`hacks/radical-red/.src`, which now lives in the main checkout; delete the parked copy once the merge is done).

### What the audit must cover (why the full set)
- **Template / shared changes on this branch** (every guide is affected): the calc engine (`template/calc/engine.js`
  regenerated by units 2 and 11: optional keys `statusImmune`, `speedMods` phase, `hazardImmune`, `keepTerrain`,
  `selfDropImmune`, `mindBlownRecoil`, `afterHit`, `drain`, `keepsOnSuppressed`; other guides set none), the save
  reader (`template/calc/readers/cfru.js` profile `radicalred41`, named only), `tools/cfru.py` names, `tools/itemstd.py`
  RULES entry, `tools/item_text.py` (RR's generation, aliases), `tools/trainer_fields.py` (RR field effects),
  `tools/item_icons.py` (RR map only), the readers README.
- **Expected other-guide data changes:** RR's `extract/item_desc.json` joined the shared item-text pool
  (`tools/item_text.py`), so rebuilding other guides can change some item texts (Unbound: 5 items). These are
  intended: rebuild each affected guide (`uv run python -I hacks/<hack>/extract/build.py`), commit its data.json /
  report.txt on this branch with a message saying why, and list the changed items.
- **Known pre-existing failures** (fail the same at `0295f58` / main): `tools/test_item_icons.py` (other guides'
  icon coverage counts are stale; a full `item_icons.py --fetch` regenerate would drop art such as BB2R's Bridge Mail:
  the user hasn't decided, leave it), Emerald Imperium's Empoleonite D / O pickup-key drift in `gate.py check --data`
  (reproduces at the baseline). Report them as pre-existing, don't fix them in the audit.

### The audit agent (dispatch from the main chat; Opus medium, or Haiku medium split into parts if Opus is short)
Brief, task first:
1. Setup in its own T3 worktree: `git reset --hard <HEAD of worktree-radical-red>`; `python -I tools/worktree_setup.py
   <every hack> --session rr-audit` (links every guide's `.src`; the gate rebuilds every guide); `cd tools/calc &&
   npm ci`. Read CLAUDE.md, `.agents/skills/verify/SKILL.md`, `.agents/references/worker-brief.md`, this section.
2. Baseline at main: `uv run python -I tools/gate.py baseline main` (RR has no baseline there: it's new; its checks
   are its own extract / calc / scenario runs).
3. `uv run python -I tools/gate.py check --jobs 8` over all seven guides, in pieces as CLAUDE.md says (scenarios
   `--jobs 8`; domcompare normal and `--kb` per guide against main's build; ~45-60 min in total). Logs to
   `.tmp/rr-audit/`.
4. Classify every FAIL / difference: (a) intended by this branch (engine keys appear only in RR's profile; RR's item
   text in the pool; the RR guide itself), (b) pre-existing (above), (c) a regression. For (a) data changes: rebuild
   and commit as above. For (c): stop and report with the failing check, guide, route and screenshot path
   (`.tmp/calc-checks/` or the gate's), no fix.
5. RR at the viewer sizes: `node tools/mockup/walkcheck.mjs` (or the frame checks the verify skill names) at 260 × 316
   and 480 × 392, normal and `dvkb`, on Trainers, Walkthrough, Items, Locations, the calc page; no page wider than the
   viewport, no page errors.
6. Saved state: `tools/scenarios/guide-update.mjs` and `stable-keys` pass on RR; RR's `cfg.ls` keys are `rr*`
   (`hack.json`), trainer / pickup / stop keys stable across two builds.
7. Report: pass / fail per check with evidence (counts, log paths), the (a) / (b) / (c) lists, commits made. Commit
   after each sub-step (`WIP:` if incomplete). Never push or merge.

### Answering the audit agent (back and forth)
- The agent reports, it doesn't decide product questions. A (c) regression: the main chat finds the unit that caused
  it (`git log --oneline main..worktree-radical-red`, one merge per unit) and either fixes it on the branch or
  dispatches a fix agent with the failing check, then reruns **only** that check, then a new audit round
  (`delegate_task` again with this brief + the previous findings + what changed; new `clientRequestId` per round).
- A question about the guide's content (order, caps, what's shown): the user's rulings above settle most; anything
  else goes to the user.
- A difference in another guide that isn't item text, an engine key, or a known pre-existing failure is a regression
  until shown otherwise (domcompare route + the commit that changed it).

### After a clean audit
1. Merge `worktree-radical-red` into `main` (from the main checkout; only one session on main): `git merge --no-ff
   worktree-radical-red`, then `python assemble.py` and a quick `gate.py check --data` on every guide (or rebuild
   their data first if the audit committed item-text changes on the branch: they come along in the merge).
2. Docs: PROGRESS.md (seven guides on main; RR's Open items: in-game checks from notes → Damage calc / Save import /
   Walkthrough open order questions, a real `.srm` import, Gulp Missile not modelled, 17 items without icons, Chillet
   without a sprite), `template/README.md` if any rule changed, CLAUDE.md gate timing (seven guides). Delete this plan
   and `plans/radical-red-walk.md` (lasting decisions already live in notes.md; git keeps the plans).
3. Ask the user before pushing `main` (it publishes the site). Then delete the branch and worktrees (local and origin).
