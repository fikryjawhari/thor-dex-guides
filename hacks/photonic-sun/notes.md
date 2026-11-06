# Photonic Sun build notes

Photonic Sun 2.38 (Buffel Saft), **Rebalanced** version, a 3DS hack of Ultra Sun. 928 Pokémon and forms (876 obtainable,
50 Megas / Primals, 2 trainer-only), 728 moves (38 changed), 233 abilities, 73 encounter areas (71 tracker slots), 497
trainers plus 13 Totem encounter cards, 29 caps and 31 trainer / walkthrough splits. The 137 published walkthrough stops are 148 cap-aligned
fragments.

## Build

```bash
uv run python -I hacks/photonic-sun/extract/build.py        # .src/ -> data.json + extract/report.txt (every guess and conflict)
uv run python -I hacks/photonic-sun/extract/check.py [baseline.json]
python assemble.py photonic-sun
```

Modules: `dex.py` (M MV AB P TC), `locs.py` (LOC AR P.w), `trainers.py` (TR), `items.py` (IT), `walk.py` (WK), then
`items.order` (game order, needs WK), `prune.py` (species kept) and `finalise()` in `tools/extractlib.py` (Items
standard, prune, shared split names). `build.py` first makes `.src/txt/` (`pdftotext -layout -enc UTF-8` copies of the
PDFs). Fetch the sources with `SOURCES.md`. `locs.py` refuses a `dex-rebalanced.json` without `sosBy` (it would silently
drop SOS rows); regenerate it with the `ctr_dex.py` command in SOURCES.md.

## Sources and rules

