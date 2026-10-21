# Trainer cards and previews: more room at 260 × 316 (decide session, started 2026-10-21)

Branch `worktree-trainer-cards` (from `main` 7bd17f1), worktree `.claude/worktrees/trainer-cards`. Template change when
built (every guide), so it waits for / is done in one session on `template/`.

## The problem (measured on the Photonic Sun build at 260 × 316)
- Pinned stack on the Trainers page: search bar + Show row + three-line place header ≈ 170 px of 316, leaving ~145 px.
- One opened Pokémon is ~181 px tall (173 px wide), so none fits whole. Its trainer card also repeats the row above it
  (name, place, tags: ~70 px).
- Closed rows: six 32 px sprites need 202 px, a row has ~190, so it wraps 5 + 1.

## Mockup
`python -I tools/mockup/trainer-cards/build.py . <out.html>` (needs `python assemble.py photonic-sun` first), then
`python -I tools/preview.py <out.html> trainer-cards.html`. It is the real build with `patch.css` / `patch.js` over it
(`monCard` replaced per design; DOM upgrades for the strip and header changes) in the Thor frame with a panel.
`shot.mjs` takes headless screenshots (`OPT='{"cd":"C"}'`, `@file.js` to script the page).

Options in the panel:
- **Card** (same facts everywhere): Now · A boxed compact (30 px sprite, moves two across, ~100–115 px per Pokémon) ·
  B sprite strip with Lv, one Pokémon shown at a time (narrow only; wide shows all) · C one two-line row per Pokémon
  (name, Lv · Spe, 42 px), tap for the rest, "Open all" · D flat list, no boxes, moves run on in a line (~95–120 px).
- **Preview rows:** sprite size now (32) / 28 / 24 / 20, at most six to a line, beside the name when it fits, else
  under it; tighter padding; row name 14 px.
- **Reading room:** card without the repeated name / place / tags (starter condition kept); the row's sprite strip hides
  while its card is open; place header on one line (name cut with …, count tag and cap tag dropped, cap stays in the cap
  line; `teams n/N` button smaller); Show row scrolls away instead of pinning.

## Decided (the user, 2026-10-21, after round 1)
- **B (strip + one Pokémon at a time) is the narrow-window card** (below 430 px). Past it, boxed compact (A), **three
  across at most** (was "as many as fit").
- Preview rows: 24 px sprites. Card starts at the team (no repeated name / place / tags). IVs removed everywhere; EVs stay
  where the game has them (the user may patch EVs out of Eternal X, Photonic Sun and minimal-grinding hacks later).
- Show row stays pinned but shorter. **Search moves to a rail button, on top**; the other six icons get less height so
  all seven (and the two jump buttons) show at 260 × 316. The search bar goes from the Trainers page (pinned stack
  now: Show row + place header only).
- Place header: one line, name truncated, and the button reads **`n/N | cap`** (open cards / trainers | level cap), no
  words.

## Round 2 mockup
Same page. Open: the in-between size (430–500 px, e.g. the 480 × 392 first-open window): two Pokémon across, one row
visible. Chip "B strip below 500 px" tries extending the strip to it. At 537 × 424 it is two across (the 150 px minimum
doesn't fit three), 4 Pokémon visible; at 832 × 424 all six, three across.

## Open
- The 430–500 window: strip, or boxed two across?
- Whether 537 should be three across (needs ~140 px per Pokémon).
- Does the rail search button open the same full-window search; remove the search box on other pages too?
