# Pokémon Radical Red build notes

Scaffold only, based on `unbound`. Feature switches need review.

## Build

`uv run python -I hacks/radical-red/extract/build.py`

TODO: implement extract modules; audit inherited cfg switches and cfg.txt wording.

## Sources and rules

TODO: document sources and rules.

### Damage calc

Unit 2 (`rr-calc`, base `3400658`, 2026-11-02) is **blocked, not implemented**.
Stop at the first missing shared-engine mechanic, per the brief. Leave `cfg.calc`
disabled; no shared-engine/template edits are authorised. This is a partial
inventory checkpoint, not an accepted or complete profile.

#### Sources and inventory checkpoint

Source paths below are relative to `.src/`. RR Showdown is pinned at
`54955790eb71a0fb0a881850f1e8afed3bfe25bd`; RR calc at
`7f3540035176b3db4386871956eec1c309aea26e`. These are reference code, not game
source. Check version-sensitive changes against the release changelogs before
including newer Showdown additions. hzla's backup mapping identifies 4.1 Hardcore
as `radredhc` (`repos/Dynamic-Calc-Decomps/backups/title_to_backup_mappings.js:40`);
its engine was not fetched or executed by this unit.

| Mechanic inspected | Source | Base / remaining work |
| --- | --- | --- |
| Toxic Boost: physical power x1.5 when poisoned; no poison or toxic chip | RR calc `calc/src/mechanics/gen789.ts:1088`; Showdown `data/mods/gen9rr/abilities.ts:691`; `drive/All Pokemon Changes v3.1  - Radical Red.txt:46` | Native power boost works; **status-chip immunity missing**. First blocker. |
| Flare Boost: special power x1.5 when burned; no burn chip | RR calc `gen789.ts:1086`; Showdown `abilities.ts:240`; changes v3.1 `:49` | Native power boost works; **status-chip immunity missing**. Same blocker. |
| Freeze is Frostbite: special damage halved and end-turn chip | `drive/Changelog up to v4.0 - Radical Red.txt:843`; RR calc `gen789.ts:553`, `util.ts:540`; Showdown `conditions.ts:2` | Base lacks the penalty; needs status/roll/residual overrides. Thick Fat's conditional residual divisor also needs audit and the missing residual facility. |
| Snow replaces Hail: no chip, Ice Defense x1.5 | changelog up to v4.0 `:14`; RR calc `gen789.ts:1460`; Showdown `conditions.ts:37` (internal Hail) | Gen 8 base exposes Hail. Needs explicit weather/Defense handling, not vanilla Hail chip. |
| Iron Fist x1.3, no Wicked Blow boost | changes v3.1 `:43`; RR calc `gen789.ts:1130`; Showdown `abilities.ts:342` | Disable/replace native x1.2; audit flags. Not implemented. |
| ORAORAORAORA: single-strike punches gain a half-damage second hit | Showdown `abilities.ts:381`; RR calc `gen789.ts:588`, `:1571` | Existing `hits` and per-hit phases are intended for this (engine README); not yet profiled or tested. |
| Hardcore AI weather/terrain permanent | `trainers-hardcore.xlsx`, Main!E10 | Trainer field locks, not permanent player-set weather. Per-boss setter records need unit 6 review. |
| Defog/Steel Roller/Ice Spinner/Splintered Stormshards cannot remove terrain | Main!E12 | Stateful action/field-lock audit required. Not implemented. |
| Rapid Spin no Speed boost; no player omniboost procs | Main!E28, E30 | Stateful effects need profile audit, not just damage multipliers. |
| Ability swaps and exceptions | Main!E102:AJ134 | Player legality, not global boss-effect removal. Exceptions include Spinda Contrary, Comfey Triage and Espathra Speed Boost. |
| Item restrictions/location swaps and banned moves | Main!E14:E40, E137:X178 | Availability, not permission to disable enemy held items or moves. |
| Hardcore auto-enables Minimal Grinding; no EVs except Ghost Marowak's 252 HP | Main!E95 | Disable player EV entry, but preserve the boss exception: global `evs:false` currently zeros trainer EVs too (`tools/calc/src/adapter.js:199`). Needs main-chat review. |

All remaining changed/new abilities, moves and items, type chart, critical hits,
field controls and negative/rounding fixtures remain unaudited. Do not infer
mechanical support from a display label. No `calc_effects.json` was created.

