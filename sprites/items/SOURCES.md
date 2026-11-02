# Shared item icons: sources

Fetched 2026-11-01. Rebuilt by `tools/item_icons.py`.

## Pins and fetch

```sh
uv sync
uv run python -I tools/item_icons.py --fetch
uv run python -I tools/item_icons.py --check
```

Fetch uses GitHub recursive trees at exact commits and raw URLs; sources stay in ignored `.tmp/item-icons/`.
Each URL below is an input, not a runtime request. The script reapplies JASC palettes to expansion/EI indices;
colour zero is transparent. Hardlove PNGs use their embedded palette with index zero transparent.
Non-24px fallback frames are cropped to visible artwork, centred on 24px, and reduced with nearest-neighbour
only if their visible bounds exceed 24px. Serebii uses the existing transparent RGBA pixels.

## Retained published artwork

`retained.json` is a build input, not a generated report. It records the pinned source recipes and hashes
for published icons whose old labels no longer occur in guide data (chance-prefixed held items, spelling
aliases and Baile Style labels). Rebuilds regenerate these from the same pinned inputs, preserving canonical
PNG names and pixels as well as old global lookups. No artwork needs an unpinned or committed-only fallback.
Bridge Mail M/T/V resolve by normalised name to their existing SHA-256-pinned Serebii sources.

`PREFERRED_CANONICAL` preserves the published `maxrepel.png` name for the identical Infinite Repel art.
All other identical-art groups keep their lexicographically first key.

## Counts

| Source | Logical keys (including aliases) | Stored canonical PNGs |
| --- | ---: | ---: |
| expansion | 634 | 605 |
| imperium | 28 | 9 |
| hardlove | 12 | 11 |
| serebii | 38 | 38 |

Canonical counts assign shared art to its preferred published key, otherwise its lexicographically first key; another source may provide
identical art. `provenance.json` preserves the actual source for each logical key.

## Terms and credits

Pokémon and item art © Nintendo / Creatures Inc. / GAME FREAK inc.; guides are free and non-commercial.
Credits: rh-hideout/pokeemerald-expansion, pret/pokeemerald, iriv24/Emerald Imperium, kumakuma1/Hardlove,
BluRosie/hg-engine and their contributors; Serebii for the fallback item images.
The expansion has no licence file; see the parent `sprites/SOURCES.md` and its upstream credits.
https://github.com/rh-hideout/pokeemerald-expansion/blob/73b3fbeb574327cd9420c89e56bef5aa3c08fead/CREDITS.md

## Exact source URLs

### expansion: `rh-hideout/pokeemerald-expansion`

Pin: `73b3fbeb574327cd9420c89e56bef5aa3c08fead`.

https://api.github.com/repos/rh-hideout/pokeemerald-expansion/git/trees/73b3fbeb574327cd9420c89e56bef5aa3c08fead?recursive=1

- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ability_capsule.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ability_patch.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/abomasite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/absolite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/absolite_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/absorb_bulb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/adamant_orb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/adrenaline_orb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/aerodactylite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/aggronite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/aguav_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/air_balloon.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/alakazite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/aloraichium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/altarianite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ampharosite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/amulet_coin.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/antidote.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/apicot_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/armor_fossil.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/aspear_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/assault_vest.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/audinite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/awakening.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/babiri_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/balm_mushroom.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/banettite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/barbaracite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/baxcalibrite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/bead_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/beast_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/beedrillite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/belue_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/berry_juice.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/bicycle.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/big_nugget.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/big_root.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/bike_voucher.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/binding_band.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/black_augurite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/black_sludge.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/black_type_enhancing_item.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/blastoisinite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/blazikenite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/blue_orb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/blue_shard.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/bluk_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/blunder_policy.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/bone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/booster_energy.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/bottle_cap.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/bright_powder.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/bug_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/bug_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/bug_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/buginium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/burn_drive.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/burn_heal.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/calcium.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/cameruptite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/carbos.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/card_key.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/casteliacone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/catching_charm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/cell_battery.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/chandelurite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/charcoal.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/charizardite_x.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/charizardite_y.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/charti_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/cheri_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/cherish_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/chesnaughtite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/chesto_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/chilan_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/chill_drive.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/chimechite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/choice_band.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/choice_scarf.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/choice_specs.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/chople_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/cleanse_tag.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/clear_amulet.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/clefablite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/clever_feather.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/coba_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/coin_case.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/colbur_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/comet_shard.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/cornerstone_mask.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/cornn_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/cover_fossil.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/covert_cloak.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/crabominite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/custap_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/damp_mulch.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/damp_rock.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dark_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dark_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dark_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/darkinium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/darkranite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dawn_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/decidium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/deep_sea_scale.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/deep_sea_tooth.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/delphoxite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/destiny_knot.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/devon_scope.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/diancite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dire_hit.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dive_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dna_splicers.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/douse_drive.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dowsing_machine.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/draco_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dragalgite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dragon_fang.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dragon_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dragon_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dragon_scale.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dragon_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dragoninite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dragonium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/drampanite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dread_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dream_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dream_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dubious_disc.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/durin_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dusk_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dusk_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/dynamax_band.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/earth_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/eelektrossite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/eevium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/eject_button.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/eject_pack.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/electirizer.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/electric_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/electric_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/electric_seed.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/electric_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/electrium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/emboarite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/energy_powder.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/energy_root.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/enigma_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/escape_rope.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ether.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/everstone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/eviolite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/excadrite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/exp_share.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/expert_belt.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fab_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fairium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fairy_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fairy_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fairy_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/falinksite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fast_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/feraligite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fighting_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fighting_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fighting_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fightinium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/figy_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fire_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fire_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fire_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fire_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/firium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fist_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/flame_orb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/flame_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/float_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/floettite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/flying_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/flying_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/flying_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/flyinium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/focus_band.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/focus_sash.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/fresh_water.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/friend_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/froslassite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/full_heal.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/full_incense.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/full_restore.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/galarica_item.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/galladite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ganlon_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/garchompite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/garchompite_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/gardevoirite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/gengarite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/genius_feather.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ghost_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ghost_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ghost_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ghostium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/glalitite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/glimmoranite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/glitter_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/go_goggles.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/gold_bottle_cap.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/gold_teeth.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/golisopite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/golurkite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/good_rod.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/gooey_mulch.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/gracidea.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/grass_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/grass_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/grass_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/grassium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/grassy_seed.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/great_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/green_shard.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/greninjite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/grepa_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/grip_claw.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/griseous_orb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ground_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ground_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ground_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/groundium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/growth_mulch.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/guard_spec.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/gyaradosite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/haban_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/harbor_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/hard_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/hawluchanite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/heal_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/heal_powder.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/health_feather.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/heart_scale.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/hearthflame_mask.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/heat_rock.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/heatranite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/heavy_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/heavy_duty_boots.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/heracronite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/hoenn_fossil.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/hondew_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/honey.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/houndoominite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/hp_up.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/hyper_potion.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/iapapa_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ice_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ice_heal.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ice_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ice_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ice_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/icicle_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/icium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/icy_rock.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/incinium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/insect_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/iron.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/iron_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/iron_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/jaboca_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/jaw_fossil.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/kangaskhanite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/kanto_fossil.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/kasib_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/kebia_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/kee_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/kelpsy_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/key.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/kings_rock.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/kommonium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lagging_tail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lansat_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/latiasite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/latiosite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lava_cookie_and_letter.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lax_incense.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/leaf_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/leek.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/leftovers.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lemonade.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/leppa_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/level_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/liechi_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/life_orb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/light_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/light_clay.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/linking_cord.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/loaded_dice.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lopunnite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/love_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lucarionite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lucarionite_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/luck_incense.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lucky_egg.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lucky_punch.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lum_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/luminous_moss.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lunalium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lure_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lustrous_orb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/luxury_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/lycanium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/macho_brace.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/magearnite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/magmarizer.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/magnet.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mago_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/magost_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/malamarite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/manectite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/marshadium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/master_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mawilite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/max_potion.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/max_repel.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/meadow_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mech_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/medichamite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mega_ring.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/meganiumite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mental_herb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/meowsticite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/metagrossite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/metal_coat.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/metal_powder.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/meteorite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/metronome.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mewnium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mewtwonite_x.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mewtwonite_y.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/micle_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mimikium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mind_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/miracle_seed.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/misty_seed.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/moomoo_milk.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/moon_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/moon_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/muscle_band.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/muscle_feather.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mushroom.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/mystic_water.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/n_lunarizer.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/n_solarizer.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/nanab_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/nest_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/net_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/never_melt_ice.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/nomel_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/normal_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/normal_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/normalium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/nugget.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/occa_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/odd_incense.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/odd_keystone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/old_amber.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/old_gateau.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/old_rod.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/old_sea_map.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/oran_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/orange_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/oval_charm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/oval_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pamtre_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/paralyze_heal.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/passho_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/payapa_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pearl.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pearl_string.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/peat_block.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pecha_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/persim_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/petaya_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pidgeotite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pikanium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pikashunium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pinap_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pink_nectar.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pinsirite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pixie_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/plume_fossil.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/poison_barb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/poison_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/poison_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/poison_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/poisonium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/poke_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/poke_flute.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/poke_radar.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/poke_toy.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pomeg_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pot.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/potion.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/power_anklet.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/power_band.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/power_belt.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/power_bracer.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/power_herb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/power_lens.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/power_weight.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pp_max.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pp_up.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/premier_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pretty_feather.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/primarium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/prism_scale.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/prison_bottle.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/protective_pads.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/protector.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/protein.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/psychic_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/psychic_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/psychic_seed.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/psychic_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/psychium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/punching_glove.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pure_incense.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/purple_nectar.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/pyroarite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/qualot_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/quick_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/quick_claw.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/quick_powder.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rabuta_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rage_candy_bar.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/raichunite_y.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rare_candy.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rawst_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/razor_claw.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/razor_fang.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/razz_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/reaper_cloth.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/red_card.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/red_nectar.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/red_orb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/red_shard.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/relic_copper.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/relic_gold.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/relic_silver.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/relics.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/repeat_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/repel.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/resist_feather.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/retro_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/reveal_glass.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/revival_herb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/revive.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rindo_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ring_target.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rock_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rock_incense.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rock_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rock_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rockium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rocky_helmet.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/room_service.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rose_incense.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/roseli_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rowap_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/rusted_weapons.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sablenite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sachet.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sacred_ash.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/safety_goggles.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sail_fossil.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/salac_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/salamencite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sceptilite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/scizorite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/scolipite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/scope_lens.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/scovillainite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/scraftinite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sea_incense.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/secret_key.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/shadow_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sharp_beak.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sharpedonite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/shed_shell.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/shell.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/shiny_charm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/shiny_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/shoal_salt.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/shock_drive.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/shuca_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/silk_scarf.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/silph_scope.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/silver_powder.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sitrus_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/skarmorite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/skull_fossil.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sky_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/slowbronite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/smoke_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/smooth_rock.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/snorlium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/snowball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/soda_pop.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/soft_sand.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/solganium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/soothe_bell.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/soul_dew.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/spell_tag.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/spelon_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/splash_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/spooky_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ss_ticket.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/stable_mulch.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/star.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/staraptite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/starf_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/starminite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/steel_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/steel_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/steel_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/steelium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/steelixite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sticky_barb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/stone_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sun_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/super_potion.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/super_repel.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/super_rod.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/swampertite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/sweet_apple.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/swift_feather.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/tamato_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/tanga_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/tapunium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/tart_apple.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/tatsugirinite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/tea.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/terrain_extender.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/throat_spray.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/thunder_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/toxic_orb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/toxic_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/tri_pass.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/tropic_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/twisted_spoon.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/tyranitarite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ultra_ball.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/ultranecrozium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/upgrade.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/utility_umbrella.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/venusaurite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/victreebelite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/vs_seeker.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/wacan_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/water_gem.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/water_memory.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/water_stone.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/water_tm_hm.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/waterium_z.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/watmel_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/wave_incense.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/wave_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/weakness_policy.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/wellspring_mask.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/wepear_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/whipped_dream.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/white_herb.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/wide_lens.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/wiki_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/wise_glasses.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/wishing_piece.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/wood_mail.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/x_accuracy.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/x_attack.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/x_defend.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/x_special.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/x_special_defense.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/x_speed.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/yache_berry.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/yellow_nectar.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/yellow_shard.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/z_power_ring.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/zap_plate.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/zeraorite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/zinc.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/zoom_lens.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/zygarde_cube.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icon_palettes/zygardite.pal
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ability_capsule.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ability_patch.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/abomasite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/absolite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/absolite_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/absorb_bulb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/adamant_orb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/adrenaline_orb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/aerodactylite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/aggronite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/aguav_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/air_balloon.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/alakazite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/aloraichium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/altarianite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ampharosite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/amulet_coin.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/apicot_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/armor_fossil.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/aspear_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/assault_vest.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/audinite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/babiri_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/balm_mushroom.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/banettite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/barbaracite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/battle_stat_item.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/baxcalibrite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/bead_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/beast_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/beedrillite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/belue_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/berry_juice.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/bicycle.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/big_mushroom.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/big_nugget.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/big_pearl.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/big_root.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/bike_voucher.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/binding_band.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/black_augurite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/black_belt.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/black_glasses.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/black_sludge.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/blastoisinite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/blazikenite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/blue_orb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/bluk_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/blunder_policy.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/bone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/booster_energy.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/bottle_cap.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/bright_powder.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/bug_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/buginium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/cameruptite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/card_key.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/casteliacone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/catching_charm.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/cell_battery.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/chandelurite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/charcoal.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/charizardite_x.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/charizardite_y.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/charti_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/cheri_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/cherish_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/chesnaughtite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/chesto_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/chilan_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/chimechite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/chipped_pot.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/choice_band.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/choice_scarf.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/choice_specs.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/chople_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/claw_fossil.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/cleanse_tag.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/clear_amulet.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/clefablite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/coba_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/coin_case.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/colbur_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/cornerstone_mask.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/cornn_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/cover_fossil.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/covert_cloak.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/crabominite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/cracked_pot.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/custap_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/damp_rock.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dark_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/darkinium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/darkranite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dawn_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/decidium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/deep_sea_scale.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/deep_sea_tooth.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/delphoxite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/destiny_knot.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/devon_scope.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/diancite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ditto_powder.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dive_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dna_splicers.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dome_fossil.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dowsing_machine.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dragalgite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dragon_fang.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dragon_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dragon_scale.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dragoninite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dragonium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/drampanite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dream_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dream_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/drive.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dubious_disc.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/durin_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dusk_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dusk_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/dynamax_band.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/eelektrossite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/eevium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/eject_button.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/eject_pack.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/electirizer.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/electric_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/electrium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/emboarite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/energy_root.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/enigma_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/escape_rope.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ether.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ev_feather.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/everstone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/eviolite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/excadrite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/exp_share.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/expert_belt.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/fab_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/fairium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/fairy_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/falinksite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/fast_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/feraligite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/fighting_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/fightinium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/figy_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/fire_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/fire_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/firium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/flame_orb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/float_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/floettite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/flying_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/flyinium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/focus_band.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/focus_sash.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/fresh_water.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/friend_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/froslassite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/full_heal.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/full_incense.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/galarica_cuff.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/galarica_wreath.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/galladite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ganlon_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/garchompite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/garchompite_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/gardevoirite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/gengarite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ghost_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ghostium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/glalitite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/glimmoranite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/glitter_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/go_goggles.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/gold_teeth.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/golisopite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/golurkite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/good_rod.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/gracidea.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/grass_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/grassium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/great_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/greninjite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/grepa_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/grip_claw.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/griseous_orb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ground_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/groundium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/gyaradosite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/haban_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/harbor_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/hard_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/hawluchanite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/heal_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/heart_scale.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/hearthflame_mask.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/heat_rock.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/heatranite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/heavy_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/heavy_duty_boots.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/helix_fossil.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/heracronite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/hm.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/hondew_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/honey.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/houndoominite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/hp_up.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/iapapa_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ice_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ice_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/icium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/icy_rock.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/in_battle_herb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/incinium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/iron_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/jaboca_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/jaw_fossil.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/kangaskhanite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/kasib_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/kebia_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/kee_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/kelpsy_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/kings_rock.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/kommonium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lagging_tail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lansat_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/large_potion.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/latiasite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/latiosite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lava_cookie.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lax_incense.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/leaf_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/leek.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/leftovers.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lemonade.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/leppa_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/level_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/liechi_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/life_orb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lift_key.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/light_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/light_clay.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/linking_cord.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/loaded_dice.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lopunnite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/love_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lucarionite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lucarionite_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/luck_incense.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lucky_egg.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lucky_punch.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lum_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/luminous_moss.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lunalium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lure_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lustrous_orb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/luxury_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/lycanium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/macho_brace.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/magearnite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/magmarizer.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/magnet.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/mago_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/magost_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/malamarite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/manectite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/marshadium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/master_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/mawilite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/max_revive.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/mech_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/medichamite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/mega_ring.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/meganiumite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/meowsticite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/metagrossite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/metal_coat.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/meteorite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/metronome.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/mewnium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/mewtwonite_x.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/mewtwonite_y.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/micle_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/mimikium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/miracle_seed.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/moomoo_milk.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/moon_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/moon_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/mulch.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/muscle_band.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/mystic_water.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/nanab_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/necrozma_fuser.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/nectar.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/nest_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/net_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/never_melt_ice.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/nomel_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/normalium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/nugget.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/occa_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/odd_incense.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/odd_keystone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/old_amber.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/old_gateau.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/old_rod.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/old_sea_map.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/oran_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/orange_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/oval_charm.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/oval_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pamtre_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/passho_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/payapa_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pearl.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pearl_string.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/peat_block.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pecha_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/persim_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/petaya_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pidgeotite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pikanium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pikashunium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pinap_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pinsirite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/plate.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/plume_fossil.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/poison_barb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/poison_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/poisonium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/poke_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/poke_flute.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/poke_radar.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/poke_toy.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pomeg_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/potion.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/powder.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/power_anklet.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/power_band.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/power_belt.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/power_bracer.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/power_herb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/power_lens.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/power_weight.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pp_max.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pp_up.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/premier_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pretty_feather.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/primarium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/prism_scale.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/prison_bottle.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/protective_pads.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/protector.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/psychic_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/psychium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/punching_glove.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pure_incense.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/pyroarite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/qualot_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/quick_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/quick_claw.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rabuta_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rage_candy_bar.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/raichunite_y.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rare_candy.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rawst_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/razor_claw.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/razor_fang.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/razz_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/reaper_cloth.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/red_card.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/red_orb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/relic_band.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/relic_coin.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/relic_crown.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/relic_statue.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/relic_vase.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/repeat_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/repel.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/retro_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/reveal_glass.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/revival_herb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/revive.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rindo_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ring_target.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rock_incense.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rock_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rockium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rocky_helmet.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/room_service.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/root_fossil.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rose_incense.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/roseli_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rowap_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rusted_shield.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/rusted_sword.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sablenite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sachet.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/safety_goggles.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sail_fossil.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/salac_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/salamencite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sand.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sceptilite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/scizorite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/scolipite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/scope_lens.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/scovillainite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/scraftinite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sea_incense.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/secret_key.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/shadow_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/shard.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sharp_beak.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sharpedonite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/shed_shell.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/shell_bell.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/shiny_charm.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/shiny_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/shoal_shell.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/shuca_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/silk_scarf.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/silph_scope.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/silver_powder.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sitrus_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/skarmorite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/skull_fossil.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/slowbronite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/smoke_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/smooth_rock.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/snorlium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/snowball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/soda_pop.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/solganium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/soothe_bell.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/soul_dew.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/spell_tag.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/spelon_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ss_ticket.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/stable_mulch.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/star_piece.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/staraptite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/starf_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/starminite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/status_heal.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/steel_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/steelium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/steelixite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sticky_barb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sun_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/super_rod.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/swampertite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/sweet_apple.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/tamato_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/tanga_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/tapunium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/tart_apple.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/tatsugirinite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/tea.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/terrain_extender.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/terrain_seed.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/throat_spray.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/thunder_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/timer_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/tiny_mushroom.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/tm.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/toxic_orb.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/tri_pass.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/tropic_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/twisted_spoon.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/type_gem.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/tyranitarite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ultra_ball.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/ultranecrozium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/upgrade.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/utility_umbrella.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/venusaurite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/victreebelite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/vitamin.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/vs_seeker.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/wacan_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/water_memory.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/water_stone.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/waterium_z.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/watmel_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/wave_incense.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/wave_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/weakness_policy.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/wellspring_mask.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/wepear_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/whipped_dream.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/wide_lens.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/wiki_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/wise_glasses.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/wishing_piece.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/wood_mail.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/yache_berry.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/z_power_ring.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/zeraorite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/zoom_lens.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/zygarde_cube.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/graphics/items/icons/zygardite.png
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/include/constants/items.h
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/src/data/graphics/items.h
- https://raw.githubusercontent.com/rh-hideout/pokeemerald-expansion/73b3fbeb574327cd9420c89e56bef5aa3c08fead/src/data/items.h

