# U1: state-dependent damage and pre-hit stat changes

Research for `calc-engine-pass.md`, 2026-10-26. Owned scope: A and D only; no engine, UI or data edits.
P = Photonic Sun 2.38 Rebalanced (Gen 7); E = Eternal X Rebalanced (Gen 6);
H = Hardlove Gold 0.8.3 (modern hg-engine, not vanilla Gen 4); I = Emerald Imperium 1.3.1 (expansion).
Presence means the guide's `M` / `AB` / item data contains an entry, not that every species can learn it.
Absent guide entries must not be enabled just because upstream source defines them.

## Authority and checkpoints

- All four `data.json` move lists were searched with `rg -o --count-matches` and named entries / parallel
  `MV` records checked programmatically. Item presence uses `IT`, not `AB`. No whole data file was printed.
- P/E authority: each hack's `.src/dex-rebalanced.json` and `.src/txt/Move Changes.txt`, per `SOURCES.md`.
  Dumps expose move IDs, powers, descriptions and flags, **not executable effect code**; unchanged historical
  triggers below are vanilla-generation rules, not a disassembly certification.
- H authority: `kumakuma1/hardlove` at `f1b236300187a2b18bf1a0b5ee1f80b3a2fed57b`.
- I authority: `iriv24/pokeemerald-expansion` at `2576d0f3f4c861c760f0c55198e37e6d7b91683e`.
- H/I references are repository-relative `path:line` at those pins. Existing ignored caches:
  `.tmp/calc-hardlove-gold/source/`, `.tmp/source/`; supplementary pinned reads: `.tmp/u1/`.
- Stock means installed `@smogon/calc` 0.12.0, **not the adapter**. D's yes/no follows the engine-pass finding:
  only Pursuit, held Metronome and Supreme Overlord have stock state inputs.
- The existing `.claude/claim` belongs to the orchestrator sharing this worktree; not replaced or released.
  Build/browser gates are not applicable to this notes-only unit; source/input checks are recorded here.

### P checkpoint: Photonic Sun

- Game dump move rows (file line, not move ID): Skull Bash `1254`; Rollout `1329`; Fury Cutter `1334`;
  Pursuit `1352`; Revenge `1403`; Ice Ball `1425`; Assurance `1496`; Avalanche `1543`; Round `1620`;
  Echoed Voice `1621`; Retaliate `1638`; Water/Fire/Grass Pledge `1642/1643/1644`;
  Fusion Flare/Bolt `1682/1683`; Stomping Tantrum `1831`; Spectral Thief `1836`.
- Powers: 130 Skull Bash, 90 Spectral Thief, 40 Fury Cutter/Echoed Voice/Pursuit, 30 Rollout/Ice Ball,
  60 Assurance/Revenge/Avalanche/Round, 70 Retaliate, 75 Stomping Tantrum, 100 fusions, 80 pledges.
  None is a changed-power entry in Move Changes; no documented state-rule override found.
- Meteor Beam, Electro Shot, Rage Fist, Last Respects, Temper Flare, Lash Out and Fickle Beam are absent.
  All four seeds, Weakness Policy and held Metronome exist. Download, Stamina, Weak Armor, Water Compaction,
  Berserk, Justified, Rattled, Anger Point, Defiant, Competitive, Contrary and Simple exist.
