# Gauntlets carry fight state (template, every guide)

Status: deciding (2026-11-03). Next: mockup in the Thor frame, then the spec below filled in.

## Decided
- A gauntlet is only what a hack's docs call one: back to back / B2B / B3B / "gauntlet" / "Part of Gauntlet until
  Trainer X". Gym trainers before a leader are not (the game heals before the leader); no guide so far has a whole gym
  as a gauntlet.
- A whole gauntlet is ONE fight. Moving to any trainer in the same chain, forward or back, keeps the fight state: no
  `newFight()`. Leaving the chain (a trainer outside it) is a new fight as today.
- ↺ Reset fight inside a chain: the first press puts the state back to how it was when this trainer's battle started;
  a second press (state already at that start) resets the whole gauntlet to fresh (every HP 100 %, nothing used).
  On the chain's first trainer the start is fresh, so one press does it.

## To settle
- What carries between members (proposal; game rules): player HP, status, Toxic count?, used / consumed items carry.
  Stat stages, ability toggles, hazards, Field (weather, terrain, screens), Mega, Disguise / Ice Face are per battle:
  fresh on each new member. Foe teams: each member's own HP / status / edits kept for the whole chain (going back shows
  them as you left them).
- The "battle start" snapshot: taken when a member is entered for the first time in this chain? Or every time it is
  entered going forward? (Going back and changing an earlier fight makes a later snapshot stale.)
- Data: a chain field per trainer listing the chain's trainer keys (never indexes); extract rules per guide:
  Radical Red / Blaze Black 2 Redux / Unbound already tag B2B / B3B; Hardlove has it only in note text (Kimono Girls
  B2B2B, Route 34 Ace Trainers, "Part of Gauntlet until Trainer ..."). Audit the other guides' docs for gauntlets.
- Saved state: the chain's snapshots by trainer key + mon names; old saves load as no chain state.
- Show that you're in a chain (the fight bar: "Gauntlet 2/3"?) and a next/previous-in-chain step.
- Checks: a scenario (HP carried forward and back, Reset twice, leaving the chain resets); add to
  `guide-update.mjs`'s snapshot.
