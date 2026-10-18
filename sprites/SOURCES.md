# Shared sprite set: sources

Fetched 2026-10-19: `rh-hideout/pokeemerald-expansion` branch `master`, commit
`73b3fbeb574327cd9420c89e56bef5aa3c08fead` (2026-10-14). The commit is also in `index.json`.

## Re-fetch and rebuild

From the repo root in Git Bash (the clone is a sparse, blob-less checkout of about 40 MB; keep it outside the repo):

```sh
git clone --depth 1 --filter=blob:none --sparse https://github.com/rh-hideout/pokeemerald-expansion.git ../pee
MSYS_NO_PATHCONV=1 git -C ../pee sparse-checkout set --no-cone /graphics/pokemon/ /src/data/pokemon/species_info/ \
  /include/constants/species.h /include/constants/pokedex.h /src/data/graphics/pokemon.h /CREDITS.md
python -I tools/sprites_pee.py ../pee sprites
```

The script rewrites `sprites/png/` and `sprites/index.json` and prints the key count plus any species it couldn't
place. Check new forms with a contact sheet before committing, then update the "Fetched" line above.

To spot an update: `curl -s "https://api.github.com/repos/rh-hideout/pokeemerald-expansion/commits?per_page=1"`.
New forms land on the `upcoming` branch first and reach `master` with each release.

## Terms and credits

The expansion has no licence file. Its `CREDITS.md` lists the contributors and these sprite resources, which the
guides credit alongside the expansion (index page and each guide's footer, `cfg.credit`):

- pokeemerald-expansion (rh-hideout) and its contributors: https://github.com/rh-hideout/pokeemerald-expansion
- Sugimori Palettes and Sprites: https://www.pokecommunity.com/showthread.php?t=336945
- DS Style Gen VI Sprites: https://www.pokecommunity.com/showthread.php?t=314422
- Gen VII and Beyond Sprites: https://www.pokecommunity.com/showthread.php?t=368703
- pokeemerald (pret): https://github.com/pret/pokeemerald/

Pokémon and its art are © Nintendo / Creatures Inc. / GAME FREAK inc. The guides are free and non-commercial.