- Gen 7 Minimize vulnerability adds Heavy Slam but removes Gen 6 Phantom Force / Shadow Force vulnerability.
  Gen 7 Weak Armor raises Speed two stages (E's Gen 6 raises one). Spectral Thief is already partly stock:
  `mechanics/gen789.ts:552`; its Simple interaction needs correction, not a second whole theft.

### E checkpoint: Eternal X

- Game dump rows: Skull Bash `1022`; Rollout `1097`; Fury Cutter `1102`; Pursuit `1120`; Revenge `1171`;
  Ice Ball `1193`; Assurance `1264`; Avalanche `1311`; Round `1388`; Echoed Voice `1389`; Retaliate `1406`;
  Water/Fire/Grass Pledge `1410/1411/1412`; Fusion Flare/Bolt `1450/1451`. Powers agree with P's corresponding
  entries. A grep of Move Changes found no changed-state entry for these names.
- Spectral Thief, Stomping Tantrum and all later-generation A/D moves are absent. Weakness Policy and Metronome
  exist; terrain seeds, Stamina, Water Compaction, Berserk and Intrepid Sword / Dauntless Shield do not.
- Use Gen 6 rules, not the modern rules of H/I: Minimize doubles Stomp, Steamroller, Body Slam, Dragon Rush,
  Flying Press, Heat Crash, Phantom Force and Shadow Force; **not Heavy Slam**. Weak Armor gives -1 Def / +1 Spe.
  Gen 6 Fury Cutter already starts at 40 (max 160), Echoed Voice at 40 (max 200), and combined pledges at 150.
- Stock Download is automatic in `mechanics/gen56.ts:65`; Weak Armor's shared helper hard-codes +2 Spe, so its
  mere presence is not proof of Gen 6 correctness (`mechanics/util.ts:411`).

### H checkpoint: Hardlove Gold

- `data/Moves.c:24088` gives Rage Fist **100 BP**, `MOVE_EFFECT_HIT`; its move script
  `data/battle_scripts/moves/move_script_0892_RAGE_FIST.s:7` only dispatches that ordinary hit.
  The damage switch has no Rage Fist case. Move Changes sheet row 120 agrees on 50 -> 100;
  row 10 explicitly says it does not increase BP when hit. **Keep 100, no counter.**
- Last Respects (`data/Moves.c:23143`) and Spectral Thief (`19309`) also have plain `MOVE_EFFECT_HIT` and
  one-command dispatch scripts (`move_script_0857_LAST_RESPECTS.s:7`, `move_script_0715_SPECTRAL_THIEF.s:7`).
  No Last Respects power case or theft implementation appears in the audited damage / pre-hit paths.
  **Doc says** Last Respects gains power and Spectral Thief steals boosts (guide descriptions); pinned source
  executes ordinary 50 / 90 BP hits. Do not silently graft stock Spectral Thief onto H.
- Echoed Voice (`data/Moves.c:13504`) is plain HIT; `src/individual/CalcBaseDamage.c:358` is explicitly TODO.
  Round (`291`), pledges (`268`) and fusion attacks (`474/477`) are also TODO. **Doc says** Echoed Voice's power
  increases (guide description); source leaves it at 40. Treat these as source-disabled state boosts, not as
  universal mechanics to add for all profiles.
- Implemented state power: Fury Cutter counter cap 3 current uses (`src/battle/battle_script_commands.c:1767`),
  `CalcBaseDamage.c:220`; Rollout/Ice Ball `228`; Assurance/Revenge `257`; Pursuit `263`;
  Stomping Tantrum/Temper Flare `299`; Retaliate `445`; Lash Out `498`.
- **Revenge ambiguity:** `CalcBaseDamage.c:257` tests **DefendingMon.assuranceDamage**, like Assurance, but its
  native effect script `effect_script_0185_DOUBLE_DAMAGE_IF_HIT.s:7` also calls `CalcRevengePowerMul` before
  damage. Avalanche uses this native effect too (`data/Moves.c:11324`). Verify that native command's flow before
  claiming vanilla triggers or multiplying twice. This is an explicit U3/U7 source/runtime check, not a guessed fix.
- Defense Curl sets its flag (`effect_script_0156_DEF_UP_DOUBLE_ROLLOUT_POWER.s:7`), but the replaced
  `CalcBaseDamage.c:228` Rollout/Ice Ball branch never reads it. Do not assert its multiplier survives merely
  because the flag is set. Needs a battle probe / trace; uncurled 30..480 chain is source-backed.
- Meteor Beam / Electro Shot / Skull Bash really have charge-turn stage scripts:
  `effect_script_0324_CHARGE_TURN_SP_ATK_UP.s:9`, `0325_CHARGE_TURN_SP_ATK_UP_RAIN_SKIPS.s:12`,
  `0145_CHARGE_TURN_DEF_UP.s:9`. Power Herb branches preserve the boost; rain skips Electro Shot's delay only.
- Entry boosts: `src/individual/SwitchInAbilityCheck.c:430` Download, `757/772` Intrepid Sword / Dauntless Shield
  with once-per-battle flags (modern Gen 9), `907` seeds. On-hit sources:
  `MoveHitDefenderAbilityCheck.c:148/166/206/252/271/288/298` Rattled / Steam Engine / Stamina /
  Water Compaction / Justified / Anger Point / Weak Armor. Weak Armor script `subscript_0307_HANDLE_WEAK_ARMOR.s:12`
  gives +2 Spe. Weakness Policy `CheckDefenderItemEffectOnHit.c:180` is a real post-hit effect.
- Minimize uses the modern list (`src/battle/other_battle_calculators.c:2657`); damage multipliers:
  `src/battle/battle_calc_damage.c:591/598/604` Minimize / Dig (Earthquake only) / Dive.
  Gust/Twister check Fly only (`CalcBaseDamage.c:273`, Sky Drop TODO).
- Held Metronome uses **20%**, despite old item parameter 10 in `data/itemdata/itemdata.c:18023`:
  `battle_calc_damage.c:820` selects 1.2/1.4/1.6/1.8/2.0 directly, cap five earlier uses.
- No Fickle Beam or Supreme Overlord in guide move/ability lists. H alone has Lash Out among these guides;
  I alone has Fickle Beam. Weakness Policy / Metronome exist in H source and trainer data although absent from
  its item-location index. Kee/Maranga/Luminous Moss also exist in source (`itemdata.c:44669/44734/42134`)
  without guide item entries: distinguish mechanics support from item acquisition documentation.

### I checkpoint: Emerald Imperium

- Current source switches: `include/config/battle.h:65/67/150` use latest move data/flags and +2 Spe Weak Armor;
  **152/153 explicitly set Intrepid Sword / Dauntless Shield to GEN_1**, so they activate on every entry, not
  just once per battle. `src/battle_util.c:4810/4824` tests once-per-battle flags only when configured GEN_9.
- Only Skull Bash / Meteor Beam / Electro Shot have `onChargeTurnOnly` stat effects in the pinned move table
  (`src/data/moves_info.h:3321/18082/20452`). Generic timing guard:
  `src/battle_script_commands.c:4186`. No other damaging move was found with that pre-hit stage flag.
- Spectral Thief executes theft before crit/damage (`data/battle_scripts_1.s:1306`,
  `src/battle_script_commands.c:17783/17837`); unlike stock it passes boosts through `ChangeStatBuffs` (Simple).
  Source oddity: it skips stealing a stat when the attacker's corresponding stage is already +6, and truncates
  stolen positive stages before passing them through Contrary/Simple. Preserve/fixture the source instead of
  claiming all canonical edge cases are identical.
- `src/battle_util.c`: Rollout/Ice Ball + Defense Curl `8789`; Fury Cutter `8799/8850` (cap current use 3 in
  `src/battle_script_commands.c:13698`); Revenge/Avalanche `8868`; Assurance `8897`; Echoed Voice `8955`;
  Round `8979`; fusions `8989`; Rage Fist `9048` (50 + 50 per hit, max 350); Fickle Beam `9052`;
  Last Respects `9060` (50 + 50 per faint event, **100 events / 5050 max**, not five allies);
  Retaliate `9104`; Stomping Tantrum/Temper Flare `9112`; held Metronome `10139` (five earlier uses).
- Echoed Voice source counts **this battler's** repeated same move, shared with Metronome
  (`battle_script_commands.c:1899/6832`), unlike canonical field-wide consecutive-turn Echoed Voice. State input
  must represent the source counter, not infer it from the other battler's action. Round/fusion source also
  checks last-used move (`8979/8989`), not a simulated turn history; explicit scenario toggle is appropriate.
- Fickle Beam's boost chance is 30% (`battle_script_commands.c:17478`). Supreme Overlord snapshots
  `min(5, side faint-event counter)` on entry (`battle_util.c:4915`), then adds 10% per count (`3970/9260`).
  It is not a +Attack/+SpAtk stage and does not continuously recompute living teammates.
- Target-state **damage** doubles live in `battle_util.c:10005/10012/10019/10026`, not the BP calculation;
  corresponding move flags were checked individually, including generation-conditional false flags.
  Current Minimize list adds Supercell Slam; excludes Phantom/Shadow Force, Double Iron Bash,
  Needle Arm, Astonish and Extrasensory. Fissure can hit Dig but remains OHKO: do not double OHKO damage.
- Despite upstream definitions, this guide has **no Lash Out or pledge moves**, and no Rattled / Costar /
  Opportunist / Mirror Armor / Wind Power in `AB`. Conversely, Wind Rider and Supreme Overlord are present.
- Triple Arrows is modern 90 BP, normal **post-hit** 50% Defense drop (`moves_info.h:19086`), not the Legends:
  Arceus pre-damage mechanic. Berserk explicitly waits for the last strike (`battle_util.c:5474`).

## Work remaining

All four source checkpoints are complete; consolidated A/D tables and implementation boundaries are pending.
Do not implement from this partial checkpoint alone.
