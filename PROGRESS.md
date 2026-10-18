# Progress

Guides for Dex Viewer, split out of the app repo (`thor-dex-viewer`, private) on 2026-10-19. That repo's
`docs/PROGRESS.md` keeps the app's history; this file holds everything on the guide side. Older guide history before
the split is in that repo's git log.

## Current status

- **Phase 1 of the split (this repo, the shared template): built 2026-10-19, not yet on GitHub.** See "Split results".
- Guides: Emerald Imperium (1.3.1, GBA), Hardlove Gold (0.8.3, NDS). The other hacks in `hacks/` have sources
  compiled (`SOURCES.md`, re-fetch into `.src/`) but no guide yet.

## What's left, in order

1. **Go live (the user + one short step).** Create the empty public repo `fikryjawhari/thor-dex-guides` on github.com
   (no README/licence, so the first push is clean), then Settings → Pages → Source: **GitHub Actions**. Then push
   (`git remote add origin https://github.com/fikryjawhari/thor-dex-guides.git; git push -u origin main`). The
   workflow (`.github/workflows/pages.yml`) builds and publishes; check the Actions tab, then
   `https://fikryjawhari.github.io/thor-dex-guides/`. Decided: Pages builds from the Action, `dist/` is never
   committed. Commits here use the GitHub no-reply email (repo-local `git config user.email`), not the user's Gmail.
2. **App side, Phase 2** (a session in `thor-dex-viewer`, needs step 1 live): "Add from link" on the Thor with a Pages
   URL (first device test ever), then "Update from link" after a rebuild (bump a guide's version, push, update).
   Imported guides get a new library id and storage origin, so saved trackers don't carry over from the
   USB-copied ones (Export/Import moves a tracker).
3. **Shared sprite set** (a session here): pick the source (pokeemerald-expansion or hg-engine first; coverage through
   Legends: Z-A Megas, licence), add `sprites/`, sprite keys `P[].sk` and the fallback in `assemble.py`.
   Do this before any guide for a hack without its own art (most of the backlog, Photonic Sun included).
4. **Skill update:** `rom-hack-offline-dex` still describes hand-building one file from the EI template. Point it at
   this repo's flow (CLAUDE.md → Making a new guide). Can happen with the first new guide.
5. **New guides** (one session each, here): CLAUDE.md → Making a new guide. Each needs its sources re-fetched first
   (`.src/` is empty on a fresh clone); the 3DS ones (Photonic Sun, Eternal X) also need the user's vanilla romfs
   dumps, which live on the PC.
6. Later: footer credits (`cfg.credit` hook; hack authors from `SOURCES.md` plus the sprite set), the update
   checker (`plans/update-checker.md`), the app's parked "Update" action reading `guides.json`, the damage calc.

**Parallel sessions:** one session in each repo at a time is safe (separate folders and git histories), e.g. step 2
in the viewer alongside step 3 here. Avoid two sessions in this repo at once: the template is shared, so they'd
clash.

## Split results (2026-10-19)

- `template/dex.js` is Emerald Imperium's script with every Hardlove Gold difference folded in. A feature shows when
  the hack's data has it (tutor moves `p.tu`, vanilla comparison `p.vc`, conflicts `p.cf`, checklist steps
  `stop.s`, stop notes, cheat codes `WK.cheats`, game docs `WK.docs`/`WK.ko`, trades, group/section notes).
  Everything else is in `hack.json` → `cfg`: `name`, `orig` (tag for hack-original moves/abilities), `evs`
  (false = no EV inputs or EV speeds), `starter` (`slot` = rival follows the type caught in tracker area 0, `pick` =
  starter picker in the tracker bar), `orbs`, `g3trainer`, `capLast`, `walkAreaNote`, `trw` (boss/trainer words),
  `ls` (every localStorage key, kept from the old guides so saved state carries over) and `txt` (all hack-specific
  wording, inserted as HTML).
