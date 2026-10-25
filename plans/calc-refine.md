# Calc refinement: one Opus-orchestrated session

One Opus (medium) main chat runs the whole refinement: it dispatches Haiku (medium) agents for the mechanical units
and builds the two UI pieces itself. Everything happens on `worktree-damage-calc` (`.claude/worktrees/damage-calc`).
Delete this file when every unit below is done (CLAUDE.md → When a plan is built and merged).

## Where things stand (handover 2026-10-25, end of session 1)
Done and committed on `worktree-damage-calc` (pushed):
- **S1-S3** surveys: `plans/calc-refine-{hardlove,photonic,eternal}.md` (rows, sources, orchestrator answers).
- **B** move batches: every batch in the three plan files is ticked. Hardlove: Return / Frustration (typed power),
  Rage Fist flat 100, Explosion family not halved (code wins), Hidden Power type via the row's Type picker, Double
  Shock no punch flag. Photonic / Eternal X: Self-Destruct, Explosion (and EX's Cut) always crit via an
  `over.rules` `critical` rule; Photonic's oracle halving recorded as known differences (Gen 7 has none).
- **Engine (Opus)**: Triple Kick / Axel = the move's own power x hit (Gen 5/6 now passes the hit; EI's source does the
  same, so EI's Triple Kick 20 is now 20 / 40 / 60). Residual per turn in the KO text (`DMG.residual`, profile
  `residual`; EI: Self Sufficient, Frostbite). Protean / Libero: attacker takes the move's type in every base,
  defender's chosen type (`pty`).
- **P** (Protean / Libero check): covered by `tools/calc/test.mjs` for Gen 4, 6, 7 and 9 (STAB note and damage, chosen
  defending type, no effect without the ability). No separate oracle fixtures needed.
- **U1, U2** built (template README → Damage calculator, "Turn end"), plus the user's fixes from the mockup: a cell per
  side in its own column (no name below 480 px), parts list behind an arrow, HP label → ↺ reset when not full, and the
  Field-under-the-rows bug (New Pokémon leaves the editor open; the ≥480 px block now grows with `.ed` / `.dqp`).
  Scenario `tools/scenarios/calc-residual.mjs` (30/30 at five sizes x normal / dvkb); `domcompare` on `#/calc`: no
  change in the default view for all four guides.
- Checks at the end: `npm test` (85 shared + hack suites), imperium 109, hardlove 66, photonic 111, eternal 109;
  hzla: EI 100 + 9 known, Photonic 101 + 10 known, Eternal X 106 + 3 known, 0 mismatches.

