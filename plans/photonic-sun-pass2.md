# Photonic Sun, pass 2 (the user's review, 2026-10-20)

Branch `worktree-photonic-sun-changes`. Done one tab at a time (decisions in one tab feed the next): Locations,
Trainers, Items, Walkthrough. Every UI change gets a mockup first: a plain interactive HTML artifact at the viewer
sizes, **the current design on the far left**, then each proposed design beside it.

## Starting a new session on this

Work happens in the worktree `.claude/worktrees/photonic-sun-changes` on branch `worktree-photonic-sun-changes`.
First run `git branch --show-current`; if it isn't that branch, switch with EnterWorktree (`path` =
`.claude/worktrees/photonic-sun-changes`), never edit this work on `main`. Its `hacks/photonic-sun/.src/` is its own
git-ignored copy (no `romfs-dl/`; re-extracting the dex uses main's `romfs-dl` path and the Azahar dumps, see
SOURCES.md). Merge `main` in before starting if it moved.

## Status

- 2026-10-20, Locations round 1 mockup: https://claude.ai/artifact/88znwiq6cDMd15oBSp1aDG (designs A/B/C for SOS,
  the width fixes, a Findings tab with the density table and doc vs game list). Waiting for the user's pick.
  Sources (job scratch, not committed yet): mock/outer.html, patch.js (overrides `locPlace`/`locBox` in the real
  build), patch.css, findings.html, build.py. Copy them into `tools/mockup/` once signed off.
- Done on the branch, not committed: `tools/ctr_dex.py` keeps SOS caller → ally per slot (`sosBy`), and
  `.src/dex-rebalanced.json` was re-extracted with it (identical apart from the new field). `locs.py` builds the new
  sections as `D['_LT']` (not written to data.json; `LT_OUT=<file>` in the environment dumps it). data.json is
  unchanged.
- Bugs found in the current Locations data (fixed by the new sections): Route 1 Grass 2/3 rates doubled (the same
  table in two game areas); East Sea Shellos missing (SOS ally); Poni Grove lists 0% Stakataka / Blacephalon;
  Brooklet Hill plain fishing labelled bubbling; "11Cave" label.

