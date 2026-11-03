"""Browser floor: CSS / JS the Thor's WebView (Chrome 109) can't run, in the code a guide ships.

    uv run python -X utf8 -I tools/compatlint.py [path ...]     (also first in tools/gate.py check / scenarios / lint)

The Thor's Dex Viewer WebView is Chrome 109 (Chrome/109.0.5414.123); the gate and the phone preview run a recent
Chrome, so a newer feature passes every browser check and breaks only on the device. One unknown at-rule drops its
whole block: `@scope` (Chrome 118) once took 352 calc rules with it. Scope: what assemble.py inlines (template/*.js,
*.css, shell.html, template/calc/**/*.js and *.css; the .mjs engine sources are bundled into calc/ai/<hack>.js).
A hit names file, line and the feature; there is no ignore list: rewrite the code (or give a fallback where one is
allowed: `color-mix()` after a plain declaration of the same property in the same rule).
"""
import argparse
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
FLOOR = 'Chrome 109'

CSS = [  # (pattern, feature (Chrome version))
    (re.compile(r'@scope\b'), '@scope (118)'),
    (re.compile(r'@starting-style\b'), '@starting-style (117)'),
    (re.compile(r'\blight-dark\('), 'light-dark() (123)'),
    (re.compile(r'\bsubgrid\b'), 'subgrid (117)'),
    (re.compile(r'&'), 'CSS nesting & (112 / 120)'),
    (re.compile(r'@container[^{]*style\('), 'style() container query (111)'),
    (re.compile(r'\b(?:rcap|rch|rex|ric|rlh)\b(?=[;\s)])'), 'root font units (111)'),
    (re.compile(r'\btext-wrap\s*:\s*(?:balance|pretty)'), 'text-wrap balance / pretty (114)'),
]
JS = [
    (re.compile(r'\.(?:toSorted|toReversed|toSpliced)\('), 'Array change-by-copy (110)'),
    (re.compile(r'(?<![\w$])(?:\w+|\])\.with\((?!\s*\{)'), 'Array.prototype.with (110)'),
    (re.compile(r'\b(?:Object|Map)\.groupBy\('), 'Object / Map.groupBy (117)'),
    (re.compile(r'\bPromise\.withResolvers\('), 'Promise.withResolvers (119)'),
    (re.compile(r'\.(?:union|intersection|difference|symmetricDifference|isSubsetOf|isSupersetOf|isDisjointFrom)\('),
     'Set methods (122)'),
    (re.compile(r'\bArray\.fromAsync\('), 'Array.fromAsync (121)'),
    (re.compile(r'\.findLast(?:Index)?\('), None),  # Chrome 97: fine, listed so nobody adds it to the bans
]


def files():
    tpl = ROOT / 'template'
    for path in sorted(tpl.glob('*')):
        if path.suffix in ('.js', '.css', '.html'):
            yield path
    for path in sorted((tpl / 'calc').rglob('*')):
        if path.suffix in ('.js', '.css'):
            yield path


def blank(text, pattern):
    """`text` with each match of `pattern` replaced by spaces (newlines kept), so line numbers stay true."""
    return re.sub(pattern, lambda m: re.sub(r'[^\n]', ' ', m.group(0)), text, flags=re.S)


def css_code(text):
    return blank(text, r'/\*.*?\*/|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|url\([^)]*\)')


def js_code(text):
    # comments and string / template literals out, so prose and data never match
    return blank(text, r'/\*.*?\*/|(?<![:\\])//[^\n]*|"(?:\\.|[^"\\\n])*"|\'(?:\\.|[^\'\\\n])*\'|`(?:\\.|[^`\\])*`')


def color_mix(code, hits, line):
    """color-mix() (Chrome 111) only after a plain declaration of the same property in the same rule."""
    for block in re.finditer(r'\{([^{}]*)\}', code):
        seen = set()
        for decl in re.finditer(r'([-\w]+)\s*:([^;]*)', block.group(1)):
            prop, value = decl.group(1), decl.group(2)
            if 'color-mix(' in value and prop not in seen:
                hits.append((line(block.start(1) + decl.start()), f'color-mix() with no {prop} fallback before it (111)'))
            if 'color-mix(' not in value:
                seen.add(prop)


def scan(path, text):
    hits = []
    css = path.suffix == '.css'
    code = css_code(text) if css else js_code(text)
    line = lambda offset: code.count('\n', 0, offset) + 1
    if path.suffix == '.html':  # shell.html: its <style> as CSS, its <script> as JS
        parts = [(m.start(1), css_code(m.group(1)), CSS) for m in re.finditer(r'<style[^>]*>(.*?)</style>', text, re.S)]
        parts += [(m.start(1), js_code(m.group(1)), JS) for m in re.finditer(r'<script[^>]*>(.*?)</script>', text, re.S)]
    else:
        parts = [(0, code, CSS if css else JS)]
    for start, body, rules in parts:
        for pattern, feature in rules:
            if feature is None:
                continue
            for m in pattern.finditer(body):
                hits.append((text.count('\n', 0, start + m.start()) + 1, feature))
        if rules is CSS:
            color_mix(body, hits, lambda offset, s=start: text.count('\n', 0, s + offset) + 1)
    return sorted(set(hits))


def lint(paths=None, out=print):
    left = 0
    for path in (map(lambda p: Path(p).resolve(), paths) if paths else files()):
        for line, feature in scan(path, path.read_text(encoding='utf-8')):
            out(f'{path.relative_to(ROOT).as_posix()}:{line}: {feature}: not in {FLOOR} (the Thor WebView)')
            left += 1
    return left


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('paths', nargs='*')
    left = lint(parser.parse_args().paths)
    print('compat: clean' if not left else f'compat: {left} problem(s)')
    return 1 if left else 0


if __name__ == '__main__':
    sys.exit(main())
