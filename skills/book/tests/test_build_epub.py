from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from tests.support import SKILL_ROOT, clean_path, load_script, make_executable


class BuildEpubTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.builder = load_script("build_epub")

    def test_slug_generation_handles_ascii_non_latin_and_punctuation(self):
        self.assertEqual(self.builder.slugify_title("Twelve Accidents of History"), "twelve-accidents-of-history")
        self.assertEqual(self.builder.slugify_title("  Why?! / Months: A Story  "), "why-months-a-story")
        self.assertEqual(self.builder.slugify_title("תולדות הזמן"), "תולדות-הזמן")
        self.assertRegex(self.builder.slugify_title("///"), r"^book-[0-9a-f]{8}$")

    def test_collision_path_never_overwrites(self):
        with tempfile.TemporaryDirectory() as temp:
            destination = Path(temp)
            (destination / "my-book.epub").write_bytes(b"existing")
            (destination / "my-book-2.epub").write_bytes(b"existing")
            self.assertEqual(self.builder.collision_safe_path(destination, "my-book"), destination / "my-book-3.epub")

    def test_metadata_generation_requires_title_and_does_not_invent_creator(self):
        generated = self.builder.normalized_metadata({"title": "My Book", "lang": "en-US"})
        self.assertEqual(generated["title"], "My Book")
        self.assertRegex(generated["identifier"], r"^urn:uuid:")
        self.assertRegex(generated["modified"], r"Z$")
        self.assertNotIn("author", generated)
        self.assertNotIn("creator", generated)
        with self.assertRaises(ValueError):
            self.builder.normalized_metadata({"lang": "en-US"})

    def test_pandoc_failure_does_not_deliver_partial_epub(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = root / "bin"
            bin_dir.mkdir()
            make_executable(bin_dir / "pandoc", "echo 'deliberate pandoc failure' >&2; exit 9")
            make_executable(bin_dir / "epubcheck", "exit 0")
            manuscript = root / "manuscript.md"
            manuscript.write_text("# Chapter\n\nWords.\n", encoding="utf-8")
            metadata = root / "metadata.yaml"
            metadata.write_text('title: "Failure Book"\nlang: "en-US"\n', encoding="utf-8")
            css = root / "epub.css"
            css.write_text("body {}\n", encoding="utf-8")
            destination = root / "books"
            destination.mkdir()
            with self.assertRaises(self.builder.BuildError):
                self.builder.build_epub(
                    manuscript,
                    metadata,
                    css,
                    destination,
                    validate=True,
                    path_env=clean_path(bin_dir),
                    work_dir=root / "work",
                )
            self.assertEqual(list(destination.iterdir()), [])

    def test_epubcheck_error_does_not_deliver_partial_epub(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = root / "bin"
            bin_dir.mkdir()
            make_executable(
                bin_dir / "pandoc",
                "out=''; while [ \"$#\" -gt 0 ]; do "
                "if [ \"$1\" = '--output' ]; then shift; out=\"$1\"; fi; shift; done; "
                "mkdir -p \"$(dirname \"$out\")\"; touch \"$out\"; exit 0",
            )
            make_executable(bin_dir / "epubcheck", "echo 'Check finished with errors'; exit 1")
            manuscript = root / "manuscript.md"
            manuscript.write_text("# Chapter\n\nWords.\n", encoding="utf-8")
            metadata = root / "metadata.yaml"
            metadata.write_text('title: "Failure Book"\nlang: "en-US"\n', encoding="utf-8")
            css = root / "epub.css"
            css.write_text("body {}\n", encoding="utf-8")
            destination = root / "books"
            destination.mkdir()
            with self.assertRaises(self.builder.BuildError):
                self.builder.build_epub(
                    manuscript,
                    metadata,
                    css,
                    destination,
                    validate=True,
                    path_env=clean_path(bin_dir),
                    work_dir=root / "work",
                )
            self.assertEqual(list(destination.iterdir()), [])

    @unittest.skipUnless(shutil.which("pandoc"), "Pandoc required")
    def test_epubcheck_warning_is_a_blocking_release_gate(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = root / "bin"
            bin_dir.mkdir()
            (bin_dir / "pandoc").symlink_to(shutil.which("pandoc"))
            make_executable(
                bin_dir / "epubcheck",
                "echo 'Check finished with 0 errors and 1 warning'; exit 0",
            )
            manuscript = root / "manuscript.md"
            manuscript.write_text("# Chapter\n\nWords.\n", encoding="utf-8")
            metadata = root / "metadata.yaml"
            metadata.write_text('title: "Warning Book"\nlang: "en-US"\n', encoding="utf-8")
            css = root / "epub.css"
            css.write_text("body {}\n", encoding="utf-8")
            destination = root / "books"
            destination.mkdir()
            with self.assertRaisesRegex(self.builder.BuildError, "warning"):
                self.builder.build_epub(
                    manuscript,
                    metadata,
                    css,
                    destination,
                    path_env=clean_path(bin_dir),
                    work_dir=root / "work",
                )
            self.assertEqual(list(destination.iterdir()), [])

    def test_validation_is_mandatory_and_cli_has_no_bypass(self):
        parser = self.builder._parser()
        option_strings = {
            option
            for action in parser._actions
            for option in action.option_strings
        }
        self.assertNotIn("--no-validate", option_strings)

    @unittest.skipUnless(shutil.which("pandoc"), "Pandoc required")
    def test_silent_epubcheck_cannot_claim_zero_diagnostics(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = root / "bin"
            bin_dir.mkdir()
            (bin_dir / "pandoc").symlink_to(shutil.which("pandoc"))
            make_executable(bin_dir / "epubcheck", "exit 0")
            manuscript = root / "manuscript.md"
            manuscript.write_text("# Chapter\n\nWords.\n", encoding="utf-8")
            metadata = root / "metadata.yaml"
            metadata.write_text('title: "Silent Validator"\nlang: "en-US"\n', encoding="utf-8")
            css = root / "epub.css"
            css.write_text("body {}\n", encoding="utf-8")
            destination = root / "books"
            destination.mkdir()
            with self.assertRaisesRegex(self.builder.BuildError, "recognizable"):
                self.builder.build_epub(
                    manuscript, metadata, css, destination,
                    path_env=clean_path(bin_dir), work_dir=root / "work",
                )
            self.assertEqual(list(destination.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
