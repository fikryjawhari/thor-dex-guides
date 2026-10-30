# Save reader for a save family

One reader per save family, plus the hack's ID tables. Interface, formats and supported families:
`template/calc/readers/README.md` → Interface and Reader coverage. Reference-use rules:
`tools/calc/README.md` → Licences, oracles and checking a hack.

## Inputs
- A battery save (`.sav`, `.srm`, `.dsv` or decrypted `main`) in `hacks/<hack>/.src/saves/` (git-ignored).
  Use the user's save, a public fixture or a locally generated PKHeX oracle; never commit it.
- `<name>.expected.json` in the same directory: party and boxes written by hand or exported independently from
  PKHeX, in the guide's names. Format: `tools/README.md` → Calc checks and the save check.
- `template/calc/readers/test.js`: the synthetic reader for page checks.

## Procedure
1. **Format notes.** Add the family's layout, slot/section/checksum/newest-slot rules, Pokémon blocks/encryption/
   offsets and form encoding to `template/calc/readers/README.md`. Cite the pinned source or format reference.
   Write notes from references, then implement independently; do not translate their code.
2. **Reader.** Implement `template/calc/readers/<family>.js` against the documented Interface. Keep it synchronous,
   dependency-free and separate from hack ID tables. Validate containers and checksums; distinguish wrong game,
   save state, unreadable and empty saves.
3. **ID tables.** The hack's extract writes `data.json` → `GID {sp, mv, ab, it, gr}` from its game-data sources.
   `gr` supplies growth rates for boxed levels; map `species:form` keys where forms are stored separately.
   `tools/schema.py` already accepts `GID`; schema details: `hacks/emerald-imperium/notes.md` → Data schema.
   Reuse `tools/expansion_ids.py` for expansion data or `tools/ctrguide.py` → `build_save_ids` for 3DS data.
4. **Switch it on.** Set `hack.json` → `cfg.calc.save = "<family>"` (a base profile only when every family member
   uses that reader), then `python -I tools/datajson.py hacks/<hack>/hack.json` and `python assemble.py <hack>`.
5. **Checks.** Run `node tools/calc_save_check.mjs dist/<hack>.html <save> <expected.json>`. Test wrong-game,
   emulator-state, corrupted and empty controls, plus `node tools/scenarios/calc-import.mjs dist/<hack>.html`
   and `node tools/scenarios/calc-bridge.mjs dist/<hack>.html`. Page fixtures do not replace real-reader checks.
   With local oracle readers instead of a PKHeX export (CFRU: Unbound-Cloud and hzla), dump each oracle per save as
   normalised JSON, compare the reader with every oracle slot by slot (party and each box position; personality,
   species, level, nature, ability, item, moves, IVs, EVs) and name each difference as one oracle's documented rule,
   or fix it; the target is zero unexplained. Write the per-save `expected.json` from the oracles, never from the
   reader, and add a node check to `tools/calc/package.json` that skips when the saves are absent. Model:
   `tools/calc/cfru_oracles.mjs`, `cfru_compare.mjs`, `cfru_check.mjs` (`template/calc/readers/README.md` → cfru).
   Levels from experience: check the growth table against the hack's own table and against saves (freshly caught
   Pokémon sit exactly on a level's value), not only against the decomp formulas: Unbound's differs.
6. **Notes.** Record the family, table sources, save/version checked and unmapped IDs in the hack's notes.md →
   Damage calc → Save import. Commit authorised steps by named files, without trailers.

Do not assume another hack shares a layout: CFRU differs from expansion, and each CFRU hack has its own profile in
`cfru.js` (signature, boxes, randomiser flags, experience table); other Gen 4 games and Gen 5 need their
own validated layouts/readers. Dex Viewer's app implementation is in the sibling `thor-offline-viewer` repository;
`tools/scenarios/calc-bridge.mjs` checks the guide-facing bridge with a fake app, not a real device import.
