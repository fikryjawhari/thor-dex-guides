# Calc: dynamic move power and form weights

Status 2026-10-25 (`worktree-damage-calc`, session 2 of `plans/calc-refine.md`). The user wants every move whose power
depends on the battle state to work dynamically (HP, speed, ability, item, Float Stone and the like). Max / Z moves are
out for now. A hack that changes or adds one documents it in its notes (handled per hack, as a rule).

## Engine pass 2026-10-26: unit list (approved; brief: `plans/calc-engine-pass.md`)
Orchestrator: Opus main chat on `worktree-damage-calc` (`.claude/worktrees/damage-calc`, shared by every unit). Sol =
`gpt-6.1-sol` via `delegate_task`; Sol writes only `plans/` notes and fixture files, never `tools/calc/src` or
`template/`. Haiku medium (under 100k) finishes a Sol unit from its last `WIP:` commit if Sol runs out. Every unit
commits per sub-step.

**What the survey already found (orchestrator, before the units):**
- Stock 0.12.0 handles only three of D's inputs: Pursuit (`defenderSide.isSwitching`), the Metronome item
  (`move.timesUsedWithMetronome`) and Supreme Overlord (`attacker.alliesFainted`). Nothing else in D has a stock
  condition (no Fury Cutter, Echoed Voice, Rollout, Ice Ball, Rage Fist, Last Respects, Assurance state, Revenge /
  Avalanche, Retaliate, Stomping Tantrum / Temper Flare, combos, Fickle Beam, Dig / Fly / Dive / Minimize).
- Stock's `move.timesUsed` is **not** a Fury Cutter counter: it repeats the whole hit "over N turns" (gen3/4/789
  `numAttacks`). Passing it would multiply damage. The counters become our own `movePower` phase on a slot input
  (below); the toggle spec's "`timesUsed` = count + 1" line is corrected by U2.
- B (form weights): all four W2 audits are done and every listed form was checked; the overrides are in. Hardlove's
  two open identity bugs (Nidoran♀/♂ sharing a key, Flabébé throwing) were fixed since (`tools/calc/test.mjs`
  287-289); Hardlove's notes still call them open. Photonic's oracle blocker (Needs Opus 6) is closed:
  `hzla_compare photonic-sun` today gives 118 match / 28 known / 0 mismatch / 0 error. Nothing is still open in B
  except stale text; if "Photonic's blocker" meant something else, say which.
- C, Photonic Triple Kick 20 / Power Gem 90: the game data (`.src/dex-rebalanced.json`, the 3DS authority) has 10 / 80
  (Power Gem's PP 15 change *is* in the game, so the dump is the patched one). `data.json` matches the game; only a
  "Doc says" note is missing. Eternal X has 20 / 90 in its game data, as in its doc.
- C, Eternal X Frost Breath: game data is identical to vanilla X (60 power, 90 acc, crit stage 6 = always crit);
  vanilla X already had the Gen 6 buff 40 → 60, which is likely what the changelog means. No data change; a note.
- C, Drill Peck: both 3DS dumps carry a per-move `crit` field (Drill Peck 0 → 1; Frost Breath 6). So crit stages come
  from game data for Photonic / Eternal X, from `moves_info.h` `.criticalHitStage` for EI and from hg-engine's move
  data for Hardlove.

**Input contract added by U2 / U3 / U5** (slot / set / field fields, all optional; old pages pass none and get today's
results):
- `slot.st`: the row's state. Toggle moves: `true`. Counter moves: the earlier count (0 = first use).
- `slot.met`: consecutive uses with a held Metronome (passed to stock `timesUsedWithMetronome`).
- `def.vol` (and `atk.vol` for symmetry): `dig` / `fly` / `dive` / `min` / `switch` (`switch` → stock
  `isSwitching: 'out'`).
- Added after U1 (orchestrator, 2026-10-26; `plans/calc-state-engine.md` → Handoff 4): `slot.curl` (Rollout / Ice
  Ball: Defense Curl used earlier, independent of the `slot.st` count); `atk.fnt` 0..5 (Supreme Overlord, the
  attacker's own counter → stock `alliesFainted`, never shared with a move's `slot.st`); pledges: `slot.st` = the
  partner pledge's move name (the adapter derives power 150, the combined type and its STAB; a hack whose source keeps
  pledges flat, H, ignores it). Entry boosts (Intrepid Sword, Dauntless Shield, Download) take no new input: the
  set's `abilityOn` stays the gate. No new `vol` values.
- Field keys read straight by the adapter (no stock property): `atkFocus` / `defFocus` (Focus Energy, U5); the UI
  build declares them in the base profiles (out of scope here).
- Result: `bp` whenever the power used differs from the listed power, for every move; `pre` (stat changes the adapter
  applied before the hit, for the details line); `crit: {stage, p, forced}` (U5).

