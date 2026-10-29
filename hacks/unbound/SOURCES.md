# Unbound docs

Fetched 2026-10-18. Dex, locations and items from RomHackDex; boss teams from three community sheets the user supplied;
missions, walkthrough and extras from [unboundwiki.com](https://unboundwiki.com/).

| Path | Contents |
| --- | --- |
| `romhackdex/pokedex/` | 1,269 Pokémon pages: stats, abilities, evolutions, level-up and TM moves, wild locations |
| `romhackdex/locations/`, `romhackdex/items/` | 94 locations, 352 items |
| `romhackdex/moves/index.html`, `abilities/index.html` | Move and ability (with descriptions) tables |
| `romhackdex/moves.json` | **Use this for moves**: all 993 with type, category, power, accuracy, PP, priority and description (`tools/rhd_moves.py`) |
| `trainers-difficult.xlsx`, `trainers-expert.xlsx`, `trainers-insane.xlsx` | Gym leaders, league, rival, Shadow and Light of Ruin bosses, boss wild battles, mega trainers, Title Defense, Battleground, with EV spreads |
| `unboundwiki/unboundwiki.json` | 1,545 wiki entries (title, link, category, HTML): 967 Pokédex, 84 missions, 40-part walkthrough, 104 locations, 129 TMs and HMs, 90 items, 49 Mega Stones, plus pages for raid dens, tutors, Z-crystals, mechanics |

## Re-fetch

Source updates: `watch.json` (`uv run python -I tools/check_updates.py unbound`).

```bash
D=hacks/unbound/.src
python -I tools/mirror.py https://romhackdex.net/unbound/ $D/romhackdex 4000 team-builder compare /moves/ /abilities/
for p in moves abilities; do mkdir -p $D/romhackdex/$p; curl -sL --compressed -A 'Mozilla/5.0' https://romhackdex.net/unbound/$p/ -o $D/romhackdex/$p/index.html; done
python -I tools/rhd_moves.py $D/romhackdex/moves/index.html unbound $D/romhackdex/moves.json
curl -sL "https://docs.google.com/spreadsheets/d/1_HF-bxEfamTW8S3q7tLjHWWPjo9E1QLS5dtMIhJHoeY/export?format=xlsx" -o $D/trainers-difficult.xlsx
curl -sL "https://docs.google.com/spreadsheets/d/1yl1AXKfarFb8_8-iF8We9zmLB135kxJ82yOGQDoMHOs/export?format=xlsx" -o $D/trainers-expert.xlsx
curl -sL "https://docs.google.com/spreadsheets/d/1pLTQKQkWTnSkev4_kcjHbY0AkBujbTUDybxXFNZ_aVY/export?format=xlsx" -o $D/trainers-insane.xlsx
mkdir -p $D/unboundwiki
python -I tools/wp_dump.py https://unboundwiki.com $D/unboundwiki/unboundwiki.json pages wiki
```

About 200 MB. The wiki's Pokédex overlaps RomHackDex; use whichever reads cleaner at build time. Unbound is the only
backlog hack with a quest system (the wiki's Missions category). Two RomHackDex pages 404 on the site itself
(Minior Red Meteor, Pumpkaboo Average).


## Files

TODO: document files.


## Game files

TODO: document game files.


## Source checks

TODO: document source checks.
