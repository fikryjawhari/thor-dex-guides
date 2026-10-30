# Pokémon page: collapsible sections, name bar, switching in place

Decided 2026-10-31 with the user on the phone preview (`tools/mockup/dex-page/`, branch `worktree-dex-page`). The
mockup is the reference for look and behaviour: `python -I tools/mockup/dex-page/sample.py`, then frame and preview it
(its README). Every guide, template only (`template/dex.js`, `template/dex.css`); no extract or data changes.

**Build on top of the calc-resets merge.** That session changed `template/` (pages open collapsed, `segBar`, Reset
all, `resetOpen`, Pokémon sprites in the calc linking to the dex). Merge `main` into this branch first, read
`template/README.md` → Page design (its Reset all and collapse-bar rules), and reuse those helpers instead of the
mockup's copies.

## What changes

1. **Sections collapse.** Everything after the top card is a box whose title row opens and closes it: Abilities,
   Base stats, Stat calculator, Type defences, Where to find, Evolution, Used by trainers, Moves. The top card and the
   "Sources disagree" box (when present) don't collapse. Defaults: Abilities, Base stats, Evolution, Moves open; Stat
   calculator, Type defences, Where to find, Used by trainers closed.
2. **One open/closed state for every Pokémon**, saved, by section name. Why (the user): switching in place (5) only
   works if the next page has the same boxes open; per-Pokémon memory or a reset per page would leave nothing to
   lock to.
