# Progress

Guides for Dex Viewer, split out of the app repo (`thor-dex-viewer`, private) on 2026-10-19. That repo's
`docs/PROGRESS.md` keeps the app's history; this file holds everything on the guide side. Older guide history before
the split is in that repo's git log.

## Current status

- **Phase 1 of the split (this repo, the shared template): done 2026-10-19, pushed to GitHub.** See "Split results".
- **Live on GitHub Pages** (https://fikryjawhari.github.io/thor-dex-guides/) and **Phase 2 passed on the Thor**
  (2026-10-19): both guides were added to the Dex Viewer library from their Pages URLs and the old USB-copied entries
  deleted. Details in the app repo's `docs/PROGRESS.md` → Phase 2 results.
- **Shipping a guide update:** push here, wait for the Pages Action, then on the Thor long-press the guide → Update from
  link. Same library id, so saved state (tracker, ticks, calc) is kept. No USB copying.
- **Split UI on every list page (2026-10-19), merged into `main`:** walkthrough, Locations, Trainers, Items
  (collapsible boxes, sticky headers, rail jump buttons, bottom collapse bars, trainer cards with Collapse). Checked
  in headless Chrome, `domcompare` against the old `main` and on the Thor (EI). See "Walkthrough split UI" below and
  `plans/split-ui.md`. The user is now playing with it and will report issues.
- Guides: Emerald Imperium (1.3.1, GBA), Hardlove Gold (0.8.3, NDS). The other hacks in `hacks/` have sources
  compiled (`SOURCES.md`, re-fetch into `.src/`) but no guide yet. **Their source data was checked and completed on
  2026-10-19** (see "Source data check"): every one now has full dex, moves, abilities, wild and trainer data on
  the PC. Next: Photonic Sun and Eternal X guides.
- **Damage calc with save import: planned 2026-10-20, not started** (`plans/damage-calc.md`). `@smogon/calc` (MIT) as
  the engine; our own save readers for Gen 3, 4/5 and 6/7, written from notes on hzla's Dynamic-Calc-Decomps (no
  license: learn the formats, don't copy the code; the user decided not to ask hzla) and PKHeX. Also looked at PokeDaisy
  (GPLv3 GBA emulator with a live companion; covers EI, Radical Red, Unbound, SoulGold): read-only reference; the
  user may push the GBA guides back since the DS/3DS hacks have no such tool. Not decided.
- **Photonic Sun guide built 2026-10-19 and merged into `main`** (not on the Thor yet). See "Photonic Sun guide"
  below and `hacks/photonic-sun/notes.md`.
- **Photonic Sun pass 2 (the user's review), started 2026-10-20** on branch `worktree-photonic-sun-changes`
  (worktree `.claude/worktrees/photonic-sun-changes`, committed, not merged). Everything is in
  `plans/photonic-sun-pass2.md`: the feedback per tab, what's decided (Locations design A, doc maps, move page C,
  ability slots, two template bugs) and what's done. Locations: built (round 1). Trainers: built (rows per battle,
  partners, level caps with battles left, Aether Paradise box); round 2 (`plans/trainers-show-switch.md`: island Show switch, place "teams n/N", view anchoring) built
  2026-10-20 (template, every guide). Fix round 1 the same day (user's look on the phone): the island header no
  longer pins (only the Show row and the place header), and the pinned place header paints `--bg` 5px above itself so
  no gap shows under the Show row (headless checks said flush; the phone showed gaps). Not yet tested on the phone /
  Thor nor the full audit after the fix (show-check.mjs passes; domcompare not rerun after the fix). **Next: a general
  UI session** on reading room at 260 × 316 (the user: you can't see one full Pokémon under the pinned headers; search
  bar, Show row, place header and the two-line place header with its cap tag all cost height), then test and merge.
  Walkthrough (`plans/ps-walk.md`: empty stops are grey signs) and Items (`plans/ps-items.md`: 7 boxes, Shops by kind, Held Items by class, Stats and Abilities, game order, box Expand / Collapse all) built 2026-10-21 (tab branches merged in, template, every guide); audit passed (domcompare: only walk, items and the Photonic Sun Mega pages differ). Not yet tested on the phone / Thor. Open: Mega pages lost their stone place ("Venusaurite: Battle Tree" is now "Mega Stone: Venusaurite."), as the spec allowed; the user to confirm. The worktree has its own git-ignored
  `hacks/photonic-sun/.src/` (copied from main's, without the 887 MB `romfs-dl/`).

- **Trainer cards / reading room / page cleanup: built, tested by the user and merged into `main` 2026-10-22 (main not
  pushed yet: the search template changes go first).** MGM now picks the one speed a card shows (with EVs, or
  without when ticked; the EVs line hides under MGM); ability · item · nature line stays 12 px, ability white. Spec: `plans/trainer-cards.md`
  (template for every guide + Photonic Sun walkthrough data); all of it is in. Phone preview:
  `trainer-cards-build.html` (Photonic Sun in the Thor frame). Built beyond the spec: a Pokémon's name truncates
  before its level does; `D.ARO` (optional Locations order) so Photonic Sun's new Hau'oli Outskirts area sits at the
  end of AR and saved trackers keep their slots; TM01 ("Route 1 - Trainer School") files under the new Trainers'
  School stop; the Trainers tab still lists Hiromi to Emily under Route 1 (Hau'oli Outskirts) (the spec only moved
  them in the walkthrough). Checks: no page errors anywhere (domcompare EI / HG normal and kb, walkcheck, pagecheck,
  all viewer sizes normal and dvkb); `ps-trainers/show-check.mjs` reads the new `n/N | cap` button; its "mixed setup"
  step fails at 260 (a scripted tap lands after the page moves; the baseline build fails the same step at 538, and
  real taps on a pinned place header work). Photonic Sun's `dex-rebalanced.json` in the main checkout's `.src/` is
  older than the extract (no `sosBy`, so SOS allies vanish): regenerate it with SOURCES.md's `ctr_dex.py` line
  before rebuilding there.

- **Eternal X guide: first build done 2026-10-22** on branch `worktree-eternal-x` (worktree
  `.claude/worktrees/eternal-x`, not merged, not pushed); audit passed; awaiting the user's review on the phone
  preview `eternal-x-build.html`. Template change for every guide: the player picker (`t.pl`). Notes:
  `hacks/eternal-x/notes.md`. Decisions (Rebalanced only, Viola nerf as a second card, a player picker for
  Serena / Calem) and the stage checklist: `plans/eternal-x.md`. The romfs stays in the main checkout's
  `hacks/eternal-x/.src/romfs-dl/`.

- **Consistency pass over the four guides: scoped 2026-10-23, not started.** Everything (the user's review per tab,
  decisions, the jobs A template → B per hack → C items → D audit, and the agreed workflow: one Sonnet session per
  step, Haiku audit, Opus merge) is in `plans/consistency-pass.md`; its Status section says which step is next.

## What's left, in order

1. ~~**Go live.**~~ Done 2026-10-19. Pages builds from the Action (`.github/workflows/pages.yml`); `dist/` is never
   committed. Commits here use the GitHub no-reply email (repo-local `git config user.email`), not the user's Gmail.
2. ~~**App side, Phase 2.**~~ Done 2026-10-19 (see Current status). Update from link was only exercised with unchanged
   content; the first real guide update is its first test with new content.
3. ~~Shared sprite set~~ **done and live 2026-10-19** (see "Shared sprite set results"); checked and merged into
   `main` (`94d0706`), see "Sprite branch handover". Left: the footer credit (step 7).
4. ~~**Split UI**~~ (walkthrough, Locations, Trainers, Items) **done and merged 2026-10-19** (mockup:
   https://claude.ai/artifact/GmXrq1ATz3jBbi6Q6N5iQH). Open items:
   - **Text size:** the bottom collapse bars are re-checked on toggles, window resizes and content-visibility renders,
     not when Dex Viewer's A−/A+ text zoom changes (it scales text, not the viewport, so no resize fires). After a
     zoom change a bar can be missing or extra until the next toggle. Likely fix: a ResizeObserver on a hidden 1em
     probe element calling `barsSoon()` (and check how the app applies text zoom, in the app repo).
   - **Search** (the user is overhauling it): done and merged 2026-10-19, the full-window search on every device and
     results with actions that jump or search (see Search fix and full-window search). A trainer result now jumps to
     its card on the Trainers page. Not checked on the Thor yet; the user may have more search problems to raise.
     Round 2 (2026-10-22, branch `worktree-search`): see Search round 2 under Search fix and full-window search.
   - Hardlove on the Thor was not checked over CDP (only EI was open in the viewer); it passed headless at Thor sizes.
   Details: `plans/split-ui.md`.
5. **Skill update:** `rom-hack-offline-dex` still describes hand-building one file from the EI template. Point it at
   this repo's flow (CLAUDE.md → Making a new guide). Can happen with the first new guide.
6. **New guides** (one session each, here; Photonic Sun done on its branch, Eternal X next): CLAUDE.md → Making a new guide. On
   the PC every `.src/` is complete (checked 2026-10-19); elsewhere re-fetch with each `SOURCES.md`. Photonic Sun
   and Eternal X fall back to the user's vanilla Azahar dumps (PC only). "Source data check" says which file is the
   dex source per hack; the extract step turns it into `data.json`.
7. Later: footer credits (`cfg.credit` hook; hack authors from `SOURCES.md` plus the sprite set's credits in
   `sprites/SOURCES.md`), the update checker (`plans/update-checker.md`; run by hand, the user doesn't need it
   scheduled), the damage calc with save import (`plans/damage-calc.md`).

**Parallel sessions:** one session in each repo at a time is safe (separate folders and git histories). The app
repo has nothing open now; come back to it only for an app bug or feature. Avoid two sessions in this repo at once: the template is shared, so they'd
clash.

## Photonic Sun guide (2026-10-19)

Branch `worktree-photonic-sun`. `uv run python -I hacks/photonic-sun/extract/build.py` then `python assemble.py`.
Everything about the data (sources, rules, conflicts, schema, storage prefix `ps`): `hacks/photonic-sun/notes.md`.
- **Rebalanced version** (the only romfs fetched; its Standard twin would need its own zip and dex extract).
- Game data for every number; docs for wild methods, specials, shops; **Bulbapedia's Ultra Sun / Ultra Moon
  walkthrough** for trainer places and story order (new `tools/bulba_pages.py`; the game data has no places). 488 of
  513 trainers placed; 35 walkthrough parts are the splits; Trainers boxes are story chapters. No level caps.
- Template change (shared): the Trainers header hides "Level caps" when `TR.caps` is empty. `domcompare` vs `main`
  (EI and Hardlove, normal and `--kb`): 0 differing routes, 0 page errors.
- Checked headless at 260 × 316, normal and `dvkb`: every route (2,422) renders with no page errors;
  `pagecheck.mjs` and `walkcheck.mjs` pass.
- **Found, not fixed (template, every guide):** move pages whose accuracy is "Never misses" are 277 px wide at 260
  (the Power / Accuracy / PP / Priority table; EI has 178 such pages too), and a "Crabominable" + "evo/breed" tag row
  makes two Photonic Sun ability pages 267 px. Needs a small layout fix (mockup first).
- Open: check on the Thor; the user to try it via the phone preview artifact; totem battles are a game doc, not
  trainer cards (Totem Battles.pdf would need a positional parse); footer credit still to do (Bulbapedia and Serebii
  should be credited with the hack author).

## Source data check (2026-10-19)

The user copied every hack's `.src/` from the old repo onto the PC. All 2,000+ files open cleanly (zips, xlsx,
PDFs with text layers, JSON, no saved error pages) and every count in the `SOURCES.md` files matches. What was
missing, and is now fetched or extracted (details and commands in each `SOURCES.md`; Python deps via `uv sync`):

| Hack | Dex source (stats, abilities, learnsets, evolutions) | Moves | Wild | Trainers | Filled in today |
| --- | --- | --- | --- | --- | --- |
| Photonic Sun | `.src/dex-rebalanced.json` (game data) | same | same (Gen 7 tables, method from PDF order) | `trainers-rebalanced.json` | `tools/ctr_dex.py`; TMs from `code.ips` |
| Eternal X | `.src/dex-rebalanced.json` (= insanity's) | same | same, by method with rates | `trainers-<variant>.json`, rival files | `ctr_dex.py`; 6 Insanity archives were never extracted |
| Meissa Moon | `.src/dex.json` (game data) | same | same | `trainers.json` (natures, EVs) | romfs zip fetched (915 MB); docs only cross-check |
| Navy Sapphire | `.src/dex.json` (game data) | same | same, by method with rates | `trainers.json` | romfs zip fetched (151 MB) |
| Renegade Platinum | `romhackdex/pokedex/` | `romhackdex/moves.json` | `WildPokemon.txt` (+ RomHackDex) | `TrainerPokemon.txt` | RomHackDex mirror; 491/491 changed species match the docs |
| Blaze Black 2 Redux | `romhackdex/pokedex/` **but stats from `Pokemon Changes.txt`** | `romhackdex/moves.json` | `Wild Area Changes.txt` | `Trainer Changes.txt` | RomHackDex mirror; it shows vanilla stats for 188 changed species |
| HeartGold Retiled | `hg-engine/species-pinned.json` | `hg-engine/pinned/Moves.c` | `source/Encounters.c` + guide | `source/Trainers.c` + guide | ability text (banks 720/722) |
| SoulGold | `data/species.json` + `data/species-details/` | `data/moves.json` | `data/encounters.json` | `data/trainers.json` | 959 species-details files (the learnsets) |
| Radical Red | `romhackdex/pokedex/` | `romhackdex/moves.json` | RomHackDex | the two sheets | move priority and descriptions |
| Unbound | `romhackdex/pokedex/` | `romhackdex/moves.json` | RomHackDex | the three sheets | move priority and descriptions |

Rules that came out of it:
- **3DS hacks: the game data is the source, the docs are the check.** Buffel's PDFs are change lists with stat
  rows as images; his `Level Up Moves` txt files match the extracts (970/975 and 798/798). Where docs and game
  disagree the game wins ("Doc says ..."), e.g. Photonic Sun's PDF lists ~20 moves the game doesn't teach.
- **HG Retiled:** never hg-engine `main`. Retiled's repo only carries the tables it changes and has no full fork;
  species/moves come from the last upstream commit before its release (`dcbe17a`). Reading the user's patched ROM
  would settle it exactly (needs an NDS NARC reader; not done).
- Open questions for the build sessions: Gen 7 wild tables have no method field (label them from the docs);
  BB2R has Complete and Classic versions (the doc has both ability sets; pick Complete like RomHackDex, or ask);
  static and gift encounters are in the docs, not extracted from the 3DS games yet.

## Walkthrough split UI (2026-10-19)

The user's walkthrough wishlist, mocked up over eight rounds (https://claude.ai/artifact/Kp64pS46UwPRSsyWVao1Zs) and
built into the template. **Every decision, the rejected options and how it's built: `plans/split-ui.md`.** In short:
Guide info → Next step → Starter → Expand / Collapse all at the top; sections Checklist / Encounters / Items /
Trainers inside each stop; stop and section headers stick under the search bar; collapse bars at the bottom of blocks
taller than the window; header taps never scroll; jump buttons in the rail. EI gets a starter picker that sets the
Littleroot encounter. The item name column stays at 38% (sizing it from the longest word is possible; not done).
- Checked (headless Chrome, 260 × 316, both guides, normal and `dvkb`): `tools/mockup/walkcheck.mjs` (taps, bars,
  jumps, Next step, starter, state after a reload, other routes) passes with no page errors. `domcompare` against
  `main` (EI 2690 routes, HG 2481, both modes, rail buttons ignored with
  `--ignore='<div class="rjump"[\s\S]*?</div>(?=</nav>)'`): only `#/walk` differs, no page errors.
- Locations, Trainers, Items followed (`plans/split-ui.md` → Locations, Trainers, Items). Final checks 2026-10-19:
  `pagecheck.mjs` and `walkcheck.mjs` (both guides, normal and `dvkb`); `domcompare` against the old `main` (both
  guides, both modes): no page errors; differing routes are only #/walk, #/locs, #/trainers, #/items, every #/l/ and
  #/tr/ route, and #/p/ pages whose "Used by trainers" card (new box names) or location table (EI eggs and gift
  houses) changed: with those two ignored (`--routes=#/p/`), all Pokemon pages are identical. On the Thor (EI, over
  CDP, at its maximised 538 × 425 and emulated 260 × 316): places pin flush under the search bar, trainer Collapse lands
  under the pinned headers, no page errors. The previous builds are on the device as `index.html.bak-main` in each
  guide folder.
- Saved state: `LS.walk` gains `s` (sections) and `o.gi`; existing ticks, open splits and closed stops carry over.

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
  Imperium: identical too (43 flagged by the sweep, all identical rechecked one by one; the five list pages
  compared in full). Keyboard (`dvkb`) mode: identical on every trainer page of both guides, the trainer list, and
  387 EI / 119 HG Pokémon pages. Recheck a flagged route alone with `--routes==#/exact/route`.
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
- Sprites: since 2026-10-19 both guides use the shared set (see "Shared sprite set results").

## Sprite branch handover (2026-10-19)

**Finished 2026-10-19: merged into `main` and live.** Branch `worktree-sprites` is merged; its worktree is removed.
Steps as they were done:
1. ~~Merge `main` into the branch, rebuild.~~ Done 2026-10-19 (`dadc3a2`, pushed). Baseline for step 2: `git archive main` into
   a temp folder and `python assemble.py` there (no extra worktree needed).
2. A full `domcompare` of both guides against builds from before these changes (`git stash`-free: build the
   pre-sprite commit `f9caad4` in a temporary worktree) for page errors. Expect differences only where sprites and
   type tags render. `domcompare` was sped up for this (2026-10-19): routes are split over parallel tab pairs
   (`--jobs`, default a quarter of the CPU threads; on the laptop 4 beat 6 and 8), it waits on DOM quiet instead of
   repeated snapshots, picks a free port (so both guides and both modes can run at once), and exits 0 only when
   identical. Sprite images are blob URLs and compare equal, so only the type-tag class shows: pass
   `--ignore=" bt"` and anything still flagged is unexpected. Laptop: 284 EI ability routes 52 s → 15.5 s. Not yet
   run in full: it runs on the user's PC (fresh clone). **Step-by-step runbook, including PC setup, expected
   differences and how to read the output: `plans/sprite-checks.md`.**
   **Done 2026-10-19 on the PC** (baseline: `git archive main` built in a temp folder; all four runs at once with
   `--jobs=2`, 126 s in total):
   - Emerald Imperium, 2690 routes: normal swept in 69.9 s, `dvkb` 68.8 s. 0 flagged, 0 differing, 0 page errors
     (old or new), 0 no-hashchange / never-settled.
   - Hardlove Gold, 2481 routes: normal 49.9 s, `dvkb` 49.0 s. 0 page errors. 30 routes differ in both modes, all
     from Bounsweet, whose `#spr` entry on `main` was empty and now has art (its own page plus the move/ability
     lists and `#/` that show it). With `--ignore=' style="background-image:url\(blob:[^)]*\)"'` added (removes every
     sprite style, so sprite presence is not compared), both modes are identical (27.6 s at 4 jobs). Bounsweet was
     the only species missing a sprite on `main` in either guide, and the branch has none missing, so there are no
     `sprph` placeholders.
   - `domcompare` fix found while timing it: Chrome's IPC flooding protection stalled each tab for ~10 s every 100
     routes (2 history updates per route, 200 allowed in 10 s). Now launched with
     `--disable-ipc-flooding-protection`. Timing method and results: `tools/README.md` → Timing `domcompare.mjs`
     (4 jobs is still best on the 16-thread PC, ~3× one job).
3. ~~Look on the Thor, then merge into `main`.~~ Done 2026-10-19. The branch builds were copied over both guides'
   `index.html` on the Thor and checked over CDP inside the viewer (so keyboard mode) at 260 × 316: list, three
   Pokémon pages (Bounsweet, Pikachu, Charizard), trainer list and two trainer pages, locations and one location,
   items, walkthrough, a move page, calc, full-window search. 0 page errors, width 260 on every route, every sprite
   has art, no placeholders; screenshots looked right (box fill, black text on light types). Merged (`94d0706`),
   Pages deployed. The live files differ from a local build only in the sprite PNGs' compressed bytes (CI's Python
   zlib vs the PC's 3.14); every sprite decodes to the same pixels and the rest is byte-identical. The Thor copies
   are the local build, so Update from link is a no-op visually. Worktree removed.
   Thor notes: CDP screenshots hang while the screens are off (`input keyevent KEYCODE_WAKEUP` first); the viewer's
   WebView serves only the open guide, and `OverlayService` isn't exported, so the user has to open the other guide.

## Shared sprite set results (2026-10-19)

- `sprites/png/<key>.png` (1593 PNGs, 1.2 MB) + `sprites/index.json` (1666 keys, 73 of them `same` as another key),
  built by `tools/sprites_pee.py` from pokeemerald-expansion `master` `73b3fbe` (2026-10-14). Every national dex
  number 1–1025, every Mega through Legends: Z-A and the Mega Dimension DLC, Primals, regional forms, Gigantamax,
  gender differences and the cosmetic forms. Keys come from the expansion's species constants (`sprites/README.md`).
- Checked: no problems reported by the script, contact sheets of all 98 Megas/Primals and a random 120 (palettes and
  transparency right), `assemble.py` builds both guides byte-identical to before (they still use their own art).
- hg-engine (`f4fca05`) was rejected: Bulbasaur placeholders for every Gmax, 15 Z-A Megas, Terapagos and more.
- `assemble.py`: keys come from `tools/sprite_keys.py` (dex number + name; `P[].sk` or a `hack.json` `sk` override
  win). The hack's `sprites.json` (now only its added forms) wins, else the shared set, else reported. Only used
  sprites are inlined. No template change (`#spr` stays keyed by species id).
- **Both guides switched to it.** Emerald Imperium: 1247 shared + 28 own (its added Megas, Primal Dialga/Palkia,
  Pikachu Surfing/Flying); 1154 of the 1247 were pixel-identical to its old art, the rest expansion touch-ups.
  Hardlove Gold: all 986 shared, its `sprites.json` deleted. EI 2.75 → 2.56 MB, HG 2.42 → 2.32 MB. Both are
  live and on the Thor (2026-10-19).
- **Box fill (the user, 2026-10-19: "i like the box fill"):** `assemble.py` crops every inlined sprite, shared or
  own, to its visible pixels, padded to a square (centred across, standing on the bottom edge), so small Pokémon fill
  their box like Hardlove's old art. The PNGs in `sprites/` stay full 64×64 frames; removing `cropped()` undoes it.
  Trade-off accepted: no relative size (Pichu and Charizard fill the same box), and small Pokémon look blockier at
  112 px.
- **No-sprite placeholder (template, the user 2026-10-19, from the search mockup):** a species with no sprite shows a
  circle in its primary type's colour with the name's first letter, instead of a blank square. The letter sizes
  with the circle (container units) and is coloured like that type's tag.
- **Type text colour, per type (the user, 2026-10-19, from mockup https://claude.ai/artifact/UHV1nLRRFNr8rdTSYZP8Nm):**
  type tags and placeholder letters are black on Normal, Electric, Ice, Fighting, Flying, Bug, Rock, Steel and Fairy
  (white is under 3:1 on them; Ice 1.85) and white with the shadow on the other nine, the same in both themes
  (`BT` / `btc()` in dex.js, `.ty.bt` in dex.css). Rejected: all white (as before) and "black in light mode" (Ghost
  and Dark would need white anyway: black on them is 2.7). Checked in a test copy at 480 px, dark and light.
- Re-fetch and credits: `sprites/SOURCES.md`. The expansion has no licence file; we credit it and the sprite resources
  its CREDITS.md lists.

## Decisions

- Public repo, served by GitHub Pages (built by the Action from `dist/`, nothing built is committed). The app repo
  stays private.
- Guides stay single self-contained HTML files that work offline with or without the app. Shared sprites are **not**
  shipped with the app (the user, 2026-10-19).
- **One shared sprite set for every guide: pokeemerald-expansion** (2026-10-19; hg-engine still had ~100 placeholder
  forms). GBA, NDS and 3DS guides all use the same 64×64 DS-style art, and each guide inlines only the species it
  has. A hack keeps its own art only for forms it adds (the user: "use these sprites across the board", no per-hack
  sprites unless the hack adds custom forms). Recolours of standard forms aren't detected; the docs would flag them.
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
- Environment: `gh` CLI installed and authenticated (2026-10-19); use it for GitHub. `python -I`
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
**Full-window search: built in Emerald Imperium (2026-10-18), everywhere since 2026-10-19 (was viewer only).** Mockup: https://claude.ai/artifact/3T5mc2eQd4mcGe19jkkNiT (private Design canvas, sample data). The user dislikes that canvas type ("how do I interact?"); next time use a plain HTML artifact like the keyboard mockup. The user called searching everything "perfect": it also fixes filters and Pokémon being separate lists.
   - Tapping the search box opens `SR`: a fixed layer over the guide (rail included, z 19, under the keyboard's z 20). It has a strip with ‹ back, the query, × clear and ⌄ hide/show keyboard; results; and the `KB` keyboard in `full` mode (4 rows: QWERTY / ASDF / 123 Z–M ⌫ / Space + Done; 123 swaps the top row for digits; keys 37 px at 260 × 360).
   - **Result order (the user's rule):** the current page's section first, in full (up to 100, then "Show all"). Then the others in the order Pokémon, Filters, Locations, Trainers, Items, Walkthrough, 8 each until "Show all". Detail pages count as their section (Pokémon/move/ability → Pokémon, trainer → Trainers); Calc counts as Pokémon.
   - Picks: Pokémon / trainer → their page; filter → added as a chip on the Pokémon list; location → `#/l/…` opened; item / walkthrough stop → that list searched for its name. Done → the query goes into the page's search box, as before (on a detail page, the section's list, via `UP`). Recent picks (`eirecent`, 6) show when the query is empty. The old `#sugg` dropdown is off everywhere (`suggestions()` only hides it).
   - Checked over CDP on the Thor at 260 × 317: ordering on a Pokémon page and a trainer page, picking, Done, Back, recents, hide keyboard, plus a screenshot. The user has since used it by hand: "it was good".
   - **Every device (2026-10-19):** the search box is always the `searchDisp` button opening `SR`, so phone and laptop
     browsers get the same global search to test with. Only the typing differs: outside the viewer (`!INV`) the strip
     holds a real `<input class="sq">` focused on open (the device's own keyboard; Enter = Done, Esc = back, no ⌄
     button); in the viewer (or `dvkb`) it's the `KB` keyboard as before. Checked headless at 260 × 316 and 1280 × 800
     on both guides (order, Enter, Esc, pick, recents, no errors); domcompare vs main, normal and `--kb`.

**Search anything, results with actions (2026-10-19, merged; the user signed off mockup round 1: "Looks good").**
Mockup (the real builds in a frame at viewer sizes): https://claude.ai/artifact/BHLgSfusR5DHDPXecLkqzy, built with
`python -I tools/mockup/pages.py . <out.html> search-outer.html`. Phone previews (full builds, republished each round):
EI https://claude.ai/artifact/5qHALD2XdcdZvNFMpZKZv2, Hardlove https://claude.ai/artifact/5UajWcvvCzYfgXH22HH7zP.
The user's rule ("option B"): picking a result jumps to it or searches with its full name; it no longer becomes the
query. Typing + Enter / Done (or the first row, `Search "x" in <page>`) searches the current page for the raw text,
and the list pages keep that search across tabs.
   - Each result is a thing with action buttons under it (`SR.acts`), the current page's first; tapping the row does
     the first. Pokémon: Dex (opens the entry) · Trainers · Places · Walk (search that page for its full name). On the
     Pokémon tab a Pokémon always opens its Dex entry. Place: Places (jump, `#/l/`) · Walk (jump to its stop, or search
     the walkthrough when it has several visits). Walkthrough stop: Walk (jump) · Places. Trainer: Trainers / Walk
     (jump to its card, opened) · Full page. Item: Items (jump to its row) · Walk · Trainers (search; trainer search
     text now includes held items). Move / ability / type: Filter (Pokédex chip) · Move / Ability page.
   - Buttons only show where they find something. Trainer and item results match names only (no longer team members
     or item locations); places no longer list for a Pokémon found there (its Places button covers that).
   - A place's visits (`visits`): stops linked to it plus stops with its exact name (only the first visit links; EI
     Mauville ×4). On the walkthrough a place shows as one row per visit; elsewhere one place row.
   - Jumps (`SR.jump*`) set the page's open state, clear the search, render, then `land()` puts the target under the
     pinned headers and flashes it, re-scrolling each frame for 700 ms (the first scroll can stop short while
     content-visibility hasn't laid the page out). `SR.go(h, then)` runs `then` after the hashchange render.
   - Checked headless at 260 × 316 on both guides, normal and `dvkb`: row → search, Enter, Dex, stop / trainer (both
     pages) / item jumps land under their headers, item → trainers holding it, recents, no errors.

**Search round 2 (2026-10-22, branch `worktree-search`; the user's two asks).**
   - *The search stays set* from page to page until its × clears it or you tap the rail tab you're already on (like
     tapping a place's n/N again). Pokémon, move, ability and trainer pages hide the bar (dex.css) but keep the query,
     so search Popplio, open its Dex entry, then Trainers still shows Popplio's trainers. Before, opening any detail
     page cleared it. Exception: a place link (`#/l/`, from a Pokémon page) still clears it, since it's a jump.
   - *Jumps were glitchy*, about 1 in 10 ending off screen on every guide (`tools/mockup/jumpcheck.mjs` reproduced it):
     a target deep inside a long box below the window sat inside a block content-visibility skips, counted at its
     400 px estimate, so the page ended above it and `land()` stopped at the bottom. `land()` now lays out the
     target's skipped ancestors for real while it runs (and opens any closed one, e.g. Prismatic Moon only). Also a
     trainer sharing a battle row (doubles; the row goes by the first trainer's key) wasn't found or opened: jumps
     open every trainer of the battle (`trMates`) and find the row by `data-ks` (`trRowOf`). Place jumps now use
     `land()` too (was one scroll); Back onto a place cancels it so the saved position wins (`landEnd`).
   - Checked headless at 260 × 316: jumpcheck 300 jumps per guide (PS, EI, Hardlove) 0 bad, PS `dvkb` 150 0 bad
     (before: 13–22 bad of 150); the search-stays flow; Back onto a place keeps its position. domcompare vs main,
     normal and `--kb`: only `#/l/` routes differ (land's flash and temporary inline style), 0 page errors.

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
- Environment: `gh` CLI is installed and authenticated (since 2026-10-19).
  `python -I` ignores `PYTHONIOENCODING`, so call `sys.stdout.reconfigure(encoding='utf-8')` when printing ♂/é.
