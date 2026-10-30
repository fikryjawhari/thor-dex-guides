# Calc: move effects (PROGRESS.md → Open → Damage calc, item 6)

Branch `worktree-calc-move-effects` from `main` 37618fa. The user's spec (2026-10-30) is settled; no decide session.

## What changes

Every move whose effect changes state the calc models performs that effect from its move row, on all six guides,
for the side that owns the row (a foe's Swords Dance raises that foe's Attack). After any click the calc's stages,
status, HP, items and field must match what the game shows after that move resolves, for the hack's generation.

- **Status moves** lose the "—" and get one action button in its place, styled as the existing HP-move chip
  (`.dturn.hu`, `up` green / `dn` red). Its text is the effect it will have *now* (preview through the same
  resolver): `Atk+2`, `SpA SpD+1`, `+2 −1` (Shell Smash), `Def−1` (Leer on the foe), `Par`, `Burn`, `Sleep`, `Psn`,
  `Toxic`, `Frz`, `Conf`, or `Fails` (muted, the reason in `title`, a click logs it and changes nothing). The full
  text is in `title` / `aria-label` and in the action log. HP status moves keep their chip; a move with both (Belly
  Drum, Clangorous Soul, Fillet Away, Strength Sap, Memento) shows both effects on one button (`Atk+6 −50`).
  Moves with a Field / Edit switch (Focus Energy, Charge, Leech Seed, Minimize, Defense Curl, Stockpile...) keep the
  switch; switching it **on** also applies the move's other effects through the resolver (Charge's SpD+1).
