# Progress

Current state and what's left, one line each. The detail behind a line is in PROGRESS-DETAIL.md: read only the
section the line names. History: git, each hack's `notes.md` → History, `template/README.md` (design decisions).

## Guides on `main` (live: https://fikryjawhari.github.io/thor-dex-guides/)

| Guide | Version / mode | Family |
| --- | --- | --- |
| Emerald Imperium | 1.3.1 | pokeemerald-expansion (GBA) |
| Hardlove Gold | 0.8.9 | hg-engine (NDS) |
| Photonic Sun | 2.38 Rebalanced, EV-less | 3DS |
| Eternal X | 2.67 Rebalanced | 3DS |
| Blaze Black 2 Redux | 1.4.1 Complete EVless / Challenge | Drayano (NDS) |
| Unbound | 2.1.1.1 Expert | CFRU (GBA) |
| Radical Red | 4.1 Hardcore | CFRU (GBA) |

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
2. Real save tests: one real import per guide on the Thor, compared with PKHeX (the user 2026-11-06: Hardlove, Radical Red, EI read
   properly on the Thor; PKHeX comparison, and BB2R, Unbound, Photonic, Eternal X still open).
3. Footer credits: `cfg.credit` hook exists, no guide sets it. Agreed, not done.
4. Skill re-upload once its references cover the item pages (5).
5. New-guide scaffold for the item data (`tools/new_hack.py` stubs).
6. T3 worktree setup hook (the user, in T3's project settings).
7. Source updates: SoulGold's data changed since 2026-10-24 (re-fetch before its guide); hzla `gen789.js` pin kept.
8. Small data leftovers: missing item icons, tutor-card parsing, a `nomerge` flag, an unused CSS rule.
9. Radical Red follow-ups: in-game checks, one real `.srm` import, Gulp Missile, Chillet's sprite.
10. Check tiers past ~10 guides (the last check-speed follow-up).
11. Calc: range compare: noted for later (space); `plans/calc-range-compare.md`.
12. Encounter standard follow-ups: Thor checks, source assumptions to confirm in-game.

## Next session

- **Next:** fill encounters from a save (`plans/fill-from-save.md`), in a new session.
- **Pushed 2026-11-06, not yet on the Thor:** the guide adjustments (DETAIL → Recent merges) and Hardlove Gold 0.8.9
  (`hacks/hardlove-gold/notes.md` → History, Engine changes). Update each guide (Open 1).
- **Game-specific code outside the template:** proposal in `plans/hack-extensions.md`, undecided.
- **Next guide:** say which hack. Sources-only start:
  `.agents/references/new-guide-sources.md`; the whole procedure: `.agents/references/new-guide.md`.

## Elsewhere in DETAIL

Decided while the user was away (2026-11-01 / 02) · Decisions (EV-less 3DS, Pages, sprites, sources, credits) ·
Viewer sizes · Testing on the Thor (adb, CDP) · Environment · Source data (hacks with no guide yet).
