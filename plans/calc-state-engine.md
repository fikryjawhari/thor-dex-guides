# U1: state-dependent damage and pre-hit stat changes

Research for `calc-engine-pass.md`, 2026-10-26. Owned scope: A and D only; no engine, UI or data edits.
P = Photonic Sun 2.38 Rebalanced (Gen 7); E = Eternal X Rebalanced (Gen 6);
H = Hardlove Gold 0.8.3 (modern hg-engine, not vanilla Gen 4); I = Emerald Imperium 1.3.1 (expansion).
Presence means the guide's `M` / `AB` / item data contains an entry, not that every species can learn it.
Absent guide entries must not be enabled just because upstream source defines them.

## Authority and checkpoints

- All four `data.json` move lists were searched with `rg -o --count-matches` and named entries / parallel
  `MV` records checked programmatically. Item checks distinguish `IT` acquisition entries, trainer-held mentions
  and source definitions (never `AB`); an incomplete location index isn't item removal. No whole data file was printed.
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

## Matrix conventions

Per-generation references below link Bulbapedia's **Effect** sections (research date 2026-10-26). Use turn-based Gen6/7/9
rules, not Legends, GO or Champions. Hack source wins. `P/E dump` refers to the checkpoint lines above.
`I util/cmd/moves/scripts` = `src/battle_util.c`, `src/battle_script_commands.c`, `src/data/moves_info.h`,
`data/battle_scripts_1.s`; `H base/damage/moves` = `src/individual/CalcBaseDamage.c`,
`src/battle/battle_calc_damage.c`, `data/Moves.c`. Stock references are under
`tools/calc/node_modules/@smogon/calc/src/mechanics/`.

`slot.st` is an **earlier count** (zero = first use) or boolean scenario flag. Clamp at the listed maximum before
exponentiation. Never map it to stock `move.timesUsed` (whole attacks over turns). `slot.met` is independent;
`def.vol` has dig/fly/dive/min/switch (symmetric atk.vol). Automatic means the trigger follows from this move/hit
and known state, **not** permission to replay historical entry boosts on every recompute. Stage range [-6,+6];
respect Contrary/Simple, prevention, suppression and consumed items. These pages are not battle simulators.

## A: pre-hit stages and entry / between-strike effects

