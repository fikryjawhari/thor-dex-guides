# SoulGold docs

Fetched 2026-10-18 from [eemeliri.github.io/soulgold](https://eemeliri.github.io/soulgold/), whose pages are built
from JSON data files. We keep the JSON.

| File in `data/` | Contents |
| --- | --- |
| `species.json`, `species-meta.json` | 959 species: stats, types, abilities, innates; evolutions, Megas, dedicated tutors |
| `species-details/<slug>.json` | Per species: level-up, TM/HM, tutor and egg moves, EV yield, egg groups, held items, locations |
| `trainers.json` | 441 trainers with full parties, by difficulty |
| `encounters.json` | 132 maps of wild encounters |
| `items.json` | 236 items with locations |
| `moves.json`, `move-index.json`, `machines.json` | Moves and TMs |
| `abilities.json`, `ability-index.json`, `ability-usage.json` | Abilities |
| `guides.json` | Guides: legendary locations, Hidden Grottos, gift and trade Pokémon, megas, trophies, FAQ |
| `ui.json` | Site labels |

## Re-fetch

Source updates: `watch.json` (`uv run python -I tools/check_updates.py soulgold`).

```bash
mkdir -p hacks/soulgold/.src/data
for f in abilities ability-index ability-usage encounters guides items machines move-index moves species-meta species trainers ui; do
  curl -sL "https://eemeliri.github.io/soulgold/data/$f.json" -o hacks/soulgold/.src/data/$f.json
done
```

Learnsets aren't in those files: the site loads them per species from `data/species-details/<slug>.json`
(EV yield, egg groups, level-up, TM/HM, tutor and egg moves, evolutions, locations, held items). Fetch all 959
(the `tr` drops the CRLF Windows Python writes, which otherwise ends up in the URLs):

```bash
D=hacks/soulgold/.src/data; mkdir -p $D/species-details
python -I -c "import json,sys; print('\n'.join(s['slug'] for s in json.load(open(sys.argv[1],encoding='utf-8'))))" $D/species.json | tr -d '\r' \
  | xargs -P 8 -I{} curl -sL --retry 3 "https://eemeliri.github.io/soulgold/data/species-details/{}.json" -o "$D/species-details/{}.json"
```

There is also `data/move-learners/<slug>.json` per move (the same data turned around); not needed.

If a file 404s, the site renamed its data: run `curl -sL https://eemeliri.github.io/soulgold/assets/app.js | grep -oE "data/[a-z-]+\.json" | sort -u`
for the current list. No quest system and no walkthrough.
