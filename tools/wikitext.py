"""Shared wikitext argument parsing for the guides' source extracts."""


def split_args(text):
    out, depth, current, index = [], 0, '', 0
    while index < len(text):
        pair = text[index:index + 2]
        if pair in ('{{', '[['):
            depth += 1
            current += pair
            index += 2
        elif pair in ('}}', ']]'):
            depth -= 1
            current += pair
            index += 2
        elif text[index] == '|' and depth == 0:
            out.append(current)
            current = ''
            index += 1
        else:
            current += text[index]
            index += 1
    return out + [current]
