"""Unbound-Cloud oracle dump (local research only): runs Skeli789's own save code from a checkout on each save and
prints one JSON line per save with every box slot in normalised form. Called by cfru_oracles.mjs; never vendored.

    python -I tools/calc/cfru_oracle_cloud.py <Unbound-Cloud checkout> <save> [<save> ...]

Normalised mon: {box, slot, pid, sp (game id as stored), spDefine (Cloud's name after its out-of-battle form
normalisation), lv, nat 0-24, abs, it, it / mv [4] as game ids (Cloud drops unknown moves and closes the gap), iv / ev in the game's order HP Atk Def Spe SpA
SpD}. Cloud reads no party. Empty slots and Bad Eggs are left out; eggs are kept with egg: true.
"""
import json
import os
import sys

cloud = os.path.abspath(sys.argv[1])
sys.path.insert(0, os.path.join(cloud, 'server', 'src'))
# PokemonUtil reads a checksum key from .env (python-dotenv) for Cloud's own transfers; any value does for reading.
os.environ.setdefault('CHECKSUM_KEY', 'oracle')

from Defines import Defines                                     # noqa: E402
from PokemonProcessing import PokemonProcessing, CFRUCompressedPokemonSize   # noqa: E402
from PokemonUtil import PokemonUtil                             # noqa: E402
from SaveBlockProcessing import SaveBlockProcessing             # noqa: E402
from SaveBlocks import SaveBlocks                               # noqa: E402


def dump(path):
    out = {'file': path, 'accepted': False}
    blocks, sig = SaveBlocks.LoadAll(path)
    out['signature'] = '0x%08X' % sig if sig else None
    if Defines.IsOldVersionFileSignature(sig):
        out['reason'] = 'old version: ' + Defines.GetOldVersionGameName(sig)
        return out
    if not blocks or not sig or not Defines.LoadAll(sig):
        out['reason'] = 'not loaded (validation failed)'
        return out
    out['game'] = Defines.GetCurrentDefinesDir()
    out['randomizer'] = SaveBlockProcessing.IsRandomizedSave(blocks)
    allBoxes = SaveBlockProcessing.GetAllCFRUBoxesData(blocks)
    boxes = []
    for n, at in enumerate(range(0, len(allBoxes), CFRUCompressedPokemonSize)):
        data = PokemonProcessing.LoadCFRUCompressedMonAtBoxOffset(allBoxes, at)
        raw = data['species']
        if not raw:
            continue
        sanity = data['sanity']
        PokemonProcessing.AssignConstantsToCFRUData(data)
        if sanity & 1:                                          # Bad Egg: Cloud blanks it
            continue
        sp = data['species']
        nat = Defines.reverseNatures.get(data['nature']) if isinstance(data['nature'], str) else data['nature']
        boxes.append({'box': n // 30, 'slot': n % 30, 'pid': data['personality'], 'sp': raw,
                      'spDefine': sp if isinstance(sp, str) else None, 'egg': bool(data['isEgg']),
                      'lv': PokemonUtil.CalculateLevel(data) if sp in Defines.baseStats else None,
                      'nat': nat, 'abs': data['abilitySlot'], 'it': Defines.reverseItems.get(data['item'], data['item']),
                      'mv': [Defines.reverseMoves.get(m, m) for m in data['moves']],
                      'iv': data['ivs'], 'ev': data['evs']})
    out.update(accepted=True, boxes=boxes, titles=SaveBlockProcessing.LoadCFRUBoxTitles(blocks))
    return out


for p in sys.argv[2:]:
    try:
        print(json.dumps(dump(p)))
    except Exception as e:                                       # Cloud's own code raised: record, keep going
        print(json.dumps({'file': p, 'accepted': False, 'reason': 'exception: %r' % e}))
