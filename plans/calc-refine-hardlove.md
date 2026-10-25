# Calc refine: Hardlove Gold survey (S1)

Survey only. Written by the S1 agent; not committed. Sources: `hacks/hardlove-gold/data.json` MV.h (218 move notes, dumped to `.tmp/calc-refine/S1-notes.txt`); `hacks/hardlove-gold/.src/Move Changes.xlsx` (sheet 'Move Changes': 175 changed rows, and the effect side table with 13 rows, dumped to `.tmp/calc-refine/S1-xlsx.txt`); game source `.tmp/calc-hardlove-gold/source/`.

Counts: 223 changed moves after merging name variants (Precicipe/Precipice, Sand-Attack/Sand Attack, Make it/Make It). data 210, damage effect 10, out of scope 3. The data count includes moves whose effect chance also changed (Charge Beam, Mud Bomb, Mirror Shot, Octazooka, Leaf Tornado, Night Daze, Smog, Make It Rain): those secondary parts are out of scope.

Source file:line refs are from grep; line numbers are for `.tmp/calc-hardlove-gold/source/src/`, relative to that tree.

## Damage-effect moves

### Batch 1

- [ ] **Hidden Power**: Type from the user's IVs (not fixed); BP fixed at 60 (data bp is 60). Source: `other_battle_calculators.c:2631 (type by IVs), 3277; CalcBaseDamage.c:361-362 (movepower = 60)`
- [ ] **Explosion**: Halves target's Defense in the damage calc (side table); faints user (data). Source: `not located: MOVE_EXPLOSION absent from CalcBaseDamage.c. Partial: other_battle_calculators.c:233 (list), BeforeMove.c:2234 (Damp only)`
- [ ] **Self-Destruct**: Halves target's Defense in the damage calc (side table). Source: `not located as Explosion. Partial: other_battle_calculators.c:232 (list), BeforeMove.c:2233 (Damp only)`
- [ ] **Misty Explosion**: Halves target's Defense in the damage calc (side table); power 100 > 200 is data. Source: `CalcBaseDamage.c:492-494 (terrain x1.5 case); BeforeMove.c:2236 (Damp); defense halving not located`
- [ ] **Thunder Wave**: Electric-type users cannot miss with it (accuracy bypass rule). Source: `other_battle_calculators.c:2705-2706 (electric user, hit check); BeforeMove.c:2854, 2867 (immunity line)`
- [ ] **Frustration**: Power = (255 - happiness) x 10 / 25, max 102 (data bp 102 is the cap). Source: `CalcBaseDamage.c:214-215`
- [ ] **Return**: Power = happiness x 10 / 25, max 102 (data bp 102 is the cap). Source: `CalcBaseDamage.c:211-212`
- [ ] **Rage Fist**: Sheet and notes say 'Does not increase BP when being hit' (power 50 > 100 is data); data text says '+50 per hit taken, max 6'. Conflict: decide which the hack uses. Source: `other_battle_calculators.c:441 (PunchingMoveTable entry); hit counter not located`

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

### Orchestrator answers
- Thunder Wave, Pain Split: status-only effects for the calc (accuracy, HP averaging); no damage rule. Tick them as
  out of scope, no fixtures. (Pain Split's "Physical, power ??" is a display quirk of the sheet.)
- Explosion / Self-Destruct / Misty Explosion: the Gen 4 base already halves Defense for Explosion / Self-Destruct
  if the stock gen4 mechanics do; the batch agent checks the stock behaviour with a fixture first, and only for the
  moves stock does not cover writes a Needs Opus row with the hand-checked expected roll.
- Rage Fist: the code wins over the docs; if the hit counter can't be found in the source, the sheet / notes ("does
  not increase BP when hit") stand, and the calc uses the flat power from data.json. Record it in notes.md.
- Return / Frustration: check that the profile's variable-power handling covers them (varpow); the user types the power.
