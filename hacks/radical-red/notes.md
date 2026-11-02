# Pokémon Radical Red build notes

Scaffold only, based on `unbound`. Feature switches need review.

## Build

`uv run python -I hacks/radical-red/extract/build.py`

TODO: implement extract modules; audit inherited cfg switches and cfg.txt wording.

## Sources and rules

The official 4.1 dex's pinned `data.js` is the numerical authority (SOURCES.md). Its object literal is tokenised,
converted to JSON, and cached in memory only: no JavaScript evaluation or writes to the shared source junction.

### Dex

`common.py` exports `DATA`, `SPECIES`, `SPECIES_IDS`, `SPECIES_NAMES`, `FORM_KEYS`, `CAPS`, `sid`, `move`, `ability`,
`item`, `type_name`, `area`, `cap_step`, and `cap`. IDs are lowercase underscore slugs of the official dex keys,
not National Dex numbers. `sid(int)` means the game's data.js ID. Names accept sheet/Showdown ordering, regional
prefixes and suffixes, and punctuation-insensitive CFRU short move/ability names. Unknown lookups return None.
Ability pairs `[ID, variant]` preserve aliases sharing one game ID; a bare ability ID selects variant zero.
Species ability slots are **hidden, primary, secondary**, not the other way round. Source stats are HP/Atk/Def/Spe/SpA/SpD.
Area keys are progression steps, not levels; `cap(step)` returns `cap[1]` (Hardcore), normal is `cap[0]`.
Cosmetic species IDs are kept distinct for now, including the source's otherwise indistinguishably named records;
Pumpkaboo/Gourgeist order 0/1/2/3 means Average/Small/Large/Super. The base lookup always selects Average.
The 827 named ordinary moves exclude Placeholder and generated Z/Max records (IDs >=848); no learnset uses those.
Do not index M/AB until dex.build has run: their final lists are sorted by name, independently of game IDs.

Dex cross-check: all 1,343 official species records match all 1,343 RomHackDex pages, one-to-one (including
its numeric cosmetic suffixes). 1,026 distinct National Dex numbers include Chillet (#2001); 68 Mega/Primal forms.
827 ordinary game move IDs become 826 names after CFRU spelling normalisation; 176 generated/placeholder IDs
are excluded. AB has 281 names, expanded from 255 game IDs and their name variants; descriptions are the game's
actual text, not the mirror's incorrectly paired text. Species differences against RomHackDex: stats 285,
types 39, regular abilities 981, hidden ability 987, TM/HM sets 80, tutor sets 77; level-up and egg sets agree.
The complete per-species differences are in report.txt; official data wins. The mirror has old stats/types and
frequently swapped hidden slots, so these are intentionally not presented as a dispute with the game itself.
Every one of the 826 moves is mirrored. Differences are Struggle's type (official type 9 is typeless, shown as ???,
mirror Normal) and Leech Life's PP (canonical game ID 141 has 15 PP, mirror/unused Leech Fang ID 355 has 10).
The two Leech Life IDs resolve to one name, retaining the canonical, actually learned ID's numbers; never take
the last duplicate's record just because it appears last. The 18-type chart agrees in every cell. The v4.0/v4.1 changelogs make no
type-chart change; this is the standard modern chart, not an assumed Ice/Bug buff.
Learnsets resolve every referenced move strictly. TM slots 0-119 are TM01-120, slots 120-126 HM01-07; zero-valued
TM/tutor placeholders are ignored. Evolutions explicitly decode every source method; 254 denotes Mega/form
change, never ordinary evolution. Items and Mega stones are decoded from those records, including Primal orbs;
Mega Rayquaza uses Dragon Ascent and has no fictitious stone. Wild held slots default to 50/5, equal nonzero
slots to 100%; 416 species have held items. Historical changelog statements name common/rare slots and agree
with the FRLG odds. `dex.egg_groups` exposes the 16 breeding groups; the existing P schema reserves `eg` for egg
moves and has no breeding-group field. The 667 source species `changes` records are retained in common.DATA and
logged, not injected as an unsupported P field or the prohibited changes-from-vanilla card. Move/ability changed
markers use the existing MV/AB schema. No template change is made.

The scaffold's cfg.calc=false exposed a shared item_text.generation crash. The minimal fix accepts false and
registers Radical Red as generation 9 for item text (the Gen 9 additions), without enabling the calc or touching cfg.

Unit 1 shared-helper check: baseline 3400658 captured; `gate.py check unbound --data` passes 6/6, data identical
except build date and report byte-identical (16.1 s). `build.py` runs with the other units' expected stubs.
`python assemble.py radical-red` currently stops at the scaffold's ten cfg.txt TODO strings; replacing those is
outside this unit's hack.json ownership (sk only). No placeholder guard is disabled and no wording is borrowed.

Move metadata: 825 moves from RR Showdown's gen9rr overlay on its base moves, with RR calc MOVES[9] overriding
damage flags/targets. The one remaining move, Metal Bash, gets contact/normal-target metadata from its in-game
full-body-charge description (no guessed secondary effect or Protect flag). `move_metadata.json` is committed;
`moves.py --refresh` recreates it using the pinned TypeScript, without touching data.js or .src. Every build uses
the snapshot without Node. Inferno Parade is normalised to the docs'/Showdown's Infernal Parade, retaining the old
spelling as an alias. The 113 Showdown/official numerical and secondary-chance disagreements are in report.txt;
official numbers win, including Barb Barrage 50%, Dragon Rush 30%, Freezing Glare 30%, Diamond Storm 50%.
The source's freeze status is labelled frostbite in structured effects (v4.0 changelog: PLA frostbite replaced
freeze, even though the game still calls it freeze). Tri Attack/Dire Claw alternatives, first-turn Fake Out,
conditional Burning Jealousy, weather recovery, Secret Power terrain effects, Struggle's max-HP recoil, and
ally-only Pollen Puff healing are explicit, not unconditional effects guessed from callbacks. 253 moves have
changed markers relative to Showdown base and RR effect text; 48 abilities have RR Showdown change text, with
the official in-game description retained. Damage/calculator behaviour remains the calc unit's responsibility.

Ability IDs 73 and 77 both say As One in-game, but have distinct descriptions: Spectrier (Unnerve + Grim Neigh)
and Glastrier (Unnerve + Moxie) respectively. They remain distinct AB names, as `As One (Spectrier)` and
`As One (Glastrier)`, so neither the description nor save lookup is overwritten. Bare `ability('As One')` returns
None because it is ambiguous; numeric IDs and explicit names resolve. Normalise Neutralize Gas to Neutralizing
Gas and hzla's Pheonix Down typo to Phoenix Down. Canonical ability names as well as raw short names resolve.
Against hzla's Hardcore backup: 879/879 species names and 196/196 item names resolve; all 669 real move names
resolve (the remaining `(No Move)` is a sentinel). Four of 258 ability names do not exist in the official dex's
ability table: Forewarn, Guard Dog, Pickpocket, Snow Cloak. They are not fabricated or silently mapped to another
ability; trainer/save units should take the official numeric data and report a stale hzla ability as a conflict.