### imperium: `iriv24/pokeemerald-expansion`

Pin: `2576d0f3f4c861c760f0c55198e37e6d7b91683e`.

https://api.github.com/repos/iriv24/pokeemerald-expansion/git/trees/2576d0f3f4c861c760f0c55198e37e6d7b91683e?recursive=1

- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/abomasite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/aggronite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/alakazite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/ampharosite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/beedrillite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/blastoisinite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/blazikenite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/blue_flute.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/cameruptite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/charizardite_x.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/charizardite_y.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/gengarite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/heavy_duty_boots.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/lopunnite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/lucarionite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/max_repel.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/rare_candy.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/sablenite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/sceptilite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/steelixite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/swampertite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icon_palettes/venusaurite.pal
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/abomasite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/aggronite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/alakazite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/ampharosite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/beedrillite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/blastoisinite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/blazikenite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/cameruptite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/charizardite_x.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/charizardite_y.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/flute.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/gengarite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/heavy_duty_boots.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/lopunnite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/lucarionite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/rare_candy.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/repel.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/sablenite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/sceptilite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/steelixite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/swampertite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/graphics/items/icons/venusaurite.png
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/include/constants/items.h
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/src/data/graphics/items.h
- https://raw.githubusercontent.com/iriv24/pokeemerald-expansion/2576d0f3f4c861c760f0c55198e37e6d7b91683e/src/data/items.h

