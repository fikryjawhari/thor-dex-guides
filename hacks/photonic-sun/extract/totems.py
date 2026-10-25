"""Hand-checked Totem Battles.pdf tables; text extraction shifts labels between rows.

Rows: species key, level, ability, item, nature, HP/Atk/Def/SpA/SpD/Spe EVs, moves.
These wild/SOS encounters have no matching entries in trainers-rebalanced.json.
"""
from common import report, slug


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
        ('wash-rotom', 57, 'Levitate', 'Light Clay', 'Modest', [252, 0, 0, 252, 0, 0],
         'Discharge/Hydro Pump/Will-O-Wisp/Light Screen'),
        ('skarmory', 57, 'Sturdy', 'Rocky Helmet', 'Impish', [252, 0, 252, 0, 0, 0],
         'Stealth Rock/Drill Peck/Tailwind/Torment')]),
    ('Mimikyu', [2, 2, 2, 2, 2], [
        ('mimikyu-disguised', 66, 'Disguise', 'Lum Berry', 'Impish', [198, 0, 124, 0, 104, 0],
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


def add(data, groups, targets, stops, caps):
    for name, aura, rows in BATTLES:
        rematch = name.endswith('(Rematch)')
        moon = name.startswith('Raticate')
        boss = 'Totem ' + name if name not in ('Nihilego', 'Ultra Necrozma') else name
        if rematch:
            target = len(caps) + 1
            part, anchor, place = 34, "Hau'oli City", 'Verdant Cavern'
            heading = 'Verdant Cavern (Rematch)'
        else:
            cap_name = 'Totem Gumshoos' if moon else boss
            target = next(index for index, cap in enumerate(caps) if cap['n'] == cap_name)
            anchor = place = caps[target]['w']
            part = stops[caps[target]['at']][0]
            heading = 'Aether Paradise (first visit)' if name == 'Nihilego' else place
        group = groups[target]
        section = next((section for section in group['sec'] if section['h'] == heading), None)
        if section is None:
            section = {'h': heading, 'note': [], 'tr': []}
            if not rematch:
                section['cap'] = [caps[target]['l'], caps[target]['n'], anchor, 0]
            if rematch:
                position = next(index for index, section in enumerate(group['sec'])
                                if section['h'] == "Hau'oli City") + 1
                group['sec'].insert(position, section)
            else:
                group['sec'].append(section)
        team = []
        for species, level, ability, item, nature, evs, moves in rows:
            assert species in data['_byid'], (name, species)
            team.append({'id': species, 'l': level, 'a': data['_ABI'][ability], 'i': item,
                         'na': nature, 'iv': [31] * 6, 'ev': list(evs),
                         'm': [data['M'].index(move) for move in moves.split('/')], 'src': 's'})
        if aura is not None:
            team[0]['au'] = list(aura)
        note = ['IVs not in the doc: 31 assumed']
        if len(team) > 1:
            note.append('The first PokÃ©mon is the Totem; the others are its SOS allies, not a sequential team.')
        if name == 'Togedemaru':
            note.append('Doc says Rotom; Hydro Pump identifies Wash Rotom.')
        if name == 'Ultra Necrozma':
            note.append('Doc says level 100; the chosen progression cap is 95.')
        if rematch:
            note.append("After Ilima's post-game battle, take his Normalium Z to the pedestal in Verdant Cavern.")
        tags = ['Totem']
        if moon:
            tags.append('Prismatic Moon')
        elif name.startswith('Gumshoos'):
            tags.append('Photonic Sun')
        key = 'totem-' + slug(name)
        trainer = {'k': key, 'n': boss, 'loc': place, 'tags': tags, 'st': '',
                   'cap': group['cap'], 'note': note, 'p': team}
        existing = next((trainer for candidate in groups for section in candidate['sec']
                         for trainer in section['tr'] if trainer['n'] == boss), None)
        if existing is not None:
            raise ValueError(f'Totem already exists; enrich instead of duplicating: {boss}')
        section['tr'].append(trainer)
        targets[key] = target
        stop = next(stop for stop in stops if stop[:2] == [part, anchor])
        stop[2].append(key)
    report('totem battles:', len(BATTLES), 'mons:', sum(len(rows) for _, _, rows in BATTLES),
           '(doc sets; 31 IV assumed; allies in foe roster)')
