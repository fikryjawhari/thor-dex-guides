# Trainers page: Show switch and place "teams" toggle (build spec)

Decided 2026-10-20 with the user (round 2 of the Trainers tab, `plans/photonic-sun-pass2.md`). Template change, so
every guide's Trainers page gets it. Build exactly this; anything not covered here is a question for the user, not a
choice for the builder.

Reference mockup (behaviour, not code to paste): `tools/mockup/ps-trainers/show.html`, published at
https://claude.ai/artifact/WFR57CSdHTHwzNpe3G7YG6 with options set to the user's picks. Its `live`, `setShow`,
`grab` / `restore` functions are the logic to port. **Its anchor rule is not the final one** (see View anchoring).

Work in the worktree `.claude/worktrees/photonic-sun-changes`, branch `worktree-photonic-sun-changes`.

## What goes away

- The three Expand all / Collapse all bars on the Trainers page: the island bar (`segBar('tr-sp')` in `trGroup`) and
  the per-place bar (`segBar('tr-pl')`). The page-top bar stays but is relabelled (below).
- Nothing else on other pages: Locations, Items, Walkthrough keep their `segBar`s for now.

## Page top

- The `segBar('tr-all all')` bar reads **Open all islands · Close all** (Trainers page only; `segBar` takes the
  labels or a variant). Behaviour as now: opens or closes every island (box).

## Island (box) Show switch

A row **pinned under the pinned island header** (`details.split>summary` is sticky at `--hh`; the row sticks at
`--hh + island header height`, the same way `--sh` is measured now), first thing in the box body:

`Show  [Places | Trainers | Teams]  mixed`

- Pill-shaped 3-segment control, full width at 260 px; "mixed" (small, muted) shows only in the mixed state.
- **State is read from the page, not stored** (no new localStorage key; places and cards already persist in
  `LS.tr` p / t). Over the box's places that have a header (`s.h`):
  - no place open → **Places**, solid.
  - every card in the open places closed → **Trainers**; every card open → **Teams**.
  - anything else → nothing lit, "mixed".
  - Trainers / Teams are **outlined** (2 px accent ring, accent text) when some places are closed, **solid** (accent
    fill) when every place is open.
- **Places**: closes every place. Cards keep their state (stay as left).
- **Trainers / Teams, not lit (or mixed)**: sets the cards of the **open places only** (Trainers: all closed, Teams:
  all open); closed places are left closed and untouched. If no place is open, opens every place first.
- **Trainers / Teams, already lit (outlined)**: the press again opens **every place** and sets all their cards (closed
  places too) to that view. Then it's solid. Pressing a solid one does nothing.
- Places opened by hand later show their cards as they were left (no "follow the switch").
- Rival teams hidden by the starter filter (`rivalHidden`) don't count and aren't touched.

## Place "teams" toggle

In each place header (`details.stopd>summary`), right-aligned after the count / cap tags: a small button
**`teams n/N`** (n = open cards, N = shown trainers in the place).

- Looks: n = 0 grey (as `.tag`), 0 < n < N accent outline + accent text, n = N accent fill.
- Press: **fill first**: n < N → open every card; n = N → close every card. It also opens the place if it's closed.
- The button must not toggle the place: stop the click from reaching the `<summary>` (preventDefault +
  stopPropagation), in normal and `dvkb` mode (check `references/viewer-ui.md` in the `rom-hack-offline-dex` skill
  for how keyboard mode focuses and presses buttons).
- Shown on every place with a header, one-trainer places included (1/1).
- The place header stays pinned under the island header + Show row (as now: `--sh`), so the toggle is reachable in
  long places.

## View anchoring (all three controls)

Opening or closing cards must not move what the user is reading.

- **Anchor = the first trainer-row separator visible below the pinned headers.** The rows' top edges (the line
  between a row and the one above) are fixed relative to the row's name whether its card is open or not. So: the
  first `details.trd` whose top edge is at or below the bottom of the pinned stack (island header + Show row +
  pinned place header). Example (user's screenshot): Route 1 pinned, Lass Audrey's separator visible just under it,
  Youngster Jimmy below → anchor on Audrey, not Jimmy.
- If no separator is visible (one long open card fills the screen), anchor on the row that spans the pinned edge.
- If the anchor row disappears (its place closed by Places), use its place header; then its island header.
- Record the anchor's top before the change, re-render, scroll by the difference. If its header would end up under
  the pinned stack, put it just below instead. Brief flash on the anchor row (existing `flash()`).
- Replace the current "keep the pressed button still" behaviour for these controls (`segAll` + `hold`); keep
  `noAnchor()` so the browser's own scroll anchoring doesn't fight it.

## Rendering notes

- Boxes build lazily (`trGroup` on first open) and cards build on first open (`bindTrd`): Teams on a box must build
  every card it opens. Re-render or update in place, but keep `LS.tr` (`TOPEN.p`, `TOPEN.t`) in sync through the same
  paths `TOG.trainers` uses.
- Update the switch and the place toggles whenever a card or place is opened or closed by hand (toggle events).
- Boxes whose sections have no place header (`!s.h`, EI / HG boxes may have these: trainers sit directly in the
  box): no place toggles; the switch hides **Places** and shows Trainers / Teams over those rows. Check what EI and
  HG actually have before deciding anything else; ask the user if it's not this simple.
- Search results (`listTrainers` with a query) and walkthrough stops (`walkTrainers`) are unchanged.
- The endbar ("Collapse <box>") stays.

## Already done (round 2)

- Cap line: "Level cap 12 · Captain Ilima, Hau'oli City · 14 battles" (no forced count). Committed.

## Checks

1. `python assemble.py` (all guides).
2. `node tools/domcompare.mjs` main build vs new for EI and HG, normal and `--kb`: only `#/trainers` should differ.
3. Photonic Sun at 260 × 316 and 538 × 425, normal and `dvkb`: no page errors, nothing wider than the window, the
   pinned stack (island header, Show row, place header) flush with no gaps. `tools/mockup/ps-trainers/check.mjs` is
   a starting point.
4. Scenario run (headless, scripted): the user's examples, with the scroll position checked before and after:
   - Melemele: Route 1 closed with all teams open, Route 2 open with teams, the rest Trainers → switch shows mixed;
     Trainers → open places all closed cards, Route 1 still closed, switch outlined Trainers; Trainers again →
     Route 1 opens with cards closed, switch solid.
   - Route 4 (5 trainers), Sightseer Scotty open, scrolled to her: place toggle → 5/5, Scotty doesn't move; again →
     0/5, Scotty's row stays under the pinned header (no jump down to the next trainer).
5. Republish the phone preview (`dist/photonic-sun.html` to https://claude.ai/artifact/DjXAVb4Eb6DB4PEYQ43dug) for
   the user's test on the phone and the Thor.
6. Notes: PROGRESS.md / pass 2 plan status; `split-ui.md` if it describes the Trainers bars.