Sprites: 1,298 species use the shared set, 44 use the official dex's sprites exported by `dex.write_sprites()`.
The RGBA source PNGs are losslessly re-encoded as palette PNGs (all 64x64) so the stdlib assembly cropper can
read them. Pixel identity and square-crop round trips are checked for all 44. Supplements include RR's Megas,
Seviian forms, Surfing/Flying Pikachu, Primal Dialga and the two Hippopotas/Hippowdon female sprites missing from
the shared set. `sk` only was edited: remove stale Unbound IDs, set the actual Calyrex IDs, and distinguish Minior
cores from Meteor. The source's Minior order is red/blue/orange/yellow/indigo/green/violet (checked from the actual
sprite palettes), not the usual assumed colour order; stable numeric P IDs are preserved with descriptive names.
Arceus/Silvally Ice are not Ice Riders; Unown F/M are letters, not genders. The one unavailable sprite is Chillet:
data.js has the species but no sprite entry, and the shared set has no fakemon art. It intentionally keeps the
template's letter fallback; no placeholder image is substituted or invented. Twenty late species have no
data.js sprite, but the shared set covers the other nineteen.

D8 pruning waits until **both** locations and trainer groups exist. Once integrated, locations must mark the
availability `g` values: g=0 obtainable (including evolution/breeding closure), g=3 unavailable/trainer-only;
g=1 is Mega/Primal. Prune keeps g=0, trainer-used IDs and Megas of obtainable parents. It uses actual source
transformation parents so normal Centiskorch cannot make an unobtainable Seviian Mega obtainable. Dead
evolution/form links and Mega item/walkthrough links are removed. Incomplete-location/trainer no-op paths,
trainer-only preservation, regional Mega parentage and link cleanup are exercised with synthetic fixtures.

Final unit checks (2026-11-02): build.py passes and repeated builds reproduce the committed data/report; remaining
locs/trainers/items/walk/gid stubs report not built yet. Parser escape/key/comment tests and executable-input
rejection pass. Every one of the 1,343 species is checked against source stats, regular/hidden ability slots and
resolved learnset/evolution/form links. Lookup, cap, area, Mega-item, source-effect odds and type-chart assertions
pass. All 44 exported sprites are pixel-identical to the source and accepted by pngpal.crop; source/shared
coverage is 1,342/1,343, with only Chillet absent. `git diff --check` passes. Logs are local `.tmp/rr-dex/`.
Assembly remains blocked solely by the scaffold cfg.txt TODO strings, outside unit 1 ownership. Therefore no
dist render or browser check is claimed. The integration/wording unit must fill those ten strings, then run
`python assemble.py radical-red`. No full gate, scenario sweep or domcompare was run.

Next units: import common directly; its tables/lookups are ready before dex.build. Read raw records through
`DATA`, not through a second parser, and never write caches under H.src/H.cache. Call `dex.build` before using M/AB
indices; canonical `MOVE_RECORDS` chooses the learned Leech Life record. Source IDs are not National Dex numbers.
Pass ability pairs intact; choosing the first name of an ID loses aliases such as Shell Armor and Shadow Shield.
For save IDs use `sid`, `move`, `ability`, `item`, then index the final sorted M/AB; skip zero/placeholders and flag
unknown IDs. Item IDs map through the same stone-spelling corrections as P.stone, preserving item links. Location
progression keys use `cap_step`/`cap`, and trainers must use Hardcore `cap[1]`, not normal `cap[0]`. Obtainability
and evolution/breeding closure must be assigned before D8 pruning is enabled by the locations/trainers merge.

### Save ID tables

`gid.py` (unit 7, last in `build.py`, after `finalise()`): `GID {sp, mv, it, gr}` indexed by the game's ids, which are
`data.js`'s keys. No `ab`: a CFRU Pokémon stores its ability slot, and the reader returns `abs`.
- `sp`: 1,343 species ids -> P id (`SPECIES_IDS`), a P entry the prune removed -> null. Battle-only forms (Megas,
  Primals, Zen, Pirouette, Blade, School, Busted, Ultra, Noice, Hangry, Crowned, Eternamax, Complete, Ash, Sunshine,
  Gulping / Gorging, Terastal: `gid.BATTLE_ONLY`, 85 ids) read as their base, as Unbound's do; a save never holds one.
- `mv`: 827 ids -> M index; Placeholder, Z-move and Max-move ids (821, 829-1003) -> null. 355 (the unused Leech Fang
  copy, same name) reads as Leech Life like 141.
- `it`: 749 ids -> `common.item` names (the stone spelling fixes).
- `gr`: growth rates, from RR's own `Base_Stats.c` (`extract/growth.json`, derived; `python -I gid.py --growth <file>`
  rewrites it). `data.js` has none. The file is the official dex repo's (ydarissep/Radical-Red-Pokedex `65712ed`, the
  parent of `f848f86`, 2023-08-04; RadicalHex uses the same file): 1,270 ids directly, 57 forms from their base or
  species under a short define (BASCULIN_RED ...), 16 species added after 2023 (Ogerpon and its masks, the Loyal Three,
  Pecharunt, Poltchageist / Sinistcha, Raging Bolt, Iron Crown, Iron Boulder, Gouging Fire, Terapagos-Terastal, Chillet)
  Medium Fast: CFRU's default for an entry without a rate, and RadicalHex found exp = level³ on every such species in
  real saves. Provisional for those 16 until a real save.

Checked every build against hzla's `save_constants/radical_red_*.js` (report.txt, GID lines): species, items and
abilities (by species id) the same for every id; moves the same except 27 ids hzla reads as no move (moves RR took
out: Guillotine, Double Team, Baton Pass ...; GID keeps them, harmless); 49 cosmetic forms hzla names by their species
(Unown letters, female forms, Burmy, Shellos, Deerling, Minior cores). The ability slots P gives the reader (a[0] / a[1] /
ha) give the game's ability in all four (personality bit, hidden bit) states for every species. hzla's other table,
`abilitiesBySpecies` (by name), is not the game's: it has one entry per name (Jellicent-F gets the male's) and some
abilities the id tables don't (Jellicent Cursed Body where data.js and hzla's id table have Damp); not used.

### Save import

