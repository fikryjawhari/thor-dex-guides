# Eternal X docs

Fetched 2026-10-18 (v2.67) from Buffel Saft's
[Google Drive](https://drive.google.com/drive/folders/1K8KcX7E0f0H39TjQsUzk_mNb9_bMniL8) → Documents. The link came
from the [PokeCommunity thread](https://www.pokecommunity.com/threads/pok%C3%A9mon-eternal-x-wilting-y-version-2-67-released.362505/),
read through the Wayback Machine (see `tools/README.md`).

| File | Contents |
| --- | --- |
| `Pokemon Changes.pdf` | Stat, type, ability and TM changes (Rebalanced) |
| `Level Up Moves, Rebalanced.txt`, `Level Up Moves, Legal.txt` | Learnsets per variant |
| `Important Trainer Parties, <variant>.pdf` | Bosses for Legal, Rebalanced, Insanity and Legal Insanity |
| `Wild Pokemon Locations.pdf` | Wild encounters |
| `Item Changes _ Locations.pdf` | Item changes and locations |
| `Move Changes.pdf`, `Evolution Changes.pdf`, `XY AI Values, optional info.txt` | Changes and AI notes |
| `Changelog.txt`, install guides | Reference |

## Re-fetch

```bash
D=hacks/eternal-x/.src
python -I tools/drive_ls.py 1T0WiSuU618qG397BHKhlJ6REEBbdIi_P $D
curl -sL "https://drive.usercontent.google.com/download?id=1pE-VhmzCT21ALyKy7Vmhy47QZaM6kWZa&export=download&confirm=t" -o $D/Changelog.txt
```

## Game files (romfs)

The hack's own data, for what the docs leave out. `Eternal X 2.67.zip` (110.6 MB, Drive id
`1oLGsfL4PS7jggtbiM-qtpP3z67ftRENI`) holds `Documents/` (same docs as above) and
`Game Files/<variant>/luma/titles/0004000000055D00/` (`code.ips` + `romfs/`) for Legal version, Rebalanced version,
Insanity Mode - Legal and Insanity Mode - Rebalanced. Each variant folder is complete on its own (the same 12
archives each, including `a/0/7/4` text). Legal and Rebalanced also have a `Viola Nerf Files/` overlay (`a/0/3/8` +
`a/0/4/0` only), which stacks on its variant's romfs. The user plays the Rebalanced versions only (the modified
Pokémon), so only Rebalanced, Insanity Mode - Rebalanced and the Rebalanced Viola nerf are extracted. The Legal
variants can be added the same way if ever wanted.

Vanilla Pokémon X v1.0 (no update) is the user's own Azahar dump at `%APPDATA%/Azahar/dump/romfs/0004000000055D00/`.
The scripts fall back to it for archives the hack doesn't ship (trainer classes `a/0/3/9`).

```bash
D=hacks/eternal-x/.src/romfs-dl; mkdir -p $D; V="$APPDATA/Azahar/dump/romfs/0004000000055D00"
curl -L "https://drive.usercontent.google.com/download?id=1oLGsfL4PS7jggtbiM-qtpP3z67ftRENI&export=download&confirm=t" -o "$D/Eternal X 2.67.zip"
python -I -c "import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); [z.extract(n,sys.argv[2]) for n in z.namelist() if not n.endswith('/') and 'Rebalanced' in n and ('romfs/a/' in n or 'Viola Nerf' in n or n.endswith('code.ips'))]" "$D/Eternal X 2.67.zip" $D/x
G="$D/x/Eternal X 2.67/Game Files"; T=luma/titles/0004000000055D00/romfs
for v in "rebalanced:Rebalanced version:Rebalanced" "insanity-rebalanced:Insanity Mode - Rebalanced:Insanity - Rebalanced"; do
  IFS=: read k f n <<< "$v"
  python -I tools/xy_trainers.py "$G/$f/$T" hacks/eternal-x/.src/trainers-$k.json "$V"
  python -I tools/ex_rivals.py hacks/eternal-x/.src/trainers-$k.json hacks/eternal-x/.src/rival-teams-$k.md "$n"
  python -I tools/ctr_dex.py x hacks/eternal-x/.src/dex-$k.json "$G/$f/$T" "$V" --ips "$G/$f/$T/../code.ips"
done
python -I tools/xy_trainers.py "$G/Rebalanced version/Viola Nerf Files" hacks/eternal-x/.src/trainers-rebalanced-viola-nerf.json "$G/Rebalanced version/$T" "$V"
```

