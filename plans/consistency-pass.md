# Consistency pass (scoped 2026-10-23)

The user's review of the four guides side by side (Emerald Imperium EI, Hardlove Gold HG, Eternal X EX, Photonic Sun
PS). Goal: the same behaviour everywhere, and anything every guide does goes into the template or a shared extract
helper, so new guides need fewer rounds. Work is in four jobs (below), in this order: **A template → B per-hack data
(4 in parallel) → C items (decide, then build) → D audit**.

## Findings

### Pokémon tab
- PS and EX show a "Changes from vanilla" card (`vanCard`, `p.vc`) and a "Changed" availability filter. Not wanted:
  remove it (A1).
- HG has no Caterpie line (and 182 other dex numbers): they are on the hack's own "Unavailable Pokémon" list and no
  trainer uses them, so `build.py` leaves them out on purpose. EI, EX and PS list every species. **Decided (the user,
  2026-10-23): every guide leaves out species that are neither obtainable nor used by a trainer** (B-EI, B-EX, B-PS).
  Megas / forms follow the same rule. Check before dropping: what keys species in saved state (`LS.dex`, tracker
  `TK.e[..].p`), so removing entries doesn't shift anyone's saved data.

### Locations tab
- EX and PS have a `Starter` area (`AR[i].st`, the starter picker is its tracker); EI and HG don't.
- EI: area 0 "Littleroot Town" becomes **Starter** (B-EI). EI has no starter picker in the tracker bar at the top
  (it's a `slot` guide: the rival follows the type caught in area 0). Add one; its type sets the rival (A2).
- HG: add a **Starter** area (Turtwig / Litten / Froakie, now "Starter choice" rows at New Bark Town); New Bark Town
  keeps its other encounters (the starter has its own met location) (B-HG).
- EX: the player picker sits on its own row under the starter; put both on one row when they fit (A3).

### Trainers tab
- EI: no starter picker in the header, so May's card shows all three teams (fixed by A2).
- EI and HG have one box per cap split ("Roxanne Split [Cap 15]", forced caps). EX and PS get the same: one box per
  cap **including the mini caps**, and the Trials / + Mini caps switch goes (A4, B-EX, B-PS).
- Cap edits: EX drops Sycamore (Lumiose, 18) and Sycamore (Couriway, 70); "Trevor, Route 19" becomes the three side
  rivals (the data has Shauna by starter, Tierno and Trevor there): "Shauna, Tierno & Trevor". PS drops Dexio
  (Heahea) and Battle Royal. The rest of both lists stay.
- Every guide: the league split is **Elite Four Split [Cap N]** (EI's is "Champion Split [Cap 85]"; PS's
  "The Pokémon League").
- PS post-game: **Elite Four Split [Cap 100] → Post-game: Episode RR → Post-game** (no caps after the E4). The two
  Poni Grove trainers (now in "Post-game: Guardians and Poni Grove") go into Post-game with Ultra Space, Battle Tree,
  Title Defense and the Guardians.
- Level caps drop-down: every guide like HG (white rows with lines between, name | level), not EX / PS's `capt`
  table with a place line and "mini" tags (A4).
- MGM: **decided (the user, 2026-10-23): show the switch only in guides whose trainers have EVs** (A5). Today that's
  EI and PS. EX has no trainer EVs (0 of 680) and HG has no EVs at all, so neither shows it. PS keeps it until the
  user makes PS EV-less in a later session; then it hides by itself.
- "Open all islands" is PS wording shown in every guide: "Open all splits" (A6).

### Items tab
Every guide has a different set of boxes and row style (C). Today:

| EI | HG | EX | PS |
| --- | --- | --- | --- |
| TMs, HMs, Mega Stones, Battle item rewards, Shops, Useful NPCs | Held Items, Valuables, TMs, HMs, Move Tutors, Evolution Items, Mega Stones, Other | Shops, TMs, Evolution Items, Held Items, Stats and Abilities, Fossils, Key Items | Shops, TMs, Z-Crystals, Evolution Items, Held Items, Stats and Abilities, Key Items |
| prose place | prose place | `Found: / Shop: / Wild: / Also:` lines | same as EX |

Key items in EX / PS: keep only ones that unlock something or give story / QoL / gameplay value (drop Holo Caster,
Running Shoes, Town Map and the like).

### Walkthrough tab
- Splits mirror the Trainers boxes, named "<Boss> Split [Cap N]" like HG / EX (EI's are "Split 1: Roxanne"; HG's
  say "[Level Cap N]" here but "[Cap N]" on Trainers: use "[Cap N]" everywhere). EI only has the key trainers, so
  its walkthrough keeps 9 splits (8 gyms + Elite Four) named with the gym caps; its Trainers tab keeps the 20 boxes.
- PS: cap splits instead of Bulbapedia's 35 parts; the parts' stops move into them. Check saved ticks survive (they're
  keyed by stop key, not split index: confirm before building).
- Every stop with trainers shows `n/N | cap` (EX and PS have it; EI and HG don't, since their stops carry no
  `s.cap`) (A7).
- MGM switch inside Guide info, in the guides that show MGM (A5).

### Also seen while scoping
- `cfg.txt.van` / `chdoc` / `nodc` wording only feeds what A1 removes (check before deleting).

## A. Template (one session, every guide; `domcompare` all four after)
1. Drop `vanCard`, `HASVC`, the `chg` availability option. Extracts stop writing `p.vc` (B).
2. Starter picker for slot guides: `cfg.starter` `'type'` (new) = a named picker like `pick`, stored in `TK.s` and
   the Starter area's tracker; `starterType()` returns the picked starter's type (Grass / Fire / Water) for rivals
   whose `t.st` is a type. Shown in the tracker bar, the Trainers header and the walkthrough, same as `pick`. EI's
   saved `TK.e[0]` (Littleroot pick) must become the picked starter, so existing trackers carry over.
3. Locations tracker bar: starter and player on one row, wrapping at 260 when they don't fit.
4. Trainers header: one cap set. Drop the `capsw` switch, `CSET` and `TR.mini`'s second set (data gives one list,
   `TR.caps`, with the mini caps in it); the drop-down is HG's plain `itbl` (name | level). `s.cap` becomes one entry
   instead of `[set0, set1]`. `cfg.ls.capset` stays in hack.json (unused; keys are never reused).