#### Shared-engine blocker

`tools/calc/src/adapter.js:507` is compiled into `template/calc/engine.js`.
Lines 547-555 always apply ordinary poison/toxic/burn except Poison Heal,
Magic Guard and Heatproof. Toxic Boost and Flare Boost must retain the native
power effects but take zero damage from their matching statuses.
`profile.residual.status` is one fixed tuple per status, independent of ability;
`profile.residual.abilities` only adds a fixed per-ability tuple. Damage-phase
rules never run inside `residual()`. There is no conditional suppression hook.
A compensating heal fails toxic escalation, odd-HP rounding and healthy holders.
Aliasing to Magic Guard incorrectly prevents sand and other indirect damage.

Main chat must decide whether to authorise a generic conditional residual hook
with shared tests/rebuild, or explicitly accept unsupported effects. Do not ship
ordinary Toxic Boost/Flare Boost as correct RR mechanics. Conditional Frostbite
chip is another likely consumer, but reconcile the final 4.1 Thick Fat rule first.

`tools/calc/radical-red_check.mjs` uses a synthetic Mew fixture without `data.json`.
It checks native boosts and negative cases, then reports the RR status-chip
failures with a nonzero exit. These are blocking regressions, not accepted oracle
differences or a skip. Expected damage uses RR calc `util.ts:480,540` and
`gen789.ts:1086-1099`, not results copied from this engine.

Checkpoint checks (2026-11-02): `node tools/calc/radical-red_check.mjs` exits 1,
with 13 passes and 3 blocking failures. On the synthetic 175-HP holder, Toxic
Boost incorrectly loses 21 HP to poison or 10/21/32/43 HP to toxic over four
turns; Flare Boost incorrectly loses 10 HP per burn turn. Expected: no status
chip. The power boost rolls are 23-28 versus neutral 16-19; healthy Sand controls
still lose 10 HP. Log: `.tmp/rr-calc/engine-check.log`. The Main tab was read with
openpyxl through `uv run python -I`; cells are in `.tmp/rr-calc/hardcore-main.log`.
No shared fixtures changed, so the brief's conditional `npm test` was not run.

#### Follow-up and in-game checks

After the engine decision, finish the full inventory/profile and one source-backed
fixture per RR-specific effect, including all sixteen rolls and negative cases.
Use Unbound's ordinary field controls without its custom gimmicks; add RR Snow
and boss state only when supported. Check Zangoose/Drifblim poison/burn immunity
and boosted damage in-game, including Sand to prove unrelated chip still applies.
Verify Ghost Marowak's HP with 252 EVs while ordinary player/boss EVs remain zero.
No in-game tests, browser checks, gate runs or independent hzla comparisons ran.

For unit 6: Main!E10 applies to every AI-set weather/terrain. Determine the actual
field and setter for each boss from its sheet; per-boss rows were not audited by
this blocked unit. Keep setter identity and `setterStays` explicit, rather than
assuming one field for all bosses. Preserve Ghost Marowak's 252 HP EVs (Main!E95).

## Local storage

Prefix `rr`. Keep these keys once published.

- `dex`: `rrdex`
- `calc`: `rrcalc`
- `track`: `rrtrack`
- `walk`: `rrwalk`
- `cap`: `rrcap`
- `tr`: `rrtr`
- `recent`: `rrrecent`
- `pos`: `rrpos`
- `mgm`: `rrmgm`
- `loc`: `rrloc`
- `items`: `rritems`
- `dmg`: `rrdmg`

## Hack-only data

TODO: document hack-only data.

## Checks

`uv run python -I tools/gate.py check radical-red`

TODO: replace extract/check.py and calc stubs with source-backed assertions. Calc remains disabled.
Before enabling it, replace the null in tools/scenarios/calc-doubles.mjs EXPECTED with an audited count and add
tools/trainer_fields_check.py DOUBLES_EXPECTED (DOUBLES_PARTNER_ONLY if needed). The engine stub is registered
in tools/calc/package.json; review tools/calc/test.mjs field-profile fixtures. Never copy another hack's counts.
Review tools/itemstd.py RULES only for source-backed quirks; shared defaults need no entry.
Fill sources/watch.json, version/mode, GID/save reader and sprite additions by hand.

## History

TODO: document history.
