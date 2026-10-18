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
| `romhackdex/items/` | [RomHackDex](https://romhackdex.net/renegade-platinum/items/) item pages (170 held and key items); cross-check only, it adds nothing beyond `ItemChanges.txt` |
| `MoveChanges.txt`, `TypeChanges.txt`, `EvolutionChanges.txt`, `TradeChanges.txt` | Changes |
| `SpecialEvents.txt`, `NPCChanges.txt`, `FrequentlyAskedQuestions.txt` | Events, NPCs, FAQ |

## Re-fetch

```bash
python -I tools/drive_ls.py 1YZl5iShTdRwQIQ7FO1hAJaYBryWxxHwE hacks/renegade-platinum/.src
python -I tools/mirror.py https://romhackdex.net/renegade-platinum/items/ hacks/renegade-platinum/.src/romhackdex/items 400
python -I tools/rp_item_locations.py
```

## How item-locations.csv is built

`ItemChanges.txt` lists every location for held and evolution items, TMs, HMs, plates and key items, so those
items get RP rows only (151 vanilla placements of them are dropped). Everything else (medicine, balls, berries,
vitamins, repels) comes from vanilla Platinum: visible items from `res/field/scripts/scripts_visible_items.s` and
hidden items from `include/data/field/hidden_items.h` in the
[pret/pokeplatinum](https://github.com/pret/pokeplatinum) decomp, pinned to commit `1dc13dc` (2026-10-14), with
names from `res/items/data/<item>.json`.

Caveat: RP may have swapped some vanilla ground items for the held items it lists, so a vanilla row can be stale
where a held item now sits. No walkthrough beyond vanilla.
