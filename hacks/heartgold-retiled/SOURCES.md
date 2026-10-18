# HeartGold Retiled docs

Fetched 2026-10-18 for the v6.12.1 expansion patch, from the hack's
[GitHub repo](https://github.com/Trinsic64/Heart-Gold-Retiled).

| Path | Contents |
| --- | --- |
| `Walkthrough.md` | Story order, altered bosses, Kanto, Red, offline event checklist |
| `Trainer-Guide.md` | Major teams, rematches, rivals, all 737 trainer IDs |
| `Wild-Encounter-Guide.md` | Rates by area, time and method, plus a Pokémon-to-location index |
| `Item-Locations.md` | Pickups, hidden items, Mega Stones, held-item sources |
| `Evolution-Guide.md`, `HG-Engine-Features.md`, `README.md` | Evolutions, mechanics, overview |
| `source/` | The raw tables the guides were built from: `Trainers.c`, `Encounters.c`, `Evolutions.c`, `mart.c` |
| `hg-engine/species-pinned.json` | **Use this for the dex.** Per species: stats, types, abilities, hidden ability, EV yields, all four learnsets, built from hg-engine as of the release |
| `hg-engine/pinned/`, `hg-engine/main/` | The hg-engine data files it is built from (`Species.c`, `HiddenAbilityTable.c`, `learnsets.json`, `Moves.c`), at the pinned commit and at latest main |
| `hg-engine/species-main.json`, `diff-pinned-vs-main.json` | The same extract from latest main, and the diff between them |

The guides and `source/` tables are byte-identical at the v6.12.1 tag (released 2026-08-24 02:22 UTC) and on main
as of 2026-10-18. The guides already cover rival variants ("Rival variants" in `Trainer-Guide.md`).

## hg-engine pin

Retiled does not change species stats or learnsets and does not pin an hg-engine commit. We use the last
BluRosie/hg-engine `main` commit before the v6.12.1 release:
`dcbe17a7fbcd447ab4258f6b8dbe5ce8659e5cd1` (2026-08-21, "Merge pull request #902"). Against latest main
(`f4fca05`, 2026-10-17) it has 1,476 species records to main's 1,535 (main adds 59, such as Arceus forms), and
30 shared species differ: 5 in abilities (Mega and Z forms such as Mega Garchomp Z), the rest only in learnsets.
No base stats, types or hidden abilities differ.

## Re-fetch

```bash
D=hacks/heartgold-retiled/.src; R=https://raw.githubusercontent.com/Trinsic64/Heart-Gold-Retiled/v6.12.1
for f in Evolution-Guide HG-Engine-Features Item-Locations README Trainer-Guide Walkthrough Wild-Encounter-Guide; do
  curl -sL "$R/Docs/Guides/$f.md" -o $D/$f.md
done
mkdir -p $D/source
for f in data/Trainers.c data/Encounters.c data/Evolutions.c src/field/mart.c; do curl -sL "$R/HG-Engine/$f" -o $D/source/$(basename $f); done
for ref in dcbe17a7fbcd447ab4258f6b8dbe5ce8659e5cd1:pinned main:main; do
  mkdir -p $D/hg-engine/${ref##*:}
  for f in Species.c HiddenAbilityTable.c learnsets/learnsets.json Moves.c; do
    curl -sL "https://raw.githubusercontent.com/BluRosie/hg-engine/${ref%%:*}/data/$f" -o $D/hg-engine/${ref##*:}/$(basename $f)
  done
done
python -I tools/hge_species.py $D/hg-engine/pinned $D/hg-engine/species-pinned.json
python -I tools/hge_species.py $D/hg-engine/main $D/hg-engine/species-main.json
python -I tools/hge_species.py --diff $D/hg-engine/species-pinned.json $D/hg-engine/species-main.json $D/hg-engine/diff-pinned-vs-main.json
```

For a newer Retiled release, re-pin: the last hg-engine commit before its release date is
`curl -s "https://api.github.com/repos/BluRosie/hg-engine/commits?sha=main&until=<release ISO time>&per_page=1"`.
