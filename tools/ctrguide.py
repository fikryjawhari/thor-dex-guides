"""Shared conversion and trainer helpers for the 3DS guides' source extracts."""


def trainer_match_score(event, trainer):
    team = [(member['species'], member['level']) for member in trainer['team']]
    score = 0
    for pokemon in event['mons']:
        if pokemon in team:
            score += 3
        elif pokemon[0] in [member[0] for member in team]:
            score += 1
    return score - abs(len(team) - len(event['mons']))


def default_moves(species, level):
    """The last four distinct level-up moves at that level, in learnset order."""
    moves = []
    for learned_level, move in species['lv']:
        if learned_level <= level and move not in moves:
            moves.append(move)
    return moves[-4:]
