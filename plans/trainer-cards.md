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

## Decided
Nothing yet. Defaults in the mockup are my proposal: D, 28 px, one-line place header, card without repeated header,
Show row pinned.

## Open
- Which card design (or a mix: C at narrow, D/A wide?).
- Sprite size for the rows; whether the sprites should sit beside the name when there's room (rows then differ in
  height) or always under it.
- Pinned stack: one-line place header yes/no; Show row pinned or not.
- Anything else the user wants on the cards (what facts matter most; what could go behind a tap).
