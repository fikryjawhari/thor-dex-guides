# Mockup tools

How the walkthrough split UI was mocked up and checked (plans/split-ui.md). Reuse them for the next page. They need
Chrome or Edge, and Node 22+.

- `snap.mjs <guide.html> <out.json>`: loads a built guide at `#/walk` in headless Chrome, opens every split and saves
  `#app`'s HTML (sprites turned into data URIs) as a JSON string. For another page, change the route and what it opens.
- `gen.py <repo> <dir>`: builds `walkthrough-mockup.html` in `<dir>` from `outer.html` (the page around the frame:
  guide, viewport size, collapse style, theme), `inner.js` and `inner.css` (the mockup layer over the snapshot) and the
  snapshots `<dir>/ei.json`, `<dir>/hg.json`, plus `template/dex.css` and the rail from `template/shell.html`. The
  frame is an `iframe srcdoc`, so the guide's own CSS and media queries apply at the chosen size. Publish the result
  as an artifact.
- `inner.js` / `inner.css` are the state of the mockup when the user signed it off (mockup link in
  plans/split-ui.md). They rebuild the snapshot's DOM at runtime; the template builds the same thing directly.
- `walkcheck.mjs <guide.html> <shot-prefix> [kb]`: behaviour test of the built walkthrough at 260 × 316 (`kb` = with
  `dvkb` set). Prints each check and any page errors, and saves a screenshot.

Work in a scratch folder: copy these files there, put the snapshots next to them, run `gen.py` with the repo path.
To check motion, sample `getBoundingClientRect()` once per animation frame (this is how the overshoot in the rejected
collapse animations was found).
