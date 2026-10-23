"""Shared display names for trainer and walkthrough splits."""
import re


def split_name(name, cap=None):
    name = name.strip()
    match = re.fullmatch(r'(.*?)\s*\[(?:Level )?Cap (\d+)\]', name)
    if match:
        name, previous_cap = match.groups()
        if cap is None:
            cap = int(previous_cap)
    name = re.sub(r'^Split \d+:\s*', '', name)
    name = re.sub(r'\s+Split$', '', name)
    if name in ('Champion', 'Elite Four & Champion', 'Elite Four and Champion', 'The Pokémon League'):
        name = 'Elite Four'
    if name.lower().startswith('post-game'):
        return 'Post-game' + name[len('Post-game'):]
    return f'{name} Split [Cap {cap}]' if cap is not None else name