3. **Expand all / Collapse all** under the top card (the template's `segBar`). Collapse all, pressed while every
   section is already closed, reads and acts as **Reset all**: back to the defaults (the same rule and wording as the
   other pages, `template/README.md`).
4. **Name bar.** A bar fixed at the top (beside the rail, the page's width) slides in once the top card has scrolled
   off and out when it's back: `‹` · mini sprite, name, types · `↑` · `›`. `↑` scrolls to the top of the page at once.
   The sprite and name open the form menu (6). The rail's Pokéball is unchanged (to the Pokémon list).
5. **Previous / next.** `‹` `›` in the bar and as text links at the very top of the page, which replace
   "‹ All Pokémon". Each top link: chevron, the name in link colour, then `#<dex> · <relation>`. No box, no sprite.
   - **Order:** the Pokémon list as it stands: its search, filters, availability and sort (factor `listPokemon`'s
     filter/sort into one function both use). No search or filters: dex order, where forms already follow their
     Pokémon (Charmander, Charmeleon, Charizard, Mega X, Mega Y, Squirtle). A page not in the list (reached from an
     Evolution link): step through the full order and stop at the nearest Pokémon that is in the list, either way.
     Nothing that way: the bar's arrow is disabled and the top link's half stays empty.
   - **Relation** (accent colour): the evolution between the two (`Lv 16`, `Lv 25 at night`, `Fire Stone`: the
     `ef` / `et` text with a leading `level ` shortened to `Lv `); else, same dex number: `Mega` (target is a Mega),
     `Base form` (leaving a Mega), `Form`; else nothing.
   - **History:** the arrows and the form menu replace the history entry (Back goes to where you came from, not
     through every Pokémon you stepped past). Evolution links add an entry, as links do now.
6. **Forms.** A Pokémon with more than one form (same dex number) shows `#6 · 3 forms ▾` (accent) in the top card;
   tapping the top card or the bar's sprite / name opens a menu under it: each form's sprite, name and type letters,
   the current one highlighted. Picking one opens that form's own page (forms keep their pages, so search and filters
   still find them). A tap outside closes it. One form: no `▾`, no menu.
7. **Switching keeps the place** (arrows, form menu, Evolution links). Before leaving, take the first visible
   anchor row at or below the bar's bottom edge (the top of the screen if the bar is out) and remember its key and its
   height on screen. On the new page, scroll so the same key sits at the same height. Keys mean the same thing on
   every page and never use data positions:
   | Rows | Key | Order (for "nearest") |
   | --- | --- | --- |
   | Section titles | `sec:<section>` | section order |
   | Abilities | `ab:0`, `ab:1`, `ab:h` | slot |
   | Base stats / calculator rows | `bs:<stat>` / `sc:<stat>` | stat |
   | Type defence rows | `td:<multiplier>` | multiplier |
   | Where to find rows | `wh:<place>#<n>` | row |
   | Evolution rows | `ev:<Pokémon id>` | row |
   | Used by trainers | `tr:<trainer key>` | row |
   | Move rows | `mv:<move>` (a second row of one move: `#2`) | Level-up: level (Evo = 0.5); TM / Tutor / Egg: name |
   Missing key: the nearest row of its kind in that section if the section is open (nearest level; next name
   alphabetically), else that section's title, else the next section's title. At the very top (scrollY ≈ 0): stay at
   the top. The Moves tab chosen stays across Pokémon, as now. This runs instead of the hashchange snapshot restore
   for these navigations; `LS.pos` keeps working for the new page.
8. **Moves table fits.** While the table is under 380 px wide (a container query on its wrapper): type as a letter
   circle in its colour (text colour as the type tags), category as `P` (red `#f0605a`), `Sp` (blue), `St` (grey), no
   Type / Cat header text, `Varies` power as `Var`, no `%` on accuracy, tighter cells (mockup CSS). Wider: today's
   words. A one-word move name that still can't fit breaks inside the word (`overflow-wrap:anywhere`) rather than
   pushing the row sideways. Full name on every letter (`title`, `aria-label`). Same-letter types (Fire / Fighting /
   Fairy) are told apart by colour: accepted.
9. **Markers instead of tag boxes** on this page: a move or ability that is new in the hack or changed gets an amber
   `!` (replacing the `CF.orig` and "changed" tags); a move whose sources disagree (`cf`) a red `?`. Both when both.
   `title` says which. Move pages, ability pages and other pages keep their tags.
10. **Evolution shows the whole family**: from the base stage down, each Pokémon then its forms (same dex number, not
    evolved into: Megas, Rockruff (Own Tempo)) then what it evolves into, indented per stage. Each row: sprite (32),
    name, and `↳ <method>` or a `Mega` / `Form` tag. The current page's row is highlighted and not a link. Only one
    row: add "Does not evolve." The old "Other forms" line goes (the forms are in the tree).
11. **Stat calculator, stats down the side**: Level and Nature at the top (nature options name their `+` / `−` stats);
    a row per stat: name, Base, IV box, EV box (when the guide has EVs), result; the nature's raised stat name red
    with `↑`, lowered blue with `↓`; a Total row (BST, EVs `n / 510`); then Speed by level as now. Same saved state
    (`calcKey`), same number boxes (`numBox`, dvkb pad), no sideways scroll at 260.
12. **"Use in calc ▸"** (guides with `cfg.calc`): the calculator now starts closed, so the button moves out of it, to
    the top card under the types. (Not shown to the user yet: confirm on the preview.)
13. **No word breaks inside a name.** Sizes are fixed for the widest word in any guide's names (~6.7 em: Crabominable,
    Brambleghast, "(Hearthflame)"), not fitted per name. Multi-word names wrap between words.
    - Top card: under 340 px wide the name runs across the top at 20 px, sprite (88) and details under it; wider, as
      now (name beside the 112 sprite, 22 px).
    - Bar: arrows 26 px, `↑` 32. Under 300 px: name 13 px (two lines at most), sprite 30 with the type letters
      (13 px circles) stacked down its right edge, a few px overlapping it. Wider: name 15 px, sprite 34, type tags.
    - Top links: 12 px names under 360 px, 13 px wider; two lines at most.

## Out of scope
The Pokémon list, move / ability / trainer pages and their tags, Locations, Items, Walkthrough, Calc page. Data and
extract scripts. Sticky section titles (not asked: only the name bar pins). Saving the Moves tab.

