"""Regression checks for data-only trainer field preparation (no browser or raw inputs needed)."""
import copy
import json
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import schema
import trainer_fields


def source_check(root):
    """Verify every relevant comment in Hardlove's active trainer tabs survives as evidence."""
    from openpyxl import load_workbook

    data = json.loads((root / 'hacks/hardlove-gold/data.json').read_text(encoding='utf-8'))
    normalise = lambda text: re.sub(r'\s+', ' ', text).strip()
    texts = {normalise(record['text']) for group in data['TR']['g'] for section in group['sec']
             for trainer in section['tr'] for record in trainer.get('field', [])}
    tabs = ['Falkner Split', 'Bugsy Split', 'Whitney Split', 'Morty Split', 'Chuck Split',
            'Jasmine Split', 'Pryce Split', 'Clair Split', 'Victory Road', 'Elite Four', 'Mini Bosses']
    workbook = load_workbook(root / 'hacks/hardlove-gold/.src/Trainer Battles.xlsx')
    count = 0
    for tab in tabs:
        for row in workbook[tab]:
            for cell in row:
                if cell.comment and trainer_fields.CANDIDATE.search(cell.comment.text):
                    assert normalise(cell.comment.text) in texts, (tab, cell.coordinate, cell.comment.text)
                    count += 1
    workbook.close()
    print(f'PASS Hardlove source coverage: {count} field comments retained as evidence')


DOUBLES_EXPECTED = {'emerald-imperium': 14, 'hardlove-gold': 92, 'photonic-sun': 60, 'eternal-x': 62, 'unbound': 36}
DOUBLES_PARTNER_ONLY = {'eternal-x': 12, 'unbound': 2}


def doubles_check(root):
    """Doubles evidence per guide (2026-10-28 counts): tags and partners only; Back2Back / Rotation without a Double tag stay singles."""
    assert trainer_fields.doubles({'tags': ['Double Battle']}) == dict(
        scope='trainer-tag', text='Double Battle', effects=[dict(kind='gameType', value='Doubles', source='Double Battle')],
        review=False)
    assert trainer_fields.doubles({'tags': ['True Double Battle']})['text'] == 'True Double Battle'
    assert trainer_fields.doubles({'tags': ['Double, Optional']})['text'] == 'Double, Optional'
    assert trainer_fields.doubles({'tags': ['2on2 Double Battle']})['text'] == '2on2 Double Battle'
    assert trainer_fields.doubles({'tags': ['Multi Battle']})['text'] == 'Multi Battle'
    assert trainer_fields.doubles({'tags': ['Triple Battle']})['text'] == 'Triple Battle'
    partner = trainer_fields.doubles({'tags': ['Optional'], 'pt': [dict(n='Hau')]})
    assert partner['text'] == 'partner' and partner['scope'] == 'trainer-partner' and partner['review'] is False
    assert trainer_fields.doubles({'tags': ['Back2Back with Executive Proton']}) is None
    assert trainer_fields.doubles({'tags': ['Rotation Battle']}) is None
    assert trainer_fields.doubles({'tags': ['Single Battle']}) is None
    for hack, expected in DOUBLES_EXPECTED.items():
        data = json.loads((root / 'hacks' / hack / 'data.json').read_text(encoding='utf-8'))
        trainers = [trainer for group in data['TR']['g'] for section in group['sec'] for trainer in section['tr']]
        doubles_records = lambda trainer: [record for record in trainer.get('field', [])
                                           if any(effect['kind'] == 'gameType' for effect in record['effects'])]
        battles = [trainer for trainer in trainers if doubles_records(trainer)]
        partners = [trainer for trainer in battles if all(record['scope'] == 'trainer-partner'
                                                          for record in doubles_records(trainer))]
        assert len(battles) == expected, (hack, len(battles), expected)
        assert len(partners) == DOUBLES_PARTNER_ONLY.get(hack, 0), (hack, len(partners))
        for trainer in trainers:
            tags = trainer.get('tags', [])
            tagged = any(pattern.search(tag) for tag in tags for pattern in trainer_fields.DOUBLES_TAGS)
            # Back2Back / Rotation are singles unless a Double tag or partner says otherwise (Hardlove keeps 3 such trainers).
            if any(tag.startswith(('Back2Back', 'Rotation')) for tag in tags):
                assert (trainer in battles) == (tagged or bool(trainer.get('pt'))), (hack, trainer['n'])
            if any(tag.startswith('Rotation') for tag in tags):
                assert trainer not in battles, (hack, trainer['n'])
        print(f'  {hack}: {len(battles)} doubles trainers ({len(partners)} partner-only)')
    print('PASS doubles evidence: tags, partners, Back2Back / Rotation exclusions and per-guide counts')


