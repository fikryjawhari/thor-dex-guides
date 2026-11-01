# Move, ability and item pages

Branch `worktree-move-pages` (every guide + template). Status at the bottom.

## What changes
- **Move page**: the target (a 2 × 3 field grid, Bulbapedia style, and one line), the move's properties as plain
  lines (contact always; groups and exceptions only when they apply), and "Affected by": the abilities and items that
  touch it, each a link with what it does to this move.
  Two cards: "Boosted / changed by" (the user's side, open) and "Against it (N)" (the target's side, collapsed:
  for contact moves it is the same long list every time). Rows group by what it does: "Power ×1.3 — Iron Fist,
  Tough Claws"; a hack change is tagged "changed".
  Added effects with their odds under the properties: "30% flinch", "10% burn", "100% target Speed −1", "10% user
  Atk +1" (data `MV.se`). "Show in Pokémon list as a filter ›" moves up into the top card.
  Learned by: a `.sub` selector like the Pokémon page's moves (All, then Level up / TM / HM / Tutor / Egg / Evo with
  counts, only the methods present); under All, one group per method with a sticky header, every group collapsed
  when the page opens; picking a method shows only that group, open. Not saved.
- **Ability page**: "Moves it affects (N)", collapsed by default, under the description: what it does, then the moves
  (name, type, power). "Pokémon with it": a selector All / Normal / Hidden (counts), Hidden in its own group like
  the move page's methods (sticky header, collapsed on open). The filter link moves into the top card.
- **Properties as links** (the user, 2026-10-31): a property on a move page ("Sound move", "Makes contact") opens a
  list of every move with it (name, type, power; tap = the move page). Route like `#/mp/<prop>`; no saved state.
