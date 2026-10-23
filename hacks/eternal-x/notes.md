# eternal-x build notes

Eternal X 2.67 (Buffel Saft), **Rebalanced** version, a 3DS hack of Pokémon X. Built 2026-10-22:
`uv run python -I hacks/eternal-x/extract/build.py` writes `data.json` and `extract/report.txt` (every guess and
conflict), then `python assemble.py eternal-x`. Sources: `SOURCES.md` (game data regenerated 2026-10-22; the extract
reads `.src/txt/`, `pdftotext -layout -enc UTF-8` copies of the PDFs, made by build.py). Plan and open items:
`plans/eternal-x.md`. Model: Photonic Sun's extract; schema as `hacks/photonic-sun/notes.md` → Data schema, plus
`t.pl` below.

782 Pokémon and forms (29 Megas, 23 form changes), 617 moves (38 changed), 39 areas, 680
trainer cards, 7 item boxes, 21 walkthrough splits with 74 stop fragments retaining 69 original stop keys.

## Sources and rules

- **Game data is the authority**: `dex-rebalanced.json` (tools/ctr_dex.py on the hack's romfs + code.ips over
  vanilla X v1.0) and `trainers-rebalanced.json` (tools/xy_trainers.py). Insanity - Rebalanced has the same dex; its
  trainers aren't in this guide (the user's choice). Vanilla comparison: `dex-vanilla.json`, `trainers-vanilla.json`.
- **Dex** (dex.py): as Photonic Sun. Cosmetic duplicates fold into the lowest form (Unown, Vivillon, Furfrou...);
  Floette Red and Yellow stay apart (their data differs somewhere). Pumpkaboo's sizes have blank evolution rows in XY:
  the base form's apply. Move Changes.pdf is MV.e.
- **Wild tables** (locs.py): areas = the Wild Pokemon Locations doc's titles, in its order ("the order they become
  accessible"); the 53 game zones are matched to the doc's sub-areas by species overlap, one to one, and sub-areas
  (1F, B2F, Outside) are sections named by floor. Sections: Grass, flowers, Rough Terrain = grass; Surf and rods =
  water; Rock Smash and hordes = other. Hordes: one group per horde table ("Horde 60%"). Slots of one species in a
  table are summed. Cosmetic forms the dex folds (Scatterbug, Munchlax, Misdreavus, Whiscash) use the base form.
  ~79 of 694 doc rates differ from the game (doc typos, missing hordes): the game wins. Route 17 is "Snow" in the doc,
  Rough Terrain in the game.
- **Gifts and fixed encounters**: levels and held items from the hack's own `DllField.cro` (`.src/cro/`, from the
  zip; vanilla's from the dump; `cro_specials()` in locs.py: statics 12-byte entries at 0xEE46C, gifts 24-byte at
  0xF805C, level byte 3 / 5, item at 4 / 12). The hack changes: Kanto starters Lv 15 with Eviolite, Lapras Lv 35,
  fossils Lv 25, Kalos starters hold a Big Nugget, Torchic (Blazikenite) replaces the Route 2 Pidgey, Xerneas 60,
  birds 85, Zygarde and Mewtwo 90. Places are vanilla X's (Bulbapedia; no script edits): Lumiose City and Team
  Flare Secret HQ are appended areas (ARO puts them in place); the roaming bird follows the starter (Chespin
  Articuno, Fennekin Zapdos, Froakie Moltres; "Starter: X" in the note). Frost Cavern's Abomasnow (Lv 45) is a battle,
  not a catch. In-game trades aren't added.
- **Trainers** (trainers.py): Bulbapedia's X / Y walkthrough matched on vanilla teams (class + name, species,
  levels); the hack's trainer with that id is used. 54 placeholders dropped. Rival / Shauna / Tierno / Trevor ids are
  fixed (RIVAL, FRIEND). Boxes follow the single cap list, including mini caps, named with the shared
  `tools/splits.py` helper; the league is Elite Four Split [Cap 82], then Post-game. The old gym grouping still
  assigns trainer keys before the cap regroup, keeping every published trainer key unchanged. Hand placements (guesses): Hotel Richissime (38), Battle Chatelaines,
  4 by id neighbour, 156 nameless trainers (id 614+) as a Battle Maison pool in the post-game box (all post-game:
  levels near or above Diantha's 87, or Maison's fixed levels). 28 trainers no Bulbapedia page names (Drivers, a
  Gardener "●"...) are vanilla X's unused data and are dropped. No natures or EVs (cfg.evs false); IVs are the trainer byte / 8.