### hardlove: `kumakuma1/hardlove`

Pin: `64838bf7dbe032cd87fd986f9c8699c1436c67c5`.

https://api.github.com/repos/kumakuma1/hardlove/git/trees/64838bf7dbe032cd87fd986f9c8699c1436c67c5?recursive=1

- https://raw.githubusercontent.com/kumakuma1/hardlove/64838bf7dbe032cd87fd986f9c8699c1436c67c5/data/graphics/item/dark_stone.png
- https://raw.githubusercontent.com/kumakuma1/hardlove/64838bf7dbe032cd87fd986f9c8699c1436c67c5/data/graphics/item/jade_orb.png
- https://raw.githubusercontent.com/kumakuma1/hardlove/64838bf7dbe032cd87fd986f9c8699c1436c67c5/data/graphics/item/key_stone.png
- https://raw.githubusercontent.com/kumakuma1/hardlove/64838bf7dbe032cd87fd986f9c8699c1436c67c5/data/graphics/item/light_stone.png
- https://raw.githubusercontent.com/kumakuma1/hardlove/64838bf7dbe032cd87fd986f9c8699c1436c67c5/data/graphics/item/lunar_feather.png
- https://raw.githubusercontent.com/kumakuma1/hardlove/64838bf7dbe032cd87fd986f9c8699c1436c67c5/data/graphics/item/magma_stone.png
- https://raw.githubusercontent.com/kumakuma1/hardlove/64838bf7dbe032cd87fd986f9c8699c1436c67c5/data/graphics/item/member_card.png
- https://raw.githubusercontent.com/kumakuma1/hardlove/64838bf7dbe032cd87fd986f9c8699c1436c67c5/data/graphics/item/moon_flute.png
- https://raw.githubusercontent.com/kumakuma1/hardlove/64838bf7dbe032cd87fd986f9c8699c1436c67c5/data/graphics/item/starter_card.png
- https://raw.githubusercontent.com/kumakuma1/hardlove/64838bf7dbe032cd87fd986f9c8699c1436c67c5/data/graphics/item/sun_flute.png
- https://raw.githubusercontent.com/kumakuma1/hardlove/64838bf7dbe032cd87fd986f9c8699c1436c67c5/data/graphics/item/vs_recorder.png

