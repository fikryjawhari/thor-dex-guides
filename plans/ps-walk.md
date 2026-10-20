# Photonic Sun Walkthrough tab (spec, draft: waiting for the design pick)

Decide session 2026-10-20 (Sonnet), tab branch `worktree-ps-walk` off `worktree-photonic-sun-changes`. Feedback:
`plans/photonic-sun-pass2.md` → Walkthrough.

**Decision (user, 2026-10-20): empty stops are kept, not dropped.** They're useful game direction ("back to Iki Town",
"Home", "Megalo Tower"); the walkthrough just has no design for a stop with nothing in it, so today it shows as a
bare, yellow-barred header with a ▾ that opens nothing. This is a **template UI change** (every guide): a stop with
nothing to show gets its own look, no arrow, not a `<details>`.

Mockup (the real build in the Thor frame, options on a switch, jump chips to parts 1, 9, 29, 32, 34):
https://claude.ai/artifact/5iPtwwnsGaijwvkydeu5MA, source `tools/mockup/ps-walk/` (`patch.css`, `patch.js`, `panel.html`;
rebuild `python assemble.py photonic-sun`, then `python -I tools/mockup/ps-walk/build.py . <out.html>`). The mockup
converts empty stops in the DOM after render; the template builds the same thing in `walkStop`.

## Options (user, round 2: B and C out; A and D stay, with a text size slider)

- **A Rail row:** muted line on a dotted rail, regular weight. Was 13px, too small next to the 16px bold headers.
- **D Muted header:** header weight, grey bar and text, no arrow. "Fine as it is" (15px).
- The mockup has one slider (12–18px, step 0.5, default 15) that sets both, so the user picks the size. Final size to
  be recorded here once chosen.

## Rule and behaviour (all options)

- **Empty** = no checklist steps, no encounter area that renders, no items (after the starter filter), no trainers
  (after the rival filter) and no note. Same test as `walkStop`'s section list: nothing in `ss`, `areas`, `its`, `ts`,
  `s.note`. On-the-way (`x`) stops have an area, so they are never empty.
- Not a `<details>`: no ▾ / ▸, no open state, no `WO.x` entry, no end bar ("Collapse X"), not sticky.
- It keeps `data-k="<split>.<stop>"` so `jumpStop` / search "Walk" can land on it (`land()` needs a target; give it the
  sign row itself). Search still matches its name (`stopText` unchanged).
- Splits keep their titles and "N stops" counts; nothing is dropped, so saved state positions don't move.
- State changes live: a stop is empty only because of what's filtered (starter picker), so decide at render time.
  Checked in the data: with a starter chosen no stop empties extra (each rival fight keeps the chosen team).
- 21 stops are empty today (listed in the mockup's part jumps and by `walk.py`): part 1 Introduction, Iki Town,
  Home; 5 Farthest Hollow, Big Wave Beach; 8 Heahea City; 9 Seaward Cave, Kala'e Bay; 10 Fossil Restoration Center;
  11 Dimensional Research Lab; 12 Hau'oli City (Police Station & Shopping Mall); 22 Poni Beach; 25 Megalo Tower;
  29 Guardians of Alola, Ruins of Life, Ruins of Hope; 30 Ancient Poni Path; 32 Altar of the Sunne, Lake of the Sunne;
  34 Professor Kukui's Lab, Aether Paradise. Emerald Imperium and HeartGold have empty stops too; the same look applies.
- Starter: already on Route 1 (the Starter area joins the part 1 stop "Route 1 (Hau'oli Outskirts)", picker inside its
  Encounters). No change.

## Open questions for the pick

1. A or D, and the text size?
2. Should the row say what kind of stop it is ("story", "on the way") or just show the name?
3. Stay one row each (assumed now that C is out).
4. Do they get a tap action? (Today none; a tap could open the place's Locations page if it has one.)

## Build (after the pick)

Template (`template/dex.js` `walkStop`, `template/dex.css`), one session on the template at a time. Then `assemble.py`
for every guide and `domcompare` EI, HG and Photonic Sun against `main` (normal and `--kb`): only `#/walk` differs.

## Checks (audit)

1. At 260 × 316, normal and `dvkb`: parts 1, 9, 29, 32, 34 show the chosen design, no ▾, no page errors, width 260.
2. Every `details.stopd` has at least one section; every other stop row is the sign (script over the DOM).
3. Search "Megalo" finds the sign; the Locations "Walk" button for a place whose stop is empty scrolls to it.
4. Expand all / Collapse all and the end bars don't leave stray text under a sign (a hidden "Collapse X" bar showed under
   the last stop in the mockup's part 9: an older bug, check it in the real build).
