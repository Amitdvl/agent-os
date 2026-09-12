import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('build_pamphlet', Path(__file__).parents[1] / 'scripts' / 'build_pamphlet.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def manuscript(words=300):
    return '# Test Pamphlet\n\n' + ' '.join(['knowledge'] * words) + '\n'


class PamphletTests(unittest.TestCase):
    def test_boundaries(self):
        for words in (300, 1000):
            self.assertEqual(builder.parse(manuscript(words))[1], words)
        for words in (299, 1001):
            with self.assertRaises(ValueError):
                builder.parse(manuscript(words))

    def test_sources_excluded_and_headings_count(self):
        text = manuscript(298) + '\n## Core Knowledge\n\n## Sources\n\n' + 'source ' * 1100
        self.assertEqual(builder.parse(text)[1], 300)

    def test_unsupported_markup_rejected(self):
        for extra in ('\n> quote', '\n| table |', '\n![image](https://example.com/a)', '\n    code', '\n~~strike~~', '\n_unhandled_', '\n## Sources\n\n## More'):
            with self.subTest(extra=extra), self.assertRaises(ValueError):
                builder.parse(manuscript() + extra)

    def test_ordinary_punctuation(self):
        self.assertEqual(builder.inline('Yes! x_y is ~2; a | b.')[1], 'Yes! x_y is ~2; a | b.')

    def test_publish_checked_pair_without_rerendering(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / 'input.md'
            source.write_text(manuscript())
            staged = builder.build(source, root / 'stage')
            with patch.object(builder, 'render_pdf', side_effect=AssertionError('must not rerender')):
                final = builder.build(Path(staged['markdown']), root / 'final', publish=True)
            for kind in ('markdown', 'pdf'):
                self.assertEqual(Path(staged[kind]).read_bytes(), Path(final[kind]).read_bytes())

    def test_delivered_verification_failure_rolls_back(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / 'input.md'
            source.write_text(manuscript())
            original = builder.validate_pdf
            def fail_delivered(path, blocks):
                if path.parent == root / 'out':
                    raise ValueError('delivered verification failed')
                original(path, blocks)
            with patch.object(builder, 'validate_pdf', side_effect=fail_delivered), self.assertRaises(ValueError):
                builder.build(source, root / 'out')
            self.assertEqual(list((root / 'out').iterdir()), [])

    def test_pair_contents_collisions_and_determinism(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / 'input.md'
            source.write_text(manuscript() + '\n## Sources\n\n1. **Bold** and *italic* with `code` and [primary source](https://example.com).\n', encoding='utf-8')
            output = root / 'out'
            output.mkdir()
            (output / 'test-pamphlet.pdf').write_bytes(b'existing')
            first = builder.build(source, output)
            second = builder.build(source, output)
            self.assertEqual(Path(first['pdf']).stem, 'test-pamphlet-2')
            self.assertEqual(Path(first['markdown']).stem, 'test-pamphlet-2')
            self.assertEqual(Path(second['pdf']).stem, 'test-pamphlet-3')
            self.assertEqual((output / 'test-pamphlet.pdf').read_bytes(), b'existing')
            self.assertFalse((output / 'test-pamphlet.md').exists())
            self.assertEqual(Path(first['markdown']).read_text(), source.read_text())
            self.assertEqual(Path(first['pdf']).read_bytes(), Path(second['pdf']).read_bytes())
            reader = builder.PdfReader(first['pdf'])
            text = ''.join(page.extract_text() for page in reader.pages)
            self.assertIn('Bold and italic with code and primary source.', text)
            self.assertTrue(any(page.get('/Annots') for page in reader.pages))

    def test_failed_publication_rolls_back(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / 'input.md'
            source.write_text(manuscript())
            original = builder.os.link
            count = 0
            def fail_second(src, dst):
                nonlocal count
                count += 1
                if count == 2:
                    raise OSError('simulated publication failure')
                return original(src, dst)
            with patch.object(builder.os, 'link', side_effect=fail_second), self.assertRaises(OSError):
                builder.build(source, root / 'out')
            self.assertEqual(list((root / 'out').iterdir()), [])

    def test_verification_failure_leaves_no_outputs(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / 'input.md'
            source.write_text(manuscript())
            with patch.object(builder, 'validate_pdf', side_effect=ValueError('verification failed')), self.assertRaises(ValueError):
                builder.build(source, root / 'out')
            self.assertEqual(list((root / 'out').iterdir()), [])


if __name__ == '__main__':
    unittest.main()
