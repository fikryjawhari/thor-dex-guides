# photonic-sun build notes

Photonic Sun 2.38 (Buffel Saft), **Rebalanced** version, a 3DS hack of Ultra Sun. Built 2026-10-19 in this repo:
`uv run python -I hacks/photonic-sun/extract/build.py` writes `data.json` and `extract/report.txt` (every guess and
conflict), then `python assemble.py photonic-sun`. Sources: `SOURCES.md` (all fetched into `.src/`; the extract also
makes `.src/txt/`, `pdftotext -layout -enc UTF-8` copies of the PDFs).

928 Pokémon and forms (876 obtainable, 50 Megas/Primals, 2 trainer-only), 728 moves (38 changed), 233 abilities,
73 encounter areas (72 tracker slots), 497 trainers, 29 caps and 31 trainer/walkthrough splits.
The 137 published walkthrough stops become 148 cap-aligned fragments. Part B details and the saved-open-state
integration blocker are below; do not merge/deploy before the shared-template fix.

## Sources and rules

- **Game data is the authority** (PROGRESS.md → Source data check): `dex-rebalanced.json` (tools/ctr_dex.py on the
  hack's romfs and code.ips over the user's Ultra Sun v1.2 dumps) for species, moves, abilities, TMs and wild tables;
  `trainers-rebalanced.json` (tools/usum_trainers.py) for every trainer set, natures, IVs and EVs included. The docs
  are the check and give what the game data can't (wild methods, specials, shops).
- **Vanilla comparison:** `dex-vanilla.json` and `trainers-vanilla.json`, the same two tools on the vanilla dumps
  alone. MV.h (move change notes) compares the two dex files; the Move Changes doc's paragraph is MV.e (shown as
  "Move Changes doc"). Part B no longer emits P.vc; move comparisons and their wording remain.
- **Forms** (dex.py): totem forms (unnamed forms in the personal table) are dropped, except Own Tempo Rockruff, which
  evolves into Dusk Lycanroc. Cosmetic duplicates (same types, stats, abilities and level-up moves as a lower form of
  the same species: Pikachu caps, Unown, Arceus, Silvally, Minior colours, Furfrou, Vivillon, Flabébé line, Genesect...)
  fold into the lowest form. Megas and Primals are g 1; battle, item and fusion forms are P.fc (FC in dex.py).
  The two Zygarde 10% forms (Aura Break, Power Construct) are pruned in Part B. Shedinja and the Sandy / Trash
  Wormadam evolutions are added by hand (the evolution table can't say them once Burmy's cloaks are folded).
- **Wild tables** (locs.py): the game's tables have no method and repeat for every grass patch and fishing spot.
  Identical tables merge; each is labelled from `Wild Pokemon Locations.pdf`, read by word position (area titles are
  the 18 pt lines; a table is a bold heading, a bold "Levels: a-b" line, species in the first column). A game table
  takes the PDF table under a matching area title that shares at least half its species, scored on species and the
  level range. Small partial matches that aren't water tables are "Ambush Encounters" (shaking trees and grass the
  PDF doesn't always list). The game's leftover placeholder tables (Route 1 copies at level 2-3, Pikipek 100% in
  towns) are left out.
- **Sections** (2026-10-20, `sections()` in locs.py, the user's design A): each area's Locations page is one section
  per game table, named from the PDF (Grass 1, Hau'oli Outskirts, Cave...), with day and night in one row ([day,
  night] rates). The same table in two game areas counts once (it used to double Route 1's Grass 2/3 rates); copies of
  a table in other patches merge, and a species only some copies have says "Only in some patches" (Route 1 Grass 3:
  Scatterbug at night). Water = Fishing + Surfing; of an area's fishing copies, the higher-level ones are the
  bubbling spot, shown as a second rate (the PDF's level ranges don't always match the game's, so they can't decide
  it). Berry piles, ambush, dust clouds, shadows, splashes and Wimpod share an "Other" section. 0% slots are dropped
  (Poni Grove's Stakataka / Blacephalon).
- **SOS** (tools/ctr_dex.py `sosBy`): each slot's allies, so a row knows exactly whom it calls (Corsola → Mareanie,
  Clamperl → Gorebyss by day, Huntail at night); allies the same as the caller are left out, other forms kept
  (Kantonian Rattata, East Sea Shellos). Every ally gets a P.w row "SOS ally", note "Called by ...", so Pokémon pages,
  search and the tracker know it. Weather allies (rain, sand, hail) come from the game's tables (`sosWeather`).
  This found Eternal Floette (Poni Meadow) and Diancie (Carbink) as allies, so they're obtainable now.
- **Maps** (`pdf_maps()`): the PDF's numbered grass maps (Route 1, Hau'oli City, Routes 2, 3, 5, 6, Mount Hokulani),
  rendered from the page (the circles are drawn over the picture), at most 520 px wide, 96 colours, as data URIs
  in AR.map (134 KB). Credited to the doc in the guide. The island overview pictures are skipped.
