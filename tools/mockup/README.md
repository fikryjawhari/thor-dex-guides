# Mockup and behaviour checks

Need Chrome or Edge (or `CHROME=<exe>`) and Node 22+.

The four checks below use `../browser.mjs` for browser discovery, CDP transport and profile cleanup. Their
scenario code, waits, exception reporting, hidden scrollbars and 260 × 316 viewport at scale factor 2 stay local.
Run browser sweeps one at a time so CPU contention does not change layout timing.

- `thor-frame/build.py <page.html> <out.html> [--title] [--sub] [--panel]`: wraps a built guide or a mockup's inner page
  in a Thor-sized screen (the viewer sizes, fit to screen, `dvkb`, tabs, reload / clear saved state, error and width
  readout; pinned on a phone). Put the output on the phone preview (`tools/preview.py`). Mockups write only the inner
  page (a small standalone HTML with data sampled from `data.json`) and an optional `--panel` of options, never a frame.
  `thor-frame/calc-presets.html` is the panel for a built calc guide: live-engine test sets (States, Download, Sword,
  Toxic...; All loads every preset as the team).
- `walkcheck.mjs <guide.html> <shot-prefix> [kb]`: the walkthrough at 260 × 316 (`kb` = `dvkb` set): taps hold the
  header, bars, jumps, Next step, starter, state after a reload, other routes; prints each check and page errors and
  saves a screenshot.
- `pagecheck.mjs <guide.html> <shot-prefix> [kb]`: the same for Locations, Trainers and Items (boxes, places, sticky
  headers, bars, jumps, state after a reload, place links).
- `jumpcheck.mjs <guide.html> [kb] [N]`: N (default 40) of each full-window search jump (trainer, walkthrough trainer,
  stop, item, place) from another page with a search set; lists any that don't end open and on screen under the
  pinned headers.

- `zoomcheck.mjs <guide.html> [kb]`: text zoom vs collapse bars at 260 × 316 and 480 × 392. Headless Chrome has no
  WebView textZoom, so it scales every px font size in the page's rules (no resize fires, as in the viewer) and compares
  each bar a few frames later with what `bars()` decides after a forced resize; exits 1 on any stale bar.

To check motion, sample `getBoundingClientRect()` once per animation frame (how the overshoot in the rejected
collapse animations was found). Finished mockups are not kept: the decision goes in `template/README.md` or the
hack's notes, and git history has the mockup.
