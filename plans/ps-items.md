# Photonic Sun: Items tab (pass 2)

Branch `worktree-ps-items` (tab branch off `worktree-photonic-sun-changes`). Feedback: `plans/photonic-sun-pass2.md` → Items.
Mockup (real build, proposed data, Thor frame): https://claude.ai/artifact/WvhFG5Aa4htrr1VLvxqATt
Sources: `tools/mockup/ps-items/` (`model.py` = the rules below as code and the reference for the extract change,
`build.py`, `patch.js` = the template change as a patch, `panel.html`, `check.mjs`). Rebuild: `python assemble.py
photonic-sun`, then `uv run python -I tools/mockup/ps-items/build.py . <out.html>`.

**Status: decided 2026-10-20 (the user's picks below). Ready to build.** The build is `extract/items.py` (+ `walk.py`
checks) and one small template change (box-level Expand / Collapse all). Template changes are one session at a time
and shared by every guide: do the template part in the guide branch's template slot (see CLAUDE.md → Parallel
sessions), then run `assemble.py` and `domcompare` on every guide.

## Design

Boxes (7, was 10): Shops, TMs, Z-Crystals, Evolution Items, Held Items, Stats and Abilities, Key Items.

1. **Shops, by item kind.** One box "Shops"; yellow sub-headings by kind: Poké Balls, Healing and repels, Evolution
   items, Power items, Held items, Stats and abilities, TMs, Other (`KINDS`, `kind()` in `model.py`). One row per item;
   the row text lists every shop that sells it, one per line ("Route 2 · Pokémon Center, right clerk", "Pokémon Center,
   left clerk (after two trials)"). Rows A to Z inside each kind. Box note: "From the Vendor Changes doc. Every Pokémon
   Center's left clerk sells more as you clear trials." Sources unchanged: SHOPS and TRIALS in `items.py`.
2. **Held Items: one box, sub-headings by class** (A to Z inside each): Type boosters (incl. Plates), Battle gear,
   One-use items (Focus Sash, herbs, Red Card, seeds, **and the two Gems**), Pokémon-specific, Silvally Memories +
   Genesect Drives, Other held items (6 sub-headings). Class sets in `model.py` (HELD). Each item appears once:
   evolution items stay in Evolution Items, Power items move to Stats and Abilities, Exp. Share stays in Key Items.
   Shop-only items the Serebii list lacks (Flying Gem, Zoom Lens, Bright Powder, Binding Band...) are added as rows
   from SHOPS.
3. **Battle Items: dropped.** **Fossils: dropped** (all 10 are Poké Pelago only). **Mega Stones box: dropped** (the
   user, 2026-10-20: the hack doesn't change their locations and the stones are generated in, so where they lie is
   irrelevant). `items.py` still sets `P.stone` / `P.sloc` for the Mega pages: keep the stone name, and drop `sloc`
   (the location line) from the Mega page too unless it shows something else; decide at build, checking where the
   template uses `P.sloc`. Walkthrough: no Mega stone rows in the stops any more.
4. **Stats and Abilities** (new, game order inside each sub-heading): Raise stats (vitamins), Raise stats (wings),
   Power items (EVs while held), Lower stats (berries: Pomeg, Kelpsy, Qualot, Hondew, Grepa, Tamato; all Route 10),
   Hyper Training (Bottle Cap, Gold Bottle Cap), Abilities (Ability Capsule), Levels and PP (Rare Candy, PP Up, PP Max).
   Needs rows the extract drops today (it reads only the Vitamins and Hold Items categories): the berries (Berries
   category), Ability Capsule and the Bottle Caps (Miscellaneous Items category).
5. **Key Items** stay (30), in game order.
6. **Order.** Game order: Key Items, Stats and Abilities, **TMs, Z-Crystals**. A to Z: everything else
   (Shops, Evolution Items, Held Items). Game order = the walkthrough stop of the earliest place the item can be had
   (`score()` for items by name, `row_score()` for rows that keep their own text: TMs, Z-Crystals);
   wild holders count by where the holder lives; items with no place go last (ties A to Z). TM names keep their
   numbers.
7. **Row text, compact lines** (Evolution Items, Held Items, Stats and Abilities, Key Items): `Found: places`,
   `Wild: species, species`, `Also: Festival Plaza...`, `Shop: Battle Tree (BP), Hau'oli City, PC right clerk`. Found
   places are in game order. TMs and Z-Crystals keep their current text.
8. **Expand all / Collapse all inside a box (template change).** Each box that has two or more sub-headings (Shops,
   Held Items, Stats and Abilities) gets the same two-button bar (`.seg.it-sp`) as the walkthrough and Trainers
   boxes, right under the box note and above the first sub-heading. Expand all opens every sub-heading of that box,
   Collapse all closes them; the pressed bar stays where it is (`segAll`); the open / closed state is saved like a
   tap (`LS.items` `s`). Not shown for boxes without sub-headings. The code is in `tools/mockup/ps-items/patch.js`:
   `segBar('it-sp')` inserted by `itemBox()` when the box has 2+ `details.sec`, and in the page's click handler
   `s.matches('.it-sp')? b.closest('.stop').querySelectorAll('details.sec')`. It applies to every guide (Hardlove
   Gold's held-item kinds and EI's shops get the bar too): check them.

## Walkthrough and search effects (checks for the build)

- `walk.py` files item rows under a stop from `r[1]` (places split on `;`, ignoring `held by` and Shops). It skips
  `Shops` by name; keep that. Compact lines change `r[1]`: keep a `;` list of places in `r[1]` for `walk.py` and the
  search, and show the compact lines at display time, or update `walk.py`'s parsing in the same change. Decide at build.
- Walkthrough item sections: Battle Items and Fossils gone, Stats and Abilities new. Check the stops still read right
  and `np` (not placed) stays small.
- localStorage `psitems` stores open boxes by index: the box list changes, so saved open state may land on another
  box once. Harmless; do not rename the key.
- Item search (`D.IT` rows) and the full-window search's item results use the new boxes.

## Checks

1. `python assemble.py` and `domcompare` for every guide (template change): only the Items route (and the
   walkthrough's item sections for Photonic Sun) may differ, and the others only by the new bar.
2. Items tab at 260 × 316 and maximised, normal and `dvkb`: no page errors, width 260 (`tools/mockup/ps-items/check.mjs`
   ran this on the mockup: Now and Proposed at 260 × 316 and 480 × 392, no errors, width 260, Held Items 6
   sub-headings: Collapse all 000000, Expand all 111111).
3. Row counts: Shops about 126, Held Items about 118, Stats and Abilities 30, Key Items 30; no item in two boxes
   except Shops; no Battle Items or Fossils anywhere.
4. Every item in SHOPS has a Shops row; every shop-only item that is not in the Serebii list has a row in its class.
5. TMs and Z-Crystals open in game order (TM01 Work Up first). No Mega Stones box; Mega pages still name their stone.
