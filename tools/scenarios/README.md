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
