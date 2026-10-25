# Calc refine: Hardlove Gold survey (S1)

Survey only. Written by the S1 agent; not committed. Sources: `hacks/hardlove-gold/data.json` MV.h (218 move notes, dumped to `.tmp/calc-refine/S1-notes.txt`); `hacks/hardlove-gold/.src/Move Changes.xlsx` (sheet 'Move Changes': 175 changed rows, and the effect side table with 13 rows, dumped to `.tmp/calc-refine/S1-xlsx.txt`); game source `.tmp/calc-hardlove-gold/source/`.

Counts: 223 changed moves after merging name variants (Precicipe/Precipice, Sand-Attack/Sand Attack, Make it/Make It). data 210, damage effect 10, out of scope 3. The data count includes moves whose effect chance also changed (Charge Beam, Mud Bomb, Mirror Shot, Octazooka, Leaf Tornado, Night Daze, Smog, Make It Rain): those secondary parts are out of scope.

Source file:line refs are from grep; line numbers are for `.tmp/calc-hardlove-gold/source/src/`, relative to that tree.

## Unit F: move flags

Completed 2026-10-25 on `worktree-damage-calc`. Authority is the guide's 0.8.3 pin
`f1b236300187a2b18bf1a0b5ee1f80b3a2fed57b`, never the 0.8.4 importer or hzla. Battle files already cached under
`.tmp/calc-hardlove-gold/source/`; additional pinned `src/battle/battle_pokemon.c` and `data/Moves.c` fetched into
`.tmp/calc-refine/F-battle_pokemon.c` and `F-Moves.c`. The raw `.src/repos/hardlove/COMMIT` is actually
`8ac661afdaba3c9bc60d39c1f0cc22a8a5ad63c8` (older raw inputs), so those inputs were not mistaken for the 0.8.3 pin.

### Source versus pre-unit MV.f

Names below are guide display names, restricted to moves present in this guide. No class is assumed to have no
source list: all seven were located, either as explicit move tables or as an effect-code selector.

| Class | Source evidence (paths relative to pinned source) | Source has, MV.f lacked | MV.f had, source lacks |
| --- | --- | --- | --- |
| Punch | `src/battle/other_battle_calculators.c:422-448`, `src/individual/CalcBaseDamage.c:685-688` | Growl | None |
| Bite | `src/battle/other_battle_calculators.c:450-461`, `src/individual/CalcBaseDamage.c:766-769` | None | None |
| Pulse | `src/battle/other_battle_calculators.c:463-471`, `src/individual/CalcBaseDamage.c:773-776` | None | None |
| Sound | `src/battle/battle_pokemon.c:1229-1264,1302,1338-1340`; Punk Rock: `src/individual/CalcBaseDamage.c:794` | None | None |
| Slicing | `src/battle/other_battle_calculators.c:473-505`, `src/individual/CalcBaseDamage.c:780-783` | Crush Claw, Dire Claw, Dragon Claw, Metal Claw, Shadow Claw | None |
| Recoil / crash (Reckless) | `src/individual/CalcBaseDamage.c:691-701`, joined to pinned `data/Moves.c` effect codes | All 17 listed below (not represented by MV.f) | None |
| Secondary-effect (Sheer Force) | `src/battle/battle_script_commands.c:1039-1130`, joined to pinned `data/Moves.c` effect codes and six explicit move exceptions | All 167 listed below (not represented by MV.f) | None |

Recoil source members absent from literal `MV.f`: Axe Kick, Brave Bird, Chloroblast, Double-Edge, Flare Blitz, Head Charge, Head Smash, High Jump Kick, Jump Kick, Light of Ruin, Submission, Supercell Slam, Take Down, Volt Tackle, Wave Crash, Wild Charge, Wood Hammer.

