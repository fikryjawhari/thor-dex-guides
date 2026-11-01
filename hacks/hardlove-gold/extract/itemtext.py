"""IX: the hack's own items' bag text (item_desc.json, from data/text/221.txt at the pinned commit). Those items are new
to the hack, so there is no vanilla text to compare: each is marked changed = 1. Entries are [description, in-battle
text, changed]; the in-battle text stays empty here (the shared sets fill it). Stock items get text from the shared pool."""
import json, os
from common import HACK, report

def build(D):
    IX = {}
    for name, (text, changed) in json.load(open(os.path.join(HACK, 'extract', 'item_desc.json'), encoding='utf-8')).items():
        IX[name] = [text, '', changed]
    D['IX'] = IX
    report('IX (hack item text):', ', '.join(sorted(IX)))
