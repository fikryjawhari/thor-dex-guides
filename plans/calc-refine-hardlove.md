# Calc refine: Hardlove Gold survey (S1)

Survey only. Written by the S1 agent; not committed. Sources: `hacks/hardlove-gold/data.json` MV.h (218 move notes, dumped to `.tmp/calc-refine/S1-notes.txt`); `hacks/hardlove-gold/.src/Move Changes.xlsx` (sheet 'Move Changes': 175 changed rows, and the effect side table with 13 rows, dumped to `.tmp/calc-refine/S1-xlsx.txt`); game source `.tmp/calc-hardlove-gold/source/`.

Counts: 223 changed moves after merging name variants (Precicipe/Precipice, Sand-Attack/Sand Attack, Make it/Make It). data 210, damage effect 10, out of scope 3. The data count includes moves whose effect chance also changed (Charge Beam, Mud Bomb, Mirror Shot, Octazooka, Leaf Tornado, Night Daze, Smog, Make It Rain): those secondary parts are out of scope.

Source file:line refs are from grep; line numbers are for `.tmp/calc-hardlove-gold/source/src/`, relative to that tree.

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

- [ ] **Pain Split**: Sheet: Power ?? > 1, Normal > Dark, Physical (game data 'varies'). Data has bp null and category Physical: the power rule is not in the engine. Source: `not located: no PAIN_SPLIT / painsplit in src/ or include/`
- [ ] **Double Shock**: Not a punching move (no Iron Fist boost); typeless, must be Electric (data flags already match: no 'punch' flag). Source: `other_battle_calculators.c:447 (removed from punch list, comment), BeforeMove.c:1890-1891 (typeToCheck Electric)`

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