## Controls and states
| Control | Initial / saved | Action | Result / scroll | Disabled / empty |
| --- | --- | --- | --- | --- |
| Section title | Saved state, else defaults | Tap | Opens / closes; saved for every Pokémon; never scrolls (template rule) | — |
| Bottom collapse bar | Shown on an open section taller than the window (template `bars()`) | Tap | Closes it; its title stays on screen under the bar | — |
| Expand all | — | Tap | All open, saved | — |
| Collapse all / Reset all | Label "Reset all" while all are closed | Tap | Collapse: all closed, saved. Reset: defaults, saved state cleared | — |
| Bar | Out while the top card shows | Scroll | Slides in / out (≈120 ms) | Not on other routes |
| Bar `↑` | — | Tap | scrollTo(0) | — |
| Bar `‹` `›`, top links | — | Tap | Neighbour in the list order (5), position kept (7), history replaced | Nothing that way: disabled / empty half |
| Top card, bar sprite / name | `▾` when 2+ forms | Tap | Form menu; pick → that page, position kept, history replaced; outside tap closes | One form: nothing |
| Evolution row | Current row highlighted | Tap | That page, position kept, history entry added | Current row: not a link |
| Moves tabs | Last tab chosen (memory) | Tap | As now; collapse bars rechecked | — |
| Calculator boxes | `calcKey` state | Edit | Results, ↑ / ↓ names, EV total update; saved | — |

## Edge cases
- Viewer sizes (PROGRESS.md), normal and `dvkb`, light / dark, text zoom (a long word may then overflow and clip:
  accepted). No sideways scroll anywhere with every section open.
- Pokémon with no moves in a tab, no wild places, no trainers (no Used by box: its key falls back to the next title),
  Mega / form-change / trainer-only forms, a family with branches (Eevee, Rockruff), a form that evolves from another
  form (Rockruff (Own Tempo) → Lycanroc (Dusk)), a species whose base isn't in the data.
- Saved state: the open/closed object stores section names only; a name it doesn't know is ignored, a missing one
  takes its default. New storage: reuse the page open-state store the merged template uses for other pages if it fits;
  otherwise one new `cfg.ls` key in every `hack.json` (never rename existing ones). Add it to
  `tools/scenarios/guide-update.mjs`'s snapshot (CLAUDE.md hard rule).
- Search typed on a Pokémon page still goes to the list (unchanged). Reload restores the page and position (`LS.pos`).

## Checks
| Requirement | Scenario | Setup | Assert |
| --- | --- | --- | --- |
| Sections, defaults, memory, Reset all | new `tools/scenarios/dex-page.mjs` | 260 × 316 and 480 × 392, normal / dvkb, clean storage | Defaults open; a toggle carries to the next Pokémon and a reload; Collapse all → "Reset all" → defaults and saved state cleared |
| Bar | same | 260 × 316 | Out at the top, in after scrolling past the top card; `↑` → scrollY 0 |
| Order and filters | same | Type filter set on the list | `›` steps through the filtered list; from a page outside it, the nearest listed; ends disabled |
| Position kept | same (the mockup's `check.mjs` does this) | Every section open, scrolled into Moves | Charizard → Mega Charizard X and Charmeleon → Charizard: same `mv:` row within 2 px; missing move: nearest level |
| Forms | same | Charizard | Menu lists 3, picking keeps position; one-form Pokémon: no menu |
| Fit | same | Five viewer sizes, every section open, all move tabs, the widest names patched in | No sideways scroll; no word broken in the top card, bar or top links |
| Calc entry | `calc-entry.mjs` (update the selector if the button moves) | as is | Use in calc still lands with a custom set |
| Saved state across updates | `guide-update.mjs`, `stable-keys.mjs` | as is | The new open-state kind compares by name |

Then `domcompare` against `main` on every guide (the Pokémon pages change on purpose; nothing else should),
`gate.py check --template --jobs 8`, and `python -I tools/preview.py dist/emerald-imperium.html --frame` for the Thor.
When built and merged: decisions into `template/README.md` (Page design), delete this plan and
`tools/mockup/dex-page/` (git keeps them).
