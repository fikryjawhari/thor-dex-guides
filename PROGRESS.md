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

1. Thor / in-game tests of everything since the consistency pass (item, move, ability pages, calc fight state ...).
2. Real save tests: one real import per guide on the Thor, compared with PKHeX.
3. Footer credits: `cfg.credit` hook exists, no guide sets it. Agreed, not done.
4. Skill re-upload once its references cover the item pages (5).
5. New-guide scaffold for the item data (`tools/new_hack.py` stubs).
6. T3 worktree setup hook (the user, in T3's project settings).
7. Source updates: SoulGold's data changed since 2026-10-24 (re-fetch before its guide); hzla `gen789.js` pin kept.
8. Small data leftovers: missing item icons, tutor-card parsing, a `nomerge` flag, an unused CSS rule.
9. Radical Red follow-ups: in-game checks, one real `.srm` import, Gulp Missile, Chillet's sprite.

## Next session

- **Check speed (branch `worktree-check-speed`, 2026-11-02; not merged):** full audit from scratch 40 min (was
  ~3.5 h); unchanged guides / checks come from the result cache (`gate.py`, `tools/README.md` → Standard gates and
  Check timings). Sprites became CSS classes (`template/README.md` → Pokémon sprites): page opens 560 → 310 ms,
  domcompare-identical on every guide apart from that markup. Before merging: the user looks at the Thor (sprites on
  the list, Pokémon page, trainer cards, calc grids; first open feels faster?). Left, in order of payoff:
  1. Scenarios are 57 % of the work: every case runs in normal and `dvkb`; most never touch an input. Option: `dvkb`
     only for cases that use a number box / search / keyboard, plus a `dvkb` fit sweep per page (the 260 × 316 fit
     rule must still hold in both modes). Needs the user's yes: it is test design.
  2. A template change still runs everything on every guide (~5-6 min of pool time per guide): past ~10 guides,
     consider tiers (full set on EI + the guide the change came from; domcompare / consistency / fit on the rest).
  3. pagecheck / walkcheck assert only page errors and a jump bar; the rest is printed for a reader, with EI's box
     names. Turn the printed geometry into assertions, or drop what scenarios already cover.
  4. zoomcheck under load flaked once (Unbound, 1 stale bar of 475; passed alone): an in-check retry like jumpcheck's.
- **Next guide:** say which hack. Sources-only start: `.agents/references/new-guide-sources.md`; the whole procedure:
  `.agents/references/new-guide.md`.

## Elsewhere in DETAIL

Decided while the user was away (2026-11-01 / 02) · Decisions (EV-less 3DS, Pages, sprites, sources, credits) ·
Viewer sizes · Testing on the Thor (adb, CDP) · Environment · Source data (hacks with no guide yet).
