# Emerald Imperium docs

Fetched 2026-10-18 (v1.3 / 1.3.1) from the official docs folder linked from [emeraldimperium.info](https://emeraldimperium.info/):
[Google Drive](https://drive.google.com/drive/folders/1auRPBg8Ts50NByIskMy6b2XHnmNqIKtV). Where each input is used:
`notes.md` → Sources and rules.

## Files

| File | Contents |
| --- | --- |
| `1.3.1 Emerald Imperium Changes (Stats, Types, Abilities, Moves).xlsx` | Pokémon, move and ability changes, vanilla vs EI per species |
| `Pokemon Routes, Gift Mons, and Eggs.pdf` | Wild tables, statics, gifts, eggs, roamers (pages 70–77 were transcribed by hand) |
| `Emerald Imperium 1.3 Encounter Tracker.xlsx` | Official area order and grouping, starter choice, Hot House tiers, egg pools (the build used a pasted text copy) |
| `Item (TMs, Mega Stones, etc) and Useful NPC Locations .xlsx` | TMs/HMs, Mega Stones, marts, NPCs, battle item rewards |
| `Cheat Codes.txt` | Cheat codes (the Drive doc, exported as text) |
| `Boss Battles.xlsx` | Official boss sheet: order, titles, places, leads, rewards, pokepaste links |
| `Known Bugs.txt`, `New Mega's Data and Differences from RR.txt`, `Randomizer Abilities.txt`, `Links.txt`, `-Credits- ….txt` | Not used by the build; kept for reference |
| `site/walkthrough.html` | [emeraldimperium.info/walkthrough.html](https://emeraldimperium.info/walkthrough.html), transcribed by hand into `extract/walk.txt` |
| `repos/eidex.zip` | [miriamlefae/eidex](https://github.com/miriamlefae/eidex) (source of dex.emeraldimperium.net) at `361c7d5` (2026-03-14; `src/data` last changed 2025-08-03). Species, moves, abilities, items, types, wild tables, sprites |
| `repos/hzla/imp_1-3.js`, `title_to_backup_mappings.js` | [hzla/Dynamic-Calc-Decomps](https://github.com/hzla/Dynamic-Calc-Decomps) `backups/` at `f3f4140` (2026-04-05, the last change to `imp_1-3.js`). The game's own trainer sets: **the authority for boss sets** |
| `repos/expansion/moves_info.h` | [iriv24/pokeemerald-expansion](https://github.com/iriv24/pokeemerald-expansion) at `2576d0f` (the release's source, notes.md → Damage calc): each move's crit stage (`MV.cr`; eidex has none) |
| `repos/expansion/include/…`, `src/…` | The same commit: constants (species, moves, abilities, items), names (`src/data/abilities.h`, `items.h`), growth rates (`src/data/pokemon/species_info*.h`) for the save importer's `GID` (`extract/gid.py`); `pokemon.h`, `global.h`, `save.h`, `save.c`, `pokemon.c`, `pokemon_storage_system.h` are the save format (`template/calc/readers/README.md`) |
| `saves/` | Save-reader test files (2026-10-27) from [hzla/Dynamic-Calc-Decomps](https://github.com/hzla/Dynamic-Calc-Decomps) `cypress/fixtures/` at `ecb3a77`: an EI 1.3 save, an mGBA save state of it, `em_imp.sav` and the paste hzla's importer makes of the save (prefixed `hzla-`); `ei-1.3.expected.json` is written from the paste (`tools/README.md` → Save check) |
| `repos/showdown/moves.js`, `abilities.js`, `items.js` | pokemon-showdown 0.11.11 `dist/data`: move priority, and flags for EI changes and originals; `items.js` the full item names the game squeezes (`GID.it`) |

## Re-fetch

Source updates: `watch.json` (`uv run python -I tools/check_updates.py emerald-imperium`).

```bash
D=hacks/emerald-imperium/.src
python -I tools/drive_ls.py 1auRPBg8Ts50NByIskMy6b2XHnmNqIKtV $D
mkdir -p $D/site $D/repos/hzla $D/repos/showdown
curl -sL -A "Mozilla/5.0" https://emeraldimperium.info/walkthrough.html -o $D/site/walkthrough.html
curl -sL https://codeload.github.com/miriamlefae/eidex/zip/361c7d51bb5c301d9917f22222703db2a36e908a -o $D/repos/eidex.zip
for f in imp_1-3.js title_to_backup_mappings.js; do
  curl -sL "https://raw.githubusercontent.com/hzla/Dynamic-Calc-Decomps/f3f4140feb2458bb9f9aecbeb06d6ced6b217ee0/backups/$f" -o $D/repos/hzla/$f
done
mkdir -p $D/repos/expansion
curl -sL https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/src/data/moves_info.h -o $D/repos/expansion/moves_info.h
for f in include/pokemon.h include/global.h include/save.h include/pokemon_storage_system.h src/save.c src/pokemon.c     include/constants/{species,moves,abilities,items,pokemon,global}.h src/data/{abilities,items}.h     src/data/pokemon/species_info.h src/data/pokemon/experience_tables.h src/data/pokemon/species_info/gen_{1,2,3,4,5,6,7,8,9}_families.h; do
  mkdir -p $D/repos/expansion/$(dirname $f)
  curl -sL https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/$f -o $D/repos/expansion/$f
done
mkdir -p $D/saves
for f in "saves/Emerald Imperium 1.3.sav" "saves/Emerald Imperium 1.3.ss1" saves/em_imp.sav "texts/Emerald Imperium 1.3_save_paste.txt"; do
  curl -sL "https://raw.githubusercontent.com/hzla/Dynamic-Calc-Decomps/ecb3a7762cf47f776eeac8ce3f53c2f4efad7336/cypress/fixtures/${f// /%20}" -o "$D/saves/hzla-$(basename "$f")"
done
for f in moves.js abilities.js items.js; do curl -sL https://cdn.jsdelivr.net/npm/pokemon-showdown@0.11.11/dist/data/$f -o $D/repos/showdown/$f; done
```

For a new EI version, check for newer data first: the Drive folder's file names carry the version, and
`curl -s "https://api.github.com/repos/<repo>/commits?per_page=1"` gives each repo's latest commit (for the calc, add
`&path=backups/<file>` and look for a new entry in `title_to_backup_mappings.js`). The `Archives` and `Changelogs`
Drive subfolders are not downloaded. Don't download the whole calc repo (about 200 MB); only the two files above.

The DexNav site (map.emeraldimperium.net / imperiummap.com) and NBurhans/emerald-imperium are not used. PDF text comes
from `pdfplumber` (`extract/pdfwild.py`) and the statics, gifts and eggs on the PDF's pages 70-77 are transcribed in
`extract/specials.py` (the continuation pages shift columns).