### Serebii

Unversioned URLs; SHA-256 of fetched source bytes is recorded in `fallbacks.json` and enforced on rebuild.
The 29 Hardlove assets with blob `cd3bcb9e636866325bb3718c46ac6f73b6d78c00` are question-mark placeholders.
They were rejected after contact-sheet review; 28 use Serebii replacements and Ilima’s crystal uses Normalium Z.

- Blue Petal: https://www.serebii.net/itemdex/sprites/bluepetal.png
- BridgeMail M: https://www.serebii.net/itemdex/sprites/bridgemailm.png
- BridgeMail T: https://www.serebii.net/itemdex/sprites/bridgemailt.png
- BridgeMail V: https://www.serebii.net/itemdex/sprites/bridgemailv.png
- Colress Machine: https://www.serebii.net/itemdex/sprites/colressmachine.png
- Elevator Key: https://www.serebii.net/itemdex/sprites/elevatorkey.png
- Favored Mail: https://www.serebii.net/itemdex/sprites/favoredmail.png
- Fishing Rod: https://www.serebii.net/itemdex/sprites/fishingrod.png
- Forage Bag: https://www.serebii.net/itemdex/sprites/foragebag.png
- Green Petal: https://www.serebii.net/itemdex/sprites/greenpetal.png
- Greet Mail: https://www.serebii.net/itemdex/sprites/greetmail.png
- Grubby Hanky: https://www.serebii.net/itemdex/sprites/grubbyhanky.png
- Inquiry Mail: https://www.serebii.net/itemdex/sprites/inquirymail.png
- Intriguing Stone: https://www.serebii.net/itemdex/sprites/intriguingstone.png
- Lab Key Card A: https://www.serebii.net/itemdex/sprites/labkeycarda.png
- Lab Key Card B: https://www.serebii.net/itemdex/sprites/labkeycardb.png
- Lab Key Card C: https://www.serebii.net/itemdex/sprites/labkeycardc.png
- Left Poké Ball: https://www.serebii.net/itemdex/sprites/leftpokeball.png
- Like Mail: https://www.serebii.net/itemdex/sprites/likemail.png
- Looker Ticket: https://www.serebii.net/itemdex/sprites/lookerticket.png
- Orange Petal: https://www.serebii.net/itemdex/sprites/orangepetal.png
- Permit: https://www.serebii.net/itemdex/sprites/permit.png
- Pink Petal: https://www.serebii.net/itemdex/sprites/pinkpetal.png
- Plasma Card: https://www.serebii.net/itemdex/sprites/plasmacard.png
- Power Plant Pass: https://www.serebii.net/itemdex/sprites/powerplantpass.png
- Prof's Letter: https://www.serebii.net/itemdex/sprites/prof'sletter.png
- Professor's Mask: https://www.serebii.net/itemdex/sprites/professorsmask.png
- Purple Petal: https://www.serebii.net/itemdex/sprites/purplepetal.png
- RSVP Mail: https://www.serebii.net/itemdex/sprites/rsvpmail.png
- Rainbow Flower: https://www.serebii.net/itemdex/sprites/rainbowflower.png
- Red Petal: https://www.serebii.net/itemdex/sprites/redpetal.png
- Reply Mail: https://www.serebii.net/itemdex/sprites/replymail.png
- Ride Pager: https://www.serebii.net/itemdex/sprites/ridepager.png
- Roller Skates: https://www.serebii.net/itemdex/sprites/rollerskates.png
- Sparkling Stone: https://www.serebii.net/itemdex/sprites/sparklingstone.png
- TMV Pass: https://www.serebii.net/itemdex/sprites/tmvpass.png
- Thanks Mail: https://www.serebii.net/itemdex/sprites/thanksmail.png
- Yellow Petal: https://www.serebii.net/itemdex/sprites/yellowpetal.png

