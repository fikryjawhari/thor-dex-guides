# Calc refine: audit (step 10)

Audit only; no fixes. Logs in `.tmp/calc-refine/` (not committed). Builds: all four guides assembled from f403abc;
photonic-sun rebuilt on 9215152 (HEAD at the time of the rebuild), its zmove and photonic scenarios rerun on that build.
The 9215152 change is CSS-only (`template/calc.css`, Z from 480 px), so the node checks and the other guides' sweeps
still describe the same logic.

| Item | Pass/fail | Evidence |
|---|---|---|
| 1. `python assemble.py` (all four guides) | pass | `assemble exit 0`; emerald-imperium 1208 species, eternal-x 782, hardlove-gold 986, photonic-sun 928 (sprites: 28 own on emerald only) |
| 1b. `python assemble.py photonic-sun` on 9215152 | pass | `photonic-sun: 2.99 MB, 928 species, 928 sprites (928 shared, 0 own)` |
| 2. `npm test --prefix tools/calc` | pass | `npm test exit 0`; every line PASS (Photonic, Eternal, W2 weights/HP/speed) |
| 2. `hardlove_check.mjs` | pass | `Hardlove source/stock checks: 105 passed; 0 failed; NOT an independent hack oracle` |
| 2. `photonic_check.mjs` + `hzla_compare photonic-sun` | pass | `{"match":118,"known-difference":28,"mismatch":0,"error":0}` |
| 2. `eternal_check.mjs` + `hzla_compare eternal-x` | pass | `{"match":116,"known-difference":3,"mismatch":0,"error":0}` |
| 2. `imperium_check.mjs` + `hzla_compare emerald-imperium` | pass | `{"match":123,"known-difference":9,"mismatch":0,"error":0}`; imperium_check: 132 fixtures passed |
| 2. `extract/check.py` per hack | pass | emerald-imperium: `PASS: Locations PDF wild tables match...` (a pdf FontBBox warning, not a failure); eternal-x: `PASS: 782 species, 680 trainer cards...`; hardlove-gold: `PASS: 986 species, 329 trainer cards...`; photonic-sun: `PASS: all 13 Totem battles...` |
| 3. calc-zmove on photonic-sun | pass | `calc-zmove: 20 passed, 0 failed` (on 9215152 rebuild too) |
| 3. calc-photonic on photonic-sun | pass | `calc-photonic: 10 passed, 0 failed` (on 9215152 rebuild too) |
| 3. calc-eternal on eternal-x | pass | `calc-eternal: 10 passed, 0 failed` |
| 3. calc-hardlove on hardlove-gold | pass | `calc-hardlove: 10 passed, 0 failed` |
| 3. calc-controls, calc-entry, calc-field, calc-hidden, calc-imperium, calc-import, calc-layout, calc-persist, calc-residual, calc-smoke, calc-triple on emerald-imperium | pass | controls 26/0, entry 2/0, field 2/0, hidden 2/0, imperium 10/0, import 6/0, layout 36/0, persist 3/0, residual 40/0, triple 20/0; calc-smoke printed PASS lines (no summary line, exit 0) |
| 4. domcompare emerald-imperium vs .tmp/old, normal and `--kb` | pass | `differing routes: 0` (both) |
| 4. domcompare eternal-x vs .tmp/old, normal and `--kb` | pass | `differing routes: 0` (both) |
| 4. domcompare hardlove-gold vs .tmp/old, normal and `--kb` | pass | `differing routes: 0` (both) |
| 5. zmove trainer bar fits at 260x316 (normal, dvkb) | pass | the fit assertion sits inside the z-toggle step, which runs for widths under 480; `PASS z toggle 260x316 normal` and `PASS z toggle 260x316 dvkb` (old build and 9215152 rebuild) |
| 6. In-game card: emerald-imperium Triple Kick hits 1-3 | pass | per-hit lists from `per` match the notes exactly (`A-cards.log`: MATCH x3) |
| 6. In-game card: eternal-x Cut, Self-Destruct | pass | MATCH (both) |
| 6. In-game card: hardlove-gold Explosion, Self-Destruct | pass | MATCH (both) |
| 6. In-game card: photonic-sun Self-Destruct | pass | MATCH |

## Notes
- Spot-check helper: `.tmp/calc-refine/cards/cards.mjs`. The first Triple Kick run mismatched because the helper used
  id 143 for the defender (that is Snorlax); Blastoise is id `9` in emerald-imperium. The engine's `hits` field does not
  pick the hit; the hit-by-hit rolls are in the result's `per` array, which is what the guide's hit button shows.
- Not run (not in this unit's list): `uv run python -I tools/gate.py check <hack>`, and `tools/calc_save_check.mjs`
  (needs a save file and expected.json; the test-reader fixtures are in `tools/scenarios/fixtures/calc/`, and no guide
  has a save reader in its cfg.calc yet). Grep for "fail" in the logs matched only "0 failed" lines and import-test names.

## Commits
Audit file committed with WIP commit (see git log). No pushes.

## Failures
None.
