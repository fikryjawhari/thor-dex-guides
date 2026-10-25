# Calc mechanics for a hack

The procedure for `cfg.calc` (the damage calc's profile) and `calc_matchups.json` (the fixtures) for one hack.
The engine and its phases: `tools/calc/README.md`. The EI example, with every source line: `hacks/emerald-imperium/notes.md`
→ Damage calc. Licences (what may be reused): `plans/damage-calc.md` → Licenses.

## Inputs
- The hack's own source, if it has public source (expansion hacks: `include/config/battle.h` for the switches,
  `src/battle_util.c` for the damage functions). Fetch a pinned release shallowly into `.tmp/source/` (git-ignored):
  `git init`, `git remote add origin <url>`, `git fetch --depth 1 --filter=blob:none origin <sha>`, then
  `git show FETCH_HEAD:<path>` per file. Never `git grep` a blobless clone (it fetches every blob).
- The hack's docs, changes sheet and known-bugs list in `hacks/<hack>/.src/` (re-fetched with its `SOURCES.md`).
- The oracle: hzla's Dynamic-Calc-Decomps. Find the hack's entry in `js/romhack_catalog.js` and its backup in
  `backups/title_to_backup_mappings.js` (the `data`, `gen`, `dmgGen`, `types` and `noSwitch` values). Pin the SHA there.
  Read and run it locally only; never copy its code or tables into the repo.
  Each built hack's hzla link and what it means: `plans/damage-calc.md` → Calc references per hack (Eternal X is on
  the older hzla/Dynamic-Calc). The hg-engine hacks have no hzla calc: use the hack's own rules (Hardlove Gold's are
  there), hzla's ROM importer (https://ddex-chi.vercel.app) as an oracle if it reads the ROM, and the in-game test.

## Procedure
1. **Settings.** Note the oracle's `gen`, `dmgGen`, `types`, `critGen`, backup and title in `calc_matchups.json` →
   `oracle`. Check the hack's own config (`battle.h` or equivalent): if its switches are `GEN_LATEST`, the base is
   the latest generation (`expansion`, Gen 9) whatever the oracle says. A difference that no fixture exercises is
   recorded, not forced.
2. **Profile.** `hack.json` → `cfg.calc = {base, ...}`, plus the calc's own storage key `cfg.ls.dmg` (`<prefix>dmg`;
   `assemble.py` stops without it). Keep only what the hack changes:
   - `status` when a label or key differs (restate the whole list: arrays replace).
   - `over.abilities` / `over.items` `{effect: ""}` to disable a native effect the hack changes, and `effect: "<name>"`
     only when the same effect exists under another name. Never alias a move to a name another guide move uses.
   - `over.moves` for basepower/type/flags data; use a rule for behaviour that depends on another name.
   - `over.rules` for each changed mechanic, each with `note` and a comment or notes line giving its source line.
   Run `python -I tools/datajson.py hacks/<hack>/hack.json` (it re-reads the file: save your edit to disk first).
3. **Fixtures.** `calc_matchups.json` → `matchups`: one per changed mechanic, plus negative cases (the ability on a
   move it does not affect), a neutral baseline and the edge cases the rule's `when` tests. Use guide IDs and
   display names. Run `node tools/calc/hzla_compare.mjs <hack> --fetch --output .tmp/calc-<hack>/compare.json`.
   Read each result's notes and rolls: a match where neither side applied the mechanic proves nothing.
4. **Differences.** A mismatch: find which side the source supports. If the source supports ours, add
   `difference: {source, reason}` to the matchup (it reports `known-difference`); if it supports the oracle, change
   the profile. Record the verdict in the hack's notes.
5. **Engine.** Only if a mechanic cannot be expressed with the phases. Add the phase in `tools/calc/src/rules.js`
   and `instrument.mjs`, hand-check the numbers in `tools/calc/test.mjs`, document it in `tools/calc/README.md`
   (phase table and the hzla mapping), then `node tools/calc/build.mjs` and commit `template/calc/engine.js`.
   Never hard-code a hack's names in the engine.
6. **Checks.** `node tools/calc/test.mjs` (all pass), the comparison (every case `match` or an explained
   `known-difference`), `python -I tools/datajson.py hacks/<hack>/hack.json`, `python assemble.py <hack>`.
   Logs go in `.tmp/calc-<hack>/`.
7. **Notes.** `notes.md` → "### Damage calc": the profile's base and why, a table of each override with its source
   line and fixtures, the doc/source disagreements (source followed), the known gaps, and what was not checked
   (in-game test: `plans/damage-calc.md` → How to check, step 4).
8. **Commit.** WIP commits per step, named files only, no trailers. Do not push.

## Things that have bitten
- A native function's own parameter named like a loop counter (`hit`) can overwrite the loop's state; the engine
  keeps the loop's counters authoritative. Check a hook in the second hit, not only the first.
- Smogon's `pokeRound` rounds half down; the source's `uq4_12_multiply_by_int_half_down` also rounds half down.
  Check a rounding claim with a number, not from memory.
- An alias to `Shell Side Arm` (Smogon's category rule) shares one engine record with a hack's own move of that name;
  EI has one, so Draco Barrage uses a `beforeStats` rule instead.
- The docs can disagree with the source. Read the source's function for each entry before writing a rule.
- Species names reach the engine only through `speciesName()` (`tools/calc/src/adapter.js`: accents stripped,
  ♀ / ♂ → -F / -M, Mega / Primal reordered). Never match raw guide names against stock or source names (a raw
  "Nidoran♀" merged into Nidoran-M in every guide); run them through `speciesName()` first.
