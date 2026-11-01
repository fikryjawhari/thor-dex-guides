# Pokémon Radical Red build notes

Scaffold only, based on `unbound`. Feature switches need review.

## Build

`uv run python -I hacks/radical-red/extract/build.py`

TODO: implement extract modules; audit inherited cfg switches and cfg.txt wording.

## Sources and rules

TODO: document sources and rules.

### Damage calc

Unit 2 (rounds 1-3, sessions `rr-calc` / `rr-calc3`, 2026-11-02). Profile: `hack.json` → `cfg.calc`; fixtures:
`tools/calc/radical-red_check.mjs` (synthetic Mew data, no `data.json` needed; part of `npm test --prefix tools/calc`).

**Sources** (paths under `.src/`): RR Showdown `repos/pokemon-showdown` @ `54955790` (`data/mods/gen9rr/*.ts`,
"Showdown" below), RR calc `repos/damage-calc` @ `7f354003` (`calc/src/mechanics/gen789.ts`, `util.ts`: the oracle,
"RR calc" below), the official dex `repos/Radical-Red-Pokedex/data.js` (what exists in 4.1), the changelogs in
`drive/` and the Hardcore sheet's Main tab (`trainers-hardcore.xlsx`). hzla's `radredhc` backup
(`repos/Dynamic-Calc-Decomps/backups/title_to_backup_mappings.js:40`) was not run. Showdown entries that are not in
4.1's `data.js` (13 abilities such as Vocalizer / Jump Scare, Council Orb) and Megas 4.1 doesn't have (Duraludon:
removed, 4.1 changelog line 14; Grimmsnarl: the Grimmsnite item exists but no Mega form) are left out. Where RR calc
and Showdown disagree, the game's own description decides (Draco Barrage).

