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


def main():
    root = Path(__file__).resolve().parent.parent
    thunder = trainer_fields.evidence('Permanent OW Thunderstorm: Rain and Electric Terrain', 'trainer-note')
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
    assert critical == dict(kind='critical-bonus', value=1)
    for text in ['Sydney Tailwind', 'Sydney TrickRoom', 'Glacia Sun', 'Trick Room', 'Unknown weather effect']:
        record = trainer_fields.evidence(text, 'trainer-tag')
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
    print('PASS trainer field parsing, inheritance, ambiguity, schema and rebuild idempotence')
    if '--sources' in sys.argv:
        source_check(root)


if __name__ == '__main__':
    main()
