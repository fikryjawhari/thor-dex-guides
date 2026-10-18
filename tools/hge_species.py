"""Extract per-species dex data from an hg-engine checkout's data files, and optionally diff two of them.

Usage:
  python -I hge_species.py <dir> <out.json>            # dir holds Species.c, HiddenAbilityTable.c, learnsets.json
  python -I hge_species.py --diff <a.json> <b.json>    # count and list species that differ

Output per species constant: name, base stats, types, abilities, hidden ability, EV yields, and the
LevelMoves / MachineMoves / EggMoves / TutorMoves learnsets."""
import json, re, sys

STATS = ["hp", "attack", "defense", "spAttack", "spDefense", "speed"]
FIELDS = ["stats", "types", "abilities", "hiddenAbility", "evYields", "LevelMoves", "MachineMoves", "EggMoves", "TutorMoves"]


def block(text, start):
    """Return the brace-balanced block starting at text[start] == '{'."""
    depth = 0
    for i in range(start, len(text)):
        depth += {"{": 1, "}": -1}.get(text[i], 0)
        if depth == 0:
            return text[start:i + 1]
    raise ValueError("unbalanced braces")


def stat_block(body, name):
    m = re.search(r"\." + name + r"\s*=\s*\{", body)
    if not m:
        return None
    inner = block(body, m.end() - 1)
    return [int(re.search(r"\." + s + r"\s*=\s*(-?\d+)", inner).group(1)) for s in STATS]


def extract(folder):
    species_c = open(f"{folder}/Species.c", encoding="utf-8").read()
    hidden_c = open(f"{folder}/HiddenAbilityTable.c", encoding="utf-8").read()
    learnsets = json.load(open(f"{folder}/learnsets.json", encoding="utf-8"))
    hidden = dict(re.findall(r"\[(SPECIES_\w+)\s*\]\s*=\s*(ABILITY_\w+)", hidden_c))
    out = {}
    for m in re.finditer(r"\[(SPECIES_\w+)\]\s*=\s*\{", species_c):
        const, body = m.group(1), block(species_c, m.end() - 1)
        name = re.search(r'\.name\s*=\s*"([^"]*)"', body)
        types = re.search(r"\.types\s*=\s*\{([^}]*)\}", body)
        abilities = re.search(r"\.abilities\s*=\s*\{([^}]*)\}", body)
        sets = learnsets.get(const, {})
        out[const] = {
            "name": name.group(1) if name else None,
            "stats": stat_block(body, "baseStats"),
            "types": [t.strip() for t in types.group(1).split(",")] if types else None,
            "abilities": [a.strip() for a in abilities.group(1).split(",")] if abilities else None,
            "hiddenAbility": hidden.get(const),
            "evYields": stat_block(body, "evYields"),
            **{k: sets.get(k) for k in ["LevelMoves", "MachineMoves", "EggMoves", "TutorMoves"]},
        }
    return out


def diff(a_path, b_path):
    a, b = json.load(open(a_path, encoding="utf-8")), json.load(open(b_path, encoding="utf-8"))
    only_a, only_b = sorted(set(a) - set(b)), sorted(set(b) - set(a))
    per_field = {f: [] for f in FIELDS}
    changed = []
    for const in sorted(set(a) & set(b)):
        fields = [f for f in FIELDS if a[const].get(f) != b[const].get(f)]
        if fields:
            changed.append((const, fields))
            for f in fields:
                per_field[f].append(const)
    print(f"species in A: {len(a)}, in B: {len(b)}, only in A: {len(only_a)}, only in B: {len(only_b)}")
    print(f"species present in both that differ: {len(changed)}")
    for f in FIELDS:
        print(f"  {f}: {len(per_field[f])}")
    dex_relevant = [c for c, fs in changed if set(fs) & {"stats", "types", "abilities", "hiddenAbility"}]
    print(f"species with a stat, type or ability change: {len(dex_relevant)}")
    return {"only_in_a": only_a, "only_in_b": only_b, "changed": {c: fs for c, fs in changed}}


if __name__ == "__main__":
    if sys.argv[1] == "--diff":
        report = diff(sys.argv[2], sys.argv[3])
        if len(sys.argv) > 4:
            json.dump(report, open(sys.argv[4], "w", encoding="utf-8"), indent=1)
    else:
        data = extract(sys.argv[1])
        json.dump(data, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("species:", len(data), "missing stats:", sum(1 for v in data.values() if not v["stats"]))
