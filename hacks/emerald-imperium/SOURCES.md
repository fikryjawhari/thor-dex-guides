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
| `repos/showdown/moves.js`, `abilities.js` | pokemon-showdown 0.11.11 `dist/data`: move priority, and flags for EI changes and originals |

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
for f in moves.js abilities.js; do curl -sL https://cdn.jsdelivr.net/npm/pokemon-showdown@0.11.11/dist/data/$f -o $D/repos/showdown/$f; done
```

For a new EI version, check for newer data first: the Drive folder's file names carry the version, and
`curl -s "https://api.github.com/repos/<repo>/commits?per_page=1"` gives each repo's latest commit (for the calc, add
`&path=backups/<file>` and look for a new entry in `title_to_backup_mappings.js`). The `Archives` and `Changelogs`
Drive subfolders are not downloaded. Don't download the whole calc repo (about 200 MB); only the two files above.

The DexNav site (map.emeraldimperium.net / imperiummap.com) and NBurhans/emerald-imperium are not used. PDF text comes
from `pdfplumber` (`extract/pdfwild.py`) and the statics, gifts and eggs on the PDF's pages 70-77 are transcribed in
`extract/specials.py` (the continuation pages shift columns).
