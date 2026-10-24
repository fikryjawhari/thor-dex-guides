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

Source updates: `watch.json` (`uv run python -I tools/check_updates.py navy-sapphire`).

```bash
python -I tools/drive_ls.py 1E07E8tvmdXuYeOJ51VDQwGqtN_qCEyH3 hacks/navy-sapphire/.src
```

Complete. The route-trainer sheet is ordered by split, which serves as a rough walkthrough.

## Game files (romfs)

`Navy Sapphire v2.1.5.zip` (151 MB, Drive id `1M--AdBJd7Ftvkpp-Fm98uwZOsa11NeOB`; `drive_ls.py` skips zips)
holds `Navy Sapphire v2.1.5/` with a **full `code.bin`** and a LayeredFS `romfs/` whose 24 archives include every
dex, trainer, text and encounter archive, so no vanilla Alpha Sapphire dump is needed.

```bash
D=hacks/navy-sapphire/.src/romfs-dl; mkdir -p $D
curl -L "https://drive.usercontent.google.com/download?id=1M--AdBJd7Ftvkpp-Fm98uwZOsa11NeOB&export=download&confirm=t" -o "$D/Navy Sapphire v2.1.5.zip"
python -I -c "import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); [z.extract(n,sys.argv[2]) for n in z.namelist() if '/romfs/a/' in n or n.endswith('/code.bin')]" "$D/Navy Sapphire v2.1.5.zip" $D/x
N="$D/x/Navy Sapphire v2.1.5"
python -I tools/ctr_dex.py oras hacks/navy-sapphire/.src/dex.json "$N/romfs" --code "$N/code.bin"
python -I tools/xy_trainers.py --oras "$N/romfs" hacks/navy-sapphire/.src/trainers.json
```

| Output | Contents |
| --- | --- |
| `dex.json` | **Use this for the dex** (`tools/ctr_dex.py`): 911 species and forms with stats, abilities, all learnsets (ORAS move tutors included), evolutions, Megas; 621 moves; abilities; TMs/HMs from the hack's code.bin; 723 wild tables in 154 zones by method (Grass, Tall Grass, Swarm, Surf, Rock Smash, rods, Hordes) with rates |
| `trainers.json` | All 950 trainers (Gen 6: IVs, ability slot, item, moves; no natures or EVs in the data) |

Checked (2026-10-19): Roxanne and Brawly match `Navy Sapphire - Important Trainers.xlsx` on species, levels,
items, abilities and moves, except one sheet slip (Roxanne's Anorith: sheet Rock Tomb, game Rock Throw).
The species text has 90 blank lines after Volcanion; they're skipped (no new species).
