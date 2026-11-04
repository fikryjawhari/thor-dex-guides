# Progress

Current state and what's left, one line each. The detail behind a line is in PROGRESS-DETAIL.md: read only the
section the line names. History: git, each hack's `notes.md` → History, `template/README.md` (design decisions).

## Guides on `main` (live: https://fikryjawhari.github.io/thor-dex-guides/)

| Guide | Version / mode | Family | On the Thor |
| --- | --- | --- | --- |
| Emerald Imperium | 1.3.1 | pokeemerald-expansion (GBA) | before the item / move pages |
| Hardlove Gold | 0.8.7 | hg-engine (NDS) | before the item / move pages |
| Photonic Sun | 2.38 Rebalanced, EV-less | 3DS | before the item / move pages |
| Eternal X | 2.67 Rebalanced | 3DS | before the item / move pages |
| Blaze Black 2 Redux | 1.4.1 Complete EVless / Challenge | Drayano (NDS) | maybe not in the library yet |
| Unbound | 2.1.1.1 Expert | CFRU (GBA) | maybe not in the library yet |
| Radical Red | 4.1 Hardcore | CFRU (GBA) | not yet |

One template, one extract layout (`tools/extractlib.py`), one schema (`tools/schema.py`), one Items standard
(`tools/itemstd.py`), the damage calc with save import on every guide. Decided where: `template/README.md` (template,
UI, calc page), `tools/calc/README.md` (engine), `template/calc/readers/README.md` (save readers), each hack's
`notes.md` (data, Damage calc, In-game tests). Families and what each shares: DETAIL → Hack families. Last merges:
DETAIL → Recent merges.

**Shipping a guide update:** push `main`, wait for the Pages Action, then on the Thor long-press the guide → Update
from link (same library id, saved state kept).

## Open (DETAIL → Open has each in full)

1. Thor / in-game tests of everything since the consistency pass (item, move, ability pages, calc fight state,
   sprites as CSS classes, gauntlet carry, Find trainer by location, Hardlove's AI odds / switch-ins / Field → AI:
   `hacks/hardlove-gold/notes.md` → In-game tests). Calc tests seen on the Thor before 2026-11-03 were on a broken
   layout (Chrome 109 dropped `@scope`, fixed): redo them after updating each guide.
2. Real save tests: one real import per guide on the Thor, compared with PKHeX.
3. Footer credits: `cfg.credit` hook exists, no guide sets it. Agreed, not done.
4. Skill re-upload once its references cover the item pages (5).
5. New-guide scaffold for the item data (`tools/new_hack.py` stubs).
6. T3 worktree setup hook (the user, in T3's project settings).
7. Source updates: SoulGold's data changed since 2026-10-24 (re-fetch before its guide); hzla `gen789.js` pin kept.
8. Small data leftovers: missing item icons, tutor-card parsing, a `nomerge` flag, an unused CSS rule.
9. Radical Red follow-ups: in-game checks, one real `.srm` import, Gulp Missile, Chillet's sprite.
10. Check tiers past ~10 guides (the last check-speed follow-up).
11. Calc: range compare: noted for later (space); `plans/calc-range-compare.md`.
12. Encounter box standard across guides: `plans/encounters.md`. Template unit done on `worktree-encounters`
    (2026-11-04: `tools/encstd.py`, template, scenarios `encounters` + guide-update 28c, Eternal X converted); next the
    guides session (one talkable agent per guide; the plan's "Template unit: done" says what each needs).
13. Radical Red encounter / Locations / walkthrough fixes from the playtest: in 12's Radical Red unit.

## Next session

- **Encounters (Open 12):** branch `worktree-encounters` (worktree `.claude/worktrees/encounters`), not merged; Eternal X
  in the standard, the other six unchanged (domcompare: identical). Next: the guides session from the plan, each guide
  a tab branch `worktree-encounters-<hack>` off it. Phone preview: `encounters-eternal-x.html`.

- **Unpushed on `main` (the user's call, 2026-11-04):** one calc button per trainer (row preview line / card name
  line; the per-Pokémon Calc vs is gone), gate clean. It ships with Open 12 / 13 as one batch: don't push before.
- **Calc plans done** (merged 2026-11-03): gauntlet carry (every guide with chains), Hardlove AI (odds, switch-ins,
  doubles, Field → AI), Find trainer by location, gate hardening (`-X utf8`, text lint, accept lists, auto-baseline,
  build freshness). Next: the user's Thor / in-game tests (Open 1), then range compare (Open 11) or a new guide.
- **Next guide:** say which hack. Sources-only start:
  `.agents/references/new-guide-sources.md`; the whole procedure: `.agents/references/new-guide.md`.

## Elsewhere in DETAIL

Decided while the user was away (2026-11-01 / 02) · Decisions (EV-less 3DS, Pages, sprites, sources, credits) ·
Viewer sizes · Testing on the Thor (adb, CDP) · Environment · Source data (hacks with no guide yet).