- Mockup sources now in `tools/mockup/ps-locations/` (outer, patch.js/css, findings, build.py, check.mjs, plus
  maps.py = renders the PDF's area maps, pdfcmp.py = doc vs game comparison). Rebuild: `LT_OUT=<lt.json> uv run
  python -I hacks/photonic-sun/extract/build.py`, `uv run python -I tools/mockup/ps-locations/maps.py <dir>`,
  `python assemble.py photonic-sun`, then `python -I tools/mockup/ps-locations/build.py . <lt.json> <dir>/maps.json
  <out.html>`. Test over http (`python -m http.server`), not file:// (srcdoc frames get an opaque origin there).
  check.mjs: `node check.mjs <url> <shot.png> [loc|mv|ab] [area name]`.

### Built 2026-10-20 (same session), waiting for the user's look on the phone preview / Thor

Everything in the list below is built: sections as AR.es (data.json), SOS drop-downs with ally search, Starter box
(AR.st) synced with the tracker bar's picker, doc maps (AR.map, rendered by locs.py `pdf_maps()`), move page stat
boxes, ability slot tags, the sticky gap (fractional `--sh`/`--hh` and a 1px tuck), the starter picker ("Not chosen",
shrinks), a zero-width space before every tag so it can wrap, `table.lrn` names may break (two move pages were 261).
The walkthrough's encounter lines now come from the sections (one line per section; the walkthrough tab redo is
later). The evo/breed tag is still shown elsewhere: ask the user whether to drop it everywhere.
Checks: `tools/mockup/ps-locations/guidecheck.mjs` (260x316, normal and kb): no page errors, every location /
move / ability page 260 wide. `domcompare` EI and HG vs main, normal and `--kb`, with the expected changes ignored
(zero-width space, move stats, ability slots, `lrn`, "(show all)", `--sh`/`--ch` values): 0 differing, 0 errors.
Found, not fixed (older, HG only): the Infiltrator ability page is 262 wide at 260 in main too; nothing inside #app
overflows, so probably the footer.

### Decided 2026-10-20 (round 1 sign-off)

- **Locations: design A** (one section per game table, day/night in one row, Water with bubbling as a second rate,
  Other, Special, Starter box tied to the picker, SOS allies in a drop-down under each caller). Plus: **searching an
  SOS ally** (e.g. Snorlax) must find the places where it's an ally and show its callers there (search matches
  allies too; opening the place shows/opens the caller's drop-down).
- **Maps: the doc picture** in a closed drop-down ("perfect"). 7 areas (Route 1, Hau'oli City, Routes 2, 3, 5, 6,
  Mount Hokulani). Ships as small crops of the doc in the hack's folder (needs a hack-level asset, e.g.
  `hacks/photonic-sun/maps.json`, inlined by assemble.py), credited to the doc. Shrink them (max ~520 px wide).
- **Move page: design C** (four stat boxes, two by two when narrow). Template, every guide.
- **Ability page: design B, changed:** no third column; each Pokémon shows which slot the ability is: "Ability 1",
  "Ability 2", "Hidden ability", or "Only ability" when both normal slots are this ability. No evo/breed tags there.
- **evo/breed tags:** the user is leaning towards removing them everywhere (rarely uses the dex for that). Ask once to
  confirm, then drop the tag (check what else uses `tag()`: Mega / Form change / Not found stay).
- **Template bugs the user found** (all guides, also in the current build):
  - A 1 px gap between the pinned place header (white) and the pinned section header (yellow) on Locations
    (sticky `top:calc(var(--hh) + var(--sh))`, `--sh` probably rounds down; check with getBoundingClientRect).
  - The tracker bar's starter `<select>` ("Not chosen (show all)") overflows at 260: shorten the label (e.g. "Not
    chosen") and/or `max-width:100%;min-width:0`.
- Then: Trainers, Items, Walkthrough tabs, one at a time (the user may do them in a new session).

## Template width bugs (every guide; propose fixes in a mockup)

- Move pages whose accuracy is "Never misses" are 277 px wide at 260 (the Power / Accuracy / PP / Priority table;
  EI has 178 such pages too).
- A "Crabominable" + "evo/breed" tag row makes two Photonic Sun ability pages 267 px.

## Locations

- Route 1's four encounters are right (the common nuzlocke rule: starter, Route 1 proper / outskirts, Trainers'
  School, Hau'oli City). **Rename the "Iki Town" area to "Starter"** and tie it to the starter picker. Ultra Sun
  gives the starter on Route 1, not in Iki Town.
- Too many boxes: Route 1 shows 5 grass tables with separate day / night boxes, plus outskirts, SOS ally, surfing,
  fishing and bubbling day / night. Wanted: **one box per game table**, day / night shown inside the box (only the
  one or two species that swap or change rate are marked), e.g. Route 1: main section, Grass 1, Grass 2, Grass 3,
  Hau'oli Outskirts, Tauros Charge, Water (surfing + fishing + bubbling in one box).
- **SOS:** the game data has caller → ally per slot (tools/ctr_dex.py `sosBy`, added 2026-10-20). Two ways to show it,
  both useful: (a) under each caller, its allies (good for "is this dupe worth chaining?"); (b) an SOS box listing
  allies, each opening to the species that call it (good for "how do I get Mareanie?"). Try both in the mockup. The
  PDF sometimes has SOS as its own table and sometimes as an ally column: the guide should be consistent.
- **Maps:** the PDF has maps with numbered grass patches (Route 1: 1, 2, 3). Find a way to show where each table is.
- Need one schema for all areas: berry piles (Route 2), ambush encounters, dust clouds (Verdant Cavern), shadows
  (Route 3), numbered grass. Not simply "every doc table is a box" (too many small boxes) nor 30-row boxes (hard to
  scroll on the Thor). Maybe sort long lists alphabetically.
- Analysis asked for: Route 1's unique encounters; a method-density table (tables vs species per area) to find the
  areas with many methods and few Pokémon, and the reverse (Sandy Cave: 8 Pokémon in 1 table).
- Doc vs game differences: report them; the game files are the source of truth.

## Trainers

- Hau on Route 1 has no team for a Litten starter: fix.
- Level 80 Team Skull grunt in Route 1 looks wrong: place it at its real story visit (another Route 1 visit) or move
  it to the bottom. Same kind: Youngster Kenway in Royal Avenue (already at the bottom). Look for others.
- Sina / Dexio and the Ultra Recon Squad: note which one you fight in Photonic Sun vs Prismatic Moon (a note is
  enough, no game switch). Archie / Maxie are probably split by game; others have two teams to pick from.
- Aether Paradise needs its own area for trainers and walkthrough (visited twice, maybe three times). The level 80
  three-Pokémon Faba is a Multi Battle (probably with the Ledian → Staraptor Aether employee), mis-filed.
- Level caps: next trial / Grand Kahuna (the objective rule), e.g. split 1 = 11 to Ilima, 16 to Gumshoos, 21 to Hala.
  Also list potential mini caps (Ultra Recon Squad, Plumeria before Olivia...) and document both sets so the user can
  switch. If a mini cap sits just before a bigger cap with a different level, the bigger one is enough.
- "Other trainers" need sorting: a blank "Pokémon Trainer"; Captain Mallow = her Kantonian Gym appearance (add that
  kind of note, check others); Harper and Sarah maybe Kantonian Gym; Hau's level 5 Rowlet.
- Mark Multi / Tag / Double battles and the partner: the three Hau teams at Aether Paradise are him on your side
  (not a fight). The hack adds no fights, so map the vanilla walkthrough's story partner battles onto the data.

## Items

- Shops: one row per item (Hau'oli City power items, Oval Stone, Prism Scale; Route 2 balls; Route 5 each stone...).
- Held items by class, like Hardlove Gold (maybe EI): type boosting, standard battle items, gems, other consumables
  (Focus Sash...), evolution items, etc.
- Drop battle items (the user doesn't use items in battle).
- One category for power items, vitamins, Ability Capsules, stat-reducing berries etc. (named for what they do:
  stats, abilities...).
- Drop Fossils if they're all Poké Pelago (check: maybe Photonic Sun gives fossils somewhere).
- Key items stay. Nice to have: items in the order you get them (ride Pokémon needed may make that hard).

## Walkthrough

- Remove the empty headings.
- Starter on Route 1 (Ultra Sun), not Iki Town.
- Drop empty story stops (e.g. back to Iki Town after Mahalo Trail, then home). The walkthrough is for Pokémon,
  items, trainers and route order in one place.