- **Game data is the authority** (PROGRESS-DETAIL.md → Source data): `dex-rebalanced.json` (tools/ctr_dex.py on the hack's
  romfs and code.ips over the user's Ultra Sun v1.2 dumps) for species, moves, abilities, TMs and wild tables;
  `trainers-evless.json` (tools/usum_trainers.py on the EV-less mod copy) for every trainer set, natures and IVs
  included; `statics-rebalanced.json` (tools/usum_statics.py) for the Totem battles. The docs are the check and give
  what the game data can't (wild methods, specials, shops).
- **EV-less (2026-10-29, the user's choice):** the guide follows the user's EV-less copy of the mod
  (`tools/ctr_evless.py`, SOURCES.md → EV-less copy): no species grants EVs and no trainer Pokémon has EVs, which
  makes the game play like Minimal Grinding Mode. Only the 13 Totem cards (Totems and SOS allies: static encounters,
  untouched) keep EVs. So `cfg.mgm` is false (no MGM switch; `psmgm` stays reserved) and `cfg.evs` stays on for the
  player's EVs (vitamins, wings) and the Totem sets. `check.py` fails on any trainer EV outside the Totem cards.
- **Vanilla comparison**: `dex-vanilla.json` and `trainers-vanilla.json`, the same two tools on the vanilla dumps alone.
  MV.h (move change notes) compares the two dex files; the Move Changes doc's paragraph is MV.e (shown as "Move Changes
  doc"). P.vc is not emitted.
- **Move properties** (`tools/ctrguide.py` `move_metadata`, vocabulary in `tools/moveprops.py`): `MV.f`, `MV.tg`
  and `MV.se` come from the move records in the romfs move archive (`a/0/1/1`), not the dex cache's
  flags. USUM records are 40 bytes; the flags are the record's final uint32 (bit 16 = dance). `MV.tg` is the target
  byte (0x14; a `normal` move with the long-distance flag is `any`). `noprotect` is a move that targets others without
  the protect flag (`protect_flags`); Z-moves have no protect flag in the game or in Showdown (the engine cuts them to ¼ through Protect), so they show it. `MV.se`, damaging moves only (a status move's effect is its description):
  inflicted status / confusion and its chance (0x08-0x0a; bad poison by effect sequence), flinch (0x0f), up to three
  stat stages with chances (0x15-0x1d; whose by the quality byte / target), recoil or drain (0x12, signed percent),
  max-HP recoil or heal (0x13). `secondary`, `recoil`, `drain`, `multihit` (hit-count byte), `binding` follow from the
  same bytes. Every effect chance in Move Changes matches the records (Twineedle, Parabolic Charge, Draining Kiss...).
- **Move fallback** (`extract/move_fallback.json`): stock Showdown 0.11.11 (gen 7 mod) only where the record is silent:
  the bite / bullet / pulse / powder groups (not encoded in USUM), crash damage (Jump Kick, High Jump Kick), the
  conditional heals (Morning Sun / Synthesis / Moonlight, Swallow, Shore Up, Floral Healing, Purify), the three-way and terrain effects of Tri
  Attack and Secret Power, Skull Bash's charge-turn boost, Fell Stinger (+3), Rest, Mind Blown (½ max HP cost), and `secondary` for moves
  whose added effect isn't one of the record's kinds (Spirit Shackle, Sparkling Aria, Throat Chop, Anchor Shot, Genesis Supernova). Entries the record already gives are not listed.
- **Move interactions** (`MI`, `extract/move_rules.json` over the shared rules): Big Root heals ×2 (Changelog.txt:189, v1.3); Big
  Pecks also blocks Toxic Thread (Move Changes: it now lowers Speed, Defense and Sp. Def; the stock list has it as a
  Speed drop); Illuminate loses the shared rule's accuracy-move list (no battle effect before Gen 9).
  No ability's effect is changed in this hack (Pokemon Changes / Changelog only change which species get which).
- **Forms** (dex.py): totem forms (unnamed forms in the personal table) are dropped, except Own Tempo Rockruff, which
  evolves into Dusk Lycanroc. Cosmetic duplicates (same types, stats, abilities and level-up moves as a lower form of the
  same species: Pikachu caps, Unown, Arceus, Silvally, Minior colours, Furfrou, Vivillon, Flabébé line, Genesect...) fold
  into the lowest form. Megas and Primals are g 1; battle, item and fusion forms are P.fc (FC in dex.py). Shedinja and
  the Sandy / Trash Wormadam evolutions are added by hand (the evolution table can't say them once Burmy's cloaks are
  folded).
- **Availability** (prune.py): keep obtainable species and forms, trainer opponents and partners, and Megas / Primals
  whose base dex is obtainable; other-form and evolution references are filtered to retained IDs. 931 -> 928: removed
  `pikachu-original-cap`, `zygarde-10`, `zygarde-10-power-construct` (unavailable and unused). `zygarde-50-power-construct`
  and `blacephalon` stay as trainer-only.
- **Wild tables** (locs.py): written through `tools/encstd.py` in encounter standard v2 (2026-11-04); Locations,
  walkthrough encounter lines and Pokémon Where to find use the same section names. Grass patches are `f` headings,
  the source's Cave tables stay Cave (including places with both Grass and Cave); for labels without a method,
  Sandy Cave's "Everywhere" is assumed Cave from the place name, while Thrifty Megamart's "Building" remains
  land/Grass. Flowers and Sand are Grass subheadings.
  Water combines Surf (`Su`), Fishing (`F`, one rod) and Bubbling (`Bub`) with each table's levels, and day/night
  rates collapse when equal. Caller rows retain SOS allies with `d` / `n` conditions; explicit SOS ally rows and
  Weather SOS are Special, as are berry piles, ambushes, rustling, dust, shadows, splashes, Wimpod, Island Scan
  (weekday subheadings) and Ultra Wormholes (colour subheadings). Gifts, eggs, fossils, statics and totem gifts are
  Gifts & static; in-game trades are Trades. Starter stays its own first card with Route 1 as its heading.
  Lush Jungle and Lush Jungle Cave merge into slot 27: the game's areas 87/88/89/91 (zones 105/106/107/109) all
  have met location "Lush Jungle", covering the map's three grass patches and cave. The Cave is an internal floor;
  `AR[28]` keeps its LOC and becomes `in: 27`. All 73 AR indices/names/LOC memberships and ARO entries are retained,
  so both published tracker keys load (additional recorded catches remain stored and shown as "also"). Slots:
  72 → 71 (the two Jungle slots become one); no other met-location merges assumed. Existing template migration
  handles old section-open keys; unrecognised method/patch keys reset closed, without changing tracker data.
  The game's tables have no method and repeat for every grass patch and fishing spot. Identical
  tables merge; each is labelled from `Wild Pokemon Locations.pdf`, read by word position (area titles are the 18 pt
  lines; a table is a bold heading, a bold "Levels: a-b" line, species in the first column). A game table takes the PDF
  table under a matching area title that shares at least half its species, scored on species and the level range. Small
  partial matches that aren't water tables are "Ambush Encounters" (shaking trees and grass the PDF doesn't always
  list). The game's leftover placeholder tables (Route 1 copies at level 2-3, Pikipek 100% in towns) are left out.
- **Source tables** (`sections()` in locs.py, before `standardise()`): one source section per game table, named from the PDF
  (Grass 1, Hau'oli Outskirts, Cave...), with day and night in one row ([day, night] rates). The same table in two game
  areas counts once; copies of a table in other patches merge, and a species only some copies have says "Only in some
  patches" (Route 1 Grass 3: Scatterbug at night). Water = Fishing + Surfing; of an area's fishing copies, the
  higher-level ones are the bubbling spot, shown as a second rate (the PDF's level ranges don't always match the game's,
  so they can't decide it). Berry piles, ambush, dust clouds, shadows, splashes and Wimpod are collected together,
  then written as Special subheadings by `standardise()`. 0%
  slots are dropped (Poni Grove's Stakataka / Blacephalon).
- **SOS** (tools/ctr_dex.py `sosBy`): each slot's allies, so a row knows exactly whom it calls (Corsola → Mareanie,
  Clamperl → Gorebyss by day, Huntail at night); allies the same as the caller are left out, other forms kept (Kantonian
  Rattata, East Sea Shellos). Every ally gets a P.w row "SOS ally", note "Called by ...", so Pokémon pages, search and the
  tracker know it. Weather allies (rain, sand, hail) come from the game's tables (`sosWeather`). This made Eternal
  Floette (Poni Meadow) and Diancie (Carbink) obtainable.
- **Maps** (`pdf_maps()`): the PDF's numbered grass maps (Route 1, Hau'oli City, Routes 2, 3, 5, 6, Mount Hokulani),
  rendered from the page (the circles are drawn over the picture), at most 520 px wide, 96 colours, as data URIs in AR.map
  (134 KB). Credited to the doc in the guide. The island overview pictures are skipped.
- **Areas** (tracker slots) are the PDF's area titles in its order, plus Starter (first, so the rival filter has a place;
  Ultra Sun gives the starter on Route 1, so the walkthrough files it under Route 1) and the places of the Special
  Encounters doc. TITLE_FIX tidies three titles. SPLIT makes a game table an area of its own (Route 1's Hau'oli Outskirts
  table); new areas go at the end of AR so saved trackers keep their slots, and AFTER puts them in place in ARO, the
  Locations order (Starter, Route 1, Hau'oli Outskirts, Trainers' School, Hau'oli City).
- **Specials** (SPECIALS in locs.py): Special Encounters.pdf transcribed by hand from word positions (Island Scan by
  weekday with special moves, the Ultra Wormhole legendaries, gifts, totem stickers, fossils). The doc says legendaries it
  doesn't list "can be found in their usual locations ... at higher levels", so Ultra Sun's places are listed for those
  (Ultra Wormhole legendaries, Tapus in their Ruins, Necrozma, Nihilego / Xurkitree / Guzzlord) with no level. Trades:
  levels and items from the doc, the Pokémon you give from Bulbapedia's In-game trade page. Not found (5): Original Cap
  Pikachu (event), Eternal Floette, the Zygarde forms other than 50%.
- **Gauntlets** (`gc`, trainers.py): none; rechecked cached source-doc text and parsed trainer tags/notes.
  Poni Gauntlet is a location, not a no-heal chain. The explicit empty rule writes no `gc` fields.
- **Trainers** (trainers.py): the game data has no places. Bulbapedia's Ultra Sun / Ultra Moon walkthrough lists the
  trainers in story order with vanilla teams (Trainerentry for regular trainers, Party for bosses); each entry is matched
  to a vanilla trainer by class + name, then species and levels (pairs like "Twins Isa and Nico" by either name), and the
  hack's trainer with that id is used (the hack edits trainers in place). Leftovers are placed from the location pages'
  trainer lists (exact team first, then exact place name, never a prefix in the middle of a number: "Route 17" isn't
  "Route 1"). Mallow's level 100 team is her post-game Kantonian Gym battle (the Important Trainers doc; Bulbapedia
  doesn't list it), Ryuki's level 50 the optional pre-League Kantonian Gym, Battle Buffet, Tristan (= Taro) and Harper and
  Sarah are placed by hand (PLACE), so nothing is left in "Other trainers". 140 placeholder entries (no name, or one level
  5 Yungoos with no moves) are dropped. 5 walkthrough entries match no trainer (a Fomantis grunt, an Arbok grunt in RR,
  Rada and Lillie at the Battle Tree, a level 61 Faba): the game data wins, they're left out. Read from the walkthrough:
  `{{Party/2}}` and `{{tt|lv|...}}` levels, trainerdiv captions (notes), `=== sub-places ===` in Parts 14, 21, 31
  (`==== VS X ====` stays in its room). `prize = none` parties are partners (t.pt, shown first in the battle's card; Hau's
  Aether copies kept once), except the Battle Royal. Trainers fought at once share t.bt (one row per battle); tags Double
  / Multi Battle / Battle Royal / Prismatic Moon (the MOON table, with "Prismatic Moon only. In Photonic Sun you fight X
  instead."). Story trainers repeated after the League go to the post-game box; location-page trainers at post-game
  levels go to "<place>: post-game". "If the player chose X" (PlayerChoice) is t.st: rival and other starter-dependent
  teams follow the starter picker. Pokémon with no moves set use their last four level-up moves (the Gen 7 default). A
  Mega stone holder is shown as its Mega with a0 = the base ability. Bag items are a note. CHAPTERS is a placement /
  keying scaffold only: trainer keys are assigned by it, then sections and trainer runs are regrouped by cap without
  renumbering. Episode RR keeps its rooms; all other post-game sections share the final Post-game box.
- **Level caps** (CAPS in trainers.py): one list including all mini caps, except Dexio (Heahea) and Battle Royal. Equal
  and immediately adjacent caps stay. Ultra Necrozma is 95 (not its encounter level 100), so caps never go down. Totem levels come from
  Totem Battles.pdf. Each place shows its next cap and the battles left before it: one per battle (t.bt), one starter's
  rival fight, no optional places, Kantonian Gym, Battle Buffet or Prismatic Moon teams. Route trainers you can walk
  around all count: no source marks them (Bulbapedia's walkthrough and location pages don't, Serebii doesn't), so there's
  no "forced" count. Ultra Necrozma's cap box has zero trainer cards (that fight is not in the source trainer sets). Trainer
  runs split at the actual boss battle within a place. Checked: Captain Ilima's three teams match Important Trainers,
  Rebalanced.pdf (species, levels, abilities, items, moves). The PDFs are not compared field by field (no "Sheet says"
  notes); the game data wins anyway.
- **Items** (items.py): Serebii's Ultra Sun item lists (the hack's zone scripts are vanilla, SOURCES.md), vanilla mart rows
  dropped except the Battle Tree's BP shop; shops from Vendor Changes.pdf (SHOPS, transcribed). TMs teach the hack's moves
  (TM59 Sucker Punch, TM60 Aura Sphere, TM67 Rock Climb, TM79 Freeze-Dry, TM100 Curse). Each item is in one box (plus
  Shops); items in two Serebii lists (King's Rock: hold and evolution) go to Evolution Items. Game order (Key Items,
  Stats and Abilities, TMs, Z-Crystals) = the walkthrough stop of the earliest place (`items.order`, after walk.py); wild
  holders count where they live, the left clerk by trials; vanilla marts don't count. The rest A to Z. The walkthrough
  files rows by `_itp` (the place list). Rules: `itemstd.RULES['photonic-sun']`. No Battle Items, Fossils (Poké Pelago
  only) or Mega Stones box: Mega stones link to their Mega through the game's Mega table and fill P.stone only (the stones
  are generated in). Key Items: Surge Badge dropped (a souvenir from the Kantonian Gym); kept: Professor's Mask (Part 16
  asks you to deliver it to Kukui), story petals / flower / flutes, Forage Bag, Sparkling Stone, Left Poke Ball sidequest,
  charms, Exp. Share, Ride Pager, Fishing Rod, transformation tools, Key Stone, Z-Power Ring.
- **Item text and wild odds** (`ctrguide.item_text`, `wild_held`): bag text from `dex-rebalanced.json` items by id, written to `extract/item_desc.json` and IX; changed = differs from `dex-vanilla.json` once whitespace is folded. Photonic's 35 differing texts are TM reflows, so none is changed; TMs and HMs take no text (the move page has it). Names the guide spells differently (SilverPowder, TwistedSpoon, Thunderstone) match the dex by letters only. Wild held items: `P.hi` [item, %] from the dex `items` slots, 50 / 5 / 1, the same item in slots 1 and 2 = 100 (Snorlax Leftovers 100, Chansey Lucky Punch 50 / Lucky Egg 5); no Mega forms.
- **Walkthrough** (walk.py): stops start in Bulbapedia part / place order, then are regrouped into the Trainers cap splits.
  Areas join the first stop with their name (ALIAS for Routes 15 and 16 and others; PLACE picks the stop by hand: Route
  1's wild Pokémon with part 2's Route 1 visit, part 1 keeps the starter; Hau'oli Outskirts and Trainers' School in part
  2); areas with no stop are "on the way" stops after the previous area's stop. NEW_STOP adds Trainers' School after part
  2's Route 1 (Hau'oli Outskirts), with Youth Athlete Hiromi through Teacher Emily from there (the Trainers tab still has
  them under Route 1 (Hau'oli Outskirts): it follows trainers.py). Items file under the first stop named in their
  location (ITEM_ALIAS for rooms like Shady House); the rest are in Guide info. ITEM_IN files a place inside a stop's
  ("Route 1 - Trainer School") under that building. Game docs: Evolution, Type and Move Changes, Totem Battles
  (preformatted, scrolls sideways), the Mega Evolution guide and the changelog. Both tabs end Elite Four Split [Cap 100],
  Post-game: Episode RR, Post-game; the two Poni Grove trainers and the Guardians / Ultra Space / Battle Tree / Title
  Defense content are in the last box; neither post-game box has a cap. 11 of the 148 fragments only separate trainers
  across cap boundaries (each visit's encounters, items and notes are kept once). Every fragment keeps a persistent
  `k`: the original `split.stop` on its first fragment, `.fN` on the others. Preserve those identities when regrouping;
  the shared walkthrough migration restores saved state by key, not the new position.
- **Conflicts and findings** (full list: report.txt). The Move Changes doc says Triple Kick 10 → 20 power; the game data
  still has 10. Toxic Thread's new effect isn't a number the move data shows. Wild tables that differ from the PDF (the
  game is shown): fishing rates on Routes 7 and 9, Akala Outskirts, Seafolk Village (Dhelmise 50%, doc 5%), Poni Breaker
  Coast, Malie Garden (Goldeen and Seaking swap by spot); grass rates on Route 5, Brooklet Hill, Ula'ula Meadow, Vast Poni
  Canyon (plus Boldore), Poni Meadow, Route 16, Ancient Poni Path, Thrifty Megamart; levels at Verdant Cavern, Route 3
  shadows, Route 8 surfing and most bubbling spots; Poni Wilds berry piles are half Crabrawler; Poni Grove's Stakataka /
  Blacephalon slots are 0%.
- **Totem encounters:** `extract/totems.py` takes all 13 battles from the game's static encounters (a/1/5/9 entry 1,
  `statics-rebalanced.json`; record per battle in `RECORD`, allies from the record) and checks them against its
  hand-transcription of the `Totem Battles.pdf` tables
  (33 mons), including Nihilego, Ultra Necrozma and both Verdant Cavern rematches. The two-column text dump shifts
  item/aura, nature/EV and move labels; tables were checked by column rather than blindly parsed by row label.
  All 653 `trainers-rebalanced.json` records were checked (38 teams contain listed Totem species); none is a Totem
  fight, so no game-trainer set overrides the doc. The first mon carries `au[5]` (Atk, Def, SpA, SpD, Spe); all
  allies have N/A auras and omit `au`. Allies follow the Totem in `p` because they are foes: `pt` renders a partner
  on the player's side. SOS allies are possible calls, not a sequential party or an ordinary Double Battle.
  Each story fight joins its existing CAPS box/place; Raticate uses the Gumshoos box with `Prismatic Moon`, while
  Gumshoos is tagged `Photonic Sun`. Stable `totem-*` keys leave all existing trainer identities intact. Rematches
  join Post-game at Verdant Cavern, reached from Part 34's Hau'oli City stop after Ilima; no new stop keys needed.
  Hydro Pump identifies **Wash Rotom** (`wash-rotom`); its trainer note says "Doc says Rotom".
  The doc has no IVs; the game's are used (2026-10-29; until then 31 was assumed). Not all 31: Totem Gumshoos Atk 0,
  Totem Raticate Atk / SpA / Spe 0, their Yungoos / Rattata allies all 0, and several special attackers Atk 0.
  The game wins on every field; differences get "Doc says" notes: EVs of Togedemaru (+6 Spe), Mimikyu (+84 Spe),
  Kommo-o (152 Spe, doc SpD), Ultra Necrozma (10 SpD, doc 8), Ribombee (106 SpD, doc 104), and Naganadel's level
  (90, doc 91). Species, items, natures, abilities, auras and move sets otherwise match; move order is the game's.
  Ultra Necrozma retains its level **100**, separately from the chosen progression cap **95**.

## Local storage (prefix ps)

`psdex` list filters, `pscalc:<species name>` (was `<id>`) + `pscalc:lastlv` stat calc, `pstrack` tracker {s starter, e, t}, `pswalk` walkthrough
open state, `pscap` levels per trainer, `pstr` open trainer boxes, `psrecent` search picks, `pspos` last route, `psmgm`
Minimal Grinding Mode (unused since the EV-less change: no switch), `pscapset` level cap set, `psloc` / `psitems` open boxes. Keep them once published.
Species, moves, abilities and places in saved state are names, trainers stable keys (template/README.md → What the data
switches on); ids and indices saved before still load.

## Hack-only data

Beyond the shared schema (hacks/emerald-imperium/notes.md → Data schema): P ids are slugs of the display name
("raichu-alola", "mega-charizard-x"); MV.h always a list; MV.e + MV.dc the doc's paragraph; P.w rows [area, method, rate
"%"/"", level, note, 1?] where the note of a Trade is its tracker label ("For Spearow"), the rate may say "20% (day)" /
"15% day, 20% night", and a 6th field 1 means the row repeats the area's sections (the template lists only the other
rows, gifts and trades, apart); AR.es the area's sections [{n, k grass|water|other, g:[{m label, lv, bl bubbling levels,
rows:[{p, r:[day,night], b:[day,night], sos:[[ally, ""|"day"|"night"]], note}]}]}]; AR.st 1 = the starter picker is this
area's tracker; AR.map [data URI]; AR.note (trade items, Ultra Space Wilds); ARO the Locations order; TR trainers carry
`note` (bag items), `bt` (battle id shared by trainers fought at once), `pt` partners [{n, st, p}], `tags`; sections
carry one `cap` [level, who, where, battles left] or no cap after the League, and `opt` (optional place); TR.caps is one
[name, level] list and TR.mini is absent; mons carry `ao` ("Stakeout / Strong Jaw") when the ability slot is random; WK
has no cheats or checklist steps, and WK.docs holds the game docs.

