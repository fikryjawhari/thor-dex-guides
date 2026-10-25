# Calc refinement: one Opus-orchestrated session

One Opus (medium) main chat runs the whole refinement: it dispatches Haiku (medium) agents for the mechanical units
and builds the two UI pieces itself. Everything happens on `worktree-damage-calc` (`.claude/worktrees/damage-calc`).
Delete this file when every unit below is done (CLAUDE.md → When a plan is built and merged).

## Where things stand (2026-10-25)
- Emerald Imperium: refined and checked (109 fixtures: 100 hzla matches, nine documented differences; 10/10 UI
  passes). Nothing left for agents: in-game tests are the user's.
- Hardlove Gold, Photonic Sun, Eternal X: field passes done (notes.md → Damage calc in each). Open: changed move /
  item effects, flag classes (Hardlove), weight-based moves, Z-moves / Totem (Photonic), in-game test cards.
- Engine: `tools/calc/` (README). Hack rules go in `hack.json` → `cfg.calc` and plug into the engine's fixed
  **phases** (`beforeStats`, `attackMods`, `powerMods`, `finalMods`, `effectiveness`, ...: README → phase table).
  A mechanic that no phase can express needs a new phase in `tools/calc/src/rules.js`: shared code, Opus only.

## User decisions (2026-10-25; record each in the notes where it applies)
- **Protean / Libero**: no switch or type history. The calc gives STAB on every move (stock `@smogon/calc` already
  does this in `getStabMod`, `mechanics/util.js`; check it in Gen 6 / 7 too) and every other boost that depends on
  the attacker's type follows. The edit menu of a Pokémon with Protean or Libero gets a type choice (its current
  type, for the defending side: effectiveness and anything else that reads its types). UI unit U1.
  Hardlove's source is once per switch-in for Protean: the user accepts every-move STAB; say so in its notes.
- **Battle Bond**: manual stat stages. Done; no work.
- **Residual damage and recovery**: counted in the KO text (2HKO 63% and so on), never in the damage numbers or
  percentages. The result shows a short note of how much residual damage / recovery each side takes per turn
  (Leftovers, Black Sludge, burn, poison / toxic, sand / hail, Grassy Terrain, Leech Seed if the UI can say it,
  the hack's own end-of-turn abilities: EI's Self Sufficient and Parasitic Waste), with a quick way to subtract
  it from current HP. UI unit U2.
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
5. Build U1 and U2 yourself (template work, one at a time): a mockup at the viewer sizes in the Thor frame on the
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
| S1 Hardlove survey | Haiku | Script-dump `MV.h` (218 moves with notes) and `.src/Move Changes.xlsx` (via `uv run python -I`). Sort every changed move into: *data* (power / type / category / accuracy / PP: already in the guide data, nothing to do), *damage effect* (changes damage, hits, power conditions, category or type rules), *out of scope* (secondary effects, status chance, AI). Write `plans/calc-refine-hardlove.md`: one row per damage-effect move with its source path in `.tmp/calc-hardlove-gold/source/` (grep the move's effect), in batches of at most 8. No rules. |
| S2 Photonic survey | Haiku | Same for Photonic Sun's 38 noted moves (`MV.h`, `.src/Move Changes.pdf`). No source: the oracle settles. `plans/calc-refine-photonic.md`. |
| S3 Eternal X survey | Haiku | Same for Eternal X's 38 noted moves plus `.src/Item Changes _ Locations.pdf` (damage-relevant item changes only). `plans/calc-refine-eternal.md`. |
| B Move batches | Haiku, one agent per batch | Next unticked batch in a hack's plan file. Per row: read the source / oracle behaviour, add a positive and a negative fixture, add an `over.moves` / `over.rules` entry only when an existing rule in a built `cfg.calc` has the same shape (copy its form), tick the row. Hardlove: hand-check one roll in `hardlove_check.mjs` style instead of the oracle. |
| F Hardlove flags | Haiku | Compare the hack's punch, bite, pulse, sound, slicing, recoil and secondary-effect move lists in the hg-engine source (grep the ability handlers: Iron Fist, Strong Jaw, Mega Launcher, Punk Rock / Liquid Voice, Sharpness, Reckless, Sheer Force) with `MV.f`. Write the diff to the plan file. Fixes go through `hgengine.move_flags()` (extract, owned for this unit only) and a rebuild of data.json; one fixture per flag class that changed. If the source has no list for a class, say so: it stays on the Gen 9 default. |
| W Weight moves | Haiku, one agent per hack | Low Kick, Grass Knot, Heavy Slam, Heat Crash fixtures against forms and species whose weight could differ from stock (Megas, regional and hack forms). List species the engine has no weight for under Needs Opus. |
| Z Photonic Z-moves / Totem | Haiku | Z-move power fixtures (a few base-power bands, a signature Z) against the oracle; if the calc page has no way to pick a Z-move, Needs Opus (UI). Totem aura: a disposition line only (manual stat stages cover it). |
| P Protean / Libero check | Haiku | One fixture per base (Gen 6, Gen 7, Gen 9) with a Protean / Libero attacker using an off-type move: STAB applies. EI, Photonic, Eternal X: compare with the oracle; Hardlove: hand-check. If a base lacks it, Needs Opus. |
| T In-game test cards | Haiku, all four hacks in one agent | From each hack's notes (open in-game points) and its existing fixtures, write exact setups (species, level, nature, IVs, move, field) with the expected 16 rolls, as a "In-game tests" list in each notes.md → Damage calc. Text only. |
| U1 Protean / Libero type | Opus (orchestrator) | Edit-menu type choice for Pokémon with Protean / Libero (decision above). Mockup → user OK → build → scenario in `tools/scenarios/` at all viewer sizes, normal / dvkb; persists in the existing calc storage object (no new localStorage key). |
| U2 Residual in KO text | Opus (orchestrator) | KO text includes per-turn residual damage / recovery (decision above); damage rolls and percentages unchanged. Result note with the per-turn amounts and a quick subtract-from-HP control. Engine side: `knockout()` in `tools/calc/src/adapter.js` takes a per-turn HP change; hand-checked tests in `tools/calc/test.mjs`; `node tools/calc/build.mjs`. Hack end-of-turn abilities via the profile, not hard-coded names. Mockup first, as U1. |
| A Audit | Haiku | `plans/damage-calc-sessions.md` → "Audit the calc", plus the hack checks above. Pass / fail with evidence. |

Template changes (U1, U2) are shared by every guide: `python assemble.py`, then `node tools/domcompare.mjs` against
the previous build with `--routes '#/calc'` (and `--kb`) for every guide.
