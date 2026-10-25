"""Preserve documented trainer field conditions for a future UI, never infer them from teams.

python -I tools/trainer_fields.py [hack ...] [--write]
Rebuilds call annotate() before schema ordering. No runtime consumer applies these records yet.
"""
import argparse
import copy
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import datajson

ROOT = Path(__file__).resolve().parent.parent
CANDIDATE = re.compile(
    r'\bpermanent\b|\bOW\b|\bweather\b|\bterrain\b|\bthunderstorm\b|'
    r'\btailwind\b|\btrick\s*room\b|\bcrit chance\b|\bGlacia (?:Sun|Snow)\b', re.I)


def evidence(text, scope):
    """Keep the complete note/tag; normalise only explicit statements, not strategy labels."""
    if not CANDIDATE.search(text):
        return None
    effects = []

    def add(kind, value, **details):
        effects.append(dict(kind=kind, value=value, **details))

    weather = re.search(r'\bPermanent(?: OW)? (Rain|Sun|Snow|Sandstorm|Fog)\b', text, re.I)
    if weather:
        add('weather', weather[1].title(), duration='permanent')
    if re.search(r'\bPermanent OW Thunderstorm:\s*Rain and Electric Terrain\b', text, re.I):
        add('weather', 'Rain', duration='permanent')
        add('terrain', 'Electric', duration='permanent')
    if re.search(r'\bPermanent(?: OW)? Misty Terrain\b', text, re.I):
        add('terrain', 'Misty', duration='permanent')
    if re.search(r'\bPermanent(?: OW)? Trick Room\b', text, re.I):
        add('room', 'Trick Room', duration='permanent')
    if re.search(r'\bPermanent Tailwind on enemy side\b', text, re.I):
        add('side-condition', 'Tailwind', side='opponent', duration='permanent')
    if re.search(r'\bRandom Terrain at battle start\b', text, re.I):
        add('terrain', 'random', timing='battle-start')
    if re.search(r'After the first Pokémon is sent out, 1x layer of Spikes and 1x layer of '
                 r'Toxic Spikes are scattered on your side', text, re.I):
        for hazard in ('Spikes', 'Toxic Spikes'):
            add('hazard', hazard, side='player', layers=1, timing='after-first-send-out')
    if re.search(r'\+1 crit chance\b', text, re.I):
        add('critical-bonus', 1)
    incomplete = any(effect['kind'] == 'critical-bonus' or effect['value'] == 'random' for effect in effects)
    return dict(scope=scope, text=text, effects=effects, review=not effects or incomplete)


def records(group, section, trainer):
    """Resolve section/group evidence onto each card while retaining its original scope."""
    result = []
    for scope, texts in [('group-note', group.get('note', [])),
                         ('section-note', section.get('note', [])),
                         ('trainer-note', trainer.get('note', [])),
                         ('trainer-tag', trainer.get('tags', []))]:
        for text in texts:
            record = evidence(text, scope)
            if record and record not in result:
                result.append(record)
    return result


def annotate(data):
    """Replace only derived field records, keeping keys, teams and visible notes unchanged."""
    for group in data['TR']['g']:
        for section in group['sec']:
            for trainer in section['tr']:
                field = records(group, section, trainer)
                if field:
                    trainer['field'] = field
                else:
                    trainer.pop('field', None)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('hacks', nargs='*')
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    names = args.hacks or sorted(path.parent.name for path in (ROOT / 'hacks').glob('*/data.json'))
    for hack in names:
        path = ROOT / 'hacks' / hack / 'data.json'
        data, original = datajson.load(path)
        expected = copy.deepcopy(data)
        annotate(expected)
        if args.write:
            import schema
            schema.standardise(expected)
            datajson.save(path, expected, original)
        else:
            assert data == expected, f'{hack}: stale trainer field metadata; rebuild or use --write'
        trainers = [trainer for group in expected['TR']['g'] for section in group['sec']
                    for trainer in section['tr']]
        fields = [record for trainer in trainers for record in trainer.get('field', [])]
        print(f'{hack}: {sum(bool(trainer.get("field")) for trainer in trainers)} trainers, '
              f'{len(fields)} evidence records, {sum(record["review"] for record in fields)} need review')


if __name__ == '__main__':
    main()
