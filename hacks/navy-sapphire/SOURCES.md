# Navy Sapphire docs

Fetched 2026-10-18 (v2.1.5) from the hack's
[Google Drive](https://drive.google.com/drive/folders/1E07E8tvmdXuYeOJ51VDQwGqtN_qCEyH3). The link came from the
[PokeCommunity thread](https://www.pokecommunity.com/threads/pokemon-navy-sapphire-my-difficulty-rom-hack-of-alpha-sapphire-release.529355/),
read through the Wayback Machine (see `tools/README.md`).

| File | Contents |
| --- | --- |
| `Navy Sapphire - Pokemon Changes.txt` | Stats, types, abilities, moves |
| `Navy Sapphire - Important Trainers.xlsx` | Bosses |
| `Wild Pokemon and Route Trainer Pokemon.xlsx` | Wild encounters and route trainers by split, thief and held items |
| `Navy Sapphire Mart Items, Item Changes and Locations.xlsx` | Marts, item changes, item locations |
| `Navy Sapphire - Gift Pokemon-Static Encounters.txt`, `Move Changes.txt` | Gifts, statics, move changes |
| `Navy Sapphire Installation Steps.txt` | Install |

## Re-fetch

```bash
python -I tools/drive_ls.py 1E07E8tvmdXuYeOJ51VDQwGqtN_qCEyH3 hacks/navy-sapphire/.src
```

Complete. The route-trainer sheet is ordered by split, which serves as a rough walkthrough.
