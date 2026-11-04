# Making a new guide

The whole procedure for a new hack's guide (CLAUDE.md points here). Routing: CLAUDE.md → Where a session works.
The main chat writes the unit list (`plans/<hack>.md`: one unit per step / tab, with the sibling hack's script to
adapt); agents build the units (Workflow → Which model).
1. Fetch the sources into `hacks/<hack>/.src/` with its `SOURCES.md` (what to collect:
   `.agents/references/new-guide-sources.md`); write its `watch.json` (3DS hacks also need the user's vanilla romfs
   dumps: `tools/README.md` → 3DS game data). Update its "Fetched" line and the source log in `tools/README.md`.
2. Write `hacks/<hack>/extract/` scripts (the shared layout: `tools/extractlib.py` docstring; copy a built hack's) that
   turn them into `hacks/<hack>/data.json`, in the schema in `hacks/emerald-imperium/notes.md` (Data schema).
   `build.py` ends with `extractlib.finalise()`, which applies the shared rules (`template/README.md` → Shared rules:
   Items standard, cap split names, Trainers in walkthrough order, schema); a hack only adds an `itemstd.RULES` entry
   for its quirks. Trainer keys: with no `extract/trainer_keys.json` yet, `finalise()` (`tools/trainer_keys.py`) writes
   it from the extract's own keys (the "g.s.t" positions of that first build), so the first build seeds it; commit it
   with the first data.json. Pickup keys (`extract/pickup_keys.json`, one per item pickup line) work the same way.
   Items data: the hack's bag text for every item in `extract/item_desc.json` (`{item: [text, changed vs vanilla]}`;
   gaps fill from other guides, then `extract/item_text_extra.json`), wild held-item odds in `P.hi` (`[[item, %]]`),
   hack-changed In battle text in `extract/battle_text.json`, encounters through `tools/encstd.py` (every row: wild,
   gifts, statics, trades, the starter; `template/README.md` → Encounters; Eternal X's `locs.py` is the example), and the guide's generation in `tools/item_text.py`. Later builds match trainers to it and only add entries. What the template shows when the data has it: `template/README.md` → What the data switches on.
   For hacks with public source code, the code wins over the docs ("Sheet says ..." on differences); 3DS hacks take
   the game data over the docs ("Doc says ...").
   Calc: settle each trainer `field` record marked `review` (`tools/trainer_fields_check.py`) with me (notes.md,
   normalised in `tools/trainer_fields.py`); check the mechanics doc for permanent weather / terrain (`setterStays`).
   Save import: the extract writes the hack's save ID tables (`GID`: species / forms, moves, items, abilities as the
   game numbers them, from the game source or game files) and the guide gets a reader for its generation
   (`template/calc/readers/README.md`); check it on a save with `.agents/references/calc-save-reader.md`. A doubles
   tag the shared list doesn't know yet goes in `tools/trainer_fields.py` → `DOUBLES_TAGS`.
   Hacks come in families (PROGRESS-DETAIL.md → Hack families): reuse the family's shared code (3DS: `tools/ctrguide.py`),
   write a family's first guide so its siblings can reuse it, and lift the shared part out when the second one comes.
3. `python -X utf8 -I tools/new_hack.py <hack> --like <built hack> [--title "Game name"] [--version N] [--ls-prefix prefix]`:
   scaffold `hack.json`, notes / SOURCES headings, empty sprites, extract modules and check, gate rebuild and calc
   scenario / engine-check stubs. Existing files need `--force`; SOURCES text is append-only. `--dry-run` lists writes.
   No data.json yet: assembly and default gates skip it. Add the guide to the PROGRESS.md guide table.
4. Sprites: every guide uses the shared set (`sprites/README.md`); keys are worked out from dex number and name.
   `python -X utf8 -I tools/sprite_keys.py <hack>` lists the forms it matched (check once) and the species it couldn't place:
   those are the hack's own additions and go in its `sprites.json`, the only art a hack keeps. `assemble.py` lists
   species with no sprite; they show as a type-coloured circle with the name's first letter.
5. Damage calc: `hack.json` → `cfg.calc` from the hack's mechanics ([calc mechanics](.agents/references/calc-mechanics.md));
   once the hack's save family has a reader, its ID tables and `save` ([save reader](.agents/references/calc-save-reader.md)).
6. Finish the scaffold TODOs: audited sources / watch, extract modules and checks, cfg wording / feature switches,
   version / mode and notes. The first build writes data.json, report.txt and trainer_keys.json; commit all three.
   Calc stubs skip while disabled and fail when enabled: fill source-backed scenarios / engine fixtures, replace
   calc-doubles EXPECTED's null, add trainer_fields_check counts and review calc/test.mjs profile fixtures. The
   scaffold registers the engine check in calc/package.json; itemstd RULES needs an entry only for hack quirks.
   `uv run python -X utf8 -I tools/gate.py check <hack>` (baseline setup: `tools/README.md` → Standard gates).
   Then `python -X utf8 -I tools/preview.py dist/<hack>.html --frame` for Thor-frame review on the phone preview.