Reader `cfru`, profile `radicalred41` (`template/calc/readers/cfru.js`): the finishing unit sets
`cfg.calc.save = "cfru"` and `cfg.calc.cfru = "radicalred41"`. The profile is named only: Unbound names no profile and
reads exactly as before. Format, from RadicalHex (jajaa17/RadicalHex `3697412`, GPLv3, `src/core.js`, "re-checked
against real saves") and PKForge (sofianeelhor/PKForge `2df0443`, GPLv3, `RadicalRedFormat.cs`, from a real champion
save), both agreeing with the Unbound reader's CFRU layout:
- Signature: the retail 0x08012025 (no RR magic). A vanilla FireRed / Emerald save has it too: the profile tells one
  by its checksums fitting the retail windows (0xF2C / 0xF80 / 0xF08 / 0x7D0, PKForge's table) and refuses it
  (`wrong`); RR's sections only fit CFRU's (0xF24 / 0xFF0 / 0xD98 / 0x450).
- Slots, checksums, party (SaveBlock1 0x34 / 0x38, 100-byte unencrypted), box Pokémon (58 bytes), and the 25-box map
  (stream 1-19, sectors 30 / 31 for 20-22, SaveBlock1 0x1F08 for 23-24, SaveBlock2 0xB0 for 25): as Unbound's.
- Randomisers: flags 0x940 / 0x941 / 0x942 (sector 0 0xF2C bits 0-2: species, learnset, abilities; hzla). Only the
  ability randomiser is refused: stored species and moves are real ids (hzla and RadicalHex read them as they are),
  but abilities are re-rolled from a pool by trainer id, which the reader's slot can't express.
- Levels: the party's stored level; boxed from experience with `GID.gr` and pokefirered's formulas (CFRU's; Unbound's
  own table differs at a few levels). hzla doesn't compute levels (it gives boxed Pokémon the level cap).

Checked on synthetic saves (`tools/calc/cfru_rr.mjs` writes them to `tools/calc/cfru_rr/` with the expected imports
from its specs, names to ids through hzla's tables, not GID): `node tools/calc/cfru_rr_check.mjs` (in `npm test`):
7 saves, 18 Pokémon across party and boxes 1, 3, 5, 19, 20, 22, 23, 24, 25 (stream, raw and SaveBlock seams), every
growth rate at an exact level threshold, a battle-only and a cosmetic form, an egg and a Bad Egg (skipped), the refusals
(ability randomiser, vanilla FireRed, Unbound signature, erased) and the Unbound guide refusing an RR save.
`node tools/calc/cfru_rr_oracles.mjs` runs hzla's RR reader and RadicalHex's loader on the same bytes: 0 unexplained;
hzla's own rules (no signature / checksum check, boxes 1-19 only, misreads a Pokémon across two sectors, level cap as
the boxed level, its form names) and RadicalHex's (an editor: lists eggs and Bad Eggs, loads randomised saves).
**Provisional (D7):** no real RR save has been read. Open until the user's `.srm`: the signature on a 4.1 save, the
experience table (a freshly caught boxed Pokémon should sit on pokefirered's value), the 16 growth fallbacks, and
whether a 4.1 save with the ability randomiser sets 0x942.

### Damage calc

Unit 2 (rounds 1-3, sessions `rr-calc` / `rr-calc3`, 2026-11-02). Profile: `hack.json` → `cfg.calc`; fixtures:
`tools/calc/radical-red_check.mjs` (synthetic Mew data, no `data.json` needed; part of `npm test --prefix tools/calc`).

**Sources** (paths under `.src/`): RR Showdown `repos/pokemon-showdown` @ `54955790` (`data/mods/gen9rr/*.ts`,
"Showdown" below), RR calc `repos/damage-calc` @ `7f354003` (`calc/src/mechanics/gen789.ts`, `util.ts`: the oracle,
"RR calc" below), the official dex `repos/Radical-Red-Pokedex/data.js` (what exists in 4.1), the changelogs in
`drive/` and the Hardcore sheet's Main tab (`trainers-hardcore.xlsx`). hzla's `radredhc` backup
(`repos/Dynamic-Calc-Decomps/backups/title_to_backup_mappings.js:40`) was not run. Showdown entries that are not in
4.1's `data.js` (13 abilities such as Vocalizer / Jump Scare, Council Orb) and Megas 4.1 doesn't have (Duraludon:
removed, 4.1 changelog line 14; Grimmsnarl: the Grimmsnite item exists but no Mega form) are left out. Where RR calc
and Showdown disagree, the game's own description decides (Draco Barrage).

**Base**: `cfru` (Gen 8 damage, Gen 6+ type chart: `data.js` types match it exactly), Megas and Z-moves on,
statuses restated with `frz` labelled Frostbite. Field: the `cfru` controls, Snow instead of Hail, plus two toggles
(Illusion intact; First turn out for Bull Rush / Quill Rush). `setterStays: true`: Hardcore Main!E10 makes every
AI-set weather and terrain permanent, so a departing setter leaves its layer (the player's own setters follow the same
switch; in the game theirs last 5 turns, which the calc does not count). Bosses' own permanent fields come from unit 6's
trainer `field` records. Player EVs: Main!E95 turns on Minimal Grinding (no player EVs) and bosses have none except
Ghost Marowak (252 HP). As in Photonic Sun's EV-less play, EVs stay on (`cfg.evs`, `cfg.calc.evs`): player sets
default to 0 and a trainer's EVs count. Names: the profile keys on the official names only (unit 9 removed the raw
`data.js` aliases: WaterCompaction, "Bone Zone " with its trailing space, Neutralize Gas, Inferno Parade and the
other 12-character ability spellings); `tools/cfru.py` CFRU_NAMES gives Infernal Parade / Supercell Slam, and
`radical-red_check.mjs` asserts that every override name is a guide name and that no CFRU short spelling is left in the
data or the rules. Move effects (11 RR records) are in `hacks/radical-red/calc_effects.json` (unit 9; assemble.py and
`radical-red_check.mjs` merge its moves into `over.effects`), with three fixtures `effects_check.mjs` runs on data.json
(Acupressure Atk +1, Charge Beam SpA +1, Octazooka Spe −1).

**Engine changes** (authorised by the main chat; all optional profile keys, `tools/calc/README.md` → Engine overrides;
profiles without them behave as before, regression sweeps below): unit 2's `over.abilities[name].statusImmune` (status
keys whose end-of-turn chip the ability stops; `test.mjs` "optional ability status immunity"); unit 11's `speedMods`
rule phase (the Speed modifier list of every Speed read: readout, turn order, Electro Ball / Gyro Ball, Sonic Slash's
`atk.stats.spe`), the ability keys `hazardImmune`, `selfDropImmune`, `mindBlownRecoil: false`, `drain`,
`keepsOnSuppressed`, `items[name].afterHit`, `state[name].theft` for a move other than Spectral Thief and a `defog`
record's `keepTerrain` (`test.mjs` "optional speedMods rules ..." and "optional ability / item / move keys ...").

**Inventory** (everything 4.1 adds or changes that bears on damage, Speed or the fight log; counts below):

