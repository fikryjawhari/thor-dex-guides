# Radical Red docs

Fetched 2026-10-18 (game v4.1). Dex, locations and items from RomHackDex; trainers from two community sheets the user
supplied.

| Path | Contents |
| --- | --- |
| `romhackdex/pokedex/` | 1,343 Pokémon pages: stats, abilities, evolutions, level-up and TM moves, wild locations |
| `romhackdex/locations/` | 204 location pages with encounters |
| `romhackdex/items/` | 248 item pages with locations |
| `romhackdex/moves/index.html`, `abilities/index.html`, `types/` | Move, ability (with descriptions) and type tables. The move index has no priority or descriptions |
| `romhackdex/moves.json` | **Use this for moves**: all 1,003 with type, category, power, accuracy, PP, priority and description (`tools/rhd_moves.py`, which reads each move page and keeps only those fields) |
| `trainers-normal.xlsx` | Normal mode bosses by split, trainer order, rivals, Rocket, mini and optional bosses, league, postgame |
| `trainers-hardcore.xlsx` | Same layout for Hardcore mode |

## Re-fetch

Source updates: `watch.json` (`uv run python -I tools/check_updates.py radical-red`).

```bash
D=hacks/radical-red/.src
python -I tools/mirror.py https://romhackdex.net/radical-red/ $D/romhackdex 4000 team-builder compare /moves/ /abilities/
for p in moves abilities; do mkdir -p $D/romhackdex/$p; curl -sL --compressed -A 'Mozilla/5.0' https://romhackdex.net/radical-red/$p/ -o $D/romhackdex/$p/index.html; done
python -I tools/rhd_moves.py $D/romhackdex/moves/index.html radical-red $D/romhackdex/moves.json
curl -sL "https://docs.google.com/spreadsheets/d/1ES8L4OzeJ8rCuMWFNvrDaZKArqR7Vys2ytFxjx2pbwE/export?format=xlsx" -o $D/trainers-normal.xlsx
curl -sL "https://docs.google.com/spreadsheets/d/1jDbKFA30xo8csPHZNLtsmqs781bW_Xb9mKoPYyE6KK8/export?format=xlsx" -o $D/trainers-hardcore.xlsx
```

About 180 MB. No walkthrough exists; the sheets' "Trainer Order" tab gives the fight order.