### Damage calc

`cfg.calc.base = "gen7"`; Rebalanced species stats/types and move power/category come from game data,
not the oracle backup. EVs stay enabled; `ls.dmg` (`psdmg`) is unchanged. Gen 6/7 share the type chart,
so no type-chart override is needed. Page decisions: `template/README.md` → Damage calculator;
engine contracts and checks: `tools/calc/README.md`.

The profile keeps Singles/Doubles, all four terrains, ordinary/harsh weather, Gravity, Magic Room,
Wonder Room, Reflect/Light Screen, Aurora Veil, Helping Hand, Tailwind and Friend Guard. It adds both sides'
Flower Gift and Battery plus an optional inverse scenario. These inputs do not claim every condition occurs
in the story. Protect is move-gated, with Z damage through it at ¼; Hail-setting moves set Hail, not Snow.

All 928 stock Gen 7 weights stand (50 form fallbacks, no 1 kg defaults), including 48 Megas, both Primals,
Nidoran genders and Minior Core at 0.3 kg. No weight override or profile power rule is needed.
Ten fixtures omit set power (all eight weight/HP/speed moves, Alolan Raichu and Mega Steelix);
`tools/calc/photonic_check.mjs` checks forms, weight/ratio boundaries and native HP/speed power.

Oracle: hzla Dynamic-Calc-Decomps, `data=pspm`, `gen=7`, `dmgGen=7`, `types=6`, `critGen=7`, title
`Photonic Sun/Prismatic Moon`, backup `pspm`, pin `ff6c3e339e276e6b4e8e44db58750b6534bc26aa`.
No hzla code or tables ship. Source paths in the table are relative to `@smogon/calc` 0.12.0;
oracle paths below refer to that pinned checkout, fetched with `node tools/calc/hzla_compare.mjs photonic-sun --fetch`.

