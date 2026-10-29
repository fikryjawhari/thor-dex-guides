"""BB2R Complete EVless / Challenge items. Docs win; RomHackDex is compared before Bulbapedia fills vanilla gaps.

item_locations(data) returns the walkthrough join records (doc area names, one record per item/choice option).
Each has item, area, note, source, line, hidden, quantity, mode and link. Easy/Normal-only records are retained but
explicitly unavailable in Challenge. ITEM_AREA_ALIASES is item-specific; do not replace the locations alias table.
VANILLA is a factual Bulbapedia snapshot (page titles/revision dates below), not required network access at build time.
"""
import collections
import html
import re
from pathlib import Path

from common import H, doc, drayano, report

ITEM_AREA_ALIASES = {
    'Trainer School': 'Aspertia City', 'Castelia Gardens': 'Castelia City',
    'Castellia City Gym': 'Castelia City Gym', 'Giants Chasm': 'Giant Chasm',
    'Team Plasma Frigate': 'Plasma Frigate', 'Driftveil City Marketplace': 'Driftveil City',
    'Driftveil Market': 'Driftveil City', 'Route 9 Shopping Mall': 'Route 9', 'Shopping Mall Nine': 'Route 9',
    'Battle Subway': 'Nimbasa City', 'Pokémon World Tournament': 'PWT',
}
POSTGAME_VENDOR = 'Challenge: absent until the postgame Route 3 Suicune sighting'
EVLESS = 'EVless: wild held items removed except Latios, Latias and Giratina; vitamins and Power items do not restore player EVs'
STONES = ['Fire Stone', 'Water Stone', 'Thunder Stone', 'Leaf Stone', 'Moon Stone', 'Sun Stone', 'Shiny Stone',
          'Dusk Stone', 'Dawn Stone', 'Ice Stone']
EVOLUTION = STONES + ['Deep Sea Scale', 'Deep Sea Tooth', 'Dragon Scale', 'Dubious Disc', 'Electirizer',
                     "King's Rock", 'Magmarizer', 'Metal Coat', 'Protector', 'Reaper Cloth', 'Up-Grade',
                     'Link Cable', 'Prism Scale', 'Razor Claw', 'Razor Fang']
INCENSE = ['Full Incense', 'Lax Incense', 'Luck Incense', 'Odd Incense', 'Pure Incense', 'Rock Incense',
           'Rose Incense', 'Sea Incense', 'Wave Incense']
LOWER_BERRIES = ['Pomeg Berry', 'Kelpsy Berry', 'Qualot Berry', 'Hondew Berry', 'Grepa Berry', 'Tamato Berry']
ALIASES = {'Bike': 'Bicycle', 'Pokéball': 'Poké Ball', 'Thunderstone': 'Thunder Stone',
           'Exp Share': 'Exp. Share', 'SilverPowder': 'Silver Powder', 'BrightPowder': 'Bright Powder',
           'BlackGlasses': 'Black Glasses', 'NeverMeltIce': 'Never-Melt Ice', 'TwistedSpoon': 'Twisted Spoon',
           'DeepSeaScale': 'Deep Sea Scale', 'DeepSeaTooth': 'Deep Sea Tooth', 'BalmMushroom': 'Balm Mushroom',
           'TinyMushroom': 'Tiny Mushroom', 'EnergyPowder': 'Energy Powder', 'Parlyz Heal': 'Paralyze Heal',
           'X-Speed': 'X Speed', 'X-Attack': 'X Attack', 'X-Defend': 'X Defense', 'X-Accuracy': 'X Accuracy',
           'X-Special': 'X Sp. Atk', 'X Special': 'X Sp. Atk', 'X-Sp Def': 'X Sp. Def',
           'Guard Spec': 'Guard Spec.', 'Armour Fossil': 'Armor Fossil', 'Dubious Disk': 'Dubious Disc',
           'Persim Berries': 'Persim Berry', 'Perism berries': 'Persim Berry', 'Perism Berry': 'Persim Berry',
           'Tanga Berries': 'Tanga Berry', 'Either': 'Ether', 'Upgrade': 'Up-Grade'}
DROP_KEYS = {'Town Map IV', 'Town Map', 'Running Shoes', 'Xtransceiver B2W2', 'Xtransceiver', 'Pal Pad',
             'Fashion Case', 'Prop Case', 'Medal Box', 'Gram 1', 'Gram 2', 'Gram 3'}
KEY_ITEMS = {'Bicycle', 'Super Rod', 'Dowsing Machine', 'Shiny Charm', 'Oval Charm', 'Permit', 'Old Sea Map',
             'Magma Stone', 'DNA Splicers', 'Reveal Glass', 'Gracidea', 'Dropped Item', 'Colress Machine',
             'Round Charm', 'Light Stone', 'Dark Stone', 'License', 'Vs. Recorder'}
