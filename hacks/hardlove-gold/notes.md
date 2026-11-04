# Hardlove Gold build notes

Hardlove Gold 0.8.7, an hg-engine hack of Pokémon HeartGold. Built from the hack's own source code (the authority) and
its sheets. 987 species and forms (596 obtainable, 74 Megas, 317 trainer-only), 783 moves, 284 abilities, 62 tracker
areas (the Starter area is index 61), 329 trainers in 18 boxes, 94 walkthrough stops.

## Build

```bash
uv run python -I hacks/hardlove-gold/extract/build.py                     # raw sources in .src/ -> data.json + extract/report.txt
uv run python -I hacks/hardlove-gold/extract/check.py [baseline.json]
python assemble.py hardlove-gold
```

The raw build is the only build, and two runs give the same bytes. It stops when `.src/repos/hardlove/COMMIT` is not
the release `watch.json` pins ("Released game source" ref): re-fetch with SOURCES.md first. The old `--published` path
(re-finishing the committed data.json without sources) is gone since 0.8.4: it let a stale `.src` look like data drift.

Modules: `dex.py` (M MV AB P TC; `dexsite.py` the docs site's pages, `hgsource.py` / `hgengine.py` the hg-engine C
files), `locs.py` (LOC, P.w, the Starter area; `enccheck.py` checks the wild tables against the game), `trainers.py`
(TR), `items.py` (IT), `walk.py` (AR, WK), `xlsx.py` (sheet reader). The steps run in the order the data needs, so the
modules are called several times and share the working state `X` (`common.py`). Fetch the sources with `SOURCES.md`.

## Sources and rules

