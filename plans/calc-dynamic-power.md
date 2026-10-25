# Calc: dynamic move power and form weights

Status 2026-10-25 (`worktree-damage-calc`, session 2 of `plans/calc-refine.md`). The user wants every move whose power
depends on the battle state to work dynamically (HP, speed, ability, item, Float Stone and the like). Max / Z moves are
out for now. A hack that changes or adds one documents it in its notes (handled per hack, as a rule).

## Already dynamic (engine works it out from what the page passes)
Weight: Low Kick, Grass Knot, Heavy Slam, Heat Crash (stock `getWeight`: Float Stone, Light / Heavy Metal).
HP: Eruption, Water Spout, Dragon Energy, Flail, Reversal, Crush Grip, Wring Out, Hard Press, Brine.
Speed (turn order from Speed): Electro Ball, Gyro Ball, Payback, Bolt Beak, Fishious Rend.
Stat stages: Stored Power, Power Trip, Punishment. Item: Fling, Natural Gift, Acrobatics, Knock Off.
Status: Hex, Infernal Parade, Barb Barrage, Venoshock, Facade, Smelling Salts, Wake-Up Slap.
Field: Weather Ball, Terrain Pulse, Rising Voltage, Expanding Force, Grav Apple, Psyblade, Solar Beam / Blade.
Type match-up: Collision Course, Electro Drift. Hits: Triple Kick, Triple Axel.
(The first nine moves of the weight / HP / speed groups plus Fling / Natural Gift were manual-power before
2026-10-25: `AUTO_POWER` in `tools/calc/src/adapter.js`; the rest were always stock.)

## Needs battle state the page has no control for (engine + a decide session for the UI)
- Last turn / this turn: Stomping Tantrum, Temper Flare (last move failed); Revenge, Avalanche (hit first this turn);
  Assurance (target already damaged); Lash Out (stats dropped this turn); Retaliate (ally fainted last turn).
- Counters: Fury Cutter, Echoed Voice, Rollout, Ice Ball (+ Defense Curl), Rage Fist (times hit), Last Respects
  (fainted allies), Supreme Overlord (ability), Metronome item (times used). Stock has `timesUsed` /
  `alliesFainted` for some.
- Target state: Gust, Twister (Fly / Bounce), Earthquake, Magnitude (Dig), Surf, Whirlpool (Dive), Stomp and others
  (Minimize), Pursuit (target switching: stock `isSwitching`).
- Combos / partners: Round, Fusion Bolt / Flare, Fire / Water / Grass Pledge.
- Chance: Fickle Beam (30% double: a toggle like crit).
- Dynamax-only boosts (Behemoth Blade / Bash, Dynamax Cannon): out with Max moves.
Proposal: a per-row "state" toggle / counter where the move needs one (like the Triple Kick hit button), set in a
decide session; the engine side mostly maps to existing stock fields.

