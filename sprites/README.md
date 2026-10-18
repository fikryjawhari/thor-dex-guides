# Shared sprite set

One standard set of front sprites used by every guide; a hack's own art only adds forms the set lacks.

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

**Every guide uses this set** (the user, 2026-10-19). A hack's own art is only for forms the set doesn't have.

- `assemble.py` gives every species a sprite key with `tools/sprite_keys.py`: an explicit `P[].sk` in `data.json`,
  else an override in `hack.json` → `sk` (`{"species id": "key"}`), else worked out from the species' dex number and
  name ("Mega Absol Z" → `0359-mega-z`, "Shellos East Sea" → `0422-east`, "Deerling Summer" with no dex number →
  `0585-summer`). No extract step has to do anything.
- It inlines `png/<key>.png` (following `same`). Only the sprites a guide uses are inlined, so a Gen 7 hack carries
  no Gen 8–9 art. `#spr` in the built guide stays keyed by species id.
- Every inlined sprite (shared or the hack's own) is cropped to its visible pixels as a square, so each Pokémon
  fills its box whatever its size (`tools/pngpal.py` `crop`). The files here stay full 64×64 frames.
- **Finding a hack's custom forms:** `python -I tools/sprite_keys.py <hack>` lists every form it matched and every
  species it couldn't place. The unplaced ones are the hack's additions (new Megas, new forms, fakemon); `assemble.py`
  also reports them as "NO SPRITE" until they have art, and the guide shows a type-coloured circle with the name's
  first letter in their place. Check the matched forms list once for a wrong match; fix one
  with a `hack.json` `sk` override, or teach `sprite_keys.py` the word.
- **The supplement:** the hack's own `sprites.json`, keyed by species id (or sprite key), holding only those
  additions. An entry there wins over the set, so a recolour the docs call out can go there too. Matching can't spot
  a recolour of a standard form; the hack's docs or changelog would mention one.

Current guides (2026-10-19): Emerald Imperium keeps 28 of its own sprites (its Megas for Butterfree, Machamp, Kingler,
Lapras, Snorlax, Slaking, Torterra, Infernape, Empoleon O/D, Luxray, Roserade, Dusknoir, Garbodor and the Galar
Gigantamax line; Primal Dialga/Palkia; Pikachu Surfing/Flying). Of its other 1247, 1154 were pixel-identical to this
set and the rest were the expansion's later touch-ups of the same designs (Gen 7 reshades, Silvally, Koraidon...),
not hack changes. Hardlove Gold has no sprites of its own: all 986 species are standard forms.
