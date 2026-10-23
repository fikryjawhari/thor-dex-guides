# hardlove-gold build notes

## Consistency Part B (2026-10-23)

- `extract/consistency.py` applies the agreed data changes to a published build, idempotently:
  `python -I hacks/hardlove-gold/extract/consistency.py`, then `python assemble.py hardlove-gold`.
  Both the raw `extract/build.py` and the existing `extract/split_ui.py` also call this finaliser.
  Split names use the committed shared `tools/splits.py`; no shared extract code changes are needed.
  `split_ui.py [data.json]` also accepts an output path for rebuilding away from the published file.
  The hack-only `dex.py` helper now splits actual HTML closing tags instead of literal `\/` delimiters;
  these three fixes are needed to run the archived raw pipeline, not changes to its data rules.
- Starter is appended as area 61 and location 95, never inserted before existing entries. Only the three
  Turtwig / Litten / Froakie `Starter choice` encounters move there. New Bark Town retains every other encounter.
  The existing New Bark Town walkthrough stop includes Starter before its original area, without adding a stop.
- Published species IDs and order, all 61 original area indices and 95 location indices, trainer keys and teams,
  cap lists, item data, walkthrough split / stop indices, and checklist contents remain unchanged. The existing
  unobtainable / unused-species pruning is untouched. Walkthrough split labels use `[Cap N]`; both tabs use
  `Victory Road Split [Cap 81]` and `Elite Four Split [Cap 81]`.
- All `hack.json` storage keys remain unchanged. Existing `hgtrack.e` / trade area keys still identify the same
  places. The shared template seeds the new Starter slot from a saved `hgtrack.s`, independently of area 0's
  New Bark Town encounter; failed / cleared New Bark encounters are not mistaken for the starter. Walkthrough
  state uses split / stop indices, so labels and the extra area within the existing stop do not move saved state.
- The source-free finaliser preserves the published 0.8.3 trainer corrections documented below. A complete raw
  rebuild still requires the matching 0.8.3 source / sheet inputs, not just the older 0.8.2 source snapshot.
  The locally available snapshot identifies itself as `8ac661afda`: its full extract and split pass succeed,
  with identical species / encounters / areas to this build, but retain two duplicate trainer keys (`9.0.2`,
  `9.0.5`) and differ on seven existing trainer records (including documented 0.8.3 corrections). Its walkthrough
  trainer references also differ. That raw output was checked separately, not substituted into the published data.
- Checks: the Part B finaliser reproduces this data byte-for-byte from its parent-commit data and is idempotent.
  All 986 species, 329 published trainer keys, 18 walkthrough splits / 94 stops and all original saved indices are
  preserved. `assemble.py hardlove-gold` succeeds. Normal / dvkb full DOM sweeps cover 2,481 routes each with
  zero page errors, unsettled routes or hashchange timeouts; DOM differences reflect the agreed data changes.
  The existing consistency check passes all five viewer sizes and light theme; pagecheck / walkcheck pass at
  260 x 316 in both modes. Browser migration tests carry caught / failed / unchosen baseline state through the
  old build, this build and reload, preserving original tracker / trade slots and walkthrough / item / trainer /
  cap state. The named starter picker writes only the new slot, leaving New Bark Town's tracker unchanged.

Moved from the guide's top comment on 2026-10-19 (it was in every built file).

