"""Reader for a local RomHackDex mirror (romhackdex.net pages saved under a hack's .src/romhackdex/). Stdlib only.

    from romhackdex import Mirror
    rd = Mirror('hacks/<hack>/.src/romhackdex')
    rd.species()        {slug: Species} every pokedex page (name, dex, types, abilities, hidden, stats, learnsets)
    rd.find(name)       the Species for a displayed name ("Nidoran♀", "Mr. Mime", "Farfetch'd", "Ho-Oh") or None
    rd.evolutions()     [(from slug, to slug, method text)] from the family chains, branch parents corrected
    rd.moves()          {normalised name: move} from moves.json (V-create's case duplicate merged; ac None = never misses)
    rd.abilities()      {name: description} from abilities/index.html
    rd.type_chart()     {attack type: {defend type: multiplier x10}} from types/index.html

Used by the Drayano guides (Blaze Black 2 Redux, Renegade Platinum: tools/drayano.py reads their docs) and usable by
any hack with a RomHackDex mirror. The mirror is secondary to a hack's own docs: it shows the hack's base data
(stats before a "Complete" version's changes, level-up lists with typos fixed, abilities), but no form pages (one page
per dex number), no move descriptions on the Gen V sites, and evolution methods only as "Lv. N", "Evolution item",
"Friendship" or "Level up at special location". Pages are parsed on first use and cached. No network access.
"""
import html
import json
import os
import re
import unicodedata

TYPES = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic',
         'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy']

# The chain on a family's page is a flattened tree: after a branch's last stage the next arrow starts again from the
# branch point, which the page doesn't show. The second branch of each vanilla Gen I-V family, with its real parent.
BRANCH_PARENT = {'bellossom': 'gloom', 'politoed': 'poliwhirl', 'slowking': 'slowpoke', 'cascoon': 'wurmple',
                 'gallade': 'kirlia', 'froslass': 'snorunt', 'gorebyss': 'clamperl', 'mothim': 'burmy',
                 'shedinja': 'nincada', 'hitmonchan': 'tyrogue', 'hitmontop': 'tyrogue', 'wormadam': 'burmy'}


def key(s):
    """Name key: lowercase letters and digits only, sex symbols as f / m ("Nidoran♀" -> nidoranf)."""
    s = unicodedata.normalize('NFKD', str(s).replace('♀', 'f').replace('♂', 'm')).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]', '', s.lower())