Secondary-effect source members absent from literal `MV.f`: Acid, Acid Spray, Air Slash, Anchor Shot, Ancient Power, Apple Acid, Aqua Step, Astonish, Aurora Beam, Bite, Bitter Malice, Blaze Kick, Blizzard, Blue Flare, Body Slam, Bolt Strike, Bone Club, Breaking Swipe, Bubble, Bubble Beam, Bug Buzz, Bulldoze, Burning Jealousy, Ceaseless Edge, Charge Beam, Chatter, Chilling Water, Confusion, Constrict, Cross Poison, Crunch, Crush Claw, Dark Pulse, Discharge, Dizzy Punch, Dragon Breath, Dragon Rush, Drum Beating, Dynamic Punch, Earth Power, Electro Shot, Electroweb, Ember, Energy Ball, Extrasensory, Fake Out, Fiery Dance, Fire Blast, Fire Fang, Fire Lash, Fire Punch, Flame Charge, Flame Wheel, Flamethrower, Flare Blitz, Flash Cannon, Floaty Fall, Focus Blast, Force Palm, Freeze-Dry, Glaciate, Grav Apple, Gunk Shot, Headbutt, Heart Stamp, Heat Wave, Hurricane, Hyper Fang, Ice Beam, Ice Fang, Ice Punch, Icicle Crash, Icy Wind, Inferno, Iron Head, Iron Tail, Lava Plume, Leaf Tornado, Lick, Liquidation, Low Sweep, Lumina Crash, Lunge, Luster Purge, Metal Claw, Meteor Mash, Mirror Shot, Mist Ball, Moonblast, Mountain Gale, Mud Bomb, Mud Shot, Mud-Slap, Muddy Water, Mystical Fire, Mystical Power, Needle Arm, Night Daze, Nuzzle, Octazooka, Ominous Wind, Play Rough, Poison Fang, Poison Jab, Poison Sting, Poison Tail, Pounce, Powder Snow, Power-Up Punch, Psybeam, Psychic, Psychic Noise, Psyshield Bash, Pyro Ball, Razor Shell, Rock Climb, Rock Slide, Rock Smash, Rock Tomb, Rolling Kick, Sacred Fire, Scald, Scorching Sands, Searing Shot, Seed Flare, Shadow Ball, Shadow Bone, Signal Beam, Silver Wind, Skitter Smack, Sludge, Sludge Bomb, Sludge Wave, Smog, Snarl, Spark, Sparkling Aria, Spirit Break, Spirit Shackle, Splishy Splash, Steam Eruption, Steamroller, Steel Wing, Stomp, Stone Axe, Strange Steam, Struggle Bug, Thousand Waves, Throat Chop, Thunder, Thunder Fang, Thunder Punch, Thunder Shock, Thunderbolt, Thunderous Kick, Torch Song, Trailblaze, Tri Attack, Trop Kick, Twineedle, Twister, Volt Tackle, Water Pulse, Waterfall, Zap Cannon, Zen Headbutt, Zing Zap.

The explicit source tables have 25 punch, 10 bite, 7 pulse, 31 slicing and 33 sound entries. Their exported guide
intersections are 25/10/7/30/32 after the fix. `MOVE_KOWTOW_CLEAVE` (slicing) and
`MOVE_CLANGOROUS_SOULBLAZE` (sound; source display name `Soulblaze`) are not in guide M, not missing flags on an
exported move. Growl is genuinely in PunchingMoveTable: its comment says it replaces Double Shock; it remains
status-only and gets no damage or extra power. The existing Gen 9 flags already matched all other explicit members.

### Implemented and hand checks

`hgengine.move_flags()` restores Growl's `punch` and those five claws' `slicing`, in addition to the prior contact
corrections. Grepping all Python callers finds only Hardlove's `extract/dex.py:428`; no other guide uses this helper,
so no other hack requires a rebuild. No shared engine/template changes and no cfg.calc changes.

The existing published rebuild path is required to preserve guide 0.8.3's trainer/walkthrough corrections. The
replay driver `.tmp/calc-refine/F-rebuild.py` applies this helper to the published MV against pinned Moves.c, then
calls `extract/build.py`'s `published()` path. It changes exactly six MV.f entries and the build date; every other
data key, move ID/order, stat, power, description, team and field compares equal. Normal future raw builds call the
same helper via `dex.movetable`. `python assemble.py hardlove-gold` regenerates the self-contained guide.

Fixtures added (Serious, level 50, IVs 31, no EVs/items; Snorlax Attack 130, Blastoise Defense 120):
- `source-slicing-crush-claw-sharpness`: source Sharpness x1.5 changes BP 75 to 112 (half down).
  Base `floor(floor(22*112*130/120)/50)+2 = 55`; after random 85..100 and Normal STAB (half down),
  rolls `[69,70,70,72,72,73,75,75,76,76,78,78,79,79,81,82]`.
- `source-slicing-crush-claw-no-ability`: BP 75, base 37, same random/STAB:
  `[46,46,48,48,48,49,49,51,51,51,52,52,52,54,54,55]`.
- `source-punch-fire-punch-iron-fist`: source Iron Fist x1.2 changes BP 75 to 90, base 44, no STAB, Water resistance:
  `[18,18,19,19,19,19,20,20,20,20,20,21,21,21,21,22]`. Growl cannot be a damage fixture because the engine
  correctly returns null for status moves; a separate direct check verifies both its restored punch flag and null.

The five full exported class memberships and all three roll arrays were independently asserted by
`.tmp/calc-refine/F-verify.py` (not computed by the engine under test). Growl's status boundary is asserted by
`.tmp/calc-refine/F-status.mjs`. These checks do not constitute an independent ROM oracle.

