# Damage calc: what each session does

The one page a calc session reads first. Find the prompt below, do what it says. Everything here happens on
`worktree-damage-calc` (`.claude/worktrees/damage-calc`); sessions start in that worktree, not on `main`.
Delete this file with `damage-calc.md` once the calc is merged and the last reader is done.

## Every session
1. `git status`, check `.claude/claim` (someone else there: say who and since when, ask). Write your claim.
   If `.venv` or `hacks/*/.src/` are missing: `python -I tools/worktree_setup.py <hack> --session <name>`.
2. Model check (CLAUDE.md → Which model): every job below is Sol (`gpt-6.1-sol`, run directly as the session, no
   orchestrator) or Opus medium. Haiku medium only for the audit.
3. One hack / one reader per session, one session at a time (they share `tools/calc/` and `template/calc/`).
4. Commit after each sub-step (`WIP:` when incomplete). Stage by name, never `.claude/`.
5. End: update the hack's notes.md → Damage calc, this file's Status, PROGRESS.md → Open 2; run the checks
   (below); ask before pushing (branch + what's new); delete the claim.

## "Let's do <hack> calc mechanics"
Hacks, in order: Hardlove Gold, Photonic Sun, Eternal X (Emerald Imperium is done).
- Procedure: `.agents/references/calc-mechanics.md` (inputs, settings, profile, fixtures, "Things that have bitten").
- The hack's oracle and rules: `damage-calc.md` → Calc references per hack.
- Worked example: `hacks/emerald-imperium/notes.md` → Damage calc. Engine: `tools/calc/README.md`.
- Output: `hacks/<hack>/hack.json` → `cfg.calc`, `hacks/<hack>/calc_matchups.json`, a notes.md → Damage calc section,
  matchups matching the oracle's 16 rolls.
- Never copy hzla's code or tables (`damage-calc.md` → Licenses); his calc is a local oracle only.
- **Hardlove Gold** has no hzla calc: its battle rules are in the references table (anything unlisted = Gen 9); try
  hzla's ROM importer as an oracle; where nothing settles a point, write the in-game test for the user and stop.
- **Eternal X** uses the older hzla/Dynamic-Calc, not Decomps.

## "Let's refine <hack> calc mechanics"
After all four first passes. Start from the hack's notes.md → Damage calc open points. EI's 2026-10-25
refinement dispositions settle `noSwitch`, `evs=0` and the original gaps, with individual controls built;
turn-order / trainer-field UI, healing simulation and in-game confirmation remain explicitly separate.
Same procedure, same checks; add fixtures for each point settled.

Trainer field preparation is separate from mechanics refinement: `plans/trainer-field-conditions.md` records
the data-only pass. Trainer `field` evidence is rebuild-safe; no UI applies it. Settle the field UI in a later
decide session; preserve random/unknown conditions rather than silently choosing calc defaults.

## "Let's do the Gen <n> save reader"
Order: Gen 3 + Emerald Imperium's ID tables, then (after the app's file picker) Gen 4 (Hardlove Gold), Gen 6/7
(Photonic Sun, then Eternal X). Gen 5 waits for the Blaze Black 2 Redux guide.
- Procedure: `.agents/references/calc-save-reader.md`. Formats and families: `damage-calc.md` → Save reading;
  interface: → Build step 1. The smallest reader: `template/calc/readers/test.js`.
- Needs the user's save in `hacks/<hack>/.src/saves/` plus its `.expected.json`: ask for it first if missing.
- hzla's readers, PKHeX, PokeDaisy: read-only. Write the format as notes, then our own reader from the notes.
- Template change: only one template session at a time (CLAUDE.md → Parallel sessions).

## "Let's do the file picker"
Not in this repo: the app repo `../thor-dex-viewer`. What the guide expects: `damage-calc.md` → Getting the save
into the guide. Do it after the Gen 3 reader works with a pasted / dropped file.

## "Audit the calc"
Haiku medium agent: `python assemble.py`, `uv run python -I tools/gate.py check <hack>` for every guide,
`node tools/domcompare.mjs` against main's build with `--routes '#/calc'` and `--kb`, `tools/scenarios/calc-*.mjs`,
`node tools/calc_save_check.mjs`; pass / fail with evidence.

## "Let's merge the calc"
Opus main chat, when the user trusts the mechanics (the user decides; not before). Merge `main` into the branch,
rebuild, audit (above), put every guide in the Thor frame on the phone preview, user approves, then merge into
`main` (CLAUDE.md → Merge order), ask before pushing, delete the worktree and branch locally and on `origin`.
Fold lasting decisions into `template/README.md` and notes.md, then delete `damage-calc.md` (and this file once the
readers are done, or move what's left to a new plan).

## Checks (every session that changes calc data or code)
`npm test --prefix tools/calc` (engine tests), `node tools/calc/hzla_compare.mjs <hack> [--fetch]` (fixtures vs the
oracle; `run.mjs` usage: `tools/calc/README.md`), `python assemble.py`,
the calc scenarios for the hack. Put the build on the phone preview (`python -I tools/preview.py dist/<hack>.html
calc-build.html --frame`) when the page changed.

## Status
- Mechanics: Emerald Imperium refined 2026-10-25 (109 fixtures: 100 exact hzla matches, nine documented differences).
  Conditional Bull/Quill Rush and Illusion, allied Emperor's Presence, integer Draco category selection/inversion,
  Blazing Soul priority, Ice Eater immunity and Defeatist's one-third threshold are covered. Individual checkboxes,
  visible Auto/Inverted category state and the allied field control pass all five viewer sizes in normal/dvkb mode.
  `noSwitch` is AI switch prediction, not damage; `evs=0` is the no-EVs catalog variant, not an EI-wide EV ban.
  Source/stock checks pass; broader turn-order / trainer-field UI, healing simulation and in-game tests remain.
  Phone preview: `calc-imperium-refined.html`. Hardlove Gold provisional/source-checked (53 checks, 10 UI passes),
  no independent oracle; in-game tests and type-history states open (notes.md → Damage calc). Photonic Sun field
  pass done (107 cases: 101 exact hzla matches, 6 documented oracle defects; stock Gen 7 checks and 10 UI passes).
  Eternal X field pass done (97/97 exact legacy Dynamic-Calc matches; stock Gen 6 checks, 10 UI passes,
  data gate 5/5, consistency normal/dvkb). Phone preview: `calc-eternal.html`. Individual-effect refinements
  and in-game checks remain for Photonic/Eternal X; other refinements to do. Hardlove imports are 0.8.4;
  guide remains 0.8.3.
- Readers: none (only the `test` reader). File picker: not started.
- Merge: not merged; waiting on the mechanics.
