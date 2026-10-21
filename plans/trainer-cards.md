# Trainer cards, reading room and page cleanup (build spec)

Decided 2026-10-21 with the user over three mockup rounds (decide session, Sonnet). Build exactly this; anything not
covered is a question for the user, not a choice for the builder. Template changes (every guide) plus one
Photonic-Sun-only data change (last section).

Branch `worktree-trainer-cards` (from `main` 7bd17f1), worktree `.claude/worktrees/trainer-cards`.
Reference mockup (behaviour, not code to paste): `tools/mockup/trainer-cards/` (`patch.css`, `patch.js`, `panel.html`;
`python -I tools/mockup/trainer-cards/build.py . out.html`, then `python -I tools/preview.py out.html trainer-cards.html`
-> https://windows-pc.tail1846b8.ts.net/trainer-cards.html). It is the real Photonic Sun build with a layer over it, so
values (px, breakpoints) in it are the decided ones. `shot.mjs` takes headless screenshots at the viewer sizes.

The problem it solves (260 x 316): the pinned stack was ~170 px, one opened Pokémon was ~181 px tall, the card repeated
the row above it, and six 32 px preview sprites wrapped 5 + 1.

## 1. Trainer card: strip + one Pokémon at a time (design B)
- Below **500 px** wide (`@media (max-width:499px)`): a strip of up to 6 equal-column sprite buttons (28 px max, with the
  Pokémon's level under each, selected one outlined in the accent) above ONE Pokémon block; tapping a sprite shows that
  Pokémon. The first one is shown by default. Teams of one Pokémon get no strip. Applies to every `.team` (trainer card and the
  partner team in a `ptd`). Selection is per card and doesn't persist.
- At **500 px and wider**: all Pokémon as boxed blocks (design A), **three across at most** (min column 150 px, so 2
  across at 500-~600 px, 3 above), no strip. Checked: 537 x 424 shows 4 full; 832 x 424 shows all 6.
- Pokémon block (boxed compact, used by both): 30 px sprite; line 1 name (link) + level; line 2 type tags (10 px) + `Spe n`
  (with the existing "no EVs / with EVs / 0 IV / Scarf" extras after it, `Spe n` never splitting); ability · item · nature
  (small, muted, ability a link); moves two across (11.5 px, may wrap, type-coloured dot); EVs line only if the game has
  EVs. Tags (Lead, pre-evolution, sheet only), "Sheet:" and "Sheet says" lines stay. **IVs are removed everywhere, on
  every page, in every guide** (the user: they don't matter). `0 IV` speed extra: keep only if it carries a fact the
  user needs; ask if unsure. EVs stay where a game has them (the user may patch EVs out of Eternal X, Photonic Sun and
  minimal-grinding hacks later: data/`cfg.evs` already handles that).
- Rejected: C (one two-line row per Pokémon, tap for the rest) and D (flat list); they are in the mockup only.
- Opened trainer card header: **starts at the team**. No repeated trainer name, place or tags (the row above says them).
  Keep: the "If your starter is X" tag, notes, rewards, the level box for relative-level trainers, partner block,
  Collapse and Pokepaste line. In a row of several trainers (`data-ks` > 1) keep each trainer's name as a small label
  (no place). The row's preview sprites hide while its card is open. Standalone trainer pages (`#/tr/<k>`) are unchanged
  except IVs and the Pokémon block.
- Used by the walkthrough's trainer rows too (they share `trRows` / `bindTrd` / `trainerBlock`).

## 2. Preview rows (closed trainers), Trainers and Walkthrough
- Sprites **24 px**, at most six to a line (flex-wrap, max-width 6 x size + gaps), beside the name when the name
  leaves room, else under it at the right. Row padding 5 px 4 px, row margin 2 px, name 14 px.

## 3. Pinned stack and rail
- **Search moves to the rail**: a magnifier button at the top, opening the existing full-window search (`SR.open()`,
  same as clicking the old box). Rail icons 35 px tall (was 44) so seven icons plus the two jump buttons show at
  260 x 316.
- **The search box is gone from the top of every page.** The header stays only where it holds something (Pokémon page:
  filter chips and the two selects) and shows the box again only while a query is set (so it can be cleared). `--hh`
  must follow (0 when the header is hidden). Check Back/Done flows: a query typed in the full-window search still
  filters the current page; find another place to show an active query on pages with no header (a chip or the header
  returning) and ask the user if unclear.
- **Show row** (Places | Trainers | Teams): stays pinned; 3 px padding above and below, buttons 26 px tall (was ~22),
  font 12.5 px. `--sw` is measured from it, so the pinned place header stays flush under it.
- **Place header on one line** (Trainers and Walkthrough): name truncated with an ellipsis, the `teams n/N` button now
  reads **`n/N | cap`** (no words; open cards / trainers, then the level cap; cap omitted where the place has none),
  10.5 px, same press behaviour as now (fill first, opens the place). The separate count tag and cap tag in the header
  go; the cap stays in the cap line under the header. Header font 15 px.

## 4. Page cleanup (every guide, every page)
- **New rule (also in CLAUDE.md): no explanatory or provenance text at the top of pages.** Remove: the Pokémon page's
  "931 Pokémon. Type in the search box...", the Locations note ("72 areas in the Wild Pokémon Locations doc's
  order... Search matches places or Pokémon."), the Trainers header note (`TX.trh` / `trs` / `trs0`: sets are game data,
  places from Bulbapedia, choose your starter...), the "dupes clause on whole evolution lines" fragment of the tracker
  line ("0 caught · 0 failed" stays; it appears on Locations and in the Walkthrough Guide info), and any equivalent on
  Items, Walkthrough and every hack. `hack.json` texts that only fed these (`cfg.txt.trh` etc.) can go; check each hack.
  Provenance belongs in the footer credit work (PROGRESS "Later"), not at the top of pages.
- **Trainers header card**: Minimal Grinding Mode checkbox labelled just **MGM**; beside it the level-cap set switch
  (Photonic Sun: "Trials" | "+ Mini caps", always visible, never needs an expander to change); under it a collapsed
  **Level caps** expander holding the caps table. **Bug seen in the mockup (fix in the build):** switching the set must not
  open the expander (`bindHead` currently sets `CAPSO=true` on a switch). For hacks with plain `TRD.caps` (no
  `mini`): MGM row and the existing Level caps expander, no note.
- **Export / Import / Reset all** side by side on one row at 260 on Locations and the Walkthrough tracker bar (flex,
  equal width, 12 px, smaller padding, ellipsis); the Walkthrough's extra "Reset checklist" button, where a hack has
  one, may wrap to a second row.
- **Type size**: the big white titles in the grey boxes (`details.split>summary`: boxes, parts, islands, Guide info)
  go to **14 px bold** with 8 px 10 px padding, matching the grey pass-through signs (`.wsign`); normal stop / place
  headers (`.stoph`) 15 px (was 16). The user can scale up with Dex Viewer's text zoom.

## 5. Walkthrough stop headers: trainer count and cap
- Every sticky stop header (`details.stopd>summary`) of a stop with **at least one trainer fight** shows the same
  `n/N | cap` button as the Trainers place header (n open cards, N trainers, the cap of the stop's trainers: from
  their place's cap in the current cap set; if they differ, the highest). It replaces the existing "N trainers" tag. It
  toggles the stop's cards (fill first; opens the stop). Stops with no trainer show nothing, so it doubles as a quick
  "does the next stop have a trainer" cue. Keep it in sync on card toggles. Do not rewrite the header's DOM in a loop
  (the mockup's first version froze the page: only touch text when it changed).

## 6. Photonic Sun only (data; `hacks/photonic-sun/extract/walk.py` and `locs.py`, then `build.py` and `assemble.py`)
- Part 2 "Route 1 - Hau'oli City": the **Route 1 wild encounter (the non-starter one) moves to the Route 1 visit in
  section 2**, the one with the three trainers (Audrey, Jimmy, Oliver). Section 1 keeps only the starter (the Poké Balls
  come at home, so the encounter really starts in section 2).
- Add an encounter box for **Hau'oli Outskirts** at its (second) visit in section 2.
- Add a stop **Trainers' School** with its own encounter box; move the trainers **Youth Athlete Hiromi through Teacher
  Emily** into it from where they are now.
- **Locations tab order** at the start: Starter, Route 1, Hau'oli Outskirts, Trainers' School, Hau'oli City (today:
  Starter, Route 1, Hau'oli City, Trainers' School, ...). Check how `walk.py` / `locs.py` build area order and the
  Hau'oli Outskirts area (it may not exist as an encounter area yet: take its wild table from the source data) and the
  `ALIAS` / `TITLE_FIX` entries for Trainers' School.

## Checks
1. `python assemble.py`, all guides.
2. `domcompare` old `main` build vs new for Emerald Imperium and Hardlove Gold, normal and `--kb`: expected differences
   are the intended ones (page tops, headers, card markup, rail); no page errors. Photonic Sun at 260 x 316, 480 x 392,
   537 x 424, 832 x 424, normal and `dvkb`: no page errors, nothing wider than the window, pinned stack flush (rail
   search button at the top, seven icons and both jump buttons visible at 260 x 316), card strip works at 260 and 480 and
   gone at 500+, three across at most.
3. `walkcheck.mjs` and `pagecheck.mjs` (they will need updating for the removed search box and header text).
4. Show-switch spec checks (`plans/trainers-show-switch.md`) still pass with the shorter Show row and `n/N | cap` button.
5. Search on every page: rail button opens it; a query set from it shows and clears on pages without a header.
6. Put the Photonic Sun build in the Thor frame on the phone preview for the user's test.

## 7. Round 4 (the user, 2026-10-21): active query bar, spacing, starter pick
- **Active query**: the bar shows while a query is set on every page, Trainers included (header otherwise hidden), and
  clears with its x. Decided; no open question.
- **`0 IV` speed extra is removed** (the full speed number is enough). No IV text anywhere.
- **Search bar shrunk** (final, from the user's slider test): height `--sbh` **26 px** (was 40), font `--sbf` **14 px** (was 15),
  radius 6 px; the x button as tall as the bar; the Pokémon page's two selects take the same height and font.
- **One gap everywhere, `--g` = the side padding** (final **4 px**, at every window width: wider windows do NOT get a larger gap). It is: the page's side padding, the top
  padding under the header, the vertical gap between every box on every page, and the header's own padding on all
  four sides (use a bottom `box-shadow` for the header line, not a border, so the bottom padding isn't 1 px bigger). Built as `#app`
  `display:flex;flex-direction:column;gap:var(--g);padding:var(--g)` with `#app>*{margin:0}` (the mockup's way; other
  ways are fine if the result is identical). Header: flex column, same gap between the search bar and the Pokémon page's
  select row; hide an empty `#filters`. Fixes the user's list: Locations (Starter box too far from the top, its gap to
  Expand / Collapse all differs), Trainers (MGM/caps box and Open all islands), Walkthrough (Guide info box above/below
  and Expand / Collapse all vs Starter box and intro box), Pokémon (gap above Dex order / All Pokémon, Bulbasaur to the
  top line). **Only exception: Pokémon rows keep their 4 px between each other.** Items was already right: keep it right.
  Check every page's top, 260 x 316, and a detail page.
- **Trainers header card**: add the **starter pick** (the existing `starterSel`, shown as "Starter" when none, bound like
  the tracker's `tk-starter` so it sets `TK.s` and the rival teams follow) on the MGM line; the caps switch goes on its
  own line, full width; then the Level caps expander. Where a hack has no starter pick (`PICK` false) nothing is added.

## Not decided / ask the user
Nothing open (search bar 26 / 14 px and gap 4 px are final).