### Needs Opus

Done by the orchestrator (2026-10-25): both rows below are `over.rules` `powerMods` rules in hack.json (Reckless
append 4915 on Chloroblast; Sheer Force append 5325 on the three source-only moves, remove 5325 on the 21 stock-only
ones), fixtures `source-sheer-force-thousand-waves`, `source-sheer-force-bounce-not-boosted`, `source-reckless-chloroblast`
(`hardlove_check.mjs` reference now takes `reference.ability`).

- **Reckless / recoil metadata:** `MV.f` cannot implement this selector. `tools/calc/src/adapter.js:104-110` maps
  MV.f only into `move.flags`, whereas native Gen 9 Reckless reads `move.recoil || move.hasCrashDamage`
  (`@smogon/calc/dist/mechanics/gen789.js:895`). Effective Gen 9 membership agrees for 16 of the 17 source moves;
  **Chloroblast** is missing (source includes `MOVE_EFFECT_RECOIL_HALF_MAX_HP`, native metadata instead uses
  `mindBlownRecoil`). Reverse difference: none. Requires a profile/engine metadata decision beyond `move_flags()`;
  left on existing Gen 9 metadata, not given an inert fake recoil flag.
- **Sheer Force / secondary metadata:** source selector is the effect-code switch and six move exceptions at
  `src/battle/battle_script_commands.c:1055-1130`; Gen 9 native reads `move.secondaries` and hard-codes Electro Shot
  / Order Up (`@smogon/calc/dist/mechanics/gen789.js:862-863`), not `move.flags`. Effective source-only members:
  **Floaty Fall, Splishy Splash, Thousand Waves**. Effective Gen 9-only members: Rapid Spin, Secret Power, Snore, Sky Attack, Alluring Voice, Bounce, Upper Hand, Barb Barrage, Relic Song, Diamond Storm, Double Iron Bash, Aura Wheel, Axe Kick, Salt Cure, Mortal Spin, Order Up, Matcha Gotcha, Eerie Spell, Esper Wing, Infernal Parade, Dire Claw.
  These differences are not fixed by adding a secondary flag to MV.f. Some require suppressing native hard-coded
  handling (Order Up); decide profile metadata overrides / engine support as a separate owned unit. Existing Gen 9
  behaviour remains, explicitly provisional. Full selector/diff is `.tmp/calc-refine/F-diff.json`; no hzla run.

### Validation

- `npm test --prefix tools/calc`: pass (85 engine tests / 41 direct parity cases; EI 109 fixtures, Hardlove 69
  source/stock checks, Photonic 111 and Eternal X 109 fixtures). Log `.tmp/calc-refine/F-tests.log`.
- `node tools/calc/hardlove_check.mjs`: 69 passed, 0 failed. Log `.tmp/calc-refine/F-hardlove.log`.
- `python -I tools/datajson.py hacks/hardlove-gold/hack.json`: exit 0, unchanged configuration.
  Log `.tmp/calc-refine/F-datajson.log`.
- `python assemble.py hardlove-gold`: pass, 2.85 MB, 986 species and shared sprites.
  Log `.tmp/calc-refine/F-assemble.log`.
- Source-table parity, data-boundary and hand-roll assertions: 9 passed (`F-verify.log`); Growl status assertion:
  passed (`F-status.log`), all under `.tmp/calc-refine/`. `git diff --check` on the five owned files: pass.

## Damage-effect moves

### Batch 1

