# Photonic Sun: Items tab (pass 2)

Branch `worktree-ps-items` (tab branch off `worktree-photonic-sun-changes`). Feedback: `plans/photonic-sun-pass2.md` → Items.
Mockup (real build, proposed data, Thor frame): https://claude.ai/artifact/WvhFG5Aa4htrr1VLvxqATt
Sources: `tools/mockup/ps-items/` (`model.py` = the rules below as code and the reference for the extract change,
`build.py`, `patch.js`, `panel.html`, `check.mjs`). Rebuild: `python assemble.py photonic-sun`, then
`uv run python -I tools/mockup/ps-items/build.py . <out.html>`.

**Status: waiting for the user's picks on the open choices.** Everything else below is the recommendation the mockup
shows; the user signs off, then the build starts. No template change is needed: boxes, yellow sub-headings (`r[4]`),
search and jump already do all of it. The build is `extract/items.py` (+ `walk.py` only if the walkthrough's item
sections need renaming) and notes.

## What changes (user's feedback → design)

1. **Shops: one row per item.** A box heading "Shops" with a yellow sub-heading per shop; a row per item (name; the
   text is the item's kind: "Poké Ball", "evolution item"...). The Pokémon Center left clerk is one sub-heading, each
   item's text says when it appears ("from the start", "after two trials"); Seven's "Repel and Potion no longer sold"
   goes in the box note. Sources are unchanged: SHOPS and TRIALS in `items.py` (Vendor Changes.pdf).
2. **Held items by class** (like Hardlove Gold): one box "Held Items" with sub-headings Type boosters (incl. Plates),
   Battle gear, Gems, One-use items (Focus Sash, herbs, Red Card, seeds...), Pokémon-specific, Silvally Memories +
   Genesect Drives, Other held items. The class sets are in `model.py` (HELD). Each item appears once: evolution items
   stay in Evolution Items only, Power items move to Stats and Abilities, Exp. Share stays in Key Items.
   Shop-only items the Serebii list lacks (Flying Gem, Zoom Lens, Bright Powder, Binding Band...) are added as rows
   from SHOPS.
3. **Battle items: dropped** (X items, Dire Hit, Guard Spec., Roto Boost). No box, no search hits.
4. **One box "Stats and Abilities"** with sub-headings named for what they do: Raise stats (vitamins), Raise stats
   (wings), Power items (EVs while held), Lower stats (berries: Pomeg, Kelpsy, Qualot, Hondew, Grepa, Tamato; all
   Route 10), Hyper Training (Bottle Cap, Gold Bottle Cap), Abilities (Ability Capsule), Levels and PP (Rare Candy,
   PP Up, PP Max). Needs rows the extract drops today (it only reads the Vitamins and Hold Items categories): the six
   berries (Berries category), Ability Capsule and the Bottle Caps (Miscellaneous Items category).
5. **Fossils: dropped.** Checked: all 10 are Poké Pelago only in the item list.
6. **Key Items stay** (30 rows).

Box order: Shops, TMs, Mega Stones, Z-Crystals, Evolution Items, Held Items, Stats and Abilities, Key Items (8 boxes,
was 10). TMs, Mega Stones, Z-Crystals and Evolution Items rows are unchanged apart from the row text choice below.

## Open choices (the mockup's chips)

| Choice | Options | Recommendation |
|---|---|---|
| Shops grouping | By shop (sub-heading per shop) / by item kind (balls, healing, evolution items... with the shops in the row) | By shop: it is what the feedback described; search already answers "where do I buy X" |
| Held items | Sub-headings in one box / one box per class (14 boxes) | Sub-headings: 8 boxes instead of 14 at 260 × 316 |
| Order inside a heading | A to Z / game order (walkthrough stop of the earliest place the item can be had; wild holders by where the holder lives; unplaceable last) | Game order for Key Items and Stats and Abilities, A to Z for Held Items and Evolution Items (a 118-row list is searched by name). One switch for all is simpler: say if you want that |
| Row text | As now (one `;` run: places, "held by wild X" per species, shops) / compact lines: Found, Wild (species joined), Also, Shop | Compact: rows like Deep Sea Scale drop from 5 wrapped lines to 3 |
| Memories and Drives | 21 rows all "Ancient Poni Path" | Keep as rows under their sub-heading; start closed is not possible without template work |

## Walkthrough and search effects (checks for the build)

- `walk.py` files item rows under a stop from the section rows' text (`r[1]` places, not `held by`, not Shops). It
  skips `Shops` by name; keep that. Section names in the stop lists change (Battle Items and Fossils gone, Stats and
  Abilities new): check the walkthrough Items sections still read right and `np` (not placed) stays small.
- Compact text must still parse for `walk.py` (it splits `r[1]` on `;`): either keep `;` text in `r[1]` and add the
  compact form for display only, or update `walk.py`'s parsing in the same change. Decide at build.
- localStorage `psitems` stores open boxes by box index: the box list changes, so saved open state may land on another
  box once. Harmless; do not rename the key.
- Item search (`D.IT` rows) and the full-window search's item results use the new boxes.

## Checks

1. `python assemble.py photonic-sun`; Items tab at 260 × 316 and maximised, normal and `dvkb`: no page errors, width
   260 (the mockup run `check.mjs` already shows this for all variants).
2. Row counts: Shops about 130, Held Items about 118, Stats and Abilities 30, Key Items 30, no item in two boxes
   (except none), no Battle Item / Fossil row anywhere.
3. Every item from SHOPS has a row in Shops; every shop-only item that is not in the Serebii list has a row in its
   class.
4. `domcompare` against the guide branch: only #/items and the walkthrough's item sections differ.
