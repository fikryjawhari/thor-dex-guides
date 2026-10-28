# Spec scenarios

Each `*.mjs` is executable: `node tools/scenarios/<name>.mjs dist/<hack>.html`.
`gate.py check --template --jobs 8` runs every entry on each selected guide. For built guides without a rebuild
or baseline: `uv run python -I tools/gate.py scenarios [hack ...] --only calc-layout,calc-controls --jobs 8`.
Omit `--only` for all scenarios; `--jobs` defaults to 1. Other browser sweeps remain serial.
Keep helpers outside this folder or use another extension: the gate discovers every `*.mjs` here.
Existing mockup checks stay in `tools/mockup/`; the gate calls them directly.

Use `startBrowser` from `tools/browser.mjs`, an isolated browser context, and `try/finally` with `close()`.
Seed localStorage once before navigation, not on every reload. Set the viewer size and `dvkb`, open a route,
wait for the control, act through the DOM, then assert visible and saved state. Capture page exceptions;
use bounded waits and descriptive assertions/nonzero exits. No fixed personal paths. Include 260 × 316,
keyboard mode, empty data and older saved state where relevant.

`tracker-reload.mjs` seeds a failed tracker entry, clicks Clear, then reloads and checks persistence at
260 × 316 in `dvkb`. The seed is not re-applied after reload.

## Calc checks

Most use `tools/calc_check_lib.mjs`: copied guides, role-based trainers, isolated pages, hit-tested taps,
number boxes/dvkb pad, the real file input and result matrices. Fixture patches rename trainers and strip a
sheet-only set; synthetic save fixtures in `tools/scenarios/fixtures/calc/` are mapped into each guide's IDs.
Import scenarios inject `template/calc/readers/test.js`; real reader checks use `tools/calc_save_check.mjs`
(`tools/README.md` → Calc checks and the save check). Built `dist/` files are never changed.

| File | Coverage |
| --- | --- |
| `calc-layout.mjs` | Fit, long names, scroll stops, box size, wide columns and foe list/strip; includes the 222 px resize and 61-Pokémon box. |
| `calc-controls.mjs` | Attack taps, caps, trainer navigation, speed/stages, HP, crit, hits, moves, Mega, custom/unknown sets. |
| `calc-import.mjs` | Save/reset/re-import, four error banners and empty states. |
| `calc-bridge.mjs` | Fake `window.dexViewerApp`: import, refresh, newer-save dot, errors and Change file/Pick. |
| `calc-persist.mjs` | Reloaded state, saved sets and list filters by name across a simulated guide update (26c), and Clear saved state through the frame built by `tools/mockup/thor-frame/build.py`. |
| `calc-entry.mjs` | Trainer-card and Pokémon-page entry points. |
| `calc-field.mjs` | Profile-driven controls, engine inputs and persistence after profile edits. |
| `calc-hidden.mjs` | As-built visibility and entry points with and without `cfg.calc`. |
| `calc-auto.mjs` | Scratch/set/fight lifetimes, entry effects, trainer changes, Reset fight and migration. |
| `calc-doubles.mjs` | Automatic trainer format, manual overrides, reset and non-doubles tags. |
| `calc-field-states.mjs` | Global groups, sports/splits/auras, hazards and re-entry. |
| `calc-moves.mjs` | Default power, hit restrictions, ally effects and HP-move actions. |
| `calc-residual.mjs` | Turn-end effects, type choices, HP reset and open-editor layout. |
| `calc-retest.mjs` | Frame, fight bar, HP, pickers, damage actions, move/Field sync, Protect and Field groups. |
| `calc-smoke.mjs` | Import, first-frame fit, cell sizes and failed-import state preservation. |
| `calc-state.mjs` | Card/Field layout, search, row states, hit choices, reset, pre-hit changes and crits. |
| `calc-team.mjs` | Team/card first-frame fit, busiest cards, open editors/moves and scroll stops. |
| `calc-triple.mjs` | Total/individual strikes and automatic variable power with manual overrides. |
| `calc-zmove.mjs` | Z toggles and Totem auras where available. |
| `calc-imperium.mjs`, `calc-hardlove.mjs`, `calc-photonic.mjs`, `calc-eternal.mjs` | Each hack's actual profile controls and persistence. |

Calc checks skip guides without `cfg.calc`, except `calc-hidden`. Missing data or trainer roles may skip individual
cases. The shared harness defaults to 260 × 316 in normal and `dvkb`; each scenario declares extra sizes/modes.
Layout includes 260 × 400, 537 × 424, 832 × 424, 480 × 392 and 832 × 316 diagnostics.
Harness runs print PASS/FAIL and a matrix, write `.tmp/calc-checks/<scenario>-<guide>.json`, and save
`<scenario>-<guide>-<check>-<size>-<mode>-FAIL.png` on failure. Page errors and horizontal overflow fail a case
unless it explicitly opts out of the fit assertion. `calc-smoke.mjs` uses its own smoke harness.
A failing assertion is a finding, not a reason to weaken the check. Verification procedure: `.agents/skills/verify/SKILL.md`.