- [x] **Hidden Power**: Type from the user's IVs (not fixed); BP fixed at 60 (data bp is 60). BP 60 settled [x]; type-from-IVs open: Needs Opus. Source: `other_battle_calculators.c:2631 (type by IVs), 3277; CalcBaseDamage.c:361-362 (movepower = 60)`
- [x] **Explosion**: Needs Opus (halving); fixture `explosion-defense-not-halved` pins the current, source-supported behaviour. Halves target's Defense in the damage calc (side table); faints user (data). Source: `not located: MOVE_EXPLOSION absent from CalcBaseDamage.c. Partial: other_battle_calculators.c:233 (list), BeforeMove.c:2234 (Damp only)`
- [x] **Self-Destruct**: Needs Opus (same as Explosion); fixture `self-destruct-defense-not-halved`. Halves target's Defense in the damage calc (side table). Source: `not located as Explosion. Partial: other_battle_calculators.c:232 (list), BeforeMove.c:2233 (Damp only)`
- [x] **Misty Explosion**: Needs Opus (halving only; terrain x1.5 settled [x], fixtures `misty-explosion-*`). Halves target's Defense in the damage calc (side table); power 100 > 200 is data. Source: `CalcBaseDamage.c:492-494 (terrain x1.5 case); BeforeMove.c:2236 (Damp); defense halving not located`
- [x] **Thunder Wave**: out of scope (status-only, orchestrator answer); no fixtures. Original: Electric-type users cannot miss with it (accuracy bypass rule). Source: `other_battle_calculators.c:2705-2706 (electric user, hit check); BeforeMove.c:2854, 2867 (immunity line)`
- [x] **Frustration**: Power = (255 - happiness) x 10 / 25, max 102 (data bp 102 is the cap). Source: `CalcBaseDamage.c:214-215`. Outcome: varpow already lists it; typed power drives the roll; fixtures `frustration-happiness-127`, `frustration-happiness-0`.
- [x] **Return**: Power = happiness x 10 / 25, max 102 (data bp 102 is the cap). Source: `CalcBaseDamage.c:211-212`. Outcome: varpow already lists it; fixture `return-happiness-127`.
- [x] **Rage Fist**: outcome: flat data power 100, the sheet/notes stand (no hit-taken counter in source). Fixtures `rage-fist-flat-100`, `rage-fist-normal-target-immune`. Original text: Sheet and notes say 'Does not increase BP when being hit' (power 50 > 100 is data); data text says '+50 per hit taken, max 6'. Conflict: decide which the hack uses. Source: `other_battle_calculators.c:441 (PunchingMoveTable entry); hit counter not located`

### Batch 2

- [x] **Pain Split** (out of scope: HP averaging, no damage): Sheet: Power ?? > 1, Normal > Dark, Physical (game data 'varies'). Data has bp null and category Physical: the power rule is not in the engine. Source: `not located: no PAIN_SPLIT / painsplit in src/ or include/`
- [x] **Double Shock** (data and stock have no punch flag: no Iron Fist boost; the Electric-user rule is a usability check, not damage): Not a punching move (no Iron Fist boost); typeless, must be Electric (data flags already match: no 'punch' flag). Source: `other_battle_calculators.c:447 (removed from punch list, comment), BeforeMove.c:1890-1891 (typeToCheck Electric)`

## Data moves (nothing to do)

Absorb, Air Cutter, Air Slash, Anchor Shot, Apple Acid, Aqua Tail, Astonish, Autotomize, Baby-Doll Eyes, Baneful Bunker, Barrage, Barrier, Belch, Bind, Blaze Kick, Blizzard, Blue Flare, Bolt Beak, Bolt Strike, Bone Club, Bone Rush, Bonemerang, Bounce, Bubble, Captivate, Charge Beam, Charm, Circle Throw, Clamp, Clangorous Soul, Comet Punch, Confide, Covet, Crabhammer, Cross Chop, Cut, Dark Void, Diamond Storm, Double Hit, Double Slap, Draco Meteor, Dragon Hammer, Dragon Rush, Dragon Tail, Drill Run, Dual Chop, Dual Wingbeat, Eerie Impulse, Electroweb, Fake Out, Fake Tears, Feather Dance, Fire Fang, Fire Lash, Fire Spin, First Impression, Fishious Rend, Flash, Fleur Cannon, Fly, Flying Press, Focus Blast, Focus Energy, Freeze Shock, Frenzy Plant, Frost Breath, Fury Attack, Fury Swipes, Fusion Bolt, Gear Grind, Giga Impact, Glacial Lance, Glaciate, Glare, Grass Whistle, Grav Apple, Growl, Growth, Gunk Shot, Hail, Hammer Arm, Harden, Head Smash, Heat Wave, High Horsepower, Hurricane, Hydro Cannon, Hydro Pump, Hyper Beam, Hyper Drill, Hyper Fang, Hypnosis, Ice Burn, Ice Fang, Ice Hammer, Icicle Crash, Icy Wind, Infernal Parade, Iron Tail, Kinesis, Leaf Storm, Leaf Tornado, Leech Seed, Leer, Lick, Light Screen, Light of Ruin, Lovely Kiss, Magma Storm, Make It Rain, Mega Drain, Mega Kick, Mega Punch, Megahorn, Metal Claw, Metal Sound, Meteor Assault, Meteor Beam, Meteor Mash, Mirror Shot, Mountain Gale, Mud Bomb, Mud Shot, Muddy Water, Nature's Madness, Night Daze, Night Slash, Noble Roar, Obstruct, Octazooka, Origin Pulse, Overheat, Pin Missile, Play Nice, Play Rough, Poison Powder, Powder, Power Whip, Precipice Blades, Protect, Psycho Boost, Psyshield Bash, Purify, Rage Powder, Razor Leaf, Razor Shell, Reflect, Roar of Time, Rock Blast, Rock Climb, Rock Slide, Rock Throw, Rock Tomb, Rock Wrecker, Rolling Kick, Roost, Sacred Fire, Sand Attack, Sand Tomb, Sandstorm, Scale Shot, Screech, Seed Flare, Sheer Cold, Sing, Skitter Smack, Sky Attack, Sky Uppercut, Slam, Slash, Sleep Powder, Smog, Smokescreen, Snarl, Snipe Shot, Snowscape, Sonic Boom, Spacial Rend, Spiky Shield, Spin Out, Spirit Shackle, Steam Eruption, Steel Beam, Steel Wing, Stone Edge, Strange Steam, Strength Sap, Struggle Bug, Stun Spore, Submission, Super Fang, Supersonic, Swagger, Sweet Kiss, Tail Slap, Take Down, Tearful Look, Thunder, Thunder Cage, Thunder Fang, Tickle, Triple Dive, Trop Kick, Whirlpool, Wicked Blow, Wide Guard, Wish, Withdraw, Wrap, Zen Headbutt.

