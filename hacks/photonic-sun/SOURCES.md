# Photonic Sun docs

Fetched 2026-10-18 (v2.38) from Buffel Saft's
[Google Drive](https://drive.google.com/drive/folders/1zU-yEwI-JoFiF6yHT9qFy_Y5JFAvEi70) → Documents (shared with
Prismatic Moon). The link came from the
[PokeCommunity thread](https://www.pokecommunity.com/threads/pok%C3%A9mon-photonic-sun-prismatic-moon.411743/),
read through the Wayback Machine (see `tools/README.md`).

| File | Contents |
| --- | --- |
| `Pokemon Changes.pdf` | Stat, type, ability and TM changes |
| `Level Up Moves, Rebalanced.txt`, `Level Up Moves, Standard.txt` | Learnsets per variant |
| `Important Trainers, Rebalanced.pdf`, `Important Trainers, Standard.pdf` | Bosses per variant; no natures or EVs (the game data has them, see below) |
| `Totem Battles.pdf`, `Special Encounters.pdf` | Totems, static and gift encounters |
| `Wild Pokemon Locations.pdf` | Wild encounters |
| `Vendor Changes.pdf` | Mart changes |
| `Move Changes.pdf`, `Type Changes.pdf`, `Evolution Changes.pdf`, `How to Enable Mega Evolution.pdf` | Changes |
| `Changelog.txt` | Version history |

## Re-fetch

```bash
D=hacks/photonic-sun/.src
python -I tools/drive_ls.py 1W-TbF-XashTxOjQj6A4jdj4IkYFBEBVD $D
curl -sL "https://drive.usercontent.google.com/download?id=1SicZJYkSF5LcBjvLtZqr6bmO9_vXUQnu&export=download&confirm=t" -o $D/Changelog.txt
```

## Game files (romfs)

`Photonic Sun/Rebalanced.zip` (440.6 MB, Drive id `14vNSGKhl9Z80PLhrT2D4ClskfTt9b6Pn`) holds the install guides and
`Rebalanced/luma/titles/00040000001B5000/` (`code.ips`, 36 bytes, + `romfs/` with 16 archives and `Shop.cro`).

Vanilla Ultra Sun is the user's own Azahar dump: the base game at `%APPDATA%/Azahar/dump/romfs/00040000001B5000/` and
the v1.2 update at `.../0004000E001B5000/` (61 MB, 148 files). The update's romfs holds only the files it replaces,
so v1.2 = the update's files over the base. The update doesn't touch `a/0/8/2` or the trainer archives.

```bash
D=hacks/photonic-sun/.src/romfs-dl; mkdir -p $D; A="$APPDATA/Azahar/dump/romfs"
curl -L "https://drive.usercontent.google.com/download?id=14vNSGKhl9Z80PLhrT2D4ClskfTt9b6Pn&export=download&confirm=t" -o $D/Rebalanced.zip
python -I -c "import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); [z.extract(n,sys.argv[2]) for n in z.namelist() if 'romfs/a/' in n]" $D/Rebalanced.zip $D/x
R=$D/x/Rebalanced/luma/titles/00040000001B5000/romfs
python -I tools/usum_trainers.py $R hacks/photonic-sun/.src/trainers-rebalanced.json "$A/0004000E001B5000" "$A/00040000001B5000"
mkdir -p hacks/photonic-sun/.src/serebii
for p in items tm; do curl -s -A "Mozilla/5.0" https://www.serebii.net/ultrasunultramoon/$p.shtml -o hacks/photonic-sun/.src/serebii/$p.shtml; done
python -I tools/serebii_usum_items.py hacks/photonic-sun/.src/serebii/items.shtml hacks/photonic-sun/.src/serebii/tm.shtml hacks/photonic-sun/.src/item-locations.csv
```

| Output | Contents |
| --- | --- |
| `trainers-rebalanced.json` | **All 653 trainers** with natures, EVs and per-stat IVs (the PDFs leave out natures and EVs): name and class from the hack's text, battle type, bag, and per Pokémon species, form, level, nature, ability, gender, item, IVs, EVs, moves. Includes Hau's first two battles, which the PDF skips |
| `item-locations.csv` | 1,816 rows from Serebii's vanilla Ultra Sun items and TM pages: item, category, location, method (field, Shop, Wild Encounter, Festival Plaza, Poké Pelago, PickUp, …). For "Wild Encounter" the location is the Pokémon that holds it. Marts: use `Vendor Changes.pdf` over the Shop rows |

**Overworld items are vanilla, verified 2026-10-18.** The hack ships `a/0/8/2` (encdata) because it changes wild
encounters, so every zone was compared with vanilla: all 336 zones × 11 sub-files are byte-identical except the
encounter tables (EA) of 71 zones. The zone scripts (ZS/ZI) that place item balls and hidden items are untouched,
and the pickup archive (`a/2/7/1`) isn't shipped. The changelog mentions no item changes either.

Checked: Captain Ilima (ID 52) matches the PDF on species, levels, abilities, items and moves. Most docs are PDFs;
text extraction is needed at build time (`pdftotext -layout` works). No walkthrough.
