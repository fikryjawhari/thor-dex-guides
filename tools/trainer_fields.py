"""Preserve documented trainer field conditions for a future UI, never infer them from teams.

python -I tools/trainer_fields.py [hack ...] [--write]
Rebuilds call annotate() before schema ordering. The damage calc applies these records as area conditions,
see template/README.md → Damage calculator. Team-variant labels (`label: true`) carry no effect and are not shown.
Doubles fights (one `gameType: 'Doubles'` record per trainer, source = the first matching tag or "partner") come from
DOUBLES_TAGS (tag wording, one entry per pattern; a new hack adds its own) and the trainer's partners (`pt`), never from
the teams. Back2Back and Rotation battles are singles, so no pattern matches them.
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
# Doubles tag wording per hack: EI "Double Battle", "True Double Battle"; Hardlove "Double, Optional", "2on2 Double";
# Photonic "Multi Battle"; Eternal X "Triple Battle" (the calc has no triples: Doubles is the nearest). Not doubles:
# Hardlove "Back2Back …", Eternal X "Rotation Battle".
DOUBLES_TAGS = [re.compile(pattern) for pattern in (r'^(True )?Double', r'^2on2 Double', r'^Multi Battle', r'^Triple Battle', r'^Tag Battle')]

UNBOUND_FIELD_DECISIONS = dict(fog='apply', flying_tailwind='apply', magnet_rise='apply',
                              weight_room='apply', heavy_rain='apply', vicious_sand='apply',
                              camomons='apply', inverse='apply', shadowy_veil='apply',
                              negative_energy='apply', pixies='apply', rainbow='apply',
                              sky='text', dynamax='text', rain='apply', butterfree='text')
UNBOUND_FIELD_PROPOSALS = {
    'fog': dict(prefix="There's a constant FOG weather effect", effects=[dict(kind='weather', value='Fog')]),
    'flying_tailwind': dict(prefix='Permanent Tailwind for Flying-types on the field', effects=[
        dict(kind='typed-side-condition', value='Tailwind', types=['Flying'], side='both', duration='permanent')]),
    'magnet_rise': dict(prefix='Permanent Magnet Rise for Electric- and Steel-types on the field', effects=[
        dict(kind='typed-side-condition', value='Magnet Rise', types=['Electric', 'Steel'], side='both', duration='permanent')]),
    'weight_room': dict(prefix='Trick Room for Weight', effects=[dict(kind='speed-rule', value='Weight', side='both')]),
    'heavy_rain': dict(prefix='Permanent Heavy Rain', effects=[dict(kind='weather', value='Heavy Rain', duration='permanent', locked=True)]),
    'vicious_sand': dict(prefix='Vicious Sandstorm:', effects=[dict(kind='weather', value='Vicious Sandstorm', duration='permanent', locked=True)]),
    'camomons': dict(prefix='Camomons Battle', effects=[dict(kind='typing', value='Camomons', side='both')]),
    'inverse': dict(prefix='Inverse Battle', effects=[dict(kind='battle-rule', value='Inverse', side='both')]),
    'shadowy_veil': dict(prefix='Shadowy Veil', effects=[dict(kind='field-rule', value='Shadowy Veil', side='both')]),
    'negative_energy': dict(prefix='A negative energy fills the battlefield', effects=[dict(kind='field-rule', value='Negative Energy', side='both')]),
    'pixies': dict(prefix='Pixies:', effects=[dict(kind='field-rule', value='Pixies', side='both')]),
    'rainbow': dict(prefix='Rainbow Battle:', effects=[dict(kind='field-rule', value='Rainbow Battle', side='both')]),
    'sky': dict(prefix='Sky Battle', effects=[]),
    'dynamax': dict(prefix='Dynamax Battle', effects=[]),
    'rain': dict(prefix='Rain', exact=True, effects=[dict(kind='weather', value='Rain')]),
    'butterfree': dict(prefix='Benjamin Butterfree metagame', effects=[]),
}


def unbound_proposal(text):
    return next((key for key, proposal in UNBOUND_FIELD_PROPOSALS.items()
                 if (text == proposal['prefix'] if proposal.get('exact')
                     else text.startswith(proposal['prefix']))), None)


def evidence(text, scope):
    """Keep the complete note/tag; normalise only explicit statements, not strategy labels."""
    proposal = unbound_proposal(text)
    if proposal:
        decision = UNBOUND_FIELD_DECISIONS[proposal]
        if decision not in (None, 'apply', 'text'):
            raise ValueError(f'Invalid Unbound field decision: {proposal}={decision!r}')
        suggested = UNBOUND_FIELD_PROPOSALS[proposal]
        return dict(scope=scope, text=text, effects=copy.deepcopy(suggested['effects']) if decision == 'apply' else [],
                    review=decision is None)
    if not CANDIDATE.search(text):
        return None
    if re.fullmatch(r'(?:Sydney|Sidney|Glacia) (?:Tailwind|TrickRoom|Sun|Snow)\.?', text.strip(), re.I):
        # Team-variant label (the teams show it), not a condition: no effect, nothing to review.
        return dict(scope=scope, text=text, effects=[], review=False, label=True)
    if re.fullmatch(r'Weather Trainers and Lance', text.strip()) or text.startswith('Weather gauntlet:'):
        # BB2R (settled 2026-10-29): the weather comes from each team's abilities (Snow Warning, Drought, ...), not the
        # field; the gauntlet / healing note is text only.
        return dict(scope=scope, text=text, effects=[], review=False)
    effects = []

    def add(kind, value, **details):
        effects.append(dict(kind=kind, value=value, **details))

    weather = re.search(r'\bPermanent(?: OW)? (Rain|Sun|Snow|Sandstorm|Fog)\b', text, re.I)
    if weather:
        add('weather', weather[1].title(), duration='permanent')
    if re.search(r'\bPermanent Sand\b', text, re.I):
        add('weather', 'Sandstorm', duration='permanent')
    if re.fullmatch(r'Trick Room\.?', text.strip(), re.I):
        add('room', 'Trick Room')
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
        add('critical-bonus', 1, side='opponent', guess=True)
    # Settled with the user (Hardlove notes.md → Damage calc): the crit bonus is a labelled guess, random terrain is text only.
    return dict(scope=scope, text=text, effects=effects, review=not effects)


def doubles(trainer):
    """One Doubles record when a tag matches DOUBLES_TAGS or the trainer has partners; the tag is the source."""
    tag = next((text for text in trainer.get('tags', []) if any(p.search(text) for p in DOUBLES_TAGS)), None)
    if tag is None and not trainer.get('pt'):
        return None
    source = tag or 'partner'
    effect = dict(kind='gameType', value='Doubles', source=source)
    return dict(scope='trainer-tag' if tag else 'trainer-partner', text=source, effects=[effect], review=False)


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
    battle = doubles(trainer)
    if battle:
        result.append(battle)
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
