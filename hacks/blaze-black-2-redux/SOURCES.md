# Blaze Black 2 Redux docs

Fetched 2026-10-18 (v1.4.1) from the Documentation folder in
[Drayano's Google Drive](https://drive.google.com/drive/folders/0B-zmEVN0Mas6Q3lLbDJDaWNyaVU?resourcekey=0-o98YGOlDJ0JVXXjxoHprIA)
→ "(2022, B2W2) Blaze Black 2 Redux / Volt White 2 Redux" → Documentation.

| File | Contents |
| --- | --- |
| `Pokemon Changes.txt` | Stats, types, abilities, moves for every changed Pokémon |
| `Trainer Changes.txt` | All trainers, with separate Challenge Mode teams for important ones |
| `Wild Area Changes.txt` | Wild encounters by area |
| `Item Changes.txt` | Full item locations, marts, TMs, pickup table |
| `Move Changes.txt`, `Type Changes.txt`, `Evolution Changes.txt`, `Trade Changes.txt` | Changes |
| `Gift Pokemon.txt`, `Legendary Locations.txt`, `Important NPCs.txt` | Gifts, legendaries, NPCs |
| `Important and General Information.txt`, `Important Nuzlocke Information.txt`, `Redux FAQ.txt` | Rules, EVless modes, FAQ |
| `Changelog.txt`, `Credits.txt`, `Known Bugs and Hardware Information.txt`, `Patching Guide.txt`, `Useful Action Replay Codes.txt` | Reference |
| `romhackdex/pokedex/` | [RomHackDex](https://romhackdex.net/blaze-black-2-volt-white-2-redux/) pages for all 649 Pokémon: types, abilities, evolutions, level-up, TM, tutor and egg moves, wild locations. **Base stats are wrong for changed species** (see below) |
| `romhackdex/moves.json` | All 604 moves with type, category, power, accuracy, PP, priority and description (`tools/rhd_moves.py`) |
| `romhackdex/locations/`, `items/`, `abilities/index.html`, `types/` | 81 locations, 557 items, ability descriptions, type chart |

## Re-fetch

```bash
python -I tools/drive_ls.py 1wVz7qTdZh8kn0Du9bmMKuXlrQRBeF01d hacks/blaze-black-2-redux/.src
D=hacks/blaze-black-2-redux/.src/romhackdex; S=blaze-black-2-volt-white-2-redux
python -I tools/mirror.py https://romhackdex.net/$S/ $D 4000 team-builder compare /moves/ /abilities/
for p in moves abilities; do mkdir -p $D/$p; curl -sL --compressed -A 'Mozilla/5.0' https://romhackdex.net/$S/$p/ -o $D/$p/index.html; done
python -I tools/rhd_moves.py $D/moves/index.html $S $D/moves.json
```

Complete. No walkthrough beyond vanilla.

**Two versions.** Redux ships a *Complete* patch (extra ability, type and moveset changes) and a *Classic* patch
without them (`Important and General Information.txt`); `Pokemon Changes.txt` gives both ("Ability (Complete)" /
"Ability (Classic)", "Base Stats (Complete)"). RomHackDex shows the Complete abilities.

**RomHackDex vs the docs (2026-10-19):** `python -I -X utf8 tools/drayano_check.py "hacks/blaze-black-2-redux/.src/Pokemon Changes.txt" hacks/blaze-black-2-redux/.src/romhackdex/pokedex`
compares the 642 species the doc changes. Level-up lists agree (the 74 differences are doc typos: "Faint Attack",
"Sliver Wind", "Autonomize", "Twinneedle"). **Base stats don't: 188 changed species show vanilla stats on
RomHackDex** (Venusaur 82/83/100 for the doc's 87/85/103, Golurk 89/124/80 for 115/125/85). So take stats from
`Pokemon Changes.txt` for every species it lists (it gives full new stats) and RomHackDex for the rest (unchanged,
so vanilla is right). Trainers (with Challenge Mode teams), wild tables and items come from the docs.
