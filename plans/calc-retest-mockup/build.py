"""Build the standalone EI interaction study and its Thor frame (no calc engine)."""
import base64
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

here = Path(__file__).resolve().parent
root = here.parents[1]
spec = importlib.util.spec_from_file_location('guide_assemble', root / 'assemble.py')
assembly = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assembly)
data = json.loads((root / 'hacks/emerald-imperium/data.json').read_text(encoding='utf8'))
config = json.loads((root / 'hacks/emerald-imperium/hack.json').read_text(encoding='utf8'))
profile = assembly.calc_profile(config['cfg']['calc'], data)
names = ['Garchomp', 'Snover', 'Gengar', 'Lucario', 'Infernape', 'Staraptor', 'Scizor', 'Gastrodon', 'Togekiss', 'Weavile', 'Magnezone', 'Roserade', 'Gliscor', 'Mamoswine', 'Rotom', 'Milotic', 'Dragonite', 'Tyranitar']
sample = []
for name in names:
    species = next(entry for entry in data['P'] if entry['n'] == name)
    sprite = root / 'sprites/png' / f"{species['dex']:04d}.png"
    sample.append({'n': name, 'sprite': 'data:image/png;base64,' + base64.b64encode(sprite.read_bytes()).decode() if sprite.exists() else '', 'abilities': list(dict.fromkeys(data['AB'][index][0] for index in species.get('a', []) + ([species['ha']] if 'ha' in species else [])))})
items = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./tools/calc/node_modules/@smogon/calc/dist/data/items.js").ITEMS[9]))'], cwd=root, text=True))
items = sorted(set(items) | {row[0] for group in data['IT'] for row in group.get('r', [])})
payload = {'species': sample, 'abilities': sorted({entry[0] for entry in data['AB']}), 'items': ['No item'] + items, 'field': profile['field'], 'status': profile['status']}
source = (here / 'mock.src.html').read_text(encoding='utf8').replace('/*DATA*/{}', assembly.script_json(payload))
(here / 'mock.html').write_text(source, encoding='utf8')
output = root / 'dist/calc-retest-mock.html'
output.parent.mkdir(exist_ok=True)
subprocess.run([sys.executable, '-I', str(root / 'tools/mockup/thor-frame/build.py'), str(here / 'mock.html'), str(output), '--title', 'Calc retest', '--sub', 'Interaction mockup · fake damage, real EI choices', '--panel', str(here / 'panel.html'), '--routes', 'none'], check=True)
print(output)