def text(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


def _section(raw, start, end_tag='<h2'):
    """The HTML after the heading whose text is `start` up to the next heading of the same level."""
    m = re.search(r'<(h[23])[^>]*>\s*%s\s*</\1>' % re.escape(start), raw)
    if not m:
        return None
    rest = raw[m.end():]
    nxt = re.search(r'<%s[\s>]' % m.group(1), rest)
    return rest[:nxt.start()] if nxt else rest


class Species:
    """One pokedex page. lv [(level, move)], tm [(label, move)] (TM01 / HM04), tutor [move], egg [move] (move names as
    the page shows them); evo [(from slug, to slug, method)] the family chain as the page draws it (uncorrected)."""

    def __init__(self, slug, raw):
        self.slug = slug
        body = re.sub(r'<script.*?</script>|<style.*?</style>|<svg.*?</svg>', '', raw, flags=re.S)
        self.name = text(re.search(r'<h1[^>]*>(.*?)</h1>', body, re.S).group(1))
        sprite = re.search(r'/sprites/(\d+)\.png" alt="%s"' % re.escape(html.escape(self.name, quote=True)), raw)
        self.dex = int(sprite.group(1)) if sprite else None
        hero = body[body.find('<h1'):body.find('Base Stats</h2>')]
        self.types = [t for t in re.findall(r'<span[^>]*background-color[^>]*>\s*([A-Za-z]+)\s*</span>', hero) if t in TYPES]
        self.abilities, self.hidden = [], None
        for inner in re.findall(r'<a [^>]*data-ability="[^"]*"[^>]*>(.*?)</a>', hero, re.S):
            name = text(re.sub(r'<span[^>]*>\(H\)</span>', '', inner))
            if '(H)' in inner:
                self.hidden = name
            else:
                self.abilities.append(name)
        bars = re.search(r'<div[^>]*id="stat-bars"[^>]*>', body)
        bars = dict(re.findall(r'data-(\w+)="(\d+)"', bars.group(0))) if bars else {}
        names = ('hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed')
        self.stats = [int(bars[n]) for n in names] if all(n in bars for n in names) else None
        self.lv, self.tm, self.tutor, self.egg = [], [], [], []
        for head, attr in (('Level Up', 'lv'), ('TM / HM', 'tm'), ('Tutor', 'tutor'), ('Egg Moves', 'egg')):
            sec = _section(body, head) or ''
            for row in re.findall(r'<tr[^>]*data-moveid="[^"]*"[^>]*>(.*?)</tr>', sec, re.S):
                cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.S)
                move = text(re.search(r'<a[^>]*>(.*?)</a>', row, re.S).group(1))
                if attr == 'lv':
                    self.lv.append((int(text(cells[0])), move))
                elif attr == 'tm':
                    self.tm.append((text(cells[0]), move))
                else:
                    getattr(self, attr).append(move)
        self.evo = []
        sec = _section(body, 'Evolution') or ''
        chain = re.findall(r'<a href="[^"]*/pokedex/([^/"]+)/"|<span[^>]*>([^<]*)</span>\s*</div>', sec)
        prev, how, branched = None, None, '&rarr;' not in sec
        root = None
        for slug, label in chain:
            if slug:
                if prev is not None and not branched:
                    self.evo.append((prev, slug, how))
                elif branched and root is not None:
                    self.evo.append((root, slug, None))
                root = root or slug
                prev = slug
            elif label.strip() and label.strip() != '&rarr;':
                if branched and self.evo:
                    self.evo[-1] = self.evo[-1][:2] + (text(label),)
                else:
                    how = text(label)


class Mirror:
    def __init__(self, path):
        self.path = path
        self._species = None

    def _read(self, *parts):
        return open(os.path.join(self.path, *parts), encoding='utf-8').read()

    def species(self):
        if self._species is None:
            d = os.path.join(self.path, 'pokedex')
            self._species = {s: Species(s, self._read('pokedex', s, 'index.html')) for s in sorted(os.listdir(d))
                             if os.path.isfile(os.path.join(d, s, 'index.html'))}
            self._by_key = {key(sp.name): sp for sp in self._species.values()}
        return self._species

    def find(self, name):
        self.species()
        return self._by_key.get(key(name))

    def evolutions(self):
        """Every edge of every family once, with the flattened branches put back on their real parent."""
        out = {}
        for sp in self.species().values():
            for a, b, how in sp.evo:
                a = BRANCH_PARENT.get(b, a)
                out.setdefault((a, b), how)
        return [(a, b, how) for (a, b), how in out.items()]

    def moves(self):
        """moves.json by normalised name: {n, t, c, bp, ac, pp, pr, d, slug}. Two entries with one name (V-create /
        V-Create) are merged, keeping the first. ac None means the move never misses (or has no accuracy check)."""
        out = {}
        for m in json.loads(self._read('moves.json')):
            out.setdefault(key(m['n']), m)
        return out

    def abilities(self):
        raw = self._read('abilities', 'index.html')
        return {text(n): text(d) for n, d in re.findall(
            r'<a href="[^"]*/abilities/[^"]+/"[^>]*data-name="[^"]*"[^>]*>\s*<div[^>]*>\s*<span[^>]*>(.*?)</span>.*?'
            r'<p[^>]*>(.*?)</p>', raw, re.S)}

    def type_chart(self):
        """{attack: {defend: x10}} from the chart's data-row / data-col / data-val cells (rows and columns in the
        header's type order)."""
        raw = self._read('types', 'index.html')
        cols = re.findall(r'<div[^>]*data-col="\d+"[^>]*title="([A-Za-z]+)"', raw)
        chart = {t: {} for t in cols}
        for r, c, v in re.findall(r'data-row="(\d+)" data-col="(\d+)" data-val="([\d.]+)"', raw):
            chart[cols[int(r)]][cols[int(c)]] = round(float(v) * 10)
        return chart