Session 2 (2026-10-25): **F** done (Sol `6a80e17`; Opus rows `2f125af`: Hardlove Reckless / Sheer Force lists). **U3** built
(`40360db`, with the user's toxic turn box and Turn label fix). **W Hardlove** first pass done (Sol `60d3c2b`, manual-power
fixtures) and found weight moves were manual everywhere: the user chose **automatic power** (weight, HP, speed, boosts;
engine `AUTO_POWER` + form-name weight fallback, Opus). W continues as "W2" below.
Also `7b93a0f` (Fling / Natural Gift automatic, `plans/calc-dynamic-power.md`); pushed up to `e8cb822`.
**Handover (end of session 2):** W2 Hardlove done (Sol `83e9b39`: Megas Z / Maushold weights, inclusive weight bands,
ratio / Flail / Gyro Ball / Hard Press source rules, 105 checks); its Needs Opus rows fixed by the orchestrator (species
names: accents and ♀ / ♂, which had merged Nidoran-F into -M in every guide). The user takes the rest of the
dynamic-power engine work (state toggles, pre-hit stat changes) to its own session: `plans/calc-dynamic-power.md`.
**Open steps (session 3 onward), in order** (rows in the Units table below; tick each when its commit lands):
1. [x] W2 Photonic (Sol `bd400a6`..`476a447`, no weight changes; oracle harness auto power `cc7133d`) (Sol: the W2 row, the scope note below, Photonic's list in `plans/calc-dynamic-power.md`).
2. [x] W2 Eternal X (Sol `bed8ae8`..`593e1c5`, no weight changes, 116 oracle matches + 3 known).
3. [x] W2 EI (Sol `eb20ff2`..`4044033`: Megas Infernape / Empoleon D / Luxray / Roserade, Minior Meteor from the source; orchestrator: Hoopa Unbound 49 kg, Eruption power readout).
4. [x] Z survey (Sol `f938419`, `058e68a`: no engine path then; 16 doc Z-power changes, all the Gen 7 band of the new power).
   User (2026-10-25): Z-moves back in scope, Photonic only; Totem auras automatic.
5. [x] Z engine (orchestrator `580f021`): profile `zmove`, slot `z`, band power + stock exceptions (`catalog.zpow`),
   result `z` name, oracle `useZ`. Photonic `zmove: true`.
6. [x] Z fixtures (Sol `b73d0ab`..`d4e0896`, 25 fixtures; orchestrator: profile `zpow`, Photonic's 16 doc Z powers, all pass; oracle 118 + 28 known).
7. [x] Totem data (Sol `40d1ace`, finished by the orchestrator `3e0b704`: 13 battles, 33 mons; schema `au` `080a5c2`): Totem Battles.txt (cross-checked with the game files where they have it) → Photonic TR as
   Totem battles in walkthrough order, totem with `au` (aura stages Atk, Def, SpA, SpD, Spe), allies as its partners.
   Photonic extract on this branch (its guide is merged; the calc is the consumer). Schema line in EI notes → Data schema.
8. [x] UI (orchestrator `04432da`; Z on the % line, aura mark on the Lv / HP line; calc-zmove 20/20, domcompare: other guides identical) (orchestrator, template; mockup first, user approves): a Z button on each damaging move row (Photonic
   only, not in the crit / multi-hit area); Totem cards show the aura; importing a Totem into the calc applies `au`
   as its stages, with a "Totem aura" mark. Scenario at every size, normal / dvkb; domcompare for all guides.
9. [x] T In-game test cards, all four hacks (Haiku `ec479fd`..`703ab25`: EI 5, Hardlove 5, Photonic 4, Eternal X 4).
10. [ ] A Audit (Haiku medium).
11. [ ] Finish: notes / `plans/damage-calc-sessions.md` → Status / PROGRESS.md, delete this plan if all done.

**Handover (end of session 3, 2026-10-25; usage limits, not context):** steps 1-5 done, plus `d8ee6e1` (calc-mechanics:
names only through `speciesName()`, now in `tools/calc/src/names.js`, shared with `hzla_compare.mjs`) and `cc7133d`
(oracle computes variable power natively for fixtures without `bp`, with the engine's weights). Step 6 done too (see its row).
Start session 4 at step 7. Checks at the end of session 3: `npm test` passes; photonic / eternal / imperium / hardlove
checks pass; hzla: Photonic 118 + 28 known (Z), Eternal X 116 + 3 known, EI 123 + 9 known, 0 mismatches / errors.
Step 7 notes: `Totem Battles.txt` is in the main checkout's `hacks/photonic-sun/.src/txt/` (two-column PDF layout:
two battles side by side; Aura row like "Defense +1", "Speed +2", "All stats +1"); the calc's trainer import
(`toEngine` in `template/calc.js`) already reads a trainer mon's `stg` (5 entries), so step 8 maps `au` onto it.
User (2026-10-25): Photonic and Eternal X change no weights, so their W2 is a check (stock weights, forms only), and any
form with no stock weight is looked up online (Bulbapedia; cite it). EI changes none either but has custom forms
(hack Megas, Pikachu costumes...): use the expansion source's `species_info` weight where it has one, else online, else
list it as undocumented in its notes (stays on the base weight).
Dynamic power beyond weight / HP / speed (state toggles, counters) and the full form-weight pass: `plans/calc-dynamic-power.md`
(later sessions; W2 uses its weight list).
Session 2 models: Sol (`delegate_task`, T3 worktrees start from main, so give it this branch's worktree path or use
the Agent tool) for F / W / Z; Haiku medium (Agent tool) for T and A; U3 is the orchestrator's (mockup first). The shared
Haiku brief below works for Sol too. `calc-residual.mjs` runs on EI only (the others SKIP: EI fixtures).

**U3 (Opus, template; user request 2026-10-25)**: Triple Kick / Triple Axel rows get a hit button like the multi-hit
moves' ×n button, cycling Hit 1 / Hit 2 / Hit 3 / Total; the row's outside damage number shows the chosen hit's range
(or the sum for Total). Percent and KO text stay on the total, as for multi-hit moves. Default: Total. Persist with
the existing per-slot state (`ST.hits` / `ST.mvo`), no new storage key. Scenario at every viewer size, normal / dvkb.

Engine: `tools/calc/` (README). Hack rules go in `hack.json` → `cfg.calc` and plug into the engine's fixed **phases**
(`beforeStats`, `attackMods`, `powerMods`, `finalMods`, `effectiveness`, `critical`, ...: README → phase table). A
mechanic that no phase can express needs a new phase in `tools/calc/src/rules.js`: shared code, Opus only.

## User decisions (2026-10-25; record each in the notes where it applies)
- **Protean / Libero**: no switch or type history. The calc gives STAB on every move (stock `@smogon/calc` already
  does this in `getStabMod`, `mechanics/util.js`; check it in Gen 6 / 7 too) and every other boost that depends on
  the attacker's type follows. The edit menu of a Pokémon with Protean or Libero gets a type choice (its current
  type, for the defending side: effectiveness and anything else that reads its types). Built (U1).
  Hardlove's source is once per switch-in for Protean: the user accepts every-move STAB; say so in its notes.
- **Battle Bond**: manual stat stages. Done; no work.
- **Residual damage and recovery**: counted in the KO text (2HKO 63% and so on), never in the damage numbers or
  percentages. The result shows a short note of how much residual damage / recovery each side takes per turn
  (Leftovers, Black Sludge, burn, poison / toxic, sand / hail, Grassy Terrain, Leech Seed if the UI can say it,
  the hack's own end-of-turn abilities: EI's Self Sufficient and Parasitic Waste), with a quick way to subtract
  it from current HP. Built (U2); Leech Seed left out (no control says who is seeded); Parasitic Waste heals on the hit, not at end of turn.
- Out of scope here: turn-order UI and trainer-field UI (later decide sessions), the save readers.

## Orchestrator (the Opus session)
1. Start order (CLAUDE.md → Where a session works): claim the worktree, `git status`, read this file, the four
   notes.md → Damage calc sections only as far as a unit needs them.
2. Dispatch each Haiku unit with the Agent tool (`model: haiku`, `effort: medium`), one at a time in this worktree
   (they share `tools/calc/` and its tests). Survey units S1–S3 only read and write their own plan file, so they may
   run in parallel; the orchestrator commits them.
3. Each agent gets the shared brief (below) plus its unit's lines. Pass findings forward as a short list, never a
   whole report.
4. After each agent: read its report and diff (`git show --stat`), rerun the hack's checks, then the next unit.
   Rows an agent marked **Needs Opus** are the orchestrator's: do them, or list them in the hack's notes as open.
5. (Done in session 1.) Build U1 and U2 yourself (template work, one at a time): a mockup at the viewer sizes in the Thor frame on the
   phone preview first (CLAUDE.md → Workflow, Showing pages), the user approves, then build it, then its scenario.
6. Finish: unit A (audit), update notes / `plans/damage-calc-sessions.md` → Status / PROGRESS.md → Open 2, delete
   this file if everything is done (or leave only what's open), ask before pushing, delete the claim.
Budget: past ~120 requests or ~250k context, write the handover in this file (which units are done) and stop.

### Shared Haiku brief (paste at the top of every unit)
```text
Worktree: .claude/worktrees/damage-calc (branch worktree-damage-calc). Read .agents/references/worker-brief.md
(Context budget, Commits) and .agents/references/calc-mechanics.md (Procedure, Things that have bitten). Keep your
context under ~90k: read sections with sed -n / grep, never whole data.json, notes or built HTML; send command output
to .tmp/calc-refine/<unit>.log and print only the summary.
Own only: hacks/<hack>/hack.json → cfg.calc, hacks/<hack>/calc_matchups.json, hacks/<hack>/notes.md → Damage calc,
plans/calc-refine-<hack>.md, and any file named in your unit. Never edit tools/calc/src/, template/, extract
scripts or another hack's files. Never copy hzla's code or tables (oracle, run locally only).
A point that needs a new engine phase, a UI change, a shared-code change or a judgement you can't settle from the
source / oracle: write it under "Needs Opus" in plans/calc-refine-<hack>.md with the evidence and go on.
Checks before each commit: npm test --prefix tools/calc; the hack's checks (below); python -I tools/datajson.py
hacks/<hack>/hack.json. Commit after each row or small group (WIP: when incomplete), files by name, no trailers,
never .claude/ or .tmp/. Do not push. End with: commits, rows done, Needs Opus rows, checks and results.
```
Hack checks: Hardlove `node tools/calc/hardlove_check.mjs` (no oracle: never `hzla_compare` it);
Photonic `node tools/calc/photonic_check.mjs` + `node tools/calc/hzla_compare.mjs photonic-sun`;
Eternal X `node tools/calc/eternal_check.mjs` + `node tools/calc/hzla_compare.mjs eternal-x`;
EI `node tools/calc/imperium_check.mjs` + `node tools/calc/hzla_compare.mjs emerald-imperium`.

## Units, in order
| Unit | Model | Job |
| --- | --- | --- |
| F Hardlove flags | Haiku | Compare the hack's punch, bite, pulse, sound, slicing, recoil and secondary-effect move lists in the hg-engine source (grep the ability handlers: Iron Fist, Strong Jaw, Mega Launcher, Punk Rock / Liquid Voice, Sharpness, Reckless, Sheer Force) with `MV.f`. Write the diff to the plan file. Fixes go through `hgengine.move_flags()` (extract, owned for this unit only) and a rebuild of data.json; one fixture per flag class that changed. If the source has no list for a class, say so: it stays on the Gen 9 default. |
| W2 Weight / auto-power moves | Sol, one agent per hack | Weights and power are now automatic (tools/calc/README → `varpow`, species weights). Compare every guide species' engine weight (stock name, `weightNames()` fallback, or 1 kg) with the hack's own source weights where it has them (Hardlove: Species.c, W's list in its plan file; EI: expansion species_info; Photonic / Eternal X: stock games, so only hack forms and Megas); set `over.species[id].weightkg` for each difference (hack Megas first). Check the hack's weight / HP / speed power bands against its source (Hardlove: inclusive Low Kick / Grass Knot thresholds, a `movePower` rule if the engine context exposes weights, else Needs Opus; Maushold 2.8 kg). Fixtures without a set power: one per move class (weight, weight ratio, HP, speed), plus one regional form and one hack Mega. Convert Hardlove's W manual-power fixtures where they now duplicate. |
| Z Photonic Z-moves / Totem | Haiku | Z-move power fixtures (a few base-power bands, a signature Z) against the oracle; if the calc page has no way to pick a Z-move, Needs Opus (UI). Totem aura: a disposition line only (manual stat stages cover it). |
| T In-game test cards | Haiku, all four hacks in one agent | From each hack's notes (open in-game points) and its existing fixtures, write exact setups (species, level, nature, IVs, move, field) with the expected 16 rolls, as a "In-game tests" list in each notes.md → Damage calc. Text only. |
| A Audit | Haiku | `plans/damage-calc-sessions.md` → "Audit the calc", plus the hack checks above. Pass / fail with evidence. |

Unit T also lists the in-game points settled this session: Hardlove Explosion / Self-Destruct (not halved), Rage Fist
(flat 100), Protean on a second off-type move; EI and Eternal X Triple Kick 20 / 40 / 60; EI Self Sufficient / Frostbite
turn-end amounts.

Template changes (U1, U2) are shared by every guide: `python assemble.py`, then `node tools/domcompare.mjs` against
the previous build with `--routes '#/calc'` (and `--kb`) for every guide.