**Base**: `cfru` (Gen 8 damage, Gen 6+ type chart: `data.js` types match it exactly), Megas and Z-moves on,
statuses restated with `frz` labelled Frostbite. Field: the `cfru` controls, Snow instead of Hail, plus two toggles
(Illusion intact; First turn out for Bull Rush / Quill Rush). `setterStays: true`: Hardcore Main!E10 makes every
AI-set weather and terrain permanent, so a departing setter leaves its layer (the player's own setters follow the same
switch; in the game theirs last 5 turns, which the calc does not count). Bosses' own permanent fields come from unit 6's
trainer `field` records. Player EVs: Main!E95 turns on Minimal Grinding (no player EVs) and bosses have none except
Ghost Marowak (252 HP). As in Photonic Sun's EV-less play, EVs stay on (`cfg.evs`, `cfg.calc.evs`): player sets
default to 0 and a trainer's EVs count. Names: the profile uses the official names `tools/cfru.py` gives (unit 1) and
also the raw `data.js` spellings (WaterCompaction, Bone Zone with its trailing space, Neutralize Gas, Inferno Parade,
...), harmless once the names are standard. Move effects sit in `over.effects` in `hack.json` until `data.json`
exists (`effects_check.mjs` loads a guide's `data.json` for `calc_effects.json`); the finishing unit moves them there.

**Engine change** (the only one, authorised by the main chat): `over.abilities[name].statusImmune` (status keys whose
end-of-turn chip the ability stops; `tools/calc/README.md` → Engine overrides; `test.mjs` "optional ability status
immunity"). Profiles without it behave as before (regression sweep below).

**Inventory** (everything 4.1 adds or changes that bears on damage, Speed or the fight log; counts below):

| Group | Done by the profile (source; each has a fixture in radical-red_check) |
| --- | --- |
| Status-chip abilities | Toxic Boost (no psn / tox chip), Flare Boost (no burn chip): native boost + `statusImmune` (changes v3.1:46,49; Showdown abilities.ts:240,691) |
| Power abilities | Iron Fist 1.3x, not Wicked Blow; Striker 1.3x kicks; Illusion 1.3x while intact; Reckless incl. the Explosion family; Liquid Voice 1.2x; Rivalry 1.25x same gender, no penalty; Sharpness through RR's slicing flags (RR calc gen789.ts:1093,1130-1167; Showdown abilities.ts:324-353,533-555) |
| Attack abilities | Feline Prowess 2x SpA; Sage Power 1.5x SpA; Bull / Quill Rush 1.2x Atk on the first turn; Defeatist at 1/3 HP; Solar Power with no sun chip; Flower Gift: Cherrim's own Atk in Sun only, no SpD / ally boost (gen789.ts:1294-1349,1404; Showdown abilities.ts:93,170,230,251,556,665) |
| Type / final abilities | Corrosion (Poison hits Steel), Mountaineer (Rock immune), Water Compaction (Water halved), Fatal Precision 1.2x SE, Primal Armor 0.5x SE (Mold Breaker doesn't bypass it), Bone Zone (bone moves ignore immunity, 2x when resisted), Blubber Defense = Multiscale, Cash Splash = Water Bubble, Mold Breaker's exceptions (gen789.ts:134-165,299,1027,1355,1638,1646,1677; Showdown abilities.ts:60-152,364,457,716) |
| Other abilities | ORAORAORAORA! half-power second punch; Blazing Soul +1 Fire priority at full HP; Self Sufficient 1/16 heal; Bad Company no recoil (= Rock Head); Frozen Mist = Shield Dust, Valiant Shield = Dauntless Shield; Electromrphosis / Neutralize Gas / Wandering Soul = their official names (gen789.ts:588,1571; Showdown abilities.ts:2,51,381,638) |
| Statuses / weather | Frostbite: special damage halved (not Facade), 1/16 chip, Facade 2x; Snow: Ice Def 1.5x, no chip (changelog to v4.0:14; gen789.ts:553,992,1460; util.ts:540) |
| Moves (76 entries) | RR flags (kick, slicing, bullet, pulse, bone, punch; 41 moves); crit ratios (Drill Peck, Razor Shell, Snipe Shot, Zippy Zap); recoil (Volt Tackle 1/4, Chloroblast 1/2, Draco Barrage 1/3); Beat Up flat 25; Triple Kick 20 × hit; Shell Side Arm Special and ability-ignoring; the Explosion family halves Defense; Raging Bull / Multi-Attack take the user's first type; Sonic Slash 80 / 120 / 140 by speed ratio; Bitter Malice / Barb Barrage / Infernal Parade 2x on a status; Draco Barrage hits Fairy and turns Physical when boosted Atk > SpA; changed effects (Acupressure, Muddy Water, Octazooka, Ice Hammer, Razor Shell, Shell Side Arm, Charge Beam 100% SpA +1) (Showdown gen9rr/moves.ts; gen789.ts:211,741-763; util.ts:167) |
| Hardcore rules | Rapid Spin: no Speed boost (Main!E28); Ice Spinner / Steel Roller / Splintered Stormshards leave terrain (Main!E12); permanent AI fields (Main!E10, `setterStays`) |
| Items | Gems 1.5x (all 18); Electirizer (Electivire's Fighting 1.5x), Burnt Seed (Sunflora's Fire 1.5x); Leek Stick +1 / +2 crit (Farfetch'd / Sirfetch'd); fling powers (Adamant Orb, Reaper Cloth, Leek Stick, Link Cable, Honey); 15 RR Mega Stones as Smogon's `{base: mega}` records, so Knock Off isn't boosted against them (Applite serves Flapple and Appletun; the old string form let it boost) (gen789.ts:1193-1199; Showdown items.ts:133,244,902-1168) |

Done by the base with no entry: Protean / Libero (every move), Intrepid Sword / Dauntless Shield (every entry: the
calc's entry toggle), Tera Shell, Protosynthesis, As One, Sharpness (1.5x; RR's slicing list is the profile's
flags), Shield Dust (secondaries; hazards below), Adamant Orb (base Dialga only; it turns Primal on entry),
Thick Club, plates / Z-crystals, the type chart, crits.

Labels only (no damage effect in the calc): Battle Bond, Emergency Exit, Forecast, Ice Body, Illuminate, Phoenix
Down, Pressure, Schooling, Truant, Zen Mode, Alchemic Power; Reaper Cloth / BrightPowder / Lax Incense accuracy,
King's Rock; secondary chances under 100% (Frost Breath's 30% frostbite, Bleakwind Storm, Head Charge, Rock Slide,
accuracy drops); Frenzy Plant / Blast Burn / Hydro Cannon / Meteor Assault skipping the recharge after a KO.

Not modelled (the engine has no hook; in-game numbers can differ):
- Speed: Quick Feet 2x (stock 1.5x), Flower Gift / Bull Rush / Quill Rush Speed 1.5x, Upgrade (Porygon-Z 1.5x),
  Leek Stick (Farfetch'd 1.5x). The calc's Speed readout and speed-based powers (Sonic Slash, Electro Ball, Gyro
  Ball) miss them: no rule phase reaches the speed chain.
- Shield Dust / Frozen Mist entry-hazard immunity (`entry()` still shows hazard chip).
- Bad Company's block on self-lowered stats and Mind Blown recoil (only the recoil part is aliased).
- Soul Robbery stealing boosts (the engine's theft is Spectral Thief's by name; aliasing would share its record).
- Defog clearing terrain (Main!E12 says it doesn't; the shared `defog` kind clears it from Gen 8).
- Magmarizer (Magmortar's Fire moves add Tar Shot), the Gulp Missile / Parasitic Waste changes, Sage Power's move
  lock, Protosynthesis staying on while Sun is suppressed.
- Draco Barrage recoil: Showdown's 1/3 (used); RR calc's 33/100 is at most 1 HP apart.

Counts: abilities 54 (32 profile, 8 base, 11 labels only, 3 not modelled); moves 76 profile entries (the other
gen9rr move entries only change availability, power / type / accuracy, which `data.js` supplies, or chances under
100%); held items: 18 gems, 15 Mega Stones and 7 other changed items in the profile (Electirizer, Burnt Seed, Leek
Stick, Adamant Orb, Reaper Cloth, Link Cable, Honey), 2 not modelled (Magmarizer, Upgrade), plus the Hardcore rules.

**Checks** (2026-11-02, round 3): `node tools/calc/radical-red_check.mjs` 71 passed, 0 failed. Regression sweep:
every check `npm test --prefix tools/calc` runs, here and in a worktree at `3400658`: the same results line for line
except `test.mjs` 147 → 148 (the `statusImmune` test) and this check (skip → 71); all exit 0. Logs:
`.tmp/rr-calc3/sweep-base/`, `.tmp/rr-calc3/sweep-head/`. Not run: the hzla comparison, browser checks, the gate.

#### Open in-game checks
- Toxic Boost Zangoose poisoned and Flare Boost Drifblim burned take no chip, and still lose 1/16 to Sand.
- Ghost Marowak's HP with 252 HP EVs; other boss sets at 0 EVs.
- Draco Barrage turns Physical when the user's Atk is higher (dex text; RR calc keeps it Special) and hits Fairy.
- Flower Gift Cherrim: Atk 1.5x in Sun, no SpD boost; Quick Feet Speed (2x per Showdown).
- Defog with terrain up (Main!E12: the terrain stays; the calc's fight log clears it).
- A Shield Dust / Frozen Mist holder on Stealth Rock: no chip expected.
- Knock Off on a Mega Stone holder of the right species: no 1.5x.

## Local storage

Prefix `rr`. Keep these keys once published.

- `dex`: `rrdex`
- `calc`: `rrcalc`
- `track`: `rrtrack`
- `walk`: `rrwalk`
- `cap`: `rrcap`
- `tr`: `rrtr`
- `recent`: `rrrecent`
- `pos`: `rrpos`
- `mgm`: `rrmgm`
- `loc`: `rrloc`
- `items`: `rritems`
- `dmg`: `rrdmg`

## Hack-only data

TODO: document hack-only data.

## Checks

`uv run python -I tools/gate.py check radical-red`

TODO: replace extract/check.py and calc stubs with source-backed assertions. Calc remains disabled.
Before enabling it, replace the null in tools/scenarios/calc-doubles.mjs EXPECTED with an audited count and add
tools/trainer_fields_check.py DOUBLES_EXPECTED (DOUBLES_PARTNER_ONLY if needed). The engine stub is registered
in tools/calc/package.json; review tools/calc/test.mjs field-profile fixtures. Never copy another hack's counts.
Review tools/itemstd.py RULES only for source-backed quirks; shared defaults need no entry.
Fill sources/watch.json, version/mode, GID/save reader and sprite additions by hand.

## History

TODO: document history.
