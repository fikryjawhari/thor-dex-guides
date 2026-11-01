# Item pages (unit 6 of plans/move-pages.md)

Decided with the user 2026-11-01 in the decide session (branch `worktree-move-pages-items`). Mockup: the real built
guide with the item route injected (`plans/item-pages-mockup.py` → `.js`, panel `item-pages-panel.html`; previews
`item-pages-{emerald-imperium,unbound,hardlove-gold}.html`). Data per guide: `plans/item-pages-data.md`. Icon set:
branch `worktree-move-pages-icons` (a042a34). Every guide, every viewer size, normal and `dvkb`.

## What changes

### 1. Item page `#/i/<item name>`
Route by name (URL-encoded; names are build-time, the route is not saved state). Belongs to the Items rail tab
(`tabOf`: `i` → `'i'`), so the tab keeps it as its page. Cards, in this order:
1. **Top card**: icon (32 px), name, kind line (its box and sub-heading, "Held Items · Battle gear"; "Wild Pokémon
   hold it" / "Only trainers hold it" when no box lists it), the bag description, then the **In battle** box (accent
   bar, small caps label "In battle": exactly what it does in battle, numbers included: "Restores 1/16 of the
   holder's max HP at the end of every turn"). No In battle box on Mega Stones (the line below says it) or when the
   item has no text. A Mega Stone adds `base sprite + name → Mega sprite + name` (both links) and, for `nu`, "Not
   obtainable in <hack>; trainers use it."
   **TM / HM / TR page**: icon, name, kind line and the move's row (`moveList([move])`: name, type, power; tap = move
   page). Nothing else in the top card: the move page has the rest.
2. **Where to find (N)**, open: every place, N = the number of lines. Each pickup line has its tick and, when the
   walkthrough has it, the stop's name as a link ("Goldenrod City ›", §6). Order: unticked pickups, then lines that
   aren't pickups (Shop:, Wild:, repeatable), then ticked pickups. No card when there is nothing.