| Group | Done by the profile (source; each has a fixture in radical-red_check) |
| --- | --- |
| Status-chip abilities | Toxic Boost (no psn / tox chip), Flare Boost (no burn chip): native boost + `statusImmune` (changes v3.1:46,49; Showdown abilities.ts:240,691) |
| Power abilities | Iron Fist 1.3x, not Wicked Blow; Striker 1.3x kicks; Illusion 1.3x while intact; Reckless incl. the Explosion family; Liquid Voice 1.2x; Rivalry 1.25x same gender, no penalty; Sharpness through RR's slicing flags (RR calc gen789.ts:1093,1130-1167; Showdown abilities.ts:324-353,533-555) |
| Attack abilities | Feline Prowess 2x SpA; Sage Power 1.5x SpA; Bull / Quill Rush 1.2x Atk on the first turn; Defeatist at 1/3 HP; Solar Power with no sun chip; Flower Gift: Cherrim's own Atk in Sun only, no SpD / ally boost (gen789.ts:1294-1349,1404; Showdown abilities.ts:93,170,230,251,556,665) |
| Type / final abilities | Corrosion (Poison hits Steel), Mountaineer (Rock immune), Water Compaction (Water halved), Fatal Precision 1.2x SE, Primal Armor 0.5x SE (Mold Breaker doesn't bypass it), Bone Zone (bone moves ignore immunity, 2x when resisted), Blubber Defense = Multiscale, Cash Splash = Water Bubble, Mold Breaker's exceptions (gen789.ts:134-165,299,1027,1355,1638,1646,1677; Showdown abilities.ts:60-152,364,457,716) |
| Other abilities | ORAORAORAORA! half-power second punch; Blazing Soul +1 Fire priority at full HP; Self Sufficient 1/16 heal; Bad Company no recoil (= Rock Head); Frozen Mist = Shield Dust, Valiant Shield = Dauntless Shield; Electromrphosis / Neutralize Gas / Wandering Soul = their official names (gen789.ts:588,1571; Showdown abilities.ts:2,51,381,638) |
| Statuses / weather | Frostbite: special damage halved (not Facade), 1/16 chip, Facade 2x; Snow: Ice Def 1.5x, no chip (changelog to v4.0:14; gen789.ts:553,992,1460; util.ts:540) |
| Moves (76 entries) | RR flags (kick, slicing, bullet, pulse, bone, punch; 41 moves); crit ratios (Drill Peck, Razor Shell, Snipe Shot, Zippy Zap); recoil (Volt Tackle 1/4, Chloroblast 1/2, Draco Barrage 1/3); Beat Up flat 25; Triple Kick 20 × hit; Shell Side Arm Special and ability-ignoring; the Explosion family halves Defense; Raging Bull / Multi-Attack take the user's first type; Sonic Slash 80 / 120 / 140 by speed ratio; Bitter Malice / Barb Barrage / Infernal Parade 2x on a status; Draco Barrage hits Fairy and turns Physical when boosted Atk > SpA; changed effects (Acupressure, Muddy Water, Octazooka, Ice Hammer, Razor Shell, Shell Side Arm, Charge Beam 100% SpA +1) (Showdown gen9rr/moves.ts; gen789.ts:211,741-763; util.ts:167) |
| Hardcore rules | Rapid Spin: no Speed boost (Main!E28); Ice Spinner / Steel Roller / Splintered Stormshards / Defog leave terrain (Main!E12; Defog: `calc_effects.json` record with `keepTerrain`); permanent AI fields (Main!E10, `setterStays`) |
| Speed (unit 11, `speedMods` rules) | Quick Feet 2x when statused (stock 1.5x removed; paralysis still ignored); Flower Gift Cherrim 1.5x in Sun / Harsh Sunshine, not with Utility Umbrella; Bull Rush / Quill Rush 1.5x on the first turn (the same First turn out toggle as their Attack); Upgrade (Porygon-Z) and Leek Stick (Farfetch’d, Galarian Farfetch’d, not Sirfetch’d) 1.5x; Magic Room / Klutz switch the items off (Showdown abilities.ts:93-103,251-268,505-526; items.ts:848-853,902-917; RR calc util.ts:110-127) |
| Other (unit 11) | Shield Dust / Frozen Mist: no entry hazard (`hazardImmune`; a Poison holder still absorbs Toxic Spikes; moves.ts:1053-1135); Bad Company: no self-caused stat drop, no Mind Blown / Steel Beam HP cost (`selfDropImmune`, `mindBlownRecoil`; abilities.ts:2-20); Soul Robbery steals boosts as Spectral Thief (`state`, theft `stock`; moves.ts:1000-1015, scripts.ts:495-519, RR calc gen789.ts:465); Magmarizer: Magmortar's damaging Fire moves add Tar Shot (Spe −1, the target's Tar Shot switch on), skipped when it already has it (`items.Magmarizer.afterHit`; items.ts:514-526); Parasitic Waste: moves with a psn / tox secondary drain 1/2 (`drain`; abilities.ts:400-416); Protosynthesis stays on in Sun under Cloud Nine / Air Lock (`keepsOnSuppressed: ["Sun"]`; abilities.ts:469-479) |
| Items | Gems 1.5x (all 18); Electirizer (Electivire's Fighting 1.5x), Burnt Seed (Sunflora's Fire 1.5x); Leek Stick +1 / +2 crit (Farfetch'd / Sirfetch'd); fling powers (Adamant Orb, Reaper Cloth, Leek Stick, Link Cable, Honey); 15 RR Mega Stones as Smogon's `{base: mega}` records, so Knock Off isn't boosted against them (Applite serves Flapple and Appletun; the old string form let it boost) (gen789.ts:1193-1199; Showdown items.ts:133,244,902-1168) |

Done by the base with no entry: Protean / Libero (every move), Intrepid Sword / Dauntless Shield (every entry: the
calc's entry toggle), Tera Shell, Protosynthesis, As One, Sharpness (1.5x; RR's slicing list is the profile's
flags), Shield Dust (secondaries; hazards below), Adamant Orb (base Dialga only; it turns Primal on entry),
Thick Club, plates / Z-crystals, the type chart, crits.

Labels only (no damage effect in the calc): Battle Bond, Emergency Exit, Forecast, Ice Body, Illuminate, Phoenix
Down, Pressure, Schooling, Truant, Zen Mode, Alchemic Power; Reaper Cloth / BrightPowder / Lax Incense accuracy,
King's Rock; secondary chances under 100% (Frost Breath's 30% frostbite, Bleakwind Storm, Head Charge, Rock Slide,
accuracy drops); Frenzy Plant / Blast Burn / Hydro Cannon / Meteor Assault skipping the recharge after a KO.

Not modelled (in-game numbers can differ):
- Gulp Missile's change (Gulping Cramorant's spit lowers Speed, not Defense): the engine has no Gulp Missile reaction
  at all (no guide models the 1/4 spit damage or its follow-up), so RR's change has nothing to change yet. It needs a
  defender-form reaction in `hp()` and the resolver, a shared engine addition beyond this unit.
- Draco Barrage recoil: Showdown's 1/3 (used); RR calc's 33/100 is at most 1 HP apart.

