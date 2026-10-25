"""Hand-checked Totem Battles.pdf tables; text extraction shifts labels between rows.

Rows: species key, level, ability, item, nature, HP/Atk/Def/SpA/SpD/Spe EVs, moves.
These wild/SOS encounters have no matching entries in trainers-rebalanced.json.
"""
from common import report


BATTLES = [
    ('Gumshoos', [0, 1, 0, 0, 0], [
        ('gumshoos', 16, 'Adaptability', 'Sitrus Berry', 'Adamant', [200, 100, 100, 0, 100, 0],
         'Super Fang/Bite/Tackle/Scary Face'),
        ('yungoos', 13, 'Stakeout', 'Oran Berry', 'Timid', [0, 0, 0, 0, 0, 0],
         'Leer/Tackle/Pursuit/Super Fang')]),
    ('Raticate', [0, 1, 0, 0, 0], [
        ('raticate-alola', 16, 'Gluttony', 'Chople Berry', 'Adamant', [200, 100, 100, 0, 100, 0],
         'Super Fang/Assurance/Fury Swipes/Scary Face'),
        ('rattata-alola', 13, 'Hustle', 'Oran Berry', 'Timid', [0, 0, 0, 0, 0, 0],
         'Quick Attack/Tail Whip')]),
    ('Araquanid', [0, 0, 0, 0, 2], [
        ('araquanid', 28, 'Water Bubble', 'Wacan Berry', 'Quiet', [0, 0, 252, 252, 0, 0],
         'Bubble Beam/Leech Life/Giga Drain/Aurora Beam'),
        ('goldeen', 26, 'Lightning Rod', '', 'Modest', [252, 0, 0, 252, 0, 0],
         'Mud Shot/Water Pulse/Rain Dance/Mud Sport'),
        ('masquerain', 25, 'Intimidate', '', 'Timid', [252, 0, 252, 0, 0, 0],
         'Air Cutter/Icy Wind/Bubble Beam/Mist')]),
    ('Marowak', [1, 1, 1, 1, 1], [
        ('marowak-alola', 37, 'Cursed Body', 'Thick Club', 'Adamant', [252, 0, 106, 0, 152, 0],
         'Shadow Bone/Fire Punch/Brick Break/Detect'),
        ('salazzle', 35, 'Corrosion', 'Petaya Berry', 'Naive', [0, 0, 0, 0, 0, 0],
         'Toxic/Venoshock/Flame Burst/Torment')]),
    ('Lurantis', [1, 1, 1, 1, 1], [
        ('lurantis', 44, 'Leaf Guard', 'Power Herb', 'Naive', [252, 152, 0, 100, 0, 0],
         'Solar Blade/Weather Ball/Protect/Synthesis'),
        ('kecleon', 41, 'Protean', 'Heat Rock', 'Adamant', [252, 252, 0, 0, 0, 0],
         'Sunny Day/Rock Slide/Fire Punch/Psych Up'),
        ('ninetales', 41, 'Drought', 'Heat Rock', 'Timid', [252, 0, 0, 0, 0, 252],
         'Flamethrower/Psych Up/Disable/Will-O-Wisp')]),
    ('Nihilego', [0, 0, 3, 0, 0], [
        ('nihilego', 58, 'Beast Boost', 'Babiri Berry', 'Timid', [80, 0, 0, 176, 0, 252],
         'Power Gem/Sludge Wave/Thunderbolt/Psychic')]),
    ('Togedemaru', [2, 2, 2, 2, 2], [
        ('togedemaru', 59, 'Lightning Rod', 'Sitrus Berry', 'Impish', [252, 0, 252, 0, 0, 0],
         'Zing Zap/Spiky Shield/Iron Head/Bounce'),
        ('rotom', 57, 'Levitate', 'Light Clay', 'Modest', [252, 0, 0, 252, 0, 0],
         'Discharge/Hydro Pump/Will-O-Wisp/Light Screen'),
        ('skarmory', 57, 'Sturdy', 'Rocky Helmet', 'Impish', [252, 0, 252, 0, 0, 0],
         'Stealth Rock/Drill Peck/Tailwind/Torment')]),
    ('Mimikyu', [2, 2, 2, 2, 2], [
        ('mimikyu', 66, 'Disguise', 'Lum Berry', 'Impish', [198, 0, 124, 0, 104, 0],
         'Shadow Claw/Play Rough/Drain Punch/Bulk Up'),
        ('jellicent', 65, 'Cursed Body', '', 'Modest', [252, 0, 0, 252, 0, 0],
         'Scald/Ice Beam/Spite/Night Shade'),
        ('chandelure', 64, 'Flash Fire', 'Sitrus Berry', 'Modest', [252, 0, 0, 252, 0, 0],
         'Flamethrower/Will-O-Wisp/Clear Smog/Curse')]),
    ('Kommo-o', [2, 2, 2, 2, 2], [
        ('kommo-o', 92, 'Soundproof', 'Roseli Berry', 'Adamant', [252, 100, 0, 0, 152, 0],
         'Drain Punch/Dragon Claw/Stone Edge/Poison Jab'),
        ('dragonite', 91, 'Multiscale', '', 'Jolly', [252, 0, 0, 0, 0, 252],
         'Wing Attack/Extreme Speed/Safeguard/Mist'),
        ('metagross', 91, 'Clear Body', 'Light Clay', 'Careful', [252, 0, 0, 0, 252, 0],
         'Meteor Mash/Pursuit/Bullet Punch/Light Screen')]),
    ('Ultra Necrozma', [2, 2, 2, 2, 2], [
        ('ultra-necrozma', 100, 'Neuroforce', 'Lum Berry', 'Modest', [248, 0, 0, 252, 8, 0],
         'Photon Geyser/Flash Cannon/Earth Power/Dragon Pulse'),
        ('naganadel', 91, 'Beast Boost', '', 'Timid', [0, 0, 0, 252, 0, 252],
         'Sludge Bomb/Flamethrower/Thunderbolt/Helping Hand')]),
    ('Ribombee', [3, 3, 3, 3, 3], [
        ('ribombee', 95, 'Shield Dust', 'Occa Berry', 'Bold', [252, 0, 152, 0, 104, 0],
         'Pollen Puff/Draining Kiss/Psychic/Quiver Dance'),
        ('pelipper', 95, 'Drizzle', 'Damp Rock', 'Modest', [252, 0, 0, 252, 0, 0],
         'Hurricane/Scald/Roost/Soak'),
        ('blissey', 93, 'Healer', 'Light Clay', 'Bold', [0, 0, 252, 0, 252, 0],
         'Heal Pulse/Light Screen/Helping Hand/Flamethrower')]),
    ('Gumshoos (Rematch)', [3, 3, 3, 3, 3], [
        ('gumshoos', 100, 'Strong Jaw', 'Chople Berry', 'Impish', [252, 0, 252, 0, 0, 0],
         'Hyper Fang/Ice Fang/Crunch/Protect'),
        ('noivern', 98, 'Infiltrator', 'Focus Sash', 'Timid', [252, 0, 0, 0, 0, 252],
         'Tailwind/Hurricane/Screech/Super Fang'),
        ('excadrill', 98, 'Mold Breaker', 'Scope Lens', 'Jolly', [252, 0, 0, 0, 0, 252],
         'Drill Run/Iron Head/Rock Slide/Mud-Slap')]),
    ('Raticate (Rematch)', [3, 3, 3, 3, 3], [
        ('raticate-alola', 100, 'Thick Fat', 'Chople Berry', 'Impish', [252, 0, 252, 0, 0, 0],
         'Hyper Fang/Assurance/Double Team/Protect'),
        ('noivern', 98, 'Infiltrator', 'Focus Sash', 'Timid', [252, 0, 0, 0, 0, 252],
         'Tailwind/Hurricane/Screech/Super Fang'),
        ('excadrill', 98, 'Mold Breaker', 'Scope Lens', 'Jolly', [252, 0, 0, 0, 0, 252],
         'Drill Run/Iron Head/Rock Slide/Mud-Slap')]),
]
