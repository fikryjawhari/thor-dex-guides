# Mockup and behaviour checks

Need Chrome or Edge (or `CHROME=<exe>`) and Node 22+.

The three checks below use `../browser.mjs` for browser discovery, CDP transport and profile cleanup. Their
scenario code, waits, exception reporting, hidden scrollbars and 260 × 316 viewport at scale factor 2 stay local.
Run browser sweeps one at a time so CPU contention does not change layout timing.

- `thor-frame/build.py <page.html> <out.html> [--title] [--sub] [--panel]`: wraps a built guide or a mockup's inner page
  in a Thor-sized screen (the viewer sizes, fit to screen, `dvkb`, tabs, reload / clear saved state, error and width
  readout; pinned on a phone). Put the output on the phone preview (`tools/preview.py`). Mockups write only the inner
  page (a small standalone HTML with data sampled from `data.json`) and an optional `--panel` of options, never a frame.
- `walkcheck.mjs <guide.html> <shot-prefix> [kb]`: the walkthrough at 260 × 316 (`kb` = `dvkb` set): taps hold the
  header, bars, jumps, Next step, starter, state after a reload, other routes; prints each check and page errors and
  saves a screenshot.
- `pagecheck.mjs <guide.html> <shot-prefix> [kb]`: the same for Locations, Trainers and Items (boxes, places, sticky
  headers, bars, jumps, state after a reload, place links).
- `jumpcheck.mjs <guide.html> [kb] [N]`: N (default 40) of each full-window search jump (trainer, walkthrough trainer,
  stop, item, place) from another page with a search set; lists any that don't end open and on screen under the
  pinned headers.

To check motion, sample `getBoundingClientRect()` once per animation frame (how the overshoot in the rejected
collapse animations was found). Finished mockups are not kept: the decision goes in `template/README.md` or the
hack's notes, and git history has the mockup.
