# Eternal X calc refinement: move and item changes

Survey only (unit S3). Nothing here is a rule or a fixture; batch agents settle each row against the oracle.

## Sources and counts

- `hacks/eternal-x/.src/Move Changes.pdf`: 28 moves (Rebalanced only), text via pdfplumber.
- `hacks/eternal-x/.src/Item Changes _ Locations.pdf`: TM teaches, shop and item locations, wild held items, Big Root.
- `hacks/eternal-x/.src/Changelog.txt`: cross-check. It adds Rock Smash (power 60, Rebalanced) and says Frost Breath
  was buffed in V2.4 (Rebalanced); neither is in the PDF.
- `hacks/eternal-x/data.json` MV notes: 28 entries carry a note (`e` text, `dc` diff list). The brief said 38; the
  count in the data and the PDF is 28, so 38 was not found.
- `hacks/eternal-x/hack.json` → `cfg.calc`: base `gen6`, field toggles, one override (inverse battle). No item or move
  overrides, so the base profile's standard items apply.

Counts over the 30 changed moves (28 PDF + Rock Smash + Frost Breath):
- damage effect: 6
- data (power / type / accuracy / PP already in the guide): 21
- out of scope (healing, secondary effects): 2
- unclassified, needs Opus: 1 (Frost Breath)

Items: 0 damage-relevant changes in the PDF. Item rows below are none.

## Damage-effect moves

### Batch 1

- [ ] **Cut**: type Normal → Grass; always a critical hit (PP 30 → 20 is data). Oracle test: Cut vs a Rock-type
  defender should be 2x (Normal would be 0.5x), vs Ghost neutral (Normal immune), vs Water 2x; with the crit setting
  off, damage should equal the crit value (x1.5 in gen 6).
- [ ] **Strength**: type Normal → Rock (power 100 is data; the self Def / Sp. Def drop is out of scope). Oracle test:
  Strength vs Fire, Flying, Bug (2x), Fighting, Ground, Steel (0.5x), Ghost (neutral); a Rock-type user with Strength
  should get STAB.
- [ ] **Drill Peck**: critical hit ratio +1 (same as Slash / Leaf Blade). Oracle test: compare the calc's crit-chance
  output (if it shows one) for Drill Peck against Tackle. Damage on a fixed crit is unchanged, so if the oracle gives
  no ratio output, this row is a no-op for the calc (see Needs Opus).
- [ ] **Self-Destruct**: always a critical hit (power 200 is data). Oracle test: with the crit setting off, the calc's
  damage should equal the oracle's crit damage against any neutral target.
- [ ] **Explosion**: always a critical hit (power 250 is data). Oracle test: same as Self-Destruct.
- [ ] **Triple Kick**: power 10 → 20 per hit (three hits: 20 / 40 / 60 if scaled). Oracle test: multi-hit total against a
  neutral target equals the sum of three hits at bp 20, 40 and 60; check the engine reads the power field, not a
  hard-coded 10.

## Data (already in the guide, nothing to do)

Fly, Submission, Chatter, Tail Slap, Shadow Punch, Arm Thrust, Spike Cannon, Absorb, Mega Drain, Force Palm, Mud Bomb,
Mystical Fire, Fell Stinger, Freeze-Dry, Steel Wing, Needle Arm, Cross Poison, Gear Grind, Power Gem, Disarming Voice,
Rock Smash.

## Out of scope (secondary effects, healing, status, AI)

Parabolic Charge (HP restored 50% → 25%), Draining Kiss (HP restored 75% → 50%). Also out of scope: Strength's stat drop,
Fell Stinger's on-KO effect (not implemented, only the power changed), Big Root's healing change (item, 30% → 100%).

## Items

No damage-relevant item changes. Item changes checked and classed as data or out of scope: TM teaches (TM48, 60, 49,
58, 100, 51, 79), shop and item locations, wild held items (Life Orb, Flame / Toxic Orb, the stones, the incenses,
the trade items, the fossils), Big Root (out of scope, see above), Mega Stone availability. Incense type boosts and
Metal Coat are held and used as before; only where they are found changed.

## Needs Opus

- **Frost Breath**: Changelog V2.4 says it was buffed (Rebalanced), but neither the PDF nor data.json shows a change.
  data.json has bp 60 / ac 90 / pp 10 (the vanilla values). Evidence: `Changelog.txt` line 151; `data.json` moves
  index 523. Settle from the romfs move data if available, not from the docs.
- **Drill Peck** crit ratio: a crit-chance change does not alter deterministic damage. Decide whether the calc should
  model crit chance at all (probably no); otherwise the row is a no-op.
- **Count**: the brief said 38 move notes; data.json and the PDF both have 28. Confirm the expected number.

### Orchestrator answers
1. Frost Breath: 3DS hacks take the game data over the docs; data.json is extracted from the romfs, so its values
   stand. Not a calc row.
2. Drill Peck: no work. The calc shows damage with / without crit (per-move toggle), not the crit chance.
3. 38 vs 28: a miscount in the brief; 28 is right.
Batch note: Cut's and Strength's types come from data.json (check that they read Grass / Rock there, then only the
always-crit part of Cut is a rule).
