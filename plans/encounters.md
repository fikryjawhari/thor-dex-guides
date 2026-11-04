# Encounter standard

Goal: every guide shows encounters the same way: same section names, same order, same place structure, same tracker
drop-down, whatever its source looked like. Builds Open 12; Open 13 (Radical Red playtest fixes) follows from it.
Mockup: `.tmp/enc/` (build.py samples real areas from all seven guides; preview `encounters.html`).

## Survey: what each guide does today

| Guide | Built from | Sections today | Odd ones |
| --- | --- | --- | --- |
| Emerald Imperium | `P.w` (no `es`) | one per method, in dex order of the first species | eggs ×6 kinds, Hot House N+ badges, Choice (...), Roaming 1 of N; floors are separate areas (box) |
| Hardlove Gold | `P.w` | Land / Surf / Fishing / ... (dex order) | morning / day / night are separate sublocations (`National Park - Morning`); one Fishing table (no rods); `Other` = statics; Random Gift / Trap / Fossil / Pseudo pools |
| Photonic Sun | `es` grass / water / other + Special | `Grass 1 (Entrance)`, `All Grass`, `Water` (Fishing / Surfing groups), `Other` | day / night rates, bubbling rate, SOS allies, Weather SOS, Island Scan by weekday, Ultra Wormhole colours |
| Eternal X | `es` | always `Grass`, `Water`, `Other` | floor inside the group label (`1F · Grass`), flowers / rough terrain, Hordes 60 / 35 / 5% as three groups of one species |
| Blaze Black 2 Redux | `es` | the source's labels (`Grass, Normal`, `Fish, Dark Spot`, `Cave, Normal, B1F`...) | doubles grass, shaking / dust / dark spots, Hidden Grotto Common / Uncommon / Rare, seasons as whole extra sections (4 areas) |
| Unbound | `es` | the method (`Long Grass`, `Old Rod`...) or a chamber (`1F Main Chamber`) with methods inside | raid dens by star tiers, DexNav, swarms, flowers, Underwater, Lava Surf, chambers × 3 rods |
| Radical Red | `es` | the place's own name (shown twice) | `cap N` on every row, day / night rates, raids with the drop list on every row, 66 empty houses as cards, `es` rows not flagged `w[5]` (repeat in Special) |

## The standard (decided with the user, 2026-11-04)

**Structure:** card (a location) → tracker slot → floor / room / patch heading → section (a method) → subheading
(only when a section has several) → rows. Floor first.

- **Card:** one per location, never twice. Places with nothing catchable and no tracker are left out (RR's houses,
  Centers, marts).
- **One tracker slot per met location.** A location's floors / rooms / areas are never separate slots (EI's tracker
  split them only to keep its boxes small; long boxes are fine). When unsure whether the game gives two places one met
  location, merge them: the Extra card (below) covers one that turns out separate, and the user fixes those later.
- **Floors:** one white box per slot; floors / rooms / patches are plain headings inside it, and each yellow method
  heading names its floor in small text ("Cave B1F"), so the pinned pair says where you are. (A white box per floor
  was mocked and rejected.)
- **Pinned headings:** the white place / floor heading and the open yellow method under it (as the guide already
  does: `details.stopd` / `details.sec` summaries). The grey card name doesn't pin; the white heading repeats it.
- **Starter:** its own card, "Starter", first in its region's order, with the place it happens as its heading (RR:
  "Oak's Lab") and the starter picker; the choices listed directly, no section. Not inside the town's card.
- **Sections, always these names, in this order** (an empty one is left out):
  1. **Grass**: grass, long grass, sand, flowers, rough terrain, doubles grass (subheading "Doubles"), hordes
  2. **Cave**: cave floors, hordes in caves. Grass and Cave are separate sections, because a place can have both:
     Photonic Sun's Ten Carat Hill, Victory Road and Vast Poni Canyon have a Cave table and a Grass table. No other
     guide has both in one place today. Which one a table is: the source's own word when it has one (PS `Cave`,
     BB2R `Cave, ...`, Unbound `Cave`); otherwise the extract decides per area (the map type for the decomp hacks,
     EI / RR "Grass/cave"; EX names every land table "Grass", so its caves need the extract's list).
  3. **Water**: surfing and fishing in one table
  4. **Special**: everything you trigger: Rock Smash, Headbutt, shaking grass, dust clouds, rustling, ambush, berry
     piles, shadows, splashes, Hidden Grotto, swarms, DexNav, Island Scan, Ultra Wormholes, Safari, portals,
     Weather SOS. One subheading per mechanic. BB2R's shaking grass goes here, not in Grass.
  5. **Raids**: a subheading per star tier, the drop list once per tier (collapsed), not on every row
  6. **Gifts & static**: gifts, eggs, fossils, statics, legendaries, roamers, traps, prizes, Mystery Gift, rewards,
     Hot House, choices. One subheading per kind (Static, Roaming, Gift (fossil)...)
  7. **Trades**
- **Mini chips on the rate, not subheadings or extra tables:**
  - *How* (always shown): Surf, Old, Good, Super, Fish (a hack with one rod), Surf ripple / Fish ripple (BB2R dark
    spots), Bubbling (PS), Horde (EX: hordes sit in the Grass / Cave table with their horde chance; the data has them
    only on land).
  - *When* (only when a row differs): morning / day / night as icons (Hardlove's three sublocations merge into one
    table), seasons as chips (BB2R: Spr–Aut / Winter, or each season). A row the same in every case shows a plain rate.
  - A row with several chips gets one line per chip.
- **Level once:** on the section header when there is one table, else on each subheading; a row's own level only when
  rows differ; a chip line's own level when the row's chips differ (Super 60% Lv 75). RR's cap goes once with the
  level, never per row.
- **Tracker picker:** None yet, Failed / fled, then one `<optgroup>` per section in the section order (the viewer's
  select shim indents them), A–Z inside, each species once (in its first section), then Other…
- **Extra card:** the last card on every guide's Locations page, "Extra". Rows the user adds, as many as wanted: a
  free-text place and a species (the tracker's Other… search; "failed" too), each with a remove button; "+ Add
  encounter" at the end. No explanation text. Saved in the tracker object as `TK.x` [{w place text, p species id | f
  1}] (a new field inside the existing `LS.track` value; absent until used; an older save loads unchanged; a species
  id the guide no longer has keeps the row with its text and shows the id). Counted in caught / failed, in dupes and
  in the tracker's Export / Import. Goes in `tools/scenarios/guide-update.mjs`'s snapshot.
