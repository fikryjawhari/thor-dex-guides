# Renegade Platinum docs

Fetched 2026-10-18 (v1.3.0) from the Documentation folder in
[Drayano's Google Drive](https://drive.google.com/drive/folders/0B-zmEVN0Mas6Q3lLbDJDaWNyaVU?resourcekey=0-o98YGOlDJ0JVXXjxoHprIA)
→ "(2018, Platinum) Renegade Platinum" → Documentation.

| File | Contents |
| --- | --- |
| `PokemonChanges.txt` | Stats, types, abilities, level-up moves and TMs for every changed Pokémon |
| `TrainerPokemon.txt` | Every trainer; important ones with items, moves and natures |
| `WildPokemon.txt` | Wild encounters by area |
| `ItemChanges.txt` | Held and evolution item locations, all TM and HM locations, plates, key items |
| `item-locations.csv` | **Use this for the dex.** 698 rows: 270 from `ItemChanges.txt`, 428 vanilla Platinum placements (`source=vanilla`) for items RP does not document |
| `romhackdex/pokedex/` | **Use this for the dex.** [RomHackDex](https://romhackdex.net/renegade-platinum/) pages for all 504 Pokémon and forms: stats, types (with Fairy), abilities, evolutions, level-up, TM, tutor and egg moves, wild locations. `PokemonChanges.txt` only covers what changed |
| `romhackdex/moves.json` | All 467 moves with type, category, power, accuracy, PP, priority and description (`tools/rhd_moves.py`) |
| `romhackdex/locations/`, `abilities/index.html`, `types/` | 100 location pages, ability descriptions, type chart |
| `romhackdex/items/` | 230 item pages; cross-check only, it adds nothing beyond `ItemChanges.txt` |
| `MoveChanges.txt`, `TypeChanges.txt`, `EvolutionChanges.txt`, `TradeChanges.txt` | Changes |
| `SpecialEvents.txt`, `NPCChanges.txt`, `FrequentlyAskedQuestions.txt` | Events, NPCs, FAQ |

## Re-fetch

```bash
python -I tools/drive_ls.py 1YZl5iShTdRwQIQ7FO1hAJaYBryWxxHwE hacks/renegade-platinum/.src
D=hacks/renegade-platinum/.src/romhackdex
python -I tools/mirror.py https://romhackdex.net/renegade-platinum/ $D 4000 team-builder compare /moves/ /abilities/
for p in moves abilities; do mkdir -p $D/$p; curl -sL --compressed -A 'Mozilla/5.0' https://romhackdex.net/renegade-platinum/$p/ -o $D/$p/index.html; done
python -I tools/rhd_moves.py $D/moves/index.html renegade-platinum $D/moves.json
python -I tools/rp_item_locations.py
```

**RomHackDex vs the docs (2026-10-19):** `python -I -X utf8 tools/drayano_check.py hacks/renegade-platinum/.src/PokemonChanges.txt hacks/renegade-platinum/.src/romhackdex/pokedex`
compares every species `PokemonChanges.txt` changes: all 491 match on base stats and the full level-up list (2
doc names have no page under that spelling). So RomHackDex is the dex; the docs add trainers (`TrainerPokemon.txt`),
wild tables with rates (`WildPokemon.txt`), items and events.

## How item-locations.csv is built

`ItemChanges.txt` lists every location for held and evolution items, TMs, HMs, plates and key items, so those
items get RP rows only (151 vanilla placements of them are dropped). Everything else (medicine, balls, berries,
vitamins, repels) comes from vanilla Platinum: visible items from `res/field/scripts/scripts_visible_items.s` and
hidden items from `include/data/field/hidden_items.h` in the
[pret/pokeplatinum](https://github.com/pret/pokeplatinum) decomp, pinned to commit `1dc13dc` (2026-10-14), with
names from `res/items/data/<item>.json`.

Caveat: RP may have swapped some vanilla ground items for the held items it lists, so a vanilla row can be stale
where a held item now sits. No walkthrough beyond vanilla.
