# Hardlove Gold docs

Fetched 2026-10-18 (release 0.8.2, 2026-10-15). The authority is the hack's own source code,
[kumakuma1/hardlove](https://github.com/kumakuma1/hardlove) (the author's hg-engine build, branch `beta_hardlove`),
pinned at `8ac661afda` (2026-10-15 11:05, "can choose starter nature", the 0.8.2 commit). 0.8.3 (2026-10-18) is
`f1b2363001` (08:06 UTC, "use copy of pp for calcing mega stats"); between the two, only `data/Trainers.c` changed among
the files below (5 E4/Red sets, commit `4c171c8d91`), so those sets were patched into the guide on 2026-10-19 instead of
a full rebuild. The Trainer Battles sheet was updated the same day and matches them; its ~60 other differences from
`Trainers.c` remain, and the guide keeps the game sets (a calc import of the 0.8.3 ROM agrees with `Trainers.c`). The
sheet lists Will [Double] (702) and Koga [Double] (703) twice; the guide keeps one of each (the game has one), so a
rebuild must drop the second rows again (keys 9.0.2, 9.0.5). The rest comes from the hack's
[docs site](https://kumakuma1.github.io/hardlove-docs/index.html) (repo
[kumakuma1/hardlove-docs](https://github.com/kumakuma1/hardlove-docs) at `bb5862f`, 2026-10-02, older than 0.8.0) and its
[Google Drive](https://drive.google.com/drive/folders/1IltXECEUg7YKeUxO9K6g4bmg33NI4Wax). The guide,
`guides/hardlove-gold-dex.html`, has the methodology ("SOURCES", numbered 0–8 below), data rules, schema and the full
build report in its opening HTML comment, and its builder (Python stdlib + Node) in `<script id="build-source">`.

| Path | Build notes § | Contents |
| --- | --- | --- |
| `repos/hardlove/` | 0 | The hack's source at the pinned commit (`COMMIT` holds the sha): `data/Species.c`, `HiddenAbilityTable.c`, `learnsets/learnsets.json`, `Evolutions.c`, `Moves.c` (+ `include/config.h` for the Champions move flags), `Trainers.c`, `Encounters.c`, `SafariEncounters.c`, `Headbutt.c`, `MachineMoves.c`, `HiddenItems.c`, `itemdata/itemdata.c`, form tables, `doc/` (Mechanics, level caps). Stats, types, abilities (with hidden), all move lists, evolutions, move data, trainer sets and TM numbers come from here; wild tables are checked against it |
| `site/pokedex/` | 1 | One page per Pokémon. Now only the species list and order, names, other forms and sprites. Its data predates 0.8.0/0.8.1 and has no hidden abilities. Female-only species have 0-byte sprites |
| `repos/sprites/` | 1 | Sprites for those female-only species, from `repos/hardlove`'s `data/graphics/sprites/<id>/female/front.png` |
| `Pokemon Locations.xlsx` | 2 | Sheet `13PoaWuu8lcyTSa6iI1gz6RyQVNqaY6WvrrI18k32mys`: availability, pools, gifts, trades, Game Corner, wild tables (checked slot by slot against `Encounters.c`; the game wins where they differ) |
| `Trainer Battles.xlsx` | 3 | Sheet `1QtkxHFLeb1VVde2LEJiibGFRNoeFFcangj_OuX13OUI`: trainer order, splits, places, tags and cell notes. The sets themselves come from `Trainers.c` |
| `Move Changes.xlsx` | 4 | Sheet `1tlmV57L8dCQANVsNJrfvqCdfxeuZGN7o0ddZO11L3k4`: change notes; numbers come from `Moves.c` |
| `Item Location.xlsx` | 5 | Sheet `1ymB4zPhToZ04xX3cdYSEEGX_D66OIrd9p-krdcafdSM`: item locations (map scripts are not in the source, so this stays the source for them); TM/HM numbers checked against `MachineMoves.c` |
| `repos/hardlove.js` | 6 | [kumakuma1/hardlovecalc](https://github.com/kumakuma1/hardlovecalc) backup at `76ad13b` (Jan 2026): only a fallback for missing types now |
| `repos/showdown/` | 7 | pokemon-showdown 0.11.11 `moves.js`, `text/moves.js`, `pokedex.js`, `text/abilities.js`: descriptions, dex numbers, the Gen 9 baseline for move notes |
| `Mechanics.txt` | 8 | Same as `repos/hardlove/doc/Mechanics.txt`. Shown in the guide's Walkthrough tab |
| `Hardlove Gold AI document_WIP.txt`, `Post-KO Switch-in AI.xlsx` | 8 | Trainer AI. Shown in the guide's Walkthrough tab |
| `Move Performance.txt` | – | Generic move-order notes copied from a wiki; not used |

## Re-fetch

```bash
D=hacks/hardlove-gold/.src
SHA=f1b236300187a2b18bf1a0b5ee1f80b3a2fed57b   # 0.8.3; update to the commit of the release you want
R=https://raw.githubusercontent.com/kumakuma1/hardlove/$SHA
python -I tools/drive_ls.py 1IltXECEUg7YKeUxO9K6g4bmg33NI4Wax $D
python -I tools/mirror.py https://kumakuma1.github.io/hardlove-docs/index.html $D/site
for f in data/Species.c data/HiddenAbilityTable.c data/learnsets/learnsets.json data/Evolutions.c data/MachineMoves.c data/Moves.c \
         data/Trainers.c data/Encounters.c data/SafariEncounters.c data/Headbutt.c data/HiddenItems.c data/itemdata/itemdata.c \
         data/FormToSpeciesMapping.c data/PokeFormDataTbl.c data/text/keys.csv include/config.h include/constants/species.h \
         asm/include/species.inc asm/include/items.inc doc/Mechanics.txt doc/LevelCaps.txt doc/Items.txt doc/GymHealing.txt; do
  mkdir -p $D/repos/hardlove/$(dirname $f); curl -sf $R/$f -o $D/repos/hardlove/$f || echo "missing $f"; done
echo $SHA > $D/repos/hardlove/COMMIT
mkdir -p $D/repos/showdown/text $D/repos/sprites
curl -sL https://raw.githubusercontent.com/kumakuma1/hardlovecalc/76ad13b2fc6b98cd93aecdb3813265d904ff9694/backups/hardlove.js -o $D/repos/hardlove.js
for f in moves.js text/moves.js pokedex.js text/abilities.js; do curl -sL https://cdn.jsdelivr.net/npm/pokemon-showdown@0.11.11/dist/data/$f -o $D/repos/showdown/$f; done
# female-only sprites (the site's files for these are empty):
for f in $(find $D/site/pokedex/sprites -size 0 -name '*.png'); do i=$(basename $f .png); curl -sfL $R/data/graphics/sprites/$i/female/front.png -o $D/repos/sprites/$i.png || rm -f $D/repos/sprites/$i.png; done
```

For an update, find the release commit first: the repo has no tags, so match the changelog date and its newest item to
`curl -s "https://api.github.com/repos/kumakuma1/hardlove/commits?sha=beta_hardlove&since=<date>"` (0.8.2 = "can choose
starter nature"). `beta_hardlove` moves ahead of releases. Don't use `333sensation/hardlove`: it's an unrelated
AI-edited copy (all species wild, 1/512 shinies). The Drive sheets have no version number, so re-download them. Mime Jr.'s
page 404s on the site. The Drive's "Footage" and "Patch" subfolders are not needed. No walkthrough exists; the trainer
sheet's split tabs give the order.