def main():
    root = Path(__file__).resolve().parent.parent
    doubles_check(root)
    unbound = json.loads((root / 'hacks/unbound/data.json').read_text(encoding='utf-8'))
    pending = [record for group in unbound['TR']['g'] for section in group['sec']
               for trainer in section['tr'] for record in trainer.get('field', [])
               if trainer_fields.unbound_proposal(record['text'])]
    counts = {key: sum(trainer_fields.unbound_proposal(record['text']) == key for record in pending)
              for key in trainer_fields.UNBOUND_FIELD_PROPOSALS}
    assert counts == dict(fog=2, flying_tailwind=2, magnet_rise=2, weight_room=2, heavy_rain=2, vicious_sand=1,
                          camomons=2, inverse=2, shadowy_veil=2, negative_energy=3, pixies=1, rainbow=1,
                          sky=1, dynamax=1, rain=1, butterfree=2), counts
    for record in pending:
        assert record == trainer_fields.evidence(record['text'], record['scope'])
    decisions = trainer_fields.UNBOUND_FIELD_DECISIONS.copy()
    try:
        for key, proposal in trainer_fields.UNBOUND_FIELD_PROPOSALS.items():
            trainer_fields.UNBOUND_FIELD_DECISIONS[key] = 'text'
            result = trainer_fields.evidence(proposal['prefix'], 'trainer-note')
            assert result['effects'] == [] and result['review'] is False
            trainer_fields.UNBOUND_FIELD_DECISIONS[key] = 'apply'
            result = trainer_fields.evidence(proposal['prefix'], 'trainer-note')
            assert result['effects'] == proposal['effects'] and result['review'] is False
    finally:
        trainer_fields.UNBOUND_FIELD_DECISIONS.update(decisions)
    print(f'PASS Unbound: {len(pending)} source field records, {sum(record["review"] for record in pending)} awaiting user decisions')
    assert not any(record['review'] for group in unbound['TR']['g'] for section in group['sec']
                   for trainer in section['tr'] for record in trainer.get('field', []))
    thunder =trainer_fields.evidence('Permanent OW Thunderstorm: Rain and Electric Terrain', 'trainer-note')
    assert [(effect['kind'], effect['value']) for effect in thunder['effects']] == [
        ('weather', 'Rain'), ('terrain', 'Electric')]
    assert all(effect['duration'] == 'permanent' for effect in thunder['effects'])
    assert trainer_fields.evidence('Permanent OW Fog.', 'trainer-note')['effects'][0]['value'] == 'Fog'
    tailwind = trainer_fields.evidence('Permanent Tailwind on enemy side.', 'section-note')
    assert tailwind['effects'][0]['side'] == 'opponent'
    random = trainer_fields.evidence('Random Terrain at battle start.', 'trainer-note')
    assert random['effects'] == [dict(kind='terrain', value='random', timing='battle-start')]
    hazards = trainer_fields.evidence('Custom weather effect: After the first Pokémon is sent out, '
                                     '1x layer of Spikes and 1x layer of Toxic Spikes are scattered '
                                     'on your side.', 'section-note')
    assert len(hazards['effects']) == 2
    assert all(effect['side'] == 'player' and effect['layers'] == 1 for effect in hazards['effects'])
    critical = trainer_fields.evidence('+1 crit chance.', 'trainer-note')['effects'][0]
    assert critical == dict(kind='critical-bonus', value=1, side='opponent', guess=True)
    assert trainer_fields.evidence('+1 crit chance.', 'trainer-note')['review'] is False
    sand = trainer_fields.evidence('Permanent Sand', 'trainer-tag')
    assert sand['effects'] == [dict(kind='weather', value='Sandstorm', duration='permanent')]
    assert sand['review'] is False
    room = trainer_fields.evidence('Trick Room', 'trainer-tag')
    assert room['effects'] == [dict(kind='room', value='Trick Room')] and room['review'] is False
    for text in ['Sydney Tailwind', 'Sydney TrickRoom', 'Sidney Tailwind', 'Glacia Sun', 'Glacia Snow']:
        record = trainer_fields.evidence(text, 'trainer-tag')
        assert record['effects'] == [] and record['review'] is False and record['label'] is True, text
    record = trainer_fields.evidence('Unknown weather effect', 'trainer-tag')
    assert record['review'] and record['effects'] == []
    for text in ['Rain Dance', 'Drizzle', 'Snow Warning', 'Guards Scizorite.', 'Team 1']:
        assert trainer_fields.evidence(text, 'trainer-note') is None
    sample = dict(TR=dict(g=[dict(note=['Permanent OW Rain'], sec=[dict(note=[], tr=[
        dict(k='test', n='Test', p=[dict(a='Drizzle')], note=[], tags=[])])])]))
    trainer_fields.annotate(sample)
    assert sample['TR']['g'][0]['sec'][0]['tr'][0]['field'][0]['scope'] == 'group-note'
    sample['TR']['g'][0]['note'] = []
    trainer_fields.annotate(sample)
    assert 'field' not in sample['TR']['g'][0]['sec'][0]['tr'][0]
    for path in (root / 'hacks').glob('*/data.json'):
        data = json.loads(path.read_text(encoding='utf-8'))
        expected = copy.deepcopy(data)
        trainer_fields.annotate(expected)
        assert data == expected, path
        schema.standardise(expected)
        assert data == expected, f'{path}: schema changed data'
        trainer_fields.annotate(expected)
        assert data == expected, f'{path}: annotation not idempotent'
        for group in data['TR']['g']:
            for section in group['sec']:
                for trainer in section['tr']:
                    for record in trainer.get('field', []):
                        decided = record.get('label') or record['text'] in ('Permanent Sand', 'Trick Room') \
                            or record['text'].startswith(('Sydney ', 'Sidney ', 'Glacia '))
                        if decided:
                            assert record['review'] is False, (path, trainer['n'], record['text'])
    print('PASS trainer field parsing, inheritance, ambiguity, schema and rebuild idempotence')
    if '--sources' in sys.argv:
        source_check(root)


if __name__ == '__main__':
    main()