Sources (numbered as in SOURCES.md's table):

0. **The hack's source**: github.com/kumakuma1/hardlove, branch `beta_hardlove`, pinned at 0.8.7 `4a8d4a6308`
   (`repos/hardlove/COMMIT`, checked by build.py against `watch.json`). This is what the ROM is built from, so it wins wherever it has the data:
   `data/Species.c` + `HiddenAbilityTable.c` (types, base stats, abilities and hidden abilities of every species and
   form), `data/learnsets/learnsets.json` (level-up, TM, tutor and egg moves; forms without an entry use their base
   form), `data/Evolutions.c` (methods rewritten to words), `data/Moves.c` + `include/config.h` (type, category, power,
   accuracy, PP, priority; the CHAMPIONS_* changes are on), `data/Trainers.c` (every trainer set: species, level, item,
   ability, nature, moves, IVs, battle type), `data/Encounters.c` + `SafariEncounters.c` (wild tables),
   `data/MachineMoves.c` (TM / HM numbers), `src/field/encounter_check.c` (read online: the hack's slot odds: land 8 x
   10% + 4 x 5%, surf / rod 30 / 30 / 25 / 10 / 5, rock smash 60 / 40; the Good and Super Rod tables are one-species
   placeholders: the hack only gives the Old Rod). Not in the source: map scripts (item balls, NPC gifts, trades,
   marts), so item locations, tutors, gifts and statics come from the sheets; `HiddenItems.c` has vanilla leftovers in
   unused Kanto areas, so it is not used. Findings: the dex site predates 0.8.0 (learnsets) and 0.8.1 (abilities),
   never listed hidden abilities and had 5 wrong Mega / Crowned stat lines; the sheet's "Lycanroc-M" is Midnight; Mt.
   Mortar 1F / 2F have Surf and Fishing swapped in the sheet; HM05 / HM06 are swapped in the items sheet; Hiker Schorsch
   has the wrong trainer id in the sheet (11, game 233).
1. **Docs site** kumakuma1.github.io/hardlove-docs (repo `bb5862f`), `site/pokedex`: 1,364 pages, one per species / form,
   in the index's dex order. Used now only for the species list and order, display names, other forms and sprites
   (160x80 two-frame sheets; the left 80x80 frame, trimmed). Its stats, types, abilities, moves and evolutions are
   replaced by source 0 (the report lists every change). Quirks: Fairy types show "Typing not found" (filled from the
   calc's species data, a few from the previous build); "Wild Locations" are stale and not used; female-only species have
   no sprite (0-byte files), taken from the hack source (`repos/sprites`, `data/graphics/sprites/<id>/female/front.png`).
   Bounsweet has none.
2. **Pokemon Locations sheet** (xlsx), the source of truth for availability. Encounter Tables (location names in merged
   row 1, Level / Pokemon column pairs, col A method, col B rate as a fraction), Safari Zone (same, areas after the
   gate), Random Pools ("Pool, Location" headers; cell notes kept), Game Corner (by badge), Trades, Unavailable Pokemon.
   Cell notes are read: per encounter ("Starter: Litten.", "Requires 7th Badge."), per location (Azalea headbutt trees,
   Safari layout) and the roamer note. Name suffixes -A / -G / -H / -P regional, -T Therian, -D Defense. The player's
   starter choice (Turtwig, Litten, Froakie) is in no tab: added from Mechanics.txt as "Starter choice" at New Bark Town.
3. **Trainer Battles sheet** (xlsx): split tabs in order (Falkner Split ... Clair Split, Victory Road, Elite Four, Mini
   Bosses). Block per trainer: "Name - <id>" row, Pokemon row, species row, Level, Ability, Held Item, Nature, 4 Moves
   rows. Section header rows ("Falkner Split [Level Cap 16], Ruins of Alph") give the split, cap and place. Brackets in
   names become tags ([Optional], [Double], [Back2Back]...); [Starter X] becomes the trainer's starter filter. Cell notes
   (column I) on a name row go to that trainer, on a section row to the section, otherwise to the trainer whose block
   holds the row. "-M" is Mega only when the item is the matching stone; "-M-X/Y/Z" Mega X / Y / Z;
   Floette-Eternal-M is Mega Floette. "X-2" levels (Mini Bosses) are relative to the level cap (r:-2). The hidden
   "Example - Vanilla" tab and the "Pokemon", "Trainers" and "import" tabs are not used. The sheet gives order, places,
   tags and notes; the sets come from the game (source 0), paired by the "Name - <id>" trainer id and species.
4. **Move Changes sheet**: changed moves only ("20 > 40") plus the effect side table, kept as notes; the numbers come
   from the game. Notes say where the sheet disagrees with the game and which game changes the sheet doesn't list.
5. **Item Location sheet**: Held Items (+ Berries side table), Heart Scales, Rare Candies, HM / TMs and Move Tutors
   (TMs, tutor side table, HMs after the "HM" row), Evolution Items, Mega Stones ("Unavailable." when not obtainable),
   Other.
6. **Hardlove calc** github.com/kumakuma1/hardlovecalc `backups/hardlove.js` (Jan 2026): no longer used for sets (the
   game's Trainers.c replaced it); only a fallback for missing types.
7. **pokemon-showdown** 0.11.11: move and ability descriptions, dex numbers, the Z-A Mega list (their data comes from
   source 0), and the Gen 9 baseline the move notes compare against.
8. **Mechanics.txt** (level caps, starter choice table, removed EVs and other rules), **Hardlove Gold AI document_WIP.md**
   (Markdown since 0.8.4; `walk.md_text` turns it into the doc view's plain text: no title, Contents or diagram, table
   rows as "cell: value") and **Post-KO Switch-in AI.xlsx**: shown as "Game docs" in the Walkthrough tab. Move Performance.txt (generic move
   order notes from a wiki) is not used.

Data rules:

- **Availability**. P.g: 0 obtainable, 1 Mega (P.nu = stone unavailable, kept only because a trainer uses it), 3 trainer
  only. Obtainable = everything found + evolution family both ways, minus the Unavailable tab (Chimecho, Forretress, Great
  Tusk and Iron Bundle are in both a table and the Unavailable tab; kept as obtainable). Megas: Other Forms of
  obtainable species; stone matched by name (X / Y / Z suffix must agree); dropped when the stone is unavailable and no
  trainer uses them (Mega Latias). Megas sit right after their base form.
- **Locations**: order = Encounter Tables column order, Safari areas after the gate, Blackthorn City after Ice Path.
  Areas merge sub-locations (`areaOf` in walk.py); the area list is unchanged from the first build, so tracker slots
  carry over. The Starter area (AR 61, LOC 95) is appended last; only the three Turtwig / Litten / Froakie `Starter
  choice` encounters sit there. `ARO` (Locations order) puts it first on the Locations page, above New Bark Town. Wild tables are checked against the game slot by slot (85 locations, 10 with differences;
  the game wins and replaces Route 46, Violet City, Route 5, Mt. Mortar 1F (Entrance) and 2F, Lake of Rage, Whirl Islands
  1F and B2F, Mt. Silver (Snowy Area); Mt. Silver (Moltres Room) matches no game table: statics / gifts;
  Ice Path 1F now matches the 0.8.5 game table (`ce2cbaa`), clearing its stale-sheet warnings). Safari areas are checked against `SafariEncounters.c`
  (the day list of each method; Goldeen-only water tables are placeholders): the game replaces Marshland Surf / Fishing
  (swapped in the sheet, like Mt. Mortar). Mountain Land now matches the sheet's Tauros instead of Furret. The
  game's Rocky Beach and Desert areas are not in the sheet.
- **Walkthrough**: no written walkthrough exists. Stops come from the trainer sheet's sections in order, split by level
  cap header; each area is anchored to its first stop when that keeps the order monotonic, else becomes an "on the way"
  stop. Items are filed by the earliest area name in their location text (`ALIASW` in walk.py). The New Bark Town stop
  includes Starter before its original area.
- **Level caps**: TR.caps from Mechanics.txt; a trainer's cap is its split header's cap. Boxes are the sheet's mini-splits;
  both tabs end `Victory Road Split [Cap 81]`, `Elite Four Split [Cap 81]`, then Mini Bosses.
- **Trainers**: the game set wins; where the sheet differs the card says "Sheet says ..." (64 sets differ, 6 game Pokémon
  are missing from the sheet: Nuzlocker Ethan's random team). Sheet typos are fixed ("Msytic Water", "Scope Lense",
  "Letfovers", Mega stone names; Sailor Garrett's rows shifted; "Lunch" is Lunge, not the fuzzy match's Crunch: `CANON`
  in dex.py). Pure Power on a Huge Power set is the same effect, not a difference (`SAMEAB` in trainers.py).
  The sheet lists Will [Double] (702) and Koga [Double] (703) twice; the game has one of each, so the second entry with
  the same game trainer and name is dropped (`9.0.2`: Mr. Mime row, confirmed in game: Slowbro; `9.0.5`: same team as
  `9.0.4`). Their keys stay unused, so later keys don't move.
- **Moves**: 188 changes in the sheet, 183 on moves in the data; 45 changed in the game but not in the sheet; the sheet
  disagrees with the game on Dragon Tail ac, Screech pp, Reflect ac, Double Slap ac, Pain Split bp, Snarl pp; Collision
  Course is not in the game data. TM / HM numbers come from the game (the items sheet's HM05 Rock Smash is HM06 in the
  game, HM06 Whirlpool is HM05; about 25 TM names fixed).
- **Dex changes from the dex site** by source 0 (first build): hidden abilities 647, level-up moves 311, TM 157, tutor 70,
  egg 59, abilities 28, stats 5, evolutions 2 (growlithe, koffing).
- **Stats**: EVs are 0 everywhere (the hack removes them). TC is the standard Gen 9 chart (Mechanics: assume Gen 9).
  Evolution methods the text can't describe (SPIN_* variants) show as unknown.
- **Items**: rules in `itemstd.RULES['hardlove-gold']`, the `Other` box mapped in `HG_OTHER` (History → Items standard).
- **Held items and item text**: `held.py` sets `P.hi` from `data/Species.c` `.speciesData.wildHeldItems` (common 50%, rare 5%,
  the same item in both 100%, a lone slot keeps its odds; Mega forms none). Only 12 species hold items: Paras / Parasect,
  Shroomish / Breloom, Foongus / Amoonguss / Morelull / Shiinotic (Tiny / Big Mushroom), Shellder / Cloyster, Gulpin / Swalot
  (Big Pearl). Leftovers is not a common wild item here (only Gigantamax Snorlax's rare slot). `itemtext.py` sets `IX` from
  `extract/item_desc.json`: the two items the hack adds with text in `221.txt` (Infinite Candy, Starter Card; changed = 1).
  The pin has no vanilla HGSS text to compare, so other items are not marked; the rest of `222.txt` (about 2,000 names past
  id 536, with no text in the pin) gets text from the shared pool.

### Wild tables: encounter standard

`locs.standardise` writes every verified sheet/game row through `tools/encstd.py` into `AR.es` and flagged `P.w`
(`ESV: 2`). Locations, walkthrough lines and Pokémon rows share Grass / Cave / Water / Special / Gifts & static /
Trades names. Source LOC order supplies floor order, not Pokédex order; levels are factored by the shared writer.
Surf and the hack's single fishing table share Water with Surf (`Su`) / Fish (`F`) rate chips. Azalea's Land rows
are Headbutt; Safari tables are Special → Safari (one floor per Safari area, retaining Surf / Fish chips), Rock
Smash is its own Special subheading. `Other` and Legendary become Static; Roamer becomes Roaming; Togepi Egg becomes
Egg; Game Corner becomes Prize; random pools become Random gift, Random gift (starter), Random gift (pseudo), Trap
and Gift (fossil). Pool sizes, levels, starter conditions and all notes stay on their rows.

National Park's Morning / Day / Night LOCs already belong to AR 20: one Grass table now has `m` / `d` / `n` rate
keys, identical rows collapse, and all three LOC labels read National Park. No slot merges: **62 → 62 AR entries,
61 → 61 tracker slots** (Roaming has `ns`). Every AR index/name/LOC membership, species ID, trainer key, walkthrough
stop key and localStorage key is retained. The appended Starter remains AR 61 / LOC 95; its LOC heading now reads
New Bark Town, its card still reads Starter and its rows still say Starter choice. Older UI section names migrate
where the shared template recognises them; other method-open flags close as the standard specifies. Tracker entries
and their species remain independent of those UI flags.

Land classification is an explicit per-map/area decision based on `Encounters.c`'s indoor D15/D18/D25/D26/D38–40/
D42–44/D50 maps, not a guess from Land or a displayed heading. Ruins of Alph Inside is Cave, Outside is Grass;
Mt. Silver Entrance/Moltres Room are Cave, Mountainside/Snowy Area are Grass. **Assumption:** the cached hg-engine
snapshot omits map-type headers, so those two outdoor Mt. Silver maps retain their outdoor classification. No new
availability or time-of-day tables are invented: beyond the three National Park source tables the existing verified
sheet/game rows remain the data. Mt. Silver Moltres Room still carries the existing unmatched-table warning.

## Local storage (prefix hg)

`hgdex4` list filters, `hgcalc:<species name>` (was `<id>`) + `hgcalc:lastlv` stat calc, `hgtrack` tracker {s starter,
e {areaIdx: {p: species name} or {f: 1}}, t {"area|For X": species name}} (ids before 2026-10-29 still load), `hgwalk2` walkthrough open state (EI's shape), `hgcap2` level cap per trainer (+ _last),
`hgtr` open trainer groups, `hgrecent` search picks, `hgpos` last route and anchor, `hgmgm`, `hgloc`, `hgitems`. `dvkb` =
"1" forces viewer mode (shared test switch). Keep them once published. The template seeds the Starter slot from a saved
`hgtrack.s`, independent of area 0's New Bark Town encounter.

## Hack-only data

Beyond the shared schema (hacks/emerald-imperium/notes.md → Data schema): P.nu (Megas that cannot be used), P.tu tutors,
P.stone / P.sloc; MV.h = Hardlove change notes, no MV.e / dc; AB has no original flags; WK.docs (game docs) and WK.ko
(post-KO switch-in AI) instead of cheat codes; no checklist steps; TR trainers carry no `id` / `pp` / `c`; mons carry
`a0`, `hp`, `cf` (what the sheet says instead), `ev` is [0 x6]. UI parts: Tutor move tab, starter selector in the tracker
bar (filters rival teams, trades, starter-only items), trade slots in the tracker, no EV row in the stat calculator, a
"Level cap" box for cap-relative teams, availability filter "Trainer only" instead of "Changed from vanilla". No
Minimal Grinding Mode, Hot House, changes doc or conflict cards.

### Gauntlet chains

`gc` follows the sheet's Back2Back/Back2Back2Back tags and Gauntlet/Part/End note spans: Slowpoke Well Ariana →
Proton (Bugsy Split!B170 explicitly names the untagged Proton); Lighthouse Kent → Denis → Preston → Connie →
Terrell → Roberto; Rocket HQ #8 → #9, #10 → #11, #12 → #13; Whirl Islands #24 → Ariana → #25; Route 34 Irene →
Jenn → Kate; Kimono Zuki → Naoko → Miki (double). Keys come from the append-only trainer key table after ordering.

### Trainer fields

Field-condition comments in the active Trainer Battles tabs are retained in notes and shared trainer `field`
evidence metadata, including section inheritance. Run
`tools/trainer_fields_check.py --sources` to check this against the local workbook. Thunderstorm records both
permanent Rain and Electric Terrain. Also retained: permanent Rain/Sun/Sandstorm/Snow/Fog, Lt. Surge's permanent
Trick Room, enemy-side permanent Tailwind, random terrain at battle start, one layer each of player Spikes and
Toxic Spikes after first send-out, and +1 critical chance. The critical bonus's target and random terrain pool
remain unspecified. Full original wording and scope survive. Shared schema:
`hacks/emerald-imperium/notes.md` → Data schema. Calc use: Damage calc below.

### Damage calc

`cfg.calc.base = "expansion"` means Gen 9 damage/types, not Gen 4 just because this is NDS. With no independent
oracle, the calc stays provisional pending the user's mechanics check (In-game tests). Page decisions:
`template/README.md` → Damage calculator; engine contracts and checks: `tools/calc/README.md`.

Area conditions (trainer `field`): area +1 crit is applied as the foe side's +1 crit stage, a guess and
labelled `+1 crit (foe, guess)`. Permanent Fog is shown as text only: accuracy ×0.6, no damage effect (Gen 4 rule,
unverified in hg-engine). Easy mode (enemy levels − (1 + floor(lv / 25))) is not modelled by user choice.
Doubles: one `gameType: 'Doubles'` record per trainer with a Double / 2on2 Double tag or partners;
three Back2Back trainers also carry a Double tag (Executive Ariana, Rocket Grunt #25, Kimono Girl Miki) and count as Doubles.
`setterStays: true` (`doc/Mechanics.txt:31-32`: weather / terrain from abilities and moves are permanent), so a
setter's weather stays after it leaves. Figy-group berries heal 1/8 at half HP (`over.items`; `TryUseHeldItem`, `itemdata.c` parameter 8). Dragon
Cheer is off (`over`: no crit stage at the traced pin). Weather moves set Snow (no Hail).

Automatic power follows source weight/HP/speed/boost rules: inclusive weight bands, Flail's top band at
`floor(48 * HP / maxHP) >= 32`, Gyro Ball without the additive 1, Hard Press at 1 BP at full HP and a late
zero-power clamp. Weight overrides cover Mega Garchomp Z, Mega Lucario Z and Maushold.

#### Engine changes in 0.8.5 to 0.8.7 the calc does not model

0.8.7 (`4af49f7a8c..4a8d4a6308`): trainer AI only (`src/trainerai/`): the highest-damage / kill bonus is now +2 on 25% of rolls
(was 20%), Future Sight / Doom Desire +7 (was +8) when the AI is faster and dies, the AI sees a priority move blocked by the
target's ally's Dazzling / Queenly Majesty / Armor Tail in doubles, a doubles partner only ignores a target when both player
Pokémon are up, and `firstTurnOut` uses `BattlerFirstTurnOut`. The AI doc says the same (and documents Metronome +6, already
in 0.8.6). The calc does not predict AI choices, so nothing changes in `cfg.calc` or the engine.

0.8.6 (`64838bf7db..4af49f7a8c`): trainer AI only (`src/trainerai/`, `include/custom/custom_ai.h`: the AI struct moved to the
heap, move scores `s16`, Metronome-style moves scored +6 by the harassment AI) and the starter nature fix in
`src/pokemon.c`; nothing the calc models. First Impression's power (100 -> 90) comes in with the data.

Reviewed `ee4518c149..64838bf7db` against the existing profile and `tools/calc/README.md` (Not modelled).
The 0.8.5 update changes notes and game data only, not `cfg.calc` or the shared engine. The older source traces
below are not a claim that all 0.8.5 battle behaviour has been verified in game.

- Emergency Exit and the expanded Eject Pack triggers change switching and replacement timing. The calc has no
  automatic switch-out / replacement queue; apply the new battle state manually. Source: `SwitchInAbilityCheck.c`,
  `other_battle_calculators.c`, `ServerDoPostMoveEffects.c` and the hazard / Eject Pack battle tests.
- Hazards and berries now run through the source's switch-in sequence, including berry activation after hazard
  damage and Emergency Exit replacements. The calc exposes entry hazards and berry application separately; it
  does not simulate that queue. Figy-group healing remains 1/8 at half HP: `battle_item.c` extracts
  `GetHeldItemUseSubscript` from `TryUseHeldItem` without changing that formula; the five profile overrides stay.
- Pastel Veil now cures poison on switch-in and handles ally protection / messages. The calc already prevents its
  holder's Toxic Spikes / Toxic Orb poison, but does not cure an existing status on entry or model a Veil ally.
  Set that status manually (`SwitchInAbilityCheck.c`, `BattleController_BeforeMove.c`).
- Helping Hand changes are trainer AI scoring (`src/trainerai/{main,pick_command,setupStateVariables}.c`), not a new
  damage multiplier. The existing manual Helping Hand control remains; the calc does not predict AI decisions.
- Rage Powder now respects Grass, Overcoat and Safety Goggles (`CanIgnoreRedirection` in
  `other_battle_calculators.c`). Target redirection is not modelled; select the intended defender manually.
- Pluck / Bug Bite share the rewritten berry-use logic with Fling (`battle_item.c`); Kee / Maranga gain steal / fling
  effects in `itemdata.c`. The calc models damage / held-berry actions, not stolen or flung berry side effects or PP
  restoration. Existing Kee / Maranga after-the-whole-move timing is unchanged by this data update.

#### Save import

Reader `gen4` (`cfg.calc.save`); format: `template/calc/readers/README.md` → gen4: HeartGold hg-engine (NDS).
`extract/gid.py` writes `GID` after finalise
from the pinned source's headers (`include/constants/{species,moves,ability}.h`, `asm/include/items.inc`,
`data/Species.c` growth rates, `data/PokeFormDataTbl.c` forms): species as `species:form` (hg-engine numbers Gen 5 on 50
past the National Dex: Chesnaught is 702), 1,101 keys for all 986 P ids; 115 forms the guide lacks but whose stats,
types and abilities are their base's (Unown B, Shellos East, ...) map to the base; a form with its own data that the
guide lacks (Alolan Rattata) has no key, so an imported one is skipped and counted in the banner. Moves 783 of 783 and
abilities by name (the ten repeated names at the end of AB, which no species uses, take the first); items are the
constant's name in the trainer sets' spelling (Kings Rock -> King's Rock). `check.py` → `check_gid`.

Checked 2026-10-28 against the user's **0.7.0** save: `tools/calc_save_check.mjs` matches all 11 Pokémon
(6 party, including hidden-flag Protean Frogadier; 5 boxed, levels from experience). The expected file came from
a separate Python decoder using the same format notes, so this checks the JS, not the format independently.
Still untested: a 0.8.x save, mints, Alolan / Galarian forms and eggs in the party; the user reports import errors
in play.

#### Sources and profile

Authority: `kumakuma1/hardlove` at `f1b236300187a2b18bf1a0b5ee1f80b3a2fed57b` (0.8.3) for the traces in this section;
the guide's data now comes from `4a8d4a6308` (0.8.7): recheck a traced battle file against it when its rule matters.
The mechanics table's source paths and line numbers refer to that 0.8.3 pin.
User-supplied notes agree with `doc/Mechanics.txt:5-34`.

| Mechanic | Implementation / source |
| --- | --- |
| No EVs | Existing `cfg.evs` hides editing; `cfg.calc.evs: false` also ignores supplied EVs in engine stats/damage. Other profiles keep EVs. |
| Crits | `critStages`: 1/16, 1/8, 1/2, 1, 1 (`src/battle/other_battle_calculators.c:1720`). Explicit x1.5 damage (`src/battle/battle_calc_damage.c:424`). No crit sampling: KO odds are conditional on a hit and selected crit. |
| Gems | Matching live item/type: replace native last 5325 power modifier with 6144 (x1.5), `src/individual/CalcBaseDamage.c:915-918`. Item identity retained for Flying Gem + Acrobatics. Magic Room, Klutz and wrong-type Gems do not boost. |
| Gem exclusions | No boost for Struggle, Pledges or OHKO moves: `src/individual/BattleController_BeforeMove.c:5166-5188`. Consumption precedes damage: `data/battle_scripts/subscripts/subscript_0452_HANDLE_GEM_ACTIVATION_MESSAGE.s`. |
| Unseen Fist | Native contact-only Protect bypass at full damage. Docs' "completely" does not mean non-contact moves: `CanHitThroughProtect`, `src/individual/BattleController_BeforeMove.c:2556-2567`, checks contact. Punching Glove prevents contact. |
| Protean / Libero | Every-move STAB by user choice, despite once-per-switch Protean vs repeated Libero in `src/individual/BattleController_BeforeMove.c:620-645`. The edit menu sets the defending type; no type history. |
| Kee / Maranga Berry | Fire after the whole move (`src/individual/ServerDoPostMoveEffects.c` step 17 with Red Card / Eject Button), never between hits: `over.afterMove`, no `pre` event; Luminous Moss, Absorb Bulb, Cell Battery, Snowball, Weakness Policy fire on the hit (`CheckDefenderItemEffectOnHit.c`). Gems boost every hit (`gemBoostingMove` set before the move, cleared at move end). Check: `kee-maranga-after-the-move`. |
| Multi-hit counts | `battle_script_commands.c` (2-5 roll): Skill Link 5; Greninja form 1 Water Shuriken 3 hits, power 20 (`CalcBaseDamage.c` `MOVE_WATER_SHURIKEN`); Loaded Dice 4-5, Population Bomb 4-10 with one accuracy check. |
| Battle Bond | Manually select +1 Atk and +1 Spe after KO, no SpA: `data/battle_scripts/subscripts/subscript_0515_BATTLE_BOND_BOOST.s:11-16`. No automatic post-KO simulation. |
| Snow | Gen 9 Snow (no Hail): Ice physical Defense x1.5, not SpD, `src/individual/CalcBaseDamage.c:1400-1408`. |
| Fields | Existing Gen 9 fields retained; add per-side Flower Gift, Power Trick, Protect using existing renderer/native engine. Importer's limited field list is not an availability specification. |
| Permanent fields | Setter and area weather / terrain stay (`setterStays`); no countdown or Defog simulation. |
| Moody / sleep / OHKO | Accuracy/evasion randomness, sleep duration and OHKO chance/level checks are outside damage simulation. Current sleep status and manual stat stages remain usable. |
| Return / Frustration | Power from happiness (`CalcBaseDamage.c:211-215`, integer `*10/25`); the user types the power (`expansion` varpow), so the calc takes the typed value. Fixtures: `frustration-happiness-127`, `frustration-happiness-0`, `return-happiness-127`. |
| Rage Fist | Flat data power 100 (sheet's +50 per hit taken not modelled): no hit-taken counter is in the source (only the punch list, `other_battle_calculators.c:441`). Fixtures: `rage-fist-flat-100`, `rage-fist-normal-target-immune`. |
| Thunder Wave | Status-only (accuracy bypass for Electric users, no damage rule): out of scope for damage. |
| Pain Split | Status-only (HP averaging): out of scope for damage. |
| Misty Explosion | Power 200 is data; Misty Terrain x1.5 is stock Gen 9 (`CalcBaseDamage.c:492-494`, applied to base power), without Defense halving. Fixtures: `misty-explosion-misty-terrain`, `misty-explosion-no-terrain`. |
| Explosion / Self-Destruct | Power 250 / 200 are data. No Defense halving in source (`CalcBaseDamage.c` has no Explosion case; the sheet's "Halves target's defense" is not implemented) and none in Gen 9 stock (Gen 1-4 only). Current calc: not halved. Fixtures: `explosion-defense-not-halved`, `self-destruct-defense-not-halved`. Decision: the code wins, no halving; check in game (In-game tests). |
| Hidden Power | BP 60 is data (`CalcBaseDamage.c:361-362`). Type from IVs (`other_battle_calculators.c:3277`) is not derived: set the move's Type manually. Fixtures: `hidden-power-fire-typed`, `hidden-power-data-type-normal`. |
| Double Shock | Not a punching move: neither data.json nor stock flags it, so Iron Fist never boosts it. "Must be Electric" is a usability rule, not damage. |

`cfg.calc.over.state` keeps the battle-state inputs off
where the source ignores them (each `calc_states.json` case cites its source line): Echoed Voice, Rage Fist, Last
Respects, Avalanche, Round, Fusion Flare / Bolt and the pledges stay flat; Defense Curl doesn't double Rollout / Ice
Ball (lost in the replacement damage path); Magnitude isn't doubled against Dig (only Earthquake is); Gust / Twister
against Fly double their power, not their damage. Revenge's toggle means "the target was already damaged this turn"
(the source's condition). Crit stages: `MV.cr` from the move effects in `data/Moves.c` (28 moves; Dragon Cheer and
Ivy Cudgel have none at the traced pin), the five-entry `critStages` table caps the stage at 4. Spectral Thief
doesn't steal (`over.state`: `false`; its HIT script at the traced pin has no theft): plain 90 power.
**Doc says** it steals boosts. Intrepid Sword / Dauntless Shield are once per battle in the source; uncheck the
ability's checkbox when entry should not trigger it (`entry: false`). Checks: `hacks/hardlove-gold/calc_states.json`.

Gem replacement intentionally takes the **last** native 5325: in pinned `@smogon/calc 0.12.0`
`calculateBPModsSMSSSV`, the Gem item branch follows ability modifiers and no later branch adds 5325. First-match
replacement would be ambiguous with Sheer Force. Recheck this on engine updates; source/stock parity does not
certify every modifier-order/rounding combination in hg-engine.

#### Move flags

`extract/move_metadata.py` → `describe()` writes `MV.f` / `tg` / `se` in the `tools/moveprops.py` vocabulary (the
move pages and the calc read the same `MV.f`). Source first, at the pin:
- `data/Moves.c`: target (`.target` → `tg`; `RANGE_SINGLE_TARGET_SPECIAL` is `scripted` for Counter / Mirror Coat /
  Metal Burst / Comeuppance, else `self`), **contact** (`FLAG_CONTACT`), `reflectable` (`FLAG_MAGIC_COAT`) and
  `noprotect` (no `FLAG_PROTECT` on a move aimed at others: `protect_flags`). Source removes standard contact from
  Sunsteel Strike, Collision Course, Electro Drift, Thunderous Kick and Behemoth Blade.
- Move groups from the engine's tables (`extract/move_tables.json`, each with its source line): punch (Growl in,
  Double Shock out), bite, pulse, slicing (adds Crush / Dire / Dragon / Metal / Shadow Claw), dance, powder, bullet,
  wind, multihit, sound, and triage (→ `heal`, with the drain moves).
- From the move's effect id (`.effect` + `.effectChance`, read against `data/battle_scripts/effects/*.s`): `se`
  (status, flinch, confusion, stat stages with whose, recoil / drain / heal fractions; ON_HIT drops and recoil are
  100% whatever effectChance says; Tri Attack / Dire Claw split their chance three ways; the fang moves roll 10% each),
  `secondary` (a chance effect on a damaging move, plus Psychic Noise / Throat Chop / trapping hits / Secret Power),
  `charge`, `recharge`, `binding`, `crash`, `defrost`, and `recoil` only for the effects Rock Head and Reckless see
  (`Activate_RecoilDamage`; Steel Beam, Mind Blown and Struggle lose HP their own way: `se` only).
- Showdown 0.11.11 (`.src/cache/showdown.json`) only where the source is silent: `bypasssub`, `gravity` and the
  other flags the engine keeps in no table. Effects the source leaves as a plain hit stay plain (Aura Wheel, Salt
  Cure, Order Up, Upper Hand, Alluring Voice, Eerie Spell have `MOVE_EFFECT_HIT`: no `se`). Collision Course is not
  matched to the game data (its Moves.c name), so it keeps no metadata.

`MI`: the shared rules plus `extract/move_rules.json`, which `extract/move_rules.py` writes on every build from the
source's lists (so it follows an update): Sheer Force and Covert Cloak by `battle_script_commands.c:1070-1150`'s
effect-id switch (Sheer Force also names Sparkling Aria, Spirit Shackle, Anchor Shot, Ceaseless Edge, Stone Axe,
Electro Shot; Secret Power's case is commented out; the cloak also blocks the user's boosts, e.g. Flame Charge),
Protective Pads on the defender (`IsContactBeingMade`, `other_battle_calculators.c:2874`) and No Guard on OHKO
moves (`Mechanics.txt:30`; no level check, `BattleController_BeforeMove.c:4770`). Not move rules
(Mechanics.txt 24-32): Unseen Fist (stock, contact only), Protean / Libero, Battle Bond, Moody, permanent weather
and terrain.
Reckless and Sheer Force follow the source's effect-code lists (`CalcBaseDamage.c:691-709`) through `over.rules`
`powerMods`: Reckless x1.2 on Chloroblast (stock has no recoil flag on it); Sheer Force x1.3 added on Floaty Fall,
Splishy Splash and Thousand Waves, and removed on the 21 moves stock boosts but the source does not (Rapid Spin,
Secret Power, Snore, Sky Attack, Alluring Voice, Bounce, Upper Hand, Barb Barrage, Relic Song, Diamond Storm, Double
Iron Bash, Aura Wheel, Axe Kick, Salt Cure, Mortal Spin, Order Up, Matcha Gotcha, Eerie Spell, Esper Wing, Infernal
Parade, Dire Claw). Fixtures `source-sheer-force-*`, `source-reckless-chloroblast`.

#### Importer downloads

0.8.4 exports, references only, not shipped (pins and re-fetch: `SOURCES.md` → Calc references):
- `hardlovegoldnds084_npoint_data.json`: title 0.8.4, 1,039 species, 905 moves, 690 species with sets (1,910 sets).
  Useful for a future version-update cross-check; no damage engine or expected rolls.
- `hardlovegoldnds084.js`: `var overrides`, species/learnsets, encounters, moves, items and abilities.
- `hardlovegoldnds084_searchindex.js`: generated search/aliases, not mechanics.

Malformed move: key `10`, type `000`, category `000 bolt`, priority 195. Item overrides contain only two records.
These are not complete validated replacements for pinned source/guide tables or verified calc settings. No
unlicensed importer code/tables were copied into tracked runtime files.

#### Checks and limits

`tools/calc/hardlove_check.mjs` compares rolls with stock Gen 9, guide numbers, reference Gem powers and
hand-derived examples. Fixtures have no runnable hzla settings: do not pass them to `tools/calc/hzla_compare.mjs`.
Run with `npm test --prefix tools/calc`; browser controls and persistence:
`node tools/scenarios/calc-hardlove.mjs dist/hardlove-gold.html`.

Shared engine limits: `tools/calc/README.md`.

#### In-game tests

Open mechanics checks for the user:
1. Known level/nature/IV and zero-EV sets: record starting/ending HP for a neutral move, matching Gem, guaranteed
   crit, Flying Gem + Acrobatics and a multi-hit Gem attack. Multiple observed hits can challenge the range; one
   hit cannot prove all 16 rolls.
2. Against Protect with Unseen Fist: contact full damage; same punch with Punching Glove blocked; Dark Pulse blocked.
   Test the five source-specific non-contact moves when available.
3. Two different off-type moves without switching: record type/damage for Protean, repeat with Libero. The calc gives
   STAB on every move (user decision); if the game drops it on the second move, that is the accepted difference.
4. Battle Bond: compare all stats before/after KO, after a second KO, and after switching. Atk/Spe only, no SpA.
   Use manual stages in the calc; repeated-trigger behaviour is not certified.
5. Ice defender with Snow: physical vs special damage. Also check permanent weather/terrain beyond normal duration,
   Defog not clearing terrain, Gen 4 sleep turns and No Guard/Lock On OHKO chance in gameplay, not damage parity.

Rolls are the engine's 16 rolls. Level 50, Serious nature, 31 IVs, 0 EVs, no item, no field unless stated. "Other way"
is what the game shows if the point goes the other way.

- **Explosion is not halved.** Settles: the target's Defense is not halved for Explosion (the sheet says halved; the source has no halving).
  - Attacker: Snorlax (Atk 130), no ability effect. Defender: Blastoise (HP 154, Def 120). Move: Explosion (power 250, STAB).
  - Expected: `153 156 157 159 160 162 165 166 168 169 171 174 175 177 178 181`.
  - Other way (halved): `306 309 312 316 319 324 327 330 334 337 342 345 348 352 355 360`. Halved Def equals doubled Atk here (Def 120 is even).
- **Self-Destruct is not halved.** Same setup with Self-Destruct (power 200).
  - Expected: `123 124 126 127 129 130 132 133 135 136 138 139 141 142 144 145`.
  - Other way (halved): `244 247 250 252 255 258 261 264 267 270 273 276 279 282 285 288`.
- **Rage Fist has flat power 100.** Settles: no +50 per hit taken (the sheet's rule is not modelled).
  - Attacker: Snorlax with Rage Fist, no hits taken. Defender: Blastoise.
  - Expected: `41 42 42 43 43 44 44 45 45 46 46 47 47 48 48 49`.
  - Other way (one hit taken, power 150): `62 62 63 64 64 65 66 67 67 68 69 70 70 71 72 73`.
- **Protean on a second off-type move.** Settles: the calc gives STAB to every off-type move (an accepted decision); the source gives it once per switch-in.
  - Attacker: Greninja (Protean). Defender: Snorlax. Move 1: Ice Beam. Move 2, same switch-in: Flamethrower (Fire).
  - Expected in the calc (STAB on both moves): `49 49 49 51 51 52 52 52 54 54 55 55 55 57 57 58`.
  - Other way (no STAB on move 2, the source rule): `33 33 33 34 34 35 35 35 36 36 37 37 37 38 38 39` (Greninja without Protean, Flamethrower).
- **Snow raises Ice Defense against physical moves only.** Settles: Snow does not change special damage.
  - Defender: Abomasnow (Ice/Grass, Lv 50). Physical attacker: Snorlax, Tackle. Special attacker: Alakazam, Psychic (power 90).
  - Physical in Snow: `22 22 22 22 24 24 24 24 24 24 25 25 25 25 25 27`. Other way (no Snow): `33 33 33 33 34 34 34 34 36 36 36 36 37 37 37 39`.
  - Special in Snow: `76 76 78 78 79 81 81 82 82 84 85 85 87 87 88 90`, the same with no Snow.

AI and gauntlet checks (the calc follows the C; these confirm it in game; details under Damage calc / AI):
- **Gauntlets:** Kimono Girls / Lighthouse: HP, status and used items carry between members; nothing heals between
  them.
- **AI picks:** with Encore the locked move every turn; Taunted never a status move; Protect "last turn" / "2 turns"
  changes how often it Protects; Sleep 1/2/3 changes the Sleep Talk / Snore pick; Yawn, Bound, Future Sight on your
  Pokémon change its picks. Perish Song at score 104 is 60 %, not the doc's 66 %.
- **Doubles:** the faster foe picks first (Speed-tie order: the first-requested slot); the slower one ignores a
  Pokémon of yours the faster could OHKO with any move, even when the faster doesn't attack it (the opposite slot
  wins when both are OHKO-able); ally moves skip the PP / Disable / Taunt / Encore checks.
- **Switch-ins:** after a double KO the second foe in is rank #2, picked before entry effects and before your
  replacement; Wobbuffet / Wynaut's bonus reads only your opposite-slot Pokémon; Zoroark rerolls per pick (the grid
  shows the most likely order).

### Damage calc / AI

#### Guide wiring (unit 3a)

The Hardlove calc profile alone declares `ai: "hardlove"`. `tools/calc/build_ai.mjs` bundles the engine and
metadata into `template/calc/ai/hardlove.js` (esbuild, IIFE); assembly inlines it, `ai/ui.js` and `ai/ui.css` only
when that switch is set. No runtime import, fetch or extra file is needed. Other guides retain their damage
engine and render path without AI resources or UI. Rebuild this bundle separately from the shared damage engine.

`extract/dex.py` writes `MV.aiEffect` (source effect without `MOVE_EFFECT_`) and `MV.aiChance` (source
`effectChance`, 0..100) for all 783 moves; schema accepts/validates both. Other data/report content is unchanged.
The adapter restores the source's variable-power marker 1 from a damaging move's null `bp`, translates targeting
names where the AI needs source constants, and passes source flags/chance rather than generic effect text.

`CALC.ai.input()` builds complete parties in their original order and explicit active-party mappings. It resolves
the calc's Mega view, pre-stage stats, form/base species via `GID.sp`, effective types/ability, raw available item,
HP/status/stages, both side fields and move overrides. Weight and Fling/Natural Gift metadata use the same pinned
stock dataset/name fallbacks as the damage engine, with profile species-weight overrides; Mega Stone metadata is
derived from `P.stone`, not a toggle. Item suppression stays in the AI snapshots. Unselected party mons retain their
stored set/form, without outgoing scratch boosts or history. A missing doubles partner is an explicit dead slot,
mapped to a call-local empty party entry; real fainted actives retain their actual party index.

Implicit `CALC.ai.slots` hold card keys, not data indices: viewing either active leaves opposite/across positions
alone (important for the unit 2 C exceptions). Selecting a bench mon replaces the viewed slot. The engine input
contains ephemeral party indices only; neither these nor any reordered grid is persisted. `viewed` identifies the
currently inspected active; `parties()` maps card keys back to the unreordered input sets. Unit 3b can use these
hooks for the field/bench controls and `switchInOrder(options)` for rank distributions.

Unknown battle history is an explicit per-mon `facts` object. `setFacts(side, patch)` overrides defaults for 3b;
firstTurnOut Auto is true on entry, becomes false after the first damage tap to/from it, and resets when it leaves.
Other unknown flags/counters default false/0, last move/choice/Encore/Disable/Recycling item empty, sex unknown;
sleep uses the engine's default two remaining turns when asleep. Existing Focus Energy, Laser Focus, Seeded,
Ingrain/Aqua Ring/Magnet Rise/Roost, semi-invulnerability, Toxic count and ability activation feed it from calc state.
Hidden Power, item powers/removability, Mega Stone presence, party survival and Paradox stat are metadata/derived
inputs, not battle toggles. Escape prevention derives the known opposing trapping abilities and current typing;
`cantEscape` and active `perishSong` also accept explicit overrides. Complete input JSON keys the one-result cache.
`clearBattle()` clears AI scratch and slots; `memberDirty()` counts changed AI facts; card ↺ clears that mon's facts.
No new localStorage keys or persisted fields are introduced.

Foe rows display unconditional move odds (the viewed target in doubles, ally odds for ally-only moves), score
branches and the maximum-% accent. Expanded doubles rows list all target pairs, including zero-probability targets,
then each score distribution's base and bonus outcomes. Singles `Sw N%` is a battle-state-sized chip left of the battle-state tag;
`fitCards` moves it with that tag (`.sup`), and back down (`.swdn`) when both don't fit the HP line. The engine owns all rounding, including the 100% remainder.
#### Grids, doubles controls, Field → AI (unit 3b)

UI rules: `template/README.md` → Damage calculator. Here: what feeds the engine.
- Grid order: `CALC.ai.grid(side)` → `{keys, field, rank}` (card keys, display only). The foe bench order is
  `switchInOrder` over the current input (cached by input JSON); when Zoroark's +0-2 gives several orders (`order` null)
  the grid shows the most likely whole order (`orders` by probability) and its ranks.
- Slots: a bench pick takes the viewed slot; on the foe side, if the viewed foe is alive and the other on-field foe has
  fainted, the pick takes the fainted one's slot (the replacement after a KO).
- Field → AI toggles (per viewed on-field Pokémon, stored in `facts` with a `manual` set; both cleared with the facts):
  | Side | Toggle | Fact (value set) | Read by |
  | --- | --- | --- | --- |
  | Foe | First turn (Auto) | `firstTurnOut` | attacker scoring |
  | Foe | Last move (select) | `lastUsedMove`; `moveNoChoice`, `encoredMove`, `disabledMove` derive from it | lock / usable moves |
  | Foe | Protect ×0 / last turn / 2 turns | `protectSuccessTurns` 0 / 1 / 2 | Protect scoring |
  | Foe | Taunted / Encored / Disabled / Torment | `tauntTurns` 3 / `encoredTurns` 3 / `disabledTurns` 4 / `torment` | `IsMoveUsable`, lock +1000 |
  | Foe | Substitute | `substitute` | attacker STATUS2_SUBSTITUTE, hard switch |
  | Foe | Sleep 1 / 2 / 3 (asleep only; default 2) | `sleepCounter` | Sleep Talk / Snore |
  | Foe | Throat Chop / Wish | `throatChopTimer` 2 / `wishCount` 1 | sound moves / Wish |
  | Foe | Can't escape (Auto when a trapping ability derives it) / Perish Song | `cantEscape` / `perishSong` | hard switch |
  | Foe | Ate berry (knows Belch only) | `canBelch` | Belch |
  | Player | First turn (Auto) | `firstTurnOut` | defender scoring |
  | Player | Last move (select) | `lastUsedMove` (its choice lock) | switch-in / usable moves |
  | Player | Confused / Infatuated / Nightmare | `confusion` / `attract` / `nightmare` | defender STATUS2 bits |
  | Player | Yawn / Lock-On / Imprison / Lucky Chant | `yawn` / `lockOn` / `imprisoned` / `noCritical` | defender effect bits |
  | Player | Bound / Future Sight | `bindingTurns` 4 / `futurePredictionCount` 2 | trapping / Future Sight scoring |
  Left out (the port reads them only where a toggle would mislead, or not at all): player Substitute (the C reads
  STATUS2_SUBSTITUTE on the attacker only), foe Confused / Infatuated (defender only), `lastResortCount`,
  `recycleItem`, `furyCutterCount`, `metronomeCount`, `teammateFaintedLastTurn`, `transformed`, `healBlock`.
  Derived, not toggles: the calc's Seeded, Focus Energy, Laser Focus, screens, Tailwind, Dig / Fly, Toxic count,
  fainted, Speed (unit 3a).

The trainer AI (`src/trainerai/`, pinned `4a8d4a6308`, fetch: SOURCES.md) is ported headless in
`template/calc/ai/` (plan: `plans/calc-ai.md` in git history). Singles/doubles picks, hard switching and post-KO ranks are headless;
unit 3 still supplies the guide-data/state adapter, assembly and UI.
- Layout: `hardlove/damage.mjs` = `calcDamage.c` (the AI's own formula), `speed.mjs` = `calcSpeed.c`, `calc.mjs` =
  `calc.c`, `helpers.mjs` = `scoringHelper.c`, `state.mjs` = `setupStateVariables.c` (`BuildStateVariables`: damage
  tables; `ApplyDamageRolls`: one roll per move), `scoring.mjs` = `main.c` (each scorer is a line-for-line
  `<Name>Port`, the C's names; ids upper-cased without punctuation, effects without `MOVE_EFFECT_`).
  `pick_command.mjs` / `doubles.mjs` = `pick_command.c`, `postKO.mjs` = `postKO.c` plus the party snapshot from
  `calc.c`. `enumerate.mjs` (shared): exact rational odds, joint top-score/tie-mask/any-KO distributions.
  `index.mjs` exports `evaluateSingles`, `evaluateDoubles`, `switchInOrder` and the C-named entry/helpers.
- Input state: `{attacker, defender, field}`; a mon is `{species, level, types, ability, item, status ('slp' ...),
  attack, defense, spAttack, spDefense, speed, currentHP, totalHP, statBoosts {attack ...}, moves [{name, type,
  category, power, effect, priority, flags, target, pp?, secondaryEffectChance?}], facts {...}}`. Move `effect` /
  `secondaryEffectChance` come from `data/Moves.c` (`.effect`, `.effectChance`), via `MV.aiEffect` / `MV.aiChance`.
  No `pp` = usable (the calc has no PP).
- Rolls (setupStateVariables.c): one `BattleRand % 16` per hit (85-100 %, after crit, before STAB), Triple Axel /
  Kick and Parental Bond roll each hit and sum; then `BattleAI_AdjustUnusualMoveDamage`; a killing roll is capped at
  the target's HP. Damage the AI receives: the max roll. Scoring reads only its own move's roll plus the max over all
  moves and "any move kills", so the enumerator conditions on (max, any-KO) per move instead of 16^4 products.
- Score: the C adds 1000 base (+1000 more for an Encore / choice-locked move); the port reports the rest. Ties:
  `ChooseMove` picks uniformly among equal top scores.
- `BattleAI_GetDynamicMoveType`: the C's `default: type = TYPE_NORMAL` then `else if (type)`: `TYPE_NORMAL` is 0, so
  ordinary moves keep the move table's type (the first port read it as "every move is Normal").
- `EXPLOSION_ON_LAST_MON` is 0 (main.c:18): the last-mon Explosion penalty is off.
- Engine vs `calcDamage.c`: `tools/calc/hardlove_ai_damage_compare.mjs` compares all sixteen summed rolls in the
  95 `calc_matchups.json` cases: 82 identical, 13 explained, zero unexplained. JSON (full arrays and reasons):
  `.tmp/ai-engine/damage-comparison.json`; log: `.tmp/ai-engine/compare.log`. This is not an independent game oracle.
  Adapter repairs: source move effects (Reckless/Sheer Force and multi-hit adjustment), flag and target names,
  screens, guaranteed crit state, Power Trick raw-stat swap, hectogram weights with form overrides, effective
  Speed, Helping Hand partner move, living Flower Gift partner, spread target count, suppressed held items.
  `GetBattleMonItem` (`src/battle/battle_calc_damage.c:200`, same pin) returns no item for Klutz, Embargo, Magic
  Room and opposing Unnerve on berries; do not pass the UI's raw item as an active AI item in those states.

Real formula gaps in those cases (odds always use the AI behaviour, not the displayed damage engine):
| Term / cases | AI (`calcDamage.c` / `calc.c`) | Damage engine |
| --- | --- | --- |
| Sheer Force / `source-sheer-force-thousand-waves` | `IsMoveBoostedBySheerForce` excludes Thousand Waves | Includes it (48-57 vs AI 37-44) |
| Gem / `gem-pledge-excluded` | Matching gem boosts Water Pledge by 1.5 | Pledges excluded (37-45 vs AI 55-66) |
| Protect / `protect-blocks`, `unseen-fist-noncontact-still-blocked`, `source-noncontact-{sunsteel-strike,collision-course,electro-drift,thunderous-kick,behemoth-blade}`, `unseen-fist-punching-glove` | No Protect damage reduction; Protect is scored separately | Zero damage |
| Protect / `unseen-fist-contact` | Full damage (152-180) | Engine contact bypass still applies 1/4 (38-45); not a claim that the game does |
| Gyro Ball / `w2-gyro-ball-equal-speed` | `floor(25*defSpeed/atkSpeed)+1`, capped 150 (26 BP here) | No +1 (25 BP here) |
| Punishment / `w2-punishment-positive-and-negative-boosts` | TODO/commented out; leaves move table power 1 | `min(200,60+20*sumPositiveDefenderStages)` (160 BP here) |

Helper/damage review repairs (fixtures in `tools/calc/hardlove_ai_check.mjs`):
- Parental Bond now carries the actual `IsBannedParentalBondMove` tables (multi-hit, OHKO, charge-turn, Z/Max,
  Present etc.), rather than requiring the caller to supply a ban flag. Triple Axel/Kick still roll each hit.
- Dynamic Normal moves use `MoveIsAffectedByNormalizeVariants` exclusions, including Z/Max. Source trait lists
  supply Triage, powder, ball, punch, bite, pulse, slicing and Minimize; guide `bullet`/`slicing` aliases work too.
  Preserve the source's unusual punching-table entry: Growl replaces Double Shock (an inline comment caused the
  first table extraction to omit Growl). A fixture protects this, rather than substituting standard move flags.
- `HasMovePriority` checks Grassy Terrain duration; single-target Prankster checks opposing sides.
- Speed respects an explicit held-effect override (including `NONE`) instead of re-enabling a named item.
  State snapshots suppress items using `GetBattleMonItem`; raw battle-mon items remain available to scoring and
  residual helpers, matching the two C structures. Suppressed Choice items neither disable nor force a move.
- Outgoing and incoming damage use the damaged side's screens, not one global Reflect applied both ways.
- Fly/Dig/Dive flags no longer invent the separate `SEMI_INVULNERABLE` flag; effect flags accept camelCase,
  snake_case and named arrays. State and damage grounding now share the same implementation.
- Q4.12 multiplication follows `asm/qmath.s`: 32-bit wrap, half-down/up rounding, and the 4096 identity fast path.
- Crucially, Explosion/Self-Destruct/Misty Explosion/Final Gambit return scalar **zero** before type/burn/final
  modifiers, while leaving their damage ranges populated. `setupStateVariables.c` overwrites `damageRoll` with
  that return value. Their own rolled outcomes are therefore zero; incoming max-roll tables remain nonzero.

Review completed against pinned `4a8d4a63082176008ccda09214d6341d43674a6a`: `calc.c` (unusual damage,
KO checks, usability, item/priority/grounding helpers and pure Hidden Power/Paradox helpers), `calcSpeed.c`,
`scoringHelper.c`, and `calcDamage.c`, including their called move-trait and Q4.12 helpers. `main.c` scoring
deltas, random branches and cases were machine-compared in the initial port. A final comment-stripped table
audit checked 5,032 move/effect entries against C (Sheer Force, Parental Bond, all ten trait tables, useful sound,
switching, flinch/thaw and Encore lists); local record: `.tmp/ai-engine/source-audit.log`.

Unit 1 headless fixtures: `hardlove_ai_check.mjs` 49/49; existing damage suite `hardlove_check.mjs` 107/107. Status
fixtures cover paralysis, burn, sleep/Yawn, poison, confusion and Leech Seed; hazards cover all four hazards,
layer limits, first-turn bonuses, final foe and Magic Bounce/Mold Breaker; recovery covers strict thresholds,
incoming maximum damage, healing cap, toxic, Heal Block, pending Wish, weather, Rest support and terrain.
They assert exact score distributions and mixed-move rational odds, not only rounded percentages. Logs:
`.tmp/ai-engine/test.log`, `.tmp/ai-engine/hl.log`. The 13 explained comparison cases also have all sixteen
engine and AI rolls committed in `tools/calc/hardlove_ai_damage_gaps.json`; changed, missing, stale or unexplained
cases fail the comparison. No browser/gate checks or UI changes belong to this unit.

Input boundary for wiring and the later party/doubles units:
- Pass precomputed game stats before stages/speed modifiers, separate `statBoosts`, current types/effective ability,
  base species name plus form number, HP and source move effect/chance. This module is not a ROM/NARC reader or
  party stat constructor. `weight` is hectograms, not kg. The comparison adapter is not the production UI adapter.
- Supply game-dependent facts: Hidden Power type (or use `GetHiddenPowerType` with IVs), Fling power, Natural Gift
  type/power, held-item removability and selected Paradox stat. Do not silently invent unknown battle history.
  `BattleAI_GetHighestParadoxStat` preserves the C helper's **u8 parameter truncation** and tie order
  Attack, Defense, Sp. Atk, Sp. Def, Speed; review that call boundary when implementing party stat construction.
- Side fields are nested `field.attacker` / `field.defender` (screens, hazards etc.); flat screen keys are only
  a defender-side compatibility fallback. Keep raw battle-mon items distinct from active-item snapshots, and
  incoming max-range damage distinct from own scalar-return damage (especially Explosion-family moves).
- Unit 2 derives party/switch facts in the command API. Supply the complete party and active slots; omitting
  the party deliberately means no known bench and therefore no hard-switch forecast. `evaluateSingles` still
  rejects a doubles state; call `evaluateDoubles` for its correlated (move, target) pairs.
- UI wiring still needs move `effect` / `effectChance` extraction and the battle facts below. No extract,
  `calc.js`, shared engine or assembly changes were made; do not enable AI UI before that adapter is complete.

AI inputs the calc lacks (the AI toggle list; the port reads them from `facts`): first turn out (`firstTurnOut`:
Fake Out / First Impression), last move (`lastUsedMove`: Torment, Encore, choice lock `moveNoChoice`), Encore
(`encoredTurns`, `encoredMove`), Taunt (`tauntTurns`), Disable (`disabledTurns`, `disabledMove`), Torment, sleep turns
(`sleepCounter`), Protect streak (`protectSuccessTurns`), Substitute, confusion, attraction, Yawn, Ingrain, Aqua Ring,
Lock-On, Imprison, Heal Block, Throat Chop, Laser Focus, binding turns, Future Sight / Wish pending, Magnet Rise,
Roost, Last Resort count, Recycle item, Fury Cutter / Metronome counts, Slow Start, Flash Fire, Protean used
(`abilityActivated`), Transform, failed move last turn, teammate fainted last turn, can Belch, held item removable.
New switch facts: `cantEscape` (the result of the game's escape/trapping checks), `perishSong` (active effect,
not the countdown). Derive escape prevention where possible; the calc otherwise needs an override. Bench metadata
needs `facts.isMegaStone` (item data, not a battle toggle). Partner attack availability, partner move, ignored
target, living members, party Mega presence, best post-KO score/slot/damage and `shouldSwitch` are produced by
the engine, not user toggles. Unit 1's synthetic post-KO `state.facts` overrides remain usable in fixtures without a party;
real party input takes precedence over synthetic post-KO facts.

#### Headless command and switch API (unit 2)

The mon shape above is unchanged. Pass pre-stage, pre-speed-modifier stats, raw held item, and current effective
ability/types; the adapter must already resolve AI Mega stats/forms as described above. Pass actual learned moves
in slot order (one to four, no empty placeholders). Parties use the same shape but their stored stats/ability/form,
not their outgoing battle boosts/history. Party snapshots reset battle history, add Intrepid Sword/Dauntless Shield,
compute entry speed (Sticky Web, Room Service, seeds), and retain the C's raw party item even under Magic Room.
No entry hazard HP subtraction or new entry Intimidate is simulated: that is also what this C does.

All probabilities include `probability` (0..1) and `exact: {numerator, denominator}` (decimal strings).
`{digits: 0}` is the default second argument; 0..6 decimals are supported. Display percentages always sum to 100
per acting foe (including singles switch); the largest actual pair/move takes the rounding remainder. Never derive
another probability by summing the rounded percentages when exact weights are available.

```js
evaluateSingles({attacker, defender, field, attackerParty, defenderParty, attackerPartySlot})
// {moves: [{index, name, probability, exact, percent, score, branches}],
//  switch: {probability, exact, percent, partySlot}}

evaluateDoubles({foes: [foe0, foe1], players: [player0, player1], field,
  foeParty, playerParty, foePartySlots: [partySlot0, partySlot1], firstRequestedSlot: 0})
// {order: [firstFieldSlot, secondFieldSlot], foes: [{slot, pairs, switch}], firstBranches}
// pair: {index, name, target: {side: 'player' | 'foe', slot: 0 | 1},
//        probability, exact, percent, score, branches?, selectionTarget, scoreContexts}

switchInOrder({foes, players, field, foeParty, foePartySlots, attackerSlot: 0,
  reservedPartySlots: []}, {digits: 0, replacementSlots: [0, 1]})
// {order: [partySlot, ...] | null,
//  ranks: [{partySlot, species, ranks: [{rank, probability, exact, percent}]}],
//  orders: [{partySlots, probability, exact}]}
```

`field.attacker` is always the foe side and `field.defender` the player side, even when evaluating incoming damage.
In doubles the player/foe array slots are opposite: foe 0 faces player 0. Fainted slots retain their mon with
`currentHP: 0`; a fainted foe is omitted from move output, and a fainted player is not a target. With no player alive,
skip move odds and use `switchInOrder` (party-order fallback). All public calls leave their input unchanged.

`attackerPartySlot` is the singles active party index; `foePartySlots` are both doubles active indices, including
fainted actives. `activePartySlots` is a shared alias. Active/reserved slots, dead mons and Eggs are excluded from
bench results. If active objects are shared by reference with their party, indices can be inferred; otherwise pass
them explicitly (unknown mapping throws, not a guess). These indices only map this call's input party: do not persist
them or save the displayed reordered grid. The API here models one foe trainer's shared party, not separate multi
trainer parties. `TrainerAI_PickCommand` dispatches to singles or doubles by the presence of `foes`.

Singles `moves` is now inside a result object, not unit 1's bare array. Move probabilities are unconditional, not
conditional on staying in. A successful switch roll changes pivot scoring even if a pivot prevents a hard switch;
the shared roll is not an independent per-move bonus. Both the switch coin and damage any-KO remain correlated.
`switch.partySlot` is the best hard-switch candidate (may differ from the post-KO next out); -1 means none.

The slower foe is a mixture over the faster one's exact move AND any-KO/ignore branch, not just its marginal move.
`firstBranches` exposes `{index, target, ignoredPlayer, probability, exact}` for audit; `ignoredPlayer: -1` means none.
The slower's conditional damage already includes a known Helping Hand. Ally-target score labels start `A`, e.g.
`A+6/+8`; target foe/own slot means self (Milk Drink/Acupressure target correction), not the partner.
Pairs with zero probability are kept for evaluated targets; ignored targets keep zero pairs in the mixture.
`branches` are scoring probabilities BEFORE choosing a winner, not the score conditional on clicking this pair.
When a target was ignored on some branches, their mass sums to less than one (the missing mass was not scored).
Self-target corrections can merge two selection targets; then use `scoreContexts` (each has `selectionTarget`,
`score`, `branches`) instead of a flattened `branches`. `selectionTarget` alone identifies only the first context.

`switchInOrder.order` is non-null only when the complete order is deterministic. Otherwise use `orders` or the
per-mon `ranks` probabilities; never silently present the first random alternative as certain. Each successive
post-KO C call rerolls remaining Zoroark bonuses; the ranking distribution does that too (not one frozen random sort).
The second pick reserves/skips the first without applying entry effects. `replacementSlots` selects which foe slot
each successive call replaces, reusing its last slot for the remaining forecast; by default it is `[attackerSlot]`,
or `[0, 1]` when both foes are fainted. Singles also accepts its usual `{attacker, defender, attackerParty, ...}` shape.

Unit 2 fixtures: `hardlove_ai_check.mjs` 77/77 (original 49 plus 28 new); damage suite 107/107. Coverage adds
exact target-first ties, 39/128 hand-checked slower mixture, a non-OHKO
Encore pick still causing partner-ignore, Helping Hand's 23/48 ally-pick race, every ally scoring family, all lock/
usability rules, Trick Room/Stall/Lagging Tail/ties, both-player sums, Zoroark rank distributions and fresh rerolls,
double KO/no entry effects, hard-switch variance/Perish Song/pivot scoring, input immutability and JSON output.
Commands/logs: `node tools/calc/hardlove_ai_check.mjs` -> `.tmp/ai-doubles/test.log`;
`node tools/calc/hardlove_check.mjs` -> `.tmp/ai-doubles/hl.log`. No browser scenarios or gate run in this unit.

Unit 2 C/doc/spec differences (keep the C, confirm in-game):
- The plan's slot-invariance claim has exceptions. The first fast OHKO check is the faster foe's OPPOSITE player,
  even when both can be OHKO'd and the actual pick goes across. Reassigning the implicit field slots can change the
  slower one's odds; viewing a different mon must not silently reassign those slots.
- Wobbuffet/Wynaut's +2 checks only the OPPOSITE player's incoming KO, not both. Across-only danger does not remove
  it; a fainted opposite player grants it. Its rank can therefore depend on which foe slot needs replacing.
- The main damage score still applies PP/Disable/Torment/Taunt penalties and Encore/choice +1000 in doubles.
  `ScoreMovesAgainstAlly` applies NONE of those checks/bonuses. A 0 PP, disabled, Taunted Helping Hand can still
  win the ally table. This is not corrected to the doc's blanket claim that these moves are impossible.
- Perish Song with score 104 is 60%, not the doc's example 66%. All variance divisions truncate as C integers.
  The hard-switch post-KO calculation initializes the unused across damage percent to 1, so a zero-damage bench
  matchup yields 34% at score >=105 (or 14% at 104), not the doc's nominal 35%/15% maxima.
- Speed ties return 2: move-scoring treats that as AI-first, post-KO as fast, but deciding which foe picks first
  keeps the initially requested slot. No coin flip; `firstRequestedSlot` defaults to 0.
- Zoroark rolls happen per candidate per C invocation; successive replacement calls reroll the survivors. For two
  base-103 Zoroark before a score-104 mon, order 1,2,3 is 10/27, not a frozen-sort probability.

In-game follow-ups for the plan's To settle: ally usability bypass; both-fast-OHKO opposite-slot precedence;
Wobbuffet/Wynaut opposite-only bonus (also a double KO with it on the bench); exact Speed-tie request order;
Zoroark rerolls; double-KO picks before entry effects and before seeing a simultaneous player replacement.

AI doc vs C (the C wins):
- Trapping moves and Future Sight never get the highest-damage +6/+8, but their rolls still count for the maximum.
  Explosion-family moves are different: their scalar return is zero (above). At 50% HP, Explosion vs Tackle is
  exactly 3/8 vs 5/8, not the first port's 3/4 vs 1/4. The prior note/test conflated the scalar and range.
- A Taunted status move is −80 plus whatever its other scorers add (Swords Dance: −68), still never picked.
- An unusable damaging move (Disable, Torment, 0 PP) is never damage-calced, so it also scores the −40 immunity.
- The KO helper ignores Focus Sash, Sturdy and Disguise, but retains its Ice Face physical-hit exception.
  Residual death nets damage and healing, not real end-turn ordering: this helper does not prevent burn via
  Magic Guard, allows airborne Grassy Terrain healing, and omits hail damage under `GEN_LATEST`.
- Rest scoring does not test Insomnia, Vital Spirit, Comatose, Leaf Guard or already being asleep as the doc
  suggests; Sweet Veil, Uproar and grounded Misty/Electric Terrain are checked. Pending Wish and terrain-blocked
  Rest score -80, not the doc's generic -20. Fixtures preserve the C rather than correcting its strategy.
- The AI damage formula omits Wonder Room, Water/Mud Sport and the four Ruin ability modifiers. These omissions
  are tested separately; they are not additional differences among the 95 comparison cases above.

## Checks

`check.py` [baseline.json]: reference integrity (species, trainer teams, area rows), the Starter area, Trainers / Walkthrough
box names and trainer references, unique stop keys, no checklist steps, the Items box set and row sub-headings; given an
earlier data.json, that species order, move / ability tables, area names, trainer keys and stop keys are kept. Then
`python assemble.py hardlove-gold`, `tools/domcompare.mjs` against the previous build, and the viewer-size checks
(CLAUDE.md). Known from the build report: sprites missing or borrowed: bounsweet, mega_golisopod (base sprite).

## History

- **2026-11-01, 0.8.7.** Pinned `4a8d4a6308` (2026-11-01 08:16 UTC "27/25% for ai", the only commit after 0.8.6 and the one that sets the in-game version text to 0.8.7; the patch went up 2026-11-01 01:21 Drive time; no changelog was found, so this is from the commit). Game changes in the data: Growlithe -> Hisuian Arcanine at level 48 (was 51); Kubfu -> Urshifu now personality form A (both evolutions were form B); Hisuian Sliggoo's level-up moves replaced (Tackle, Bubble, Dragon Breath 5, Life Dew 10, Smart Strike 16 ... Dragon Pulse 55); nine trainer sets now match the sheet (Thom & Kae's Lucario Inner Focus, Grunt #6's Machamp Fire Punch, Deandre's Avalugg Earthquake, Grunt #24's Mew Liquidation, Grunt #25's Greninja Hasty / Liquidation, Night Slash, Gunk Shot and Meowstic Psychic), Fisherman Andre now a double battle in the game (the guide already tagged him Double from the sheet), two trainers' dialogue. Sheet conflicts 65 -> 60. Move Changes sheet (2026-11-01) adds Alluring Voice "Flat 20% chance to confuse." (now a sheet note on the move; `Moves.c` is unchanged). AI doc (2026-11-01): kill / highest-damage odds 75 / 25, Future Sight +7, a Metronome entry. Counts (987 species, 783 moves, 284 abilities), M / AB order, trainer, stop, area and pickup keys unchanged; calc fixtures pass without a remap. Engine changes: Damage calc -> Engine changes.
- **2026-11-01, 0.8.6.** Pinned `4af49f7a8c` (beta_hardlove head, 2026-10-30 "move ai struct to heap"; the patch is dated 2026-10-30; changelog: AI stack-overflow crashes, a double-faint crash, early game trainers). Game changes in the data: early game trainers (through Morty) reworked: new team members for Benny (Butterfree), Ian (Seviper), Irwin (Maushold), Dirk (Solrock), Krise (Dedenne), Victoria (Mr. Rime), Martha (Scrafty), Falkner's Quaxly now Quaxwell, and moves, natures, items and levels changed on about 20 more early sets plus a few later ones (Randall's Bronzong, Carol's Hariyama, Grunt #34's Dragonite, which now match the sheet); First Impression 100 -> 90. Butterfree and Quaxwell join the data as trainer-only species and Quaxly leaves it (987 species); because the M / AB tables are in first-use order, move and ability indices shifted, so the calc fixtures (`calc_states.json`, `calc_matchups.json`) were remapped by name, and `check.py` with the 0.8.5 baseline stops at its species / table-order asserts by design (saved state stores names). Trainer, stop and area keys unchanged (8 early trainers matched on id with their new teams). Sheet conflicts 64 -> 65 (the Trainer Battles sheet was edited again on 2026-11-01, ahead of the code: Whirl Islands Grunts #24 / #25).
- **2026-10-29, 0.8.5.** Pinned `64838bf7db` (beta_hardlove head, 2026-10-26; the patch is dated 2026-10-27). Game changes in the data: Tauros learnset (Body Slam 40, Raging Bull 48, Close Combat 55) and the new move Raging Bull (783 moves; it is inserted at guide index 767, so later move indices moved by one: the calc's source fixtures were remapped by name); Ice Path now matches the game (ten stale-sheet warnings gone), Safari Mountain Tauros instead of Furret; Mike's Gouging Fire Protosynthesis; four new sheet conflicts (61 -> 64). Counts, area, item, trainer and stop keys unchanged. The engine changes (Emergency Exit, Eject Pack, hazards + berries, Pastel Veil, Rage Powder, Pluck) are noted under Damage calc; no profile change.

- **2026-10-26, 0.8.4 and one build.** Pinned 0.8.4 = `ee4518c149` ("add soak tm"; the patch went up 2026-10-24 20:55
  UTC; the next commit, "version", is after it). Game changes in the data: TM47 Soak (was Steel Wing; Ilex Forest; learned by 155
  species and forms), Trainers.c (the 0.8.3 sets now come from the source, no patch). The AI doc is now Markdown and
  rewritten for 0.8.4; the Post-KO sheet gained a row. A raw rebuild used to differ from the published data (0.8.2
  `.src`, older trainer sheet), which looked like drift; now the raw build reproduces it: the duplicate Will / Koga rule,
  the Lunge and Pure Power sheet rules, and a Safari check against the game (Marshland Surf / Fishing swapped back,
  Mountain Furret). `--published` removed; build.py checks the pin. The Locations sheet (2026-10-25) already has some
  post-0.8.4 changes (Tauros forms); the game check keeps 0.8.4's.

- **2026-10-24, Charcoal reads `Also:`.** The Azalea Cutters' Charcoal (after Bugsy and getting Cut) was a `Found:` line, so
  it looked like it lay on the ground; it is a reward. `itemstd.RULES['hardlove-gold']['also']` relabels it (Items and the
  walkthrough stop); `_ALSO` also knows "after <Leader> and getting/beating".

- **2026-10-24, Starter box first.** `locs.starter` writes `ARO`: the Starter area first on the Locations page, like the
  other guides (area indices unchanged). The Morty box lists its places in walkthrough order (Route 37, Ecruteak City
  Theater, Burned Tower, Route 38, Gym; shared finaliser `trainers_follow_walk`). Template, same day: a Trainers place's
  button shows its box's cap, `n/N | cap`.
- **2026-10-23, Items standard.** `tools/itemstd.py` (shared, idempotent; run by `finalise()`) puts Items in the shared
  box set (rules: `itemstd.RULES['hardlove-gold']`, the `Other` box mapped in `HG_OTHER`). Held Items classes renamed (Type
  boosting -> Type boosters, Battle -> Battle gear, Consumable -> One-use items); the four evolution items (Metal Coat,
  King's Rock, Razor Claw, Razor Fang) stay in Evolution Items only; `Other` split: 8 Key Items, 6 Valuables (Master
  Ball, Big Nugget, Rage Candy Bar, Escape Rope), 3 Useful NPCs (texts hand-written in `HG_OTHER`). TMs + HMs one box in
  game order. Prose places became Found / Also / Shop lines (`Sold at` = Shop; given by / gift / from the X / reward =
  Also; else Found); `Starter:` and `Possible to miss permanently` stay last.
- **2026-10-23, Part B (consistency pass).** The Starter area is appended as area 61 and location 95, never inserted
  before existing entries; New Bark Town keeps every other encounter. Published species IDs and order, all 61 original
  area indices and 95 location indices, trainer keys and teams, cap lists, item data, walkthrough split / stop indices and
  checklist contents are unchanged; the existing pruning of unobtainable / unused species is untouched. Walkthrough split
  labels use `[Cap N]` through `tools/splits.py`. All `hack.json` storage keys unchanged; failed / cleared New Bark
  encounters are not mistaken for the starter, and the named starter picker writes only the new slot. Checked: the
  finaliser reproduces the data byte for byte from its parent commit and is idempotent; 986 species, 329 trainer keys, 18
  splits / 94 stops preserved; full DOM sweeps of 2,481 routes per mode with no page errors; consistency check (five
  viewer sizes, light theme), `pagecheck` / `walkcheck` at 260x316; browser migration tests with caught / failed /
  unchosen baseline state.
- **2026-10-19, 0.8.3 patch.** `8ac661afda..f1b2363001` changes only `data/Trainers.c` among the source files, so these
  sets were patched into the data (not a full rebuild; the sheet, updated the same day, matches them and their old "sheet
  says" notes were dropped): Elite Four Lance Aerodactyl Psychic Fangs > Crunch; Karen Gholdengo Nasty Plot > Night
  Shade; Red Greninja-Ash Hydro Pump, Dark Pulse, Grass Knot > Liquidation, Night Slash, Low Kick; Will (702)
  Farigiraf Energy Ball > Dazzling Gleam, Solgaleo Rock Slide > Close Combat; Koga (703) Landorus-T Lv 82 > 81,
  Dragalge removed, Darkrai to slot 5, Weavile (Lv 82 Jolly Ice Gem Inner Focus; Icicle Crash, Knock Off, Fake Out,
  Protect) in slot 6.
- **2026-10-19, sheet recheck.** Trainer Battles re-downloaded: it now matches Bug Catcher Josh's Charjabug and Hiker
  Michael's Medicham (notes dropped); the other ~60 differences remain and the game sets stay (Trainers.c is what the ROM
  uses; a calc import of the 0.8.3 ROM confirms Will's Slowbro has Psychic, not the sheet's Future Sight). The builder
  and these notes moved out of the guide's top comment into `extract/` and this file.
- **2026-10-18, first build** for 0.8.2 (claude.ai), replacing the dex-site based guide: species data from the hack
  source, Locations sheet checked against `Encounters.c`, trainer sets from `Trainers.c`, Starter choice added (the
  earlier build missed it, so Froakie, Greninja and Mega Greninja showed as trainer-only).
