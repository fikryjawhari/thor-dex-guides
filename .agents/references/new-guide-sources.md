# New guide: the sources to collect

Every piece of hack data a guide is built from, and where it usually comes from. A sources session fetches what it
can find into `hacks/<hack>/.src/` (git-ignored), writes `hacks/<hack>/SOURCES.md` (where each file came from, the
pin or date, the re-fetch commands) and `watch.json` (what `tools/check_updates.py` watches), and ends with an
inventory: one line per item below saying which file covers it, or "none found". No extraction yet.

Rules: the hack's code / game data wins over its docs (hacks with public source; 3DS and NDS: the game files), the docs
are the check. Never commit raw author files (xlsx, pdf, zips, ROMs, dumps). Look at the hack's family first
(PROGRESS.md → Hack families): a sibling guide's SOURCES.md lists the files that family has.

## Where hack data lives (by kind of hack)
- **Decomp hacks** (pokeemerald-expansion, CFRU, hg-engine): the public repo at the release commit (species, moves,
  learnsets, items, trainers, encounters, text). Pin the commit that matches the released patch.
- **3DS hacks**: the mod's romfs + the user's vanilla romfs dumps (`tools/README.md` → 3DS game data); trainers from
  the EV-less copy where the user plays one.
- **NDS hacks** (closed source): the user's ROM in `.src/rom/` (personal data, text banks, trainers, encounters) and
  the hack's docs.
- **Closed GBA hacks** (Unbound-like): the hack's docs and its wiki; the engine's public code for mechanics.
- **Always**: the author's docs (Drive / PokeCommunity / Discord exports: changes lists, trainer sheets, item and
  location sheets, mechanics notes), the changelog, and the version / release page.

## What the guide needs
| Area | Data | Typical source |
| --- | --- | --- |
| Pokémon | species and forms, types, base stats, abilities (hidden too), evolutions (method, level, item), learnsets (level, TM / HM, tutor, egg), which are obtainable | code / game files; docs for changes |
| Wild held items | each species' held-item slots (2 or 3) with their position, so the odds can be worked out | species data (`.itemCommon` / `.itemRare`, personal data) |
| Moves | type, category, power, accuracy, PP, priority, crit stage, target, flags (contact, sound, ...), secondary effects and chances, description; the hack's changes | code / game files; the hack's move-changes doc |
| Abilities | name, in-game description, the hack's changed or new abilities and exactly what they do | code / text; changes doc |
| Items | every item's name and bag description (to mark text the hack changed: the vanilla base's text too); the hack's new items and what they do; items with changed effects | item data / text banks; items-changes doc |
| Item locations | every place each item is found, given, bought (with price / currency) or won, hidden or not, missable or not, post-game or not | item location sheet / walkthrough / code (map scripts, marts) |
| Encounters | every area's wild Pokémon by method (grass, surf, fishing rods, headbutt, rock smash, hordes, SOS, raids ...), rates, levels, time / season variants; statics, gifts, trades, eggs | encounter tables in code / game files; location docs |
| Locations | the area list in game order (for the tracker), sub-areas, which areas share a tracker slot | the walkthrough / docs; map data |
| Trainers | every trainer: name, class, place, team (species, level, ability, item, nature, IVs / EVs, moves), doubles, rematches, difficulty variants, starter-dependent teams; boss order | trainer data in code / game files; trainer sheet (checks) |
| Walkthrough | the game's order of stops, what each stop has (items, trainers, events), level caps, splits | walkthrough doc; level-cap doc |
| Mechanics | the generation the battles follow, changed mechanics (crit rules, weather / terrain, permanent field effects, EVs, level caps, AI notes) | mechanics doc; engine code |
| Move tutors, useful NPCs | each tutor's place, moves, cost and unlock; NPCs that do something useful (move relearner, EV / IV changers, name rater ...) | docs; map scripts |
| Save import (calc) | the game's ID tables: species / forms, moves, items, abilities as the game numbers them; a real save from the user to test | code constants / game files; `template/calc/readers/README.md` |
| Sprites | only the hack's own new forms (everything else is the shared set) | the hack's graphics |
| Item icons | the hack's own new items' icons, if it has art for them | the hack's graphics |
| Credits | authors and every source used | release page, docs |

Optional but used when found: a wiki or dex site (fills item text and gaps), Showdown / calc data the hack's
community keeps (hzla Dynamic-Calc-Decomps backups: trainer sets and the calc oracle).
