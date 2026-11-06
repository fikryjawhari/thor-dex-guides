# Fill encounters from a save

The user's request (2026-11-06): on save import, offer a
"Fill from save" button that fills the encounter tracker from each Pokémon's met location.

## Shape

- The save readers (`template/calc/readers/`) read the met location field; none does yet. Each family's offset comes from
  its format notes in `template/calc/readers/README.md`.
- A guide's data maps a met location id to its tracker slot (a new table, keyed by id, values `AR` indexes: stable keys).
- Filling never overwrites a slot that already has an entry, failed ones included. An evolved Pokémon matches by family
  (`FAM`), and is stored as the species the slot offers. A Pokémon the slot doesn't offer is reported, not guessed.
- The save only holds Pokémon that still exist: a released or failed encounter can't be detected, and eggs show where
  they hatched. Say so on the result.

## Per guide (first look, not verified against a real save)

| Guide | Effort | Why |
| --- | --- | --- |
| Emerald Imperium | Easy | `extract/map_meta.json` has each map's region map section |
| BB2R | Easy | Slots were merged by place ID |
| Radical Red | Easy to moderate | Slots follow FRLG map sections (`locs.MERGE_TABLE`); needs a table of ids to names |
| Photonic Sun, Eternal X | Moderate | Needs the game's location ID table matched to slots |
| Hardlove Gold | Moderate (estimate) | Should be mostly HGSS ids; unchecked |
| Unbound | Hardest | No release-matched map headers locally (`notes.md`); would need mapping from real saves |

Start with Emerald Imperium or BB2R; each hack checks its own mapping in its own pass.
