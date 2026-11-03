# Gauntlets carry fight state (template, every guide)

Status: deciding (2026-11-03). Next: mockup in the Thor frame, then the spec below filled in.

## Decided
- A gauntlet is only what a hack's docs call one: back to back / B2B / B3B / "gauntlet" / "Part of Gauntlet until
  Trainer X". Gym trainers before a leader are not (the game heals before the leader); no guide so far has a whole gym
  as a gauntlet.
- A whole gauntlet is ONE fight. Moving to any trainer in the same chain, forward or back, keeps the fight state: no
  `newFight()`. Leaving the chain (a trainer outside it) is a new fight as today.
- Carries between members: player HP, status, used / consumed items. Per battle (fresh on each member): stat stages,
  ability toggles, hazards, Field (weather, terrain, screens), Mega, Disguise / Ice Face. Each member's foe team keeps
  its own state (HP, status, edits) for the whole chain: going back shows it as you left it.
- Snapshot: the player's side, taken every time you step forward into a member (going back takes none).
- ↺ Reset fight inside a chain: the first press puts the current member's foe team back to fresh and the player's side
  back to that member's snapshot; a second press (already there) goes to the chain's FIRST trainer with everything
  fresh (all members' foe state, the player's side). Always the start, never "this fight at full HP": a fresh state
  is only reached by walking from the first trainer, so a later fight is never shown at full HP by mistake (some
  gauntlets allow healing between fights, B2B / B3B do not). On the first member one press does both.

## To settle
- Data: a chain field per trainer listing the chain's trainer keys (never indexes); extract rules per guide:
  Radical Red / Blaze Black 2 Redux / Unbound already tag B2B / B3B; Hardlove has it only in note text (Kimono Girls
  B2B2B, Route 34 Ace Trainers, "Part of Gauntlet until Trainer ..."). Audit the other guides' docs for gauntlets.
- Saved state: the chain's snapshots by trainer key + mon names; old saves load as no chain state.
- Show that you're in a chain (the fight bar: "Gauntlet 2/3"?) and a next/previous-in-chain step.
- Checks: a scenario (HP carried forward and back, Reset twice, leaving the chain resets); add to
  `guide-update.mjs`'s snapshot.
