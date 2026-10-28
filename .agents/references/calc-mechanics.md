# Calc mechanics for a hack

The procedure for `cfg.calc` (the damage calc's profile) and `calc_matchups.json` (the fixtures) for one hack.
The engine and its phases: `tools/calc/README.md`. The EI example, with every source line: `hacks/emerald-imperium/notes.md`
→ Damage calc. Licences (what may be reused): `tools/calc/README.md` → Licences, oracles and checking a hack.

## Inputs
- The hack's own source, if it has public source (expansion hacks: `include/config/battle.h` for the switches,
  `src/battle_util.c` for the damage functions). Fetch a pinned release shallowly into `.tmp/source/` (git-ignored):
  `git init`, `git remote add origin <url>`, `git fetch --depth 1 --filter=blob:none origin <sha>`, then
  `git show FETCH_HEAD:<path>` per file. Never `git grep` a blobless clone (it fetches every blob).
- The hack's docs, changes sheet and known-bugs list in `hacks/<hack>/.src/` (re-fetched with its `SOURCES.md`).
- The oracle: hzla's Dynamic-Calc-Decomps. Find the hack's entry in `js/romhack_catalog.js` and its backup in
  `backups/title_to_backup_mappings.js` (the `data`, `gen`, `dmgGen`, `types` and `noSwitch` values).
  Pin and run it with the comparison harness: `tools/calc/README.md` → Local hzla oracle.
  Eternal X uses the older Dynamic-Calc. Hardlove Gold has source/stock fixtures, not an independent hack oracle;
  use its source and in-game tests. Reference-use rules and possible alternative oracles belong in the engine README.

## Procedure
1. **Settings.** Record `gen`, `damageGen` (the link's `dmgGen`), `types`, `critGen`, backup and title in
   `calc_matchups.json` → `oracle`. Check the hack's own config (`battle.h` or equivalent): if its switches are `GEN_LATEST`, the base is
   determined by the pinned source (`expansion` currently uses Gen 9), not the oracle's setting. A difference that no fixture exercises is
   recorded, not forced.
2. **Profile.** `hack.json` → `cfg.calc = {base, ...}`, plus the calc's own storage key `cfg.ls.dmg` (`<prefix>dmg`;
   `assemble.py` stops without it). Keep only what the hack changes:
   - `status` when a label or key differs (restate the whole list: arrays replace).
   - `over.abilities` / `over.items` `{effect: ""}` to disable a native effect the hack changes, and `effect: "<name>"`
     only when the same effect exists under another name. Never alias a move to a name another guide move uses.
   - `over.moves` for basepower/type/flags data; use a rule for behaviour that depends on another name.
   - `over.rules` for each changed mechanic, each with `note` and a source citation in the hack's notes.
   Run `python -I tools/datajson.py hacks/<hack>/hack.json`.
3. **Fixtures.** `calc_matchups.json` → `matchups`: one per changed mechanic, plus negative cases (the ability on a
   move it does not affect), a neutral baseline and the edge cases the rule's `when` tests. Use guide IDs and
   display names. Run `node tools/calc/hzla_compare.mjs <hack> --fetch --output .tmp/calc-<hack>/compare.json`.
   Read each result's notes and rolls: a match where neither side applied the mechanic proves nothing.
4. **Differences.** A mismatch: find which side the source supports. If the source supports ours, add
   `difference: {source, reason}` to the matchup (it reports `known-difference`); if it supports the oracle, change
   the profile. Record the verdict in the hack's notes.
5. **Engine.** Only if a mechanic cannot be expressed with the phases. Add the phase in `tools/calc/src/rules.js`
   and `tools/calc/instrument.mjs`, hand-check the numbers in `tools/calc/test.mjs`, document it in `tools/calc/README.md`
   (phase table and the hzla mapping), then `node tools/calc/build.mjs` and commit `template/calc/engine.js`.
   Never hard-code a hack's names in the engine.
6. **Checks.** `npm test --prefix tools/calc`, the comparison (every case `match` or an explained
   `known-difference`), `python -I tools/datajson.py hacks/<hack>/hack.json`, `python assemble.py <hack>`.
   Comparison reports go in `.tmp/calc-<hack>/`. Page/data verification: `.agents/skills/verify/SKILL.md`.
7. **Notes.** `notes.md` → "### Damage calc": the profile's base and why, a table of each override with its source
   line and fixtures, the doc/source disagreements (source followed), the known gaps, and what was not checked
   (in-game test: `tools/calc/README.md` → Licences, oracles and checking a hack).
8. **Commit.** WIP commits per step, named files only, no trailers. Do not push.

## Things that have bitten
- A native function's own parameter named like a loop counter (`hit`) can overwrite the loop's state; the engine
  keeps the loop's counters authoritative. Check a hook in the second hit, not only the first.
- Smogon's `pokeRound` rounds half down; the source's `uq4_12_multiply_by_int_half_down` also rounds half down.
  Check a rounding claim with a number, not from memory.
- An alias to `Shell Side Arm` (Smogon's category rule) shares one engine record with a hack's own move of that name;
  EI has one, so Draco Barrage uses a `beforeStats` rule instead.
- Species names reach the engine only through `speciesName()` (`tools/calc/src/names.js`: accents stripped,
  ♀ / ♂ → -F / -M, Mega / Primal reordered). Never match raw guide names against stock or source names (a raw
  "Nidoran♀" loses its distinction from Nidoran-M); run them through `speciesName()` first.