| Output | Contents |
| --- | --- |
| `trainers-<variant>.json` (`rebalanced`, `insanity-rebalanced`) | **All 785 trainers** per variant, route trainers included (the docs skip them): name and class from the hack's own text, battle type, bag items, and per Pokémon species, form, level, IVs, ability, gender, item, moves |
| `rival-teams-<variant>.md` | Every Serena/Calem fight (×3 starters; Serena and Calem listed separately because their teams differ), plus Shauna, Tierno and Trevor, with locations |
| `dex-<variant>.json` | **Use this for the dex** (`tools/ctr_dex.py`; the two variants are byte-identical, see below). 884 species and forms: stats, types, abilities, level-up, egg, TM and tutor moves, evolutions, Megas, form names; 617 moves with priority, flags and descriptions; abilities with descriptions; the TM list; 274 wild tables in 53 zones by method (Grass, Yellow/Purple/Red Flowers, Rough Terrain, Surf, Rock Smash, rods, Hordes) with slot rates |
| `trainers-rebalanced-viola-nerf.json` | Rebalanced with the nerf overlay applied. **Take only Viola (trainer 6) from these**, see below |

**Viola nerf.** The PDF only says it removes Dustox and Ledian and changes the levels. The overlay
gives her four Pokémon: Surskit, Dwebble and Joltik Lv 14 and Vivillon Lv 16, with tweaked moves. But the
overlay files are stale full copies of the trainer data: besides Viola they lack the v2.63 Poké Ball Factory change
(Flareon keeps Will-O-Wisp instead of Facade, IDs 605/608) and the Wulfric AI fix (AI 7 instead of
135). So the nerfed game really plays as Rebalanced with only Viola swapped; the dex should show the nerf
as an alternative Viola team, nothing else.

Checks done (2026-10-18):
- Viola, Grant, Korrina, Malva and Diantha match `Important Trainer Parties, Rebalanced.pdf` on species, levels,
  items, moves, IVs and abilities; Viola and Diantha match `Important Trainer Parties, Insanity.pdf` too (one doc slip:
  Insanity Viola's Larvesta is IVs 25 in the docs, 31 in the data). One doc error: Diantha's Gourgeist is listed with Flash Fire, but the game
  data and `Pokemon Changes.pdf` both say Pickup/Flare Boost/Insomnia (its slot is Flare Boost). Trust the data.
- IVs are the trainer IV byte / 8 (Viola's byte 200 = the doc's 25). Gen 6 trainer data has **no natures or EVs**,
  and the docs list none either.
- Rival IDs are vanilla XY's (pk3DS `GetTagsXY`), confirmed by name in the hack's text. Battles and locations come
  from Bulbapedia's vanilla rival pages (fetched as `index.php?title=<page>&action=raw`; the normal pages return
  403), matched by vanilla levels. Four Serena/Calem sets are **multi-battle partners**, not opponents: Route 7 (vs
  Tierno and Trevor), Glittering Cave, Poké Ball Factory (IDs 604–609, the Facade Flareon in the changelog) and the
  Team Flare Secret HQ. Battle Maison partner teams live in a separate archive and aren't extracted.
- Hack quirk, kept as is: Rebalanced Serena's Coumarine Vaporeon (ID 580) is Lv 42 where the other starter variants
  have Lv 40.
- Insanity - Rebalanced differs from Rebalanced in 336 of 785 trainers, so each needs its own data.

Dex checks (2026-10-19):
- **Insanity - Rebalanced has the same dex as Rebalanced**: of its 12 archives only `a/0/3/8` and `a/0/4/0`
  (trainers) differ, so one dex serves both and only the trainers need two versions. Egg moves (`a/2/1/3`) and
  Megas (`a/2/1/6`) aren't shipped and come from vanilla X.
- Learnsets: all 798 species in `Level Up Moves, Rebalanced.txt` match the game (only curly apostrophes and the
  Nidoran names differ). `python tools/buffel_check.py <dex.json> "<Level Up Moves, Rebalanced.txt>"`.
- TMs: `code.ips` (same in both variants) patches the XY TM table (0x464796): TM48 Ice Punch, TM49 Drain Punch,
  TM51 Sucker Punch, TM58 Thunder Punch, TM60 Fire Punch, TM79 Freeze-Dry, TM100 Giga Drain, exactly the list
  in `Item Changes _ Locations.pdf`. The patch's other writes (0x43C8CE-0x43CA50) are mart item lists.
- Wild: Routes 2 and 3 and Santalune Forest match `Wild Pokemon Locations.pdf` on species, levels and rates;
  Gen 6 slot rates are grass/flowers 10×9, 5, 4, 1; surf and Rock Smash 50, 30, 15, 4, 1; rods 60, 35, 5.
  The game has horde tables (A/B/C, picked 60/35/5) the PDF doesn't list.

Most docs are PDFs; text extraction is needed at build time (`pdftotext -layout` from Git Bash works). No walkthrough.
