# Shared sprite set (not chosen yet)

One standard set of front sprites for guides whose hack has no art of its own. Emerald Imperium and Hardlove Gold
ship their own art (`hacks/<hack>/sprites.json`) and don't need it.

## Key scheme (agreed 2026-10-19)

Every sprite, in this set or in a hack's supplement, is keyed by national dex number plus form:

- `NNNN` for the base form, four digits, zero-padded: `0001`, `0025`, `1025`.
- `NNNN-<form>` for any other form, the form slug in lowercase with hyphens:
  `0006-mega-x`, `0006-mega-y`, `0037-alola`, `0052-galar`, `0128-paldea-blaze`, `0479-wash`, `0025-gmax`,
  `0382-primal`, `0521-f` (gender difference), `0201-b` (Unown letters), `0869-ruby-cream` (cosmetic).
- Megas use `mega` (plus `-x` / `-y`, or a hack's own suffix such as `mega-z`); regional forms use the region name
  (`alola`, `galar`, `hisui`, `paldea`); Gigantamax is `gmax`.
- Fakemon and anything else with no national number: `x-<hack>-<name>`, e.g. `x-radical-red-foo`.

Each hack's extract step gives every species in its `data.json` a sprite key (`P[].sk`). `assemble.py` then takes
the hack's own sprite for that key if it has one, else the shared set's, and reports any species with neither.
(Emerald Imperium and Hardlove Gold don't have `sk` yet: their `sprites.json` is still keyed by their own species
ids and covers every species, which `assemble.py` reads as is.)

## Requirements (the user, 2026-10-19)

- Every species and form through Gen 9 **and Legends: Z-A, including all its new Megas**, plus regional forms,
  cosmetic forms and Gigantamax if available.
- A size that matches the template (the 64 px class) and a licence that's OK to redistribute in a public repo
  (credited on the index page and in each guide's footer).
- Hacks only **supplement** what the set lacks: new Megas (Emerald Imperium's Mega Empoleon), new non-Mega forms
  (Radical Red), the rare fakemon. A supplement is the hack's own `sprites.json`, keyed the same way.

## Candidates to check first

The user's idea: the decomp/engine projects most hacks are built on already carry full sets.

- **pokeemerald-expansion** (RHH): GBA-style 64×64 front sprites for every species and form it supports, palette
  PNGs. Check coverage through Gen 9 and the Z-A Megas, and its sprite credits/licence.
- **hg-engine** (BluRose): DS-style sprites; Hardlove Gold (built on it) already has the Legends: Z-A Megas, so that
  art exists in DS style. Check whether it's in hg-engine itself or only in the hack.

Pick one style for the set (GBA 64×64 or DS), note its source and licence in a `SOURCES.md` here, and write the
sprites as `sprites/<key>.png` or one `sprites.json` (decide with the size measured).