- **Boosts on the Pokémon page**: the moves its own abilities affect get a mark in the compact moves table. Never a
  sideways scroll at any width (260, 480, 537, 832). Best: one form that fits at 260 and works everywhere (e.g. a
  small marker on the move name, the ability and multiplier on tap / in the row's detail); if it can't, adapt per
  width the way the table already does (`.mvw` container queries: fuller text where there's room, the compact mark
  where there isn't). Not dropped for lack of room: find the form that fits.
- **Effect odds in the calc**: the move's `MV.se` odds ("30% flinch") on the outer move card, next to the damage %
  and the 2HKO text, at every width, no sideways scroll. Best: fits at 260 (480's card is as narrow) so one layout
  serves all; else a short form on narrow cards (e.g. "30% flinch" only, or the top one + "…") and the full list on
  wide cards, with the expanded card always holding the full list. Guaranteed effects keep applying as now;
  chances are text only.
- **Calc: type, ability and item changes for the fight** (the user, 2026-10-31). Today these moves' buttons only log
  (`template/README.md` → Move effects: "ability / type changes and item swaps (set them in Edit)"). New per-Pokémon
  battle state, in the card's battle-state row, for every Pokémon (not only Protean / Libero): its types, ability
  and item for this fight, stored by name (types, ability name, item name) in the existing fight fields (`FIGHT`
  in calc.js), so ↺ and Reset fight put them back and the saved set / Edit never changes. The engine reads them
  in place of the set's. Moves that set them (resolver kinds `type`, `ability`, `trick`, `steal`, `knock`...):
  Soak, Trick-or-Treat, Forest's Curse, Magic Powder, Reflect Type, Conversion / Conversion 2, Camouflage, Burn Up /
  Double Shock (user loses the type); Worry Seed, Simple Beam, Entrainment, Skill Swap (both), Role Play, Doodle,
  Gastro Acid (ability suppressed), Core Enforcer; Trick / Switcheroo (both), Bestow, Thief / Covet, Knock Off,
  Corrosive Gas, Incinerate, Bug Bite / Pluck; contact abilities Mummy / Wandering Spirit / Lingering Aroma. The
  card shows what changed (e.g. a chip "+Ghost", "Insomnia", "Item: Toxic Orb", tap = clear it). Saved-state rules:
  names only, a gone name drops; `tools/scenarios/guide-update.mjs` snapshot gains the fields; a `calc-effects`
  scenario per kind. Its own unit after the move data (engine + calc.js), before the page template unit.
- **Calc: every move does what it does** (the user, 2026-10-31). Every move with an in-game function gets an effect
  in the calc (Splash and the like excepted). Start from the report: `move_effects.mjs --report` (status moves with no
  record) and `effects_audit.mjs <hack>` per guide (records with `fn` = unmapped, kinds that only log); classify each:
  implement (a stage / status / field / fight-state change the calc has state for, or gains it in the unit above),
  or "Not modelled" with a reason the button shows (switching: Roar, Teleport, U-turn's switch; turn-order and
  accuracy only). The report's list goes in the build report; nothing silently does nothing.
  Z status effects (Photonic Sun, profile `zmove`): status rows get the Z toggle too, and Z-on applies the Z effect
  before the move (Z-Celebrate all +1, Z-Splash Atk +3, Z-Swords Dance resets lowered stats, Z-Memento heals the
  replacement → logged, Z-Curse by type...). Table generated from Showdown's `zMove` per move (`move_effects.mjs`),
  then checked against Photonic's game data for its changed moves (game data wins; "Doc says" on differences).
  No move-by-move hand pass unless the game data differs.
- **Item pages** (phase 2, its own decide step): description, icon, price, where found, held by, moves it affects;
  then the Items tab can drop what the pages carry.
- Data: every guide gets the same move properties and targets, from its own source (code / game data first), with
  stock Smogon data for its generation (the calc engine's) only where the source has nothing.

## Out of scope
- Type-based abilities and items (Blaze, Steelworker, Volt Absorb, -ate, type plates / gems): the description says it.
- Flags nobody reads: Metronome, Mirror Move, Magic Coat (as text), Snatch, King's Rock, Sky Battle, Sketch, Assist,
  Instruct, Encore and the like.
- Trainers full page (`#/tr/<k>`): only the In Trainers / In Walkthrough links (done, 2026-10-31).

## Vocabulary (tools/moveprops.py; Showdown names)
Targets `MV.tg`: `normal` one adjacent Pokémon · `any` any one Pokémon, far ones too in triples · `adjacentFoe` ·
`adjacentAlly` · `adjacentAllyOrSelf` · `allAdjacentFoes` · `allAdjacent` · `randomNormal` (a random opponent) ·
`self` · `allies` / `allySide` / `allyTeam` (the user's side) · `foeSide` (the opposing side) · `all` (the whole field)
· `scripted` (whoever last hit the user: Counter, Mirror Coat, Metal Burst).
Grid: top row the three opponents, bottom row the user at the left end, its adjacent ally, its far ally (so "any" vs
adjacent shows: the far opponent and far ally light only for `any` / side / field moves).

Properties `MV.f` (replaces today's mixed lists):
- Always one of: `contact` / no contact (shown as "Makes contact" / "No contact" on damaging moves).
- Groups: `punch` `bite` `slicing` `sound` `bullet` `pulse` `powder` `wind` `dance` `heal`.
- Derived from the move's effect: `secondary` (a chance effect; Sheer Force, Serene Grace, Shield Dust), `recoil`,
  `drain`, `multihit`, `charge` (two-turn), `recharge`, `binding`, `crash` (crash damage on a miss).
- Added effects `MV.se [[chance %, text]]`: every chance-based or guaranteed side effect of a damaging move, the
  odds as the hack has them (source first): status, flinch, confusion, stat stages (whose: "user" / "target"), plus
  the user's own (recoil fraction, drain fraction, healing). Phrases from one shared builder in `tools/moveprops.py`
  so every guide words them alike ("30% flinch", "10% burn", "100% user Def −1, SpD −1", "Drains 50% of damage").
- Exceptions: `noprotect` (a move that targets others but goes through Protect), `bypasssub` (hits through
  Substitute), `gravity` (unusable under Gravity), `defrost` (thaws the user), `reflectable` (bounced by Magic
  Bounce; shown only as that ability's link).

## Interactions (top-level `MI`)
`MI [{a AB idx | i item name, w side (u = on the move's user, t = on its target), e what it does ("Power ×1.2", "Blocks it", "Can't miss"...), m [M idx], [h 1 = the
hack changed it], [s source]}]`, written by `finalise()` after the prune from a shared rule table (ability / item ->
property or test: bp ≤ 60, priority, ...) plus `hacks/<hack>/extract/move_rules.json` (the hack's own and changed
abilities / items: add, remove, new phrase; each with its source line). Only abilities / items present in the guide.

## Units
1. Shared module (`tools/moveprops.py`, schema, `finalise()` hook) and the rule table, checked against Showdown
   `abilities.js` / `items.js` (every `move.flags[...]`, recoil / secondaries / multihit / bp tests) and
   pokeemerald-expansion `battle_util.c`, so nothing is missed. Report the full list for review.
2. Per guide (one agent each; parallel, they touch only their hack): EI, Hardlove Gold, Photonic Sun + Eternal X
   (`tools/ctrguide.py`; fix EX's every-flag bug), BB2R, Unbound. Each: properties + target from the source, Smogon
   fallback named in notes.md; `move_rules.json` for the hack's own / changed abilities (known: Hardlove
   `Mechanics.txt:26-32`, BB2R Iron Fist + Needle Arm / Rock Smash, EI originals, Unbound originals).
3. Reconcile (main chat): rebuild all, review `MI` per guide.
4. Calc: fight-only type / ability / item changes and the effect odds (engine + calc.js).
4a. Calc: the KO chance in the opened row (the user's feedback, below). Small; first thing next session.
4b. Calc: the effect coverage pass (every guide) and Z status effects (Photonic).
4c. Calc layout decide session (mockup, Sol / Haiku xhigh): the closed rows are crowded (below). Spec, then build.
5. Template: move page, ability page (per the mockup), schema doc, scenario.
6. Item pages: decide (mockup), then build.
7. Audit.


## Status
- 2026-10-31: plan and mockup (`plans/move-pages-mockup.py` -> `.html`, panel; preview `move-pages.html`) with the user.
- 2026-10-31: unit 1 merged (`tools/moveprops.py`, 137 rules; King's Rock / Razor Fang / Stench dropped as universal).
  Calc adapter: Protect stays stock unless `noprotect` (959deb5, calc tests pass). Unit 2 dispatched (Sol) from
  959deb5; all stopped on the Sol sharing limit with WIP commits, resume from each branch's last commit (its body
  says next): `worktree-move-pages-ei` b115b6a, `-hl` 2a3c98d (or later), `-3ds` bd349d1 (Eternal X bug: XY move
  records are 36 bytes, flags at 0x20 not ORAS 0x1e), `-bb2r` ee8e88c, `-unbound` c39f259. Worktrees under
  `~/.t3/worktrees/thor-dex-guides/`. A resumed agent works in that same worktree (or merges the branch first) and
  repeats the original brief's remaining steps (rebuild, gate --data, calc checks, notes, report).
- 2026-10-31: unit 2 finished on Claude (EI, Hardlove, 3DS on Opus; BB2R, Unbound on Haiku) and merged; unit 3
  (reconcile) done: every guide has MV.f / tg / se and MI (EI 113, Hardlove 108, Photonic 94, Eternal X 72, BB2R 65,
  Unbound 120 rows); moveprops tests, calc `npm test` and `assemble.py` pass. Added in reconcile: `move_rules.json`
  `prop` / `unless` (select by property, no stale name lists) and `gen` (a generation correction: no "changed" tag);
  Unbound's type-based Gale Wings / Grass Dash / Evaporate left out like Blaze. Known gaps: Unbound's Endless Edge,
  InfernalRage, Metal Bash and Hardlove's Collision Course have no metadata (no source); 18 BB2R Shadow moves (mirror
  only) none. For unit 4: Hardlove's code gives Zippy Zap no Sheer Force boost (the agent's finding; check the calc),
  BB2R's `over.moves` punch flags on Needle Arm / Rock Smash now repeat MV.f (optional cleanup).
  Next: unit 4 (calc fight-only type / ability / item changes + effect odds), then 4b, 5.
- 2026-10-31: unit 4 built on `worktree-move-pages-calc` (unmerged): FIGHT `ft` / `fadd` / `fa` / `fi` (names) set by
  the resolver's type / ability / trick / bestow / steal kinds and Mummy / Lingering Aroma / Wandering Spirit, with
  Showdown's fail rules; Edit → Fight… (one searchable sheet) for any Pokémon; card chips (tap = clear); ↺ / Reset fight
  clear them. Effect odds on the closed damaging row (one layout, odds shrink first), all in the open row. Zippy Zap:
  the Hardlove calc gives it no Sheer Force boost already (no change). Conversion 2 only logs (random). Scenario
  `calc-fight-state`. Next: merge it into `worktree-move-pages`, then 4b, 5.
- 2026-10-31: unit 4 merged into `worktree-move-pages` (cd18ccc); assemble and calc `npm test` pass. Previews
  `calc-ei.html`, `calc-ps.html`. The user's feedback (Thor screenshot, EI calc, 260 px): happy otherwise, but
  - **KO chance**: the closed row's "2HKO 43.2%"-style text gets truncated with the odds after it, so the KO chance
    can't be read anywhere. Put the KO chance (the number of hits and its %) in the opened row, always in full
    (unit 4a). Tooltips are no answer: `title` never shows on Android / the Thor (no hover, no long-press tooltip).
  - **Crowding**: the closed damaging row is now % range + KO text + odds on one line. Options the user named: hide
    the KO text on the closed row when it won't fit (the % range already says how many hits), or a third line
    (probably too tall, especially if Pokémon cards also grow). The user wants a separate calc UI decide session
    (mockup) for another compression pass over the whole calc page (unit 4c); until then leave the closed row as is.
  - Known failing check (not this branch's): `walkcheck` / `walkcheck-kb` on EI's Pokémon page, `#/p/1 RJ WRONG 10
    w260` (rail jumps), failing the same way on 78e8426: from the merged dex-page work. Fix in unit 5 (it touches
    that page anyway) or before.
  - Worker worktrees / branches to remove (all merged): `~/.t3/worktrees/thor-dex-guides/t3-*` with branches
    `worktree-move-pages-{u1,ei,hl,3ds,bb2r,unbound,calc}` (`git worktree remove`, then `git branch -d`).
- 2026-10-31 (session 2): worker worktrees / branches removed. 4a done on `worktree-move-pages` (a949844): the opened
  row starts with the KO chance in full (`koFull`; calc-fight-state checks it). walkcheck fixed (aba0e9e: the check
  predated the Pokémon page's rail jumps; nothing wrong in the page). Running: 4b-i effect coverage (Sol, branch
  `worktree-move-pages-fx`, files `tools/calc/`, `calc.js` / `calc.css`), 5a move page (Sol, `worktree-move-pages-mp`,
  files `dex.js` / `dex.css`: split by file so they run side by side), 4c decide session (Sol thread, branch
  `worktree-move-pages-calclayout`, spec `plans/calc-layout.md` (built and deleted: decisions in template/README.md), mockups only). Next: merge fx and mp one at a time,
  then 4b-ii (Photonic Z status effects), 5b (ability page, Pokémon-page marks), 4c build, 6, 7.
- 2026-10-31 (later): 4b-i merged (586d140): `tools/calc/effects_coverage.mjs` (all M, zero gaps; in npm test),
  shared Not-modelled reasons (`tools/calc/move-coverage.json`), Rest / Speed Swap / Power Split / Defog ... 5a merged
  (1d33dbd): the move page (target grid, `#/mp/<prop>` lists, added effects, Affected by, Learned-by selector;
  scenario `move-page`); its full gate: only `#/m/` routes differ, 154 pass, but Photonic kb domcompare flagged 729
  routes for 728 moves: find the extra one (`LIST=1 node tools/domcompare.mjs ... --kb`). Sol hit its limit: 4b-ii
  resumed on Opus (`worktree-move-pages-z`), 5b (ability page + Pokémon marks) on Opus (`worktree-move-pages-ab`).
- 2026-10-31 (later): 4b-ii merged (e116891): Z toggle on status rows (Photonic, Unbound), the Showdown zMove table
  checked by `tools/calc/z_effects_check.py` (Photonic: no differences; Unbound: 19, CFRU battle_moves.c), then
  aa89157: `calc_effects.json` `zmoves` (Z effect only; no copied records). Photonic kb's 729th route was noise (a
  serial rerun: only the 728 `#/m/` routes). Running: 5b (Opus, `worktree-move-pages-ab`); 4c spec in its decide
  thread (`worktree-move-pages-calclayout`).
- 2026-10-31 (later): 4c spec merged (937afd5, `plans/calc-layout.md`, since built and deleted; short-wide below 392 tall); the build runs on
  Opus (`worktree-move-pages-cl`). The user's move-page feedback (filter as "+ Filter" on the Back line, on every
  filter page; the sticky Learned-by headers painted `--bg` inside a `--panel` card) went to 5b.
- 2026-11-01: 5b merged (5bae3ba): ability page (Moves it affects, collapsed; Pokémon with it All / Normal / Hidden),
  an "A" mark after a Pokémon's moves its own ability affects (tap: a row "Iron Fist: Power ×1.3"), "+ Filter" on the
  Back line of the move / ability pages, sticky group headers in the card colour. 4c merged (388b8df): two-line rows,
  Δn, short-wide, 20 px battle-state row, Field / grid pass the wheel to the page; fixes found on the way: the Not
  modelled chip made status rows 35 px (now 15 px chip, 32 px rows), an added fight type on a dual-type foe was
  ignored by the engine (Smogon reads two types; `instrument.mjs` multiplies the third in, every guide), Defog's chip
  hid Clear Fog (the chip now clears the Fog too). Units 1-5 done. The user (2026-11-01): the "A" mark is right; Defog
  clearing the Fog in the same tap is right (the game clears Fog with Defog; Fog is text only in the calc). Next: 6 (item pages: decide, then build), 7 (audit).
- 2026-11-01: unit 6 decided: spec `plans/item-pages.md` (data `plans/item-pages-data.md`, mockup
  `plans/item-pages-mockup.py`), branch `worktree-move-pages-items`; item icon set on `worktree-move-pages-icons`
  (a042a34, Sol). Both merged into `worktree-move-pages`; building the spec's build units 1-6 (the user added the BB2R ROM to
  `hacks/blaze-black-2-redux/.src/rom/`).