| Unit | Scope | Who | Files | Checks | Commit |
| --- | --- | --- | --- | --- | --- |
| U1 Survey: state moves and pre-hit stat changes | A, D | Sol | `plans/calc-state-engine.md` (new): per move, which hacks have it (data.json + each hack's source: EI expansion, Hardlove hg-engine, Photonic / Eternal X game data and docs), the rule per generation (Bulbapedia), any hack change, automatic or flag; A's full set (Meteor Beam, Electro Shot, Skull Bash, Spectral Thief, plus entry / on-hit effects that change a stat before *this* hit: Download, Intrepid Sword / Dauntless Shield, terrain seeds, Weakness Policy / Stamina / Weak Armor between hits of a multi-hit move, and the like) | none (notes only) | one per hack, then `U1 done` |
| U2 Fixtures: state moves | D | Sol | `hacks/<hack>/calc_states.json` (new, all four): per case the fixture input (as `calc_matchups.json`) plus `expect` (`bp`, or `ref`: a fixed-power twin whose rolls must match, or hand-worked `rolls` for damage multipliers like Dig, Metronome); one case per move per hack that has it, the on / off pair, the caps (Fury Cutter 160, Echoed Voice 200, Rage Fist 350), Rollout + Defense Curl, Lash Out's old drop vs this-turn drop, Pursuit, `bp` for stock power changes (Facade burned, Hex, Brine, Knock Off, Acrobatics, Weather Ball, Stored Power) | files are JSON-valid; each case names its rule source | one per hack |
| U3 Adapter: state inputs and power reporting | D | Opus | `tools/calc/src/adapter.js` (+ `rules.js` if a phase is missing), `tools/calc/state_check.mjs` (new, runs every `calc_states.json`; added to `npm test`), `tools/calc/README.md` (contract), `template/calc/engine.js` | `npm test`, `state_check`, all four hack checks, `hzla_compare` ×4 unchanged | adapter, then engine.js |
| U4 Adapter: pre-hit stat changes | A | Opus | `adapter.js` (`beforeStats`: automatic ones; result `pre`), A cases appended to `calc_states.json` by U1/U2 | same as U3 | adapter + engine.js |
| U5 Survey and fixtures: crit stages | C | Sol | `plans/calc-crit.md` (new): stage → chance per generation (Gen 4-5, 6, 7+), every source (move stage, Focus Energy, Dire Hit, Dragon Cheer, Scope Lens, Razor Claw, Leek / Stick, Lucky Punch, Super Luck, Lansat Berry, Laser Focus, Merciless; Battle / Shell Armor, Lucky Chant), which stack, each hack's differences from its source, and every move whose crit stage the hack changes or that is now always a crit (all four hacks, with source lines); crit cases appended to `calc_states.json` (`expect.crit`) | JSON-valid; sources cited | one per hack |
| U6 Engine: crit stages | C | Opus | `adapter.js`: count the stage from the move, item, ability and `atkFocus`; result `crit {stage, p, forced}`; `forced` (stage at the always-crit threshold, `willCrit`, Merciless on a poisoned target, Laser Focus) makes the hit a crit whatever `slot.crit` says, so the UI can lock C on; per-move stages from the source U5 picks (question 1 below) | same as U3, plus U5's cases | adapter + engine.js |
| U7 Close-out | B, C, docs | Opus | delete the form-weight list and the leftovers here; Photonic "Doc says" note for Triple Kick / Power Gem and Eternal X's Frost Breath note (notes.md only, no extract change); Hardlove's stale W2 line; each hack's notes.md → Damage calc; `damage-calc-sessions.md` Status; PROGRESS.md → Open 2; the toggle spec's `timesUsed` correction goes to its own branch's owner as a note here (that file is read-only in this session) | `python assemble.py`, the four hack checks, the calc scenarios, `gate.py check` ×4, `domcompare` where a page changed (engine.js changes reach every calc guide) | docs |

Order: U1 → U2 (Sol, sequential), U5 can run after U2 in the same Sol chain; U3 starts when U2 lands, U4 after U3, U6
after U5. Sol units are about 60-80 requests each; U1 and U5 split per hack if Sol's context passes ~150k.

**Answered (user, 2026-10-26):** crit stages as a `cr` field per move in `data.json` from each hack's extract (approved),
with a `hack.json` `critStage` list as the per-hack fallback; the extract `cr` change is the orchestrator's, before U6.
Focus Energy as `atkFocus` / `defFocus`: confirmed 2026-10-26. How the units run: `plans/calc-engine-pass.md`.

Done so far: U1, U2, U3, U5, extract `cr`, U6, U4a (the A fixtures for U4) and U4 done; **U7 next**. Commits and
details: `plans/calc-engine-pass.md` → Progress.

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

Power box readout (session 3): the result reports the power used (`bp`, shown in the row's Power box) only for
`AUTO_POWER` and the HP-scaled `HP_POWER` (Eruption, Water Spout, Dragon Energy). The other moves above work it out
but the box keeps the listed power (Facade, Hex, Acrobatics, Knock Off, Weather Ball, Stored Power...); decide
whether every stock `desc.moveBP` change should show, alongside the state toggles.

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

## Stat changes before the hit (user, 2026-10-25: count them automatically, or the user will misread rolls)
Moves that change the attacker's or the target's stats before damage (Meteor Beam and Electro Shot +1 Sp. Atk on the
charge turn, Skull Bash +1 Def, Spectral Thief taking the target's boosts) and abilities or items that fire on the hit
or on entry (Intimidate is already a manual stage). Survey the whole set (Bulbapedia categories, the hack's source) in
the same session as the state toggles: apply automatically where the game always does it, otherwise a row toggle.
Stock already reads the target's stats for Foul Play / Body Press / Psyshock style moves.

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

## Left over from the calc refinement (2026-10-26; `plans/calc-refine*.md` are in git history)
Small items for the next engine session:
- Photonic: the doc gives Triple Kick power 20 and Power Gem power 90 (PP 15), but `data.json` has 10 and 80. Check the
  extract first (Move Changes parsing), not the calc.
- Photonic and Eternal X: Drill Peck's crit-stage change. It doesn't change deterministic damage; decide whether the
  engine takes a crit stage (a phase) or a unit table checks the rule.
- Eternal X: Changelog V2.4 says Frost Breath was buffed (Rebalanced), but neither the PDF nor `data.json` shows it.
  The brief expected 38 move notes; the PDF and `data.json` both have 28. Confirm both against the docs.
