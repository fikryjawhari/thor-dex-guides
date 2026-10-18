# SoulGold docs

Fetched 2026-10-18 from [eemeliri.github.io/soulgold](https://eemeliri.github.io/soulgold/), whose pages are built
from JSON data files. We keep the JSON.

| File in `data/` | Contents |
| --- | --- |
| `species.json`, `species-meta.json` | 959 species: stats, types, abilities, innates, evolutions, learnsets |
| `trainers.json` | 441 trainers with full parties, by difficulty |
| `encounters.json` | 132 maps of wild encounters |
| `items.json` | 236 items with locations |
| `moves.json`, `move-index.json`, `machines.json` | Moves and TMs |
| `abilities.json`, `ability-index.json`, `ability-usage.json` | Abilities |
| `guides.json` | Guides: legendary locations, Hidden Grottos, gift and trade Pokémon, megas, trophies, FAQ |
| `ui.json` | Site labels |

## Re-fetch

```bash
mkdir -p hacks/soulgold/.src/data
for f in abilities ability-index ability-usage encounters guides items machines move-index moves species-meta species trainers ui; do
  curl -sL "https://eemeliri.github.io/soulgold/data/$f.json" -o hacks/soulgold/.src/data/$f.json
done
```

If a file 404s, the site renamed its data: run `curl -sL https://eemeliri.github.io/soulgold/assets/app.js | grep -oE "data/[a-z-]+\.json" | sort -u`
for the current list. No quest system and no walkthrough.
