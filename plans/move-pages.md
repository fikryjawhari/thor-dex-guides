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
4. Template: move page, ability page (per the mockup), schema doc, scenario.
5. Item pages: decide (mockup), then build.
6. Audit.


## Status
- 2026-10-31: plan and mockup (`plans/move-pages-mockup.py` -> `.html`, panel; preview `move-pages.html`) with the user.
