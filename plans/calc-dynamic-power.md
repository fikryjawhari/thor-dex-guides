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

Done: U1-U7 (2026-10-26). B (form weights) and the refinement leftovers are closed: the weights in each hack's
notes.md (W2), Photonic Triple Kick / Power Gem and Eternal X Frost Breath / Drill Peck in their notes.md → Damage calc.
**For the toggle spec's owner** (`plans/calc-state-toggles.md` on `worktree-damage-calc-toggles`, read-only here):
its "`timesUsed` = count + 1" is replaced by `slot.st` (the earlier count, 0 = first use); stock `timesUsed` repeats
the whole hit over turns. The engine's inputs and results: `tools/calc/README.md` → Battle state, Crit, Stat changes
before the hit. The sections below are the UI decide session's background (the engine side is built). Commits and
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
whether every stock `desc.moveBP` change should show, alongside the state toggles. (Engine pass U3: the result now has `bp` for every move whose power
differs from the listed one; showing it is the UI's call.)

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
