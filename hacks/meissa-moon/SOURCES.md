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

## Game files (romfs)

`Meissa Moon v2.2.2.zip` (915 MB, Drive id `1MhTTXXQThFFXtNMCfU3NQE5UCVMTrDtT`, in the main folder next to
Documentation; `drive_ls.py` skips zips) holds `Moon Extract 2/` with a **full `code.bin`** and a LayeredFS
`romfs/` (16 archives under `a/`, every dex, trainer, text, zone and Moon encounter archive among them, plus
`.cro` modules and sounds). So no vanilla Moon dump is needed.

```bash
D=hacks/meissa-moon/.src/romfs-dl; mkdir -p $D
curl -L "https://drive.usercontent.google.com/download?id=1MhTTXXQThFFXtNMCfU3NQE5UCVMTrDtT&export=download&confirm=t" -o "$D/Meissa Moon v2.2.2.zip"
python -I -c "import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); [z.extract(n,sys.argv[2]) for n in z.namelist() if '/romfs/a/' in n or n.endswith('/code.bin')]" "$D/Meissa Moon v2.2.2.zip" $D/x
M="$D/x/Moon Extract 2"
python -I tools/ctr_dex.py moon hacks/meissa-moon/.src/dex.json "$M/romfs" --code "$M/code.bin"
python -I tools/usum_trainers.py --sm "$M/romfs" hacks/meissa-moon/.src/trainers.json
```

| Output | Contents |
| --- | --- |
| `dex.json` | **Use this for the dex** (`tools/ctr_dex.py`): 1,061 species and forms with stats, abilities, all learnsets, evolutions, Megas; 719 moves; abilities; TMs from the hack's code.bin; 798 wild tables in 67 areas (day/night, levels, rates, SOS allies; no method, see Photonic Sun's notes) |
| `trainers.json` | All 485 trainers with natures, EVs, IVs, abilities, items and moves |

Checked (2026-10-19): Captain Ilima's three starter variants and Hala match the Mastersheet on species, levels,
natures, abilities and moves (the sheet lists moves in a different order), and its EV columns (zeros left out)
confirm the HP/Atk/Def/SpA/SpD/Spe order of the dump. Hack data quirks, kept as is: Feraligatr's hidden ability
is 255 (no ability, shown as "ability #255"), and five species hold item 0xFFFF in a wild-item slot (read as none).
