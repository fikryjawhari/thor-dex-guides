# Spec scenarios

Each `*.mjs` is an executable scenario: `node tools/scenarios/<name>.mjs dist/<hack>.html`.
`gate.py check --template` runs every entry on each selected guide, serially. Keep helpers outside this folder
or use another extension. Existing mockup checks stay in `tools/mockup/`; the gate calls them directly.

Use `startBrowser` from `../browser.mjs`, an isolated browser context, and `try/finally` with `close()`.
Seed localStorage before navigation (only once, not on every reload). Set the viewer size and `dvkb`, open a
route, wait for the rendered control, act through the DOM, then assert both visible and saved state. Capture
page exceptions; use bounded waits and fail with a descriptive assertion/nonzero exit. No fixed personal paths.
Include 260 × 316, keyboard mode, empty data and older saved state where the spec needs them.

`tracker-reload.mjs` seeds an existing failed tracker entry, clicks its Clear button, then reloads and checks
the persisted entry and control at 260 × 316 in `dvkb`. The seed is not re-applied after reload.

## Calc checks

`calc-*.mjs` are the damage calc's spec checks (`plans/damage-calc.md` → Checks 1–26). They share `../calc_check_lib.mjs`
(the harness: guide copies, page per case, taps, number boxes, the real file input, the matrix); keep helpers there, not
here, since the gate runs every `*.mjs` in this folder as a scenario.

| File | Checks | Notes |
| --- | --- | --- |
| `calc-layout.mjs` | 1, 17, 18, 18b, 18c, 19, 20, 20b, 20c, 22 | 18c is a diagnostic at 260 × 400, where the stops separate. |
| `calc-controls.mjs` | 2–10, 11, 13, 16, 23 | |
| `calc-import.mjs` | 12, 14, 15 | Fixtures in `fixtures/calc/`. |
| `calc-persist.mjs` | 26, 26b | 26b drives the Thor frame (`thor-frame/build.py`) through its `contentWindow`. |
| `calc-entry.mjs` | 21 | |
| `calc-field.mjs` | 25 | Copies the profile with a weather added and a toggle removed. |
| `calc-hidden.mjs` | 24 | Runs as built: without `cfg.calc` the feature must be absent; with it, present. |

Every calc check skips on a guide without `cfg.calc` (prints `SKIP`, exits 0), except `calc-hidden`. Each runs at 260 × 316
in normal and `dvkb`; checks 1 and 20 also at the wide sizes. Failures keep their assertion: a failing check is a finding
to report, not a reason to loosen the assertion or to edit the page. Outputs: `.tmp/calc-checks/<scenario>.json`, `…-FAIL.png`.
