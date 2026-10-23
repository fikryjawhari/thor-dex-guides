# Items tab standard (consistency pass, part C)

Decided with the user 2026-10-23 from a mockup (real builds of all four guides with the proposed data, Thor frame:
`tools/mockup/items-standard/`, `model.py` = the rules below as rough code; rebuild with `python assemble.py`, then
`uv run python -I tools/mockup/items-standard/build.py . <hack> <out.html>`, panel Now / Standard). Branch
`worktree-items-standard` (off `worktree-consistency-template`). Next: a Sonnet build session (template check + the four
item extracts), then part D, the audit.

## Boxes
One fixed set, in this order. A box shows only when the hack has rows for it. No per-hack box names or order.

1. Shops
2. Key Items
3. TMs and HMs (one box, sub-headings TMs and HMs, each with its own rows; HMs only where the hack has them)
4. Move Tutors
5. Evolution Items
6. Held Items
7. Stats and Abilities
8. Mega Stones (every guide with stone locations: EI, HG, EX; **not PS**) or Z-Crystals (PS)
9. Fossils
10. Useful NPCs (EI's existing 22 rows; place | note rows, as now)
11. Valuables (last; HG's Heart Scale / Rare Candy / Big Nugget / Master Ball pickups, one row per pickup under a
    sub-heading per item, as HG has it now)

Key Items keep only what unlocks something or has story / QoL / gameplay value (the earlier rule for EX / PS; HG's
"Other" key-type rows move here: Infinite Candy, Old Rod, Bike, Pokégear Upgrade, Starter Card, Dowsing Machine,
SS Aqua Ticket, Mega Ring).

## Sub-headings (yellow, A to Z inside, shown only when they have rows, Expand / Collapse all bar when 2+)
- **Shops**, by item kind: Poké Balls, Healing and repels, Evolution items, Power items, Held items, Stats and abilities,
  TMs, Mega Stones, Other. One row per item; the row lists every shop that sells it, one per line (no `Shop:` prefix).
  EI is regrouped from its per-shop headings to this (user's call); the vanilla-stock note stays as the box note, and
  the author's stray first row (Pomeg Berry) is dropped.
- **Held Items**, by class: Type boosters, Battle gear, One-use items, Gems, Berries, Pokémon-specific, Memories and
  Drives, Other held items. Mapping: HG Type boosting / Battle / Consumable / Gems / Berries to the same-named class;
  PS / EX classes keep their names; PS "Silvally Memories, Genesect Drives" and EX "Genesect Drives" become Memories and
  Drives. Each item appears once (evolution items stay in Evolution Items, Power items in Stats and Abilities).
- **Stats and Abilities**, game order inside: Raise stats (vitamins), Raise stats (wings), Power items (EVs while held),
  Lower stats (berries), Hyper Training (IVs), Abilities, Levels and PP (as PS / EX have them).
- **TMs and HMs**: sub-headings TMs and HMs (a hack with no HMs shows no sub-headings). Replaces the separate TMs and
  HMs boxes in EI / HG; the move pages' TM / HM lookups read `k:'tm'` rows by name, so check them after merging the boxes.
- **Valuables**: sub-heading per item.

## Row style
`Found: places` / `Wild: species` / `Also: gift, reward, Festival Plaza...` / `Shop: shop, shop`, in that order, one
line each, plain labels (no tint). TMs, HMs, Move Tutors and Mega Stones keep their place text and links. EI / HG prose
becomes these lines in the extract: "Sold at X" is `Shop:`, gifts / trainer rewards are `Also:`, the rest `Found:`.
Check the converted text by hand per hack (the mockup's regex conversion is rough).

## Row order
Game order (earliest walkthrough stop) for Key Items, TMs and HMs, Move Tutors, Stats and Abilities, Z-Crystals; A to Z for
everything else (PS's `score()` / `row_score()` in `ps-items/model.py` is the reference).

## Where the odd rows go
- EI "Battle item rewards" (40): Held Items (class by item) or Evolution Items (stones), text `Also: reward, defeat
  <trainer> at <place>`. No box of their own.
- HG "Other" (17): Key Items (list above); Master Ball, Big Nugget, Rage Candy Bar, Escape Rope to Valuables; the
  NPC services (Battle Bond, Roamer Clairvoyance, Embedded Tower Reset) to Useful NPCs.
- EX: the 29 Mega Stones under Held Items move to the Mega Stones box; Fossils stay (EX has them, nobody else does).
- PS: no Mega Stones box (generated stones, as decided in plans/ps-items.md); keep the Mega page's stone name.

## Build notes
- The template already renders boxes, sub-headings and the sub-heading bar (`itemBox`, `IO`); expect little or no
  template change. Box order and names come from the data, so the work is the four extracts.
- Put the class sets, kinds, box order and line conversion in one shared helper (`tools/items.py`, next to
  `tools/splits.py`), used by all four extracts; do not copy `model.py`.
- `walk.py` files item rows under stops from `r[1]`: compact lines change it; keep a `;` place list for `walk.py` and
  search, or update its parsing (see plans/ps-items.md → Walkthrough and search effects). Walkthrough item sections
  follow the new boxes.
- localStorage `LS.items` stores open boxes by index; box lists change, so a saved open state may land on another box
  once. Harmless; do not rename the key.
- Item search results and the walkthrough's item sections use the new boxes.

## Checks
1. `assemble.py` and `domcompare` for every guide: only the Items route (and walkthrough item sections) differ.
2. Items at 260 × 316 and maximised, normal and `dvkb`: no page errors, width 260.
3. No item in two boxes (except Shops); box order as above; only boxes with rows show; Mega Stones box absent in PS.
4. Every Shops item has a row; EI's Shops has no per-shop headings; no `Shop:` prefix inside Shops rows.
5. Key Items have no Holo Caster / Running Shoes / Town Map type rows.
6. A spot-check of 10 converted EI / HG rows against the sources.