## Fallback framing

Every non-expansion frame is cropped and centred. Only entries with a size in the last column are scaled.
Hardlove provides DS-style 32px frames; Serebii frames vary, with exact dimensions recorded below.

| Item key | Source frame | Visible bounds | Scaled artwork |
| --- | --- | --- | --- |
| bluepetal | [24, 24] | [4, 4, 20, 20] | not scaled |
| bridgemailm | [24, 24] | [1, 1, 23, 23] | not scaled |
| bridgemailt | [24, 24] | [1, 1, 23, 23] | not scaled |
| bridgemailv | [24, 24] | [1, 1, 23, 23] | not scaled |
| colressmachine | [32, 32] | [7, 5, 26, 27] | not scaled |
| darkstone | [32, 32] | [4, 4, 20, 20] | not scaled |
| elevatorkey | [24, 24] | [1, 3, 24, 22] | not scaled |
| favoredmail | [24, 24] | [1, 1, 23, 23] | not scaled |
| fishingrod | [32, 32] | [2, 4, 29, 30] | [24, 23] |
| foragebag | [24, 26] | [3, 0, 21, 26] | [17, 24] |
| greenpetal | [24, 24] | [5, 5, 19, 19] | not scaled |
| greetmail | [24, 24] | [1, 1, 23, 23] | not scaled |
| grubbyhanky | [32, 32] | [7, 7, 25, 25] | not scaled |
| inquirymail | [24, 24] | [1, 1, 23, 23] | not scaled |
| intriguingstone | [24, 24] | [5, 5, 19, 19] | not scaled |
| jadeorb | [32, 32] | [5, 5, 19, 19] | not scaled |
| keystone | [32, 32] | [5, 6, 19, 20] | not scaled |
| labkeycarda | [40, 40] | [8, 3, 34, 38] | [18, 24] |
| labkeycardb | [40, 40] | [8, 4, 34, 38] | [18, 24] |
| labkeycardc | [40, 40] | [8, 3, 34, 38] | [18, 24] |
| leftpokeball | [24, 24] | [3, 3, 21, 21] | not scaled |
| lightstone | [32, 32] | [4, 4, 20, 20] | not scaled |
| likemail | [24, 24] | [1, 1, 23, 23] | not scaled |
| lookerticket | [28, 24] | [0, 3, 28, 21] | [24, 15] |
| lunarwing | [32, 32] | [1, 2, 22, 22] | not scaled |
| magmastone | [32, 32] | [2, 3, 22, 21] | not scaled |
| megakeystone | [32, 32] | [5, 6, 19, 20] | not scaled |
| membercard | [32, 32] | [2, 2, 23, 22] | not scaled |
| moonflute | [32, 32] | [2, 2, 22, 22] | not scaled |
| orangepetal | [24, 24] | [6, 5, 18, 19] | not scaled |
| permit | [32, 32] | [6, 8, 27, 25] | not scaled |
| pinkpetal | [24, 24] | [4, 4, 19, 19] | not scaled |
| plasmacard | [32, 32] | [6, 8, 27, 25] | not scaled |
| powerplantpass | [24, 24] | [2, 4, 23, 21] | not scaled |
| professorsmask | [24, 24] | [1, 1, 22, 23] | not scaled |
| profsletter | [24, 24] | [1, 3, 23, 22] | not scaled |
| purplepetal | [24, 24] | [4, 4, 19, 19] | not scaled |
| rainbowflower | [24, 24] | [1, 2, 23, 22] | not scaled |
| redpetal | [24, 24] | [4, 4, 19, 19] | not scaled |
| replymail | [24, 24] | [1, 1, 23, 23] | not scaled |
| ridepager | [24, 24] | [1, 1, 23, 23] | not scaled |
| rollerskates | [28, 25] | [0, 0, 28, 25] | [24, 21] |
| rsvpmail | [24, 24] | [1, 1, 23, 23] | not scaled |
| sparklingstone | [24, 24] | [2, 1, 21, 22] | not scaled |
| startercard | [32, 32] | [1, 4, 22, 21] | not scaled |
| sunflute | [32, 32] | [2, 2, 22, 22] | not scaled |
| thanksmail | [24, 24] | [1, 1, 23, 23] | not scaled |
| tmvpass | [27, 24] | [0, 3, 27, 21] | [24, 16] |
| vsrecorder | [32, 32] | [1, 2, 23, 22] | not scaled |
| yellowpetal | [24, 24] | [4, 4, 19, 20] | not scaled |

## Alias audit

| Name key | Resolved item name |
| --- | --- |
| 50rawstberry | Rawst Berry |
| 5chilanberry | Chilan Berry |
| 5focusband | Focus Band |
| 5habanberry | Haban Berry |
| 5lifeorb | Life Orb |
| 5poisonbarb | Poison Barb |
| 5rawstberry | Rawst Berry |
| 5sharpbeak | Sharp Beak |
| 5twistedspoon | Twisted Spoon |
| beedrilite | Beedrillite |
| cleverwing | Clever Feather |
| geniuswing | Genius Feather |
| healthwing | Health Feather |
| honeybailestyle | Honey |
| houndoomite | Houndoominite |
| ilimasnormaliumz | Normalium Z |
| kangaskhite | Kangaskhanite |
| linkcable | Linking Cord |
| lunarwing | Lunar Feather |
| luxite | Luxrite |
| megakeystone | Key Stone |
| musclewing | Muscle Feather |
| pashoberry | Passho Berry |
| prettywing | Pretty Feather |
| rednectarbailestyle | Red Nectar |
| resistwing | Resist Feather |
| ssaquaticket | S.S. Ticket |
| stick | Leek |
| swiftwing | Swift Feather |