- **Walkthrough encounter lines and Pokémon pages** use the same section and subheading names.

## Slot merges (the user, 2026-11-04: merge them all; Extra covers a wrong guess)

Tracker slots that are one location split by floor / room / area (`AR`, not `ns`), from a name scan; the extract
checks each against the map and merges every one:

- **Emerald Imperium (57 slots → 11):** Granite Cave, Meteor Falls, Mirage Tower, Mt. Pyre (floors, Exterior,
  Summit), Safari Zone (6 sectors), Shoal Cave, Magma Hideout, Seafloor Cavern, Sky Pillar, Victory Road, Trick House.
- **Blaze Black 2 Redux (21 → 7):** Relic Castle, Celestial Tower, Seaside Cave, Victory Road, Virbank Complex,
  Reversal Mountain, Pinwheel Forest (Outside / Inside: believed one met location in BB2R).
- **Radical Red (11 → 4):** Mt. Ember, Safari Zone Areas 1-4, Route 21 North / South. Celadon: everything in Celadon
  is Celadon City (the Mansion and its Roof House fold in); Rocket Hideout is its own location (eggs only). Left to
  the Radical Red pass (Open 13).
- **Photonic Sun:** Lush Jungle + Lush Jungle Cave. **Unbound:** Cinder Volcano + Cinder Volcano Depths.
- **Hardlove Gold, Eternal X:** none.

Saved state for a merge (append-only `AR`, `TK.e` keyed by index): the merged slot keeps the first floor's index; the
others become hidden members (`in` = the merged slot), so nothing is lost. On load, the merged slot shows the first
recorded entry in route order; any other floor's entry stays stored, still counts as caught for dupes and the counts,
and shows as "also: <species> (<floor>)" under the picker until cleared. The scenario snapshot
(`tools/scenarios/guide-update.mjs`) gets a case: two floors recorded before the merge.

## Data (how it gets built)

Every extract writes the same `AR[i].es` (EI / Hardlove too, from their `P.w` rows); the template stops guessing.
Each section gets a fixed kind code (`grass cave water special raid gift trade`). Each subheading gets `f` floor
and `v` variant; each row's rates are keyed `chip|when` (a level per key when they differ). The template orders sections by the code.
Guessing from labels fails on place names ("Bond Bridge", "Moltres' Den", "Totem's Den" look like methods), so the
code comes from the extract. `P.w` stays for Pokémon pages / search, and every `es` row is flagged there (fixes RR).

Saved state: open / closed keys move to section codes (`area.floor.code`); `relayout` maps old method names where it
can and starts the rest closed (UI state only, nothing lost). Tracker entries are by area (`AR` index, append-only) and species id: unchanged, since slots don't merge or split.

- **Open state:** every card and section starts closed, always (a filtered page still opens what matches). The white
  box opens with its card.

## Build plan

Branch `worktree-encounters` from `main` (a change for every guide). Two sessions:

1. **Template session** (Opus medium): the template unit: card / white box / floor headings, the floor in the yellow
   heading, the seven sections by kind code, chips and per-chip levels, the grouped picker, the Extra card (`TK.x`),
   merged-slot handling (hidden member slots, "also:" line), saved-state migration and the scenario snapshot cases.
   It reads the new `es` shape, so it lands with one guide converted as its test bed (Eternal X: one slot per
   location already, hordes, rods, floors). Ends with that guide in the Thor frame on the phone preview.
2. **Guides session** (Opus medium, the main session the user edits from): one agent per guide, each a T3 thread the
   user can talk to directly (not background agents), each in its own tab worktree off `worktree-encounters`
   (`worktree-encounters-<hack>`). An agent converts its guide's extract to the standard (kind codes, floors,
   chips, `es` rows flagged in `P.w`, slot merges), runs its guide's targeted scenarios, and asks the user in its
   thread when a source is unclear; with no answer it takes the spec's default and lists what it assumed. The
   session merges each into `worktree-encounters` one at a time (rebuild, check), then runs the full gate once and
   merges to `main`. Radical Red's unit carries the playtest fixes (Open 13) and the Celadon / Rocket Hideout places.
   Order: Eternal X (done in 1), Photonic Sun, Unbound, Hardlove Gold, Blaze Black 2 Redux, Emerald Imperium,
   Radical Red; the user may run several at once (each owns only its `hacks/<hack>/` files).

## Open

- Raids stay their own section (not asked; Unbound and RR lean on them).
