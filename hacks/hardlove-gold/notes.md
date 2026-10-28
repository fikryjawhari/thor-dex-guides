# Hardlove Gold build notes

Hardlove Gold 0.8.5, an hg-engine hack of Pokémon HeartGold. Built from the hack's own source code (the authority) and
its sheets. 986 species and forms (596 obtainable, 74 Megas, 316 trainer-only), 783 moves, 284 abilities, 62 tracker
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

0. **The hack's source**: github.com/kumakuma1/hardlove, branch `beta_hardlove`, pinned at 0.8.5 `64838bf7db`
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

## Local storage (prefix hg)

`hgdex4` list filters, `hgcalc:<id>` + `hgcalc:lastlv` stat calc, `hgtrack` tracker {s starter, e {areaIdx: {p: id} or
{f: 1}}, t {"area|For X": id}}, `hgwalk2` walkthrough open state (EI's shape), `hgcap2` level cap per trainer (+ _last),
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

#### Engine changes in 0.8.5 the calc does not model

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
the guide's data now comes from `64838bf7db` (0.8.5): recheck a traced battle file against it when its rule matters.
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

`extract/hgengine.py` → `move_flags()` starts `MV.f` with pinned Showdown Gen 9 flags, then takes **contact**
from the hack's `data/Moves.c`. Source removes standard contact from Sunsteel Strike, Collision Course,
Electro Drift, Thunderous Kick and Behemoth Blade. Source-specific additions: Growl's punch flag and slicing on
Crush Claw, Dire Claw, Dragon Claw, Metal Claw and Shadow Claw.
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

## Checks

`check.py` [baseline.json]: reference integrity (species, trainer teams, area rows), the Starter area, Trainers / Walkthrough
box names and trainer references, unique stop keys, no checklist steps, the Items box set and row sub-headings; given an
earlier data.json, that species order, move / ability tables, area names, trainer keys and stop keys are kept. Then
`python assemble.py hardlove-gold`, `tools/domcompare.mjs` against the previous build, and the viewer-size checks
(CLAUDE.md). Known from the build report: sprites missing or borrowed: bounsweet, mega_golisopod (base sprite).

## History

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
