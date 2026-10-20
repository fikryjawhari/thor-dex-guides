# Photonic Sun Walkthrough tab (spec, final)

Decide session 2026-10-20 (Sonnet), tab branch `worktree-ps-walk` off `worktree-photonic-sun-changes`. Feedback:
`plans/photonic-sun-pass2.md` → Walkthrough. **Template UI change, every guide.** Nothing is built yet.

## What was decided

1. **Empty stops stay** (they're game direction: "back to Iki Town", "Home", "Megalo Tower") but get their own look.
   Today a stop with nothing in it is a bare yellow-barred header with a ▾ that opens nothing.
2. **The look: the stop header's box, grey, no arrow, not a `<details>`.** Bold 14px text in `var(--mut)`, a 3px
   solid bar in `var(--line)` (the faint grey), same bar position, padding and spacing as a stop header
   (`margin:10px 0; padding:4px 0 4px 10px`). Picked from Rail row / Divider / Route chips / Muted header, then bar
   styles (faint solid, grey solid, dotted, dashed, hollow): **faint solid**, 14px, bold. The Rail row was dropped
   because its marker didn't line up with the yellow bars.
3. **Starter on Route 1: no change.** The Starter area already joins the part 1 stop "Route 1 (Hau'oli Outskirts)"
   (`ALIAS['Starter']`), the picker is inside its Encounters.
4. Nothing is dropped or renamed: split titles, "N stops" counts and saved state (`pswalk` positions) stay as they are.

Mockup (real Photonic Sun build in the Thor frame, bar choices on a switch): https://claude.ai/artifact/5iPtwwnsGaijwvkydeu5MA ;
source `tools/mockup/ps-walk/` (`patch.css`, `patch.js`, `panel.html`, `build.py`). The mockup converts empty stops in the
DOM after render; the template builds the same thing in `walkStop`. Superseded mockup (compare and checklist):
https://claude.ai/artifact/F85Avd46D9NZEgKLW7mc35.

## Build (template, one session on the template at a time)

`template/dex.js`, `walkStop(s,si,ti,cf,shown)`: after `ss`, `areas`, `its`, `ts` are computed, **empty** =
`!ss.length && !areas.length && !its.length && !ts.length && !s.note`. Then return, instead of the `<details>`:

```
<div class="wsign" data-k="${k}">${esc(s.n)}</div>
```

(no `endbar`, no summary, no `WO.x` entry). "On the way" stops (`s.x`) always have an area, so they are never empty.
The test uses the filtered lists, so a stop that is empty only because of the starter filter becomes a sign too (none
do today: each rival fight keeps the chosen starter's team).

`template/dex.css`:

```
.wsign{margin:10px 0;padding:4px 0 4px 10px;border-left:3px solid var(--line);font-weight:700;font-size:14px;line-height:1.25;color:var(--mut)}
```

Check these places for `details.stopd` assumptions and give the sign the same behaviour or skip it deliberately:
- `jumpStop` (rail / search "Walk" jump) calls `land(app.querySelector('details.stopd[data-k=...]>summary'))`: fall back
  to `.wsign[data-k=...]`. `land()` handles an element target.
- `bindWalk` toggle handler, the collapse bars and Expand / Collapse all (`.stopd`, `.endbar.st`): signs have none,
  confirm nothing counts or expects them.
- `stopText` and the search hits list: unchanged; a search for "Megalo" still lists the sign.
- Both sticky stacks (`details.stopd[open]>summary`): the sign isn't sticky.

Emerald Imperium and HeartGold have empty stops too; they get the same look (the template is shared). Photonic Sun's 21
today: part 1 Introduction, Iki Town (second), Home; 5 Farthest Hollow, Big Wave Beach; 8 Heahea City; 9 Seaward
Cave, Kala'e Bay; 10 Fossil Restoration Center; 11 Dimensional Research Lab; 12 Hau'oli City (Police Station &
Shopping Mall); 22 Poni Beach; 25 Megalo Tower; 29 Guardians of Alola, Ruins of Life, Ruins of Hope; 30 Ancient Poni
Path; 32 Altar of the Sunne, Lake of the Sunne; 34 Professor Kukui's Lab, Aether Paradise.

## Checks (audit)

1. `python assemble.py` (all guides), then `domcompare` EI, HG and Photonic Sun against `main`, normal and `--kb`:
   only `#/walk` differs (plus anything the other tabs on the branch already changed).
2. At 260 × 316, normal and `dvkb`: parts 1, 9, 29, 32, 34 show the sign, aligned with the yellow bars, no ▾, no page
   errors, width 260 (`tools/mockup/walkcheck.mjs`).
3. Script over the DOM: every `details.stopd` has at least one `details.sec`; every other stop row is a `.wsign`.
4. Search "Megalo" finds the sign; the Locations "Walk" button for a place whose stop is a sign scrolls to it.
5. An older bug seen in the mockup (part 9): a hidden "Collapse X" bar's text peeks out under the last open stop. Check
   in the real build and note it if it's real; not part of this change.
