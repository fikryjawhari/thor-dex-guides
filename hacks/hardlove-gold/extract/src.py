"""The hack's own data from its hg-engine source (kumakuma1/hardlove at the pinned commit, files in
docs/hardlove-gold/repos/hardlove). Constants like SPECIES_X / MOVE_X / ITEM_X / ABILITY_X are turned into names."""
import os, re, json
import hge

LAND = [10] * 8 + [5] * 4            # src/field/encounter_check.c (the hack's own slot odds)
WATER = [30, 30, 25, 10, 5]          # surf and every rod
ROCK = [60, 40]
HEADBUTT = [20] * 5

class Src:
    def __init__(self, root):
        f = lambda p: os.path.join(root, p)
        self.commit = open(f('COMMIT')).read().strip()
        self.defs = dict(re.findall(r'(?m)^\s*#define\s+(\w+)\s+(\d+)', open(f('include/config.h'), encoding='utf-8').read()))
        self.S = hge.table(f('data/Species.c'), r'\w+\s+\w+\[[^\]]*\]\s*=')
        self.HA = hge.table(f('data/HiddenAbilityTable.c'), r'\w+\[[^\]]*\]\s*=')
        self.LS = json.load(open(f('data/learnsets/learnsets.json'), encoding='utf-8'))
        self.MV = {k: v for k, v in hge.table(f('data/Moves.c'), r'\w+\[[^\]]*\]\s*=').items() if isinstance(v, dict) and 'names' in v}
        self.EV = hge.table(f('data/Evolutions.c'), r'\w+\[[^\]]*\]\s*=')
        ft = hge.table(f('data/PokeFormDataTbl.c'), r'\w+\[\]\[32\]\s*=')
        self.form = {}; self.base = {}
        for b, lst in ft.items():
            for n, t in enumerate(lst if isinstance(lst, list) else [], 1):
                t = str(t).replace('NEEDS_REVERSION |', '').strip()
                self.form[(b, n)] = t; self.base[t] = b
        mm = open(f('data/MachineMoves.c'), encoding='utf-8').read()
        self.TM = [(c.strip(), m) for m, c in re.findall(r'(MOVE_\w+),\s*//\s*(\w+)', mm)]
        self.TR = hge.table(f('data/Trainers.c'), r'sTrainerData\[\]\s*=')
        self.ENC = hge.table(f('data/Encounters.c'), r'__data\[\]\s*=')
        self.HID = re.findall(r'\{\s*(ITEM_\w+),\s*(\d+),[^}]*\},\s*//\s*([^\n]*)', open(f('data/HiddenItems.c'), encoding='utf-8').read())
        self.mech = open(f('doc/Mechanics.txt'), encoding='utf-8-sig').read()

    def cfg(self, v):
        """Resolve '( ( FLAG ) ? ( a ) : ( b ) )' with the config.h defines."""
        if isinstance(v, int): return v
        m = re.fullmatch(r'\(\s*\(\s*(\w+)\s*\)\s*\?\s*\(\s*(-?\d+)\s*\)\s*:\s*\(\s*(-?\d+)\s*\)\s*\)', str(v))
        if m: return int(m.group(2)) if int(self.defs.get(m.group(1), 0)) else int(m.group(3))
        return v

    def species(self, v):
        """SPECIES_X or MON_WITH_FORM(SPECIES_X, n) -> resolved constant (SPECIES_X_FORMNAME)."""
        b, n = hge.species_form(v)
        return self.form.get((b, n), b) if n else b

    @staticmethod
    def sid(const): return const[8:].lower() if const.startswith('SPECIES_') else const.lower()

    def move(self, c):
        m = self.MV.get(c)
        return m['names']['name'] if m else c[5:].replace('_', ' ').title()

    @staticmethod
    def title(c, pre):
        s = c[len(pre):].replace('_', ' ').title()
        return re.sub(r"\bS\b", "'s", s).replace(" 'S", "'s")

    def learnset(self, const):
        L = self.LS.get(const)
        if L is None and const in self.base: L = self.LS.get(self.base[const])
        return L