No number changes (so nothing to model): Sage Power's move lock (it only stops other moves being chosen after the
first; each move's damage is the same), Upgrade's no-consecutive-move lock (likewise), Battle Bond / Emergency Exit /
Schooling / Zen Mode / Forecast (form or switch effects: the calc's species / type choice covers them), and the labels
above.

Counts: abilities 54 (39 profile, 8 base, 11 labels only, 1 not modelled: Gulp Missile; unit 11 moved Quick Feet,
Shield Dust (hazards), Bad Company (drops), Parasitic Waste, Protosynthesis (suppressed Sun), Flower Gift / Bull Rush /
Quill Rush (Speed) into the profile); moves 76 profile entries (the other
gen9rr move entries only change availability, power / type / accuracy, which `data.js` supplies, or chances under
100%); held items: 18 gems, 15 Mega Stones and 7 other changed items in the profile (Electirizer, Burnt Seed, Leek
Stick, Adamant Orb, Reaper Cloth, Link Cable, Honey) plus Magmarizer and Upgrade (unit 11), plus the Hardcore rules.

**Checks** (2026-11-02, unit 11): `radical-red_check.mjs` 84 passed, 0 failed (13 new); `test.mjs` 150 (2 new);
every other `*_check.mjs` and `npm test` identical to BASE `d4b0f21` line for line apart from those (logs
`.tmp/rr-calc4/base/`, `.tmp/rr-calc4/head/`); `gate.py scenarios radical-red unbound emerald-imperium --only
calc-radical-red,calc-unbound,calc-layout,calc-controls` 12 / 12 (two new RR checks: Speed readout, hazard immunity).
Round 3: `node tools/calc/radical-red_check.mjs` 71 passed, 0 failed. Regression sweep:
every check `npm test --prefix tools/calc` runs, here and in a worktree at `3400658`: the same results line for line
except `test.mjs` 147 → 148 (the `statusImmune` test) and this check (skip → 71); all exit 0. Logs:
`.tmp/rr-calc3/sweep-base/`, `.tmp/rr-calc3/sweep-head/`. Not run: the hzla comparison, browser checks, the gate.

**Scenarios** (unit 9, `tools/scenarios/calc-radical-red.mjs`, through the page): Leader Blaine's Permanent Desolate
Land locks Harsh Sunshine (select read-only); setterStays: Pokemaniac Herman's Drought Ninetales leaves Sun up when he
switches (the first setter team with no battle effect); Ghost Marowak (Pokémon Tower 6F) with its 252 HP EVs and
player EVs at 0; statusImmune: Toxic Boost takes no poison / bad poison chip, Flare Boost no burn chip, other
abilities do; the radicalred41 profile refuses a synthetic Unbound 2.1 save ("Wrong game", nothing imported).
calc-doubles EXPECTED 47 (unit 6's count). Unit 9: `radical-red_check.mjs` 71 / 71, `effects_check.mjs` 90,
gate scenarios calc-radical-red 32 / calc-doubles 4 / calc-import 6 passed.

#### Open in-game checks
- Toxic Boost Zangoose poisoned and Flare Boost Drifblim burned take no chip, and still lose 1/16 to Sand.
- Ghost Marowak's HP with 252 HP EVs; other boss sets at 0 EVs.
- Draco Barrage turns Physical when the user's Atk is higher (dex text; RR calc keeps it Special) and hits Fairy.
- Flower Gift Cherrim: Atk 1.5x in Sun, no SpD boost; Quick Feet Speed (2x per Showdown).
- Defog with terrain up (Main!E12: the terrain stays; the calc's fight log clears it).
- A Shield Dust / Frozen Mist holder on Stealth Rock: no chip expected.
- Knock Off on a Mega Stone holder of the right species: no 1.5x.
### Items

`items.py` (unit 5). Sources: `data.js` areas (what lies where: `item-standard` / `item-hidden` by cap step, `item-shop`
stock, `item-cheat` = the care packages, `tutors`), the author's item sheet (`drive/Item, TM, and Move Tutor Locations
v4.1`: Overworld Items is the master list with the place text, gifts and rewards; TMs & HMs, Mega Stones and Z-Crystals
tabs cross-check it; Shops gives prices; Care Packages; Move Tutors), the Hardcore Main tab. IT is written in the old
boxes and `extractlib.finalise` files it in the Items standard; `itemstd.RULES['radical-red']` = a card per tutor
(`keep_sub`) and game order once the walkthrough exists.

- **Pairing**: each Overworld row is paired with a data.js entry of the same item in the areas its heading covers
  (`HEADING_AREAS`; hidden first when the sheet says hidden). No pairing across headings: data.js files the follower
  finds (Safety Goggles, Red Card, Protective Pads, Eject Button, plus a Big Nugget and a Wishing Piece) under Viridian
  City's Poké Center, so a wider search pairs wrong pickups. 442 sheet rows; 11 have no data.js entry and stay (gifts
  data.js doesn't list: Time Changer, Poké Vial, DexNav, Infinite Repel, the PC Potion, follower finds, Waterium Z).
  25 data.js pickups the Overworld tab lacks get a line from data.js (area name, `hidden`, `post-game` at the post-game
  step) with the TM / Mega Stone / Z-Crystal tab's text where it has one: Berry Forest's hidden berries, Pokémon Tower
  7F-9F Soothe Bells, Gouging Fire's room Iron / Rare Candy, Cape Brink PP Max, One Island's Z-Power Ring / Meteorite /
  Fightinium Z, Magearna's chamber Gracidea, Kyogre's chamber Water Stone, the Saffron Gym Cameruptite. 8 more are
  the second branch of one gift (Cinnabar Lab's Soul Dew / Reveal Glass / Prison Bottle / Lati stones, a second TM032)
  or a key item data.js files elsewhere (Tri-Pass at One Island; the sheet: the Route 16 girl), absorbed.
- **Lines**: `Found:` / `Also:` + the sheet's heading (`Route 4 (East)`, `Mt. Moon`) + `requires X` (the sheet's "(Surf
  HM required)", "Requires Mega Ring -", "(Z-Ring required)", "(Keycard required)" -> Card Key) + `post-game` + `hidden`
  + `xN` + the sheet's text. "left from the entrance" becomes "left of" (the shared relabeller reads "from <person>" as
  a gift). Consumables and sell items are not listed (Unbound's rule: medicine, balls, X items, nuggets, pearls...);
  Valuables are Shards, Heart Scales and Beast Balls. Key Items leave out Town Map, Pokédex, Teachy TV and the Silph
  Scope costume. Fossils: Helix / Dome "(can only pick one)".
- **Hardcore** (D1): rows tagged "(DEFAULT MODE(S) ONLY)" / "(REGULAR MODE)" go (Psyshock on the Underground Path,
  Trick Room from Sabrina, Light Clay, Booster Energy in Cerulean Cave, the Power Plant Eject Button); "(HARDCORE)"
  rows stay. Main E36: Weakness Policy, Throat Spray, Air Balloon, Light Clay and the four weather rocks are gone
  everywhere (pickups, shops, care packages, `P.hi`: 17 wild species). TM sheet: TM012 Taunt, TM017 Protect (Game
  Corner) and TM116 Trick Room are unavailable; TM104 Psyshock is Sabrina's. Main E24 / E26 swaps: Charizardite Y on
  Route 16, X from Blaine, Gardevoirite in the Mansion, Cameruptite from Sabrina (data.js lists both of each pair;
  `LEFT_DROP` keeps the Hardcore one). Quest rows take the sheet's MGM / Hardcore wording (125+ base stat, a shiny
  for Sabrina; Main E81). Route 4's right Black Belt gives 4 PP Ups instead of the Macho Brace. Lucky Egg is not held
  by wild Pelipper (Other Useful Items C12). Electric / Misty / Psychic Seed: a `Wild:` line "only after beating Lt.
  Surge / Sabrina / Koga" (Main E14-E18). Care packages: red (not in Hardcore) and blue (not in MGM + Hardcore;
  Hardcore turns MGM on, Main E95) items left out: 25 of 136, mostly the EV items. Move tutors in red go: the Vermilion
  Fan Club, Pewter Museum, Fuchsia gate / Kangaskhan, Cinnabar R&D Room and Victory Road tutors, and Tailwind / Stealth
  Rock / Spikes / Toxic Spikes at the Testing Room (data.js lists the Testing Room twice: the 8-move list is
  Hardcore's). The report's "Hardcore leaves out" line lists every removal. The same list
  (`items.hardcore_gone_tutors()`: red on the Move Tutors tab and no Hardcore tutor teaching the move, 23 moves) is
  dropped from every species' `P.tu` by dex.py (unit 9: 10,325 -> 3,654 entries); check.py guards both.
- **Shops**: the marts' common stock (the 19 items all 10 data.js marts sell) is one "Any Poké Mart" line at FireRed's
  price (pokefirered `items.json`; the sheet prices only the special shops); the rest per shop with the Shops tab's
  price (Cerulean TMs, Celadon Dept. Store 2F / 4F / 5F / rooftop, Game Corner TMs in ₽, Trainer Fan Club, Cinnabar
  Lab, Two Island, One Island's BP exchange). Two Island's Timer Ball / Lava Cookie take FireRed's price. TM113 Play
  Rough is bought from the Dept. Store 3F clerk (₽15,000). BP Z-Crystals, the Master Ball and the Necromizer are Shop
  lines in their own boxes.
- **Care packages** (`item-cheat`): one `Also: Care package · <when> · xN` line per item, paired with its data.js area
  by item overlap (walk.py gets the area and step). data.js also lists a Rare Candy and a Pomeg Berry at Viridian City
  that no package has: left out (reported).
- **Tutors**: a card per tutor, "<who> (<town>)"; moves with the tutor's place and cost. data.js's Uproar tutor in
  Saffron's Gian's House 2F is on no sheet: its own card. The relearner, deleter and egg move tutor are Useful NPCs.
- **Mega Stones**: P.stone of Mega / Primal forms; `P.sloc` = the stone's line without its label. Red Orb and Adamant
  Orb (Primal Groudon / Dialga) have no place in any source.
- **Cross-check** (report "tabs differ"): the TM, Mega Stone and Z-Crystal tabs name the same places as the lines for
  every item (proper-name words compared); only wording differs (TM034 Teleport: "large grassy patch" vs "south
  eastern corner near the Raid Den", both Route 3). The Z tab and Overworld tab put Waterium Z with Gian in Saffron City;
  data.js files it under Cerulean City's Gym (Saffron kept: both tabs agree, and the Mudkip kid lives there).
- **Item text**: `item_desc.json` is written by `items.py` from data.js (613 items; TMs and unused records left out).
  `changed` = differs from FireRed's text (case, line breaks and accents ignored) or RR changed the effect
  (`RR_EFFECT`): 41. `battle_text.json`: the RR effects from Showdown `gen9rr/items.ts` and the changelogs (Gems 1.5×,
  Bright Powder / Lax Incense / King's Rock no battle effect, the signature items Electirizer, Magmarizer, Up-Grade,
  Burnt Seed, Reaper Cloth, Leek Stick, the Adamant / Eternamax Orb Primal forms). `item_text_extra.json`: DexNav,
  Necromizer, Time Changer (made-up from the changelogs). Names: `common.ITEM_FIX` gives the standard spelling of
  data.js's Charzardite X / Y, Blastoisnite, Kangaskanite, Aerodactlite, Houndoomnite, Alorichium Z, Pikshunium Z
  and Fight Memory for every lookup (items, trainers, GID; unit 9 added the last four, so GID shows them too); the two
  pickup keys whose item was renamed (p209 TM011 Supercell Slam, p439 Houndoominite) were renamed in place.
  Icons (unit 9: `tools/item_icons.py --fetch` gave the shared index a radical-red map; the other guides' maps, PNGs
  and sheets were kept as committed, since a full regenerate would also change theirs): 478 of 495 names, 12 new PNGs
  (FireRed key items, Dynamax Band, Cornerstone Mask, Tea, Poké Vial, Meteorite ...; Infinite Repel uses Max Repel's).
  No art in any pinned set (17): Ability Pill, Alcremite, Burnt Seed, DexNav, Dream Patch, Eternamax Orb, Itemfinder,
  Leek Stick, Medicine, Necromizer, Necrozium Z, Oak's Parcel, Poké Rider, Rusty Shield, Rusty Sword, Stat Scanner,
  Time Changer.
- **For walk.py**: `items.PICKUPS` = one record per Found / Also line `{box, item, line, area, step}` (data.js area index
  and cap step; None for sheet-only rows). Lines are final after the Items standard except the relabeller may swap
  Found / Also: match on item and place, not the label.
### Locations

Source: data.js `areas` (221, game order; index = LOC index). Built by `extract/locs.py` (step 1 of unit 4).

- LOC: one sublocation per data.js area. AR: one tracker slot per place, the area name without its floor / room
  suffix (Mt. Moon 1F / B1F / B2F = Mt. Moon): 153 places, 67 with no encounters (`ns`, no slot), then the
  Mystery Gift place (below).
- Encounter keys: wild-day / wild-night (grass, 12 FRLG slots 20/20/10/10/10/10/5/5/4/4/1/1), wild-surf and
  wild-smash (60/30/5/4/1), rods (old 70/30, good 60/20/20, super 40/40/15/4/1), raids 1-6 (12 drop items in
  the row note, each with its slot's chance 100/80/80/50/50/30/30/25/25/5/4/1%, the Raid Dens tab's fixed slot
  rates; an item in two slots "Big Nugget 80/80%"), fixed-overworld (Static), fixed-gift (Gift; more than one entry = "Gift (pick one)", "1 of N"),
  fixed-trade (Trade), fixed-roaming (Roaming, "1 of N"). Trainers and item keys are other units'.
- Cap step: each key's step is shown as its Hardcore level cap ("cap 22") in the group label and row notes.
- P.g: 0 = found in a location, or the first same-dex base form found, or evolved from an obtainable species
  (Unbound's rule), or the pre-evolution of one (breeding: Pichu, Cleffa, Igglybuff, Azurill), or a form in
  `sheet_locs.json` → follow whose base is (Greninja-Ash by Ability Pill, Cherrim-Sunshine, Unfezant-F); 3 = not
  found or on the sheet's Unobtainables tab; Megas keep 1 (prune.py decides them). Counts: 1,235 obtainable, 40 not
  (Arceus, Eternatus, Magearna-Original and their / Dialga / Palkia's forms: the sheet's "1023/1025"; check.py fails
  on any other species not found), 68 Megas. Step 1 (data.js only) had 1,192 / 83.

Sheet additions (`extract/sheet_locs.json`, hand-copied from "Pokémon Locations & Raid Dens v4.1"; data.js stays the
encounter source, the sheet fills what it lacks):
- Oak's Lab's 27-entry gift list is the Starter choice (method `Starter choice`, "1 of 27", its AR has `st`), the
  starter picker's list (`cfg.starter = "pick"`). Not on the sheet.
- Mystery Gift: the 19 Lv 85 legendaries of the Mystery Gifts tab (Ho-Oh ... Groudon, with the sheet's held item /
  Gift Move notes; codes left out: "Code at a Pokémon Center Nurse after the Hall of Fame"). LOC 221 and an AR place
  appended after the data.js areas, `ns` (no tracker slot), no cap in the label.
- Gift levels and how-to from the Gifts tab on data.js's gift rows (Finizen 5 ... Mew 100); One Island Poké Center
  Cosmog (Battle Simulator, 50 BP) added. Enamorus (Statics tab: Lv 100, roams Kanto after an 8-win streak, 6 in
  Hardcore Simulator mode, at the One Island Battle Simulator) added as a Roaming row on Viridian City, where
  data.js puts its 10 roamers, at the postgame step. Lapras is Lv 25 at Silph 7F (data.js cap 56), Kubfu 30.
- Vermilion Fan Club: data.js's 10-entry gift list is the Hiker's shard trade (method `Shard trade`, the shard
  colour in the note, no "1 of N": each shard buys the one you pick); the Mt. Moon Helix / Dome Fossil pair added as
  `Fossil (pick one)` (revived in the same building). Aerodactyl stays a Fan Club gift (data.js, cap 36) noted "Old
  Amber from Pewter Museum, revived here": the sheet's "Pewter Museum" column is where the fossil is found.
- Celadon Mansion 1F: data.js's 42-entry list is the shard eggs (method `Shard egg`): each shard gives a random egg of
  its colour, "1 of 9" (Green / Blue / Red starters) or "1 of 8" (Yellow: 7 Pikachu forms + one "Any Cap" slot shared
  by the 7 cap Pikachu). Pikachu-Cosplay is in data.js but not on the sheet ("Doc doesn't list it").
- Trades: each row says what the NPC wants ("for a Snom"). Route 2's reward is "?" on the sheet; data.js: Chillet.
- Water tables data.js has none for, from the Fishing & Surfing tab, rows "Doc only": Fuchsia City (all 3 rods, Surf),
  S.S. Anne Port (Super Rod, Surf: Tentacool / Tentacruel / Barraskewda). Cap step = the step data.js gives the same
  table kind at the same levels. Not added: Route 11 Surf (Tentacool Lv 5-40, FRLG's unedited table).
- Eggs (Wonder Egg Pokémon Pools v4.1 workbook, copied into `sheet_locs.json` → eggs): the egg NPC in Pewter,
  Cerulean and Vermilion City (5,000$) sells a Wonder Egg (Pewter's pool 256, Cerulean / Vermilion's 339) or a
  Paldea Egg (42); the Aide in the Celadon (after the 4th badge) and Fuchsia Pokémon Centers gives a Sevii Egg (12,
  the two never the same). The pools are not listed (the user, 2026-11-02: "just outline if it's a normal, Paldea,
  or Sevii egg"): each vendor place gets an AR note naming the egg(s) it sells and the price / condition (5 notes).
  A species no other way gives (not found, not an evolution, not bred from an obtainable one) keeps one P.w row
  naming the egg type at its first vendor, no rate, the other vendors in the note: 2 (Phione, Minior). Unit 4's
  1,084 per-city "1 of N" rows are gone (P.w 2,635 -> 1,553 rows, the guide 4.50 -> 4.30 MB). Sheet colour names
  mapped to the dex's (Squawkabilly-Green, Tatsugiri-Red, Tauros-Paldea-Fire / -Water).
- Unobtainables tab: Arceus, Dialga-Origin, Eternatus, Magearna-Original, Palkia-Origin forced to g 3 (Magearna-Original
  was g 0 through its base, Dialga / Palkia-Origin would be through the Mystery Gifts).

Sheet vs data.js (name-matched, `.tmp` compare; data.js kept):
- Grass & Caves: 121 of 125 bands match. The sheet's Seafoam floors are one floor up (its 1F / B1F / B2F / B3F = data.js
  B1F / B2F / B3F / B4F, all matching); its extra "Seafoam B4F" band has no data.js table. "Three Island" = Three Isle
  Port. Rock Tunnel 1F: sheet Minior (Red Core), data.js Minior (Meteor) (the same wild Minior). Pokémon Tower 8F at
  night: sheet Gengar, data.js Sinistcha / Ursaluna-Bloodmoon (as by day): row notes "Doc says Gengar at night".
- Fishing & Surfing: every band data.js has matches (sheet "Seafoam B2F" = data.js B3F, "B3F-B4F" = B4F); the gaps
  are the doc-only tables above.
- Safari Zone: all 30 bands match. Game Corner: the 15 match. Trades: the 9 match. Fossils: the 10 match.
- Statics: the raid-den legendaries are data.js Raid rows; Keldeo (Seafoam B2F) and Marshadow (Pokémon Tower 9F) are
  data.js statics the sheet doesn't list.
- Raid Dens: the 45 dens' 167 species all match. Stars: Route 2, 8, 9, 10, 12, 16, Rock Tunnel and Diglett's Cave
  dens are ★★ on the sheet, data.js `raid1` (kept); the Loyal Three den is the sheet's "Safari Zone Far-Western Area"
  ★★★★, data.js Moltres' Den `raid3` (kept). Drops: the 12 per species match as sets except Rock Tunnel B1F ★★★★★
  Iron Leaves / Iron Crown (sheet Star Piece, data.js Nugget; kept); the sheet's "Ability Capsule" = Ability Pill.
### Trainers (unit 6, 2026-11-02)

`extract/trainers.py` (TR), readers `bosssheet.py` (`.src/trainers-hardcore.xlsx`: boss blocks, Trainer Order, Main
caps) and `setcheck.py` (the sheet / RR calc / hzla comparison); `check.py` → `trainer_checks` asserts the counts below.

**Teams: data.js `hardcore`** (D1, D2) for all **464 trainers = 460 cards + 2 partners + 2 same-team copies**:
Silph Brendan 55 is the `pt` of Archer 53 and Ariana 54 (one `bt`), Cerulean Cave Lance 39 the `pt` of Giovanni 69
(Team Rocket E240 / E409); Jasmine 63 and 64 have exactly 62's Hardcore team (they differ only in Normal): one card.
Mon fields: level codes 101-104 = cap + 0 / −1 / −2 / −3 (`scaledLevels`, the sheet's "Highest Lv −N" / "Player Max
Level"), 250 kept (Creator 24); **IVs / EVs are in the game's order** (HP, Atk, Def, Spe, SpA, SpD: the RR calc's IVs
agree 245 / 253, and the sheet's Hidden Power types follow from it), turned into the schema's; Hidden Power → `hp`.
**Ability slot** 0 / 1 / 2 = hidden / primary / secondary, an empty slot or 3 = the primary (the RR calc's sets agree on
1,251 of 1,278; the rest are name spellings or calc gaps). **Forms:** data.js evolution method 254 `[254, item, form, kind]` = Mega / Primal / Ultra Burst /
Crowned when holding the item, kind 2 = by a move (Rayquaza: Dragon Ascent, no Z-crystal): `id` is that form, `a0`
the base ability. **A Mega keeps the base's ability slot** (RR Megas have up to three; Mega Absol Sharpness, Mega
Ampharos Mold Breaker, Mega Slowbro Shell Armor: sheet and calc agree).
**Placement** (the user's answers): boxes are the 18 Hardcore caps (Caps). A Trainer Order entry (115, matched to
trainers through its link to a boss block) places its trainer: a **number** is the only cap it's fought at, so that
cap's box, even where the entry sits after the split's boss (row 366 Lewis 73, after May: Pre-May; Justin 68:
Pre-Koga); a **range / open cap** ("28/36", "16+", "59/68") keeps its place in the order (the sheet's recommended
split, F3 comment) and gets the **cap box**: scaled levels relative (`r`), `t.cap` the box's cap. A blank cap (Shelly,
Cerulean Cave Ariana) is the fight before's. A fight's other teams (starter, Team one / two, Ketchup's rematch: same
name, place and cap, a block of their own, no entry of their own) go with it. 22 trainers moved off their data.js cap
(report: Nugget Bridge / S.S. Anne / Route 9-10 mini bosses, Johto leaders, Justin, Lewis, ...). Every other trainer is
in its data.js cap's box. Order in a box: data.js area order, then Trainer Order, then the sheet's block order
(unit 8 re-sorts by the walkthrough). **Gym rematches** (Brock 56, Misty 48, Lt. Surge 51, Erika 65): Pre-Koga, cap
box (sheet 59 / 68), not Optional, the note "Beat at least 3 of these 4 gym rematches (Brock, Misty, Lt. Surge,
Erika) before Koga." 46 cards have the cap box; no team mixes scaled and fixed levels.
**Rival:** `t.st` = the **player's starter type** (Main E93: the Squirtle team = a Fire starter; the game offers 27
starters from every generation, so a name can't work): from the block's "IF RIVAL HAS X" label, else the team's
starter line. Six rival fights × 3 (Lab, Route 22 ×2, Cerulean, Silph, Champion). `cfg.starter` must be `type`.
**Labels and BATTLE EFFECT lines** (`EFFECTS`, every part known or the build fails): tags Double Battle, Permanent
Rain / Sun / Sandstorm / Snow / Desolate Land / Primordial Sea / Delta Stream / Electric / Grassy / Psychic / Misty
Terrain / Trick Room / Swamp / Magma Storm / Magnet Rise, "Permanent Tailwind on enemy side" (Koga, Ketchup: the
boss's side, guess from the sheet's tailwind speeds), Inverse Battle; "Team N of M" / "Rain team (1 of 2)" (E4,
Pryce), First battle / Rematch (Ketchup 20 then 19, "at least a day after", unit 3), Back to Back #1-#3 (Justin →
Andrew, Lao → Koji → Luke, Sam → Shelly, Archer 67 → Ariana 68, Oak 200 → 210); Bugsy 47 / 8 notes before / after Lt.
Surge; the rest as short notes (Brock's 33 % cut, Erika's resisted Grass bonus, endure effects, Fairy ban, hazards,
forms that start transformed, Swamp quarters your Speed, Magma Storm spares Fire types). "X IS PRE-BURNED /
PRE-POISONED" → that mon's `pre`. Duo classes (Twins, Young Couple, Cool Couple, Sis And Bro, Crush Kin) are double
battles (FRLG; the sheet marks Ray & Tyra and Joy & Meg DOUBLES). Optional = the Trainer Order's (OPTIONAL).
**Checks** (`setcheck.compare`, report "boss teams checked"): 185 of 186 sheet blocks matched (team species, then
moves; pair blocks → two trainers; Postgame!C1175 Berry Forest Spirit has no data.js trainer), 967 mons. **Sheet
says** on the card (11): Chuck's Steadfast, Silph Brendan's HP Fire, Cave Lance Naive, Lass Ali / Picnicker Caitlin
Bashful, Lass Reli / Lass Ann Battle Armor, Camper Ethan Adamant, Sam's HP Psychic, Samantha Jolly, Morty's
Thunderbolt. Not shown: abbreviations (word prefixes), "(Both)", "A or B", Primal / Crowned forms listed with their
own ability, the game's short item names (Rusty Shield / Sword, Necrozium Z, Leek Stick), the sheet's "Eathquake". RR calc (905 sets): 6 differences, report only. hzla (539 boss sets): 38,
mostly ability slots that contradict both data.js and the sheet: report only; **hzla says** only where the sheet
differs too (Lass Ali's Brionne Bashful). The Main tab's comments ("supposed to be Modest, actually Adamant", 0 Speed
IVs) agree with data.js.
**Field records** (`tools/trainer_fields.py` → `RR_FIELD_EFFECTS`, exact tag texts): 108 = 47 doubles + 61 field
tags, none to review. Terrains and the existing weathers permanent; Desolate Land / Primordial Sea / Delta Stream =
Harsh Sunshine / Heavy Rain / Strong Winds, permanent and locked; Swamp, Magma Storm, Magnet Rise text only (no calc
field). Setter audit (Main E10, AI weather / terrain is permanent): 75 teams set weather / terrain by ability or move;
4 also carry the sheet's tag, 71 don't (Sabrina's Misty Surge, Koga's Psychic Surge, ...): those stay with
`cfg.calc.setterStays`, not a field record. 47 tagged teams have no setter (the field comes with the battle).
**Trainer keys**: `extract/trainer_keys.json`, seeded by this unit's build (460 cards, "g.s.t" as they were, game id
`id` = data.js trainer ID).

### Caps

data.js `caps` (`cap[1]`, Hardcore) = Main E44:E78, asserted on every build: Pre-Brock 16, Pre-Mt. Moon Archer 23,
Pre-Misty 28, Pre-Lt. Surge 36, Pre-Erika 44, Pre-Game Corner Giovanni 47, Pre-Silph Co. Archer & Ariana 56,
Pre-Giovanni Silph Co. 57, Pre-Sabrina 59, Pre-Koga 68, Pre-May 73, Pre-Blaine 76, Pre-Cerulean Cave Archer & Ariana
79, Pre-Cerulean Cave Giovanni 80, Pre-Clair 81, Pre-Brendan 82, Pre-Elite 4 85, Post Game 100. `TR.caps` lists them;
boxes are `<name> Split [Cap N]` (the shared `split_name`; the calc shows "Pre-Brock"), Post Game included (cap 100,
so its scaled levels are 97-100). Each split ends at its Trainer Order boss (`ENDERS`), asserted against data.js.

### Walkthrough (unit 8, 2026-11-02)

No RR walkthrough doc exists. `extract/walk.py` → `ROUTE` is a hand table, one line per stop: split (cap step),
stop key, data.js areas, trainer ids in fight order (or empty = the split's cards at those areas, box order) and
checklist steps. 18 splits = the Trainers boxes, 136 stops, 32 steps. Order: unit 3's research
(`plans/radical-red-walk.md` section 2, in git history once deleted) with the Trainer Order's sequence, changed where
the user's answers or unit 6's boxes say otherwise.
- **A stop holds only its split's fights**: each card is in one stop of its own Trainers box (`check_walk`), and each
  split's last stop ends with its cap boss. Where data.js and the Trainer Order put a place's fights in two boxes the
  place is visited in each: S.S. Anne cabins before Misty (data.js cap 28), the hall doubles, Brendan and the Captain's
  Cut after her (Trainer Order 28/36); Route 9 / Rock Tunnel / Route 10 / Route 8 ordinary trainers before Lt. Surge
  (data.js cap 36: the Pre-Surge split loops Route 9 → Lavender → Celadon (Tea) → Saffron Dojo → Vermilion Gym), their
  mini bosses (Alicia, Caitlin, Dana, Herman, Aidan, Morty, Bugsy 8) after him; Lewis (Mansion B1F) before May, the
  rest of the Mansion before Blaine; Justin with Route 12 south in Pre-Koga; the four gym rematches in Pre-Koga, first
  stop carrying the "3 of 4" step.
- **Stop keys** are semantic (`pewter-gym`, `ss-anne-cabins`, `cerulean-cave-ketchup`), written in ROUTE: never
  positions, never changed (a stop cut in two keeps its key on the first part). `check_walk` asserts the data's keys
  = ROUTE's.
- **Trainers** by data.js id (the card's `id`; `trainer_keys.json` holds it); partners 55 / 39 and Jasmine 63 / 64
  have no card. Same-fight alternatives stay together (rival starter teams, E4 / Pryce teams).
- **Encounters**: a stop's `a` = the tracker places (AR) of its data.js areas; Mystery Gift is its own Post Game stop.
- **Items**: each `items.PICKUPS` line goes to the stop at its data.js area in its own cap step's split, else the
  last such stop of the split before (boss rewards are the next step's bucket: Brock's TM, Blazikenite, Clair's TM),
  else the first later visit (14, listed in the report: Cut and the S.S. Anne 2F items, the Kid's rewards, the Route
  16 gatehouse Mega Stones, Cinnabar Lab gifts). The 8 lines with no data.js area go by item (`NO_AREA`). All 451
  placed, np empty. The pickup keys' `loc` now follows the stop names (keys unchanged).
- **Guesses** (no source has the order): ordinary trainers within a stop keep the box order (data.js area order);
  the Pre-May Surf circuit (Moltres' Den, Routes 19-20, Seafoam, Route 21, Viridian / Route 22, Route 24, Route 4
  Crissy, Route 10 Mark, Power Plant, Vermilion, Route 12, then Mansion B1F and May); Rock Smash / Strength returns
  (Route 2, Viridian Forest Heart, Mt. Moon, Route 6, Rock Tunnel, Celadon) in Pre-Koga between the gym rematches.
- **Open order questions** (check in game): can the S.S. Anne cabins be cleared before Misty without passing the
  1F / 2F hall doubles; is Saffron's Dojo reachable before Lt. Surge with the Tea (the Pre-Surge loop needs it); Mansion
  B1F for Lewis before May without the rest of the Mansion; does Route 16's north side (Lea & Jed, Fly house) need
  Cut from Celadon only; Kindle Road / Bond Bridge / Mt. Ember trainer order (Postgame sheet listing order).

## Local storage

Prefix `rr`. Keep these keys once published.

- `dex`: `rrdex`
- `calc`: `rrcalc`
- `track`: `rrtrack`
- `walk`: `rrwalk`
- `cap`: `rrcap`
- `tr`: `rrtr`
- `recent`: `rrrecent`
- `pos`: `rrpos`
- `mgm`: `rrmgm`
- `loc`: `rrloc`
- `items`: `rritems`
- `dmg`: `rrdmg`

## Hack-only data

TODO: document hack-only data.

## Checks

`uv run python -I tools/gate.py check radical-red`

TODO: replace extract/check.py and calc stubs with source-backed assertions. Calc remains disabled.
Before enabling it, replace the null in tools/scenarios/calc-doubles.mjs EXPECTED with an audited count and add
tools/trainer_fields_check.py DOUBLES_EXPECTED (DOUBLES_PARTNER_ONLY if needed). The engine stub is registered
in tools/calc/package.json; review tools/calc/test.mjs field-profile fixtures. Never copy another hack's counts.
Review tools/itemstd.py RULES only for source-backed quirks; shared defaults need no entry.
Fill sources/watch.json, version/mode, GID/save reader and sprite additions by hand.

## History

TODO: document history.