ITEM_NAMES = ['', 'Absorb Bulb', 'Adamant Orb', 'Aguav Berry', 'Air Balloon', 'Amulet Coin', 'Amulet Coin III', 'Antidote', 'Armor Fossil', 'Aspear Berry', 'Awakening', 'Balm Mushroom', 'Berry Juice', 'Bicycle', 'Big Mushroom', 'Big Nugget', 'Big Pearl', 'Big Root', 'Binding Band', 'Black Belt', 'Black Glasses', 'Black Sludge', 'Blue Shard', 'BridgeMail D', 'BridgeMail M', 'BridgeMail T', 'BridgeMail V', 'Bright Powder', 'Bug Gem', 'Burn Heal', 'Calcium', 'Carbos', 'Casteliacone', 'Cell Battery', 'Charcoal', 'Cheri Berry', 'Chesto Berry', 'Choice Band', 'Choice Scarf', 'Choice Specs', 'Claw Fossil', 'Cleanse Tag', 'Clever Wing', 'Colress Machine', 'Comet Shard', 'Cover Fossil', 'DNA Splicers', 'Damp Rock', 'Dark Gem', 'Dark Stone', 'Dawn Stone', 'Deep Sea Scale', 'Deep Sea Tooth', 'Destiny Knot', 'Dire Hit', 'Dive Ball', 'Dome Fossil', 'Dowsing MCHN', 'Dowsing Machine', 'Draco Plate', 'Dragon Fang', 'Dragon Gem', 'Dragon Scale', 'Dread Plate', 'Dream Ball', 'Dropped Item', 'Dubious Disc', 'Dusk Ball', 'Dusk Stone', 'Earth Plate', 'Eject Button', 'Electirizer', 'Electric Gem', 'Elixir', 'Energy Powder', 'Energy Root', 'Escape Rope', 'Ether', 'Everstone', 'Eviolite', 'Exp. Share', 'Expert Belt', 'Favored Mail', 'Fighting Gem', 'Figy Berry', 'Fire Gem', 'Fire Stone', 'Fist Plate', 'Flame Orb', 'Flame Plate', 'Float Stone', 'Fluffy Tail', 'Flying Gem', 'Focus Band', 'Focus Sash', 'Fresh Water', 'Full Heal', 'Full Incense', 'Full Restore', 'Genius Wing', 'Ghost Gem', 'Gracidea', 'Grass Gem', 'Great Ball', 'Green Shard', 'Greet Mail', 'Grepa Berry', 'Grip Claw', 'Griseous Orb', 'Ground Gem', 'Guard Spec.', 'HP Up', 'Haban Berry', 'Hard Stone', 'Heal Ball', 'Heal Powder', 'Health Wing', 'Heart Scale', 'Heat Rock', 'Helix Fossil', 'Hondew Berry', 'Honey', 'Hyper Potion', 'Iapapa Berry', 'Ice Gem', 'Ice Heal', 'Ice Stone', 'Icicle Plate', 'Icy Rock', 'Inquiry Mail', 'Insect Plate', 'Iron', 'Iron Ball', 'Iron Plate', 'Kelpsy Berry', "King's Rock", 'Lagging Tail', 'Lansat Berry', 'Lava Cookie', 'Lax Incense', 'Leaf Stone', 'Leftovers', 'Lemonade', 'Leppa Berry', 'License', 'Life Orb', 'Light Ball', 'Light Clay', 'Light Stone', 'Like Mail', 'Link Cable', 'Luck Incense', 'Lucky Egg', 'Lucky Punch', 'Lum Berry', 'Lunar Wing', 'Lustrous Orb', 'Luxury Ball', 'Macho Brace', 'Magma Stone', 'Magmarizer', 'Magnet', 'Mago Berry', 'Master Ball', 'Max Elixir', 'Max Ether', 'Max Potion', 'Max Repel', 'Max Revive', 'Meadow Plate', 'Medal Box', 'Mental Herb', 'Metal Coat', 'Metal Powder', 'Metronome', 'Mind Plate', 'Miracle Seed', 'Moomoo Milk', 'Moomoo Milk III', 'Moon Stone', 'Muscle Band', 'Muscle Wing', 'Mystic Water', 'Nest Ball', 'Net Ball', 'Never-Melt Ice', 'Normal Gem', 'Nugget', 'Odd Incense', 'Old Amber', 'Old Gateau', 'Old Sea Map', 'Oran Berry', 'Oval Charm', 'Oval Stone', 'PP Max', 'PP Up', 'Pal Pad', 'Paralyze Heal', 'Pearl', 'Pearl String', 'Pecha Berry', 'Permit', 'Persim Berry', 'Plasma Card', 'Plume Fossil', 'Poison Barb', 'Poison Gem', 'Poké Ball', 'Poké Doll', 'Poké Toy', 'Pomeg Berry', 'Potion', 'Power Anklet', 'Power Band', 'Power Belt', 'Power Bracer', 'Power Herb', 'Power Lens', 'Power Weight', 'Pretty Wing', 'Prism Scale', 'Protector', 'Protein', 'Psychic Gem', 'Pure Incense', 'Qualot Berry', 'Quick Ball', 'Quick Claw', 'RSVP Mail', 'Rage Candy Bar', 'Rare Bone', 'Rare Candy', 'Rawst Berry', 'Razor Claw', 'Razor Fang', 'Reaper Cloth', 'Red Card', 'Red Shard', 'Relic Band', 'Relic Copper', 'Relic Crown', 'Relic Gold', 'Relic Silver', 'Relic Statue', 'Relic Vase', 'Repeat Ball', 'Repel', 'Reply Mail', 'Resist Wing', 'Reveal Glass', 'Revival Herb', 'Revive', 'Ring Target', 'Rock Gem', 'Rock Incense', 'Rocky Helmet', 'Root Fossil', 'Rose Incense', 'Round Charm', 'Running Shoes', 'Sacred Ash', 'Scope Lens', 'Sea Incense', 'Sharp Beak', 'Shed Shell', 'Shell Bell', 'Shiny Charm', 'Shiny Stone', 'Shoal Salt', 'Shoal Shell', 'Silk Scarf', 'Silver Powder', 'Sitrus Berry', 'Skull Fossil', 'Sky Plate', 'Smoke Ball', 'Smooth Rock', 'Soda Pop', 'Soft Sand', 'Soothe Bell', 'Soul Dew', 'Spell Tag', 'Splash Plate', 'Spooky Plate', 'Star Piece', 'Stardust', 'Starf Berry', 'Steel Gem', 'Stick', 'Sticky Barb', 'Stone Plate', 'Sun Stone', 'Super Potion', 'Super Repel', 'Super Rod', 'Super Rod III', 'Swift Wing', 'Tamato Berry', 'Tanga Berry', 'Thanks Mail', 'Thick Club', 'Thunder Stone', 'Timer Ball', 'Tiny Mushroom', 'Town Map IV', 'Toxic Orb', 'Toxic Plate', 'Twisted Spoon', 'Ultra Ball', 'Up-Grade', 'Vs. Recorder', 'Water Gem', 'Water Stone', 'Wave Incense', 'White Herb', 'Wide Lens', 'Wiki Berry', 'Wise Glasses', 'X Accuracy', 'X Attack', 'X Defense', 'X Sp. Atk', 'X Sp. Def', 'X Speed', 'Xtransceiver B2W2', 'Yellow Shard', 'Zap Plate', 'Zinc', 'Zoom Lens']
VANILLA = {
    'placements': [
        ['Reveal Glass', 'Abundant Shrine', "Obtained from a man near Landorus's shrine if a Therian Forme Landorus is brought there", 'Abundant Shrine'],
        ['Dread Plate', 'Abyssal Ruins', 'North of the western entrance', 'Abyssal Ruins'],
        ['Earth Plate', 'Abyssal Ruins', 'Southeast quadrant', 'Abyssal Ruins'],
        ['Fist Plate', 'Abyssal Ruins', 'Southwest corner', 'Abyssal Ruins'],
        ['Flame Plate', 'Abyssal Ruins', "West of the room's center", 'Abyssal Ruins'],
        ['Icicle Plate', 'Abyssal Ruins', "South of the room's center", 'Abyssal Ruins'],
        ['Insect Plate', 'Abyssal Ruins', 'Near the northeast corner', 'Abyssal Ruins'],
        ['Iron Plate', 'Abyssal Ruins', 'Northwest quadrant', 'Abyssal Ruins'],
        ['Meadow Plate', 'Abyssal Ruins', 'Southwest quadrant', 'Abyssal Ruins'],
        ['Mind Plate', 'Abyssal Ruins', "North of the room's center", 'Abyssal Ruins'],
        ['Sky Plate', 'Abyssal Ruins', 'North of the eastern entrance', 'Abyssal Ruins'],
        ['Spooky Plate', 'Abyssal Ruins', 'Southeast quadrant', 'Abyssal Ruins'],
        ['Stone Plate', 'Abyssal Ruins', 'Near the northern entrance', 'Abyssal Ruins'],
        ['Toxic Plate', 'Abyssal Ruins', 'Southeast corner', 'Abyssal Ruins'],
        ['Zap Plate', 'Abyssal Ruins', 'South of the western entrance', 'Abyssal Ruins'],
        ['Relic Gold', 'Abyssal Ruins', "* Near the northwest corner * Southwest quadrant * East of the room's center (×3)", 'Abyssal Ruins'],
        ['Relic Silver', 'Abyssal Ruins', '* Northwest quadrant * Northeast quadrant * Southeast quadrant (×3)', 'Abyssal Ruins'],
        ['Relic Copper', 'Abyssal Ruins', '* Inside the northern entrance * Inside the eastern entrance * Inside the southern entrance * Southeast of the western entrance (×4)', 'Abyssal Ruins'],
        ['Relic Statue', 'Abyssal Ruins', "Just north of the room's center", 'Abyssal Ruins'],
        ['Relic Vase', 'Abyssal Ruins', 'Southeast quadrant', 'Abyssal Ruins'],
        ['Relic Statue', 'Abyssal Ruins', 'Southwest corner', 'Abyssal Ruins'],
        ['Relic Band', 'Abyssal Ruins', '* Southeast corner * Northeast quadrant (×2)', 'Abyssal Ruins'],
        ['Relic Gold', 'Abyssal Ruins', 'Southwest corner', 'Abyssal Ruins'],
        ['Relic Crown', 'Abyssal Ruins', 'In the center of the room', 'Abyssal Ruins'],
        ['Rare Candy', 'Anville Town', 'After winning at least seven battles in the Battle Subway', 'Anville Town'],
        ['Full Restore', 'Anville Town', 'After winning at least seven battles in the Battle Subway', 'Anville Town'],
        ['Max Revive', 'Anville Town', 'After winning at least seven battles in the Battle Subway', 'Anville Town'],
        ['Elixir', 'Anville Town', 'After winning at least seven battles in the Battle Subway', 'Anville Town'],
        ['Protein', 'Anville Town', 'After winning at least seven battles in the Battle Subway', 'Anville Town'],
        ['Iron', 'Anville Town', 'After winning at least seven battles in the Battle Subway', 'Anville Town'],
        ['Calcium', 'Anville Town', 'After winning at least seven battles in the Battle Subway', 'Anville Town'],
        ['Zinc', 'Anville Town', 'After winning at least seven battles in the Battle Subway', 'Anville Town'],
        ['Carbos', 'Anville Town', 'After winning at least seven battles in the Battle Subway', 'Anville Town'],
        ['HP Up', 'Anville Town', 'After winning at least seven battles in the Battle Subway', 'Anville Town'],
        ['Revive', 'Anville Town', 'In exchange for two Escape Ropes (on weekends)', 'Anville Town'],
        ['PP Up', 'Anville Town', 'In exchange for one Star Piece (on weekends)', 'Anville Town'],
        ['Bright Powder', 'Anville Town', 'From the girl on the platform for finding her Pansage', 'Anville Town'],
        ['Ultra Ball', 'Aspertia City', 'From the girl in the northeast house after defeating Cheren', 'Aspertia City'],
        ['PP Up', 'Battle Subway', 'From a Janitor on any non-Super Train platform after 21 consecutive victories', 'Battle Subway'],
        ['Rare Candy', 'Battle Subway', 'From an Ace Trainer on any Super Train platform after 28 consecutive victories', 'Battle Subway'],
        ['Lansat Berry', 'Battle Subway', 'From a Office Worker on any Super Train platform after 105 consecutive victories', 'Battle Subway'],
        ['Starf Berry', 'Battle Subway', 'From an Ace Trainer on any Super Train platform after 203 consecutive victories', 'Battle Subway'],
        ['Mystic Water', 'Castelia City', '1F, received from an Ace Trainer if the second option is chosen', 'Castelia City'],
        ['Cheri Berry', 'Castelia City', 'Received from Harlequin/Clerk ♂ if shown a Pokémon of the requested type (only one Berry can be chosen per day)', 'Castelia City'],
        ['Chesto Berry', 'Castelia City', 'Received from Harlequin/Clerk ♂ if shown a Pokémon of the requested type (only one Berry can be chosen per day)', 'Castelia City'],
        ['Pecha Berry', 'Castelia City', 'Received from Harlequin/Clerk ♂ if shown a Pokémon of the requested type (only one Berry can be chosen per day)', 'Castelia City'],
        ['Rawst Berry', 'Castelia City', 'Received from Harlequin/Clerk ♂ if shown a Pokémon of the requested type (only one Berry can be chosen per day)', 'Castelia City'],
        ['Aspear Berry', 'Castelia City', 'Received from Harlequin/Clerk ♂ if shown a Pokémon of the requested type (only one Berry can be chosen per day)', 'Castelia City'],
        ['Moomoo Milk III', 'Castelia City', 'Received from the manager', 'Castelia City'],
        ['Amulet Coin III', 'Castelia City', 'Received from a man on 1F of the western building', 'Castelia City'],
        ['Dowsing MCHN', 'Castelia City', 'Received from Bianca', 'Castelia City'],
        ['Potion', 'Castelia Sewers', 'Received from female Scientist', 'Castelia Sewers'],
        ['Super Potion', 'Castelia Sewers', 'Received from female Scientist', 'Castelia Sewers'],
        ['Revive', 'Castelia Sewers', 'Received from female Scientist', 'Castelia Sewers'],
        ['Antidote', 'Castelia Sewers', 'Received from male Scientist (requires Surf)SpSu', 'Castelia Sewers'],
        ['Full Heal', 'Castelia Sewers', 'Received from male Scientist (requires Surf)SpSu', 'Castelia Sewers'],
        ['Full Restore', 'Castelia Sewers', 'Received from male Scientist (requires Surf)SpSu', 'Castelia Sewers'],
        ['Fire Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Water Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Electric Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Grass Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Ice Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Fighting Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Poison Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Ground Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Flying Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Psychic Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Bug Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Rock Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Ghost Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Dragon Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Dark Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Steel Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Normal Gem', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Fire Stone', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Water Stone', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Thunder Stone', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Leaf Stone', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Moon Stone', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Sun Stone', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Shiny Stone', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Dusk Stone', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Dawn Stone', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Oval Stone', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Everstone', 'Chargestone Cave', 'Phenomenon', 'Chargestone Cave'],
        ['Fire Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Water Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Electric Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Grass Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Ice Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Fighting Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Poison Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Ground Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Flying Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Psychic Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Bug Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Rock Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Ghost Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Dragon Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Dark Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Steel Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Normal Gem', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Fire Stone', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Water Stone', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Thunder Stone', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Leaf Stone', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Moon Stone', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Sun Stone', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Shiny Stone', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Dusk Stone', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Dawn Stone', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Oval Stone', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Everstone', 'Clay Tunnel', 'Phenomenon', 'Clay Tunnel'],
        ['Soul Dew', 'Dreamyard', 'Northern area: on the far east part of the second floor after battling Latios/Latias (requires Cut)', 'Dreamyard'],
        ['Heal Powder', 'Driftveil Drawbridge', 'From a Youngster for showing him a Charizard', 'Driftveil Drawbridge'],
        ['Health Wing', 'Driftveil Drawbridge', 'Phenomenon', 'Driftveil Drawbridge'],
        ['Muscle Wing', 'Driftveil Drawbridge', 'Phenomenon', 'Driftveil Drawbridge'],
        ['Resist Wing', 'Driftveil Drawbridge', 'Phenomenon', 'Driftveil Drawbridge'],
        ['Genius Wing', 'Driftveil Drawbridge', 'Phenomenon', 'Driftveil Drawbridge'],
        ['Clever Wing', 'Driftveil Drawbridge', 'Phenomenon', 'Driftveil Drawbridge'],
        ['Swift Wing', 'Driftveil Drawbridge', 'Phenomenon', 'Driftveil Drawbridge'],
        ['Pretty Wing', 'Driftveil Drawbridge', 'Phenomenon', 'Driftveil Drawbridge'],
        ['Exp. Share', 'Floccesy Town', "Held by Benga's gift Gible/Dratini", 'Floccesy Town'],
        ['DNA Splicers', 'Giant Chasm', 'Dropped by Kyurem upon being caught', 'Giant Chasm'],
        ['Fire Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Water Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Electric Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Grass Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Ice Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Fighting Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Poison Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Ground Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Flying Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Psychic Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Bug Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Rock Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Ghost Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Dragon Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Dark Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Steel Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Normal Gem', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Fire Stone', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Water Stone', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Thunder Stone', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Leaf Stone', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Moon Stone', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Sun Stone', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Shiny Stone', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Dusk Stone', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Dawn Stone', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Oval Stone', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Everstone', 'Giant Chasm', 'Phenomenon', 'Giant Chasm'],
        ['Sitrus Berry', 'Humilau City', 'Held by the traded Tangrowth', 'Humilau City'],
        ['Antidote', 'Icirrus City', 'Prize from Aha if the answer to the quiz was correct', 'Icirrus City'],
        ['Paralyze Heal', 'Icirrus City', 'Prize from Aha if the answer to the quiz was incorrect', 'Icirrus City'],
        ['Exp. Share', 'Icirrus City', 'Gift from chairman of the Pokémon Fan Club, if Pokémon shown has gained between 25 and 49 levels since it was met in a Generation V game', 'Icirrus City'],
        ['Cleanse Tag', 'Icirrus City', 'Gift from chairman of the Pokémon Fan Club, if Pokémon shown has gained between 50 and 98 levels since it was met in a Generation V game', 'Icirrus City'],
        ["King's Rock", 'Icirrus City', 'Gift from chairman of the Pokémon Fan Club, if Pokémon shown has gained 99 levels since it was met in a Generation V game', 'Icirrus City'],
        ['PP Up', 'Icirrus City', 'East of the Pokémon Center', 'Icirrus City'],
        ['Black Belt', 'Icirrus City', 'Gift from a Battle Girl in the Pokémon Center', 'Icirrus City'],
        ['Max Elixir', 'Icirrus City', 'West of Pokémon Center W', 'Icirrus City'],
        ['Leppa Berry', 'Lacunosa Town', 'Souvenir from executive inside the northeast house given at nightMonWedSat', 'Lacunosa Town'],
        ['Pecha Berry', 'Lacunosa Town', 'Souvenir from executive inside the northeast house given at nightTueThuFri', 'Lacunosa Town'],
        ['Black Sludge', 'Marine Tube', 'From a female Ace Trainer after showing her a Pokémon holding a Poison Barb', 'Marine Tube'],
        ['Fresh Water', 'Marvelous Bridge', 'From a Roughneck in the western Bridge Gate', 'Marvelous Bridge'],
        ['Health Wing', 'Marvelous Bridge', 'Phenomenon', 'Marvelous Bridge'],
        ['Muscle Wing', 'Marvelous Bridge', 'Phenomenon', 'Marvelous Bridge'],
        ['Resist Wing', 'Marvelous Bridge', 'Phenomenon', 'Marvelous Bridge'],
        ['Genius Wing', 'Marvelous Bridge', 'Phenomenon', 'Marvelous Bridge'],
        ['Clever Wing', 'Marvelous Bridge', 'Phenomenon', 'Marvelous Bridge'],
        ['Swift Wing', 'Marvelous Bridge', 'Phenomenon', 'Marvelous Bridge'],
        ['Pretty Wing', 'Marvelous Bridge', 'Phenomenon', 'Marvelous Bridge'],
        ['Fire Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Water Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Electric Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Grass Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Ice Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Fighting Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Poison Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Ground Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Flying Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Psychic Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Bug Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Rock Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Ghost Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Dragon Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Dark Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Steel Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Normal Gem', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Fire Stone', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Water Stone', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Thunder Stone', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Leaf Stone', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Moon Stone', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Sun Stone', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Shiny Stone', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Dusk Stone', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Dawn Stone', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Oval Stone', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Everstone', 'Mistralton Cave', 'Phenomenon', 'Mistralton Cave'],
        ['Heart Scale', 'Mistralton City', 'From a Maid in the Cargo Service building in exchange for 10 Sweet Hearts (repeatable) (only 5 Sweet Hearts required on February 14 and March 14)', 'Mistralton City'],
        ['HP Up', 'Mistralton City', 'From a woman in the house east of the Pokémon Center when the number of TMs collected reaches 10, 20, 35, 50, 70, and 95 (×6)', 'Mistralton City'],
        ['Net Ball', 'Mistralton City', 'From the Pilot behind the counter in the Cargo Service building, for bringing him a Flying- or Psychic Pokémon (×5)', 'Mistralton City'],
        ['Dark Stone', "N's Castle", '5F, gift from N after the first battle', "N's Castle"],
        ['Light Stone', "N's Castle", '5F, gift from N after the first battle', "N's Castle"],
        ['Max Potion', 'Nature Preserve', 'Northwest of the plane', 'Nature Preserve'],
        ['Big Nugget', 'Nature Preserve', 'In the dark grass above the Haxorus', 'Nature Preserve'],
        ['Rare Candy', 'Nature Preserve', 'On the cliff in the extreme northeast (requires Waterfall)', 'Nature Preserve'],
        ['Vs. Recorder', 'Nimbasa City', 'From Nate/Rosa after defeating Ingo and Emmet in a Multi Battle', 'Nimbasa City'],
        ['Dropped Item-{{#switch: {{#expr: {{#time: U}} mod 2}}|0=m|1=f}}', 'Nimbasa City', 'Near the flowers in the amusement park', 'Nimbasa City'],
        ['Rage Candy Bar', 'Nimbasa City', '*Held by traded Togepi *Held by traded Wobbuffet *Held by traded Teddiursa *Held by traded Phanpy', 'Nimbasa City'],
        ['Lava Cookie', 'Nimbasa City', '*Held by traded Ralts *Held by traded Sableye *Held by traded Mawile *Held by traded Spinda', 'Nimbasa City'],
        ['Old Gateau', 'Nimbasa City', '*Held by traded Cranidos *Held by traded Shieldon *Held by traded Shellos *Held by traded Spiritomb', 'Nimbasa City'],
        ['Super Rod III', 'Nuvema Town', 'From Cedric Juniper', 'Nuvema Town'],
        ['Iron', 'Pinwheel Forest', 'Near the railroad tracks', 'Pinwheel Forest'],
        ['Protein', 'Pinwheel Forest', 'Near the railroad tracks', 'Pinwheel Forest'],
        ['Magmarizer', 'Plasma Frigate', 'B1F, top right room', 'Plasma Frigate'],
        ['Electirizer', 'Plasma Frigate', 'B1F, bigger room on the left', 'Plasma Frigate'],
        ['Plasma Card', 'Plasma Frigate', 'B2F, from the Team Plasma Grunt with Trubbish and Zangoose after defeating her', 'Plasma Frigate'],
        ['Power Belt', 'Plasma Frigate', 'B2F, in the yellow warp panel maze', 'Plasma Frigate'],
        ['Red Shard', 'Pokémon World Tournament', 'Randomly given as a consolation prize after losing a tournament', 'Pokémon World Tournament'],
        ['Green Shard', 'Pokémon World Tournament', 'Randomly given as a consolation prize after losing a tournament', 'Pokémon World Tournament'],
        ['Blue Shard', 'Pokémon World Tournament', 'Randomly given as a consolation prize after losing a tournament', 'Pokémon World Tournament'],
        ['Yellow Shard', 'Pokémon World Tournament', 'Randomly given as a consolation prize after losing a tournament', 'Pokémon World Tournament'],
        ['Full Heal', 'Reversal Mountain', "Near entrance from Lentimas Town's side", 'Reversal Mountain'],
        ['Escape Rope', 'Reversal Mountain', 'On the hill, accessed from inside the mountain', 'Reversal Mountain'],
        ['Smoke Ball', 'Reversal Mountain', 'On the hill, accessed from inside the mountain', 'Reversal Mountain'],
        ['Yellow Shard', 'Reversal Mountain', 'Southern dead end west of the Ace Trainers, in a rock (hidden)', 'Reversal Mountain'],
        ['Rawst Berry', 'Reversal Mountain', 'From Pokémon Ranger Lewis after defeating him', 'Reversal Mountain'],
        ['Red Shard', 'Reversal Mountain', 'Southeastern part, in a rock (hidden)', 'Reversal Mountain'],
        ['Toxic Orb', 'Reversal Mountain', 'Near the entrance to 1F', 'Reversal Mountain'],
        ['Flame Orb', 'Reversal Mountain', 'Near the entrance to 1F', 'Reversal Mountain'],
        ['Persim Berry', 'Reversal Mountain', 'From Pokémon Ranger Lewis after defeating him', 'Reversal Mountain'],
        ['Fire Gem', 'Reversal Mountain', 'In a rock near the big rock (hidden)', 'Reversal Mountain'],
        ['Lava Cookie', 'Royal Unova', 'Reward for defeating every Trainer on boardMoWeFr', 'Royal Unova'],
        ['Berry Juice', 'Royal Unova', 'Reward for defeating every Trainer on boardTu', 'Royal Unova'],
        ['Old Gateau', 'Royal Unova', 'Reward for defeating every Trainer on boardTh', 'Royal Unova'],
        ['Rage Candy Bar', 'Royal Unova', 'Reward for defeating every Trainer on boardSa', 'Royal Unova'],
        ['Rare Candy', 'Royal Unova', 'Reward for defeating every Trainer on boardSu', 'Royal Unova'],
        ['Fire Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Water Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Electric Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Grass Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Ice Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Fighting Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Poison Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Ground Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Flying Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Psychic Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Bug Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Rock Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Ghost Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Dragon Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Dark Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Steel Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Normal Gem', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Fire Stone', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Water Stone', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Thunder Stone', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Leaf Stone', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Moon Stone', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Sun Stone', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Shiny Stone', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Dusk Stone', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Dawn Stone', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Oval Stone', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Everstone', 'Seaside Cave', 'Phenomenon', 'Seaside Cave'],
        ['Energy Root', 'Shopping Mall Nine', 'Bottom section, from the Lady for giving her a Hyper Potion the same day she gave the money (either this or EnergyPowder)', 'Shopping Mall Nine'],
        ['Energy Powder', 'Shopping Mall Nine', 'Bottom section, from the Lady for giving her a Hyper Potion after the day she gave the money (either this or Energy Root)', 'Shopping Mall Nine'],
        ['Energy Powder', 'Tubeline Bridge', 'From a Scientist inside the Route 8 gate', 'Tubeline Bridge'],
        ['Fire Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Water Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Electric Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Grass Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Ice Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Fighting Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Poison Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Ground Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Flying Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Psychic Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Bug Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Rock Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Ghost Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Dragon Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Dark Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Steel Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Normal Gem', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Fire Stone', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Water Stone', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Thunder Stone', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Leaf Stone', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Moon Stone', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Sun Stone', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Shiny Stone', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Dusk Stone', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Dawn Stone', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Oval Stone', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Everstone', 'Twist Mountain', 'Phenomenon', 'Twist Mountain'],
        ['Prism Scale', 'Undella Town', 'From a man in the Pokémon Center', 'Undella Town'],
        ['Power Lens', 'Route 13', 'From the girl in the western house', 'Unova Route 13'],
        ['Power Band', 'Route 13', 'From the girl in the western house', 'Unova Route 13'],
        ['Colress Machine', 'Route 22', 'From Colress upon approaching Terrakion', 'Unova Route 22'],
        ['Light Clay', 'Route 4', 'Northeast of Pokéfan Sachiko', 'Unova Route 4'],
        ['BrightPowder', 'Route 4', 'In a house where Cottonee is obtained', 'Unova Route 4'],
        ['Swift Wing', 'Route 4', 'From male Ace Trainer in a house near Lady Lina if he is shown a Pokémon with an Attack stat equal to (gives five) or higher than (gives one) what he requests. Can be repeated daily, with request values changing every time. (×1)', 'Unova Route 4'],
        ['Power Weight', 'Route 4', 'Held by traded Cottonee', 'Unova Route 4'],
        ['Power Anklet', 'Route 4', 'Held by traded Petilil', 'Unova Route 4'],
        ['Health Wing', 'Route 4', 'From female Ace Trainer in the southernmost building on the right if she is shown a Pokémon with a Speed stat equal to (gives five) or higher than (gives one) what she requests. Can be repeated daily, with request values changing every time. (×1)', 'Unova Route 4'],
        ['Pomeg Berry', 'Route 5', 'Buyable from Pokémon Breeder (once per day) (×5)', 'Unova Route 5'],
        ['Kelpsy Berry', 'Route 5', 'Buyable from Pokémon Breeder (once per day) (×5)', 'Unova Route 5'],
        ['Qualot Berry', 'Route 5', 'Buyable from Pokémon Breeder (once per day) (×5)', 'Unova Route 5'],
        ['Hondew Berry', 'Route 5', 'Buyable from Pokémon Breeder (once per day) (×5)', 'Unova Route 5'],
        ['Grepa Berry', 'Route 5', 'Buyable from Pokémon Breeder (once per day) (×5)', 'Unova Route 5'],
        ['Leppa Berry', 'Route 7', 'Held by a Gigalith the player can receive in a trade', 'Unova Route 7'],
        ['Damp Rock', 'Route 8', 'From Parasol Lady near the Tubeline Bridge gate, once a day in the morning', 'Unova Route 8'],
        ['Fire Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Water Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Electric Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Grass Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Ice Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Fighting Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Poison Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Ground Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Flying Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Psychic Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Bug Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Rock Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Ghost Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Dragon Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Dark Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Steel Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Normal Gem', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Fire Stone', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Water Stone', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Thunder Stone', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Leaf Stone', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Moon Stone', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Sun Stone', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Shiny Stone', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Dusk Stone', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Dawn Stone', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Oval Stone', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Everstone', 'Victory Road', 'Phenomenon', 'Victory Road (Black 2 and White 2)'],
        ['Dive Ball', 'Village Bridge', 'From a Fisherman for showing him a requested species of fish Pokémon caught that day (daily)* (×5)', 'Village Bridge'],
        ['Lum Berry', 'Village Bridge', 'From the Baker after showing her a Pokémon with the Ability Honey Gather (post-game) (×3)', 'Village Bridge'],
        ['HM01 Cut', 'Virbank City', 'From Roxie after defeating the Team Plasma Grunt', 'Virbank City'],
        ['Ether', 'Virbank Complex', 'From a Scientist, after talking to him three times', 'Virbank Complex'],
        ['Super Potion', 'Virbank Complex', 'At the end of the narrow passageway west of the entrance (requires Cut)', 'Virbank Complex'],
        ['Fire Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Water Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Electric Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Grass Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Ice Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Fighting Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Poison Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Ground Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Flying Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Psychic Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Bug Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Rock Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Ghost Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Dragon Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Dark Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Steel Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Normal Gem', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Fire Stone', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Water Stone', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Thunder Stone', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Leaf Stone', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Moon Stone', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Sun Stone', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Shiny Stone', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Dusk Stone', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Dawn Stone', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Oval Stone', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
        ['Everstone', 'Wellspring Cave', 'Phenomenon', 'Wellspring Cave'],
    ],
    'shops': [
        ['Repeat Ball', 'Accumula Town', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Accumula Town'],
        ['Nest Ball', 'Accumula Town', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Accumula Town'],
        ['Quick Ball', 'Accumula Town', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Accumula Town'],
        ['Greet Mail', 'Accumula Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Accumula Town'],
        ['Favored Mail', 'Accumula Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Accumula Town'],
        ['RSVP Mail', 'Accumula Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Accumula Town'],
        ['Thanks Mail', 'Accumula Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Accumula Town'],
        ['Inquiry Mail', 'Accumula Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Accumula Town'],
        ['Like Mail', 'Accumula Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Accumula Town'],
        ['Reply Mail', 'Accumula Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Accumula Town'],
        ['Greet Mail', 'Aspertia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Aspertia City'],
        ['Favored Mail', 'Aspertia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Aspertia City'],
        ['RSVP Mail', 'Aspertia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Aspertia City'],
        ['Thanks Mail', 'Aspertia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Aspertia City'],
        ['Inquiry Mail', 'Aspertia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Aspertia City'],
        ['Like Mail', 'Aspertia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Aspertia City'],
        ['Reply Mail', 'Aspertia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Aspertia City'],
        ['TM17', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '6 BP', '', 'Battle Subway'],
        ['TM20', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '6 BP', '', 'Battle Subway'],
        ['TM32', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '6 BP', '', 'Battle Subway'],
        ['TM59', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '6 BP', '', 'Battle Subway'],
        ['TM31', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '12 BP', '', 'Battle Subway'],
        ['TM79', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '12 BP', '', 'Battle Subway'],
        ['TM89', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '12 BP', '', 'Battle Subway'],
        ['TM10', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '18 BP', '', 'Battle Subway'],
        ['TM23', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '18 BP', '', 'Battle Subway'],
        ['TM48', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '18 BP', '', 'Battle Subway'],
        ['TM75', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '18 BP', '', 'Battle Subway'],
        ['TM87', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '18 BP', '', 'Battle Subway'],
        ['TM88', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '18 BP', '', 'Battle Subway'],
        ['TM34', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '24 BP', '', 'Battle Subway'],
        ['TM51', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '24 BP', '', 'Battle Subway'],
        ['TM60', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '24 BP', '', 'Battle Subway'],
        ['TM64', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '24 BP', '', 'Battle Subway'],
        ['TM77', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Left attendant', '24 BP', '', 'Battle Subway'],
        ['Protein', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '1 BP', '', 'Battle Subway'],
        ['Calcium', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '1 BP', '', 'Battle Subway'],
        ['Iron', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '1 BP', '', 'Battle Subway'],
        ['Zinc', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '1 BP', '', 'Battle Subway'],
        ['Carbos', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '1 BP', '', 'Battle Subway'],
        ['HP Up', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '1 BP', '', 'Battle Subway'],
        ['Fire Stone', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '3 BP', '', 'Battle Subway'],
        ['Thunder Stone', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '3 BP', '', 'Battle Subway'],
        ['Water Stone', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '3 BP', '', 'Battle Subway'],
        ['Leaf Stone', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '3 BP', '', 'Battle Subway'],
        ['Scope Lens', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '8 BP', '', 'Battle Subway'],
        ['Wide Lens', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '8 BP', '', 'Battle Subway'],
        ['Muscle Band', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '8 BP', '', 'Battle Subway'],
        ['Wise Glasses', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '8 BP', '', 'Battle Subway'],
        ['Razor Claw', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '8 BP', '', 'Battle Subway'],
        ['Razor Fang', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '8 BP', '', 'Battle Subway'],
        ['Binding Band', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '8 BP', '', 'Battle Subway'],
        ['Bright Powder', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '12 BP', '', 'Battle Subway'],
        ['Focus Band', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '12 BP', '', 'Battle Subway'],
        ['Zoom Lens', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '12 BP', '', 'Battle Subway'],
        ['Iron Ball', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '12 BP', '', 'Battle Subway'],
        ['Air Balloon', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '12 BP', '', 'Battle Subway'],
        ['Power Bracer', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Power Belt', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Power Lens', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Power Band', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Power Anklet', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Power Weight', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Toxic Orb', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Flame Orb', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['White Herb', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Power Herb', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Absorb Bulb', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Cell Battery', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Red Card', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Eject Button', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '16 BP', '', 'Battle Subway'],
        ['Choice Band', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '24 BP', '', 'Battle Subway'],
        ['Choice Specs', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '24 BP', '', 'Battle Subway'],
        ['Choice Scarf', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '24 BP', '', 'Battle Subway'],
        ['Focus Sash', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '24 BP', '', 'Battle Subway'],
        ['Life Orb', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '24 BP', '', 'Battle Subway'],
        ['Rare Candy', 'Battle Subway', 'Items / Exchange Service Corner / Pokémon Black 2 and White 2 / Right attendant', '24 BP', '', 'Battle Subway'],
        ['Thunder Stone', 'Black City', 'Marketplace / Pokémon Black 2 / Store 1', '10000 dollars', '', 'Black City'],
        ['Protector', 'Black City', 'Marketplace / Pokémon Black 2 / Store 1', '10000 dollars', '', 'Black City'],
        ['Fire Stone', 'Black City', 'Marketplace / Pokémon Black 2 / Store 2', '20000 dollars', '', 'Black City'],
        ['Metal Coat', 'Black City', 'Marketplace / Pokémon Black 2 / Store 2', '20000 dollars', '', 'Black City'],
        ['Dusk Stone', 'Black City', 'Marketplace / Pokémon Black 2 / Store 3', '40000 dollars', '', 'Black City'],
        ['Upgrade', 'Black City', 'Marketplace / Pokémon Black 2 / Store 3', '40000 dollars', '', 'Black City'],
        ['Dawn Stone', 'Black City', 'Marketplace / Pokémon Black 2 / Store 4', '60000 dollars', '', 'Black City'],
        ['Dubious Disc', 'Black City', 'Marketplace / Pokémon Black 2 / Store 4', '60000 dollars', '', 'Black City'],
        ['BridgeMail M', 'Black City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Black City'],
        ['Greet Mail', 'Black City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Black City'],
        ['Favored Mail', 'Black City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Black City'],
        ['RSVP Mail', 'Black City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Black City'],
        ['Thanks Mail', 'Black City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Black City'],
        ['Inquiry Mail', 'Black City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Black City'],
        ['Like Mail', 'Black City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Black City'],
        ['Reply Mail', 'Black City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Black City'],
        ['Casteliacone', 'Castelia City', 'Places of interest / Mode Street / Casteliacone / Casteliacone', '100 dollars', '', 'Castelia City'],
        ['Casteliacone', 'Castelia City', 'Places of interest / Mode Street / Casteliacone / Casteliacone', '1200 dollars', '×12', 'Castelia City'],
        ['Fresh Water', 'Castelia City', 'Places of interest / Central Plaza / Vending machines', '200 dollars', '', 'Castelia City'],
        ['Soda Pop', 'Castelia City', 'Places of interest / Central Plaza / Vending machines', '300 dollars', '', 'Castelia City'],
        ['Lemonade', 'Castelia City', 'Places of interest / Central Plaza / Vending machines', '350 dollars', '', 'Castelia City'],
        ['Heal Ball', 'Castelia City', 'Poké Mart / Lower cashier', '300 dollars', '', 'Castelia City'],
        ['Net Ball', 'Castelia City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Castelia City'],
        ['Nest Ball', 'Castelia City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Castelia City'],
        ['Greet Mail', 'Castelia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Castelia City'],
        ['Favored Mail', 'Castelia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Castelia City'],
        ['RSVP Mail', 'Castelia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Castelia City'],
        ['Thanks Mail', 'Castelia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Castelia City'],
        ['Inquiry Mail', 'Castelia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Castelia City'],
        ['Like Mail', 'Castelia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Castelia City'],
        ['Reply Mail', 'Castelia City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Castelia City'],
        ['Heal Powder', 'Driftveil City', 'Places of interest / Driftveil Market / Herb Shop', '450 dollars', '', 'Driftveil City'],
        ['Energy Powder', 'Driftveil City', 'Places of interest / Driftveil Market / Herb Shop', '500 dollars', '', 'Driftveil City'],
        ['Energy Root', 'Driftveil City', 'Places of interest / Driftveil Market / Herb Shop', '800 dollars', '', 'Driftveil City'],
        ['Revival Herb', 'Driftveil City', 'Places of interest / Driftveil Market / Herb Shop', '2800 dollars', '', 'Driftveil City'],
        ['Moomoo Milk', 'Driftveil City', 'Places of interest / Driftveil Market / Moomoo Milk shop', '500 dollars', '', 'Driftveil City'],
        ['Moomoo Milk', 'Driftveil City', 'Places of interest / Driftveil Market / Moomoo Milk shop', '6000 dollars', '×12', 'Driftveil City'],
        ['Odd Incense', 'Driftveil City', 'Places of interest / Driftveil Market / Incenses', '9600 dollars', '', 'Driftveil City'],
        ['Sea Incense', 'Driftveil City', 'Places of interest / Driftveil Market / Incenses', '9600 dollars', '', 'Driftveil City'],
        ['Rose Incense', 'Driftveil City', 'Places of interest / Driftveil Market / Incenses', '9600 dollars', '', 'Driftveil City'],
        ['Wave Incense', 'Driftveil City', 'Places of interest / Driftveil Market / Incenses', '9600 dollars', '', 'Driftveil City'],
        ['Rock Incense', 'Driftveil City', 'Places of interest / Driftveil Market / Incenses', '9600 dollars', '', 'Driftveil City'],
        ['Pure Incense', 'Driftveil City', 'Places of interest / Driftveil Market / Incenses', '9600 dollars', '', 'Driftveil City'],
        ['Luck Incense', 'Driftveil City', 'Places of interest / Driftveil Market / Incenses', '9600 dollars', '', 'Driftveil City'],
        ['Lax Incense', 'Driftveil City', 'Places of interest / Driftveil Market / Incenses', '9600 dollars', '', 'Driftveil City'],
        ['Full Incense', 'Driftveil City', 'Places of interest / Driftveil Market / Incenses', '9600 dollars', '', 'Driftveil City'],
        ['Net Ball', 'Driftveil City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Driftveil City'],
        ['Nest Ball', 'Driftveil City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Driftveil City'],
        ['Dusk Ball', 'Driftveil City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Driftveil City'],
        ['BridgeMail D', 'Driftveil City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Driftveil City'],
        ['Greet Mail', 'Driftveil City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Driftveil City'],
        ['Favored Mail', 'Driftveil City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Driftveil City'],
        ['RSVP Mail', 'Driftveil City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Driftveil City'],
        ['Thanks Mail', 'Driftveil City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Driftveil City'],
        ['Inquiry Mail', 'Driftveil City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Driftveil City'],
        ['Like Mail', 'Driftveil City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Driftveil City'],
        ['Reply Mail', 'Driftveil City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Driftveil City'],
        ['Greet Mail', 'Floccesy Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Floccesy Town'],
        ['Favored Mail', 'Floccesy Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Floccesy Town'],
        ['RSVP Mail', 'Floccesy Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Floccesy Town'],
        ['Thanks Mail', 'Floccesy Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Floccesy Town'],
        ['Inquiry Mail', 'Floccesy Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Floccesy Town'],
        ['Like Mail', 'Floccesy Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Floccesy Town'],
        ['Reply Mail', 'Floccesy Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Floccesy Town'],
        ['Luxury Ball', 'Humilau City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Humilau City'],
        ['Dive Ball', 'Humilau City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Humilau City'],
        ['Net Ball', 'Humilau City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Humilau City'],
        ['Greet Mail', 'Humilau City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Humilau City'],
        ['Favored Mail', 'Humilau City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Humilau City'],
        ['RSVP Mail', 'Humilau City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Humilau City'],
        ['Thanks Mail', 'Humilau City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Humilau City'],
        ['Inquiry Mail', 'Humilau City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Humilau City'],
        ['Like Mail', 'Humilau City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Humilau City'],
        ['Reply Mail', 'Humilau City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Humilau City'],
        ['TM14', 'Icirrus City', 'Poké Mart / Technical Machine department (Black and White) (Lower cashier)', '70000 dollars', '', 'Icirrus City'],
        ['TM25', 'Icirrus City', 'Poké Mart / Technical Machine department (Black and White) (Lower cashier)', '70000 dollars', '', 'Icirrus City'],
        ['TM38', 'Icirrus City', 'Poké Mart / Technical Machine department (Black and White) (Lower cashier)', '70000 dollars', '', 'Icirrus City'],
        ['Dusk Ball', 'Icirrus City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '1000 dollars', '', 'Icirrus City'],
        ['Timer Ball', 'Icirrus City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '1000 dollars', '', 'Icirrus City'],
        ['Quick Ball', 'Icirrus City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '1000 dollars', '', 'Icirrus City'],
        ['BridgeMail T', 'Icirrus City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '50 dollars', '', 'Icirrus City'],
        ['Greet Mail', 'Icirrus City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '50 dollars', '', 'Icirrus City'],
        ['Favored Mail', 'Icirrus City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '50 dollars', '', 'Icirrus City'],
        ['RSVP Mail', 'Icirrus City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '50 dollars', '', 'Icirrus City'],
        ['Thanks Mail', 'Icirrus City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '50 dollars', '', 'Icirrus City'],
        ['Inquiry Mail', 'Icirrus City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '50 dollars', '', 'Icirrus City'],
        ['Like Mail', 'Icirrus City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '50 dollars', '', 'Icirrus City'],
        ['Reply Mail', 'Icirrus City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '50 dollars', '', 'Icirrus City'],
        ['BridgeMail V', 'Lacunosa Town', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Lacunosa Town'],
        ['Greet Mail', 'Lacunosa Town', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Lacunosa Town'],
        ['Favored Mail', 'Lacunosa Town', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Lacunosa Town'],
        ['RSVP Mail', 'Lacunosa Town', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Lacunosa Town'],
        ['Thanks Mail', 'Lacunosa Town', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Lacunosa Town'],
        ['Inquiry Mail', 'Lacunosa Town', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Lacunosa Town'],
        ['Like Mail', 'Lacunosa Town', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Lacunosa Town'],
        ['Reply Mail', 'Lacunosa Town', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Lacunosa Town'],
        ['TM14', 'Lacunosa Town', 'Poké Mart / Lower cashier (Black 2 and White 2)', '70000 dollars', '', 'Lacunosa Town'],
        ['TM25', 'Lacunosa Town', 'Poké Mart / Lower cashier (Black 2 and White 2)', '70000 dollars', '', 'Lacunosa Town'],
        ['TM38', 'Lacunosa Town', 'Poké Mart / Lower cashier (Black 2 and White 2)', '70000 dollars', '', 'Lacunosa Town'],
        ['Poké Ball', 'Lentimas Town', 'Poké Mart / Lower cashier', '200 dollars', '', 'Lentimas Town'],
        ['Great Ball', 'Lentimas Town', 'Poké Mart / Lower cashier', '600 dollars', '', 'Lentimas Town'],
        ['Ultra Ball', 'Lentimas Town', 'Poké Mart / Lower cashier', '1200 dollars', '', 'Lentimas Town'],
        ['Potion', 'Lentimas Town', 'Poké Mart / Lower cashier', '300 dollars', '', 'Lentimas Town'],
        ['Super Potion', 'Lentimas Town', 'Poké Mart / Lower cashier', '700 dollars', '', 'Lentimas Town'],
        ['Hyper Potion', 'Lentimas Town', 'Poké Mart / Lower cashier', '1200 dollars', '', 'Lentimas Town'],
        ['Max Potion', 'Lentimas Town', 'Poké Mart / Lower cashier', '2500 dollars', '7 Badges', 'Lentimas Town'],
        ['Full Restore', 'Lentimas Town', 'Poké Mart / Lower cashier', '3000 dollars', '8 Badges', 'Lentimas Town'],
        ['Revive', 'Lentimas Town', 'Poké Mart / Lower cashier', '1500 dollars', '', 'Lentimas Town'],
        ['Antidote', 'Lentimas Town', 'Poké Mart / Lower cashier', '100 dollars', '', 'Lentimas Town'],
        ['Paralyze Heal', 'Lentimas Town', 'Poké Mart / Lower cashier', '200 dollars', '', 'Lentimas Town'],
        ['Awakening', 'Lentimas Town', 'Poké Mart / Lower cashier', '250 dollars', '', 'Lentimas Town'],
        ['Burn Heal', 'Lentimas Town', 'Poké Mart / Lower cashier', '250 dollars', '', 'Lentimas Town'],
        ['Ice Heal', 'Lentimas Town', 'Poké Mart / Lower cashier', '250 dollars', '', 'Lentimas Town'],
        ['Full Heal', 'Lentimas Town', 'Poké Mart / Lower cashier', '600 dollars', '', 'Lentimas Town'],
        ['Escape Rope', 'Lentimas Town', 'Poké Mart / Lower cashier', '550 dollars', '', 'Lentimas Town'],
        ['Repel', 'Lentimas Town', 'Poké Mart / Lower cashier', '350 dollars', '', 'Lentimas Town'],
        ['Super Repel', 'Lentimas Town', 'Poké Mart / Lower cashier', '500 dollars', '', 'Lentimas Town'],
        ['Max Repel', 'Lentimas Town', 'Poké Mart / Lower cashier', '700 dollars', '', 'Lentimas Town'],
        ['TM07', 'Mistralton City', 'Poké Mart / Technical Machine department (Lower cashier)', '50000 dollars', '', 'Mistralton City'],
        ['TM11', 'Mistralton City', 'Poké Mart / Technical Machine department (Lower cashier)', '50000 dollars', '', 'Mistralton City'],
        ['TM18', 'Mistralton City', 'Poké Mart / Technical Machine department (Lower cashier)', '50000 dollars', '', 'Mistralton City'],
        ['TM37', 'Mistralton City', 'Poké Mart / Technical Machine department (Lower cashier)', '50000 dollars', '', 'Mistralton City'],
        ['TM73', 'Nimbasa City', 'Poké Mart / Technical Machine department (Lower cashier)', '10000 dollars', '', 'Nimbasa City'],
        ['TM74', 'Nimbasa City', 'Poké Mart / Technical Machine department (Lower cashier)', '10000 dollars', '', 'Nimbasa City'],
        ['TM16', 'Nimbasa City', 'Poké Mart / Technical Machine department (Lower cashier)', '30000 dollars', '', 'Nimbasa City'],
        ['TM33', 'Nimbasa City', 'Poké Mart / Technical Machine department (Lower cashier)', '30000 dollars', '', 'Nimbasa City'],
        ['Dusk Ball', 'Opelucid City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Opelucid City'],
        ['Timer Ball', 'Opelucid City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Opelucid City'],
        ['Quick Ball', 'Opelucid City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Opelucid City'],
        ['BridgeMail V', 'Opelucid City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Opelucid City'],
        ['Greet Mail', 'Opelucid City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Opelucid City'],
        ['Favored Mail', 'Opelucid City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Opelucid City'],
        ['RSVP Mail', 'Opelucid City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Opelucid City'],
        ['Thanks Mail', 'Opelucid City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Opelucid City'],
        ['Inquiry Mail', 'Opelucid City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Opelucid City'],
        ['Like Mail', 'Opelucid City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Opelucid City'],
        ['Reply Mail', 'Opelucid City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Opelucid City'],
        ['TM17', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '6 BP', '', 'Pokémon World Tournament'],
        ['TM20', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '6 BP', '', 'Pokémon World Tournament'],
        ['TM32', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '6 BP', '', 'Pokémon World Tournament'],
        ['TM59', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '6 BP', '', 'Pokémon World Tournament'],
        ['TM31', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '12 BP', '', 'Pokémon World Tournament'],
        ['TM79', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '12 BP', '', 'Pokémon World Tournament'],
        ['TM89', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '12 BP', '', 'Pokémon World Tournament'],
        ['TM10', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '18 BP', '', 'Pokémon World Tournament'],
        ['TM23', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '18 BP', '', 'Pokémon World Tournament'],
        ['TM48', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '18 BP', '', 'Pokémon World Tournament'],
        ['TM75', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '18 BP', '', 'Pokémon World Tournament'],
        ['TM87', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '18 BP', '', 'Pokémon World Tournament'],
        ['TM88', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '18 BP', '', 'Pokémon World Tournament'],
        ['TM34', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '24 BP', '', 'Pokémon World Tournament'],
        ['TM51', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '24 BP', '', 'Pokémon World Tournament'],
        ['TM60', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '24 BP', '', 'Pokémon World Tournament'],
        ['TM64', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '24 BP', '', 'Pokémon World Tournament'],
        ['TM77', 'Pokémon World Tournament', 'Exchange Service Corner / Left attendant', '24 BP', '', 'Pokémon World Tournament'],
        ['Protein', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '1 BP', '', 'Pokémon World Tournament'],
        ['Calcium', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '1 BP', '', 'Pokémon World Tournament'],
        ['Iron', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '1 BP', '', 'Pokémon World Tournament'],
        ['Zinc', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '1 BP', '', 'Pokémon World Tournament'],
        ['Carbos', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '1 BP', '', 'Pokémon World Tournament'],
        ['HP Up', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '1 BP', '', 'Pokémon World Tournament'],
        ['Fire Stone', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '3 BP', '', 'Pokémon World Tournament'],
        ['Thunder Stone', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '3 BP', '', 'Pokémon World Tournament'],
        ['Water Stone', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '3 BP', '', 'Pokémon World Tournament'],
        ['Leaf Stone', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '3 BP', '', 'Pokémon World Tournament'],
        ['Scope Lens', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '8 BP', '', 'Pokémon World Tournament'],
        ['Wide Lens', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '8 BP', '', 'Pokémon World Tournament'],
        ['Muscle Band', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '8 BP', '', 'Pokémon World Tournament'],
        ['Wise Glasses', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '8 BP', '', 'Pokémon World Tournament'],
        ['Razor Claw', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '8 BP', '', 'Pokémon World Tournament'],
        ['Razor Fang', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '8 BP', '', 'Pokémon World Tournament'],
        ['Binding Band', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '8 BP', '', 'Pokémon World Tournament'],
        ['Focus Band', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '12 BP', '', 'Pokémon World Tournament'],
        ['Zoom Lens', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '12 BP', '', 'Pokémon World Tournament'],
        ['Iron Ball', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '12 BP', '', 'Pokémon World Tournament'],
        ['Air Balloon', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '12 BP', '', 'Pokémon World Tournament'],
        ['Power Bracer', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Power Belt', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Power Lens', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Power Band', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Power Anklet', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Power Weight', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Toxic Orb', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Flame Orb', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['White Herb', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Power Herb', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Absorb Bulb', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Cell Battery', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Red Card', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Eject Button', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '16 BP', '', 'Pokémon World Tournament'],
        ['Choice Band', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '24 BP', '', 'Pokémon World Tournament'],
        ['Choice Specs', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '24 BP', '', 'Pokémon World Tournament'],
        ['Choice Scarf', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '24 BP', '', 'Pokémon World Tournament'],
        ['Focus Sash', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '24 BP', '', 'Pokémon World Tournament'],
        ['Life Orb', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '24 BP', '', 'Pokémon World Tournament'],
        ['Rare Candy', 'Pokémon World Tournament', 'Exchange Service Corner / Right attendant', '24 BP', '', 'Pokémon World Tournament'],
        ['Potion', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '300 dollars', '', 'Shopping Mall Nine'],
        ['Super Potion', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '700 dollars', '', 'Shopping Mall Nine'],
        ['Hyper Potion', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '1200 dollars', '', 'Shopping Mall Nine'],
        ['Max Potion', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '2500 dollars', '', 'Shopping Mall Nine'],
        ['Revive', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '1500 dollars', '', 'Shopping Mall Nine'],
        ['Antidote', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '100 dollars', '', 'Shopping Mall Nine'],
        ['Paralyze Heal', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '200 dollars', '', 'Shopping Mall Nine'],
        ['Burn Heal', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '250 dollars', '', 'Shopping Mall Nine'],
        ['Ice Heal', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '200 dollars', '', 'Shopping Mall Nine'],
        ['Awakening', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '250 dollars', '', 'Shopping Mall Nine'],
        ['Full Heal', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '600 dollars', '', 'Shopping Mall Nine'],
        ['Escape Rope', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '550 dollars', '', 'Shopping Mall Nine'],
        ['Poké Toy', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '1000 dollars', '', 'Shopping Mall Nine'],
        ['Repel', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '350 dollars', '', 'Shopping Mall Nine'],
        ['Super Repel', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '500 dollars', '', 'Shopping Mall Nine'],
        ['Max Repel', 'Shopping Mall Nine', 'Sections / Bottom section / Cashier', '700 dollars', '', 'Shopping Mall Nine'],
        ['Poké Ball', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '200 dollars', '', 'Shopping Mall Nine'],
        ['Great Ball', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '600 dollars', '', 'Shopping Mall Nine'],
        ['Ultra Ball', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '1200 dollars', '', 'Shopping Mall Nine'],
        ['Heal Ball', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '300 dollars', '', 'Shopping Mall Nine'],
        ['Net Ball', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '1000 dollars', '', 'Shopping Mall Nine'],
        ['Nest Ball', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '1000 dollars', '', 'Shopping Mall Nine'],
        ['Dusk Ball', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '1000 dollars', '', 'Shopping Mall Nine'],
        ['Quick Ball', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '1000 dollars', '', 'Shopping Mall Nine'],
        ['Timer Ball', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '1000 dollars', '', 'Shopping Mall Nine'],
        ['Greet Mail', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '50 dollars', '', 'Shopping Mall Nine'],
        ['Favored Mail', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '50 dollars', '', 'Shopping Mall Nine'],
        ['RSVP Mail', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '50 dollars', '', 'Shopping Mall Nine'],
        ['Thanks Mail', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '50 dollars', '', 'Shopping Mall Nine'],
        ['Inquiry Mail', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '50 dollars', '', 'Shopping Mall Nine'],
        ['Like Mail', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '50 dollars', '', 'Shopping Mall Nine'],
        ['Reply Mail', 'Shopping Mall Nine', 'Sections / Middle section / Left cashier', '50 dollars', '', 'Shopping Mall Nine'],
        ['TM15', 'Shopping Mall Nine', 'Sections / Middle section / Right cashier', '90000 dollars', '', 'Shopping Mall Nine'],
        ['TM68', 'Shopping Mall Nine', 'Sections / Middle section / Right cashier', '90000 dollars', '', 'Shopping Mall Nine'],
        ['Protein', 'Shopping Mall Nine', 'Sections / Top section / Left cashier', '9800 dollars', '', 'Shopping Mall Nine'],
        ['Iron', 'Shopping Mall Nine', 'Sections / Top section / Left cashier', '9800 dollars', '', 'Shopping Mall Nine'],
        ['Calcium', 'Shopping Mall Nine', 'Sections / Top section / Left cashier', '9800 dollars', '', 'Shopping Mall Nine'],
        ['Zinc', 'Shopping Mall Nine', 'Sections / Top section / Left cashier', '9800 dollars', '', 'Shopping Mall Nine'],
        ['Carbos', 'Shopping Mall Nine', 'Sections / Top section / Left cashier', '9800 dollars', '', 'Shopping Mall Nine'],
        ['HP Up', 'Shopping Mall Nine', 'Sections / Top section / Left cashier', '9800 dollars', '', 'Shopping Mall Nine'],
        ['X Speed', 'Shopping Mall Nine', 'Sections / Top section / Right cashier', '350 dollars', '', 'Shopping Mall Nine'],
        ['X Attack', 'Shopping Mall Nine', 'Sections / Top section / Right cashier', '500 dollars', '', 'Shopping Mall Nine'],
        ['X Defense', 'Shopping Mall Nine', 'Sections / Top section / Right cashier', '550 dollars', '', 'Shopping Mall Nine'],
        ['Guard Spec.', 'Shopping Mall Nine', 'Sections / Top section / Right cashier', '700 dollars', '', 'Shopping Mall Nine'],
        ['Dire Hit', 'Shopping Mall Nine', 'Sections / Top section / Right cashier', '650 dollars', '', 'Shopping Mall Nine'],
        ['X Accuracy', 'Shopping Mall Nine', 'Sections / Top section / Right cashier', '950 dollars', '', 'Shopping Mall Nine'],
        ['X Sp. Atk', 'Shopping Mall Nine', 'Sections / Top section / Right cashier', '350 dollars', '', 'Shopping Mall Nine'],
        ['X Sp. Def', 'Shopping Mall Nine', 'Sections / Top section / Right cashier', '350 dollars', '', 'Shopping Mall Nine'],
        ['Fresh Water', 'Shopping Mall Nine', 'Sections / Top section / Vending machines', '200 dollars', '', 'Shopping Mall Nine'],
        ['Soda Pop', 'Shopping Mall Nine', 'Sections / Top section / Vending machines', '300 dollars', '', 'Shopping Mall Nine'],
        ['Lemonade', 'Shopping Mall Nine', 'Sections / Top section / Vending machines', '350 dollars', '', 'Shopping Mall Nine'],
        ['Heal Ball', 'Striaton City', 'Poké Mart / Lower cashier (Black and White)', '300 dollars', '', 'Striaton City'],
        ['Greet Mail', 'Striaton City', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Striaton City'],
        ['Favored Mail', 'Striaton City', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Striaton City'],
        ['RSVP Mail', 'Striaton City', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Striaton City'],
        ['Thanks Mail', 'Striaton City', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Striaton City'],
        ['Inquiry Mail', 'Striaton City', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Striaton City'],
        ['Like Mail', 'Striaton City', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Striaton City'],
        ['Reply Mail', 'Striaton City', 'Poké Mart / Lower cashier (Black and White)', '50 dollars', '', 'Striaton City'],
        ['TM04', 'Striaton City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '80000 dollars', '', 'Striaton City'],
        ['TM08', 'Striaton City', 'Poké Mart / Lower cashier (Black 2 and White 2)', '80000 dollars', '', 'Striaton City'],
        ['Luxury Ball', 'Undella Town', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Undella Town'],
        ['Dive Ball', 'Undella Town', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Undella Town'],
        ['Greet Mail', 'Undella Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Undella Town'],
        ['Favored Mail', 'Undella Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Undella Town'],
        ['RSVP Mail', 'Undella Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Undella Town'],
        ['Thanks Mail', 'Undella Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Undella Town'],
        ['Inquiry Mail', 'Undella Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Undella Town'],
        ['Like Mail', 'Undella Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Undella Town'],
        ['Reply Mail', 'Undella Town', 'Poké Mart / Lower cashier', '50 dollars', '', 'Undella Town'],
        ['Heal Ball', 'Victory Road', 'Poké Mart / Lower cashier', '300 dollars', '', 'Victory Road (Black 2 and White 2)'],
        ['Net Ball', 'Victory Road', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Victory Road (Black 2 and White 2)'],
        ['Nest Ball', 'Victory Road', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Victory Road (Black 2 and White 2)'],
        ['Quick Ball', 'Victory Road', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Victory Road (Black 2 and White 2)'],
        ['Dusk Ball', 'Victory Road', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Victory Road (Black 2 and White 2)'],
        ['Timer Ball', 'Victory Road', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Victory Road (Black 2 and White 2)'],
        ['Repeat Ball', 'Victory Road', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Victory Road (Black 2 and White 2)'],
        ['Luxury Ball', 'Victory Road', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Victory Road (Black 2 and White 2)'],
        ['Heal Ball', 'Virbank City', 'Poké Mart / Lower cashier', '300 dollars', '', 'Virbank City'],
        ['Net Ball', 'Virbank City', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Virbank City'],
        ['Greet Mail', 'Virbank City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Virbank City'],
        ['Favored Mail', 'Virbank City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Virbank City'],
        ['RSVP Mail', 'Virbank City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Virbank City'],
        ['Thanks Mail', 'Virbank City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Virbank City'],
        ['Inquiry Mail', 'Virbank City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Virbank City'],
        ['Like Mail', 'Virbank City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Virbank City'],
        ['Reply Mail', 'Virbank City', 'Poké Mart / Lower cashier', '50 dollars', '', 'Virbank City'],
    ],
    'sources': {
        'Abundant Shrine': '2026-10-24T15:20:29Z',
        'Abyssal Ruins': '2026-06-30T21:07:10Z',
        'Accumula Town': '2026-10-24T15:18:01Z',
        'Anville Town': '2026-10-24T15:23:00Z',
        'Aspertia City': '2026-10-24T15:21:21Z',
        'Battle Subway': '2026-10-08T19:47:28Z',
        'Black City': '2026-10-27T14:11:39Z',
        'Castelia City': '2026-10-24T15:21:30Z',
        'Castelia Sewers': '2026-08-09T18:07:06Z',
        'Chargestone Cave': '2026-10-24T22:24:28Z',
        'Clay Tunnel': '2026-06-20T07:11:44Z',
        'Dreamyard': '2026-10-24T15:22:46Z',
        'Driftveil City': '2026-10-24T15:19:16Z',
        'Driftveil Drawbridge': '2026-10-11T05:35:15Z',
        'Floccesy Town': '2026-10-24T15:23:18Z',
        'Giant Chasm': '2026-04-20T07:24:58Z',
        'Humilau City': '2026-10-24T15:22:54Z',
        'Icirrus City': '2026-10-24T15:22:32Z',
        'Lacunosa Town': '2026-10-27T14:08:23Z',
        'Lentimas Town': '2026-04-02T06:13:49Z',
        'Marine Tube': '2025-03-13T22:07:10Z',
        'Marvelous Bridge': '2026-05-28T14:46:36Z',
        'Mistralton Cave': '2026-04-02T06:02:12Z',
        'Mistralton City': '2026-10-24T15:23:29Z',
        "N's Castle": '2026-10-17T00:53:33Z',
        'Nature Preserve': '2026-10-24T15:23:12Z',
        'Nimbasa City': '2026-10-24T15:21:25Z',
        'Nuvema Town': '2026-10-24T15:19:32Z',
        'Opelucid City': '2026-10-24T15:21:09Z',
        'Pinwheel Forest': '2026-10-24T15:20:08Z',
        'Plasma Frigate': '2026-10-22T10:30:44Z',
        'Poké Mart': '2026-09-21T10:03:27Z',
        'Pokémon World Tournament': '2026-10-24T19:22:16Z',
        'Reversal Mountain': '2026-05-18T03:08:12Z',
        'Royal Unova': '2026-05-05T07:09:50Z',
        'Seaside Cave': '2026-06-20T07:10:57Z',
        'Shopping Mall Nine': '2026-10-24T15:23:05Z',
        'Striaton City': '2026-10-24T15:21:53Z',
        'Tubeline Bridge': '2026-10-08T11:40:41Z',
        'Twist Mountain': '2026-10-25T02:08:51Z',
        'Undella Town': '2026-10-27T14:04:28Z',
        'Unova Route 13': '2026-10-24T15:22:36Z',
        'Unova Route 22': '2026-10-24T15:20:50Z',
        'Unova Route 4': '2026-10-05T10:00:33Z',
        'Unova Route 5': '2026-08-24T16:38:06Z',
        'Unova Route 7': '2026-10-24T15:21:38Z',
        'Unova Route 8': '2026-10-24T15:21:42Z',
        'Victory Road (Black 2 and White 2)': '2026-10-24T15:19:02Z',
        'Village Bridge': '2026-10-24T15:20:19Z',
        'Virbank City': '2026-10-27T13:59:05Z',
        'Virbank Complex': '2026-10-24T15:22:10Z',
        'Wellspring Cave': '2026-10-04T13:44:39Z',
    },
}
STANDARD_MARTS = [['Accumula Town', 'Poké Mart / Upper cashier', 'Accumula Town'], ['Aspertia City', 'Poké Mart / Upper cashier', 'Aspertia City'], ['Black City', 'Poké Mart / Upper cashier', 'Black City'], ['Castelia City', 'Poké Mart / Upper cashier', 'Castelia City'], ['Driftveil City', 'Poké Mart / Upper cashier', 'Driftveil City'], ['Floccesy Town', 'Poké Mart / Upper cashier', 'Floccesy Town'], ['Humilau City', 'Poké Mart / Upper cashier', 'Humilau City'], ['Icirrus City', 'Poké Mart / Upper cashier', 'Icirrus City'], ['Lacunosa Town', 'Poké Mart / Upper cashier', 'Lacunosa Town'], ['Lentimas Town', 'Poké Mart / Upper cashier', 'Lentimas Town'], ['Mistralton City', 'Poké Mart / Upper cashier', 'Mistralton City'], ['Nimbasa City', 'Poké Mart / Upper cashier', 'Nimbasa City'], ['Opelucid City', 'Poké Mart / Upper cashier', 'Opelucid City'], ['Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', 'Poké Mart'], ['Striaton City', 'Poké Mart / Upper cashier', 'Striaton City'], ['Undella Town', 'Poké Mart / Upper cashier', 'Undella Town'], ['Victory Road', 'Poké Mart / Upper cashier', 'Victory Road (Black 2 and White 2)'], ['Virbank City', 'Poké Mart / Upper cashier', 'Virbank City']]
STANDARD_STOCK = [['Poké Ball', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '200 dollars', '', 'Poké Mart'], ['Great Ball', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '600 dollars', '1 Badge', 'Poké Mart'], ['Ultra Ball', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '1200 dollars', '5 Badges', 'Poké Mart'], ['Potion', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '300 dollars', '', 'Poké Mart'], ['Super Potion', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '700 dollars', '1 Badge', 'Poké Mart'], ['Hyper Potion', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '1200 dollars', '3 Badges', 'Poké Mart'], ['Max Potion', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '2500 dollars', '7 Badges', 'Poké Mart'], ['Full Restore', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '3000 dollars', '8 Badges', 'Poké Mart'], ['Revive', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '1500 dollars', '3 Badges', 'Poké Mart'], ['Antidote', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '100 dollars', '1 Badge', 'Poké Mart'], ['Paralyze Heal', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '200 dollars', '1 Badge', 'Poké Mart'], ['Awakening', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '250 dollars', '1 Badge', 'Poké Mart'], ['Burn Heal', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '250 dollars', '1 Badge', 'Poké Mart'], ['Ice Heal', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '250 dollars', '1 Badge', 'Poké Mart'], ['Full Heal', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '600 dollars', '5 Badges', 'Poké Mart'], ['Escape Rope', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '550 dollars', '2 Badges', 'Poké Mart'], ['Repel', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '350 dollars', '1 Badge', 'Poké Mart'], ['Super Repel', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '500 dollars', '3 Badges', 'Poké Mart'], ['Max Repel', 'Poké Mart', 'In the core series games / Generation V / Stock / Upper cashier', '700 dollars', '5 Badges', 'Poké Mart']]
VANILLA['shops'] += [[row[0], area, vendor, row[3], row[4], title]
                     for area, vendor, title in STANDARD_MARTS for row in STANDARD_STOCK]
VANILLA['placements'] += [
    ['Master Ball', 'Join Avenue', 'Daily raffle prize (random)', 'Join Avenue'],
    ['Rare Candy', 'Join Avenue', 'Daily raffle prize (random)', 'Join Avenue'],
    ['PP Max', 'Join Avenue', 'Daily raffle prize (random)', 'Join Avenue'],
    ['PP Up', 'Join Avenue', 'Daily raffle prize (random)', 'Join Avenue'],
    ['Max Revive', 'Join Avenue', 'Daily raffle prize (random)', 'Join Avenue'],
    ['Max Elixir', 'Join Avenue', 'Daily raffle prize (random)', 'Join Avenue'],
    ['Max Ether', 'Join Avenue', 'Daily raffle prize (random)', 'Join Avenue'],
    ['Ultra Ball', 'Join Avenue', 'Daily raffle prize (random)', 'Join Avenue'],
    ['Full Heal', 'Join Avenue', 'Daily raffle prize (random)', 'Join Avenue'],
    ['Berry Juice', 'Join Avenue', 'Daily raffle prize (random)', 'Join Avenue'],
    ['Poké Ball', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Great Ball', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Ultra Ball', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Potion', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Super Potion', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Hyper Potion', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Max Potion', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Full Restore', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Repel', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Super Repel', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Max Repel', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Fresh Water', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Soda Pop', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Lemonade', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Moomoo Milk III', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Dire Hit', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Guard Spec.', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Revive', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Heart Scale', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Pearl', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Pearl String', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Nugget', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['Big Nugget', 'Join Avenue', 'Visitor souvenir (random; depends on visitor)', 'Join Avenue'],
    ['HP Up', 'Black Tower', 'Area 1-3 boss reward rotation; ×1', 'Black Tower'],
    ['Protein', 'Black Tower', 'Area 1-3 boss reward rotation; ×1', 'Black Tower'],
    ['Iron', 'Black Tower', 'Area 1-3 boss reward rotation; ×1', 'Black Tower'],
    ['Calcium', 'Black Tower', 'Area 1-3 boss reward rotation; ×1', 'Black Tower'],
    ['Zinc', 'Black Tower', 'Area 1-3 boss reward rotation; ×1', 'Black Tower'],
    ['Carbos', 'Black Tower', 'Area 1-3 boss reward rotation; ×1', 'Black Tower'],
    ['HP Up', 'Black Tower', 'Area 4-5 boss reward rotation; ×2', 'Black Tower'],
    ['Protein', 'Black Tower', 'Area 4-5 boss reward rotation; ×2', 'Black Tower'],
    ['Iron', 'Black Tower', 'Area 4-5 boss reward rotation; ×2', 'Black Tower'],
    ['Calcium', 'Black Tower', 'Area 4-5 boss reward rotation; ×2', 'Black Tower'],
    ['Zinc', 'Black Tower', 'Area 4-5 boss reward rotation; ×2', 'Black Tower'],
    ['Carbos', 'Black Tower', 'Area 4-5 boss reward rotation; ×2', 'Black Tower'],
    ['Health Wing', 'Black Tower', 'Area 6-7 boss reward rotation; ×1', 'Black Tower'],
    ['Muscle Wing', 'Black Tower', 'Area 6-7 boss reward rotation; ×1', 'Black Tower'],
    ['Resist Wing', 'Black Tower', 'Area 6-7 boss reward rotation; ×1', 'Black Tower'],
    ['Genius Wing', 'Black Tower', 'Area 6-7 boss reward rotation; ×1', 'Black Tower'],
    ['Clever Wing', 'Black Tower', 'Area 6-7 boss reward rotation; ×1', 'Black Tower'],
    ['Swift Wing', 'Black Tower', 'Area 6-7 boss reward rotation; ×1', 'Black Tower'],
    ['Rare Candy', 'Black Tower', 'Area 6-7 boss reward rotation; ×1', 'Black Tower'],
    ['Health Wing', 'Black Tower', 'Area 8-9 boss reward rotation; ×2', 'Black Tower'],
    ['Muscle Wing', 'Black Tower', 'Area 8-9 boss reward rotation; ×2', 'Black Tower'],
    ['Resist Wing', 'Black Tower', 'Area 8-9 boss reward rotation; ×2', 'Black Tower'],
    ['Genius Wing', 'Black Tower', 'Area 8-9 boss reward rotation; ×2', 'Black Tower'],
    ['Clever Wing', 'Black Tower', 'Area 8-9 boss reward rotation; ×2', 'Black Tower'],
    ['Swift Wing', 'Black Tower', 'Area 8-9 boss reward rotation; ×2', 'Black Tower'],
    ['Rare Candy', 'Black Tower', 'Area 8-9 boss reward rotation; ×2', 'Black Tower'],
    ['Pomeg Berry', 'Black Tower', 'Area 10 boss reward rotation; ×1', 'Black Tower'],
    ['Kelpsy Berry', 'Black Tower', 'Area 10 boss reward rotation; ×1', 'Black Tower'],
    ['Qualot Berry', 'Black Tower', 'Area 10 boss reward rotation; ×1', 'Black Tower'],
    ['Hondew Berry', 'Black Tower', 'Area 10 boss reward rotation; ×1', 'Black Tower'],
    ['Grepa Berry', 'Black Tower', 'Area 10 boss reward rotation; ×1', 'Black Tower'],
    ['Tamato Berry', 'Black Tower', 'Area 10 boss reward rotation; ×1', 'Black Tower'],
    ['Rare Candy', 'Black Tower', 'Area 10 boss reward rotation; ×1', 'Black Tower'],
]
VANILLA['shops'] += [
    ['Poké Ball', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '200 dollars', '', 'Pokémon League (Unova)'],
    ['Great Ball', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '600 dollars', '', 'Pokémon League (Unova)'],
    ['Ultra Ball', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '1200 dollars', '', 'Pokémon League (Unova)'],
    ['Potion', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '300 dollars', '', 'Pokémon League (Unova)'],
    ['Super Potion', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '700 dollars', '', 'Pokémon League (Unova)'],
    ['Hyper Potion', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '1200 dollars', '', 'Pokémon League (Unova)'],
    ['Max Potion', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '2500 dollars', '', 'Pokémon League (Unova)'],
    ['Full Restore', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '3000 dollars', '', 'Pokémon League (Unova)'],
    ['Revive', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '1500 dollars', '', 'Pokémon League (Unova)'],
    ['Antidote', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '100 dollars', '', 'Pokémon League (Unova)'],
    ['Paralyze Heal', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '200 dollars', '', 'Pokémon League (Unova)'],
    ['Awakening', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '250 dollars', '', 'Pokémon League (Unova)'],
    ['Burn Heal', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '250 dollars', '', 'Pokémon League (Unova)'],
    ['Ice Heal', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '250 dollars', '', 'Pokémon League (Unova)'],
    ['Full Heal', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '600 dollars', '', 'Pokémon League (Unova)'],
    ['Escape Rope', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '550 dollars', '', 'Pokémon League (Unova)'],
    ['Repel', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '350 dollars', '', 'Pokémon League (Unova)'],
    ['Super Repel', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '500 dollars', '', 'Pokémon League (Unova)'],
    ['Max Repel', 'Pokémon League (Unova)', 'Poké Mart / Upper cashier', '700 dollars', '', 'Pokémon League (Unova)'],
    ['Heal Ball', 'Pokémon League (Unova)', 'Poké Mart / Lower cashier', '300 dollars', '', 'Pokémon League (Unova)'],
    ['Net Ball', 'Pokémon League (Unova)', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Pokémon League (Unova)'],
    ['Nest Ball', 'Pokémon League (Unova)', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Pokémon League (Unova)'],
    ['Quick Ball', 'Pokémon League (Unova)', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Pokémon League (Unova)'],
    ['Dusk Ball', 'Pokémon League (Unova)', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Pokémon League (Unova)'],
    ['Timer Ball', 'Pokémon League (Unova)', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Pokémon League (Unova)'],
    ['Repeat Ball', 'Pokémon League (Unova)', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Pokémon League (Unova)'],
    ['Luxury Ball', 'Pokémon League (Unova)', 'Poké Mart / Lower cashier', '1000 dollars', '', 'Pokémon League (Unova)'],
    ['Max Revive', 'Join Avenue', 'Market; shop rank 10; variants A/B/C/D', '5000 dollars', '', 'Join Avenue'],
    ['PP Up', 'Join Avenue', 'Market; shop rank 9+; variants A/B/C/D', '12500 dollars', '', 'Join Avenue'],
    ['Rage Candy Bar', 'Join Avenue', 'Market; shop rank 8+; ×2; variants A/B', '2000 dollars', '', 'Join Avenue'],
    ['Lava Cookie', 'Join Avenue', 'Market; shop rank 8+; ×2; variants C', '1000 dollars', '', 'Join Avenue'],
    ['Old Gateau', 'Join Avenue', 'Market; shop rank 8+; ×2; variants D', '1000 dollars', '', 'Join Avenue'],
    ['HP Up', 'Join Avenue', 'Market; shop rank 5+; ×12; variants A/C', '99960 dollars', '', 'Join Avenue'],
    ['Protein', 'Join Avenue', 'Market; shop rank 6+; ×12; variants A/C', '99960 dollars', '', 'Join Avenue'],
    ['Iron', 'Join Avenue', 'Market; shop rank 7+; ×12; variants A/C', '99960 dollars', '', 'Join Avenue'],
    ['Calcium', 'Join Avenue', 'Market; shop rank 6+; ×12; variants B/D', '99960 dollars', '', 'Join Avenue'],
    ['Zinc', 'Join Avenue', 'Market; shop rank 7+; ×12; variants B/D', '99960 dollars', '', 'Join Avenue'],
    ['Carbos', 'Join Avenue', 'Market; shop rank 5+; ×12; variants B/D', '99960 dollars', '', 'Join Avenue'],
    ['Ether', 'Join Avenue', 'Market; shop rank 4+; variants A/B/C/D', '1500 dollars', '', 'Join Avenue'],
    ['X Speed', 'Join Avenue', 'Market; shop rank 4+; ×12; variants A', '3150 dollars', '', 'Join Avenue'],
    ['X Accuracy', 'Join Avenue', 'Market; shop rank 4+; ×12; variants B', '8550 dollars', '', 'Join Avenue'],
    ['X Sp. Def', 'Join Avenue', 'Market; shop rank 4+; ×12; variants D', '3150 dollars', '', 'Join Avenue'],
    ['Guard Spec.', 'Join Avenue', 'Market; shop rank 3+; ×12; variants A', '6300 dollars', '', 'Join Avenue'],
    ['Dire Hit', 'Join Avenue', 'Market; shop rank 3+; ×12; variants B', '5850 dollars', '', 'Join Avenue'],
    ['X Attack', 'Join Avenue', 'Market; shop rank 3+; ×12; variants C', '4500 dollars', '', 'Join Avenue'],
    ['X Defense', 'Join Avenue', 'Market; shop rank 3+; ×12; variants D', '4950 dollars', '', 'Join Avenue'],
    ['Honey', 'Join Avenue', 'Market; shop rank 2+; ×12; variants A/B/C/D', '3600 dollars', '', 'Join Avenue'],
    ['Fresh Water', 'Join Avenue', 'Market; shop rank 4+; ×48; variants A/B/C/D', '9600 dollars', '', 'Join Avenue'],
    ['Fresh Water', 'Join Avenue', 'Market; shop rank 3; ×36; variants A/B/C/D', '7200 dollars', '', 'Join Avenue'],
    ['Fresh Water', 'Join Avenue', 'Market; shop rank 2; ×24; variants A/B/C/D', '4800 dollars', '', 'Join Avenue'],
    ['Fresh Water', 'Join Avenue', 'Market; shop rank 1; ×12; variants A/B/C/D', '2400 dollars', '', 'Join Avenue'],
    ['Moomoo Milk', 'Join Avenue', 'Market; shop rank 7+; ×48; variants A/B/C/D', '24000 dollars', '', 'Join Avenue'],
    ['Moomoo Milk', 'Join Avenue', 'Market; shop rank 5; ×36; variants A/B/C/D', '18000 dollars', '', 'Join Avenue'],
    ['Moomoo Milk', 'Join Avenue', 'Market; shop rank 3; ×24; variants A/B/C/D', '12000 dollars', '', 'Join Avenue'],
    ['Moomoo Milk', 'Join Avenue', 'Market; shop rank 1; ×12; variants A/B/C/D', '6000 dollars', '', 'Join Avenue'],
    ['Hyper Potion', 'Join Avenue', 'Market; shop rank 10; ×48; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '43200 dollars', '', 'Join Avenue'],
    ['Hyper Potion', 'Join Avenue', 'Market; shop rank 8; ×36; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '32400 dollars', '', 'Join Avenue'],
    ['Hyper Potion', 'Join Avenue', 'Market; shop rank 4; ×24; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '21600 dollars', '', 'Join Avenue'],
    ['Hyper Potion', 'Join Avenue', 'Market; shop rank 1; ×12; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '10800 dollars', '', 'Join Avenue'],
    ['Full Heal', 'Join Avenue', 'Market; shop rank 10; ×48; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '21600 dollars', '', 'Join Avenue'],
    ['Full Heal', 'Join Avenue', 'Market; shop rank 8; ×36; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '16200 dollars', '', 'Join Avenue'],
    ['Full Heal', 'Join Avenue', 'Market; shop rank 4; ×24; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '10800 dollars', '', 'Join Avenue'],
    ['Full Heal', 'Join Avenue', 'Market; shop rank 1; ×12; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '5400 dollars', '', 'Join Avenue'],
    ['Revive', 'Join Avenue', 'Market; shop rank 10; ×48; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '54000 dollars', '', 'Join Avenue'],
    ['Revive', 'Join Avenue', 'Market; shop rank 8; ×36; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '40500 dollars', '', 'Join Avenue'],
    ['Revive', 'Join Avenue', 'Market; shop rank 4; ×24; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '27000 dollars', '', 'Join Avenue'],
    ['Revive', 'Join Avenue', 'Market; shop rank 1; ×12; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '13500 dollars', '', 'Join Avenue'],
    ['Max Repel', 'Join Avenue', 'Market; shop rank 10; ×48; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '25200 dollars', '', 'Join Avenue'],
    ['Max Repel', 'Join Avenue', 'Market; shop rank 8; ×36; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '18900 dollars', '', 'Join Avenue'],
    ['Max Repel', 'Join Avenue', 'Market; shop rank 4; ×24; postgame, Avenue rank 15 and office visited; variants A/B/C/D', '12600 dollars', '', 'Join Avenue'],
    ['Max Repel', 'Join Avenue', 'Market; ×12; postgame, Avenue rank 15 and office visited; variants A/B/C', '6300 dollars', '', 'Join Avenue'],
    ['Pomeg Berry', 'Join Avenue', 'Flower Shop; shop rank 10; ×4; variants A/B', '3000 dollars', '', 'Join Avenue'],
    ['Kelpsy Berry', 'Join Avenue', 'Flower Shop; shop rank 10; ×4; variants A/B', '3000 dollars', '', 'Join Avenue'],
    ['Hondew Berry', 'Join Avenue', 'Flower Shop; shop rank 10; ×4; variants C/D', '3000 dollars', '', 'Join Avenue'],
    ['Grepa Berry', 'Join Avenue', 'Flower Shop; shop rank 10; ×4; variants C/D', '3000 dollars', '', 'Join Avenue'],
    ['Qualot Berry', 'Join Avenue', 'Flower Shop; shop rank 9+; ×4; variants A/B', '3000 dollars', '', 'Join Avenue'],
    ['Tamato Berry', 'Join Avenue', 'Flower Shop; shop rank 9+; ×4; variants C/D', '3000 dollars', '', 'Join Avenue'],
    ['Liechi Berry', 'Join Avenue', 'Flower Shop; shop rank 8+; ×4; variants A', '2000 dollars', '', 'Join Avenue'],
    ['Apicot Berry', 'Join Avenue', 'Flower Shop; shop rank 8+; ×4; variants A', '2000 dollars', '', 'Join Avenue'],
    ['Salac Berry', 'Join Avenue', 'Flower Shop; shop rank 8+; ×4; variants B', '2000 dollars', '', 'Join Avenue'],
    ['Rindo Berry', 'Join Avenue', 'Flower Shop; shop rank 8+; ×4; variants B', '2000 dollars', '', 'Join Avenue'],
    ['Ganlon Berry', 'Join Avenue', 'Flower Shop; shop rank 8+; ×4; variants C', '2000 dollars', '', 'Join Avenue'],
    ['Wacan Berry', 'Join Avenue', 'Flower Shop; shop rank 8+; ×4; variants C', '2000 dollars', '', 'Join Avenue'],
    ['Petaya Berry', 'Join Avenue', 'Flower Shop; shop rank 8+; ×4; variants D', '2000 dollars', '', 'Join Avenue'],
    ['Occa Berry', 'Join Avenue', 'Flower Shop; shop rank 8+; ×4; variants D', '2000 dollars', '', 'Join Avenue'],
    ['Passho Berry', 'Join Avenue', 'Flower Shop; shop rank 7+; ×4; variants A', '2000 dollars', '', 'Join Avenue'],
    ['Shuca Berry', 'Join Avenue', 'Flower Shop; shop rank 7+; ×4; variants B', '2000 dollars', '', 'Join Avenue'],
    ['Kebia Berry', 'Join Avenue', 'Flower Shop; shop rank 7+; ×4; variants C', '2000 dollars', '', 'Join Avenue'],
    ['Yache Berry', 'Join Avenue', 'Flower Shop; shop rank 7+; ×4; variants D', '2000 dollars', '', 'Join Avenue'],
    ['Chople Berry', 'Join Avenue', 'Flower Shop; shop rank 6+; ×4; variants A', '2000 dollars', '', 'Join Avenue'],
    ['Charti Berry', 'Join Avenue', 'Flower Shop; shop rank 6+; ×4; variants B', '2000 dollars', '', 'Join Avenue'],
    ['Tanga Berry', 'Join Avenue', 'Flower Shop; shop rank 6+; ×4; variants C', '2000 dollars', '', 'Join Avenue'],
    ['Coba Berry', 'Join Avenue', 'Flower Shop; shop rank 6+; ×4; variants D', '2000 dollars', '', 'Join Avenue'],
    ['Payapa Berry', 'Join Avenue', 'Flower Shop; shop rank 5+; ×4; variants A', '2000 dollars', '', 'Join Avenue'],
    ['Babiri Berry', 'Join Avenue', 'Flower Shop; shop rank 5+; ×4; variants B', '2000 dollars', '', 'Join Avenue'],
    ['Colbur Berry', 'Join Avenue', 'Flower Shop; shop rank 5+; ×4; variants C', '2000 dollars', '', 'Join Avenue'],
    ['Kasib Berry', 'Join Avenue', 'Flower Shop; shop rank 5+; ×4; variants D', '2000 dollars', '', 'Join Avenue'],
    ['Haban Berry', 'Join Avenue', 'Flower Shop; shop rank 4+; ×4; variants A', '2000 dollars', '', 'Join Avenue'],
    ['Chilan Berry', 'Join Avenue', 'Flower Shop; shop rank 4+; ×4; variants D', '2000 dollars', '', 'Join Avenue'],
    ['Leppa Berry', 'Join Avenue', 'Flower Shop; shop rank 4+; variants A/B/C/D', '1500 dollars', '', 'Join Avenue'],
    ['Bluk Berry', 'Join Avenue', 'Flower Shop; shop rank 4+; ×4; variants B', '600 dollars', '', 'Join Avenue'],
    ['Razz Berry III', 'Join Avenue', 'Flower Shop; shop rank 4+; ×4; variants C', '600 dollars', '', 'Join Avenue'],
    ['Lum Berry', 'Join Avenue', 'Flower Shop; shop rank 3+; ×4; variants A/B/C/D', '800 dollars', '', 'Join Avenue'],
    ['Sitrus Berry', 'Join Avenue', 'Flower Shop; shop rank 3+; ×4; variants A/B', '800 dollars', '', 'Join Avenue'],
    ['Persim Berry', 'Join Avenue', 'Flower Shop; shop rank 3+; ×4; variants C/D', '600 dollars', '', 'Join Avenue'],
    ['Aspear Berry', 'Join Avenue', 'Flower Shop; shop rank 2+; ×4; variants A/B', '600 dollars', '', 'Join Avenue'],
    ['Oran Berry', 'Join Avenue', 'Flower Shop; shop rank 2+; ×4; variants C/D', '600 dollars', '', 'Join Avenue'],
    ['Chesto Berry', 'Join Avenue', 'Flower Shop; shop rank 1+; ×4; variants A/B', '600 dollars', '', 'Join Avenue'],
    ['Pecha Berry', 'Join Avenue', 'Flower Shop; shop rank 1+; ×4; variants A/B', '600 dollars', '', 'Join Avenue'],
    ['Rawst Berry', 'Join Avenue', 'Flower Shop; shop rank 1+; ×4; variants C/D', '600 dollars', '', 'Join Avenue'],
    ['Cheri Berry', 'Join Avenue', 'Flower Shop; shop rank 1+; ×4; variants C/D', '600 dollars', '', 'Join Avenue'],
    ['Gooey Mulch', 'Join Avenue', 'Flower Shop; shop rank 6+; ×4; variants A', '1600 dollars', '', 'Join Avenue'],
    ['Damp Mulch', 'Join Avenue', 'Flower Shop; shop rank 6+; ×4; variants B', '1600 dollars', '', 'Join Avenue'],
    ['Growth Mulch', 'Join Avenue', 'Flower Shop; shop rank 6+; ×4; variants C', '1600 dollars', '', 'Join Avenue'],
    ['Stable Mulch', 'Join Avenue', 'Flower Shop; shop rank 6+; ×4; variants D', '1600 dollars', '', 'Join Avenue'],
    ['Gooey Mulch', 'Join Avenue', 'Flower Shop; shop rank 3; ×2; variants A', '800 dollars', '', 'Join Avenue'],
    ['Damp Mulch', 'Join Avenue', 'Flower Shop; shop rank 3; ×2; variants B', '800 dollars', '', 'Join Avenue'],
    ['Growth Mulch', 'Join Avenue', 'Flower Shop; shop rank 3; ×2; variants C', '800 dollars', '', 'Join Avenue'],
    ['Stable Mulch', 'Join Avenue', 'Flower Shop; shop rank 3; ×2; variants D', '800 dollars', '', 'Join Avenue'],
    ['Gooey Mulch', 'Join Avenue', 'Flower Shop; shop rank 1; variants A', '400 dollars', '', 'Join Avenue'],
    ['Damp Mulch', 'Join Avenue', 'Flower Shop; shop rank 1; variants B', '400 dollars', '', 'Join Avenue'],
    ['Growth Mulch', 'Join Avenue', 'Flower Shop; shop rank 1; variants C', '400 dollars', '', 'Join Avenue'],
    ['Stable Mulch', 'Join Avenue', 'Flower Shop', '400 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 9+; random appraisal, not a guaranteed purchase; contents vary by owner', '2000 dollars', '', 'Join Avenue'],
    ['Red Shard', 'Join Avenue', 'Antique Shop; shop rank 9+; random appraisal, not a guaranteed purchase; contents vary by owner', '2000 dollars', '', 'Join Avenue'],
    ['Green Shard', 'Join Avenue', 'Antique Shop; shop rank 9+; random appraisal, not a guaranteed purchase; contents vary by owner', '2000 dollars', '', 'Join Avenue'],
    ['Blue Shard', 'Join Avenue', 'Antique Shop; shop rank 9+; random appraisal, not a guaranteed purchase; contents vary by owner', '2000 dollars', '', 'Join Avenue'],
    ['Yellow Shard', 'Join Avenue', 'Antique Shop; shop rank 9+; random appraisal, not a guaranteed purchase; contents vary by owner', '2000 dollars', '', 'Join Avenue'],
    ['Great Ball', 'Join Avenue', 'Antique Shop; shop rank 9+; random appraisal, not a guaranteed purchase; contents vary by owner', '2000 dollars', '', 'Join Avenue'],
    ['Ultra Ball', 'Join Avenue', 'Antique Shop; shop rank 9+; random appraisal, not a guaranteed purchase; contents vary by owner', '2000 dollars', '', 'Join Avenue'],
    ['Nugget', 'Join Avenue', 'Antique Shop; shop rank 9+; random appraisal, not a guaranteed purchase; contents vary by owner', '2000 dollars', '', 'Join Avenue'],
    ['Big Nugget', 'Join Avenue', 'Antique Shop; shop rank 9+; random appraisal, not a guaranteed purchase; contents vary by owner', '2000 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 6+; random appraisal, not a guaranteed purchase; contents vary by owner', '1500 dollars', '', 'Join Avenue'],
    ['Red Shard', 'Join Avenue', 'Antique Shop; shop rank 6+; random appraisal, not a guaranteed purchase; contents vary by owner', '1500 dollars', '', 'Join Avenue'],
    ['Green Shard', 'Join Avenue', 'Antique Shop; shop rank 6+; random appraisal, not a guaranteed purchase; contents vary by owner', '1500 dollars', '', 'Join Avenue'],
    ['Blue Shard', 'Join Avenue', 'Antique Shop; shop rank 6+; random appraisal, not a guaranteed purchase; contents vary by owner', '1500 dollars', '', 'Join Avenue'],
    ['Yellow Shard', 'Join Avenue', 'Antique Shop; shop rank 6+; random appraisal, not a guaranteed purchase; contents vary by owner', '1500 dollars', '', 'Join Avenue'],
    ['Great Ball', 'Join Avenue', 'Antique Shop; shop rank 6+; random appraisal, not a guaranteed purchase; contents vary by owner', '1500 dollars', '', 'Join Avenue'],
    ['Ultra Ball', 'Join Avenue', 'Antique Shop; shop rank 6+; random appraisal, not a guaranteed purchase; contents vary by owner', '1500 dollars', '', 'Join Avenue'],
    ['Nugget', 'Join Avenue', 'Antique Shop; shop rank 6+; random appraisal, not a guaranteed purchase; contents vary by owner', '1500 dollars', '', 'Join Avenue'],
    ['Big Nugget', 'Join Avenue', 'Antique Shop; shop rank 6+; random appraisal, not a guaranteed purchase; contents vary by owner', '1500 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 3+; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Red Shard', 'Join Avenue', 'Antique Shop; shop rank 3+; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Green Shard', 'Join Avenue', 'Antique Shop; shop rank 3+; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Blue Shard', 'Join Avenue', 'Antique Shop; shop rank 3+; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Yellow Shard', 'Join Avenue', 'Antique Shop; shop rank 3+; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Great Ball', 'Join Avenue', 'Antique Shop; shop rank 3+; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Ultra Ball', 'Join Avenue', 'Antique Shop; shop rank 3+; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Nugget', 'Join Avenue', 'Antique Shop; shop rank 3+; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Big Nugget', 'Join Avenue', 'Antique Shop; shop rank 3+; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Red Shard', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Green Shard', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Blue Shard', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Yellow Shard', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Great Ball', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Ultra Ball', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Nugget', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Big Nugget', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Float Stone', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Everstone', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Rare Bone', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Helix Fossil', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Root Fossil', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Armor Fossil', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Old Amber', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Rock Gem', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Dome Fossil', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Claw Fossil', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Skull Fossil', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Cover Fossil', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Plume Fossil', 'Join Avenue', 'Antique Shop; shop rank 10; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '600 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Float Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Everstone', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Rare Bone', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Helix Fossil', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Root Fossil', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Armor Fossil', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Old Amber', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Rock Gem', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Dome Fossil', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Claw Fossil', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Skull Fossil', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Cover Fossil', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Plume Fossil', 'Join Avenue', 'Antique Shop; shop rank 8+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Float Stone', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Everstone', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Rare Bone', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Helix Fossil', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Root Fossil', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Armor Fossil', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Old Amber', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Rock Gem', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Dome Fossil', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Claw Fossil', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Skull Fossil', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Cover Fossil', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Plume Fossil', 'Join Avenue', 'Antique Shop; shop rank 7+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Float Stone', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Everstone', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Rare Bone', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Helix Fossil', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Root Fossil', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Armor Fossil', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Old Amber', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Rock Gem', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Dome Fossil', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Claw Fossil', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Skull Fossil', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Cover Fossil', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Plume Fossil', 'Join Avenue', 'Antique Shop; shop rank 3+; postgame, Avenue rank 15 and office visited; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Tiny Mushroom', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Big Mushroom', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Heart Scale', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Big Pearl', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Sacred Ash', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Magmarizer', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Protector', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Reaper Cloth', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ["King's Rock", 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Deep Sea Scale', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Deep Sea Tooth', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Electirizer', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Prism Scale', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Dubious Disc', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Metal Coat', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Dragon Scale', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '750 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Tiny Mushroom', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Big Mushroom', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Heart Scale', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Big Pearl', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Sacred Ash', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Magmarizer', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Protector', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Reaper Cloth', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ["King's Rock", 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Deep Sea Scale', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Deep Sea Tooth', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Electirizer', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Prism Scale', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Dubious Disc', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Metal Coat', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Dragon Scale', 'Join Avenue', 'Antique Shop; shop rank 7+; random appraisal, not a guaranteed purchase; contents vary by owner', '650 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Tiny Mushroom', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Big Mushroom', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Heart Scale', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Big Pearl', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Sacred Ash', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Magmarizer', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Protector', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Reaper Cloth', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ["King's Rock", 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Deep Sea Scale', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Deep Sea Tooth', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Electirizer', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Prism Scale', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Dubious Disc', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Metal Coat', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Dragon Scale', 'Join Avenue', 'Antique Shop; shop rank 4+; random appraisal, not a guaranteed purchase; contents vary by owner', '450 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Tiny Mushroom', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Big Mushroom', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Heart Scale', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Big Pearl', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Sacred Ash', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Magmarizer', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Protector', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Reaper Cloth', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ["King's Rock", 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Deep Sea Scale', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Deep Sea Tooth', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Electirizer', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Prism Scale', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Dubious Disc', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Metal Coat', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Dragon Scale', 'Join Avenue', 'Antique Shop; shop rank 1+; random appraisal, not a guaranteed purchase; contents vary by owner', '350 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Float Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Everstone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Water Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Thunder Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Moon Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Dusk Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Dawn Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Fire Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Leaf Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Sun Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Shiny Stone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Odd Keystone', 'Join Avenue', 'Antique Shop; shop rank 10; random appraisal, not a guaranteed purchase; contents vary by owner', '500 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Float Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Everstone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Water Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Thunder Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Moon Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Dusk Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Dawn Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Fire Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Leaf Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Sun Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Shiny Stone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Odd Keystone', 'Join Avenue', 'Antique Shop; shop rank 8+; random appraisal, not a guaranteed purchase; contents vary by owner', '400 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Float Stone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Everstone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Water Stone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Thunder Stone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Moon Stone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Dusk Stone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Dawn Stone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Fire Stone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Leaf Stone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Sun Stone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Shiny Stone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Odd Keystone', 'Join Avenue', 'Antique Shop; shop rank 5+; random appraisal, not a guaranteed purchase; contents vary by owner', '300 dollars', '', 'Join Avenue'],
    ['Hard Stone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Float Stone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Everstone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Water Stone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Thunder Stone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Moon Stone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Dusk Stone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Dawn Stone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Fire Stone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Leaf Stone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Sun Stone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Shiny Stone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
    ['Odd Keystone', 'Join Avenue', 'Antique Shop; random appraisal, not a guaranteed purchase; contents vary by owner', '200 dollars', '', 'Join Avenue'],
]
VANILLA['sources'].update({'Pokémon League (Unova)': '2026-09-17T00:41:33Z', 'Join Avenue': '2026-08-06T05:28:40Z', 'Black Tower': '2026-10-26T15:15:29Z', 'Pickup (Ability)': '2026-08-31T18:11:12Z'})
PICKUP = [
    ['1-10', ['Potion', 'Antidote', 'Super Potion', 'Great Ball', 'Repel', 'Escape Rope', 'Full Heal', 'Hyper Potion', 'Ultra Ball', 'Hyper Potion', 'Nugget']],
    ['11-20', ['Antidote', 'Super Potion', 'Great Ball', 'Repel', 'Escape Rope', 'Full Heal', 'Hyper Potion', 'Ultra Ball', 'Revive', 'Nugget', "King's Rock"]],
    ['21-30', ['Super Potion', 'Great Ball', 'Repel', 'Escape Rope', 'Full Heal', 'Hyper Potion', 'Ultra Ball', 'Revive', 'Rare Candy', "King's Rock", 'Full Restore']],
    ['31-40', ['Great Ball', 'Repel', 'Escape Rope', 'Full Heal', 'Hyper Potion', 'Ultra Ball', 'Revive', 'Rare Candy', 'Sun Stone', 'Full Restore', 'Ether']],
    ['41-50', ['Repel', 'Escape Rope', 'Full Heal', 'Hyper Potion', 'Ultra Ball', 'Revive', 'Rare Candy', 'Sun Stone', 'Moon Stone', 'Ether', 'Iron Ball']],
    ['51-60', ['Escape Rope', 'Full Heal', 'Hyper Potion', 'Ultra Ball', 'Revive', 'Rare Candy', 'Sun Stone', 'Moon Stone', 'Heart Scale', 'Iron Ball', 'Prism Scale']],
    ['61-70', ['Full Heal', 'Hyper Potion', 'Ultra Ball', 'Revive', 'Rare Candy', 'Sun Stone', 'Moon Stone', 'Heart Scale', 'Full Restore', 'Prism Scale', 'Elixir']],
    ['71-80', ['Hyper Potion', 'Ultra Ball', 'Revive', 'Rare Candy', 'Sun Stone', 'Moon Stone', 'Heart Scale', 'Full Restore', 'Max Revive', 'Elixir', 'Prism Scale']],
    ['81-90', ['Ultra Ball', 'Revive', 'Rare Candy', 'Sun Stone', 'Moon Stone', 'Heart Scale', 'Full Restore', 'Max Revive', 'PP Up', 'Prism Scale', 'Leftovers']],
    ['91-100', ['Revive', 'Rare Candy', 'Sun Stone', 'Moon Stone', 'Heart Scale', 'Full Restore', 'Max Revive', 'PP Up', 'Max Elixir', 'Leftovers', 'Prism Scale']],
]
VANILLA['placements'] += [
    ['Relic Gold', 'Abyssal Ruins', '* Northwest quadrant * Northeast quadrant * Along the east wall (×3)', 'Abyssal Ruins'],
    ['Relic Silver', 'Abyssal Ruins', '* Northeast quadrant * Southwest quadrant (×2)', 'Abyssal Ruins'],
    ['Relic Copper', 'Abyssal Ruins', '* Southwest quadrant * Near the entrance from 1F (×2)', 'Abyssal Ruins'],
    ['Relic Vase', 'Abyssal Ruins', 'Northwest corner', 'Abyssal Ruins'],
    ['Relic Silver', 'Abyssal Ruins', 'South side', 'Abyssal Ruins'],
    ['Relic Statue', 'Abyssal Ruins', 'Northwest corner', 'Abyssal Ruins'],
    ['Relic Vase', 'Abyssal Ruins', '* Northeast corner * Along the west wall (×2)', 'Abyssal Ruins'],
    ['Relic Band', 'Abyssal Ruins', "* Northeast quadrant * Southeast quadrant * In the room's center (×3)", 'Abyssal Ruins'],
    ['Full Restore', 'Anville Town', 'In exchange for twenty Poké Balls (on weekends)', 'Anville Town'],
    ['Rare Candy', 'Anville Town', 'From a Rail Staff in the house at the southeast of the town', 'Anville Town'],
    ['PP Up', 'Battle Subway', 'From an Artist on any Super Train platform after 21 consecutive victories', 'Battle Subway'],
    ['Rare Candy', 'Nimbasa City', '*Held by traded Meowth *Held by traded Mankey *Held by traded Rhyhorn *Held by traded Snorlax', 'Nimbasa City'],
    ['Plasma Card', 'Plasma Frigate', 'B1F, from the Team Plasma Grunt with three Pawniard after defeating her', 'Plasma Frigate'],
    ['Rawst Berry', 'Reversal Mountain', 'From a Pokémon Ranger Eliza after defeating her', 'Reversal Mountain'],
    ['Red Shard', 'Reversal Mountain', 'Phenomenon', 'Reversal Mountain'],
    ['Blue Shard', 'Reversal Mountain', 'Phenomenon', 'Reversal Mountain'],
    ['Yellow Shard', 'Reversal Mountain', 'Phenomenon', 'Reversal Mountain'],
    ['Green Shard', 'Reversal Mountain', 'Phenomenon', 'Reversal Mountain'],
]
ITEM_LOCATIONS = []


def area_key(area):
    area = ITEM_AREA_ALIASES.get(area, area)
    area = re.sub(r' (?:Gym|Pokémon Center)$', '', area)
    return drayano.key(ITEM_AREA_ALIASES.get(area, area))


def mirror_items():
    rows = []
    for path in sorted((Path(H.src) / 'romhackdex' / 'items').glob('*/index.html')):
        text = path.read_text(encoding='utf-8')
        name = re.search(r'<h1[^>]*>(.*?)</h1>', text, re.S)[1]
        place = re.search(r'Where to Find.*?<p[^>]*>(.*?)</p>', text, re.S)[1]
        rows.append((html.unescape(name).strip(), html.unescape(place).strip()))
    return rows


def textual_key(value):
    value = re.sub(r'^New:\s*|\(Hidden\)|\(s\)|\*|\s+x\d+', '', value, flags=re.I).strip().rstrip('.')
    value = re.sub(r'^TM\d+\s*', '', value)
    return drayano.key('Bicycle' if value == 'Bike' else value)


def choices(record):
    value = re.sub(r'^New:\s*', '', record['item'])
    if value.startswith('Choice between '):
        return [re.sub(r'^a |^an ', '', part.strip()) for part in re.split(r',\s*| or ', value[15:])]
    if 'Fossil and ' in value:
        return value.split(' and ')
    return [value]


def category(name):
    if re.match(r'[TH]M\d', name):
        return 'TMs and HMs'
    if name in EVOLUTION:
        return 'Evolution Items'
    if 'Fossil' in name or name == 'Old Amber':
        return 'Fossils'
    if name in KEY_ITEMS:
        return 'Key Items'
    if name in LOWER_BERRIES:
        return 'Stats and Abilities'
    if re.search(r'^(?:HP Up|Protein|Iron|Calcium|Zinc|Carbos|Rare Candy|PP Up|PP Max|.* Wing|Power (?:Weight|Bracer|Belt|Lens|Band|Anklet))$', name):
        return 'Stats and Abilities'
    if re.search(r'Ball$|Potion$|Heal$|Repel$|Mail|Shard$|Mushroom$|Mulch$|Pearl|Nugget|Relic |^X |^(?:Ether|Elixir|Max Ether|Max Elixir|Revive|Max Revive|Full Restore|Antidote|Awakening|Escape Rope|Honey|Heart Scale|Sacred Ash|Berry Juice|Fresh Water|Soda Pop|Lemonade|Moomoo Milk|Rage Candy Bar|Casteliacone|Lava Cookie|Old Gateau|Poké Doll|Poké Toy|Fluffy Tail|Rare Bone|Stardust|Star Piece|Comet Shard|Shoal Salt|Shoal Shell|Guard Spec\.|Dire Hit|Energy Root|Energy Powder|Heal Powder|Revival Herb|Sweet Heart|Balm Mushroom)$', name):
        return 'Valuables'
    return 'Held Items'


def subsection(name):
    box = category(name)
    if box == 'Stats and Abilities':
        if name in LOWER_BERRIES:
            return 'Lower stats (berries)'
        if name in ('HP Up', 'Protein', 'Iron', 'Calcium', 'Zinc', 'Carbos'):
            return 'Raise stats (vitamins)'
        if name.endswith(' Wing'):
            return 'Raise stats (wings)'
        if name.startswith('Power '):
            return 'Power items (EVs while held)'
        return 'Levels and PP'
    if box == 'Held Items':
        if name.endswith(' Berry'):
            return 'Berries'
        if name.endswith(' Gem'):
            return 'Gems'
        if name.endswith(' Drive'):
            return 'Memories and Drives'
        if name.endswith(' Plate') or name in INCENSE or name in ('Charcoal', 'Miracle Seed', 'Mystic Water', 'Magnet',
                'Never-Melt Ice', 'Black Belt', 'Poison Barb', 'Soft Sand', 'Sharp Beak', 'Twisted Spoon',
                'Silver Powder', 'Hard Stone', 'Spell Tag', 'Dragon Fang', 'Black Glasses', 'Silk Scarf'):
            return 'Type boosters'
        return None
    return box


def shop_kind(name):
    if name in EVOLUTION or name == 'Everstone':
        return 'Evolution items'
    if re.match(r'TM\d', name):
        return 'TMs'
    if name.endswith('Ball'):
        return 'Poké Balls'
    if name.startswith('Power '):
        return 'Power items'
    if category(name) == 'Stats and Abilities':
        return 'Stats and abilities'
    if category(name) == 'Held Items':
        return 'Held items'
    if category(name) == 'Valuables' and not re.search(r'Mail|Shard|Scale|Honey', name):
        return 'Healing and repels'
    return 'Other'


def canonical_names(mirror):
    names = ITEM_NAMES + [row[0] for row in VANILLA['placements'] + VANILLA['shops'] if not re.match(r'[TH]M\d', row[0])]
    names += [name for name, area in mirror if not re.search(r'\*|\s{2,}|mode only|sells|Modified|TM #|Choice between|New:', name)]
    names += EVOLUTION + INCENSE + sorted(KEY_ITEMS) + list(ALIASES.values())
    names += ['Dream Ball', 'Binding Band', 'Float Stone', 'Ice Stone', 'Link Cable', 'Old Sea Map', 'Soul Dew',
              'Pomeg Berry', 'Kelpsy Berry', 'Qualot Berry', 'Hondew Berry', 'Grepa Berry', 'Tamato Berry',
              'Figy Berry', 'Wiki Berry', 'Mago Berry', 'Aguav Berry', 'Iapapa Berry', 'Honey']
    return drayano.Names('item', list(dict.fromkeys(ALIASES.get(name, name) for name in names)), aliases=ALIASES)


def resolve(raw, names, moves, tms, where):
    machine = re.match(r'^([TH]M)(\d{2})[, ]+(.+)$', raw)
    if machine:
        number = int(machine[2])
        move = tms[number]['move'] if machine[1] == 'TM' else machine[3]
        move = moves(move, where)
        if not move:
            raise ValueError('unresolved machine move: ' + raw)
        return machine[1] + machine[2] + ' ' + move
    value = names(raw, where)
    if not value:
        raise ValueError('unresolved item %r at %s' % (raw, where))
    return value


def crosscheck(parsed, mirror):
    dp = {(textual_key(row['raw']), drayano.key(row['area'])): (row['raw'], row['area'])
          for row in parsed['placements'] if row['item']}
    dp.update({(textual_key(row['move']), drayano.key(row['area'])): (row['move'], row['area']) for row in parsed['tms']})
    mp = {(textual_key(name), drayano.key(area)): (name, area) for name, area in mirror}
    counts = collections.Counter()
    details = []
    for side, records, other in [('doc-only', dp, mp), ('mirror-only', mp, dp)]:
        for pair in sorted(records.keys() - other.keys()):
            name, area = records[pair]
            if re.search(r'\s{2,}', name) and side == 'mirror-only':
                kind = 'real conflict: fused TM row mislocated at Humilau'
            elif re.search(r'mode only|sells:|Modified|TM #', name):
                kind = 'real conflict: non-item heading/footnote'
            elif any(pair[0] == other_pair[0] and area_key(area) == area_key(place)
                     for other_pair, (other_name, place) in other.items()):
                kind = 'granularity/area naming'
            elif any(word in name for word in ('Fossil', 'Choice between', 'Dubious', 'Tanga')):
                kind = 'naming/choice expansion'
            else:
                kind = 'coverage: mirror omits doc machine/placement'
            counts[side + ' / ' + kind] += 1
            details.append('  items cross-check %s [%s]: %s @ %s' % (side, kind, name, area))
    report('items cross-check: doc %d, mirror %d, agree %d, doc-only %d, mirror-only %d' %
           (len(dp), len(mp), len(dp.keys() & mp.keys()), len(dp.keys() - mp.keys()), len(mp.keys() - dp.keys())))
    for key, count in sorted(counts.items()):
        report('items cross-check classification:', key, count)
    for detail in details:
        report(detail)


def collect(data):
    parsed = drayano.items(doc('Item Changes'), 'bb2r')
    mirror = mirror_items()
    names = canonical_names(mirror)
    moves = drayano.Names('move', data['M'])
    tms = {row['number']: row for row in parsed['tms']}
    records, covered = [], set()
    def add(raw, area, note, source, line=0, hidden=False, quantity=1, mode=None):
        name = resolve(raw, names, moves, tms, '%s:%s' % (source, line))
        link = data['M'].index(name.split(' ', 1)[1]) if re.match(r'[TH]M\d', name) else None
        records.append(dict(item=name, area=area, note=note, source=source, line=line, hidden=hidden,
                            quantity=quantity, mode=mode, available=mode != 'Easy/Normal', box=category(name), link=link))
        covered.add((drayano.key(name), area_key(area)))
    for row in parsed['placements']:
        if row['old']:
            old = drayano.item_destination(row['old'])
            covered.add((drayano.key(ALIASES.get(old['item'], old['item'])), area_key(row['area'])))
        if not row['item']:
            continue
        for raw in choices(row):
            note = 'Hidden' if row['hidden'] else ''
            if row['quantity'] > 1:
                note += ('; ' if note else '') + '×%d' % row['quantity']
            if row['mode']:
                note += ('; ' if note else '') + ('Easy/Normal only — unavailable in Challenge' if row['mode'] == 'Easy/Normal' else 'Challenge only')
            if row['item'].startswith('Choice between'):
                note += ('; ' if note else '') + row['item'] + ' (choose one)'
            add(raw, row['area'], note, 'Item Changes', row['line'], row['hidden'], row['quantity'], row['mode'])
    for row in parsed['tms']:
        add('TM%02d %s' % (row['number'], row['move']), row['area'],
            'TM table; changed location' if row['changed'] else 'TM table', 'Item Changes', row['line'])
    trade_area = None
    for line, text in enumerate(doc('Trade Changes').lines):
        location = re.match(r'Location: (.+?)\.', text)
        if location:
            trade_area = location[1]
        if 'Talk to the Rough-Neck living in Humilau City' in text:
            trade_area = 'Humilau City'
        held = re.search(r'(\w+) is holding (?:a |an )?(.+?)\.', text)
        if held:
            add(held[2], trade_area, 'Held by the %s in-game trade' % held[1], 'Trade Changes', line)
    for line, text in enumerate(doc('Gift Pokemon').lines):
        if 'The Pokémon always holds an Oran berry.' in text:
            add('Oran Berry', 'Aspertia City', 'Held by the chosen starter', 'Gift Pokemon', line)
    for name, area in mirror:
        if re.search(r'\*|\s{2,}|mode only|sells|Modified|TM #|Choice between|New:', name):
            continue
        canonical = names(name, 'RomHackDex')
        if not canonical:
            continue
        if (drayano.key(canonical), area_key(area)) not in covered:
            add(canonical, area, 'Vanilla gap fill', 'RomHackDex')
    doc_hms = {row['item'].split(' ', 1)[0] for row in records if row['item'].startswith('HM')}
    primary_covered = set(covered)
    seen_vanilla = set()
    for raw, area, note, title in VANILLA['placements']:
        if not raw or raw in DROP_KEYS or raw.startswith('TM') or raw.split(' ', 1)[0] in doc_hms:
            continue
        if raw.startswith('Dropped Item-'):
            raw = 'Dropped Item'
        replacement = {'Oval Stone': 'Link Cable', 'Red Scarf': 'Ice Stone'}
        if raw in replacement:
            note += '; replaces vanilla ' + raw + ' [Item Changes item replacement]'
            raw = replacement[raw]
        canonical = resolve(raw, names, moves, tms, 'Bulbapedia ' + title)
        if (drayano.key(canonical), area_key(area)) in primary_covered:
            continue
        if re.search(r'wild Pokémon|wild .*hold', note, re.I):
            continue
        if area in ('Route 4', 'Route 7', 'Humilau City') and re.search(r'held by|traded', note, re.I):
            continue
        if area == 'Castelia City' and 'Harlequin/Clerk' in note:
            note += '; ' + POSTGAME_VENDOR
        identity = (canonical, area, note, title)
        if identity in seen_vanilla:
            continue
        seen_vanilla.add(identity)
        quantity = re.search(r'×(\d+)', note)
        add(raw, area, note, 'Bulbapedia: ' + title, hidden='hidden' in note.lower(),
            quantity=int(quantity[1]) if quantity else 1)
    crosscheck(parsed, mirror)
    return parsed, records, names, moves, tms


def item_locations(data):
    """Walkthrough API: source-marked location records; doc area labels are deliberately preserved."""
    return ITEM_LOCATIONS if ITEM_LOCATIONS else collect(data)[1]


def build(data):
    parsed, records, names, moves, tms = collect(data)
    ITEM_LOCATIONS[:] = records
    boxes = collections.OrderedDict()
    grouped = collections.OrderedDict()
    for row in records:
        grouped.setdefault(row['item'], []).append(row)
    for name, places in grouped.items():
        box = category(name)
        parts = ['Found: %s%s [%s%s]' % (row['area'], ' — ' + row['note'] if row['note'] else '', row['source'],
                                       ':%d' % row['line'] if row['line'] else '') for row in places]
        if name in {names(row['item']) for row in parsed['uses']}:
            parts.append('Also: has a Use option for evolution [Item Changes]')
        boxes.setdefault(box, []).append([name, '\n'.join(dict.fromkeys(parts)), places[0]['link'], 0, subsection(name)])
    shops = build_shops(parsed, names, moves, tms)
    boxes['Shops'] = [[name, text, None, 0, shop_kind(name)] for name, text in shops]
    for row in parsed['pickup']:
        name = names(row['item'], 'Pickup:%d' % row['line'])
        box = category(name)
        target = next((entry for entry in boxes.setdefault(box, []) if entry[0] == name), None)
        note = 'Also: Pickup — replaces every %s slot; original level/probability bands unchanged [Item Changes:%d]' % (row['old'], row['line'])
        if target:
            target[1] += '\n' + note
        else:
            boxes[box].append([name, note, None, 0, subsection(name)])
    for name, bands in pickup_table(parsed).items():
        name = names(name, 'Pickup vanilla table')
        box = category(name)
        target = next((entry for entry in boxes.setdefault(box, []) if entry[0] == name), None)
        note = 'Also: Pickup (10% after a win); on a successful pickup: ' + '; '.join('Lv %s: %d%%' % band for band in bands)
        note += ' [Bulbapedia: Pickup (Ability); Item Changes substitutions applied]'
        if target:
            target[1] += '\n' + note
        else:
            boxes[box].append([name, note, None, 0, subsection(name)])
    data['IT'] = [dict(n=box, k='tm' if box == 'TMs and HMs' else 'gen', note=EVLESS if box in ('Held Items', 'Stats and Abilities') else '', r=rows)
                  for box, rows in boxes.items()]
    report('items: %d placement names, %d placements (%d Item Changes, %d trade/gift docs, %d RomHackDex, %d Bulbapedia), %d TMs, %d HMs, 6 modified marts, %d shop offers' %
           (len(grouped), len(records), sum(row['source'] == 'Item Changes' for row in records),
            sum(row['source'] in ('Trade Changes', 'Gift Pokemon') for row in records),
            sum(row['source'] == 'RomHackDex' for row in records), sum(row['source'].startswith('Bulbapedia') for row in records),
            len(tms), sum(name.startswith('HM') for name in grouped), len(shops)))
    report('items: 652 nonempty doc statements in 69 areas; 3 deletions; 8 mode-qualified statements; 4 Pickup substitutions')
    report('items: complete vanilla Pickup table, 10 level bands with probabilities; four doc substitutions applied')
    for line in names.lines(formats=True) + moves.lines(formats=True):
        report(line)


def build_shops(parsed, names, moves, tms):
    offers = []
    for raw, area, vendor, price, note, title in VANILLA['shops']:
        if area in ('Virbank City', 'Castelia City', 'Driftveil City', 'Humilau City') and 'Lower cashier' in vendor:
            continue
        if area == 'Driftveil City' and 'Incenses' in vendor:
            continue
        if area == 'Poké Mart':
            continue
        if raw in ('Oval Stone', 'Red Scarf'):
            note += '; replaces vanilla ' + raw + ' [Item Changes]'
            raw = {'Oval Stone': 'Link Cable', 'Red Scarf': 'Ice Stone'}[raw]
        if re.fullmatch(r'TM\d{2}', raw):
            raw += ' ' + tms[int(raw[2:])]['move']
        name = resolve(raw, names, moves, tms, 'Bulbapedia shop ' + title)
        override = next((row['price'] for row in parsed['prices'] if names(row['item']) == name), None)
        if override is not None:
            price = '$%d [Item Changes price]' % override
        if area in ('Battle Subway', 'Pokémon World Tournament'):
            note = '; '.join(value for value in (note, POSTGAME_VENDOR) if value)
        if area == 'Black City' and 'Store ' in vendor:
            store = int(vendor.rsplit('Store ', 1)[1])
            weekday = name in ('Thunder Stone', 'Fire Stone', 'Dusk Stone', 'Dawn Stone')
            note = 'Black Tower Area %d cleared; %s' % ([2, 5, 8, 10][store - 1], 'weekdays' if weekday else 'weekends')
        text = '%s — %s; %s%s [Bulbapedia: %s]' % (area, vendor, price, '; ' + note if note else '', title)
        offers.append((name, text))
    stock = {
        'Virbank City': ['Luxury Ball', 'Net Ball', 'Aspear Berry', 'Oran Berry', 'Rawst Berry'],
        'Castelia City': ['Pomeg Berry', 'Kelpsy Berry', 'Qualot Berry', 'Hondew Berry', 'Grepa Berry', 'Tamato Berry', 'Pecha Berry', 'Chesto Berry'],
        'Driftveil City': ['Red Shard', 'Blue Shard', 'Yellow Shard', 'Green Shard', 'Heart Scale', 'Honey', 'Figy Berry', 'Wiki Berry', 'Mago Berry', 'Aguav Berry', 'Iapapa Berry'],
        'Driftveil Market': STONES,
        'Route 9 Shopping Mall': INCENSE + EVOLUTION + ['White Herb', 'Mental Herb', 'Power Herb', 'PP Up', 'PP Max', 'Everstone', 'Eviolite', 'TM15 Hyper Beam', 'TM68 Giga Impact'],
        'Humilau City': ['Sitrus Berry', 'Persim Berry'],
    }
    prices = {names(row['item']): row['price'] for row in parsed['prices']}
    for mart in parsed['marts']:
        area = mart['area']
        for raw in stock[area]:
            name = resolve(raw, names, moves, tms, 'Mart:%d' % mart['line'])
            text = area + (' — Plasma Grunt' if area == 'Driftveil Market' else ' — modified stock')
            if name in prices:
                text += '; $%d' % prices[name]
            if name == 'TM68 Giga Impact' and area == 'Route 9 Shopping Mall':
                text += '; doc mart prose prints TM66, but its 95-TM table identifies Giga Impact as TM68'
            text += ' [Item Changes:%d]' % mart['line']
            offers.append((name, text))
    return list(dict.fromkeys(offers))


def pickup_table(parsed):
    """Item -> [(level band, percent of successful pickups)], with doc replacements and duplicate slots summed."""
    replacements = {row['old']: row['item'] for row in parsed['pickup']}
    result = collections.OrderedDict()
    for level, pool in PICKUP:
        counts = collections.Counter()
        for name, weight in zip(pool, [30, 10, 10, 10, 10, 10, 10, 4, 4, 1, 1]):
            counts[replacements.get(name, name)] += weight
        for name, weight in counts.items():
            result.setdefault(name, []).append((level, weight))
    return result
