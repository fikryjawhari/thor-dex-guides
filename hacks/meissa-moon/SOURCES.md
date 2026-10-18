# Meissa Moon docs

Fetched 2026-10-18 (v2.2.2) from the author's (AlbabImam04)
[Google Drive](https://drive.google.com/drive/folders/1UlUAqWY8wq0VbGPlDQTR7s3-Gnn0Pfkf) → Documentation. The link
came from the [PokeCommunity thread](https://www.pokecommunity.com/threads/meissa-moon-a-pokemon-moon-romhack.529687/),
read through the Wayback Machine (see `tools/README.md`).

| File | Contents |
| --- | --- |
| `Meissa Moon Mastersheet.xlsx` | Route-by-route sheet per island (Melemele to Poni, post-game pending) with trainers, IVs, EVs, natures |
| `Meissa Moon Teams.xlsx` | Trainer teams |
| `Meissa Moon Pokemon Changes.xlsx`, `Meissa Moon Learnsets.xlsx`, `Meissa Moon Move Changes.xlsx` | Dex changes |
| `Meissa Moon Wild Pokemon and Item Locations Documentation.xlsx` | Wild encounters and items |

## Re-fetch

```bash
python -I tools/drive_ls.py 1uRbqLFS-WALuT_mGmcFoM_bvmfjKGanE hacks/meissa-moon/.src
```

Complete. The Mastersheet doubles as a walkthrough. Major trainers are EV-trained, so speed calcs must use the
listed spreads.
