# Save reader for a save family

The procedure for importing a hack's save into the damage calc: one reader per save family, plus the hack's ID tables.
The interface: `plans/damage-calc.md` → Build step 1 (Save readers); the formats and families: → Save reading;
licences: → Licenses (hzla's readers and PKHeX are read-only references: write the format down as notes, then write
our own reader from the notes, never translate their code).

## Inputs
- The user's battery save (`.sav` / `.dsv` / `main`) in `hacks/<hack>/.src/saves/` (git-ignored), and the party and
  boxes written out by hand or exported from PKHeX into `hacks/<hack>/.src/saves/<name>.expected.json` (the format:
  `tools/README.md` → calc_save_check).
- `template/calc/readers/test.js`: the smallest working reader, and what the page expects back.

## Procedure
1. **Format notes.** In `template/calc/readers/README.md` (create it with the first reader): per family, the save
   layout (slots, sections, checksums, the newest-slot rule), the Pokémon struct (block order, encryption, field
   offsets) and how forms are stored, each with its reference (PKHeX file / Bulbapedia page / hzla reader read).
2. **Reader.** `template/calc/readers/<family>.js`: `READERS['<family>'] = (bytes, D) => ({game, party, boxes})` in
   game IDs, or `throw {code: 'wrong' | 'state' | 'unreadable' | 'empty', game}`. Plain JS, no dependencies, no game
   tables (those are the hack's). Fast and synchronous.
3. **ID tables.** The hack's extract writes `data.json` → `GID {sp, mv, ab, it}` (game id → our species id / `M`
   index / `AB` index / item name), from the same sources as the rest of its data (expansion constants, the NARCs,
   the 3DS game files). Add `GID` to `tools/schema.py` ORDER the first time (optional key) and to the Data schema in
   `hacks/emerald-imperium/notes.md`. Forms: map `species:form` keys where the family stores forms apart.
4. **Switch it on.** `hack.json` → `cfg.calc.save = "<family>"` (or in the family's base profile when every hack of
   it uses the same reader), then `python -I tools/datajson.py hacks/<hack>/hack.json` and `python assemble.py <hack>`.
5. **Checks.** `node tools/calc_save_check.mjs dist/<hack>.html <save> <expected.json>` passes; a save of another
   game gives `wrong`, an emulator save state `state`, a corrupted copy `unreadable`; `node
   tools/scenarios/calc-import.mjs` still passes. Logs in `.tmp/calc-save-<hack>/`.
6. **Notes.** The hack's `notes.md` → Damage calc: the family, the tables' source, what was checked with which save,
   unmapped IDs. Commit after each step (`WIP:` when incomplete), named files only, no trailers.

Families and their first hacks (plans/damage-calc.md → Order): Gen 3 (Emerald Imperium; CFRU saves differ), Gen 4
(Hardlove Gold), Gen 5 (Blaze Black 2 Redux), Gen 6/7 (Photonic Sun, Eternal X). In Dex Viewer the file picker also
needs the app change (a separate step in `../thor-dex-viewer`).
