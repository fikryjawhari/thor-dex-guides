# Pokémon Heartfelt Gold docs

Heartfelt Gold is HeartGold Retiled renamed: v1.0.0 (2026-10-31) succeeds Retiled Expansion v6.12.1, same author and
repo. Fetched 2026-11-01 for v1.0.0 from the hack's
[GitHub repo](https://github.com/Trinsic64/Heart-Gold-Retiled), release tag `heartfelt-v1.0.0` = `8b6aa3a`
("Record approved Heartfelt Gold release validation", 2026-10-31 14:51 UTC). The later head commit `229a63d`
changes only the repo README (download link). First fetched 2026-10-18 for v6.12.1; that copy is kept in
`.src/v6.12.1/` for comparison.

| Path | Contents |
| --- | --- |
| `Wild-Encounter-Guide.md` | Rates by area, time and method, plus a Pokémon-to-location index (regenerated for v1.0.0) |
| `Trainer-Guide.md` | Teams, levels, moves, items, trainer IDs (regenerated for v1.0.0) |
| `Evolution-Guide.md` | Evolution and form methods (regenerated) |
| `Static-Encounter-Guide.md` | New: 87 scripted `WildBattle`s (legendaries, mythicals) with level, area, map header, script bank |
| `HG-Engine-Features.md` | Starters (Treecko / Torchic / Mudkip with their Mega Stones), National Dex, reusable TMs, level cap variable, marts |
| `Walkthrough.md`, `Item-Locations.md` | **Retiled-era, not updated** (unchanged from v6.12.1 but for a header line); the guide index says they need a fresh event and item audit before use with Heartfelt Gold |
| `README.md` | The guide index; `Repo-README.md` the repo's README (patch, ROM hashes), `RELEASE-NOTES.md` the v1.0.0 notes |
| `source/` | Retiled's `HG-Engine/` overlay at the tag, same paths: `data/` `Species.c`, `HiddenAbilityTable.c`, `learnsets/learnsets.json`, `Moves.c`, `itemdata/itemdata.c`, `Trainers.c`, `Encounters.c`, `SafariEncounters.c`, `Headbutt.c`, `Evolutions.c`, `ComplexEvolutionMethods.csv`, `BabyMons.c`, `BaseExperienceTable.c`, `PokedexArea.c`, `generated/PokedexAreaLists.inc`; `include/config.h`, `include/constants/{encounter_tables,pokedex}.h`, `include/pokedex_archive_data.h`; `src/field/mart.c`, `src/starters.c` |
| `hg-engine/species-retiled.json` | **Use this for the dex.** Per species: stats, types, abilities, hidden ability, EV yields, all four learnsets, built from `source/data/` (copied to `hg-engine/retiled/`) |
| `hg-engine/upstream-61b510c/` | BluRosie/hg-engine at `61b510c` (the last `main` commit before the release, 2026-10-25): the same four files, for comparison, and `text/720.txt` / `722.txt` (ability names / descriptions, which Retiled does not carry) |
| `hg-engine/species-upstream-61b510c.json`, `diff-upstream-vs-retiled.json`, `diff-oldpin-vs-retiled.json` | The upstream extract and the diffs (against upstream, and against the v6.12.1 pin `dcbe17a`) |

## The engine data: Retiled's own copy now

Up to v6.12.1 the repo's `HG-Engine/` carried only the tables Retiled changed, so species, learnsets and moves came
from upstream at the last commit before the release (`dcbe17a`). **v1.0.0 adds Retiled's own `Species.c`,
`HiddenAbilityTable.c`, `learnsets.json`, `Moves.c`, `itemdata.c` and `config.h`, and they win over upstream.** They
match no upstream commit: they are a recent upstream (learnsets as of upstream's 2026-09-08 change, `Moves.c` as of
2026-09-20, which is also `61b510c`) plus Retiled's edits. Checked 2026-11-01:

- `Moves.c` against `61b510c`: one change, Dark Void accuracy 50 -> 80 (upstream has 50 at every commit since the
  old pin).
- `Species.c` against `61b510c`: no stat or type differences. Most lines are wild held items (Retiled sets its own
  common / rare items, for example Floettite) and a few form names / gender ratios. `hge_species.py --diff`: 104
  species differ, 59 only by the new forms' hidden ability (upstream later gave the Arceus / Unown / Rotom ... forms an
  `ABILITY_NONE` row; Retiled's table is the older one), 39 in level-up moves (legendaries such as Azelf, Darkrai,
  Hoopa), 6 in abilities: Greninja gets Battle Bond as its second ability (Retiled's change), and Baxcalibur and the
  Megas Absol Z, Garchomp Z, Golisopod and Lucario Z keep the old pin's abilities (Pressure, Sand Veil, Emergency
  Exit, Steadfast; upstream changed them later).