- **Level caps** (CAPS, `level_caps()` in trainers.py; consistency pass 2026-10-23): one `TR.caps` list, no
  `TR.mini`; each story section has one `[level, who, where, battles left]` entry. Eight Gym Leaders and the
  Elite Four's highest level (82, not Diantha), plus the retained rival / Flare mini caps. Sycamore Lumiose 18
  and Couriway 70 are removed; Route 19 is Shauna, Tierno & Trevor 72. Previously redundant Tierno 18 and
  Victory Road's rival 78 remain excluded. Battles
  left count one per battle, one starter and player's rival version, no Battle Chateau, no Viola nerf card. Tags from the battle
  field (Double / Triple / Rotation, Multi Battle with a partner). Moves default to the last four level-up moves.
- **Rivals, player picker**: `t.st` = starter name, `t.pl` = the player character the team appears for ("m" boy,
  you fight Serena; "f" girl, you fight Calem), on rival cards and partner entries (`pt`). Partners: Route 7,
  Glittering Cave, Poké Ball Factory, Team Flare Secret HQ. Viola nerf: a second Viola card with its own `bt`,
  tagged "Viola nerf patch" (only trainer 6 of `trainers-rebalanced-viola-nerf.json`).
- **Items** (items.py): Bulbapedia's Kalos pages (`{{Itemlist}}` X rows, `{{shop}}` stocks) with the Item Changes doc
  applied (DOC_SWAPS, TM_WAS, Mega Stones in every Mart from five badges); TMs teach the hack's moves (code.ips).
  Boxes: Shops, TMs, Evolution Items, Held Items (by class, Mega Stones a class), Stats and Abilities, Fossils, Key
  Items. Rows with only `y=yes` are Y-only and skipped. Items no location page places take the walkthrough pages'
  `{{itemlist}}` rows (the Kanto stones from Sycamore with your Kanto starter, TM54, the lenses...).
- **Walkthrough** (walk.py): the Trainers page's cap splits, then Post-game. A place spanning cap boundaries is
  split into trainer fragments; encounters, items and steps stay on the first fragment, without duplication.
  Every fragment carries `k`, the original gym-split stop coordinate. See the runtime compatibility blocker below.
  PLACE puts Team Flare Secret HQ (Xerneas) at part 11's Geosenge Town; ALIAS Starter → Aquacorde
  Town; ITEM_ALIAS files gyms and buildings under their town; a Lumiose item goes to the earliest part whose Lumiose block
  lists it (8 move to parts 8 and 11), the rest stay at the first visit (part 3).
  Lost Hotel and Terminus Cave are "on the way" stops. Game docs: Evolution Changes, Move Changes, Changelog.

## Local storage (prefix ex)

`exdex`, `excalc`, `extrack` (tracker {s starter, pl player, e, t}), `exwalk`, `excap`, `extr`, `exrecent`,
`expos`, `exmgm`, `exloc`, `exitems`, `excapset`. Keep them once published.

## Part B consistency pass (2026-10-23)

- **Availability** (`extract/availability.py`, last build stage): direct encounters/gifts seed a fixed point over
  evolution and breeding links. Form changes need an obtainable base; Megas additionally need a located stone.
  Shown trainers and partner teams retain their exact used forms even when unobtainable, marked trainer-only.
  Removed IDs: `mega-mewtwo-y`, `wormadam-sandy`, `wormadam-trash`, `floette-eternal` (786 -> 782).
  763 entries are obtainable including forms/Megas; another 19 are trainer/partner-only. No species IDs are
  renumbered; evolution and alternate-form links are filtered to retained IDs. `p.vc` is no longer generated;
  move changes remain. No cross-hack helpers changed; only Eternal X's build pipeline adds the final prune stage.
