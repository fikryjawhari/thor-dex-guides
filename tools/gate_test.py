"""Unit tests for the gate's helpers: text lint, accepted data differences, domcompare's build-stamp normalisation.
uv run python -X utf8 -I tools/gate_test.py"""
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import textlint  # noqa: E402


class Lint(unittest.TestCase):
    def kinds(self, data):
        return [(line, kind) for line, kind, _ in textlint.problems(data)]

    def test_clean(self):
        self.assertEqual(self.kinds('a\tb\nNidoran♂ é →\n'.encode()), [])

    def test_crlf_bom(self):
        self.assertEqual(self.kinds(b'\xef\xbb\xbfa\nb\r\nc\r\n'), [(1, 'UTF-8 BOM'), (2, 'CRLF line endings (2 lines)')])
        self.assertEqual(textlint.fixed(b'\xef\xbb\xbfa\r\nb\r\n'), b'a\nb\n')

    def test_controls(self):
        self.assertEqual(self.kinds(b'a\nb\x00\nc\x1b[0m\rd\x7f\n'),
                         [(2, 'NUL'), (3, 'control byte 0x1b'), (3, 'lone CR'), (3, 'DEL')])
        self.assertFalse(any(fixable for _, _, fixable in textlint.problems(b'x = "\x01"\n')))

    def test_invalid_utf8(self):
        self.assertEqual(self.kinds(b'ok\n\xe9t\xe9\n'), [(2, 'invalid UTF-8 (invalid continuation byte)')])

    def test_scope(self):
        names = textlint.files()
        self.assertIn('assemble.py', names)
        self.assertIn('tools/gate.py', names)
        self.assertTrue(any(name.startswith('hacks/') and name.endswith('/hack.json') for name in names))
        self.assertFalse([name for name in names if '/.src/' in name or name.endswith(('.sav', '.png'))])


if __name__ == '__main__':
    unittest.main()