## Out-of-scope moves

Destiny Bond, Rock Smash, Thief (Rock Smash: effect chance; Thief/Covet steal rule is secondary, Covet itself is data; Destiny Bond: repeat use, not damage).

## Needs Opus

- Pain Split: no power rule found in source; decide whether the calc needs a Physical/variable-power entry or stays data-only.
- Explosion / Self-Destruct / Misty Explosion: target Defense halving location not found by grep; check CalcBaseDamage before writing the rule.
- Rage Fist: power doubling per hit taken; the hit counter location is not found.
- Thunder Wave: accuracy bypass for Electric users, whether the calc models accuracy at all (judgement).
- Unclassified: none. Parse artefacts: none found.

- Batch 1 (Explosion family, Hidden Power), hand-checked from `hardlove_check.mjs` (level 50, `base = floor(floor(22*BP*Atk/Def)/50)+2`):
  - Explosion / Self-Destruct / Misty Explosion: source has no Defense halving (`CalcBaseDamage.c` has no Explosion or
    Self-Destruct case; its only Explosion-family line is the Misty terrain case at 492-494; `BeforeMove.c:2233-2236` is Damp only).
    Gen 9 stock does not halve either (halving exists only in gen 1-4: `@smogon/calc` gen12.js:150, gen3.js:305, gen4.js:560). So the current calc
    does not halve, and the sheet and data note ("Halves target's defense") is a doc claim the code does not show.
    Decision needed: keep no halving (source wins), or add a Defense-halving rule for these three moves.
    Expected rolls if halved: Explosion (Snorlax, Atk 130 vs
    Blastoise Def 120 -> 60): base 240, rolls 306..360 (STAB); not halved: base 121, rolls 153..181. Misty Explosion
    (Alakazam SpA 155 vs SpD 125 -> 62): base 222, not halved 111. Self-Destruct (halved, Def 60): base 192.
  - Hidden Power: `other_battle_calculators.c:3277` derives the type from the six IV low bits. The engine takes the type
    from the user (`slot.t`); no phase derives a type from IVs. A rule shape for that is new: needs a decision on
    whether the calc takes IVs (it has no IV input today). Hand roll for a typed Fire Hidden Power (Alakazam SpA 155 vs
    Blastoise SpD 125, BP 60): base 34, rolls `floor(floor(34*r/100)/2)`; Normal-typed: `floor(34*r/100)`.