## Manual by nature (Power box stays)
Beat Up (party), Magnitude (random), Present (random), Spit Up (stockpile), Trump Card (PP), Hidden Power (IVs; type
via the row's Type picker), Return / Frustration / Pika Papow / Veevee Volley (happiness; Hardlove typed power).

## Form weights to check (full pass in a later session)
Stock has no entry under these names, and the engine fell back to the **base species'** weight (the stock form-name
match covers regional forms, Megas stock knows, Rotom forms and so on). Many are the default form and correct
(Castform Normal, Shaymin Land, the Incarnate forms); hack Megas / Primals and cosmetic forms with their own weight
need the game files (expansion `species_info`, hg-engine `Species.c`) or Bulbapedia as a fallback, then
`cfg.calc.over.species[id].weightkg`. Hardlove's are being set by W2 from its source.
- **emerald-imperium (72)**: Mega Butterfree (Butterfree 32 kg); Pikachu (Cosplay) (Pikachu 6 kg); Pikachu (Rock Star)
  (Pikachu 6 kg); Pikachu (Belle) (Pikachu 6 kg); Pikachu (Pop Star) (Pikachu 6 kg); Pikachu (PhD) (Pikachu 6 kg);
  Pikachu (Libre) (Pikachu 6 kg); Pikachu (Surfing) (Pikachu 6 kg); Pikachu (Flying) (Pikachu 6 kg); Nidoran♀
  (Nidoran-F 7 kg); Nidoran♂ (Nidoran-M 9 kg); Mega Machamp (Machamp 130 kg); Mega Kingler (Kingler 60 kg); Mega
  Lapras (Lapras 220 kg); Mega Snorlax (Snorlax 460 kg); Mega Slaking (Slaking 130.5 kg); Castform (Normal) (Castform
  0.8 kg); Mega Torterra (Torterra 310 kg); Mega Infernape (Infernape 55 kg); Mega Empoleon O (Empoleon 84.5 kg); Mega
  Empoleon D (Empoleon 84.5 kg); Mega Luxray (Luxray 42 kg); Mega Roserade (Roserade 14.5 kg); Wormadam (Plant)
  (Wormadam 6.5 kg); Mega Dusknoir (Dusknoir 106.6 kg); Primal Dialga (Dialga 683 kg); Primal Palkia (Palkia 336 kg);
  Shaymin (Land) (Shaymin 2.1 kg); Basculin (Red Striped) (Basculin 18 kg); Darmanitan (Standard) (Darmanitan 92.9
  kg); Mega Garbodor (Garbodor 107.3 kg); Tornadus (Incarnate) (Tornadus 63 kg); Thundurus (Incarnate) (Thundurus 61
  kg); Landorus (Incarnate) (Landorus 68 kg); Meloetta (Aria) (Meloetta 6.5 kg); Floette (Red) (Floette 0.9 kg);
  Meowstic (Male) (Meowstic 8.5 kg); Meowstic (Female) (Meowstic 8.5 kg); Pumpkaboo (Average) (Pumpkaboo 5 kg);
  Gourgeist (Average) (Gourgeist 12.5 kg); Hoopa (Confined) (Hoopa 9 kg); Oricorio (Baile) (Oricorio 3.4 kg); Rockruff
  (Own Tempo) (Rockruff 9.2 kg); Lycanroc (Midday) (Lycanroc 25 kg); Wishiwashi (Solo) (Wishiwashi 0.3 kg); Silvally
  (Normal) (Silvally 100.5 kg); Minior (Meteor Red) (Minior 0.3 kg); Minior (Core Red) (Minior 0.3 kg); Mega Orbeetle
  (Orbeetle 40.8 kg); Mega Drednaw (Drednaw 115.5 kg); Mega Coalossal (Coalossal 310.5 kg); Mega Flapple (Flapple 1
  kg); Mega Appletun (Appletun 13 kg); Mega Sandaconda (Sandaconda 65.5 kg); Toxtricity (Amped) (Toxtricity 40 kg);
  Mega Toxtricity (Toxtricity 40 kg); Mega Centiskorch (Centiskorch 120 kg); Mega Grimmsnarl (Grimmsnarl 61 kg);
  Eiscue (Ice) (Eiscue 89 kg); Indeedee (Male) (Indeedee 28 kg); Indeedee (Female) (Indeedee 28 kg); Mega Copperajah
  (Copperajah 650 kg); Urshifu (Single Strike) (Urshifu 105 kg); Basculegion (Male) (Basculegion 110 kg); Basculegion
  (Female) (Basculegion 110 kg); Enamorus (Incarnate) (Enamorus 48 kg); Oinkologne (Male) (Oinkologne 120 kg);
  Oinkologne (Female) (Oinkologne 120 kg); Squawkabilly (Green) (Squawkabilly 2.4 kg); Palafin (Zero) (Palafin 60.2
  kg); Gimmighoul (Chest) (Gimmighoul 5 kg); Ogerpon (Teal) (Ogerpon 39.8 kg).
- **hardlove-gold (14)**: Nidoran♀ (Nidoran-F 7 kg); Nidoran♂ (Nidoran-M 9 kg); Wormadam Trashy (Wormadam 6.5 kg);
  Shellos East Sea (Shellos 6.3 kg); Deerling Summer (Deerling 19.5 kg); Deerling Autumn (Deerling 19.5 kg); Deerling
  Winter (Deerling 19.5 kg); Floette Yellow Flower (Floette 0.9 kg); Floette Orange Flower (Floette 0.9 kg); Floette
  Blue Flower (Floette 0.9 kg); Floette White Flower (Floette 0.9 kg); Floette Eternal Flower (Floette 0.9 kg);
  Rockruff Own Tempo (Rockruff 9.2 kg); Pyroar Female (Pyroar 81.5 kg).