```text
HARDLOVE GOLD OFFLINE DEX - BUILD NOTES (read this first if you are extending the file)
========================================================================================

WHAT THIS FILE IS
One self-contained HTML page that works fully offline, made for the Dex Viewer floating window on the AYN Thor and for a
phone browser. Rebuilt 2026-10-18 for Hardlove Gold 0.8.2 (trainer sets updated 2026-10-19 for 0.8.3) from the hack's own source code and its docs. The UI is the Emerald Imperium template (left icon rail,
in-page keyboard, full-window search, number pad, blob sprites, content-visibility, anchor scroll restore,
dexViewer.restoreScroll, last-route reopen); only the data and the Hardlove-only parts differ (see VIEWER UI below).
986 Pokemon and forms (596 obtainable, 74 Megas, 316 trainer only), 782 moves, 284 abilities,
331 trainers, 61 encounter areas, 94 walkthrough stops.

FILE LAYOUT
  <script id="data" type="application/json">   all game data (schema below)
  <script id="spr" type="application/json">    sprite map {pokemonId: "data:image/png;base64,..."}
  <script id="build-source" type="text/plain"> the builder (build.py and helpers, port.py, assemble.py), not executed
  <script> (last)                              the app: hash router + renderers
Routes: #/ (list) #/p/<id> (Pokemon) #/m/<moveIndex> (move) #/a/<abilityIndex> (ability) #/locs #/l/<LOC index>
        #/trainers #/tr/<group.section.trainer> #/items #/walk #/calc

HOW TO REBUILD (Git Bash, repo root; Python 3 stdlib and Node only, see docs/hardlove-gold/SOURCES.md for fetching)
  Save the build-source parts as separate files (split on the "# ===== <name> =====" lines) in one folder <B>.
  The previous guide's data and sprites (old_data.json, old_spr.json) are read for a few fallbacks; extract them from this
  file's #data / #spr before overwriting it. The hack source must be in docs/hardlove-gold/repos/hardlove (SOURCES.md). Then:
    node <B>/sd.js docs/hardlove-gold/repos/showdown <W>/sd.json
    node -e "<eval repos/hardlove.js, write backup_data to <W>/calc.json>"   (only a types fallback now)
    python <B>/build.py docs/hardlove-gold <W> <W>/out          (prints the report below)
    python <B>/port.py <EI app script> <W>/hl_app.js              (EI = the last <script> of emerald-imperium-dex.html)
    python <B>/assemble.py <B> guides/emerald-imperium-dex.html <W>/out <W>/hl_app.js guides/hardlove-gold-dex.html
  Then, in this repo on hacks/hardlove-gold/data.json: python -I hacks/hardlove-gold/extract/split_ui.py (trainer
  boxes per mini-split, held item kinds, Valuables; see its header).
  port.py is a list of exact replacements on the EI app script; if the EI template changes, re-run it and fix any
  replacement that no longer matches (it stops with the text it could not find).

SOURCES (all in docs/hardlove-gold, fetched 2026-10-18)
 0. THE HACK'S SOURCE: github.com/kumakuma1/hardlove (the author's hg-engine build), branch beta_hardlove at commit
    f1b2363001 (2026-10-18, "use copy of pp for calcing mega stats" = release 0.8.3), files in repos/hardlove (COMMIT holds the sha).
    This is what the ROM is built from, so it is the authority wherever it has the data (src.py, hge.py read the C files):
      data/Species.c + HiddenAbilityTable.c  types, base stats, abilities and hidden abilities of every species and form
      data/learnsets/learnsets.json          level-up, TM, tutor and egg moves (forms without an entry use their base form)
      data/Evolutions.c                      evolutions (methods rewritten to words: evo_text in build.py)
      data/Moves.c + include/config.h        type, category, power, accuracy, PP, priority (CHAMPIONS_* changes are on)
      data/Trainers.c                        every trainer set: species, level, item, ability, nature, moves, IVs, battle type
      data/Encounters.c, SafariEncounters.c  wild tables, checked slot by slot against the locations sheet
      data/MachineMoves.c                    TM/HM numbers
      src/field/encounter_check.c (read online) the hack's slot odds: land 8 x 10% + 4 x 5%, surf/rod 30/30/25/10/5,
                                             rock smash 60/40. Good and Super Rod tables are one-species placeholders: the
                                             hack only gives the Old Rod.
    Not in the source: map scripts (item balls, NPC gifts, trades, marts), so item locations, tutors, gifts and statics
    still come from the sheets; HiddenItems.c still has vanilla leftovers in unused Kanto areas, so it is not used.
    Findings: the dex site predates 0.8.0 (learnsets) and 0.8.1 (abilities), never listed hidden abilities and had 5 wrong
    Mega/Crowned stat lines; the sheet's "Lycanroc-M" is Midnight; Mt. Mortar 1F/2F have Surf and Fishing swapped in the
    sheet; HM05/HM06 are swapped in the items sheet; Hiker Schorsch has the wrong trainer id in the sheet (11, game 233).
 1. Docs site kumakuma1.github.io/hardlove-docs (repo bb5862f), site/pokedex: 1,364 pages, one per species/form, in the
    index's dex order. Now used only for the species list and order, display names, other forms and sprites (160x80
    two-frame sheets; the builder keeps the left 80x80 frame, trimmed). Its stats, types, abilities, moves and evolutions
    are replaced by source 0 (the report lists every change). QUIRKS: Fairy types show "Typing not found" (filled from the calc's
    species data, a few from the previous build); "Wild Locations" are stale and not used; female-only species have no
    sprite (0-byte files), taken from the hack source (repos/sprites = kumakuma1/hardlove at the pinned commit,
    data/graphics/sprites/<id>/female/front.png). Bounsweet has none.
 2. "Pokemon Locations" sheet (xlsx): source of truth for availability. Encounter Tables (location names in merged row 1,
    Level/Pokemon column pairs, col A method, col B rate as a fraction), Safari Zone (same, areas after the gate), Random
    Pools ("Pool, Location" headers; cell notes kept), Game Corner (by badge), Trades, Unavailable Pokemon. Cell notes are
    now read: per encounter ("Starter: Litten.", "Requires 7th Badge."), per location (Azalea headbutt trees, Safari
    layout) and the roamer note. Name suffixes -A/-G/-H/-P regional, -T Therian, -D Defense. The player's starter choice
    (Turtwig, Litten, Froakie) is in no tab: added from Mechanics.txt as "Starter choice" at New Bark Town (the previous
    build missed it, so Froakie, Greninja and Mega Greninja showed as trainer only).
    Obtainable set = everything found + evolution family both ways, minus the Unavailable tab. Chimecho, Forretress, Great
    Tusk and Iron Bundle are in both a table and the Unavailable tab; they are kept as obtainable.
 3. "Trainer Battles" sheet (xlsx): split tabs in order (Falkner Split ... Clair Split, Victory Road, Elite Four, Mini
    Bosses). Block per trainer: "Name - <id>" row, Pokemon row, species row, Level, Ability, Held Item, Nature, 4 Moves rows.
    Section header rows ("Falkner Split [Level Cap 16], Ruins of Alph") give the split, cap and place. Brackets in names
    become tags ([Optional], [Double], [Back2Back]...); [Starter X] becomes the trainer's starter filter. Cell notes
    (column I) on a name row go to that trainer, on a section row to the section, otherwise to the trainer whose block holds
    the row. "-M" is Mega only when the item is the matching stone; "-M-X/Y/Z" Mega X/Y/Z; Floette-Eternal-M is Mega Floette.
    "X-2" levels (Mini Bosses) are relative to the level cap (r:-2). The hidden "Example - Vanilla" tab and the "Pokemon",
    "Trainers" and "import" tabs are not used. The sheet now gives order, places, tags and notes; the sets come from the game
    (source 0), paired by the "Name - <id>" trainer id and species. Where the sheet differs the card says "Sheet says ...".
 4. "Move Changes" sheet: changed moves only ("20 > 40"), plus the effect side table, kept as notes; the numbers come from
    the game (source 0). Notes say where the sheet disagrees with the game and which game changes the sheet doesn't list.
 5. "Item Location" sheet: Held Items (+ Berries side table), Heart Scales, Rare Candies, HM/TMs and Move Tutors (TMs, tutor
    side table, HMs after the "HM" row), Evolution Items, Mega Stones ("Unavailable." when not obtainable), Other.
 6. Hardlove calc github.com/kumakuma1/hardlovecalc backups/hardlove.js (Jan 2026): no longer used for sets (the game's
    Trainers.c replaced it); only a fallback for missing types.
 7. pokemon-showdown 0.11.11 (repos/showdown): move and ability descriptions, dex numbers, the Z-A Mega list (their data
    then comes from source 0), and the Gen 9 baseline the move notes compare against.
 8. Mechanics.txt (level caps, starter choice table, removed EVs and other rules), Hardlove Gold AI document_WIP.txt and
    Post-KO Switch-in AI.xlsx: shown as "Game docs" in the Walkthrough tab. Move Performance.txt (generic move order notes
    from a wiki) is not used.

DATA RULES
  P.g: 0 obtainable, 1 Mega (P.nu = stone unavailable, kept only because a trainer uses it), 3 trainer only.
  Megas: Other Forms of obtainable species; stone matched by name (X/Y/Z suffix must agree); dropped when the stone is
  unavailable and no trainer uses them (Mega Latias). Megas sit right after their base form.
  Locations: order = Encounter Tables column order, Safari areas after the gate, Blackthorn City after Ice Path. Areas merge
  sub-locations (areaOf in build.py); the area list is unchanged from the previous build, so tracker slots carry over.
  Walkthrough: no written walkthrough exists. Stops come from the trainer sheet's sections in order, split by level-cap
  header; each area is anchored to its first stop when that keeps the order monotonic, else becomes an "on the way" stop.
  Items are filed by the earliest area name in their location text (ALIASW in build.py).
  Level caps (TR.caps) from Mechanics.txt; a trainer's cap is its split header's cap.

DATA SCHEMA (the JSON in #data): the same for every guide, in hacks/emerald-imperium/notes.md → DATA SCHEMA. Hardlove's
  own data: P.nu (Megas that cannot be used), P.tu tutors, P.stone / P.sloc; MV.h = Hardlove change notes; no MV.e / dc,
  no AB original flags; WK.docs (game docs) and WK.ko (post-KO switch-in AI) instead of cheat codes; the walkthrough has
  no checklist steps; TR trainers carry no `id`/`pp`/`c`; mons carry `ao` ("A / B" when the sheet lists two abilities),
  `a0`, `hp`, `cf` (what the sheet says instead), `src` "s" = no game set, sheet values; `ev` is [0 x6] (the hack
  removes EVs). TC is the standard Gen 9 chart (Mechanics: assume Gen 9).

STAT FORMULA
  HP = floor((2B + IV + floor(EV/4)) x L / 100) + L + 10; others = floor((floor((2B + IV + floor(EV/4)) x L / 100) + 5) x nature)
  EVs are 0 everywhere: the hack removes them.

LOCAL STORAGE (prefix hg)
  "hgtrack" tracker {s starter, e {areaIdx: {p: id} or {f: 1}}, t {"area|For X": id}} (same key and shape as the previous
  build), "hgcalc:<id>" + "hgcalc:lastlv" stat calc (same as before), "hgdex4" list filters, "hgwalk2" walkthrough open
  state (same shape as EI's "eiwalk"), "hgcap2" level cap per trainer (+ _last), "hgtr" open trainer groups, "hgrecent" search picks, "hgpos" last route
  and anchor. "dvkb" = "1" forces viewer mode (shared test switch).

VIEWER UI (template from emerald-imperium-dex.html, changed by port.py)
  Kept: rail, keyboard, number pad, full-window search, lag work, scroll and route restore, trainer grid, tracker.
  Hardlove parts: Tutor move tab; starter selector in the tracker bar (filters rival teams, trades, starter-only items);
  trade slots in the tracker; no EV row in the stat calculator; trainer cards show "Sheet says ..." where the sheet and the game differ, a
  "Level cap" box for cap-relative teams; Walkthrough has Game docs instead of cheat codes and no checklist (there are
  no steps); availability filter "Trainer only" instead of "Changed from vanilla". Removed: Minimal Grinding Mode, Hot House,
  EI changes doc and conflict cards.

BUILD REPORT (2026-10-18)
  starters: ['Turtwig', 'Litten', 'Froakie']
  starter name fixed: Turtig > Turtwig
  unavailable not matched: Wormadam-Sandy-Cloak
  unavailable not matched: Wormadam-Trash-Cloak
  in the location tables AND on the unavailable list (kept): chimecho, forretress, great_tusk, iron_bundle
  obtainable 596 locations 95
  trainer species fuzzy-matched: Amoongus > amoonguss; Blaizken > blaziken; Deoxys-D > deoxys_defense; Enamorus-T > enamorus_therian; Landorus-T > landorus_therian; Torkol > torkoal; Wigglituff > wigglytuff
  Z-A Megas from Showdown: mega_absol_z, mega_barbaracle, mega_baxcalibur, mega_chandelure, mega_chesnaught, mega_chimecho, mega_clefable, mega_crabominable, mega_darkrai, mega_delphox, mega_dragalge, mega_dragonite, mega_drampa, mega_eelektross, mega_emboar, mega_excadrill, mega_falinks, mega_feraligatr, mega_floette, mega_froslass, mega_garchomp_z, mega_glimmora, mega_golisopod, mega_golurk, mega_greninja, mega_hawlucha, mega_heatran, mega_lucario_z, mega_magearna, mega_malamar, mega_meganium, mega_pyroar, mega_raichu_y, mega_scolipede, mega_scovillain, mega_scrafty, mega_skarmory, mega_staraptor, mega_starmie, mega_victreebel, mega_zeraora, mega_zygarde
  hack source: kumakuma1/hardlove at 8ac661afdaba3c9bc60d39c1f0cc22a8a5ad63c8
  0.8.3 PATCH (2026-10-19): 8ac661afda..f1b2363001 changes only data/Trainers.c (commit 4c171c8d91 "fix make") among the
    files in SOURCES 0, so only these sets were patched into #data (not a full rebuild; the Trainer Battles sheet was updated
    2026-10-19 and matches these sets, so their old 'sheet says' notes were dropped):
    Elite Four Lance Aerodactyl: Psychic Fangs > Crunch. Karen Gholdengo: Nasty Plot > Night Shade. Red Greninja-Ash:
    Hydro Pump, Dark Pulse, Grass Knot > Liquidation, Night Slash, Low Kick. Will (702) Farigiraf: Energy Ball > Dazzling
    Gleam; Solgaleo: Rock Slide > Close Combat. Koga (703): Landorus-T Lv 82 > 81; Dragalge removed, Darkrai to slot 5,
    Weavile (Lv 82 Jolly Ice Gem Inner Focus; Icicle Crash, Knock Off, Fake Out, Protect) in slot 6.
  SHEET RECHECK (2026-10-19, Trainer Battles re-downloaded): the sheet now matches Bug Catcher Josh's Charjabug and Hiker
    Michael's Medicham (notes dropped); the other ~60 differences remain and the game sets stay (Trainers.c is what the
    ROM uses; a calc import of the 0.8.3 ROM confirms Will's Slowbro has Psychic, not the sheet's Future Sight). The sheet
    lists Will [Double] (702) and Koga [Double] (703) twice; the game has one of each, so the duplicates 9.0.2 (Mr. Mime
    row; the user confirmed Slowbro in game) and 9.0.5 (same team as 9.0.4, but Thundurus "Covert Cloak") were removed.
  evolution method not described: SPIN_CLOCKWISE_LESS_THAN_5_SECONDS_DAY 0
  evolution method not described: SPIN_COUNTERCLOCKWISE_LESS_THAN_5_SECONDS_DAY 0
  evolution method not described: SPIN_CLOCKWISE_LESS_THAN_5_SECONDS_NIGHT 0
  evolution method not described: SPIN_COUNTERCLOCKWISE_MORE_THAN_5_SECONDS_NIGHT 0
  evolution method not described: SPIN_CLOCKWISE_MORE_THAN_5_SECONDS_NIGHT 0
  evolution method not described: SPIN_COUNTERCLOCKWISE_LESS_THAN_5_SECONDS_NIGHT 0
  evolution method not described: SPIN_COUNTERCLOCKWISE_MORE_THAN_5_SECONDS_DAY 0
  evolution method not described: SPIN_CLOCKWISE_MORE_THAN_5_SECONDS_DAY 0
  evolution method not described: SPIN_MORE_THAN_10_SECONDS_EVENING 0
  wild table Route 46 (ENCDATA_R46_ROUTE_46): Land: sheet rookidee 15%, taillow 10%; game rookidee 10%, taillow 15%
  wild table Violet City (ENCDATA_T22_VIOLET_CITY): Fishing: sheet remoraid 25%; game snorunt 25%
  wild table Route 5 (ENCDATA_R05_ROUTE_5): Land: sheet eldegoss 5%; game gossifleur 5%
  wild table Mt. Mortar 1F (Entrance) (ENCDATA_D38R0101_MT_MORTAR_WATERFALL_ROOM): Fishing: sheet samurott_hisuian 25%; game samurott 25% | Surf: sheet samurott 25%; game samurott_hisuian 25%
  wild table Mt. Mortar 2F (ENCDATA_D38R0103_MT_MORTAR_ROOM_ABOVE_WATERFALL): Surf: sheet dragapult 10%, drampa 5%, gengar 30%, golisopod 30%, skarmory 25%; game archeops 30%, banette 30%, gyarados 5%, hydreigon 25%, primarina 10% | Fishing: sheet archeops 30%, banette 30%, gyarados 5%, hydreigon 25%, primarina 10%; game dragapult 10%, drampa 5%, gengar 30%, golisopod 30%, skarmory 25%
  wild table Lake of Rage (ENCDATA_T29_LAKE_OF_RAGE): Land: sheet manectric 15%, parasect 10%; game manectric 25%
  wild table Whirl Islands 1F (ENCDATA_D40R0101_WHIRL_ISLANDS_1F): Fishing: sheet clawitzer 30%; game clauncher 30%
  wild table Whirl Islands B2F (ENCDATA_D40R0104_WHIRL_ISLANDS_B2F): Land: sheet golurk 15%; game mudsdale 15%
  wild table Ice Path 1F (None): no game table with these Pokemon (static, gift or scripted encounter, or not in the game)
  wild table Mt. Silver (Snowy Area) (ENCDATA_D41R0102_MT_SILVER_TOP_SNOWY_AREA): Surf in the game, not in the sheet: goldeen 100% | Fishing in the game, not in the sheet: goldeen 100%
  wild table Mt. Silver (Moltres Room) (None): no game table with these Pokemon (static, gift or scripted encounter, or not in the game)
  wild tables checked against the game: 85 locations, 11 with differences; replaced from the game: Route 46, Violet City, Route 5, Mt. Mortar 1F (Entrance), Mt. Mortar 2F, Lake of Rage, Whirl Islands 1F, Whirl Islands B2F, Mt. Silver (Snowy Area)
  trainer-only species from the game sets: groudon
  trainer-only species from the game sets: darkrai
  trainer-only species from the game sets: floette_eternal_flower
  trainer-only species from the game sets: mewtwo
  types filled: clefairy (calc), clefable (calc), wigglytuff (calc), mr_mime (calc), cleffa (calc), togepi (calc), togetic (calc), marill (calc), azumarill (calc), snubbull (calc), granbull (calc), ralts (calc), kirlia (calc), gardevoir (calc), mega_gardevoir (previous build), azurill (calc), mawile (calc), mega_mawile (previous build), mega_altaria (previous build), togekiss (calc), mega_audino (previous build), whimsicott (calc), flabebe (previous build), floette (calc), florges (calc), slurpuff (calc), sylveon (calc), dedenne (calc), carbink (calc), klefki (calc), xerneas (calc), diancie (calc), primarina (calc), cutiefly (calc), ribombee (calc), morelull (calc), shiinotic (calc), comfey (calc), mimikyu (calc), tapu_koko (calc), tapu_lele (calc), tapu_bulu (calc), magearna (calc), hatterene (calc), impidimp (calc), morgrem (calc), grimmsnarl (calc), alcremie (calc), enamorus (calc), dachsbun (calc), tinkaton (calc), flutter_mane (previous build), iron_valiant (previous build), enamorus_therian (calc)
  not in the hack source, site data kept: wormadam_trashy
  changed from the dex site by the hack source: {'hidden abilities (not on the site)': 647, 'level-up moves': 311, 'tm moves': 157, 'tu moves': 70, 'abilities': 28, 'evolutions': 2, 'eg moves': 59, 'stats': 5}
    stats (5): mega_feraligatr [85, 160, 125, 89, 93, 78] > [85, 160, 100, 89, 93, 78]; mega_skarmory [65, 140, 110, 40, 100, 110] > [85, 140, 110, 40, 100, 110]; mega_garchomp_z [108, 130, 85, 141, 85, 151] > [108, 130, 95, 141, 85, 151]; zacian_crowned [92, 170, 115, 80, 115, 148] > [92, 150, 115, 80, 115, 148]; zamazenta_crowned [92, 130, 145, 80, 145, 128] > [92, 120, 140, 80, 140, 128]
    abilities (28): mega_charizard_x Pressure > Tough Claws; mega_aerodactyl Pressure > Tough Claws; sentret Keen Eye > Keen Eye/Run Away; furret Keen Eye > Keen Eye/Run Away; mega_steelix Pressure > Sand Force; taillow Guts/Keen Eye > Guts; swellow Guts/Keen Eye > Guts; mega_sableye Pressure/Frisk > Magic Bounce; mega_medicham Huge Power > Pure Power; mega_sharpedo Speed Boost > Strong Jaw; mega_camerupt Magma Armor/Solid Rock > Sheer Force; mega_banette Frisk > Prankster; mega_absol Pressure > Magic Bounce; mega_absol_z Magic Bounce > Sharpness; mega_metagross Pressure > Tough Claws; mega_garchomp Pressure > Sand Force; mega_garchomp_z Sand Force > Levitate; mega_lucario_z Adaptability > Aura Guard; greninja Torrent > Battle Bond; gourgeist Frisk > Frisk/Insomnia; mudsdale Inner Focus/Stamina > Inner Focus/Own Tempo; mega_golisopod Emergency Exit > Tough Claws; drampa Berserk/Sap Sipper > Berserk; sneasler Inner Focus > Inner Focus/Poison Touch; sprigatito Protean > Libero; floragato Protean > Libero; meowscarada Protean > Libero; sneasel_hisuian Inner Focus > Inner Focus/Poison Touch
    evolutions (2): growlithe > arcanine, arcanine_hisuian; koffing > weezing, weezing_galarian
  Megas dropped (stone unavailable, no trainer uses them): mega_latias
  ability without description: Aura Guard
  ability fuzzy: Lighting Rod > Lightning Rod
  ability fuzzy: Natural Cute > Natural Cure
  ability fuzzy: Initmidate > Intimidate
  ability fuzzy: Synrchonize > Synchronize
  ability fuzzy: Scappy > Scrappy
  ability fuzzy: Magmar Armor > Magma Armor
  ability fuzzy: Serence Grace > Serene Grace
  ability fuzzy: Aura Beak > Aura Break
  ability fuzzy: Adapatability > Adaptability
  in the game but not the sheet: Nuzlocker Ethan (Random Team, see Mini Bosses) mesprit Lv 78
  in the game but not the sheet: Nuzlocker Ethan (Random Team, see Mini Bosses) palafin Lv 78
  in the game but not the sheet: Nuzlocker Ethan (Random Team, see Mini Bosses) salamence Lv 78
  in the game but not the sheet: Nuzlocker Ethan (Random Team, see Mini Bosses) zamazenta_crowned Lv 78
  in the game but not the sheet: Nuzlocker Ethan (Random Team, see Mini Bosses) blaziken Lv 78
  in the game but not the sheet: Nuzlocker Ethan (Random Team, see Mini Bosses) absol Lv 78
  ability fuzzy: Swam > Swarm
  trainer sets: {'game set': 1466, 'sets where the sheet differs': 70, 'game Pokemon missing from the sheet': 6}
    Leader Falkner Farfetch'd-G: sheet says ability Inner Focus
    Fisherman Ralph Poliwhirl: sheet says item Oran Berry
    Hiker Russel Geodude-A: sheet says moves Spark, Rock Tomb, Bulldoze, Thunder Wave
    Hiker Russel Sandshrew-A: sheet says species Sandshrew-A
    Bug Catcher Josh Charjabug: sheet says moves Crunch, Wild Charge, Crunch
    Pokéfan♂ William Amoonguss: sheet says moves Spore, Pollen Puff, Giga Drain, Venoshock
    Psychic♂ Mark Braixen: sheet says ability Blaze
    School Kid Alan Palossand: sheet says nature Quiet
    Hiker Schorsch Qwilfish-H: sheet says level 29
    Firebreather Ned Magmortar: sheet says nature Timid
    Rival Silver Grimmsnarl: sheet says item Sitrus Berry
    Medium Martha Drifloon: sheet says species Drifloon
    Swimmer♂ Randall Masquerain: sheet says level 42
    Black Belt Nob Samurott-H: sheet says ability Sharpness
    Camper Grant Swanna: sheet says item Sitrus Berry
    Double Team Thom & Kae Lucario: sheet says nature Naive; ability Inner Focus
    Rocket Grunt♀ #4 Scolipede: sheet says level 48
    Rocket Grunt♂ #6 Machamp: sheet says moves Close Combat, Ice Punch, Fire Punch, Bullet Punch
    Executive Ariana Altaria: sheet says level 49
    Twins Meg & Peg Incineroar: sheet says item Assault Vest
    Sailor Stanly Bronzong: sheet says item Colbur Berry
    Leader Lt. Surge Pincurchin: sheet says moves Zing Zap, Scald, Charge, Spikes
    Ace Trainer♂ Kevin Hawlucha: sheet says moves Acrobatics, Body Press, Poison Jab, Throat Chop
    Leader Misty Golduck: sheet says level 51
    Leader Jasmine Gholdengo: sheet says level 53
    Fisherman Raymond Goodra: sheet says level 55
    Fisherman Andre Corviknight: sheet says level 55
    Rocket Grunt♂ #9 Lokix: sheet says moves First Impression, Sucker Punch, Axe Kick, Swords Dance
    Rocket Grunt♂ #17 Zangoose: sheet says moves Secret Power, Quick Attack, Knock Off, Swords Dance
    Scientist Ross Lickilicky: sheet says level 58
    Rocket Grunt♂ #23 Dewgong: sheet says nature Hasty
    Boarder Patton Tentacruel: sheet says level 61
    Boarder Deandre Avalugg: sheet says moves Icicle Spear, Body Press, Gyro Ball, Earthquake
    Executive Petrel Torkoal: sheet says level 66
    Executive Petrel Lycanroc-Dusk: sheet says nature Jolly
    Rival Silver Sinistcha: sheet says item Sitrus Berry
    Rival Silver Hatterene: sheet says item Sitrus Berry
    Rival Silver Entei: sheet says moves Sacred Fire, Extreme Speed, Stone Edge, Curse
    Rocket Grunt♂ #36 Luxray: sheet says nature Adamant; ability Guts
    Rocket Grunt♂ #37 Magcargo: sheet says ability Weak Armor
    Executive Brianna Barbaracle-M: sheet says level 71
    Executive Archer Exeggutor: sheet says moves Psychic, Solar Beam, Growth, Sleep Powder
    Executive Archer Iron Moth: sheet says moves Heat Wave, Sludge Bomb, Psychic, Solar Beam
    Poké Maniac Zach Qwilfish-H: sheet says nature Bashful
    Ace Trainer♂ Ryan Bouffalant: sheet says nature Adamant
    Ace Trainer♂ Ryan Cloyster: sheet says level 72
    Ace Trainer♀ Kelly Mienshao: sheet says nature Jolly; ability Inner Focus
    Hiker Michael Medicham: sheet says ability Pure Power
    Hiker Bailey Ludicolo: sheet says nature Timid
    Ace Trainer♂ Paulo Sylveon: sheet says level 74
    Ace Trainer♂ Paulo Ampharos-M: sheet says ability Static / Mold Breaker
    Ace Trainer♀ Fran Darmanitan: sheet says nature Jolly
    Ace Trainer♂ Mike Indeedee-F: sheet says moves Expanding Force, Dazzling Gleam, Hyper Voice, Memento
    Ace Trainer♂ Mike Gouging Fire: sheet says ability Protosynthesis
    Ace Trainer♂ Brian Ogerpon: sheet says nature Jolly
    Ace Trainer♂ Gaven Magnezone: sheet says nature Modest; ability Analytic
    Ace Trainer♀ Morgan Volcanion: sheet says item Saftey Googles
    Rival Silver Latias: sheet says ability Levitate
    Elite Four Will Slowbro: sheet says moves Future Sight, Hydro Pump, Fire Blast, Yawn
    Elite Four Will Farigiraf: sheet says moves Hyper Voice, Future Sight, Dazzling Gleam, Protect
    Elite Four Will Mr. Mime: sheet says species Mr. Mime; item none; ability Filter; moves Dazzling Gleam, Psychic, Disable, Follow Me
    Elite Four Will Solgaleo: sheet says moves Sunsteel Strike, Psychic Fangs, Play Rough, Dragon Dance
    Elite Four Koga Spectrier: sheet says level 82
    Elite Four Koga Dragalge: sheet says nature Modest
    Elite Four Koga Thundurus: sheet says item Covert Cloak
    Elite Four Koga Landorus-T: sheet says level 81
    Elite Four Koga Weavile: sheet says species Weavile; level 82; item Ice Gem; nature Jolly; ability Inner Focus; moves Icicle Crash, Knock Off, Fake Out, Protect
    Elite Four Karen Floette-Eternal-M: sheet says level 82
    Elite Four Karen Floette-Eternal-M: sheet says level 82
    Kimono Girl Zuki Golem: sheet says moves Earthquake, Rock Blast, Explosion
  trainer fixes: Fisherman Ralph Lumineon: item "Msytic Water" = Mystic Water; Hiker Schorsch: sheet id 11, game trainer 233; Rocket Grunt♂ #6 Absol: item "Scope Lense" = Scope Lens; Sailor Garrett Politoed: sheet rows shifted (nature "Perish Song"); Sailor Garrett Kilowattrel: sheet rows shifted (nature "Nasty Plot"); Sailor Garrett Durant: sheet rows shifted (nature "-"); Sailor Garrett Drampa: sheet rows shifted (nature "Weather Ball"); Rocket Grunt♂ #20 Lanturn: item "Letfovers" = Leftovers; Rival Silver Emboar-M: item "Emborite" = Emboarite; Ace Trainer♂ Vernon Malamar-M: item "Malarmarite" = Malamarite; Ace Trainer♂ Jake Alakazam-M: item "Alakazit" = Alakazite; Rival Silver Emboar-M: item "Emborite" = Emboarite; Elite Four Koga Glimmora: sheet rows shifted (nature "Toxic Spikes"); Elite Four Koga Landorus: sheet rows shifted (nature "Stealth Rock"); Elite Four Koga Greninja-M: sheet rows shifted (nature "U Turn"); Elite Four Koga Iron Valiant: sheet rows shifted (nature "Poison Jab"); Elite Four Koga Zoroark: sheet rows shifted (nature "Will O Wisp"); Elite Four Koga Spectrier: sheet rows shifted (nature "Substitute"); Elite Four Karen Gothitelle: sheet rows shifted (nature "Fake Out"); Elite Four Karen Urshifu-Rapid-Strike: sheet rows shifted (nature "-"); Elite Four Karen Gardevoir: sheet rows shifted (nature "Nasty Plot"); Elite Four Karen Clefairy: sheet rows shifted (nature "Follow Me"); Elite Four Karen Magearna: sheet rows shifted (nature "Shift Gear"); Elite Four Karen Floette-Eternal-M: sheet rows shifted (nature "Calm Mind"); Elite Four Lance Pelipper: sheet rows shifted (nature "-"); Elite Four Lance Garchomp: sheet rows shifted (nature "Poison Jab"); Elite Four Lance Aerodactyl: sheet rows shifted (nature "Tailwind"); Elite Four Lance Zapdos: sheet rows shifted (nature "Roost"); Elite Four Lance Palkia: sheet rows shifted (nature "Substitute"); Elite Four Lance Dragonite-M: sheet rows shifted (nature "Weather Ball"); Elite Four Lance Pelipper: sheet rows shifted (nature "-"); Elite Four Lance Garchomp: sheet rows shifted (nature "Spikes"); Elite Four Lance Overqwil: sheet rows shifted (nature "Fell Stinger"); Elite Four Lance Zapdos: sheet rows shifted (nature "Roost"); Elite Four Lance Dialga: sheet rows shifted (nature "Aura Sphere"); Elite Four Lance Dragonite-M: sheet rows shifted (nature "Roost"); Champion Blue Miraidon: sheet rows shifted (nature "Mt. Silver Summit"); Champion Blue Ho-Oh: sheet rows shifted (nature "Roost"); Champion Blue Exeggutor-A: sheet rows shifted (nature "Leech Seed"); Champion Blue Lucario: sheet rows shifted (nature "Work Up"); Champion Blue Mew: sheet rows shifted (nature "Calm Mind"); Champion Blue Raichu-M-Y: sheet rows shifted (nature "Grass Knot"); Trainer Red Tapu Lele: sheet rows shifted (nature "Substitute"); Trainer Red Clefable: sheet rows shifted (nature "Endeavor"); Trainer Red Zacian-Crowned: sheet rows shifted (nature "Crunch"); Trainer Red Greninja-Ash: sheet rows shifted (nature "Grass Knot"); Trainer Red Melmetal: sheet rows shifted (nature "Ice Punch"); Trainer Red Mewtwo-M-X: sheet rows shifted (nature "Blizzard"); Ace Trainer♀ Gwen Ninetales: sheet rows shifted (nature "-"); Ace Trainer♀ Gwen Eelektross: sheet rows shifted (nature "Coil"); Ace Trainer♀ Gwen Muk: sheet rows shifted (nature "Helping Hand"); Ace Trainer♀ Emma Araquanid: sheet rows shifted (nature "Sticky Web"); Ace Trainer♀ Emma Tauros: sheet rows shifted (nature "Close Combat"); Ace Trainer♀ Emma Absol-M: sheet rows shifted (nature "Flamethrower"); Ace Trainer♂ Nick Sawk: sheet rows shifted (nature "[Level Cap X-2] Mt. Mortar B1F (back)"); Ace Trainer♂ Nick Nidoqueen: sheet rows shifted (nature "Fire Blast"); Ace Trainer♂ Nick Jynx: sheet rows shifted (nature "Calm Mind"); Ace Trainer♂ Nick Dondozo: sheet rows shifted (nature "Protect"); Ace Trainer♂ Nick Altaria-M: sheet rows shifted (nature "Roost")
  move not in the game data: Collision Course
  moves vs the game data: {'changed in game, not in the sheet': 45, 'sheet disagrees with the game': 6, 'not in the game data': 1} ; sheet values the game contradicts: Dragon Tail ac, Screech pp, Reflect ac, Double Slap ac, Pain Split bp, Snarl pp
  move changes in the sheet: 188 on moves in the data: 183 ; not learned or used by anyone: barrage, freezeshock, iceburn, magmastorm, thundercage
  move names fuzzy-matched: Accelrock > Accelerock; Acient Power > Ancient Power; Baze Kick > Blaze Kick; ColisionCourse > Collision Course; Eartquake > Earthquake; Exploson > Explosion; Fisheous Rend > Fishious Rend; Fishous Rend > Fishious Rend; Flare Bitz > Flare Blitz; Icy Beam > Ice Beam; Leed Seed > Leech Seed; Lunch > Crunch; Precicipe Blades > Precipice Blades; Rock Romb > Rock Tomb; Sleep Power > Sleep Powder; Sludge Bumb > Sludge Bomb; Spirit Beak > Spirit Break; Stealth Rocks > Stealth Rock; Subsitute > Substitute; Sustitute > Substitute; Vaccuum Wave > Vacuum Wave; Vice Grip > Vise Grip; Whish > Wish
  TM/HM fixes from the game: TM14 = Blizzard; TM19 = Giga Drain; TM25 = Thunder; TM38 = Fire Blast; TM41 = Torment; TM47 = Steel Wing; TM52 = Focus Blast; TM53 = Energy Ball; TM55 = Brine; TM56 = Fling; TM63 = Embargo; TM65 = Shadow Claw; TM68 = Giga Impact; TM69 = Rock Polish; TM71 = Stone Edge; TM73 = Thunder Wave; TM78 = Captivate; TM80 = Rock Slide; TM81 = X-Scissor; TM82 = Sleep Talk; TM83 = Natural Gift; TM84 = Scald; TM85 = Dream Eater; TM86 = Grass Knot; TM90 = Protect; TM92 = Trick Room; HM05 Rock Smash is HM06 in the game; HM06 Whirlpool is HM05 in the game
  sprites missing or borrowed: bounsweet, mega_golisopod (base sprite)
  P 986 obtainable 596 megas 74 trainer only 316 moves 782 abilities 284 trainers 331 areas 61 stops 94 unplaced items 0

NEXT
  Damage calc on the Calc page (hardlovecalc has an engine and older sets); save file import.
```

## Items standard (2026-10-23)

`tools/itemstd.py` (shared, idempotent) puts every guide's Items in one box set: Valuables, Key Items, Shops, TMs and HMs, Move Tutors, Held Items, Evolution Items, Stats and Abilities, Mega Stones / Z-Crystals, Fossils, Useful NPCs; a sub-heading on every row (`r[4]`), `Found:` / `Wild:` / `Also:` / `Shop:` lines, and the walkthrough's item rows rewritten to match. Run by `consistency.apply` (rules: `itemstd.RULES['hardlove-gold']`, the `Other` box mapped in `HG_OTHER`). Held Items classes renamed (Type boosting -> Type boosters, Battle -> Battle gear, Consumable -> One-use items); the four evolution items (Metal Coat, King's Rock, Razor Claw, Razor Fang) stay in Evolution Items only; `Other` split: 8 Key Items, 6 Valuables (Master Ball, Big Nugget, Rage Candy Bar, Escape Rope), 3 Useful NPCs (texts hand-written in `HG_OTHER`). TMs + HMs one box in game order. Prose places became Found / Also / Shop lines (`Sold at` = Shop; given by / gift / from the X / reward = Also; else Found); `Starter:` and `Possible to miss permanently` stay last.