- Against the v6.12.1 pin `dcbe17a`: 59 forms added (Arceus types, Unown letters, Rotom, Deoxys ...), 63 shared
  species differ (1 ability, the rest learnsets). No base stats or types differ.

Upstream is now only needed for what Retiled does not carry (ability text, constants, battle code): use `61b510c`,
never a later `main`. The exact answer for anything in doubt is the patched ROM's NARCs (the user has a copy on the
Thor).

## Re-fetch

Source updates: `watch.json` (`uv run python -I tools/check_updates.py heartfelt-gold`).

```bash
D=hacks/heartfelt-gold/.src; TAG=8b6aa3af15db5f6053ebb96b15e0ebf44a226940   # heartfelt-v1.0.0
R=https://raw.githubusercontent.com/Trinsic64/Heart-Gold-Retiled/$TAG
for f in Evolution-Guide HG-Engine-Features Item-Locations README Trainer-Guide Walkthrough Wild-Encounter-Guide Static-Encounter-Guide; do
  curl -sfL "$R/Docs/Guides/$f.md" -o $D/$f.md
done
curl -sfL $R/README.md -o $D/Repo-README.md; curl -sfL $R/RELEASE-NOTES-HEARTFELT-v1.0.0.md -o $D/RELEASE-NOTES.md
for f in data/{Species.c,HiddenAbilityTable.c,learnsets/learnsets.json,Moves.c,itemdata/itemdata.c,Trainers.c,Encounters.c} \
         data/{SafariEncounters.c,Headbutt.c,Evolutions.c,ComplexEvolutionMethods.csv,BabyMons.c,BaseExperienceTable.c} \
         data/{PokedexArea.c,generated/PokedexAreaLists.inc} include/config.h include/constants/{encounter_tables,pokedex}.h \
         include/pokedex_archive_data.h src/field/mart.c src/starters.c; do
  mkdir -p $D/source/$(dirname $f); curl -sfL "$R/HG-Engine/$f" -o $D/source/$f || echo "missing $f"
done
U=https://raw.githubusercontent.com/BluRosie/hg-engine/61b510cfb6cf7d77c3b083150fad3499f82fd326/data
mkdir -p $D/hg-engine/retiled $D/hg-engine/upstream-61b510c/text
cp $D/source/data/{Species.c,HiddenAbilityTable.c,learnsets/learnsets.json,Moves.c} $D/hg-engine/retiled/
for f in Species.c HiddenAbilityTable.c learnsets/learnsets.json Moves.c text/720.txt text/722.txt; do
  curl -sfL $U/$f -o $D/hg-engine/upstream-61b510c/$([ ${f%%/*} = text ] && echo $f || basename $f)
done
python -I tools/hge_species.py $D/hg-engine/retiled $D/hg-engine/species-retiled.json
python -I tools/hge_species.py $D/hg-engine/upstream-61b510c $D/hg-engine/species-upstream-61b510c.json
python -I tools/hge_species.py --diff $D/hg-engine/species-upstream-61b510c.json $D/hg-engine/species-retiled.json $D/hg-engine/diff-upstream-vs-retiled.json
```

Ability names and descriptions: `hg-engine/upstream-61b510c/text/720.txt` and `722.txt` (one line per ability ID,
`\n` is a line break; 722 has 5 changed lines against the old pin). Move descriptions, priority and flags are in
`source/data/Moves.c`.

The repo has release tags since v6.6.0 (`heartfelt-v1.0.0`, `v6.12.1`, ...): pin a new release to its tag's commit.
If a later release drops one of the engine files from `HG-Engine/`, fall back to upstream at the last commit before
that release: `curl -s "https://api.github.com/repos/BluRosie/hg-engine/commits?sha=main&until=<release ISO time>&per_page=1"`.
The Walkthrough and Item-Locations guides are the ones to watch for a Heartfelt rewrite.