- **photonic-sun (42)**: Nidoran♀ (Nidoran-F 7 kg); Nidoran♂ (Nidoran-M 9 kg); Castform (Normal) (Castform 0.8 kg);
  Deoxys (Normal) (Deoxys 60.8 kg); Burmy (Plant) (Burmy 3.4 kg); Wormadam (Plant) (Wormadam 6.5 kg); Cherrim
  (Overcast) (Cherrim 9.3 kg); Shellos (West Sea) (Shellos 6.3 kg); Shellos (East Sea) (Shellos 6.3 kg); Gastrodon
  (West Sea) (Gastrodon 29.9 kg); Gastrodon (East Sea) (Gastrodon 29.9 kg); Giratina (Altered) (Giratina 750 kg);
  Shaymin (Land) (Shaymin 2.1 kg); Basculin (Red-Striped) (Basculin 18 kg); Darmanitan (Standard) (Darmanitan 92.9
  kg); Deerling (Spring) (Deerling 19.5 kg); Sawsbuck (Spring) (Sawsbuck 92.5 kg); Tornadus (Incarnate) (Tornadus 63
  kg); Thundurus (Incarnate) (Thundurus 61 kg); Landorus (Incarnate) (Landorus 68 kg); Keldeo (Ordinary) (Keldeo 48.5
  kg); Meloetta (Aria) (Meloetta 6.5 kg); Vivillon (Icy Snow) (Vivillon 17 kg); Floette (Red) (Floette 0.9 kg);
  Floette (Orange) (Floette 0.9 kg); Floette (White) (Floette 0.9 kg); Florges (Red) (Florges 10 kg); Furfrou
  (Natural) (Furfrou 28 kg); Meowstic (Male) (Meowstic 8.5 kg); Meowstic (Female) (Meowstic 8.5 kg); Pumpkaboo
  (Average) (Pumpkaboo 5 kg); Gourgeist (Average) (Gourgeist 12.5 kg); Xerneas (Neutral) (Xerneas 215 kg); Zygarde
  (50%) (Zygarde 305 kg); Zygarde (50%, Power Construct) (Zygarde 305 kg); Hoopa Confined (Hoopa 9 kg); Oricorio
  (Baile) (Oricorio 3.4 kg); Rockruff (Own Tempo) (Rockruff 9.2 kg); Lycanroc (Midday) (Lycanroc 25 kg); Wishiwashi
  (Solo) (Wishiwashi 0.3 kg); Minior (Red Core) (Minior 0.3 kg); Mimikyu (Disguised) (Mimikyu 0.7 kg).
- **eternal-x (30)**: Nidoran♀ (Nidoran-F 7 kg); Nidoran♂ (Nidoran-M 9 kg); Castform (Normal) (Castform 0.8 kg);
  Deoxys (Normal) (Deoxys 60.8 kg); Burmy (Plant) (Burmy 3.4 kg); Wormadam (Plant) (Wormadam 6.5 kg); Cherrim
  (Overcast) (Cherrim 9.3 kg); Shellos (West Sea) (Shellos 6.3 kg); Gastrodon (West Sea) (Gastrodon 29.9 kg); Giratina
  (Altered) (Giratina 750 kg); Shaymin (Land) (Shaymin 2.1 kg); Basculin (Red-Striped) (Basculin 18 kg); Darmanitan
  (Standard) (Darmanitan 92.9 kg); Deerling (Spring) (Deerling 19.5 kg); Sawsbuck (Spring) (Sawsbuck 92.5 kg);
  Tornadus (Incarnate) (Tornadus 63 kg); Thundurus (Incarnate) (Thundurus 61 kg); Landorus (Incarnate) (Landorus 68
  kg); Keldeo (Ordinary) (Keldeo 48.5 kg); Meloetta (Aria) (Meloetta 6.5 kg); Vivillon (Icy Snow) (Vivillon 17 kg);
  Floette (Red) (Floette 0.9 kg); Floette (Yellow) (Floette 0.9 kg); Florges (Red) (Florges 10 kg); Furfrou (Natural)
  (Furfrou 28 kg); Meowstic (Male) (Meowstic 8.5 kg); Meowstic (Female) (Meowstic 8.5 kg); Pumpkaboo (Average)
  (Pumpkaboo 5 kg); Gourgeist (Average) (Gourgeist 12.5 kg); Xerneas (Neutral) (Xerneas 215 kg).
