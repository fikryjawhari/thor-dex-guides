# Item pages: data inventory (2026-11-01)

What each guide's sources hold for an item page, and what stock data fills in. Rule as elsewhere: hacks with public
code take the code, 3DS hacks the game data; stock only where the source has nothing. Feeds `plans/item-pages.md`
(the spec) and the per-guide extract units.

## What data.json already has (every guide)
- `IT` rows `[item, text, link, missable, sub-heading]`: every place, as Found / Wild / Also / Shop lines (shop lines
  carry the price: "· ₽4,000", "· 48 BP"); box and sub-heading give the kind ("Held Items · Battle gear").
- `WK` stops' `it` `[box, item, text, link]`: which walkthrough stops hand it out.
- `P.hi` wild held items; `P.stone` / `P.sloc` / `P.nu` on Mega forms.
- Trainer Pokémon `i` (also partners `pt` and Normal teams).
- `MI` records with `i`: the moves it affects and how.
- `GID.it`: the game's item ids (save readers).
So "where found", "held by", "moves it affects" and the Mega need no new data. New fields are only the description
(and an icon, if chosen). No price field: the shop lines already say what a shop asks; the base price / sell price,
fling power and Natural Gift are left out (nobody reads them; same call as the move page's unread flags).

Item names in the guide (Items tab rows outside Useful NPCs / Move Tutors, `hi`, stones, trainer items, `MI`):
EI 467, Unbound 716, Hardlove ~330, BB2R ~435, Photonic ~450, Eternal X ~380 (TMs included).

## Descriptions per guide
| Guide | Source | Has | Fills in |
|---|---|---|---|
| Emerald Imperium | its game source, `.src/repos/expansion/src/data/items.h` (iriv24 fork at the release pin, already fetched for `GID`) | `.description` for every item (in-game text), `.price`, `.pocket`, `.holdEffect`, `.flingPower` | nothing; 239 of the 467 names matched by name in the mockup's quick parse, the build matches by `GID` constant |
| Unbound | closed ROM; CFRU / DPE code is public but has no item text; Unbound Cloud has names only | names (`GID`) | stock: Showdown `data/text/items.js` (the generation's `desc`) |
| Hardlove Gold | `repos/hardlove` (hg-engine fork): `data/itemdata/itemdata.c` (price, hold effect, fling, Natural Gift), `data/text/222.txt` names, `221.txt` only its own new items' text (Infinite Candy, Starter Card ...) | the hack's own items' descriptions | stock (Showdown gen 4 `desc`) for the rest; fetch `221.txt` / `222.txt` at the pin |
| Blaze Black 2 Redux | no ROM text in `.src`; `Item Changes.txt` (placements, not effects) | nothing | stock (Showdown gen 5 `desc`); the user's ROM text (msg 63 / 64) would be the game's own, if the user wants it dumped |
| Photonic Sun | game data: `.src/dex-rebalanced.json` `items` (`id`, `name`, `desc`, read by `tools/ctr_dex.py` from text GARC `itemdesc`) and `dex-vanilla.json` | in-game text for every item; vanilla text too | nothing. 35 descriptions differ from vanilla, all TM text reflowed (compare with whitespace folded) |
| Eternal X | the same (`dex-*.json`) | the same | nothing. 50 differ from vanilla, among them real changes (Big Root "doubles the amount of HP ...") |

Changed marker: a description that differs from the vanilla one (3DS: `dex-vanilla.json`; EI: stock expansion
`items.h`) is a hack change, shown like the move page's "changed". Hack-only items (EI's new Mega Stones, Kicking
Shoes) have only the hack's text.

Stock source: Showdown `data/text/items.js` (pokemon-showdown, the version the calc pins): `desc` / `shortDesc` with
`gen4` ... `gen8` variants; take the guide generation's. It describes the effect, not the bag text, which is what the
page needs. pokeemerald-expansion `items.h` is the other candidate (bag text, three short lines, newest generation);
it reads well but describes Gen 9 behaviour for older-generation guides.

TMs: the description is the move's (the TM text in every game is the move description); the page would show the move
line instead (`moveList([move])`), so no TM descriptions are stored.

## Icons
- Source if chosen: pokeemerald-expansion `graphics/items/icons/*.png` + `icon_palettes` at the shared sprite set's
  pin (`73b3fbe`): 619 icon files (277 KB), 24 × 24, 4bpp, palettes separate, every generation including key items,
  Mega Stones, Z-Crystals and the TM discs by type. A few 3DS / NDS-only key items (Ride Pager, Pokégear upgrades) have
  none: no icon, as for species with no sprite.
- Cost (measured in the mockup with Showdown's sheet, which covers about half the names): one packed sheet of the
  guide's own icons, base64: EI 42 KB for 226 icons, Unbound 54 KB for 305. Full coverage estimate 70-100 KB per guide,
  2-3% of a 3.3-3.7 MB guide. One sheet + CSS `background-position` per icon, not one data URI each (one PNG each was
  about 2.3× the size).
- Shared like the sprites: `sprites/items/` (keys = the item's name key), built once by a tools script, each guide
  inlines only the icons of its own items. Hack-only items (EI's new Mega Stones): the hack's own art if its source has
  it (EI's repo has `graphics/items/icons` for them), otherwise none.

## Per-guide extract units (if the spec keeps descriptions)
Each writes `IX` (or whatever the spec names it) `{item: [description, changed?]}` for every item name the guide shows:
1. EI: `items.h` by `GID` constant; changed = differs from stock expansion `items.h`.
2. 3DS (Photonic, Eternal X, one shared helper in `tools/ctrguide.py`): `dex-*.json` items by id.
3. Hardlove: `221.txt` for its own items, stock for the rest.
4. Unbound, BB2R: stock only (one shared helper reading Showdown text by generation).