- **Key items**: remove Holo Caster, Running Shoes, Town Map and Adventure Rules (automatic/tutorial clutter),
  Lens Case (cosmetic contact lenses), Honor of Kalos (commemorative trophy). Add the already-sourced Poké Radar
  row, previously omitted by the whitelist. Keep movement tools, all rods/HMs, Dowsing Machine, Exp. Share,
  Mega Ring, Poké Flute, story/access keys and passes, Prof's Letter, Looker Ticket, Intriguing Stone (Sun Stone
  exchange), form-change items and Vs. Recorder (battle recording). 33 -> 28 Key Items; other box sets unchanged.
- **Sources**: copied the required JSON, `txt/`, `bulbapedia/`, `cro/` and Changelog from the main checkout's
  existing ignored `.src/`. No downloads, ROM extraction or external helper edits were needed. Raw inputs stay
  ignored. Full `python -I hacks/eternal-x/extract/build.py` succeeds; repeat runs on the same date produce
  identical data.json bytes. `python assemble.py eternal-x` succeeds (782 shared sprites, no missing sprites).
- **Data checks**: `python -I hacks/eternal-x/extract/check.py <pre-B-data.json>` passes. Checks cover evolution,
  usable/unavailable Megas and forms, trainer/partner retention, no dangling references, exact cap coverage and
  matching Trainer/Walkthrough split names; all 680 complete trainer cards including their original keys and
  partners are unchanged. AR, ARO and LOC are byte-equivalent as parsed objects. All 69 original stop keys,
  attached area indices, trainer references and checklist arrays are retained across the 74 fragments.
- **Saved-state evidence**: `template/dex.js` stores `LS.dex` as `{f,sort,av}`, not species-array indices;
  `TK.e[area].p` and `TK.t` contain string species IDs; calc inputs use `LS.calc + ':' + p.id`. Config/storage
  key names are untouched. Browser seeds verify ordinary catches, a failed area, starter/player, trades and even
  a removed species ID previously selected using Other remain in stored state (a removed species no longer has
  a display option; its stored value is not rewritten). Trainer card keys remain stable for cap/open state.
  Eternal X has **zero checklist steps** before and after, so no real checklist ticks can be reassigned.
- **Unresolved shared-template blocker (do not treat this as a clean compatibility pass)**: the plan's assumption
  of stable walkthrough stop keys is false in Part A. `walkStop` still uses `si + '.' + ti` for `WO.x` / `WO.s`,
  and checklist/summary helpers likewise use positional coordinates. The emitted `s.k` retains the legacy key,
  but current template code ignores it. 56 of the 74 fragments have different positional coordinates.
  Confirmed in normal and dvkb: Connecting Cave has legacy key `1.8`, new coordinate `2.0`; seeded
  `exwalk.x['1.8']=0` survives storage but the stop renders open. The shared template must honour stable stop
  keys consistently, with positional fallback for other guides, before merging/deploying this regroup.
  This task did not edit template/shared code. Split accordion/scroll positions also remain positional.
- **Headless checks**: existing `pagecheck.mjs` and `walkcheck.mjs`, both normal and dvkb, at 260 x 316:
  no page errors and reported widths 260. An ignored Eternal-X-only copy of `tools/consistency-check.mjs` passes
  its tracker/picker/cap checks, all five viewer sizes (260 x 316, 260 x 350, 480 x 392, 537 x 424, 832 x 424),
  expanded Locations/Trainers/Walkthrough and light theme in both modes; it separately confirms the blocker above.
  `domcompare` sweeps 2,316 routes per mode: zero page errors, hashchange timeouts or unsettled routes; exits 1
  because DOMs intentionally differ (footer totals/date, split names, pruning and key items), not an identical-DOM
  pass. Local baselines, logs and minimum-size screenshot are under `.tmp/ex-*` / `.tmp/eternal-x-baseline.*`.
