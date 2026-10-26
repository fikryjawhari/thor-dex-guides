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