- **Areas** (tracker slots) are the PDF's area titles in its order, plus Starter (first, so the rival filter has a
  place; Ultra Sun gives the starter on Route 1, so the walkthrough files it under Route 1) and the places of the
  Special Encounters doc. TITLE_FIX tidies three titles. SPLIT makes a game table an area of its own (Route 1's
  Hau'oli Outskirts table, 2026-10-21); new areas go at the end of AR so saved trackers keep their slots, and AFTER
  puts them in place in D.ARO, the Locations order (Starter, Route 1, Hau'oli Outskirts, Trainers' School, Hau'oli City).
- **Specials** (SPECIALS in locs.py): Special Encounters.pdf transcribed by hand from word positions (Island Scan by
  weekday with special moves, the Ultra Wormhole legendaries, gifts, totem stickers, fossils). The doc says
  legendaries it doesn't list "can be found in their usual locations ... at higher levels", so Ultra Sun's places are
  listed for those (Ultra Wormhole legendaries, Tapus in their Ruins, Necrozma, Nihilego / Xurkitree / Guzzlord) with
  no level. Trades: levels and items from the doc, the Pokémon you give from Bulbapedia's In-game trade page.
  Not found (5): Original Cap Pikachu (event), Eternal Floette, the Zygarde forms other than 50%.
- **Trainers** (trainers.py): the game data has no places. Bulbapedia's Ultra Sun / Ultra Moon walkthrough lists the
  trainers in story order with vanilla teams (Trainerentry for regular trainers, Party for bosses); each entry is
  matched to a vanilla trainer by class + name, then species and levels (pairs like "Twins Isa and Nico" by either
  name), and the hack's trainer with that id is used (the hack edits trainers in place). Leftovers are placed from
  the location pages' trainer lists (exact team first, then exact place name, never a prefix in the middle of a
  number: "Route 17" isn't "Route 1"). Mallow's level 100 team is her post-game Kantonian Gym battle (the Important
  Trainers doc; Bulbapedia doesn't list it), Ryuki's level 50 the optional pre-League Kantonian Gym, Battle Buffet,
  Tristan (= Taro) and Harper and Sarah are placed by hand (PLACE), so nothing is left in "Other trainers". 140
  placeholder entries (no name, or one level 5 Yungoos with no moves) are dropped. 5 walkthrough entries match no
  trainer (a Fomantis grunt, an Arbok grunt in RR, Rada and Lillie at the Battle Tree, a level 61 Faba): the game
  data wins, they're left out.
  Read from the walkthrough: `{{Party/2}}` and `{{tt|lv|...}}` levels, trainerdiv captions (notes), `=== sub-places ===`
  in Parts 14, 21, 31 (`==== VS X ====` stays in its room). `prize = none` parties are partners (t.pt, shown first in
  the battle's card; Hau's Aether copies kept once), except the Battle Royal. Trainers fought at once share t.bt
  (one row per battle); tags Double / Multi Battle / Battle Royal / Prismatic Moon (the MOON table, with "Prismatic
  Moon only. In Photonic Sun you fight X instead."). Story trainers repeated after the League go to the post-game
  box; location-page trainers at post-game levels go to "<place>: post-game". "If the player chose X" (PlayerChoice) is t.st: rival and other
  starter-dependent teams follow the starter picker. Pokémon with no moves set use their last four level-up moves
  (the Gen 7 default). A Mega stone holder is shown as its Mega with a0 = the base ability. Bag items are a note.
  CHAPTERS is an intermediate placement/keying scaffold only. Published trainer keys are assigned with the old
  scaffold, then consistency.py regroups sections and trainer runs by cap without renumbering trainer keys.
  Episode RR retains its rooms; all other postgame sections share the final Post-game box.
- **Level caps** (CAPS in trainers.py): one list including all mini caps, except Dexio (Heahea) and Battle Royal.
  Equal, decreasing and immediately adjacent caps stay, including Ultra Necrozma 100 before Ribombee 95.
  Totem levels come from Totem Battles.pdf. Each place shows its next cap
  and the battles left before it: one per battle (t.bt), one starter's rival fight, no optional places, Kantonian
  Gym, Battle Buffet or Prismatic Moon teams. Route trainers you can walk around all count: no source marks them
  (Bulbapedia's walkthrough and location pages don't, Serebii doesn't), so there's no "forced" count.
  Checked: Captain Ilima's three teams match Important Trainers, Rebalanced.pdf (species, levels, abilities, items,
  moves). The PDFs are not compared field by field (no "Sheet says" notes); the game data wins anyway.
- **Items** (items.py): Serebii's Ultra Sun item lists (the hack's zone scripts are vanilla, SOURCES.md), vanilla mart
  rows dropped except the Battle Tree's BP shop; shops from Vendor Changes.pdf (SHOPS, transcribed). TMs teach the
  hack's moves (TM59 Sucker Punch, TM60 Aura Sphere, TM67 Rock Climb, TM79 Freeze-Dry, TM100 Curse). Mega stones
  link to their Mega through the game's Mega table and fill P.stone only (no place: the stones are generated in).
  Boxes (pass 2, `plans/ps-items.md`): Shops (a row per item under its kind, every shop on its own line), TMs,
  Z-Crystals, Evolution Items, Held Items (sub-headings by class: HELD), Stats and Abilities (STATS), Key Items. No
  Battle Items, Fossils (Poké Pelago only) or Mega Stones box. Each item is in one box (plus Shops); items in two
  Serebii lists (King's Rock: hold and evolution) go to Evolution Items. Rows read Found / Wild / Also / Shop, one line
  each, Found in game order; the walkthrough files them by `_itp` (the old '; ' place list). Game order (Key Items,
  Stats and Abilities, TMs, Z-Crystals) = the walkthrough stop of the earliest place (`items.order`, after walk.py);
  wild holders count where they live, the left clerk by trials; vanilla marts don't count. The rest A to Z.
- **Walkthrough** (walk.py): stops start in Bulbapedia part/place order, then consistency.py regroups them into the
  Trainers cap splits. Areas join the first stop with
  their name (ALIAS for Routes 15 and 16 and others; PLACE picks the stop by hand: Route 1's wild Pokémon with part 2's
  Route 1 visit, part 1 keeps the starter; Hau'oli Outskirts and Trainers' School in part 2); areas with no stop are
  "on the way" stops after the previous area's stop. NEW_STOP adds Trainers' School after part 2's Route 1 (Hau'oli
  Outskirts), with Youth Athlete Hiromi through Teacher Emily from there (the Trainers tab still has them under Route 1
  (Hau'oli Outskirts): it follows trainers.py). Items file under the first stop named in their location (ITEM_ALIAS for rooms like Shady House); the
  rest are in Guide info. ITEM_IN files a place inside a stop's ("Route 1 - Trainer School") under that building. Game docs: Evolution, Type and Move Changes, Totem Battles (preformatted, scrolls sideways),
  the Mega Evolution guide and the changelog.

## Conflicts and findings (report.txt)

- The Move Changes doc says Triple Kick 10 → 20 power; the game data still has 10. Toxic Thread's new effect isn't a
  number the move data shows.
- Wild tables that differ from the PDF (the game is shown; the full list, rates and levels included, is
  `tools/mockup/ps-locations/pdfcmp.py`'s output, summed up in the round 1 mockup's Findings tab): fishing rates on
  Routes 7 and 9, Akala Outskirts, Seafolk Village (Dhelmise 50%, doc 5%), Poni Breaker Coast, Malie Garden (Goldeen
  and Seaking swap by spot); grass rates on Route 5, Brooklet Hill, Ula'ula Meadow, Vast Poni Canyon (plus Boldore),
  Poni Meadow, Route 16, Ancient Poni Path, Thrifty Megamart; levels at Verdant Cavern, Route 3 shadows, Route 8
  surfing and most bubbling spots; Poni Wilds berry piles are half Crabrawler; Route 1 Grass 3 has Scatterbug at
  night in one patch; Poni Grove's Stakataka / Blacephalon slots are 0%.
- Not in the hack's sources at all: totem battle sets (Totem Battles.pdf is a game doc, not trainer cards).

## Data schema

As Hardlove Gold (hacks/hardlove-gold/notes.md → DATA SCHEMA), with: P ids are slugs of the display name
("raichu-alola", "mega-charizard-x"); no P.vc; MV.h always a list; MV.e + MV.dc the doc's
paragraph; P.w rows [area, method, rate "%"/"", level, note, 1?] where the note of a Trade is its tracker label
("For Spearow"), the rate may say "20% (day)" / "15% day, 20% night", and a 6th field 1 means the row repeats the
area's sections (the template lists only the other rows, gifts and trades, apart); AR.es the area's sections
[{n, k grass|water|other, g:[{m label, lv, bl bubbling levels, rows:[{p, r:[day,night], b:[day,night], sos:[[ally,
""|"day"|"night"]], note}]}]}]; AR.st 1 = the starter picker is this area's tracker; AR.map [data URI]; AR.note (trade items, Ultra Space Wilds); ARO the Locations order (EI's notes); TR trainers carry `id` (the game's trainer id) and
`note` (bag items), `bt` (battle id, shared by trainers fought at once), `pt` partners [{n, st, p}], `tags`; sections
carry one `cap` [level, who, where, battles left] or no cap after the League, and `opt` (optional place);
TR.caps is one [name, level] list and TR.mini is absent; mons carry `ao` ("Stakeout / Strong Jaw") when the ability slot is random; WK has no cheats or
checklist steps, and WK.docs holds the game docs.

## Local storage (prefix ps)

`psdex` list filters, `pscalc:<id>` + `pscalc:lastlv` stat calc, `pstrack` tracker {s starter, e, t}, `pswalk`
walkthrough open state, `pscap` levels per trainer, `pstr` open trainer boxes, `psrecent` search picks, `pspos` last
route, `psmgm` Minimal Grinding Mode, `pscapset` level cap set, `psloc` / `psitems` open boxes. Keep them once published.

## Part B consistency pass (2026-10-23)

Base: worktree-consistency-template a07645a, including Part A 98cc969. Scope is this hack only. No shared helper,
template, plan, PROGRESS or other hack changes. Parallel work is authorised by the latest instruction.

- Pruning is after all extract stages, in consistency.prune: keep obtainable species/forms, trainer opponents and
  partners, and Megas/Primals whose base dex is obtainable. Filter other-form/evolution references to retained IDs.
  931 -> 928: removed `pikachu-original-cap`, `zygarde-10`, `zygarde-10-power-construct` (all unavailable and unused).
  Keep `zygarde-50-power-construct` and `blacephalon`: trainer-only. All 50 Megas/Primals remain obtainable.
- All 497 trainer records, keys, teams, partners, notes, EVs and per-trainer saved-cap references are unchanged.
  All 73 AR indices, AR contents, LOC/ARO and move/ability indices match the committed baseline exactly.
  Dex state stores filters with move/ability/location indices, not Pokemon-list positions; TK.e[area].p is a slug ID.
  Every obtainable ID remains, so none of the normal tracker choices can be removed by pruning.
- TR: 9 chapter boxes -> 31 cap/postgame boxes, 101 -> 111 sections. Retain all 31 old cap entries except the two
  requested removals: 29 caps, including the previously auto-dropped 8 mini caps. Trainer runs split at the actual
  boss battle within a place, using the existing counted-battle rules; no trainer data is invented for totems.
  Ultra Necrozma's cap box has zero trainer cards because that fight is not in the source trainer sets.
- WK: 35 parts -> the same 31 boxes, using tools/splits.py. Keep all 137 old visits; 11 extra fragments separate
  trainers across cap boundaries, retaining each visit's encounters/items/notes once. Preserve all 502 original
  walkthrough trainer occurrences (the published walkthrough already repeats some of its 497 trainers).
  Both tabs end Elite Four Split [Cap 100], Post-game: Episode RR, Post-game. The two Poni Grove trainers and
  Guardians/Ultra Space/Battle Tree/Title Defense content are in the last box; neither postgame box has a cap.
- Key Items: 30 -> 29. Drop Surge Badge: a souvenir from the Kantonian Gym, not a progression unlock.
  Retain Professor's Mask: Part 16 explicitly asks you to deliver it to Kukui. Retain story petals/flower/flutes,
  Forage Bag, Sparkling Stone, Left Poke Ball sidequest, charms, Exp. Share, Ride Pager, Fishing Rod, transformation
  tools, Key Stone and Z-Power Ring. Holo Caster, Running Shoes and Town Map were not present in PS's source list.
  Use an explicit allowlist to prevent equivalent future clutter. Only Surge Badge disappears from the walkthrough;
  327 -> 326 placed item rows, 13 unplaced rows unchanged. No Part C category/style changes.

### Rebuild inputs and safeguards

The available main-checkout dex-rebalanced.json predates `sosBy`. Running the full extract with it silently dropped
SOS rows and made Rattata and other obtainable forms unavailable. Regenerated only that ignored JSON with current
tools/ctr_dex.py, reading the existing hack romfs/code.ips and both vanilla Azahar dumps read-only at their existing
paths (SOURCES.md command). No downloads or romfs/ZIP copying. locs.py now refuses stale JSON lacking sosBy.
The resulting AR/LOC/ARO and every retained Pokemon's encounter rows match the committed baseline exactly.
Other inputs copied locally: two trainer JSONs, vanilla dex JSON, item CSV, Changelog, Wild Pokemon Locations.pdf,
the existing PDF text cache and Bulbapedia pages. Raw inputs remain ignored. No common.py correction was necessary;
build.py adds post-build pruning, trainers.py exposes cap grouping, and walk.py consumes it.

### Compatibility: shared runtime fix required before integration

The plan's stable walkthrough key assumption is false in a07645a's template/dex.js. `walkStop`, `nextStep` and
split checkbox totals use `si.ti` / `si.ti.step`; WO.o uses split indices, WO.x stop indices, WO.s `si.ti.section`.
PS has **zero real checklist steps** before and after. No real published tick can be lost, but merely retaining
synthetic WO.c bytes does not prove checklist rendering compatibility.

119 of 148 new stop coordinates differ from the original visit. Original unpatched DOM-level old-build -> new-build reproduction,
in normal and dvkb mode: Route 1 `1.0` becomes `0.7`. Baseline stop and encounter section render closed from saved
`WO.x['1.0']=0`, `WO.s['1.0.e']=0`. After regrouping, the corresponding stop and encounter section render OPEN.
A synthetic checklist probe at that same logical stop is checked in the old build but UNCHECKED in the new build,
even though `WO.c['1.0.0']=1` remains stored. This probe modifies only runtime data, never the shipped walkthrough.
Trainer box/place open states also use indices, although trainer-card keys and per-trainer levels survive.

Every stop carries `k`: its original `si.ti` on the first fragment; additional fragments use `si.ti.fN`, all unique.
`WK.legacyStops` maps new coordinates -> old visit coordinates, including every fragment. `TR.legacySections`
maps new group/section coordinates -> old coordinates. These are stable-key/migration inputs only: this branch's
template ignores k and both maps. Parent handles the shared fix separately, as instructed. Do not merge/deploy
this branch without that fix. No runtime workaround or shared edit is hidden in this branch.

2026-10-23 follow-up: parent's uncommitted `migrateWalkState` remaps WO.c/o/x/s into current positional coordinates
and stamps WO.layout with stable stop identities. Changing the raw coordinate bytes is necessary to avoid collisions;
preserving the old dictionary byte-for-byte is NOT a compatibility requirement. Removed the incorrect stored-byte
assertions and the impossible static `not shifted` integration gate. The strict check now requires explicit baseline
and current HTML paths and runs the browser regression; k/maps/layout fields alone cannot make it pass.

Read-only parent overlay `.tmp/state-photonic-sun.html`, against parent's `.tmp/state-before/photonic-sun.html`,
passes normal and dvkb at 260 x 316, both for legacy saves without layout and saves stamped with the old layout.
Each scenario seeds all 137 old stops and checks all 148 rendered new fragments: closed stops and encounter
sections where present, open checklist sections, checked first synthetic step, unchecked second synthetic step,
and expanded splits. Expected c/o/x/s are derived from legacyStops, including inheritance across fragments; the
stored layout must match current stable identities. Document/Guide info flags, all 72 saved tracker picks, dex
filters, per-trainer cap and 260 px width survive. Reload is idempotent; unchecking/reopening Route 1 survives another
reload; clearing all ticks does not resurrect legacy values. There are no browser page errors. Runtime-only probes
never change shipped data, which still has zero real checklist steps.

Negative control: rebuilding this branch's original template and running the same strict gate exits 1 on actual
Route 1 rendering at `0.7`: stop and encounter section open, checklist closed, checkbox unchecked. It is not treated
as a passing diagnostic. Runtime compatibility therefore passes ONLY with the shared fix applied. This PS branch
alone remains not ready to merge. The parent overlay is external test evidence, not a committed dependency here.
Shared Next step/jump/scroll-anchor and trainer o/p migration are not exercised by this PS test; parent owns those
checks (its `tools/walk-state-check.mjs` covers additional walkthrough behaviour). Keep every configured storage
name and never replay legacy maps after users save current-layout state.

### Checks and handover commands

Baseline: committed data.json at a07645a, local .tmp/ps-before.json. Its HTML uses the same Part A template and
baseline species sprite keys (.tmp/ps-before.html). New fields k/maps are data only; no template consumers changed.

```
uv run python -I hacks/photonic-sun/extract/build.py
python -I hacks/photonic-sun/extract/check.py .tmp/ps-before.json
python -I hacks/photonic-sun/extract/check.py .tmp/ps-before.json --require-viewer-compatibility --baseline-html "C:/Users/fikry/.t3/worktrees/thor-dex-guides/worktree-consistency-template/.tmp/state-before/photonic-sun.html" --viewer-html "C:/Users/fikry/.t3/worktrees/thor-dex-guides/worktree-consistency-template/.tmp/state-photonic-sun.html"
python assemble.py photonic-sun
# Negative control below MUST exit nonzero until the shared template fix is integrated:
node hacks/photonic-sun/extract/statecheck.mjs .tmp/ps-before.html dist/photonic-sun.html
node tools/consistency-check.mjs
node tools/mockup/walkcheck.mjs dist/photonic-sun.html .tmp/ps-walk
node tools/mockup/walkcheck.mjs dist/photonic-sun.html .tmp/ps-walk-kb kb
node tools/mockup/pagecheck.mjs dist/photonic-sun.html .tmp/ps-page
node tools/mockup/pagecheck.mjs dist/photonic-sun.html .tmp/ps-page-kb kb
node tools/domcompare.mjs .tmp/ps-before.html dist/photonic-sun.html --jobs=4
node tools/domcompare.mjs .tmp/ps-before.html dist/photonic-sun.html --kb --jobs=4
```

Structural check passes exact indexed-table/area/trainer equality, species references, cap/postgame ordering, Poni
Grove placement, legacy visit/encounter/item/trainer coverage and key-item decisions. The follow-up strict runtime
gate exits 0 for the fixed parent overlay (four mode/save-format combinations), and exits 1 for the unpatched local
dist viewer at the rendered-state assertion. Missing explicit HTML arguments exits 2, not a static compatibility PASS.
Logs: `.tmp/ps-state-fixed-followup.log`, `.tmp/ps-state-unpatched-followup.log`,
`.tmp/ps-state-missing-html-followup.log`. Node syntax, Python py_compile, PS assembly and git diff --check pass.
The following broader checks are from the original Part B implementation, not rerun for this tests/notes-only follow-up.
The shared consistency check requires all four dist files (built locally) and passes both modes, all five viewer
sizes, expanded pages and light theme for all four, including PS's MGM/pickers/caps. Its synthetic tick-storage
PASS is not evidence that the legacy stop/checklist rendering blocker is resolved.
walkcheck/pagecheck: no page errors, 260 px document width in both modes. domcompare: 2,467 routes per mode,
zero page errors, hashchange timeouts or unsettled routes; expected DOM differences include footer species/date,
split labels, trainer group context and pruned forms. Exit 1 for differences is expected, not an identical-build PASS.
Repeated full extracts produce byte-identical data.json and report.txt. Python compileall and git diff --check pass.
The localStorage config dictionary is identical to a07645a. No physical Thor/device check was performed.