### Orchestrator answers
- Thunder Wave, Pain Split: status-only effects for the calc (accuracy, HP averaging); no damage rule. Tick them as
  out of scope, no fixtures. (Pain Split's "Physical, power ??" is a display quirk of the sheet.)
- Explosion / Self-Destruct / Misty Explosion: the Gen 4 base already halves Defense for Explosion / Self-Destruct
  if the stock gen4 mechanics do; the batch agent checks the stock behaviour with a fixture first, and only for the
  moves stock does not cover writes a Needs Opus row with the hand-checked expected roll.
- Rage Fist: the code wins over the docs; if the hit counter can't be found in the source, the sheet / notes ("does
  not increase BP when hit") stand, and the calc uses the flat power from data.json. Record it in notes.md.
- Return / Frustration: check that the profile's variable-power handling covers them (varpow); the user types the power.
- (after batch 1) Explosion / Self-Destruct / Misty Explosion Defense halving: the code wins over the sheet. No halving
  in the source and none in Gen 9 stock, so the calc stays unhalved; listed as an in-game test (unit T). Tick them.
- (after batch 1) Hidden Power type from IVs: no rule. The row's Type picker sets the type; BP 60 is settled. Tick it.

## Unit W: weight moves

Completed 2026-10-25; source is the same 0.8.3 pin as Unit F, never the 0.8.4 importer or hzla.
Pinned `data/Species.c` is cached as `.tmp/calc-refine/W-Species.c`; the full 986-species comparison is
`.tmp/calc-refine/W-weights.json`. All guide species map to source constants (`wormadam_trashy` maps to
`SPECIES_WORMADAM_TRASH`). No source weights are missing.

**Weight source.** `tools/calc/src/adapter.js:79-91` takes `weightkg` from the stock generation species record,
falling back to 1 kg, with optional profile species overrides (Hardlove has none). `data.json` P entries have no
weight field; `w` is encounters, not weight. Source `data/Species.c` supplies `weightHectograms` (divide by ten
for kg). `src/battle/battle_pokemon.c:998-1000` reloads form-specific weight from the dex NARC on form change;
`src/battle/battle_script_commands.c:1866-1892` applies Heavy Metal, Light Metal and Float Stone, using integer
hectograms; `src/battle/battle_calc_damage.c:107` passes that effective weight to the damage calculation.

**Bands.** `src/individual/CalcBaseDamage.c:131-177` and
`src/battle/other_battle_calculators.c:736-743` use **<=10/25/50/100/200 kg** for 20/40/60/80/100 BP,
then 120. This is NOT stock at exact thresholds: stock uses **<** thresholds (10 kg Kakuna is 20 BP in source,
40 in stock). For Heavy Slam / Heat Crash, integer attacker/defender weight ratios 0-1/2/3/4/5+ yield
40/60/80/100/120 BP, matching stock; zero defender weight yields 120. The separate battle-script helper
`battle_script_commands.c:2081-2105` uses floor(defender * 10000 / attacker) <=2000/2500/3334/5000;
its rounded one-third boundary differs slightly from the exact ratio used in CalcBaseDamage. Do not mistake
the helper's comments for the damage function actually calculating these moves.

**Fixtures.** Seven source-derived, explicit-power cases; `reference.power` + `plainMove` compare damage
against stock Gen 9 built with guide stats. These are manual-power checks, NOT automatic-weight parity:

| Fixture suffix (`weight-`) | Source weights (kg) | BP |
| --- | --- | --- |
| low-kick-mega-steelix | Mega Steelix 740 | 120 |
| grass-knot-mega-sableye | Mega Sableye 161 | 100 |
| heavy-slam-mega-aggron | Mega Aggron 395 / Snorlax 460 | 40 |
| heat-crash-mega-camerupt | Mega Camerupt 320.5 / Mega Mawile 23.5 | 120 |
| grass-knot-alolan-golem-source-power | Golem Alolan 316 | 120 |
| grass-knot-mega-absol-z-source-power | Mega Absol Z 49 | 60 |
| low-kick-exact-10kg-source-boundary | Kakuna 10 | 20 |

### Needs Opus (Unit W)

- [x] **Historical: automatic weight moves were not enabled.** Resolved by e8cb822 and W2 below. All four were in the base profile's `varpow`;
  `adapter.js:309-326` returns null without `slot.bp`, then renames an explicit-power move to
  `Guide fixed power`, bypassing stock's weight calculation. All seven tested calls return null when BP is
  omitted (`.tmp/calc-refine/W-fixtures.json`). Decide whether to retain manual power or enable native/custom
  weight calculation; the latter must address the source's inclusive Low Kick / Grass Knot boundaries too.
  No shared engine, template or profile behaviour was changed in this unit.
- [x] **Historical: 65 incorrect lookup weights.** Resolved by e8cb822 and W2's three overrides; live identity exceptions remain open below. Previously, 64 species names missed stock lookup and fell back to 1 kg; Maushold
  resolves but source is **2.8 kg**, stock **2.3 kg** (`Species.c:55579`, species block start).
  These do not affect the explicit-power fixtures, but would affect automatic weight moves and other native
  weight consumers (e.g. Sky Drop). Consider source-backed `cfg.calc.over.species[id].weightkg` overrides and
  canonical-name resolution; do not alias forms onto another guide species' name. All missing stock names
  are listed below as **source kg [Species.c species-block line]**; their current engine weight is always 1 kg.
  - Nidoran♀ 7 [1657]; Nidoran♂ 9 [1828]; Mega Absol Z 49 [81913]; Mega Garchomp Z 99 [82027].
  - Mega Lucario Z 49.4 [82084]; Wormadam Trashy 6.5 [84364]; Flabébé 0.1 [40987]; Raticate Alolan 25.5 [64243].
  - Raichu Alolan 21 [64300]; Sandshrew Alolan 40 [64357]; Sandslash Alolan 55 [64414]; Ninetales Alolan 19.9 [64528].
  - Geodude Alolan 20.3 [64813]; Graveler Alolan 110 [64870]; Golem Alolan 316 [64927]; Grimer Alolan 42 [64984].
  - Muk Alolan 52 [65041]; Exeggutor Alolan 415.6 [65098]; Marowak Alolan 34 [65155]; Meowth Galarian 7.5 [65896].
  - Rapidash Galarian 80 [66010]; Farfetchd Galarian 42 [66181]; Weezing Galarian 16 [66238]; Mr Mime Galarian 56.8 [66295].
  - Zapdos Galarian 58.2 [66409]; Slowking Galarian 79.5 [66523]; Corsola Galarian 0.5 [66580]; Zigzagoon Galarian 17.5 [66637].
  - Linoone Galarian 32.5 [66694]; Darmanitan Galarian 120 [66808]; Yamask Galarian 1.5 [66865]; Shellos East Sea 6.3 [68005].
  - Deerling Summer 19.5 [68461]; Deerling Autumn 19.5 [68518]; Deerling Winter 19.5 [68575]; Flabebe Yellow Flower 0.1 [70627].
  - Flabebe Orange Flower 0.1 [70684]; Flabebe Blue Flower 0.1 [70741]; Flabebe White Flower 0.1 [70798]; Floette Yellow Flower 0.9 [70855].
  - Floette Orange Flower 0.9 [70912]; Floette Blue Flower 0.9 [70969]; Floette White Flower 0.9 [71026]; Floette Eternal Flower 0.9 [71083].
  - Rockruff Own Tempo 9.2 [72850]; Growlithe Hisuian 22.7 [75586]; Arcanine Hisuian 168 [75643]; Voltorb Hisuian 13 [75700].
  - Electrode Hisuian 71 [75757]; Typhlosion Hisuian 69.8 [75814]; Qwilfish Hisuian 3.9 [75871]; Sneasel Hisuian 27 [75928].
  - Samurott Hisuian 58.2 [75985]; Lilligant Hisuian 19.2 [76042]; Zorua Hisuian 12.5 [76099]; Zoroark Hisuian 73 [76156].
  - Braviary Hisuian 43.4 [76213]; Sliggoo Hisuian 68.5 [76270]; Goodra Hisuian 334.1 [76327]; Avalugg Hisuian 262.4 [76384].
  - Decidueye Hisuian 37 [76441]; Pyroar Female 81.5 [76954]; Indeedee Female 28 [77068]; Basculegion Female 110 [77125].
- **Ratio helper disagreement:** keep the integer-ratio CalcBaseDamage behaviour authoritative; if automatic
  calculation is introduced, verify call routing/in-game results before adopting the script's 3334 boundary.

Validation: `npm test --prefix tools/calc` PASS (85 engine tests, EI 109 / Hardlove 79 / Photonic 111 /
Eternal 109 checks); `node tools/calc/hardlove_check.mjs` PASS (79/79);
`python -I tools/datajson.py hacks/hardlove-gold/hack.json` PASS. Seven fixtures all deal non-zero damage;
all seven omitted-power calls return null. Logs `.tmp/calc-refine/W-{npmtest,hardlove,datajson,fixtures}.log`.
No independent hack oracle or in-game test.

### W2

2026-10-25; pinned 0.8.3 source `f1b236300187a2b18bf1a0b5ee1f80b3a2fed57b`, stock Gen 9 only as a
reference (never hzla). Re-ran the full 986-species comparison against `Species.c` and e8cb822's actual
`speciesName()` / `weightNames()` lookup. Only three lookup-level differences remain, now overridden by
**guide ID**, not display name:

| Guide ID | Lookup kg | Source kg |
| --- | --- | --- |
| `mega_garchomp_z` | 95 | 99 |
| `mega_lucario_z` | 57.5 | 49.4 |
| `maushold` | 2.3 | 2.8 |

Mega Absol Z already resolves to its correct 49 kg; no redundant override. All regional/Hisuian forms match
the source lookup. Audit `.tmp/calc-refine/W2-weights.json`; live engine probes confirm all three overrides,
the regional forms and Mega Absol Z. The stock checker now passes profile species overrides and current HP
into reference Pokemon, and accepts a reference-only field adjustment for the late zero-power clamp cases.

**Source formulas and profile rules (no engine/template changes):**
- Low Kick / Grass Knot: `movePower` can read live `def.weightkg`, `def.ability`, `def.item` and the stock
  computed `value`. Rules reconstruct effective integer hectograms (`GetPokemonWeight`,
  `battle_script_commands.c:1866-1892`) and use **<=100/250/500/1000/2000 hg**, rather than stock's strict
  bands. Fixtures cover all five exact boundaries, plus the seven converted W fixtures without `slot.bp`.
- Heavy Slam / Heat Crash: integer effective-weight ratios 0-1/2/3/4/5+ give 40/60/80/100/120 BP; zero
  defender weight gives 120 (`CalcBaseDamage.c:146-172`). Rules preserve this, including integer rounding
  and zero-weight semantics rather than stock's minimum-one-hectogram weight adjustment.
- Flail / Reversal: `p=floor(48*currentHP/maxHP)`; source **p>=32 is 20 BP**, unlike stock's p<=32 ->40.
  Other bands agree (`CalcBaseDamage.c:177-204`). Both moves have p31/p32/one-HP fixtures; the checker sweeps
  every positive HP for Snorlax (235 values).
- Gyro Ball: `min(150,floor(25*defSpeed/atkSpeed))`, **without stock's +1**; zero attacking Speed gives 1
  (`CalcBaseDamage.c:98-105`). Rule uses the live effective speeds and preserves the final minimum.
- Electro Ball agrees with stock: floor(attackerSpeed/defenderSpeed) 0/1/2/3/4+ ->40/60/80/120/150;
  defender Speed zero ->40 (`CalcBaseDamage.c:106-129`; effective speeds in `battle_calc_damage.c:106`).
- Crush Grip / Wring Out use `floor(floor((12000*floor(4096*defHP/defMaxHP)+2047)/4096)/100)`;
  this is algebraically the stock formula (`CalcBaseDamage.c:205-209`; `asm/qmath.s:17-40`, half down).
  Source clamps zero to 1 **after** power modifiers (`CalcBaseDamage.c:957-958`), whereas stock starts at 1.
  A final `powerMods` rule clears modifiers when the source raw power was zero; same handling for zero-power
  Gyro Ball. Gem + Helping Hand fixtures exercise the ordering, not merely displayed BP.
- **Hard Press is not the stock 100*HP formula in this pin:** `Moves.c:24709-24720` gives power 0 / HIT;
  `move_script_0915_HARD_PRESS.s` only goes to the effect script; `CalcBaseDamage.c` has no Hard Press case.
  The source's final minimum therefore gives **1 BP even at full HP**, after modifiers. Two profile phases
  implement that literal source behaviour; full-HP and Gem + Helping Hand checks distinguish it from stock.
- Punishment agrees for the exposed five combat boosts: min(200,60+20*sum(positive defender stages))
  (`CalcBaseDamage.c:243-246`; source sums states in `battle_calc_damage.c:91-95`). Accuracy/evasion stage
  controls remain outside the current input contract, not silently simulated.
- Every custom automatic-power rule leaves an explicit `slot.bp` alone. Four manual-override regression
  cases compare exact rolls with fixed 77 BP. `desc.moveBP` is updated alongside the rule power so the
  engine's returned `bp` does not retain the stock pre-rule value.

**Needs Opus (shared identity bugs): done by the orchestrator** (`speciesName()` strips accents and maps ♀ / ♂ to
-F / -M, so Nidoran-F keeps its own stats and 7 kg and Flabébé builds; tests in `tools/calc/test.mjs`; no id collisions
left in any guide). Original rows:
- `nidoran_f`: lookup correctly finds 7 kg, but both guide names `Nidoran♀` / `Nidoran♂` normalize to the
  same stored engine key `nidoran`; the later male overwrites the female. Live female probe reads **9 kg**.
  A weight-only override cannot disambiguate that shared key. Needs canonical, distinct species names in
  shared adapter naming (or an explicitly approved profile effect-name workaround). No source data edited.
- `flabebe`: lookup correctly finds 0.1 kg, but constructing the guide's accented `Flabébé` throws
  `Cannot read properties of undefined (reading 'hp')` in stock Pokemon construction. Needs consistent
  engine species identity normalization, not a weight table change.
- These were found by probing **all 986 guide IDs through the built engine**: **984/986** source weights
  and Grass Knot powers pass; the two exceptions above are recorded, not hidden. Evidence:
  `.tmp/calc-refine/W2-engine-weights.json` and `W2-audit.log`. The old Unit W lookup rows are closed; full
  live-engine weight coverage remains open for these two shared-name fixes.

**Checks:** `npm test --prefix tools/calc`, `node tools/calc/hardlove_check.mjs`,
`uv run python -I tools/datajson.py hacks/hardlove-gold/hack.json`, and final
`python assemble.py hardlove-gold`. Logs `.tmp/calc-refine/W2-{npmtest,hardlove,datajson,assemble}.log`.
All pass: engine 86/86 (41 direct stock parity cases), EI 109 fixtures, Hardlove **105/105 checks**,
Photonic 111 fixtures, Eternal 109 fixtures; Hardlove-only build 2.86 MB / 986 species and sprites.
No all-guide assembly, domcompare, browser sweep, independent hack oracle or in-game test in this unit.