| Setting / rule | Evidence and checks |
| --- | --- |
| Gen 7 field mechanics | `@smogon/calc` 0.12.0, `src/mechanics/gen789.ts`; fixtures cover spread versus single-target damage, physical/special screens and critical bypass, non-stacking screens, support and negative/opposite-side controls. |
| Weather / terrain | Every weather option with Fire and Water; harsh-weather nullification; sand Rock Sp. Def; strong winds on single/dual-type Flying targets; grounded/airborne terrain and priority blocking; Grassy Earthquake. Gen 7 terrain boosts, not Gen 8's weaker boosts. |
| Magic Room | Choice Band and Eviolite baselines versus disabled items. |
| Wonder Room | Raw Defense and Sp. Def swap once, including Psyshock; `@smogon/calc` `src/mechanics/util.ts:214`, `src/mechanics/gen789.ts:1524`. |
| Flower Gift | Attack and Sp. Def in Sun/Harsh Sunshine, no boost in rain/no weather or to the wrong category; defensive implementation at `src/mechanics/gen789.ts:1604`. |
| Tailwind | Payback changes power when attacker Tailwind reverses turn order; both sides' Tailwind preserves it. |
| Inverse | Declarative `effectiveness` rule: invert each defending type's multiplier (0 becomes 2); no ability-immunity bypass. Fixtures cover weakness, resistance, type immunity, dual types, Levitate, Freeze-Dry and Flying Press. |
| Always-critical moves | `critical: {value: true}` for Self-Destruct / Explosion (Rebalanced Move Changes and `MV.cr` agree); unflagged and crit-flagged fixture rolls are equal. The oracle omits the automatic crit and halves Defense. Keep Gen 7 Defense unchanged: neither game data nor docs restore Gen 1–4 halving. `calc_matchups.json` records the four differences. |