- `template/dex.css` is the union of both (Hardlove's extra `.doc`, `.dpre`, `.itbl td` rules).
- **Checked:** `tools/domcompare.mjs` renders every route (each Pokémon, move, ability, location and trainer page
  plus the five lists, every `<details>` opened) in the old file and the assembled one and compares the DOM.
  Hardlove Gold: identical. The full sweep flagged 14 routes, but each one is identical when loaded fresh (the sweep
  sometimes snapshots before a slow page has rendered; the old file against itself shows the same noise). Emerald
  Imperium: running at the time of the first commit, see the next commit.
  Not covered by the DOM check: CSS. Emerald Imperium now also gets Hardlove's `.itbl td{overflow-wrap:anywhere}`
  (long item names wrap at 260 px instead of widening the page).
- Built files dropped the build notes comment and `#build-source` (EI 2.85 → 2.75 MB, HG 2.58 → 2.42 MB). The notes
  are `hacks/<hack>/notes.md`; the builders are unpacked into `hacks/<hack>/extract/` (EI: build.py and its stages;
  HG: build.py and helpers, plus `port.py`, which patched EI's template into HG's and is now replaced by the template,
  and its old `assemble.py`). They read raw sources from paths on the machine that built them; fix the paths when a
  hack is next rebuilt.
- New meta tags: `dex-viewer:version` (hack version) and `dex-viewer:source` (the guide's Pages URL), for the update
  action and `check_updates.py` later. `dist/guides.json` lists every guide (id, title, game, platform, version,
  built, url); `dist/index.html` links them.
- Sprites: each guide's `sprites.json` is still keyed by its own species ids. The shared-set key scheme
  (`sprites/README.md`) is agreed; wiring `P[].sk` into extract and `assemble.py` waits for the set.

## Decisions

- Public repo, served by GitHub Pages (built by the Action from `dist/`, nothing built is committed). The app repo
  stays private.
- Guides stay single self-contained HTML files that work offline with or without the app. Shared sprites are **not**
  shipped with the app (the user, 2026-10-19).
- The shared sprite set is only for hacks without their own art, so it's chosen once, not per guide. Candidates:
  pokeemerald-expansion or hg-engine (Hardlove Gold already has the Legends: Z-A Megas). See `sprites/README.md`.
- Raw docs are never committed; `SOURCES.md` says how to fetch them.
- For hacks with public source code, the code wins over the docs; differences stay visible as "Sheet says ...".
- Credits: the index page and each guide's footer credit the hack's authors and sources and the sprite set (agreed;
  footer credit not added yet, `cfg.credit` is the hook).

## Viewer sizes (the app's contract; copy of the app repo's table)

1 dp = 1 CSS px in the guide (viewport `width=device-width`). Text zoom (A−/A+, 50–200%) scales text, not the viewport. The title bar takes 44 dp; the guide gets the rest.

| Case | Window (dp) | Guide viewport (CSS px) |
| --- | --- | --- |
| **Minimum window** (either screen) | 260 × 360 | **260 × 316** |
| Default first open, bottom screen | 480 × 436 | 480 × 392 |
| Maximised, bottom screen | 537 × 468 | 537 × 424 |
| Maximised, top screen | 832 × 468 | 832 × 424 |

- Bottom screen 1240×1080 px, top 1920×1080 px, both 369 dpi (density 2.30625).
- The user's current bottom-screen window is the minimum width, nearly full height: 260 × 394 dp (599×909 px), so a 260 × 350 viewport is a realistic everyday size. The minimum height was 160 (116 viewport) until 2026-10-18; it was raised to 360 so a guide's search bar and in-page keyboard always fit.

## Testing on the Thor

From the app repo's Build environment (adb is at `$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe`):
- Replace a guide in place: `adb push dist/<hack>.html /data/local/tmp/g.html`, then
  `adb shell "run-as app.dexviewer cp /data/local/tmp/g.html files/guides/<id>/index.html"` (Git Bash:
  `MSYS_NO_PATHCONV=1`), then reopen the viewer. Same id, so its saved state stays. Each guide's library id is in
  the app repo's PROGRESS.md (device details stay in that private repo).
- Inspect over CDP: `adb shell cat /proc/net/unix | grep webview_devtools`, `adb forward tcp:9333
  localabstract:webview_devtools_remote_<pid>`, then any CDP client (Node 24 has `fetch` and `WebSocket`).
- Small windows without resizing: CDP `Emulation.setDeviceMetricsOverride` (260 × 316, deviceScaleFactor 2.30625,
  mobile), `Page.captureScreenshot`, then always `Emulation.clearDeviceMetricsOverride`.
- Screenshots of the real screens: `adb exec-out screencap -p -d <id> > file.png` (top `4630946441858561667`,
  bottom `4630946482288158084`; screens must be on).
- Environment: no `gh` CLI; `curl` against `api.github.com` (60 requests an hour without a token). `python -I`
  ignores `PYTHONIOENCODING`, so call `sys.stdout.reconfigure(encoding='utf-8')` when printing ♂/é.

## Guides pass 1 results (2026-10-18)

**Emerald Imperium guide (the old `guides/emerald-imperium-dex.html` in the app repo, edited by hand; the CSS/JS template lives only in the HTML, the embedded build.py builds data only).** Already copied onto the Thor.
- Left icon rail, 44px, fixed, scrolls if the window is short; **no ☰** (the user decided it only widens the rail for nothing). Pokémon, Locations, Trainers, Items, Walkthrough, Calc. Active = gold `--acc` with a 3px inset bar. Calc (`#/calc`) is a placeholder page; the search header is hidden there.
- **No BST anywhere** (list column, sort option, detail Total, vanilla-change note). A saved `bst` sort falls back to dex order. Sorting by a stat still shows that stat on the row.
- Trainer teams: `minmax(116px,1fr)` grid, giving **6 across on the top screen maximised, 3 on the bottom maximised, 1 at minimum width** (all confirmed by screenshot; the user asked for at least 3/2/1 and to try 6/3). Cards: 32px sprite, types under the sprite/name row, moves one column below 200px (container query), trainer card padding 8.
- **Thumbnail glitch** was the viewer's algorithmic darkening: the guide had no `color-scheme` meta, so Chromium auto-darkened it and inverted small sprites. Added `<meta name="color-scheme" content="dark light">` (a contract rule, now obeyed). Walkthrough minis are 32px.
- 260-wide fixes: tags are `inline-block` (an inline "evo/breed" glued to "Crabominable" made the page 271px, so WebView zoomed to 0.96 and the zoom **stuck at the wrong scale after maximising**); Pokémon list rows put types under the name when narrow; sort and availability selects share one row; encounter tables (`table.enc`) and "Where to find" (`table.wh`) restack below 420px; the Pokémon page hero shrinks; the calc nature select can shrink. Sweep: every route, every 3rd Pokémon page and every trainer page has `scrollWidth` 260 at a 260 viewport.
- Still in the guide: `<select>`s (work via the shim) and `<input>`s for search, tracker "Other…", calc Level/IV/EV and "Your highest level" (none can type in the viewer yet).
- Light theme (Dark guide off) with the new rail tokens: confirmed working by the user (2026-10-18).
- Hardlove Gold got all of this in its 0.8.2/0.8.3 rebuild (port.py), and both now share the template.

## Keyboard + lag results (2026-10-18, guide side)

**Lag** (measured on the Thor; re-sort 1–2 s → 0.25 s, encounter pick 1.7 s → 0.25 s, open walkthrough 3–4 s → 0.3–0.7 s):
- **Guide:** sprites were base64 data URIs written into every row (1.9 MB of HTML per list render). Now `sprUrl()` turns each into a `blob:` URL on first use and sprites are CSS backgrounds (no `<img>` to parse). `content-visibility:auto` on list rows and open split/stop/boss bodies. Boss teams in walkthrough stops are built on first open; opened bosses stay open across re-renders (memory only).
- content-visibility made raw `scrollY` restores land wrong, so the guide restores by element: `keepAnchor()` (hit-test with `elementFromPoint`; reading geometry inside a skipped block forces its layout, which cost 400–700 ms until fixed) and `toAnchor()` (plus a ResizeObserver correction for 400 ms, stopped by a touch). `rerender()` carries block heights across (`cvSizes`/`cvApply`). Back/forward use per-history-entry snapshots (`history.scrollRestoration='manual'`).
- **New viewer hook:** when restoring scroll after a reload (screen swap, reboot), the app runs `dexViewer.restoreScroll(y)` if the page defines it, else `scrollTo`. Emerald Imperium saves `{hash, anchor}` in localStorage `eipos` and restores from it. It also reopens on its last route when loaded without a hash (the app always loads the bare file; before this a swap or reboot always went back to the Pokémon list).

**Keyboard** (Emerald Imperium only so far; mockup https://claude.ai/artifact/UBwihHN3y2fgwC5h8gAqQP, private, shows the first layout, not the final bottom row):
- Inside the viewer (`INV`: host ends with `.appassets.androidplatform.net`; localStorage `dvkb` = `1` forces it in a browser) the search box is a button (`searchDisp`, with `value`/`placeholder` properties so the old code is unchanged) and number boxes are buttons (`numBox`; buttons have a native `value`, and `setNum` fires `input` + `change`). Outside the viewer the page keeps its real inputs.
- `KB` module: letters keyboard with the contract's QWERTY rows; bottom row **Clear · Space · ⌫ · Done**, the first three equal and Done taking the rest, because the viewer's 36 dp resize handle covers the bottom-right corner (the user asked for this after the handle blocked ⌫). Hold ⌫ to repeat. Keys 42 px max, 30 min, 34 at the minimum window; max 560 px wide, centred. The sort/availability row hides while typing. Navigation closes it.
- Encounter "Other…": the same keyboard with a strip above the keys (area name as placeholder, the query, matching Pokémon to tap). The user called this "really smart".
- Number pad: a `1–0` row plus `Clear − + ⌫ Done` (Done double width), with a line naming the box and its range; Done clamps (EVs snap to 4). Trainer level and calc Level have − / + beside the value; calc IV/EV table cells are value-only. The user is happy with the pad as is.
- Pokémon name matching ignores punctuation, spaces, accents and ♀/♂ (`norm`).
- Viewer minimum window height 160 → 360 dp for all guides (the user preferred this to growing the window only while typing).
- The user says the keys are "just barely big enough" to type consistently.

**Fallback, scoped but not built** (the user's idea if the keys prove too small in use): a full-window search screen. Tapping search covers the whole guide viewport (rail included) with one fixed layout: a top strip with the query, a scrolling results list in the middle (filter suggestions first), and a big keyboard at the bottom. Done or picking a result returns to the page. One fixed layout whatever the window size (the user doesn't want sizes that keep adjusting). The number pad stays as it is. Could be mocked in the keyboard artifact first.

## Search fix and full-window search (2026-10-18)

**Search fix (2026-10-18; both guides, now in the template).** Typing on a Pokémon, move, ability or trainer page used to re-render that page and ignore the query. Now the `input` handler sends it to the section's list (`UP` map) as a new history entry, and `hashchange` keeps the keyboard open for that one navigation (`searchNav`). Back returns to the page. Checked over CDP on the Thor.
**Full-window search: built in Emerald Imperium (2026-10-18), viewer only (`INV`).** Mockup: https://claude.ai/artifact/3T5mc2eQd4mcGe19jkkNiT (private Design canvas, sample data). The user dislikes that canvas type ("how do I interact?"); next time use a plain HTML artifact like the keyboard mockup. The user called searching everything "perfect": it also fixes filters and Pokémon being separate lists.
   - Tapping the search box opens `SR`: a fixed layer over the guide (rail included, z 19, under the keyboard's z 20). It has a strip with ‹ back, the query, × clear and ⌄ hide/show keyboard; results; and the `KB` keyboard in `full` mode (4 rows: QWERTY / ASDF / 123 Z–M ⌫ / Space + Done; 123 swaps the top row for digits; keys 37 px at 260 × 360).
   - **Result order (the user's rule):** the current page's section first, in full (up to 100, then "Show all"). Then the others in the order Pokémon, Filters, Locations, Trainers, Items, Walkthrough, 8 each until "Show all". Detail pages count as their section (Pokémon/move/ability → Pokémon, trainer → Trainers); Calc counts as Pokémon.
   - Picks: Pokémon / trainer → their page; filter → added as a chip on the Pokémon list; location → `#/l/…` opened; item / walkthrough stop → that list searched for its name. Done → the query goes into the page's search box, as before (on a detail page, the section's list, via `UP`). Recent picks (`eirecent`, 6) show when the query is empty. The old `#sugg` dropdown is off in the viewer.
   - Checked over CDP on the Thor at 260 × 317: ordering on a Pokémon page and a trainer page, picking, Done, Back, recents, hide keyboard, plus a screenshot. The user has since used it by hand: "it was good".
   - Outside the viewer (phone browser) the old search with the real input is unchanged.

## Skill (2026-10-18)

- **Skill.** `rom-hack-offline-dex` (claude.ai account skill) rewritten: Emerald Imperium is the reference build (keep its template, rebuild only the data, strip the EI-only parts), plus a new `references/viewer-ui.md` holding the whole viewer contract (sizes, rail, keyboard, full-window search, number pad, lag rules, anchor scroll restore, `dexViewer.restoreScroll`, testing at the viewer sizes in normal and `dvkb` mode). Also the EI data rules (calc sets are the authority, relative levels, cosmetic form folding, palette PNG sprites, level caps, tracker order, walkthrough placement), the `dex-viewer:` meta tags, a per-hack localStorage prefix, and mockups as plain HTML artifacts. The user uploads it by hand (zip with forward-slash paths); claude.ai skills sync into `~/.claude/skills/synced/<ids>/rom-hack-offline-dex/`, so a session can diff the live copy there (it refreshed mid-session after the upload).
- After the split the skill should build into this repo (extract → `data.json` → `assemble.py`), not a hand-made
  single file. Not updated yet.

## Hardlove Gold 0.8.3 results (2026-10-19)

- 0.8.3 = `kumakuma1/hardlove` `f1b2363001` (matched to the Hackdex release time, 6–7 PM Adelaide = 07:30–08:30 UTC).
  Since the 0.8.2 pin only `data/Trainers.c` changed among the guide's sources (5 E4/Red sets), so those were patched
  straight into the guide's `#data` JSON; no full rebuild. The raw sources aren't on this PC (git-ignored), so a
  rebuild means re-fetching per `SOURCES.md` first.
- **Decision: for Hardlove (and any hack with public source) the code wins over the docs**; differences stay visible as
  "Sheet says …". A calc import of the 0.8.3 ROM (ddex-chi.vercel.app) matched `Trainers.c` where the sheet didn't.
  The re-downloaded Trainer Battles sheet fixed only 2 of ~63 old differences.
- The sheet lists Will [Double] and Koga [Double] twice; the guide now keeps one of each (keys 9.0.2 and 9.0.5
  removed; the user confirmed Will has Slowbro, not Mr. Mime). A rebuild would bring them back: see `SOURCES.md`.
- Thor library: Hardlove Gold is imported (NDS; id in the app repo). The library has no adb import; push the
  file to `/sdcard/Emulation/ROM Hacks and Mods/` and import it by hand, or replace `files/guides/<id>/index.html`
  (Build environment → Testing a guide edit).
- Environment: no `gh` CLI. Use `curl` against `api.github.com` (60 requests an hour without a token).
  `python -I` ignores `PYTHONIOENCODING`, so call `sys.stdout.reconfigure(encoding='utf-8')` when printing ♂/é.
