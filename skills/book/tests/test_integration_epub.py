from __future__ import annotations

import shutil
import tempfile
import unittest
import zipfile
import re
from pathlib import Path

from tests.support import SKILL_ROOT, load_script


@unittest.skipUnless(shutil.which("pandoc") and shutil.which("epubcheck"), "Pandoc and EPUBCheck required")
class EpubIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.builder = load_script("build_epub")

    def test_real_epub3_has_metadata_navigation_notes_backlinks_css_and_collisions(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            destination = root / "books"
            destination.mkdir()
            manuscript = SKILL_ROOT / "tests" / "fixtures" / "sample-manuscript.md"
            metadata = root / "metadata.yaml"
            metadata.write_text(
                'title: "A Small Test Book"\nsubtitle: "An EPUB Fixture"\nlang: "en-US"\nidentifier: "urn:uuid:11111111-2222-4333-8444-555555555555"\n',
                encoding="utf-8",
            )
            first = self.builder.build_epub(
                manuscript,
                metadata,
                SKILL_ROOT / "assets" / "epub.css",
                destination,
                validate=True,
                work_dir=root / "work-one",
            )
            second = self.builder.build_epub(
                manuscript,
                metadata,
                SKILL_ROOT / "assets" / "epub.css",
                destination,
                validate=True,
                work_dir=root / "work-two",
            )
            self.assertEqual(first["epubcheck_errors"], 0)
            self.assertNotEqual(first["final_path"], second["final_path"])
            self.assertTrue(second["final_path"].endswith("-2.epub"))
            inspection = first["inspection"]
            self.assertTrue(inspection["epub3"])
            self.assertTrue(inspection["package_document"])
            self.assertTrue(inspection["navigation_document"])
            self.assertTrue(inspection["title_present"])
            self.assertTrue(inspection["subtitle_present"])
            self.assertTrue(inspection["language_present"])
            self.assertTrue(inspection["identifier_present"])
            self.assertTrue(inspection["modified_present"])
            self.assertGreaterEqual(inspection["chapter_navigation_entries"], 2)
            self.assertTrue(inspection["note_reference_present"])
            self.assertTrue(inspection["note_backlink_present"])
            self.assertTrue(inspection["note_links_valid"])
            self.assertTrue(inspection["css_present"])
            self.assertFalse(inspection["scripted_content"])
            self.assertFalse(inspection["embedded_fonts"])
            self.assertFalse(inspection["fixed_layout"])
            self.assertEqual(inspection["remote_resources"], [])
            self.assertEqual(first["epubcheck_warnings"], 0)
            self.assertRegex(first["sha256"], r"^[0-9a-f]{64}$")
            with zipfile.ZipFile(first["final_path"]) as archive:
                self.assertEqual(archive.read("mimetype"), b"application/epub+zip")

            broken = root / "broken-backlink.epub"
            shutil.copy2(first["final_path"], broken)
            with zipfile.ZipFile(broken) as archive:
                footnote_member = next(
                    name for name in archive.namelist()
                    if name.endswith(".xhtml")
                    and archive.read(name).count(b'role="doc-backlink"') >= 2
                )
                original = archive.read(footnote_member).decode("utf-8")
            replacement, count = re.subn(
                r'<p class="footnote-back"><a [^>]*role="doc-backlink"[^>]*>.*?</a></p>',
                "",
                original,
                count=1,
            )
            self.assertEqual(count, 1)
            self.builder._rewrite_zip_member(broken, footnote_member, replacement.encode("utf-8"))
            self.assertFalse(self.builder.inspect_epub(broken, first["metadata"])["note_links_valid"])


if __name__ == "__main__":
    unittest.main()