`calc_matchups.json` records known differences rather than forcing oracle parity.
The six differences deliberately retain stock Gen 7 behaviour:
- Wonder Room (Tackle, Psychic, Psyshock): the pinned oracle's active `calc/mechanics/gen789.js:54-57` swaps raw
  defenses twice (`checkRawStatChanges`, then `checkWonderRoom`), and line 1076 selects the opposite attacking
  stat for physical moves. Ours swaps defenses once and does not change the attacking stat.
- Defensive ally Flower Gift (Sun, Harsh Sunshine, combined Doubles support): the active oracle's
  `calculateDfModsSMSSSV` omits it, although its separate `calc/mechanics/vanilla/gen789.js:1231` includes it.
  Ours applies the normal x1.5 Sp. Def modifier. Do not remove the modifier just to match the broken oracle path.

`tools/calc/photonic_check.mjs` compares non-inverse field cases directly with uninstrumented stock Gen 7,
asserts inverse/field relationships and hand-checks the divergent Wonder Room/Flower Gift rolls.
It runs in `npm test --prefix tools/calc`; the independent oracle command is
`node tools/calc/hzla_compare.mjs photonic-sun`. Page controls/persistence: `tools/scenarios/calc-photonic.mjs`;
shared browser coverage and usage: `tools/scenarios/README.md` → Calc checks.

