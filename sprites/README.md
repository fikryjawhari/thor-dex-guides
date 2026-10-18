# Shared sprite set

One standard set of front sprites for guides whose hack has no art of its own. Emerald Imperium and Hardlove Gold
ship their own art (`hacks/<hack>/sprites.json`) and don't need it.

**Source: pokeemerald-expansion** (chosen 2026-10-19; pin, re-fetch and credits in `SOURCES.md`). 64×64 4bpp palette
PNGs, colour 0 transparent, the same format as Emerald Imperium's own sprites. DS-style art for every generation (the
expansion's modern sprites, not its `_gba` Gen 3 originals).

- `png/<key>.png`: 1593 sprites, 1.2 MB. Every national dex number 1–1025, all Megas including every Legends: Z-A and
  Mega Dimension Mega (Raichu X/Y, Absol/Garchomp/Lucario Z, Tatsugiri ×3, Zygarde, Magearna...), Primals, regional
  forms, Gigantamax, gender differences, Unown, Vivillon, Alcremie, Furfrou, Pikachu caps, totems, Ogerpon and
  Terapagos forms.
- `index.json`: `keys` (every key → the expansion's species constant, 1666 keys) and `same` (73 keys whose picture
  and palette are identical to another key, e.g. `0658-bond` → `0658`, the Scatterbug/Spewpa patterns, Minior
  meteors, totems). `assemble.py` follows `same`, so a hack can use either key.
- Rebuilt by `tools/sprites_pee.py` (SOURCES.md).

### Why not hg-engine (checked 2026-10-19, `BluRosie/hg-engine` `f4fca05`)

DS 80×80 art with folders for every form, but about 100 of them were still a Bulbasaur placeholder: every Gigantamax,
15 Z-A Megas (Floette, Chandelure, Chesnaught, Pyroar, Malamar, Meowstic, Crabominable, Golisopod, Glimmora,
Scovillain, Baxcalibur, Tatsugiri ×3, Magearna Original), Terapagos, Iron Hands/Leaves/Crown, Crowned
Zacian/Zamazenta, Origin Dialga/Palkia, the Pikachu caps. The expansion had no placeholders. Worth re-checking only if
a DS-style 80px set is ever wanted.

## Key scheme (agreed 2026-10-19)

Every sprite, in this set or in a hack's supplement, is keyed by national dex number plus form:

- `NNNN` for the base form, four digits, zero-padded: `0001`, `0025`, `1025`.
- `NNNN-<form>` for any other form, the form slug in lowercase with hyphens:
  `0006-mega-x`, `0006-mega-y`, `0037-alola`, `0052-galar`, `0128-paldea-blaze`, `0479-wash`, `0025-gmax`,
  `0382-primal`, `0521-f` (gender difference), `0201-b` (Unown letters), `0869-ruby-cream` (cosmetic).
- Megas use `mega` (plus `-x` / `-y` / `-z`, or a hack's own suffix); regional forms use the region name
  (`alola`, `galar`, `hisui`, `paldea`); Gigantamax is `gmax`.
- Fakemon and anything else with no national number: `x-<hack>-<name>`, e.g. `x-radical-red-foo`.

In this set the slug is the expansion's species constant (Showdown naming) minus the dex name, taking its shortest
alias and dropping the base form's own suffix: `SPECIES_ALCREMIE_RUBY_CREAM` → `0869-ruby-cream`,
`SPECIES_MEOWSTIC_M_MEGA` → `0678-mega`, `SPECIES_TATSUGIRI_DROOPY_MEGA` → `0978-droopy-mega`,
`SPECIES_TOXTRICITY_LOW_KEY_GMAX` → `0849-low-key-gmax`. Look a form up in `index.json` → `keys` when writing an
extract step.

## How a guide gets its sprites

Each hack's extract step gives every species in its `data.json` a sprite key (`P[].sk`). `assemble.py` then takes,
per species: the hack's own `sprites.json` entry under its species id or its `sk`, else `png/<sk>.png` (following
`same`), and reports any species with neither. Only the sprites a guide uses are inlined, so a Gen 7 hack carries no
Gen 8–9 art. `#spr` in the built guide stays keyed by species id.

(Emerald Imperium and Hardlove Gold don't have `sk` yet: their `sprites.json` is still keyed by their own species
ids and covers every species, which `assemble.py` reads as is.)

Hacks only **supplement** what the set lacks: new Megas (Emerald Imperium's Mega Empoleon), new non-Mega forms
(Radical Red), the rare fakemon. A supplement is the hack's own `sprites.json`, keyed by sprite key.
