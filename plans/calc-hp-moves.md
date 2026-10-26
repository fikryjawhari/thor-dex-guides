# Calc: moves that change HP directly (spec, settled 2026-10-26)

Mockup: `plans/calc-hp-moves-mockup/` (real EI build + `mock.js`, panel A/B). The user chose A plus exact entry.

## Engine
- **Fixed / fraction damage** returns ordinary results (16 equal rolls, or Psywave's spread), immunities kept (Ghost vs
  Seismic Toss / Super Fang / Endeavor / Sonic Boom, Normal vs Night Shade, Fairy vs Dragon Rage): Seismic Toss / Night
  Shade = level; Dragon Rage 40; Sonic Boom 20; Super Fang / Nature's Madness / Ruination = half current HP (min 1);
  Guardian of Alola = 3/4 current HP; Endeavor = target HP − user HP (min 0); Final Gambit = user HP; Psywave = level ×
  (50-150)%; OHKO moves = target HP (0 against a higher level, Sturdy, Ice vs Sheer Cold from Gen 7).
- **Counter / Mirror Coat / Bide** (2×) and **Metal Burst / Comeuppance** (1.5×): the slot's `bp` is the damage taken;
  without it, null (the page relabels Power as Taken).
- **`DMG.hp(atk, def, slot, field, dealt)`**: the user's own HP change from one use, given the damage dealt.
  `{v, l, set?, st?, later?}`: `v` signed change to the user; `set` = new HPs (Pain Split); `st: 'slp'` (Rest);
  `later` (Wish). Covers recoil (move data fractions, Struggle, Mind Blown / Steel Beam / Chloroblast; Rock Head / Magic
  Guard), drain (Big Root, Liquid Ooze, Dream Eater), Life Orb, Shell Bell, self-KO (Explosion family, Final Gambit,
  Memento, Healing Wish, Lunar Dance), heals (Recover family, Roost, Shore Up, Moonlight / Morning Sun / Synthesis by
  weather, Rest, Wish, Life Dew, Jungle Healing, Lunar Blessing, Strength Sap, Swallow at one Stockpile, Purify), costs
  (Belly Drum, Substitute, Ghost Curse, Fillet Away, Clangorous Soul, Shed Tail), Pain Split. Null when none.
  Not covered: Floral Healing / Heal Pulse (heal the target), crash damage on a miss, Rocky Helmet / Rough Skin.

## Page
- A signed amount (the residual `dturn` style) on the row: status rows in place of "—", attacking rows at the start of
  the % line (after Z). `↔n` Pain Split, `↻` Wish, `Zz` Rest. Only rows whose move changes the user's HP.
- **Tap = one use**: the target loses the default damage and the user gets the matching change. Default damage: the
  player attacking = minimum roll (total of all hits), the foe attacking = maximum roll; capped at the target's HP.
  Pain Split sets both; Rest heals to full and sets Sleep; self-KO sets 0.
- **Exact entry** in the opened row (rows whose change depends on the damage): `Dealt [ ]` and `You [ ]` + Apply.
  Typing Dealt computes You. Typing You (the recoil / recovery seen in game) finds the damage range that gives it and
  uses its minimum when the player attacks, its maximum when the foe attacks ("dealt 54–56" shown). Not stored.
- HP −min / −max buttons unchanged (damage only). Counter family: Power box reads Taken.

## Checks
`tools/calc/test.mjs` (fixed damage, immunities, `DMG.hp` per group, Rock Head / Big Root / Liquid Ooze, weather heals),
`tools/scenarios/calc-moves.mjs` (fixed rows, chip tap both directions, exact entry both ways, Taken box), all four
guides, viewer sizes normal / dvkb.

## Follow-ups (2026-10-26, after the build; for the next build session)
Built and checked: everything above. Settled by the user, not built yet:
1. **Disguise / Ice Face**: the first hit is absorbed (Disguise: Mimikyu undisguised; Ice Face: physical hits on Eiscue
   Ice Face). Stock doesn't model them, so multi-hit totals, KO text and the one-use tap count hit 1 at full damage.
   Build: hit 1 does 0 while the form is intact (Gen 8+ Disguise also costs 1/8 max HP), later hits full; a state for
   "already broken" (the card's existing ability checkbox pattern, like Disguised for Illusion). Check each hack's
   source (EI expansion, Hardlove hg-engine, Gen 7 for Photonic; Eternal X has neither: Gen 6).
2. **Rocky Helmet / Rough Skin / Iron Barbs**: contact damage to the attacker (Helmet 1/6, the abilities 1/8 (1/16 in
   Gen 4) of the attacker's max HP, per contact hit, Magic Guard none). Add to `DMG.hp` for contact moves, counted per
   hit (multi-hit, Parental Bond), so the one-use tap includes it.
3. **Crash damage on a miss** (Jump Kick, High Jump Kick, Axe Kick, Supercell Slam): a separate `−HP` amount like the
   recoil one, labelled as the miss; tapping it does no damage to the target, only the crash to the user (Gen 5+ half
   max HP; Gen 4 the move's damage based rule, check Hardlove's source; Magic Guard none).
4. **Swallow / Spit Up**: a Stockpile count (1-3) in the opened row's details (not its own field elsewhere): Swallow
   heals 1/4, 1/2, full; Spit Up power 100 × count. Now: Swallow assumes one Stockpile; Spit Up shows — until a power
   is typed.
5. **Floral Healing / Heal Pulse**: heal the target, which only matters in Doubles (an ally); no ally is modelled, so
   recorded only. Same for Life Dew / Jungle Healing's ally share (only the user's own heal is shown).
Other notes from the build, not decided: Psywave's 16 rolls are an even spread over its 101 (Gen 5+) / 11 (Gen 4)
outcomes; Counter's Taken uses the Power box (`slot.bp`), so Reset clears it; Pain Split / Rest / Wish never use the
exact entry.
