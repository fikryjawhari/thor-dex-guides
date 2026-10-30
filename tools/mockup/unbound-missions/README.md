# Unbound mission collapse — decide mockup

Draft for unit 7a / D4, from `72edc56`; not the template implementation or an approved design.
Built and merged: decisions in `template/README.md` (walkthrough missions); the spec is in git history
(`plans/unbound-missions.md`). No template, extract or guide data edits.

## Phone review

https://windows-pc.tail1846b8.ts.net/preview/unbound-missions.html

The inner page is `index.html`; `panel.html` is an external frame options fragment, not another page.
Compare A/B title treatments (quiet divider recommended) and A/B completion behaviours (stay open recommended).
Use “2 / 11, closed” for a partial quest, “Only missions left” for Next, and “All ticked” for completion.
Search “underwater” for a deep row, “Power Bracer” for a mission metadata hit, or “Ditto” for the short quest.
Frame buttons select the real viewport, dvkb, light/dark and reload. The 44px rail has Search, Walk, Top and Bottom;
other routes are intentionally not reproduced. Mockup saves use `unbound-missions-mock-v1`, never a real guide key.

## Rebuild and publish

From the repo root (create `.tmp/unbound-missions/` first if absent):

```powershell
python -I tools/mockup/thor-frame/build.py tools/mockup/unbound-missions/index.html .tmp/unbound-missions/framed.html --title "Unbound missions" --panel tools/mockup/unbound-missions/panel.html --routes none
python -I tools/preview.py .tmp/unbound-missions/framed.html unbound-missions.html
```

`preview.py` writes the shared phone-preview directory in the main checkout; it may require permission outside
this worktree. Same preview name replaces the page; reload it on the phone. Do not commit the frame or preview.

## Checks

With **no other browser sweep running** on this machine:

```powershell
node tools/mockup/unbound-missions/check.mjs
```

Uses only the existing `tools/browser.mjs`; no browser dependency added. A fresh browser profile isolates saves.
Checks both title styles at all five viewer sizes in normal/dvkb; 44px row targets; Next entering/leaving missions,
only-mission remainder and all-done states; both completion behaviours; deep-step search/flash/landing; metadata
deduplication; no-results/clear; reload persistence; light theme and 130% text sizing. The script types with actual
dvkb button handlers. Screenshots and a summary go to `.tmp/unbound-missions/`, never tracked.

Verified 2026-10-29 with the command above after the other session's gate finished:

| Viewport (CSS px) | Normal | dvkb |
| --- | --- | --- |
| 260 × 316 | PASS | PASS |
| 260 × 350 | PASS | PASS |
| 480 × 392 | PASS | PASS |
| 537 × 424 | PASS | PASS |
| 832 × 424 | PASS | PASS |

Both title styles and both final-tick behaviours passed in every configuration. Fully opened content and search
had no horizontal overflow; every checklist/title/collapse row was at least 44px high; the minimum-size keyboard
had 34px-high keys. Next entering/leaving missions, missions-only remainder, repeated targeting without ticking,
deep-step search opening both levels and flashing the row, metadata deduplication, reloads and all-done passed.
Light theme with every app element's font scaled to 130% also fit 260px. Runtime exceptions/console errors: **0**.
Inline JS syntax passed, with zero external runtime assets. No production gate result is claimed by this mockup.

Evidence: `.tmp/unbound-missions/checks.txt` plus `260x316-normal-closed.png`, `260x316-dvkb-search.png`,
`260x316-{normal,dvkb}-landing.png`, `480x392-{normal,dvkb}-landing.png`, `260x316-dvkb-closed.png`, and
`260x316-light-zoom.png`. Visually inspected the normal closed mission, minimum dvkb search keyboard,
480px normal landing and light/130% text screenshots: no clipping or stacked-header obstruction.

## Sample sources and limits

Read-only local wiki dump `hacks/unbound/.src/unboundwiki/unboundwiki.json`: mission slugs `mission-007`,
`mission-003`, `mission-009`; walkthrough parts 1/2, 27, 31. Three stops, 16 mission rows and six ordinary rows.
No raw source text or source files copied into the repository. The long mission lists nine tablet puzzles but
does not attempt their full final walkthrough instructions. The real extraction must verify those separately.

The prototype models nesting, counts, checkbox state and mission-keyed reloads, not the guide's production
storage migration, all-category search, route history or scroll bridge. Done/Enter takes the first mockup hit;
7b retains the real guide's existing raw-query action. Bottom collapse buttons are always present in the cheap
sample; 7b must use existing conditional collapse bars. Phone/Thor approval is still needed before 7b.