| Move / effect | Hacks | Rule per generation (Bulbapedia) | Hack change (source line) | Input | Stock handles it |
| --- | --- | --- | --- | --- | --- |
| [Meteor Beam](https://bulbapedia.bulbagarden.net/wiki/Meteor_Beam_(move)) | H I | G8/9: +1 SpA on charge, then hit; Power Herb preserves boost. | H effect0324:9; I moves:18063/18082. Both hacks accuracy100, not vanilla90 (H doc row99 agrees). | **automatic**, pre-charge stages as input; never add twice | **yes** gen789:90 |
| [Electro Shot](https://bulbapedia.bulbagarden.net/wiki/Electro_Shot_(move)) | H I | G9: +1 SpA before hit, including rain/Power Herb; rain removes delay, not boost. | H effect0325:7/12/26; I moves:20434/20452. | **automatic**, including rain | **yes** gen789:90 |
| [Skull Bash](https://bulbapedia.bulbagarden.net/wiki/Skull_Bash_(move)) | P E H I | G1 no Def boost; G2+ +1 Def on charge; G6+130 BP. Not +Atk. | P/E dump; H effect0145:9; I moves:3321. Mainly matters to stat-dependent follow-up, not its ordinary own hit. | **automatic**, Simple+2/Contrary-1 | **no** charge-stage path found |
| [Spectral Thief](https://bulbapedia.bulbagarden.net/wiki/Spectral_Thief_(move)) | P H I | G7+: steal positive stages before damage; negative stages remain; Simple doubles gains, Contrary reverses; immunity prevents theft. | **H disabled**, moves:19309 + move0715:7; P dump1836; I scripts:1306, cmd:17783/17837 has cap/truncation quirks above. | **automatic** P/I from target boosts; **none H** (plain90) | **yes, partial**, gen789:552 misses Simple; suppress stock theft H |
| [Download](https://bulbapedia.bulbagarden.net/wiki/Download_(Ability)) | P E H I | G4+: on entry, lower opposing staged Def ->Atk+1, otherwise SpA+1 (tie SpA); doubles compares both foes. | H SwitchInAbilityCheck:430; I util:4582 sums both foes. | Entry **automatic only if fresh**; otherwise historical stages/flag. Doubles partner data missing. | **yes, partial** util:250 single-target approximation, no history |
| [Intimidate](https://bulbapedia.bulbagarden.net/wiki/Intimidate_(Ability)) | P E H I | G3+: opposing Atk-1 on entry; generation-specific immunity/reaction list. | H SwitchInAbilityCheck; I util:1004/1018 reactions. Existing page uses manual stage deliberately. | **manual stages retained**; fresh-entry flag needed to replay | **yes** helper; avoid double counting |
| [Intrepid Sword](https://bulbapedia.bulbagarden.net/wiki/Intrepid_Sword_(Ability)) | H I | G8 every entry Atk+1; G9 once per battle. | H SwitchInAbilityCheck:757 once/battle; **I every entry**, battle.h:152=GEN_1, util:4810. | Entry automatic; **flag** fresh/eligible entry, existing set abilityOn is natural gate | **yes, gated** util:264; G9 abilityOn, no history |
| [Dauntless Shield](https://bulbapedia.bulbagarden.net/wiki/Dauntless_Shield_(Ability)) | H I | G8 every entry Def+1; G9 once/battle. | H SwitchInAbilityCheck:772; I battle.h:153=GEN_1, util:4824. | Same entry **flag** / no double counting | **yes, gated** util:270 |
| [Electric Seed](https://bulbapedia.bulbagarden.net/wiki/Electric_Seed) / [Grassy Seed](https://bulbapedia.bulbagarden.net/wiki/Grassy_Seed) | P H I | G7+: matching terrain consumes seed, Def+1; airborne holders also activate; Simple/Contrary apply. | H SwitchInAbilityCheck:907/subscript0349; I util:6955/7661/7664; E none. | **automatic** currently held item+terrain; old consumed seed is manual stages | **yes, partial** util:308 handles Contrary but not Simple |
| [Misty Seed](https://bulbapedia.bulbagarden.net/wiki/Misty_Seed) / [Psychic Seed](https://bulbapedia.bulbagarden.net/wiki/Psychic_Seed) | P H I | G7+: as above, SpD+1. | H subscript0349; I util:7667/7670. | **automatic** same consumption boundary | **yes, partial**, same Simple gap |
| [Stamina](https://bulbapedia.bulbagarden.net/wiki/Stamina_(Ability)) | P H I | G7+: Def+1 after **each** damaging strike, never before first strike. | H MoveHitDefenderAbilityCheck:206; I util:5460. | **automatic between hits**, target survives and hit reaches it | **yes, partial** util:395, not every Simple/Contrary case |
| [Water Compaction](https://bulbapedia.bulbagarden.net/wiki/Water_Compaction_(Ability)) | P H I | G7+: Def+2 per Water strike; not Water immunity. | H handler:252; I util:5446. | **automatic between hits** | **yes, partial** util:403 |
| [Weak Armor](https://bulbapedia.bulbagarden.net/wiki/Weak_Armor_(Ability)) | P E H I | G5/6 physical strike Def-1/Spe+1; G7+ Def-1/Spe+2, each strike. | H handler:298/subscript0307:12; I battle.h:150, util:5509. E needs Spe+1. | **automatic between physical hits**, White Herb may restore drop | **yes, partial** util:411 hard-codes Spe+2 and lacks physical guard in helper; fixture E/special hits |
| [Weakness Policy](https://bulbapedia.bulbagarden.net/wiki/Weakness_Policy) | P E H I | G6+: surviving super-effective strike consumes item, Atk/SpA+2 once; can change next Foul Play strike. | H CheckDefenderItemEffectOnHit:180/itemdata:41549 (not item-location index); I util:8107/scripts:6104. | **automatic after triggering strike**, not before first hit | **no** in stock multihit helper |
| [Justified](https://bulbapedia.bulbagarden.net/wiki/Justified_(Ability)) | P E H I | G5+: Atk+1 per Dark strike; can strengthen next Foul Play received. | H handler:271; I util:5418. | **automatic between hits** | **no** general event path |
| [Rattled](https://bulbapedia.bulbagarden.net/wiki/Rattled_(Ability)) | P E H | G5+ Spe+1 per Bug/Dark/Ghost strike; G8+ also Intimidate. | H handler:148; I source defines it but guide AB lacks it. | **automatic between hits**; historical proc manual stages | **no** general event path |
| [Steam Engine](https://bulbapedia.bulbagarden.net/wiki/Steam_Engine_(Ability)) | H I | G8+: Spe+6 stages per Fire/Water hit, not unconditional assignment to +6. | H handler:166; I util:5877. | **automatic between hits**, cap+6; doesn't reorder already committed strikes | **no** general event path |
| [Anger Point](https://bulbapedia.bulbagarden.net/wiki/Anger_Point_(Ability)) | P E H I | G4+ crit received sets Atk **to +6**, not +6 added; G5+ Substitute prevents proc. | H handler:288; I util:5593. | **automatic per crit strike**; mixed-crit sequence needs branch data | **no** generic per-hit branching |
| [Berserk](https://bulbapedia.bulbagarden.net/wiki/Berserk_(Ability)) | P H I | G7+: crossing above-half ->half-or-less by a move gives SpA+1; multihit proc is **after whole move**. | I util:5474 checks last strike; H post-move timing needs same verification. | **not** before next hit of this sequence; prior proc manual stages | **no**, but do not add incorrect between-hit boost |
| [Defiant](https://bulbapedia.bulbagarden.net/wiki/Defiant_(Ability)) / [Competitive](https://bulbapedia.bulbagarden.net/wiki/Competitive_(Ability)) | P E H I | G5/G6+: opposing stat drop ->Atk+2/SpA+2; not self drops or already-negative stages. | H btl_scr_cmd_33_statbuffchange:120; I util:1004. Can react between strikes after an actual stat-drop event. | **automatic** for known event; historical **flag/manual** | **no** general event path; stock Intimidate reactions aren't universal support |
| [Costar](https://bulbapedia.bulbagarden.net/wiki/Costar_(Ability)) / [Opportunist](https://bulbapedia.bulbagarden.net/wiki/Opportunist_(Ability)) / [Mirror Armor](https://bulbapedia.bulbagarden.net/wiki/Mirror_Armor_(Ability)) | H | G9 Costar copies ally stages on entry; Opportunist copies opposing increases; G8 Mirror Armor reflects opposing stat drops. | H SwitchInAbilityCheck:950/1076 and stat-change handler. I definitions not guide presence. | **flag + partner/event stages**; scalar slot.st cannot name stats/partner | **no** general partner/event simulation |
| [Wind Rider](https://bulbapedia.bulbagarden.net/wiki/Wind_Rider_(Ability)) | I | G9: entry in Tailwind or absorbing wind move ->Atk+1; wind immunity separate. | I util:4838 and wind handlers; H guide lacks ability. | **automatic only on Tailwind entry**; prior wind absorption **flag/manual** | **yes, partial** util:276 Tailwind scenario only |
| [Luminous Moss](https://bulbapedia.bulbagarden.net/wiki/Luminous_Moss), [Absorb Bulb](https://bulbapedia.bulbagarden.net/wiki/Absorb_Bulb), [Cell Battery](https://bulbapedia.bulbagarden.net/wiki/Cell_Battery), [Snowball](https://bulbapedia.bulbagarden.net/wiki/Snowball) | P E I; H source (Absorb Bulb also guide) | G5/6+: consume once after Water (SpD+1/SpA+1), Electric (Atk+1), Ice (Atk+1) respectively. | I util:8117/8128/8139/8150; H itemdata:42134 + item-effect handlers; location index incomplete. | **automatic between hits** if held, no old-proc assumption | **yes Moss only** util:361; **no** generic other three |
| [Kee Berry](https://bulbapedia.bulbagarden.net/wiki/Kee_Berry) / [Maranga Berry](https://bulbapedia.bulbagarden.net/wiki/Maranga_Berry) | H I source; no named guide item entries | G6+: consume after physical/special strike, Def+1/SpD+1. | H itemdata:44669/44734; I util:7260/7264/8204/8207. Acquisition omission isn't removed mechanics. | **automatic between hits** if explicitly supplied as item | **yes, partial** util:361; consumed-item guard precedence deserves fixture |
| [Rage](https://bulbapedia.bulbagarden.net/wiki/Rage_(move)) | P E H I | G2+: active Rage state gives Atk+1 on receiving direct hits; another selected move ends it. Selecting Rage isn't a free pre-hit boost. | I Rage move effect/move-end paths; H inherited native effect needs same active-state boundary. | **flag** prior active Rage, then automatic received-strike events; def.vol enum lacks Rage | **no** history simulation |
| [Charge](https://bulbapedia.bulbagarden.net/wiki/Charge_(move)) / [Electromorphosis](https://bulbapedia.bulbagarden.net/wiki/Electromorphosis_(Ability)) / [Wind Power](https://bulbapedia.bulbagarden.net/wiki/Wind_Power_(Ability)) | Charge P E H I; Electromorphosis H I; Wind Power H | Charge G3+: next Electric power x2; G4+ also SpD+1 when Charge used. G9 abilities set charged state, **not SpD+1**. Charge's duration differs G9 vs older gens. | H MoveHitDefenderAbilityCheck:184; I util:6004/6008; I AB has no Wind Power. | Prior Charge **flag**, not selecting any Electric move; separate charged effect from manual SpD stage | **yes, partial** side.isCharge / Electromorphosis abilityOn; no full trigger history |
| [Protosynthesis](https://bulbapedia.bulbagarden.net/wiki/Protosynthesis_(Ability)) / [Quark Drive](https://bulbapedia.bulbagarden.net/wiki/Quark_Drive_(Ability)) | H I | G9 strongest stat x1.3 (Speed x1.5), Sun/terrain or Booster Energy; **not stages**. | H entry handler:950; I modern ability handlers. | **automatic** known field/item + existing gate; no extra stage | **yes**, keep existing modifier path |
| [Moxie](https://bulbapedia.bulbagarden.net/wiki/Moxie_(Ability)), [Beast Boost](https://bulbapedia.bulbagarden.net/wiki/Beast_Boost_(Ability)), Soul-Heart, Battle Bond, Chilling/Grim Neigh, Speed Boost, Moody | Moxie/Speed Boost/Moody P E H I; Beast Boost/Soul-Heart/Battle Bond P H I; Chilling/Grim Neigh H I | KO/end-turn effects follow their event, not before the causing hit. Battle Bond G7 form change, G9 once-only Atk/SpA/Spe boost. | I util:3575 Battle Bond; hack form/KO paths, not generation label alone. | Prior events **manual stages/form**; never free boost on first hit; later targets of spread moves need event order | **no** full battle-event simulation |
| [Triple Arrows](https://bulbapedia.bulbagarden.net/wiki/Triple_Arrows_(move)) | I | PLA mechanics are not SV mechanics; G9 50% Def drop **after damage**, high crit/flinch. | I moves:19086 (90BP, PP15, 50% post-hit drop). | **not** automatic pre-hit; later-strike drop needs chosen outcome | **no** generic secondary-event simulation |
| [Cotton Down](https://bulbapedia.bulbagarden.net/wiki/Cotton_Down_(Ability)) | H I | G8+: hit lowers all other active battlers' Spe by1, potentially between strikes; not holder's own Speed. | H MoveHitDefenderAbilityCheck:403; I util:5865. | **automatic after actual strike**, with Simple/Contrary and partner boundaries | **no** generic event path |
| [Guard Dog](https://bulbapedia.bulbagarden.net/wiki/Guard_Dog_(Ability)) | H | G9: Intimidate raises Atk1 rather than lowers; phazing immunity separate. | H guide AB includes it; native entry/reaction source must be traced before assuming standard stock entry helper applies. | Known fresh Intimidate event **automatic**; historical **manual stages/flag** | **yes** stock Intimidate helper has Guard Dog; not a reason to replay historical entry |
| [Anger Shell](https://bulbapedia.bulbagarden.net/wiki/Anger_Shell_(Ability)) | H I | G9: crossing half HP by hit raises Atk/SpA/Spe1, lowers Def/SpD1; **after whole multihit move**, not between strikes. | H ServerDoPostMoveEffects:1955; I util:5990 explicitly last-hit guard. | **not before later strike**; prior proc manual stages | **no** full event simulation |
| [Liechi](https://bulbapedia.bulbagarden.net/wiki/Liechi_Berry) / Ganlon / Salac / Petaya / Apicot berries | P E game items; H I source (guide item coverage partial) | G3+: at <=1/4 HP consume for Atk/Def/Spe/SpA/SpD+1; Gluttony <=1/2, G8+Ripen doubles berry boost. Can trigger between hits. | H itemdata:13079/13144/13209/13274/13339 and battle_item:450..490; I util:7236..7252. Guide mentions: Liechi P/E; Salac all; Petaya P/E; Apicot H; Ganlon none. | **automatic threshold after strike**, consumed once; no historical inference from low HP alone if item already gone | **no** generic threshold/berry multihit walker |
| [Starf Berry](https://bulbapedia.bulbagarden.net/wiki/Starf_Berry) | P E game items; H I source; E/H guide mentions | G3+: pinch threshold, random eligible stat+2; Simple/Ripen may increase stages further, cap6. | H itemdata:13469; I util:7268/7568/7835. | **flag + selected random stat**, not deterministic arbitrary +Atk | **no** random event simulation |
| [White Herb](https://bulbapedia.bulbagarden.net/wiki/White_Herb) | P E H I | G3+: consume to restore negative stages to0; no positive-stage removal. Can follow Weak Armor or self drops. | H entry/post-move item checks; I util:7509/7747/8290. | **automatic at source event timing**, not erase manually entered old stages for free on every recompute | **yes, partial** Weak Armor/self-drop helper paths, not every event |
| [Throat Spray](https://bulbapedia.bulbagarden.net/wiki/Throat_Spray) / [Blunder Policy](https://bulbapedia.bulbagarden.net/wiki/Blunder_Policy) / [Adrenaline Orb](https://bulbapedia.bulbagarden.net/wiki/Adrenaline_Orb) | Spray H I guide; Orb P guide; H I source supports all three (E none) | G8 Spray sound move ->SpA1 after use; G8 Policy accuracy miss ->Spe2; G7 Orb Intimidate ->Spe1. None gives free pre-hit stage just for holding it. | H itemdata:55004/72879, ServerDoPostMoveEffects:611/1487; I util:8004/8059. | **automatic for known event**, historical **manual stages/flag**; Spray doesn't boost causing first hit | **no** general event simulation |
| [Mirror Herb](https://bulbapedia.bulbagarden.net/wiki/Mirror_Herb) | H I source; no guide named item entry | G9: once, copy opponent's actual stat-gain event, not current stage vector as a free initial boost. | H ServerDoPostMoveEffects:645; I util:7406/7709/7926. | **flag + event stat vector**, scalar slot.st cannot encode | **no** general stat-event simulation |
| [Seed Sower](https://bulbapedia.bulbagarden.net/wiki/Seed_Sower_(Ability)) / [Sand Spit](https://bulbapedia.bulbagarden.net/wiki/Sand_Spit_(Ability)) / Toxic Debris | H I | G9/G8: after hit set Grassy Terrain / Sandstorm, potentially changing later strike power or Rock SpD. Toxic Debris lays hazards, not a pre-hit stat boost. | H handler:349/357; I util:5891/5964/6019. | **automatic between hits**, never change first strike retroactively; hazards no immediate stage | **yes, partial** util:388/391 sets terrain/weather; not full field-event simulation |
| Other damaging moves changing stats (inventory below) | Per move below | Usually post-hit, may affect later added strike; self drops can be after whole sequence. | I additionalEffects survey; H native timing must match independently. | **automatic after source-defined event**; chance effects need branch/flag | **no** generic secondary walker; **yes, partial** stock move.dropsStats repeat handling |

### A completeness boundary: post-hit damaging stage effects

I's pinned `additionalEffects` blocks were surveyed. Only Skull Bash/Meteor Beam/Electro Shot have charge-turn
stage flags. The following guaranteed effects can affect a **subsequent** strike if the hack creates one; never
apply retroactively to first damage. Source numbers are `I moves` block starts. Guide presence is per named move;
I's modified chance must not be inherited automatically by another hack.

- User Atk+1: **Power-Up Punch** P E H I (`15215`). SpA+1: **Torch Song** H I (`19682`),
  **Mystical Power** H I (I source `18853`); **Charge Beam** P E H I (`11276`, I chance100 vs vanilla70).
- User Spe+1: **Flame Charge** P E H I (`12179`), **Rapid Spin** P E H I (`5762`, modern G8+ only),
  **Aura Wheel** H I (`17640`), **Trailblaze** H I (`19937`), **Aqua Step** H I (I source `19706`),
  **Esper Wing** H I (I source `19021`). Def+1: **Psyshield Bash** H I (I source `18763`).
- Target Def-1: **Fire Lash** P H I (`15977`), **Grav Apple** H I (`17767`), **Thunderous Kick** H I (`18642`).
  SpD-2: **Acid Spray** P E H I (`12258`), **Lumina Crash** H I (`19348`); SpD-1: **Apple Acid** H I (`17741`).
- Target Atk-1: **Lunge** P H I (`15951`), **Trop Kick** P H I (`16169`), **Breaking Swipe** H I (`17667`),
  **Chilling Water** H only (not I). SpA-1: **Struggle Bug** P E H I (`12993`), **Snarl** P E H I (`13794`),
  **Mystical Fire** P E H I (`14792`), **Skitter Smack** H I (`18226`), **Spirit Break** H I (`17793`).
- Target Spe-1: **Icy Wind** P E H I (`4954`), **Rock Tomb** P E H I (`7978`), **Mud Shot** P E H I (`8563`),
  **Low Sweep** P E H I (`12231`), **Bulldoze** P E H I (`13018`), **Electroweb** P E H I (`13111`),
  **Glaciate** P E H I (`13633`), **Drum Beating** H I (`17505`), **Pounce** H I (`19914`).
- User drops: **Superpower** P E H I Atk/Def-1 (`6962`); **Close Combat** P E H I (`9270`),
  **Dragon Ascent** P E H I (`15404`), **Headlong Rush** H I (`18976`), **Armor Cannon** H I (`20042`) Def/SpD-1;
  **V-create** P E H I Def/SpD/Spe-1; **Hammer Arm** P E H I (`9012`) Spe-1; **Spin Out** H I (`19432`) Spe-2;
  **Clanging Scales** P H I Def-1 (`16251`); **Overheat** P E H I (`7928`), **Psycho Boost** P E H I (`8886`),
  **Draco Meteor** P E H I (`10852`), **Leaf Storm** P E H I (`10925`), **Fleur Cannon** P H I (`16375`) SpA-2;
  **Make It Rain** H I (`19750`) SpA-1. Contrary doesn't strengthen the causing first hit.
- **Clear Smog** P E H I resets target stages **after damage** (I cmd:3735).
  **Scale Shot** H I drops Def/raises Spe after sequence, not per dart. **Diamond Storm** P E H I is chance
  (G6 Def+1, G7+Def+2), as are Ancient Power/Ominous Wind/Silver Wind all-stat boosts; do not force them.
  **Order Up** H requires partner/form context, not universal +stat. Ordinary chance drops (Crunch/Shadow Ball
  and the like) need explicit outcome branches, not unconditional stage changes.

Bulbapedia timing references: [Power-Up Punch](https://bulbapedia.bulbagarden.net/wiki/Power-Up_Punch_(move)),
[Torch Song](https://bulbapedia.bulbagarden.net/wiki/Torch_Song_(move)),
[Rapid Spin](https://bulbapedia.bulbagarden.net/wiki/Rapid_Spin_(move)),
[Acid Spray](https://bulbapedia.bulbagarden.net/wiki/Acid_Spray_(move)),
[Superpower](https://bulbapedia.bulbagarden.net/wiki/Superpower_(move)),
[Close Combat](https://bulbapedia.bulbagarden.net/wiki/Close_Combat_(move)),
[Scale Shot](https://bulbapedia.bulbagarden.net/wiki/Scale_Shot_(move)),
[Clear Smog](https://bulbapedia.bulbagarden.net/wiki/Clear_Smog_(move)),
[Diamond Storm](https://bulbapedia.bulbagarden.net/wiki/Diamond_Storm_(move)),
[Order Up](https://bulbapedia.bulbagarden.net/wiki/Order_Up_(move)).

## D: historical counters, conditional power, combos and target state

| Move / effect | Hacks | Rule per generation (Bulbapedia) | Hack change (source line) | Input | Stock handles it |
| --- | --- | --- | --- | --- | --- |
| [Fury Cutter](https://bulbapedia.bulbagarden.net/wiki/Fury_Cutter_(move)) | P E H I | G2-4 base10, G5 base20, G6+base40; successful consecutive uses double, **160 max**; miss/failure/other move resets. | P/E dump; H base:220/command:1767 cap3 current uses; I util:8799/8850, cmd:13698. | `slot.st` **0..2** ->40/80/160, clamp above2 | **no**; timesUsed isn't this counter |
| [Echoed Voice](https://bulbapedia.bulbagarden.net/wiki/Echoed_Voice_(move)) | P E H I | G5+: +40 per consecutive turn used by any battler, once/turn, **200 max**. Executed miss/Protect maintains chain; a turn with no use resets. | **H flat40**, base:358 TODO; **I own repeated-move counter**, util:8955, cmd:1899/6832, not canonical shared history. | `slot.st` **0..4** P/E/I; none H | **no** |
| [Rollout](https://bulbapedia.bulbagarden.net/wiki/Rollout_(move)) | P E H I | G2+: **30/60/120/240/480**, five successive turns; miss/failure ends chain. Defense Curl doubles to **60..960**, not sixth turn. | H base:228; I util:8789. H curl multiplier unresolved above. | `slot.st` **0..4** + independent **Defense Curl flag** (contract gap) | **no** |
| [Ice Ball](https://bulbapedia.bulbagarden.net/wiki/Ice_Ball_(move)) | P E H I | G3+: same chain/caps and Defense Curl as Rollout. | H base:229; I EFFECT_ROLLOUT. | `slot.st` **0..4** + curl flag | **no** |
| [Defense Curl](https://bulbapedia.bulbagarden.net/wiki/Defense_Curl_(move)) interaction | P E H I | G2+: prior use sets curl state until switch; later changed Def stage doesn't erase/prove flag. | H effect0156:7 sets flag but replacement base lacks read; I util:8794 reads it. | **flag**, independent of chain length/Def stage | **no** |
| [Rage Fist](https://bulbapedia.bulbagarden.net/wiki/Rage_Fist_(move)) | H I | SV G9:50+50 per direct received hit, each strike counts, **350 max / six hits**; persists switch/revival, not confusion/Substitute hits. | **H fixed100**, moves:24088, doc rows120/10; **I50..350**, util:9048. | I `slot.st` **0..6**; no H counter | **no** |
| [Last Respects](https://bulbapedia.bulbagarden.net/wiki/Last_Respects_(move)) | H I | G9:50+50 per party faint **event**, including repeat faint after revival, **5050 max /100 events**. | **H flat50**, moves:23143/move0857:7; I util:9060 caps100 events. | I `slot.st` **0..100**, not0..5; none H | **no** |
| [Assurance](https://bulbapedia.bulbagarden.net/wiki/Assurance_(move)) | P E H I | G4/5 base50; G6+60 ->120 if target already damaged this turn, not merely acting second. | P/E dump; H base:257 DefendingMon.assuranceDamage; I util:8897 physical/special/confusion damage. | `slot.st` **toggle**, target damaged | **no** general input; internal Parental Bond exception isn't general support |
| [Revenge](https://bulbapedia.bulbagarden.net/wiki/Revenge_(move)) | P E H I | G3+:60 ->120 if **this target** already damaged user that turn; not residual/other foe damage. | I util:8868 verifies source battler; H base:257 instead checks target's Assurance damage **plus** native script path; unresolved trace. | `slot.st` **toggle** P/E/I; H trace first | **no** |
| [Avalanche](https://bulbapedia.bulbagarden.net/wiki/Avalanche_(move)) | P E H I | G4+:60 ->120 on same target-damaged-user condition; negative priority alone insufficient. | I EFFECT_REVENGE; H moves:11324/effect0185:7 calls native CalcRevengePowerMul. | `slot.st` **toggle**, H native verification first | **no** |
| [Retaliate](https://bulbapedia.bulbagarden.net/wiki/Retaliate_(move)) | P E H I | G5+:70 ->140 if ally fainted **previous turn**, not any historical faint. | H base:445; I util:9104. | `slot.st` **toggle** | **no** |
| [Stomping Tantrum](https://bulbapedia.bulbagarden.net/wiki/Stomping_Tantrum_(move)) | P H I | G7+:75 ->150 after qualifying previous move failure/miss/prevention; not merely moving last. | H base:299 hasMoveFailureLastTurn; I util:9112 lastMoveFailed. | `slot.st` **toggle** hack failure flag | **no** |
| [Temper Flare](https://bulbapedia.bulbagarden.net/wiki/Temper_Flare_(move)) | H I | G9:75 ->150 after qualifying last failure; canonical Protect/recharge cases aren't necessarily identical to Tantrum. | H base:299 and I EFFECT_STOMPING_TANTRUM deliberately share hack failure flag. | `slot.st` **toggle** hack flag | **no** |
| [Lash Out](https://bulbapedia.bulbagarden.net/wiki/Lash_Out_(move)) | H | G8+:75 ->150 if user actually lost a stat **this turn**; Haze/reset not a drop, negative stages alone insufficient. | H base:498 anyStatLoweredThisTurn; I definition isn't guide presence. | `slot.st` **toggle**, never stage-sum inference | **no** valid turn-history input: gen789:1092 tests countBoosts<0, but util:643 counts only positive boosts, so condition is unreachable |
| [Pursuit](https://bulbapedia.bulbagarden.net/wiki/Pursuit_(move)) | P E H I | G2-7:40 ->80 intercepting qualifying outgoing switch; not forced phazing/newly entered target. Later gens normally remove move; hacks retain. | H base:263 pursuitContext.isActive; I util switch action. | `def.vol='switch'` ->stock defenderSide.isSwitching **'out'**; do not also double via slot.st | **yes** |
| [Metronome item](https://bulbapedia.bulbagarden.net/wiki/Metronome_(item)) | P E H I | G4+10% per earlier use, max100%; G5+ **+20%, max100% after five**. Break in sequence resets. | H damage:820 explicitly modern despite itemparam10; I util:10139 min5. H item in sets, not location index. | `slot.met` **0..5**, directly timesUsedWithMetronome, **not +1** | **yes**, final damage modifier, not BP |
| [Supreme Overlord](https://bulbapedia.bulbagarden.net/wiki/Supreme_Overlord_(Ability)) | I | G9:10% power per defeated ally at entry, ordinary party max5 ->**1.5x**; not stages. | I util:4915 snapshots min5 **side faint events**, helper3970; repeats after revival can count in this source. | **counter0..5** ->stock attacker.alliesFainted; independent of move slot.st (contract gap) | **yes** |
| [Fusion Flare](https://bulbapedia.bulbagarden.net/wiki/Fusion_Flare_(move)) | P E H I | G5+:100 ->200 after qualifying prior successful Fusion Bolt that turn, with no intervening successful move; any battler. | **H flat100**, base:474 TODO; I util:8989 last complementary fusion effect. | `slot.st` **toggle** P/E/I; none H | **no** |
| [Fusion Bolt](https://bulbapedia.bulbagarden.net/wiki/Fusion_Bolt_(move)) | P E H I | G5+:100 ->200 after qualifying Fusion Flare, same ordering. | H base:477 TODO; I util:8989. | `slot.st` **toggle** P/E/I; none H | **no** |
| [Round](https://bulbapedia.bulbagarden.net/wiki/Round_(move)) | P E H I | G5+: later Round that turn60 ->120, immediately after first; **not240** after third user. | **H flat60**, base:291 TODO; I util:8979 last Round. | `slot.st` **toggle** P/E/I; none H | **no** |
| [Fire Pledge](https://bulbapedia.bulbagarden.net/wiki/Fire_Pledge_(move)) | P E H | G5 base50, G6+80; combined **150**, not160. Fire+Grass ->Fire-type/sea of fire; Fire+Water ->Water-type/rainbow. Second user attacks, first waits. | P/E dump80; **H flat80**, base:268 TODO; I guide no pledges despite upstream implementation. | `slot.st` **toggle + partner pledge/type**, boolean alone insufficient; none H | **no** |
| [Water Pledge](https://bulbapedia.bulbagarden.net/wiki/Water_Pledge_(move)) | P E H | G6+80, combined150; Water+Fire Water-type/rainbow; Water+Grass Grass-type/swamp. Combined STAB regardless user's type. | P/E dump80; H TODO. | Same combination flag + partner identity/type | **no** |
| [Grass Pledge](https://bulbapedia.bulbagarden.net/wiki/Grass_Pledge_(move)) | P E H | G6+80, combined150; Grass+Fire Fire type; Grass+Water Grass type. Combo STAB/4-turn side effect separate. | P/E dump80; H TODO. | Same gap; typing BP150 alone isn't complete combo | **no** |
| [Fickle Beam](https://bulbapedia.bulbagarden.net/wiki/Fickle_Beam_(move)) | I | G9:**30%** double power80 ->160, not crit; no ignoring stages/screens. | I util:9052/cmd:17478; H definition exists but guide M lacks it. | `slot.st` **toggle** chosen outcome, not average104 | **no** |
| [Gust](https://bulbapedia.bulbagarden.net/wiki/Gust_(move)) | P E H I | G2+:damage x2 to Fly/Bounce phase; G5+Sky Drop has carrier/target exceptions, not all airborne states. | H base:273 Fly flag, Sky Drop TODO; I moves:511/util:10026. | `def.vol='fly'` eligible phase, **damage x2**, not BP80 | **no** |
| [Twister](https://bulbapedia.bulbagarden.net/wiki/Twister_(move)) | P E H I | G2+:same airborne damage x2; spread reduction separate. | H base:274; I moves:6030/util:10026. | `def.vol='fly'`, damage x2 (**H source BP x2** instead) | **no** |
| [Earthquake](https://bulbapedia.bulbagarden.net/wiki/Earthquake_(move)) | P E H I | G2+:damage x2 during Dig; Grassy Terrain interaction mustn't blindly halve underground hit. | H damage:598; I moves:2298/util:10012/9116. | `def.vol='dig'`, **damage x2**, not BP200 | **no** |
| [Magnitude](https://bulbapedia.bulbagarden.net/wiki/Magnitude_(move)) | P E H I | G2+:same Dig x2; random base power still manual/random, independent of target state. | H replaced Dig final modifier lists **Earthquake only**; native-path proof needed for H. I moves:5606. | `def.vol='dig'` P/E/I, manual chosen BP first; H check | **no** |
| [Surf](https://bulbapedia.bulbagarden.net/wiki/Surf_(move)) | P E H I | G3+:damage x2 during Dive; spread modifier separate. | H damage:604; I moves:1514/util:10019. | `def.vol='dive'`, **damage x2** | **no** |
| [Whirlpool](https://bulbapedia.bulbagarden.net/wiki/Whirlpool_(move)) | P E H I | G3+:damage x2 during Dive, not trapping residuals. | H damage:606; I moves:6315/util:10019. | `def.vol='dive'`, initial hit x2 | **no** |
| [Stomp](https://bulbapedia.bulbagarden.net/wiki/Stomp_(move)) / [Steamroller](https://bulbapedia.bulbagarden.net/wiki/Steamroller_(move)) | P E H I | Stomp G2+, Steamroller G5+:Minimize damage x2; G6+accuracy/evasion bypass. | H minimize list other_battle_calculators:2657; I moves:683/13357/util:10005. | `def.vol='min'`, **damage x2** | **no** |
| [Body Slam](https://bulbapedia.bulbagarden.net/wiki/Body_Slam_(move)) / [Dragon Rush](https://bulbapedia.bulbagarden.net/wiki/Dragon_Rush_(move)) / [Flying Press](https://bulbapedia.bulbagarden.net/wiki/Flying_Press_(move)) / [Heat Crash](https://bulbapedia.bulbagarden.net/wiki/Heat_Crash_(move)) | P E H I | G6+:Minimize damage x2/accuracy bypass; weight BP and Flying Press dual effectiveness still apply. | H list2657; I moves:948/10175/13935/13312. | `def.vol='min'`, **damage x2 after ordinary mechanics** | **no** |
| [Heavy Slam](https://bulbapedia.bulbagarden.net/wiki/Heavy_Slam_(move)) | P E H I | **G7+ only** Minimize x2; **not E G6**. | H list2657; I moves:12104 condition>=G7. | `def.vol='min'` P/H/I only | **no** |
| [Phantom Force](https://bulbapedia.bulbagarden.net/wiki/Phantom_Force_(move)) | P E H I | **G6 only** Minimize x2, removed G7+. | I moves:14091 condition==G6; H modern list omits. | `def.vol='min'` **E only** | **no** |
| [Shadow Force](https://bulbapedia.bulbagarden.net/wiki/Shadow_Force_(move)) | P E I | **G6 only** Minimize x2; H guide lacks move. | I moves:11691 condition==G6. | `def.vol='min'` **E only** | **no** |
| [Supercell Slam](https://bulbapedia.bulbagarden.net/wiki/Supercell_Slam_(move)) | H I | G9:Minimize x2/accuracy bypass, failure crash separate. | H list2666; I moves:20662. | `def.vol='min'`, damage x2 | **no** |
| [Double Iron Bash](https://bulbapedia.bulbagarden.net/wiki/Double_Iron_Bash_(move)) / Needle Arm / Astonish / Extrasensory | Double Iron Bash H I; others P E H I | DIB Minimize bonus only LGPE, not G8/9; other three only G3. **None** in these guide generations. | I moves:17108 <G8; 7614/7821/8211 <G4; H list omits. | **no Minimize bonus**; ordinary DIB hits unchanged | **no**, correctly add none |
| [Thunder / Hurricane / Sky Uppercut / Smack Down / Thousand Arrows](https://bulbapedia.bulbagarden.net/wiki/Semi-invulnerable_turn) | P E H I | Hit relevant airborne phases but **no doubled damage**. Fly phase isn't merely Flying-type/Levitate. | I flags separate airborne-hit from double-damage; H Sky Drop TODO. | `def.vol='fly'` eligibility only, never Gust's x2 | **no** phase simulation; ordinary damage unchanged |
| [Fissure](https://bulbapedia.bulbagarden.net/wiki/Fissure_(move)) | P E H I | Can hit Dig in relevant gens; OHKO, not ordinary x2 damage. | I moves:2321 underground flag mustn't produce 2x fixed-HP hit. | `def.vol='dig'` **eligibility only** | **no** action eligibility simulation |
| [Shell Trap](https://bulbapedia.bulbagarden.net/wiki/Shell_Trap_(move)) / Focus Punch / Sucker Punch / Upper Hand | Shell Trap P I; Focus/Sucker P E H I; Upper Hand H I | Physical-hit trap trigger / focus uninterrupted / qualifying opposing attack or priority selection govern success, not doubled BP. | I scripts:644/651; native move effects. Not speed-only conditions. | **flag** if simulating success; damage-only calculation assumes successful hit | **no** full action history |
| [Steel Roller](https://bulbapedia.bulbagarden.net/wiki/Steel_Roller_(move)) / Poltergeist / Dream Eater / Synchronoise / Belch / Burn Up / Double Shock | Steel Roller/Poltergeist/Double Shock H I; Dream Eater/Synchronoise/Belch P E H I; Burn Up P H I | Terrain/item/sleep/shared type/berry history/current Fire or Electric type govern success, not BP multipliers. | Known field/item/type/status supplies some eligibility, berry history doesn't. No new state-power override found. | **automatic** known eligibility; otherwise **flag** or preserve damage-on-success convention | **no** complete action-success simulation; don't fake failure with BP0 |
| [Me First](https://bulbapedia.bulbagarden.net/wiki/Me_First_(move)) | P E H I | G4+:copy qualifying damaging move before opponent acts, power x1.5; own BP doesn't identify copied move. | I EFFECT_ME_FIRST path, H inherited native effect; no hacked-power claim. | Copied move identity + first-action state; **not representable** by scalar slot.st | **no** general copied-action simulation |

## Handoff: corrections, open questions and next checks

1. **Don't double already-stock A effects.** Meteor Beam/Electro Shot, Download and seeds already run;
   Spectral Thief partly runs. Add missing metadata/corrections, not a second whole effect. H theft needs complete
   suppression. Verify transformed attacker/defender stages and that engine calls don't mutate input sets.
2. **U2 fixtures must be per hack.** H Rage Fist100, Last Respects50, Spectral Thief90 without theft, Echoed40,
   Round60, fusions100 and pledges80 must remain unchanged by vanilla state toggles. I lacks Lash Out/pledges;
   H lacks Fickle Beam/Supreme Overlord. E Phantom/Shadow Force positive, E Heavy Slam negative, P/H/I opposite
   modern cases; H/I Supercell Slam positive. Missing input preserves current damage convention.
3. **Caps:** Fury Cutter2 prior uses, Echoed Voice4 prior turns, Rollout/Ice Ball4 prior hits, Rage Fist6(I),
   Last Respects100 faint events(I), Metronome5 prior uses, Supreme Overlord5. Fixture cap and above-cap.
4. **Input contract gaps:** Rollout count + prior Defense Curl need separate values; move counter + Supreme
   Overlord need separate values; pledge combo needs partner/type and special STAB, not boolean/BP150 alone.
   Entry freshness/once-per-battle eligibility, partner stages and doubles Download cannot be recovered from
   scalar slot.st or current stages. Do not invent vol enum values, use vol='min' for Defense Curl, or overwrite
   move counters with ability counters. Agree optional extensions with orchestrator/U2 first. Existing set
   abilityOn can gate entry eligibility if its semantics are preserved; it isn't an independent faint counter.
5. **H native-path checks explicitly still open:** trace CalcRevengePowerMul ->CalcDamage ->H base for
   Revenge/Avalanche; trace Defense Curl flag through Rollout/Ice Ball; test Magnitude during Dig (replacement
   modifier lists Earthquake only). Do not resolve these by guessing vanilla or adding a second multiplier.
   No emulator/ROM probe was run. Source-plain HIT and TODO paths above are stronger evidence than descriptions.
6. **Damage vs BP:** semi-invulnerable/Minimize and held Metronome generally modify damage, not BP. Doubling BP
   changes rounding/+2 and BP thresholds such as Technician. H Gust/Twister are explicit BP-doubling exceptions.
   Last Respects/Fury Cutter do change BP. Distinguish effective power from a final damage modifier in metadata.
7. **A simulation boundary:** one row/crit bit cannot enumerate secondary/crit outcomes per strike. Newly consumed
   items, stat reactions and terrain/weather changes cannot modify the first hit retroactively. Stock multi-hit
   support is selective. Historical KO/end-turn/entry effects keep manual stages; never infer free boosts just
   from an ability name. Source-disabled H mechanics and noncanonical I counters need profile-specific coverage.
8. **Known glitch boundary:** Bulbapedia Rollout documents the Gen7 Rollout-storage glitch against Disguise
   (and later Ice Face). Photonic is Gen7: normal 0..4 chain fixtures are not certification of that carry-over
   glitch or a general battle simulator. Keep the ordinary requested caps; don't silently claim glitch support.
9. **Additional item evidence:** I `src/data/items.h:8926/9030/14849` defines Adrenaline Orb / Blunder Policy /
   Mirror Herb; pinch berries `10064/10083/10102/10121/10140/10178`. Adrenaline Orb's I trigger is
   `data/battle_scripts_1.s:7774`. P/E game item dumps contain all six named pinch berries, even when their
   location indexes do not. These are source-supported items, not invented guide acquisition entries.

Survey complete: four hack checkpoints and both A/D matrices delivered; this is not an engine/ROM test result.
**Next step:** orchestrator reviews source exceptions and independent-state extensions, then dispatches U2 with
this report and the engine input contract. Remaining uncertainty is explicitly isolated above, not silently
turned into canonical mechanics.

## U2: Hardlove traces

Pinned source: `kumakuma1/hardlove@f1b236300187a2b18bf1a0b5ee1f80b3a2fed57b`.
Native command bodies are identified by the original HeartGold implementation at
`pret/pokeheartgold@29282f7bb45946dee63475022a8d506092bc3748:src/battle/battle_command.c`,
the same reference linked by H `src/individual/CalcBaseDamage.c:230`. This is source tracing, not an emulator test.
The orchestrator's shared claim remains untouched. Downloaded evidence is ignored under `.tmp/u2/`;
no `.src/` files were changed.

- **Common replacement path:** H `hooks:73-74` replaces both `CalcBaseDamage` and `CalcDamageOverall`;
  command hooks `hooks:108-129` do not replace native commands 15, 110, 115 or 132. H
  `asm/include/battle_commands.inc:80/651/674/757` maps CalcDamage / CalcRolloutPower /
  CalcMagnitudePower / CalcRevengePowerMul to those commands. Native CalcDamage (`battle_command.c:744-750`)
  invokes DamageCalcDefault, i.e. the replaced overall calculation. H `battle_calc_damage.c:282-293`
  calls the replaced base function. H `include/battle.h:958-959` identifies `damage_power` at 0x2154
  and `damage_value` at 0x2158. The replacement copies both (`battle_calc_damage.c:51-52`), but
  `CalcBaseDamage.c:48/399` comments out the `damage_value` read and its multiplication. Native
  power-multiplier writes therefore do not survive this path.
- **Revenge / Avalanche:** H `effect_script_0185_DOUBLE_DAMAGE_IF_HIT.s:7-9` invokes the native
  Revenge command before CalcDamage. Its body (`battle_command.c:3926-3934`) sets 0x2158 to 20
  when this target damaged the attacker, else 10. That multiplier is discarded above. H
  `CalcBaseDamage.c:257-261` separately doubles **Revenge only**, alongside Assurance, if the
  **defender's** `assuranceDamage` is nonzero; Avalanche has no such case. Thus Avalanche stays
  60 even with the native revenge condition. Revenge is 60/120 for **target previously damaged
  this turn**, not the vanilla user-was-hit condition. H fixtures name that distinction explicitly;
  `slot.st:true` means H's target-damaged condition for Revenge. A separate native-only scenario
  cannot be expressed independently with this boolean contract and is not claimed by those fixtures.
  **Doc says** double after the user is hit; the executable replacement has the above exception.
- **Defense Curl through Rollout / Ice Ball:** H `effect_script_0156_DEF_UP_DOUBLE_ROLLOUT_POWER.s:7`
  sets STATUS2_DEFENSE_CURL. `effect_script_0117_DOUBLE_POWER_EACH_TURN_LOCK_INTO.s:7-9` calls
  native CalcRolloutPower, which computes chain power then doubles `movePower` for that flag
  (`battle_command.c:3391-3416`). However, H `battle_calc_damage.c:50-51` starts `movepower` from
  the move table and copies native `movePower` only to `damage_power`. H `CalcBaseDamage.c:228-234`
  recomputes both moves from the remaining rollout count, never reads that `damage_power`, and
  never tests curl. Both retain 30/60/120/240/480 **with or without curl**, including clamped count5.
  **Doc says** Defense Curl doubles Rollout / Ice Ball; this source path loses the multiplier.
- **Magnitude during Dig:** H `effect_script_0126_RANDOM_POWER_10_CASES.s:7-11` sets the native
  multiplier to 10 or 20 depending on Dig, then calls CalcMagnitudePower and CalcDamage (`:15-17`).
  Native magnitude command `battle_command.c:3493-3523` selects 10/30/50/70/90/110/150 BP without
  consulting Dig. H `CalcBaseDamage.c:364-365` preserves that chosen `damage_power`, but drops the
  native multiplier above. H `battle_calc_damage.c:598-601` applies the replacement Dig modifier
  **only to Earthquake**. Magnitude therefore keeps its selected power and ordinary rolls during Dig;
  fixtures explicitly choose BP70 rather than pretend to simulate the random magnitude outcome.
  **Doc says** double during Dig (vanilla); H's pinned implementation does not.

All three source traces are settled at this pin; no emulator claims or guessed missing cases.