- **Damaging moves**: no new button. Their guaranteed effects apply as part of the existing damage actions (the
  min / max endpoints, the custom Damage Apply, the damaging HP chip's Use), after the damage, like recoil and drain:
  Close Combat Def−1 SpD−1 on the user, Nuzzle paralyses, Draco Meteor SpA−2, Power-Up Punch Atk+1, Knock Off
  removes the item, Clear Smog resets stages, Fell Stinger on a KO. The exact-damage `You` Apply (threshold only)
  stays without effects. The opened row lists them (`After: Def −1 · SpD −1 (user)`).
- **Chance effects never apply** (Thunderbolt's 10 %). A secondary applies only when its effective chance is 100:
  its listed chance × Serene Grace / Unbound's Rainbow (`DMG.secondaryChance`), so a 50 % effect under Serene Grace
  is guaranteed.
- **Field-changing moves** (weather, terrain, screens, hazards, rooms, side states) are done: unchanged, except
  that the new flow reads them (Safeguard, Mist, Misty / Electric Terrain) and Mist gets a side state (below).

## Architecture

1. **Effect table** `tools/calc/move-effects.json` (generated, committed): `tools/calc/move_effects.mjs` reads Pokémon
   Showdown's data at a pinned commit (MIT; `data/moves.ts` plus `data/mods/gen8..gen4/moves.ts`, inherited the way
   Showdown does) and writes one record per move per generation 4-9 (deltas). Hand-mapped kinds (Showdown `onHit`
   functions) are listed in the generator with the Showdown function they follow. `build.mjs` compiles the table into
   `engine.js` (per generation, like the stock move data). A move with no record has no effect (its row keeps "—").
2. **Per-hack differences** `hacks/<hack>/calc_effects.json` `{moves: {<name>: record | null}, rules: {...}, notes}`:
   only what the hack changes, each with a source line (hack source code / game data / the hack's docs). `assemble.py`
   (`calc_profile`) and the test helper put it in the profile as `over.effects`. A separate file so the BB2R branch's
   hack.json edits don't conflict.
3. **Resolver** `tools/calc/src/effects.js` (in the engine): the one place every effect goes through, for status-move
   buttons, damaging-move secondaries and the toggles. Generation-aware through `profile.gen` and `over.effects.rules`.
   It never knows the move's target; it receives `{who, kind, ...}` effect parts and resolves them against whoever
   they land on, in the game's order (below), with the blocker table.
4. **API** `DMG.effect(user, target, slot, field, options)` → `{atk: patch, def: patch, log: [], label, text, cls,
   fails?, parts: [...]}` (atk = user, def = target, patch keys as `hit`: `stg`, `status`, `used`, `hp`, `toggles`,
   `toxn`), null when the move has no effect. `DMG.hit` runs the same resolver after its damage (secondaries) and
   merges into its patches; `def.status` is now emitted. `DMG.effects(name)` returns the resolved record (the
   opened row's `After:` line and the checks).
5. **Page** (`template/calc.js`): status rows render the button from `DMG.effect`'s preview; a tap applies its
   patches with `actionPatch` + the existing `applyUse` for the HP part, logs, refreshes. No new storage: stages,
   status, HP, `used` and field keys are the existing state; Mist is a new field key (`atkMist` / `defMist`, stable,
   saved with the field like Safeguard).

### Effect record (resolved for one generation)

| Key | Meaning |
| --- | --- |
| `b` | Stage changes on the move's target (`tg`), e.g. `{atk: 2}`; stats `atk def spa spd spe acc eva` |
| `tg` | `s` the user, `o` the opposing target (status moves; Showdown `target: self / adjacentAlly... → s`) |
| `st` | Major status on `tg`: `par brn psn tox slp frz` |
| `v` | Volatile on `tg`: `confusion`, `attract`, `taunt`, ... (log only, see Not modelled) |
| `sb` | The user's own stage changes when the move is used (`self.boosts` / `selfBoost`; Close Combat, Draco Meteor) |
| `sec` | Secondaries `[{c, b?, st?, v?, sb?, k?}]`, `c` = chance %; target side unless `sb` |
| `k` | Hand-mapped kind (table below) |
| `ti` | The status move checks the target's type immunity (Showdown `ignoreImmunity: false`: Thunder Wave) |
| `fl` | Flags that blockers read: `powder sound bullet reflectable bypasssub contact` (array) |
| `n` | Source note (generator: Showdown function or the hack's source line) |

### Kinds (`k`)

| Kind | Moves | Effect |
| --- | --- | --- |
| `haze` | Haze | both sides' stages to 0 |
| `clear` | Clear Smog (secondary) | target's stages to 0 |
| `copy` | Psych Up | user's stages = target's |
| `swap` (`stats`) | Heart Swap (all), Power Swap (atk spa), Guard Swap (def spd) | exchange those stages |
| `invert` | Topsy-Turvy | target's stages × −1 |
| `maxatk` | Belly Drum | fails at ≤ half HP or Atk +6; Atk to +6 (Contrary: Showdown boosts 12 → −6), HP cost from `DMG.hp` |
| `curse` | Curse | non-Ghost: Spe−1 Atk+1 Def+1; Ghost: the existing Cursed switch + HP |
| `cure` | Refresh, Heal Bell, Aromatherapy, Jungle Healing, Lunar Blessing, Take Heart (+ its boosts) | user's status cleared (Refresh: brn par psn tox only) |
| `shift` | Psycho Shift | user's status moves to the target through the status blockers, then the user is cured |
| `knock` | Knock Off (secondary, guaranteed) | target's item gone (`used`; Sticky Hold blocks; not on a KO in Gen 4 only if... per source) |
| `steal` | Thief, Covet | user has no item: target's item gone (`used`), log "stolen" |
| `eat` | Bug Bite, Pluck | target's berry gone; the user gets its effect (log) |
| `burnitem` | Incinerate | target's berry (Gen 5) / berry or gem (Gen 6+) gone |
| `trick` | Trick, Switcheroo | log only (items swapped: set them in Edit) |
| `drowsy` | Yawn | log only (sleeps at the end of the next turn) |
| `stockpile` | Stockpile | Def+1 SpD+1 (the Stock counter is the row's) |
| `growth` | Growth | Gen 5+: Atk+1 SpA+1, +2 in sun; Gen 4: SpA+1 |
| `venom` | Venom Drench | poisoned target: Atk SpA Spe −1 |
| `ko3` | Fell Stinger | on the KO: Atk +3 (Gen 7+) / +2 (Gen 6) |
| `memento` | Memento | target Atk SpA −2, user faints (HP part existing) |
| `ability`, `type` | Skill Swap, Role Play, Worry Seed, Simple Beam, Entrainment, Gastro Acid; Soak, Forest's Curse, Trick-or-Treat, Conversion, Reflect Type, Magic Powder | log only (no battle-scoped ability / type override yet) |
| `random` | Acupressure | log only (random stat) |

## Resolution order (one use)

1. **Move-level checks** (whole move fails; status moves only unless noted): the target fainted / user fainted;
   Protect (the existing Protect state; `bypasssub` and Feint-family as in `calc`); type immunity when `ti`
   (Thunder Wave vs Ground; Ground immunity lifted by the usual ways); Prankster status move vs a Dark target (Gen 7+,
   foe-targeted only); powder vs Grass (Gen 6+), Overcoat (Gen 6+), Safety Goggles (Gen 6+); Soundproof (`sound`);
   Bulletproof (`bullet`, Gen 6+); Good as Gold (Gen 9, foe-targeted status); Magic Bounce / Magic Coat
   (`reflectable` and foe-targeted: the whole effect resolves against the user instead, once, with its blockers);
   Mold Breaker / Teravolt / Turboblaze ignore breakable abilities (Showdown `flags.breakable`).
2. **Damage** (damaging moves: `hit` as today, including Sash / Sturdy, berries, KO boosts).
3. **Secondaries on the target** (only if the target took damage this use and is still standing; Sheer Force user
   drops all `sec`; Shield Dust / Covert Cloak (Gen 9) drop the target's `sec` parts but not `sec[].sb`).
4. **User's own changes** (`sb`, `sec[].sb`): apply even if the target fainted (Showdown `self` runs after the hit);
   Sheer Force removes `sec[].sb` but not `sb`.
5. **Each part** through the blocker table (below), then caps (±6), Simple (×2), Contrary (×−1), Mirror Armor
   (reflects foe-caused drops to the source, Gen 8+).
6. **Reactions**, in this order: Defiant (Atk+2, Gen 5+) / Competitive (SpA+2, Gen 6+) once per foe-caused drop
   event; status berries (Cheri par, Chesto slp, Pecha psn/tox, Rawst brn, Aspear frz, Persim confusion, Lum any) and
   Mental Herb (attract; Gen 5+ also taunt encore torment disable heal block) cure immediately and are consumed
   (`used`); Synchronize passes brn / par / psn / tox back to the source (not slp / frz; Gen 5+ also when the source
   is... per source); White Herb restores every lowered stage to 0 and is consumed (after all drops of the use, also
   the user's own Close Combat / Shell Smash drops); Eject Pack (Gen 8+) is consumed on a lowered stage (log: switches
   out). Item reactions respect Klutz, Magic Room, `used`, Unnerve (berries).

## Blocker table (`effects.js` → `BLOCKERS`, data rows, generation ranges; `ign` = Mold Breaker can ignore)

| Blocks | Who | Gen | Notes |
| --- | --- | --- | --- |
| par | Limber (ign); Electric type | Limber 4+; Electric 6+ | |
| slp | Insomnia, Vital Spirit, Sweet Veil (ign); Electric Terrain (grounded); Uproar not modelled | 4+; Sweet Veil 6+; terrain 6+ | |
| brn | Water Veil, Water Bubble (7+), Thermal Exchange (9) (ign); Fire type | 4+ | |
| psn / tox | Immunity, Pastel Veil (8+) (ign); Poison / Steel type unless the user has Corrosion (7+) | 4+ | |
| frz | Magma Armor (ign); Ice type | 4+ | |
| any major status | already statused; Comatose (7+); Purifying Salt (9); Leaf Guard in sun (ign); Flower Veil on a Grass target (6+, ign); Shields Down (Minior, above half HP, 7+); Safeguard (foe-caused, not by Infiltrator Gen 6+); Misty Terrain (grounded) | | Rest / Orbs are self-caused: unchanged |
| confusion | Own Tempo (ign); Safeguard; Misty Terrain (grounded, Gen 7+?) per source; already confused unknown → always applies | | log only |
| attract | Oblivious (ign); same gender / genderless; Aroma Veil (6+) | | log only |
| taunt | Oblivious (6+), Aroma Veil (6+) | | log only |
| flinch | Inner Focus | | chance only: never reaches the layer |
| foe-caused stage drops | Clear Body, White Smoke, Full Metal Body (7+) (ign); Hyper Cutter (Atk, ign); Big Pecks (Def, 5+, ign); Keen Eye (acc, ign); Mist (foe side, not Infiltrator 6+); Clear Amulet (9); Flower Veil on Grass (6+) | | not self-inflicted drops |
| foe-caused secondaries on the target | Shield Dust (ign); Covert Cloak (9) | | `sb` unaffected |
| all `sec` and `sec[].sb` | the user's Sheer Force (5+) | | also Life Orb recoil (existing) |
| powder moves | Grass (6+), Overcoat (6+, ign), Safety Goggles (6+) | | |
| sound moves | Soundproof (ign) | | |
| ball / bomb moves | Bulletproof (6+, ign) | | |
| reflectable status | Magic Bounce (5+, ign) reflects | | |
| foe-targeted status moves | Good as Gold (9, ign); Prankster user vs Dark (7+) | | |

The table rows are generation ranges from Showdown (`data/abilities.ts`, `items.ts`, `conditions.ts` and the
gen mods); a hack that differs sets `over.effects.rules` (e.g. Hardlove hg-engine, CFRU) with the source line.

## Per-generation differences (from the source, checked by fixtures)

- Electric types immune to paralysis from Gen 6; powder immunity (Grass, Overcoat, Goggles) from Gen 6.
- Defiant Gen 5+, Competitive Gen 6+, Big Pecks Gen 5+, Mirror Armor / Clear Amulet / Covert Cloak Gen 8 / 9 / 9.
- Growth (Gen 4 SpA+1; Gen 5+ Atk+1 SpA+1, ×2 in sun); Rapid Spin Spe+1 (Gen 8+); Fell Stinger +2 (Gen 6) / +3;
  Knock Off; Charge's SpD+1 (Gen 4+); move-by-move stage amounts as each generation's Showdown data.
- Hardlove (expansion base, hg-engine), Unbound (CFRU, Gen 8 base) and the 3DS / Gen 5 hacks: their own differences
  in `calc_effects.json`, sourced (hg-engine `data/Moves.c`, CFRU source, the hack docs' move changes).

## Out of scope

- Switching (U-turn, Volt Switch, Baton Pass, Parting Shot's switch, Roar / Whirlwind / Dragon Tail, Eject Button /
  Pack switch): the calc has no switching; Parting Shot's drops apply.
- Accuracy / evasion stages: the calc has none (no accuracy shown); `acc` / `eva` changes are logged, not stored.
- Volatile states the calc doesn't model (confusion, infatuation, Taunt, Encore, Torment, Disable, Yawn, Substitute,
  trapping by Mean Look / Block, Perish Song, Destiny Bond, Embargo, Heal Block, Imprison, Throat Chop): logged only;
  their blockers / cures still run where they change modelled state (Persim / Lum / Mental Herb consumed).
- Ability / type changes and item swaps: logged only (a battle-scoped override is a later decision).
- Field-changing moves themselves; Z-move status effects (Z-Power) and Max moves.

## Controls and states

| Control | State | Action | Result | Disabled / error |
| --- | --- | --- | --- | --- |
| Status row button | Preview of the effect now | Tap | Patches both sides (stages / status / HP / items), action log, refresh | `Fails` (muted): log the reason, no change; user or target fainted: disabled |
| Field / Edit switch on a move with more effects | off | Tap on | Field state + the move's other effects | off: the switch only |
| Damage endpoints / custom Apply / damaging Use | | Tap | Damage, then secondaries and self changes, one log | Protected: nothing (as today) |
| Opened damaging row | | | `After: …` line from the resolved record (guaranteed parts only) | none |

## Edge cases

- 260 × 316 normal and dvkb: the button fits the status row's right column without widening or adding a line;
  long labels shorten (`+2 −1`), the full text in `title`. Closed rows keep equal heights.
- Repeated taps: +6 caps (`Fails: Atk +6`), already statused, a fainted target.
- Foe rows: the foe is the user; the player's card is the target.
- Saved state: no new keys except the Mist field keys (stored with the field like Safeguard, by key name);
  `guide-update.mjs`'s field snapshot covers them.

## Checks

| Requirement | Check | Assertion |
| --- | --- | --- |
| Blockers and order | `tools/calc/effects_check.mjs` (in `npm test`) | Nuzzle vs Ground / Limber / Lum / Electric (Gen 5 vs 6), Thunder Wave vs Ground, Close Combat + White Herb, Contrary Shell Smash, Defiant / Competitive from Leer, Mirror Armor, Mist, Safeguard, Misty / Electric Terrain, Clear Amulet / Covert Cloak (Gen 9 only), Shield Dust, Sheer Force, Serene Grace 50 %, Magic Bounce, Soundproof, Overcoat / Goggles / Grass powder, Prankster vs Dark, Synchronize, Persim on Swagger, Knock Off, Belly Drum, Haze, Psych Up, caps |
| Table sourced | `move_effects.mjs --check` | every record traces to Showdown or a hack source line; unsourced moves listed |
| Per hack | `effects_check.mjs` per guide | each `calc_effects.json` entry has a fixture |
| Page | `tools/scenarios/calc-effects.mjs` | status rows: Swords Dance (mine and foe), Leer, Thunder Wave vs Ground (Fails), Will-O-Wisp → Rawst; damaging: Close Combat endpoint lowers user Def / SpD, Nuzzle paralyses; 260 × 316 normal + dvkb fit |
| No regressions | `gate.py check --jobs 8`, `gate.py scenarios --jobs 8`, `domcompare` main vs branch | only the calc changes |
