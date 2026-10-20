# Photonic Sun Walkthrough tab (spec)

Decide session 2026-10-20 (Sonnet), tab branch `worktree-ps-walk` off `worktree-photonic-sun-changes`. Feedback:
`plans/photonic-sun-pass2.md` → Walkthrough. **No UI change** (a review mockup was built anyway: https://claude.ai/artifact/F85Avd46D9NZEgKLW7mc35, source `tools/mockup/ps-walk/`; rebuild `python -I tools/mockup/ps-walk/build.py <out.html>`): the three notes are data rules in
`hacks/photonic-sun/extract/walk.py`. Template untouched, so EI and HG are unaffected. Build: a Haiku/Sonnet subagent
or the main chat, it's ~15 lines.

## What the user asked, and where it stands

| Feedback | Finding | Action |
|---|---|---|
| Remove the empty headings | 21 of the 136 stops have no encounters, items, trainers, checklist steps or note, so they render as a bare yellow header (e.g. "Introduction") | Drop them (below) |
| Starter on Route 1 (Ultra Sun), not Iki Town | Already true: the Locations "Starter" area is joined to the part 1 stop "Route 1 (Hau'oli Outskirts)" by `ALIAS['Starter'] = ['Route 1']`, and its picker shows in that stop's Encounters. Part 1's Iki Town stops hold items only. | **No change.** Check it still holds after the drop (check 2) |
| Drop empty story stops (back to Iki Town after Mahalo Trail, then home) | Same 21 stops | Same rule |

## The rule

A stop is dropped when, after items are placed, **all** hold: no area that renders (`s.a` has none, or only areas
with `ns` and no encounters), `s.it` empty, `s.tr` empty, `s.s` empty, `s.note` empty. "On the way" stops (`x`) always
have an area, so they stay. Done in `walk.py` `build()`, **after the item placement loop and before the splits are
built**, so a stop that only exists to receive items isn't dropped, and the split titles ("N. first – last") come
from the stops that are left.

The 21 now (split: stops): 1: Introduction, Iki Town (second), Home · 5: Farthest Hollow, Big Wave Beach · 8: Heahea
City · 9: Seaward Cave, Kala'e Bay (revisits) · 10: Fossil Restoration Center · 11: Dimensional Research Lab · 12:
Hau'oli City (Police Station & Shopping Mall) · 22: Poni Beach · 25: Megalo Tower · 29: Guardians of Alola, Ruins of
Life, Ruins of Hope · 30: Ancient Poni Path · 32: Altar of the Sunne, Lake of the Sunne · 34: Professor Kukui's Lab,
Aether Paradise.

Edge cases:
- No split loses all its stops (the smallest, part 29, keeps Ruins of Abundance).
- Split titles change by themselves: "1. Introduction – Home" → "1. Route 1 (Hau'oli Outskirts) – Mahalo Trail", "29.
  Guardians of Alola – Ruins of Hope" → "29. Ruins of Abundance", "32. Altar of the Sunne – Lake of the Sunne" → "32.
  Ultra Warp Ride", "34. Professor Kukui's Lab – Eevee Users" → "34. Iki Town – Eevee Users". The split headers' "N stops"
  counts drop with them.
- Locations pages' walkthrough visit counts (`visits()`, "Seaward Cave ×2") follow the stops that are left; the
  dropped Seaward Cave / Kala'e Bay revisits are empty, so those places show one visit. Expected, not a bug.
- Saved state: `pswalk` stores closed stops and open sections by `split.stop` index (`WO.x`, `WO.s`), and the stop
  indexes shift after a drop. Key names stay; the worst case is a stop that was closed opens again or the other way
  round. No migration (the Trainers rebuild already re-keys trainers; open splits are by split index, which doesn't
  move). Mention it in notes.md.
- Starter picker: with a starter chosen, the rival's Route 1 teams for the other starters are hidden at render time.
  No stop empties because of that (each rival fight keeps the chosen starter's team), so nothing to do at render time.
- Don't touch what the stops hold (items listed twice, wild-held items on Route 1): that's the Items tab.

## Not done (kept on purpose)

Repeated visits to the same place (Route 1 ×2, Route 15 ×3, Hau'oli City ×4...) stay as separate stops: the
walkthrough is route order, and each visit holds different trainers or items. Merge them only if the user asks.

## Build steps

1. `walk.py`: add the drop after the items loop (a `keep(s)` helper with the rule above). `report('walkthrough: empty
   stops dropped', n, ':', names)` so `report.txt` lists them.
2. `notes.md` Walkthrough paragraph: one sentence for the rule, one for the saved-state shift. PROGRESS.md / the pass 2
   plan: tick Walkthrough.
3. `python -I hacks/photonic-sun/extract/build.py` (needs the sources, see the pass 2 plan's python note), then
   `python assemble.py photonic-sun`. Rebuild after the Trainers build merges: trainer keys are positional and `s.tr`
   comes from trainers.py, so the stop contents (not the rule) can change.

## Checks (audit)

1. `report.txt`: 21 dropped (more only if the Trainers build moved trainers into empty stops; fewer if it filled
   one), 115 stops left, 35 splits, items placed unchanged (verify the count).
2. At 260 × 316, normal and `dvkb`: open part 1: headings are Route 1 (Hau'oli Outskirts), Route 1, Iki Town, Mahalo
   Trail; the Starter box with its picker is in the first. No stop without a section. `tools/mockup/walkcheck.mjs`:
   no page errors.
3. Every stop on the Walkthrough page has at least one section (script: each `details.stopd` has a `details.sec`).
4. `domcompare` EI and HG against `main`, normal and `--kb`: identical (template not touched; run it anyway). Photonic
   Sun: only `#/walk` and Locations pages with a walk-visit link differ.