Z-moves use `zmove: true` and the 16 Move Changes powers in `zpow`, which override stock/band power.
The 25 no-set-power fixtures cover documented powers, native exceptions and single-hit conversion, including
Catastropika 210. Each damaging row's Z toggle follows `template/README.md` → Damage calculator.
Status Z effects (unit 4b-ii): `tools/calc/z_effects_check.py` reads byte 0x21 of every status move's record in
`a/0/1/1` (pk3DS Move7 / MoveEditor7 effect list). Game data says the same as Showdown for all 240 status moves:
no differences. Toxic Thread's Photonic override keeps its Z effect (Spe +1) because an override replaces the record.
Totem `au` comes from `extract/totems.py`; it initializes stages and the Aura mark, checked by
`tools/scenarios/calc-zmove.mjs`.

`MV.cr` comes from game-data `crit` via `tools/ctrguide.py` (26 moves; Self-Destruct / Explosion 6).
The always-critical rules harmlessly repeat `cr`. Battle state, crit chance and pre-hit changes use stock Gen 7;
Spectral Thief steals before the hit, with Simple doubling the gain. **Doc says** Triple Kick 20 and Power Gem 90;
the patched game data has 10 / 80 (Power Gem's PP 15 change is present), which the guide/calc use.
State/crit fixtures: `calc_states.json`; shared contracts: `tools/calc/README.md` → Battle state and Crit.

Not checked: in-game damage on the Thor or a full audit of changed move/ability/item and history-dependent effects.
Oracle agreement with guide-supplied stats/types/power/category does not independently validate extraction.
Refinements belong in this hack's profile/fixtures, not other guides' base profiles.

#### Save import

`cfg.calc.save = "gen67"`, `template/calc/readers/gen67.js`, decrypted USUM `main` (also accepts a
`.sav` name). Same vanilla save format, not vanilla growth rates or ability assumptions. The reader validates the
footer, all block CRCs and each nonblank Pokémon checksum; reads stored species/form, ability id, item and moves;
uses the stored party level and hacked growth for boxed levels; skips eggs and applies PK7 hyper-training flags.
It does not verify the Gen 7 RSA signature. SM / XY / ORAS return Wrong game for this guide.

`tools/ctrguide.py::build_save_ids` is shared with Eternal X. `extract/build.py` calls it **after**
finalise/prune. `GID.sp` has 1107 `species:form` keys covering every one of the 928 P ids; `GID.mv` / `GID.ab`
cover all 728 move indices / 233 ability indices; `GID.it` uses all 896 game item names. `GID.gr` holds the growth
rates for all source forms, even excluded ones. These come from the existing `.src/dex-rebalanced.json` produced
by `tools/ctr_dex.py` from the hack's romfs and code patch, not from PKHeX/hzla tables. Use source move **ids and
table order**, not a name-only dictionary: the physical/special Z-move pairs deliberately have identical names.
`extract/check.py` asserts full species/move/ability coverage and selected form/item ids.

Unmapped species/form keys, intentionally outside the retained guide: **25:1..25:7, 718:1, 718:2** (cap Pikachu
and the pruned Zygarde 10% entries). No retained species, move or ability is unmapped. The importer skips and counts
Pokémon with unmapped species using the existing banner. Cosmetic/totem aliases follow the existing `_spec` map.

Oracle: local PKHeX.Core **26.10.18**, SDK **10.0.403**. Recipe: `template/calc/readers/README.md` → PKHeX oracle
recipe (Gen 6/7). No linked program or binaries are committed. Local fixtures (recreate with that recipe):
`.src/saves/pkhex-usum.sav` and `pkhex-usum.expected.json`, six party and 32 boxed Pokémon.
The boxes cover all shuffle selectors and all six hacked growth rates; expected boxed levels use PKHeX
Experience.GetLevel with those hacked rates, independently of our reader. XY / ORAS / SM synthetic layouts
also match directly, but their expectations use Photonic names/boxed levels: Eternal X needs its own game data.

Checked 2026-10-28 against that oracle: `tools/calc_save_check.mjs` imports all 38 USUM Pokémon through the real
file input with every compared field matching. All four layouts, hyper-trained IVs, wrong-game/state banners,
truncated/corrupted/footer copies, resealed bad Pokémon checksum/count/game and empty/egg-only party controls
are covered. Rejected imports preserve the previous save. Format details belong in
`template/calc/readers/README.md` → gen67: decrypted 3DS main saves.

Still untested: a real player's save and import on the Thor. The shared Unreadable banner refers to two slots
although decrypted 3DS main has one active save; retain this wording caveat until fixed.

#### In-game tests

Rolls are the engine's 16 rolls. Level as stated, Serious nature, 31 IVs, 0 EVs, no item unless stated, no field.

- **Z-Wing Attack uses the doc power (160), not stock (120).** Settles: the Z-move power for Wing Attack.
  - Attacker: Pidgeot Lv 50 (Atk 90), Flying-type STAB, holding the Flying Z-Crystal, using Wing Attack as the Z-move.
    Defender: Blastoise Lv 50 (HP 154, Def 120).
  - Expected (doc 160): `67 69 69 70 72 72 73 73 75 75 76 76 78 78 79 81`.
  - Other way (stock 120): `51 52 52 54 54 54 55 55 57 57 57 58 58 60 60 61`.
- **Totem aura: Gumshoos Def +1.** Settles: the Totem's aura stage applies to its Defense (Totem Gumshoos, TR data: `au` Def +1).
  - Attacker: Snorlax Lv 16 (Atk 45), Tackle (Normal, STAB).
    Defender: Totem Gumshoos Lv 16, Adamant, EVs 200 / 100 / 100 / 0 / 100 / 0, Sitrus Berry, aura Def +1 (the first mon of the Totem card).
  - Expected with the aura: `7 9 9 9 9 9 9 9 9 9 9 9 9 9 9 10`.
  - Expected without it (Def +0): `12 12 12 12 12 13 13 13 13 13 13 13 13 13 13 15`.
- **Self-Destruct always crits.** Settles: a critical hit on every use (Photonic Move Changes); the oracle does not crit it.
  - Attacker: Snorlax Lv 50. Defender: Blastoise Lv 50. Move: Self-Destruct (power 200), no crit flag.
  - Expected on every use: `184 186 189 190 193 195 196 199 201 204 205 208 210 213 214 217`.
  - Other way (ordinary hit): `123 124 126 127 129 130 132 133 135 136 138 139 141 142 144 145`.
- **Explosion always crits.** Same setup with Explosion (power 250, faints the user). Settles: as Self-Destruct.
  - Expected on every use: `229 232 235 238 241 243 246 249 252 255 256 259 262 265 268 271`.
  - Other way (ordinary hit): `153 156 157 159 160 162 165 166 168 169 171 174 175 177 178 181`.

## Checks

`check.py` [baseline.json]: references (species, evolution and form links, trainer and partner teams), 29 caps, the 31
matching Trainers / Walkthrough box names ending Elite Four Split [Cap 100], Post-game: Episode RR, Post-game, a `cap` on
every section of a capped box, unique stop keys, every trainer key in a stop. Given a pre-pruning data.json: exact trainer
keys and teams, all 73 area indices and indexed tables, the species kept, the legacy stops covering the 148 fragments
(trainer occurrences, areas, items), the Poni Grove trainers in Post-game, Key Items minus Surge Badge. Then
`python assemble.py photonic-sun`, `tools/walk-state-check.mjs` (saved walkthrough state), `tools/consistency-check.mjs`,
`tools/domcompare.mjs` against the previous build, and the viewer-size checks (CLAUDE.md).

## History

- 2026-11-06 (the user): caps only for Totems, Kahunas and the Elite Four (`walk.regroup`, `extractlib.merge_cap_splits`): 13 cap splits + the two Post-game boxes. Ultra Necrozma's contents are in Totem Ribombee (cap 95). `trainers.CAPS` keeps all 29; stops keep their keys. Locations: Post-game box (`cfg.locPost`).

- **2026-10-25:** Added 13 Totem encounters, doc auras, 20 SOS allies and version tags under stable trainer/stop keys.
- **2026-10-24:** Ultra Necrozma progression cap 100 → 95; encounter level remains 100.
- **2026-10-23:** Shared item standard: TMs and HMs (no HMs here), Z-Crystals `Found:`, Memories/Drives and shop kinds.
- **2026-10-23:** 931 → 928 species; 31 cap/post-game boxes, 29 caps, 148 walkthrough fragments; saved IDs preserved.
- **2026-10-21 / 10-20:** Hau'oli Outskirts split from Route 1; game-table sections, day/night rows and SOS allies added.
- **2026-10-19:** First guide in this repo from the 2.38 sources.
