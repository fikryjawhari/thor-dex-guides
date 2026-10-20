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
Phone preview (branch build, republish `dist/photonic-sun.html` to update): https://claude.ai/artifact/DjXAVb4Eb6DB4PEYQ43dug

Everything in the list below is built: sections as AR.es (data.json), SOS drop-downs with ally search, Starter box
(AR.st) synced with the tracker bar's picker, doc maps (AR.map, rendered by locs.py `pdf_maps()`), move page stat
boxes, ability slot tags, the sticky gap (fractional `--sh`/`--hh` and a 1px tuck), the starter picker ("Not chosen",
shrinks), a zero-width space before every tag so it can wrap, `table.lrn` names may break (two move pages were 261).
The walkthrough's encounter lines now come from the sections (one line per section; the walkthrough tab redo is
later). **evo/breed tags: the user decided (2026-10-20) to remove them everywhere** (do it next session; keep
Mega / Form change / Not found / Trainer only).
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

- Done 2026-10-20 (trainers.py): the evo/breed tag is gone (template, all guides, domcompare clean). Hau's Litten team
  on Route 1 was missed because Part 1 writes it `{{party` (lowercase); now matched. The level 84 grunt on Route 1
  (id 233) came from location pages joining stops by prefix ("route17" starts with "route1"): now an exact name
  first, and no prefix match in the middle of a number. Location-page trainers take exact teams (species + levels)
  first, so 233 is Ancient Poni Path's Ekans 45 grunt (not Route 17's Ekans 36), and Actor Meredith's four teams sit
  in Melemele Meadow / Royal Avenue / Ula'ula Meadow / Poni Meadow (two were swapped). Trainer keys shift with this
  (positional), and the regrouping below shifts more.
  Python here: `uv run` / `.venv\Scripts\python.exe` fail over SSH (sandbox won't follow the uv python junction);
  run the real interpreter `%APPDATA%\uv\python\cpython-3.14.2-windows-x86_64-none\python.exe` with the venv's
  site-packages added.
- 2026-10-20, **Trainers round 1 mockup**: https://claude.ai/artifact/1ZQycsBEtfxzpTQQkasSeV (Now / A tags per trainer /
  B one row per battle; Findings tab with both cap sets and open questions). Waiting for the user's pick.
  Sources: `tools/mockup/ps-trainers/` (outer, patch.js/css = the designs, findings, build.py, check.mjs). Rebuild:
  `git show HEAD~N:hacks/photonic-sun/data.json > head.json` (the "Now" frame's trainer data), `python assemble.py
  photonic-sun`, `python -I tools/mockup/ps-trainers/build.py . head.json out/index.html`; serve over http and run
  `node tools/mockup/ps-trainers/check.mjs <url> <dir> 260x316` (errors, width, partners per frame, screenshots).
  Data done in trainers.py (data.json has it; the current template shows the format tags, ignores the rest):
  `{{Party/2}}` and `{{tt|lv|...}}` levels read; `prize = none` parties are partners (t.pt [{n, st, p}], not rows),
  except the Battle Royal; t.bt battle id shared by trainers fought at once; tags Double / Multi Battle / Battle
  Royal / Prismatic Moon (MOON table, with a note); sections split by === sub-places === in Parts 14, 21, 31
  (`==== VS X ====` stays in its room); Aether Paradise box (visit 1 = Nihilego note, visit 2 by floor); trainerdiv
  captions are notes; story entries repeated post-game go to the post-game one; location-page trainers with
  post-game vanilla levels go to "<place>: post-game"; Battle Buffet (30), Kantonian Gym lv 29 + Ryuki (PLACE),
  Taro = Tristan, Hau's Aether partner copies dropped. Other: 55 -> 1 (Mallow lv 100, place unknown).
  Caps: CAPS table (totems from Totem Battles.pdf), TR.caps = trials, TR.mini = all [name, where, lv, kind, dropped],
  s.cap = [trial cap, with minis]. Open questions are in the mockup's Findings tab.
- **Decided and built 2026-10-20 (round 1 sign-off):** design B rows (one per battle, t.bt) with the partner block
  first in the card (only your starter's team once one is chosen); A's cap tag in the sticky place header plus B's
  cap line under it, "Level cap 47 · Kahuna Olivia, Ruins of Life · 15 battles before it, 1 forced"; the
  trials / with mini caps switch in the header (LS.capset, new key `pscapset`). Expand / Collapse all in a box now
  opens and closes its places too, and every place with 2+ trainers has its own bar for its trainers (template, every
  guide; EI and HG otherwise unchanged in domcompare). Mallow lv 100 = her post-game Kantonian Gym battle (the
  Important Trainers doc); the doc also puts Ilima's, Kiawe's and Lana's post-game battles there (Bulbapedia has
  them elsewhere; kept, with a note). Ryuki lv 50 = the optional pre-League Kantonian Gym. Episode RR stays in its
  post-game box. Ultra Necrozma's mini cap is struck (a mini cap at or above the next trial is left out).
  Aether Paradise's first visit (Nihilego) is a section at the end of Akala; the Aether box is visit 2 only.
  "Battles before it" counts one row per battle, one starter's rival fight, and skips optional places (the
  walkthrough's "Optional:" lists), the optional Kantonian Gym, Battle Buffet and Prismatic Moon teams. "Forced" =
  {{Party}} story fights; the sources don't say which route trainers can be walked around (the user wants that:
  open question, maybe a per-trainer "skipped" mark or a hand list).
  Phone preview republished (version 2).
- **Round 2, 2026-10-20 (the user's look at preview v2):**
  - Expand / Collapse: three identical bars (page, island, place) are too many. The island needs both "places" and
    "trainer cards" (the old behaviour) controls. Mockup at 260 x 316 (small, standalone, fake data, not the full
    build): https://claude.ai/artifact/UPRRxTN8wJrWEawipmRDwk (Now / A labelled rows / B show switch / C header
    buttons). Source: `tools/mockup/ps-trainers/expand.html`. Waiting for the pick; then build it in the template (every
    guide's Trainers page; check Locations / Items / Walkthrough bars stay consistent) and domcompare EI and HG.
    Picked: B's Show switch per island (Places / Trainers / Teams) + C's "teams" toggle in each place header, top
    "Open all islands / Close all". Round 2b mockup with the behaviour options (closed places, places opened later,
    what the switch lights, where it sits, teams label, pinned place header, a page-wide switch):
    https://claude.ai/artifact/WFR57CSdHTHwzNpe3G7YG6 (source `tools/mockup/ps-trainers/show.html`, real places
    from data.json). Picked (2026-10-20): only open places, stay as left, switch shows what's on screen, pinned
    row, "teams 1/4", pinned place header, top bar Open / Close all. Plus: a lit Trainers / Teams pressed again opens
    every place (outlined = open places only, solid = every place); place "teams" fills first (part → all open, all
    → all closed; grey / outline / solid); toggling keeps the trainer you're reading in place (no jump when rows
    above open or close). Tried on the phone: works; the anchor becomes the first row separator under the pinned
    headers. **Build spec: `plans/trainers-show-switch.md`** (to be built in a new session).
  - No "forced" count (no source marks avoidable trainers; searched Bulbapedia, Serebii, the web). Cap line is now
    "Level cap 12 · Captain Ilima, Hau'oli City · 14 battles". Done (trainers.py, template).
  - Walkthrough entries that match no game trainer: the game data wins, leave them out. Done (as built).
  - notes.md trainers + schema, PROGRESS.md: updated.
- Hau on Route 1 has no team for a Litten starter: fix. (done)
- Level 80 Team Skull grunt in Route 1 looks wrong: place it at its real story visit (another Route 1 visit) or move
  it to the bottom. (done: Ancient Poni Path) Same kind: Youngster Kenway in Royal Avenue (already at the bottom).
  Look for others.
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
- **Decide session 2026-10-20:** empty stops are kept (game direction) and get their own look, no ▾: a template UI change.
  Mockup in the Thor frame (now: muted header 14px bold, bar choices): https://claude.ai/artifact/5iPtwwnsGaijwvkydeu5MA. Waiting for the pick; draft
  spec `plans/ps-walk.md` (tab branch `worktree-ps-walk`). The starter is already on Route 1.