3. **Held by (N)**: the ability page's picker (`pickCard` / `bindPick`): All / Wild / Trainers, only groups present.
   Wild: one row per species (base forms only), sprite, name link, types, the % on the right, highest first. Trainers:
   one row per trainer (partners count as the trainer's), sprites of its Pokémon holding it, name → `#/tr/<k>`, place ·
   box below. No card when nobody holds it.
4. **Moves it affects (N)**, collapsed: the ability page's block (`MI` records with `i`), one block per effect, its
   moves under it. No card without records.
Not found (an old link): "‹ Back" and "Not found." Nothing on the page is saved except ticks.

### 2. Links to it (every place that names an item)
Items tab cards (icon and name), walkthrough item rows (TMs and Mega Stones too: they now open their item page, not
the move / dex page), trainer cards' item text, the Pokémon page's Held items and its Mega line's stone name, the move
page's Affected by item names and its "Also TM…" line, search results for items (a "Page" action next to Items / Walk).
Not links (controls, per Dex links): the calc's item chips and pickers.

### 3. Move page
- **In battle** box under the description (same look as the item page's).
- The `TM004: <place>` lines go; one line "Also TM004 Calm Mind" (every TM / HM / TR that teaches it, each a link with
  its icon) in their place. Tutor lines stay as they are.
- A **Where to find TM004 (N)** card right after the top card (the item page's card, ticks shared). Every guide that
  has TMs gets both (EI had the place line only).

### 4. Pokémon page: Held items
A `psec` "Held items" after Where to find (key `hi`, in PSECS so the rail and saved open state know it; closed by
default like the others): "Wild" with each item (icon, link) and its %, then "Trainers give it" with each item and
×count over the trainers using this form. "Wild: none" when only trainers give items; no section when neither. The
old "Wild held item: …" line under Where to find goes. Mega forms have no wild items.

### 5. Items tab
- **Boxes = kinds**, the standard collapsible boxes (`details.split.jt`, rail jumps, sticky yellow sub-headings,
  collapse bars), in this order, each only when the guide has items for it: Key Items, Poké Balls, Medicine, Held
  Items, TMs and HMs, Evolution Items, Stats and Abilities, Mega Stones, Z-Crystals, Fossils, Valuables, Other, Move
  Tutors, Useful NPCs. Box count = items (tutors: "N tutors").
- **Each item once**, in the box of its own kind; the Shops box goes: a shop becomes a "Shop: …" line on the item
  (a shop-only item goes in its shop kind's box: Healing and repels → Medicine, Held items → Held Items with
  Berries / Other held items, and so on). Repeated lines go; a shop line's trailing " · <the item / move name>" goes.
- **Sub-headings** as the standard has them (`r[4]`); a sub-heading equal to the item's own name is dropped (Hardlove
  Valuables). Order inside: as the standard (A to Z, numeric; game order where the hack's RULES ask).
- **Cards** (dex-row look): icon, name (link), TM type pill after the name, MISSABLE tag, "done/total" after the name
  when it has two or more pickups, then its first 3 lines in §1.2's order (so ticked ones move back and the next ones
  show), then "+N more" (link to the item page). A card whose pickups are all ticked fades (opacity .55).
- **One card per pickup** for items the RULES mark (`nomerge`: Unbound's Zygarde Cell): its own sub-heading
  "Zygarde Cells (90)", each card's title = the pickup's place ("Cliff Cave"), the rest of the line under it.
- **Move Tutors**, one card per tutor (its place, "Needs: <unlock>", each move as a link + type + its cost), grouped by
  RULES `tutor_groups` (Unbound: Shard tutors, Gem Family, Special moves = Ultimate and Battle Combo + Special Moves +
  Draco Meteor, Battle Frontier tutors = Move Tutor 1-4). Guides without groups keep the table (Hardlove's 13).
- **Useful NPCs**: the table as now.
- **Tick bar** above the boxes: "N ticked" and "Clear ticks" (only when N > 0). First tap: "Tap again to clear N";
  second tap clears every tick of this guide and redraws; leaving the tab or tapping elsewhere cancels.
- **Search** (`st.q`): matching cards (name or any line) under their box names as `.sech` headings, ticks working.

### 6. Ticks (pickups) and the walkthrough
- A **pickup** is one place you get an item once: Found / Also (gift, reward) / one-off purchase lines and the
  walkthrough's item rows. Not pickups: Shop: and Wild: lines, lines marked repeatable / daily / weekday. The extract
  decides (§Data), the template only reads keys.
- **Walkthrough item rows** get the same tick box (before the place text); ticking in either place ticks both
  (redrawing any copy on screen). Stop progress counts ("0/6") stay checklist-only.
- **Stop links**: a pickup with a walkthrough row shows the stop's name as a link; tapping it opens the Walkthrough
  tab with that split, stop and its Items section open (`WO.o / x / s`, as `SR.jumpWalkTr` does), clears the search
  and `land()`s on that row.
- **Saved**: `LS.items` gains `g: {pickupKey: 1}` (no new localStorage key). Pickup keys are stable (§Data): a pickup
  whose key is gone from the data stays in `g` unused and comes back with its key. Clear ticks empties `g` only.

## Data

### Pickup keys (new, every guide): `tools/pickup_keys.py`, run by `extractlib.finalise()` like `trainer_keys.py`
- Table `hacks/<hack>/extract/pickup_keys.json`, committed, append-only: `{"k": "p<N>", "i": item, "loc": place,
  "t": line text}`. Matching in rounds, strictest first: (i, loc, t), (i, t), (i, loc) with one candidate each side;
  a pickup nothing matches gets the next "p<N>"; an entry nothing matches stays. Reported in the build report (loose
  matches, new keys, unmatched entries), as trainer keys are. First build seeds the table.
- Where keys go: `IT` row `r[5]` = one entry per line of `r[1]` (key, or 0 for a line that isn't a pickup); `WK` stop
  `it` rows `[4]` = the key of the pickup the row is. `itemstd.standardise` already matches walkthrough rows to IT
  rows; it now matches per line, and a walkthrough row with no IT line (Unbound: 185 of 448 are reworded or not in the
  Items tab, Costume Box) is added to the item's IT row as a line, so every pickup is on its item page and card.
- `loc` = the stop's place / the line's place name (Found: <place> · …), from the standardiser's line parsing.

### Items standard (`tools/itemstd.py`): kinds as boxes
`BOXES` becomes the kinds list above (Shops gone, Medicine new); every item one row (Shops rows fold in as Shop:
lines; same-box repeats merge; `nomerge` items stay one row per pickup); sub-heading equal to the item name dropped;
RULES `tutor_groups` (regex → heading) for Unbound; the Calm Mind case: a TM's own place sentence goes when its Shop
line names the same place (per-hack RULES `text` where the wording can't be matched; report the rest). Walkthrough
rows' box names follow. Fix Unbound's malformed name "Blue-Striped Basculin: Deep Sea Scale (5% chance) Red-Striped
Basculin: Deep Sea Tooth" (two items).

### Item text: `IX` `{item: [description, in battle, changed?]}` (new, `tools/schema.py`)
- Description (bag text), by guide: EI its `items.h`; Photonic / Eternal X `dex-*.json`; Hardlove `data/text/221.txt`
  for its own items. Then pooled: every guide takes any text another guide has for the same item; the build report
  lists each guide's items with no text anywhere (the user settles those). Changed = differs from the vanilla text
  (3DS vanilla dump; EI stock expansion).
- In battle: a shared hand-written set `tools/battle_text/items.json` and `moves.json` (`{name: text}`, with
  generation variants where mechanics differ: `{"gen<=5": ..., "": ...}`), written in the style the user approved:
  exact numbers, conditions, interactions (Big Root, Magic Guard, Sheer Force, Skill Link), no flavour. Start from
  Showdown's `data/text` `desc` for the guide's generation; per-hack overrides in `hacks/<hack>/extract/battle_text.json`
  for changed mechanics (moves with `MV.h`, the item changes docs). Approved samples: Leech Seed, Calm Mind, Toxic,
  Bullet Seed, Life Orb, Leftovers, Sitrus Berry, Dark / Grass Gem, Dream Ball (`plans/item-pages-mockup.js` HAND).
  Moves get theirs in `MV.b` (or `IX`-like `MX`); the move page shows it.

### Wild held items: `P.hi` → `[[item, %]]` (see item-pages-data.md → Wild held item odds)
One entry per distinct item, rule applied by the extract: slot 1 50%, slot 2 5%, slot 3 1% (Gen 5+), same item in
slots 1 and 2 = 100%; none on Mega forms. EI: `species_info` common / rare; Unbound: keep the wiki's percentages
(same item twice → 100%, CFRU's rule); Hardlove: `data/Species.c` `.wildHeldItems` (not extracted today); 3DS: keep
the three slots' positions (`tools/ctrguide.py`); BB2R: needs the user's ROM personal data (step for the user), until
then names only and no %. A guide with names only shows no %.

### Icons
Merge `worktree-move-pages-icons` (`sprites/items/`, `tools/item_icons.py`). `assemble.py` inlines, per guide, one
sheet of that guide's icons (16 per row, 24 px, 256-colour palette: EI 53 KB, Unbound 81 KB, Hardlove 50 KB) as a CSS
variable, and `{item: slot}`; `icon(name, size)` draws by background-position. No icon: an empty 32 px spacer on cards,
nothing inline. Unbound's own key items (17) and three ambiguous names have none (sprites/items/README.md).

## Out of scope
Price / fling / Natural Gift fields; Compound Eyes odds; links on calc item chips; Unbound key-item art from the ROM
(possible later from the user's ROM); BB2R wild held items until the ROM dump; item pages for Useful NPCs / tutors.

## Controls and states
| Control / route | Initial / saved | Action | Result | Empty / error |
| --- | --- | --- | --- | --- |
| `#/i/<name>` | Items tab | open | top, Where open, Held by All (groups collapsed), Moves collapsed; scroll 0 | unknown name: Back + "Not found." |
| Pickup tick (card, item page, walk row) | `LS.items.g` | tap | saved; every copy on screen follows; card redraws (next 3 move up, count, fade) | non-pickup lines: no box |
| Stop link | none | tap | Walkthrough tab, split / stop / Items open, search cleared, lands on the row | no walk row: no link |
| "+N more" / card name / icon | none | tap | item page | — |
| Clear ticks | hidden at 0 | tap, tap | arm text, then clear all and redraw | other tap / leave: disarm |
| Items tab boxes / sub-headings | `LS.items` `o` / `s` by kind name (old index-keyed entries dropped once) | tap header | as today's boxes | — |
| Held by picker | All | tap group | only that group, open | one group: still a picker of All + it |
| Pokémon page Held items | closed (`PO`) | toggle | saved like the other sections | absent when no items |
| Move page "Also TM…" | — | tap | TM page | not a TM: no line |

## Edge cases
- An item in several places / kinds: one card, all lines; kind = its own box (not Shops).
- Only trainers hold it, or only wild Pokémon: page with kind line "Only trainers hold it" / "Wild Pokémon hold it",
  no Where card, not in the Items tab.
- Hack-only items (EI's Mega Stones, Kicking Shoes): their own text and art; no pooled text → build report.
- A Mega Stone whose Mega is unusable (`nu`): the line says so; still a page.
- Long names / lines at 260 × 316: names wrap (`overflow-wrap:anywhere`), stop links wrap whole, nothing wider than
  the screen; `dvkb`: the keyboard covers nothing the tick bar needs.
- 90 Zygarde Cells: cards are `content-visibility:auto` like dex rows.
- Saved state from older builds: no `g` → nothing ticked; old `LS.items` `o` / `s` by index → ignored once, rewritten
  by name.
- Hack update: pickup keys hold ticks through rewording; a removed pickup's tick waits unused.

## Checks
| Requirement | Scenario | Setup | Assert |
| --- | --- | --- | --- |
| Item page cards, TM page, Mega Stone (no In battle), Not found | new `tools/scenarios/item-page.mjs` | every guide, all sizes, normal + dvkb | cards present / absent per data; no horizontal overflow |
| Ticks: order, count, fade, Clear ticks two-tap, shared with walk rows and the item page | new `items-tab.mjs` | seeded `LS.items.g` | DOM and `localStorage` after each tap |
| Stop link lands on the row with the stop's Items open | `items-tab.mjs` | three guides with walk rows | hash `#/walk`, row on screen under the pinned headers |
| Kinds as boxes, one card per item, Zygarde split, Unbound tutor groups | `items-tab.mjs` | Unbound, Hardlove, EI | box names / counts from data, no item twice |
| Move page In battle + Also TM + Where card | extend `move-page.mjs` | a TM move | line link → TM page |
| Pokémon page Held items with % | extend `dex-page.mjs` | a species with hi | rows and % from `P.hi` |
| Ticks survive an update | `guide-update.mjs` snapshot + `stable-keys.mjs` | tick two pickups, shifted copy | same pickups ticked |
| Pickup keys stable across rebuilds | `tools/pickup_keys.py` self-test + build report | rebuild each guide twice | no new keys on the second build |
Then `gate.py check` on every guide, `domcompare` against `worktree-move-pages` (expected: Items tab, walkthrough
item rows, move pages of TM moves, Pokémon pages with held items, item routes), `preview.py --frame` for Thor review.

## Build units (in order; one commit per working sub-step)
1. **Data foundations** (Opus or Sol): `tools/pickup_keys.py`, `itemstd` kinds rewrite (+ tutor groups, nomerge,
   Basculin fix, Calm Mind rule), schema (`IX`, `MV.b`, `hi` pairs, `r[5]`, WK `[4]`); rebuild every guide; seed the
   pickup tables; read the reports.
2. **Per-guide extract units** (Sol, one per guide, in parallel: separate files): descriptions + held odds. EI; Unbound
   (keep wiki %); Hardlove (Species.c slots, 221.txt); Photonic + Eternal X (one `ctrguide` change); BB2R (text from
   the pool; odds wait for the ROM dump: ask the user).
3. **Battle text** (Sol, split into items / moves A-M / moves N-Z): `tools/battle_text/*.json` + per-hack overrides;
   the user reviews a sample of each before the rest.
4. **Icons**: merge `worktree-move-pages-icons`; `assemble.py` sheet + slots.
5. **Template** (Opus main chat or Sol): item page, Items tab, ticks + walk rows + stop links, move page, Pokémon page,
   links, search action; scenarios above. `template/README.md` gets the decisions (item page, Items tab, ticks).
6. **Audit** (Haiku medium): gate, domcompare, viewer sizes, scenarios.