5. MGM: shown when `cfg.evs` is on **and** some trainer Pokémon has EVs (from the data, not a new switch), on Trainers
   and as a checkbox in the walkthrough's Guide info (same `LS.mgm`). EX stays `cfg.evs` false.
6. "Open all islands" → "Open all splits".
7. Walkthrough stop `n/N | cap`: when a stop has no `s.cap`, use its split's cap (from the name's `[Cap N]` or a
   `split.cap` field), so forced-cap guides need no per-stop data.
8. Shared extract helper (`tools/splits.py` or `common.py`): split naming `"<Name> Split [Cap N]"`,
   `"Elite Four Split [Cap N]"`, `"Post-game"`, used by all four extracts.

## B. Per hack (data only, after A merges; each touches only `hacks/<hack>/`, so the four can run in parallel)
- **All but HG**: drop species that are neither obtainable nor used by a trainer (HG already does).
- **EI**: AR[0] → "Starter" with `st:1`; `cfg.starter` `type`; walkthrough split names; "Champion Split" →
  "Elite Four Split [Cap 85]".
- **HG**: Starter area; walkthrough names `[Level Cap N]` → `[Cap N]`; "Victory Road [Cap 81]" → "Victory Road
  Split [Cap 81]".
- **EX**: one cap list (mini caps in, the two Sycamores out, Route 19 rivals); Trainers boxes and walkthrough splits
  per cap; drop `p.vc`; key items cut.
- **PS**: one cap list (Dexio Heahea and Battle Royal out); boxes and walkthrough splits per cap; post-game as above;
  drop `p.vc`; key items cut.

## C. Items (decide session with a mockup, then build)
One box set and one row style for every guide, from the union above. Starting proposal for the mockup: Key Items,
TMs, HMs, Move Tutors, Evolution Items, Held Items, Stats and Abilities, Mega Stones / Z-Crystals, Fossils,
Valuables, Shops, Other (EI's Battle item rewards and Useful NPCs fold in or stay as a hack's own box); rows in the
`Found / Shop / Wild / Also` style where the data allows it. A box shows only when the hack has rows for it.

## D. Audit
`assemble.py`; `domcompare` each guide against main (normal and `--kb`); viewer sizes, normal and `dvkb`;
walkcheck / pagecheck; saved state from the old build carries over (EI tracker starter, PS walk ticks).

## Workflow (agreed with the user 2026-10-23)
Every step is its own Sonnet session (effort medium), reading this file first, so each context stays small: long
sessions cost mostly cache reads, since each tool call re-reads the whole context.
1. **A, template:** a Sonnet session builds it straight from section A on a new branch `worktree-consistency` from
   `main` (worktree `.claude/worktrees/consistency`). Ends with `assemble.py`, `domcompare` of all four guides
   against main, and the guides on the phone preview. The user tests, fixes happen in the same session.
2. **B, per hack:** four Sonnet sessions (or subagents), one per hack, each a tab branch off `worktree-consistency`
   (`worktree-consistency-<hack>`), touching only `hacks/<hack>/`. They can run at the same time. Merged into
   `worktree-consistency` one at a time, rebuilding `data.json` and `dist` after each. PS (walkthrough regrouped into
   cap splits) is the biggest.
3. **C, items:** a Sonnet decide session with the user (mockup of the shared box set and row style, in the Thor
   frame), writes `plans/items-standard.md`; then a Sonnet build session (template + the four item extracts).
4. **D, audit:** a Haiku agent (section D), pass / fail with evidence.
5. **Merge:** an Opus session merges `worktree-consistency` into `main` after D passes and the user has checked on the
   phone / Thor. Opus only for merges or anything that turns out unclear.
Each session ticks off its part here (Status below) and says which step is next.

## Status
- 2026-10-23: scoped, questions answered. Next: step 1 (A, template).
