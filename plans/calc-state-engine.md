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

## Work remaining

H/I source checkpoints, consolidated A/D tables and implementation boundaries are pending.
Do not implement from this partial checkpoint alone.
