from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tests.support import SKILL_ROOT, load_script


VALID = """---
title: "A Test Book"
lang: "en-US"
identifier: "urn:uuid:aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
---

# Introduction

One two three four five six seven eight nine ten.

# Chapter One

Alpha beta gamma delta epsilon zeta eta theta iota kappa.[^ch1-01]

[^ch1-01]: A complete note.

# Bibliography and Further Reading

- A useful source.
"""


class ManuscriptChecksTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.checks = load_script("manuscript_checks")

    def _check(self, text: str, minimum: int = 1, maximum: int = 1000):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "manuscript.md"
            path.write_text(text, encoding="utf-8")
            return self.checks.check_manuscript(path, target_min=minimum, target_max=maximum)

    def test_counts_only_main_body_and_reports_chapters(self):
        report = self._check(VALID)
        self.assertTrue(report["ok"], report)
        self.assertEqual(report["body_word_count"], 20)
        self.assertEqual(report["chapter_count"], 2)
        self.assertEqual(report["per_chapter_word_count"]["Introduction"], 10)
        self.assertEqual(report["per_chapter_word_count"]["Chapter One"], 10)

    def test_out_of_range_missing_bibliography_and_unresolved_markers_are_errors(self):
        text = VALID.replace("# Bibliography and Further Reading\n\n- A useful source.\n", "")
        text = text.replace("Alpha beta", "TODO Alpha beta")
        report = self._check(text, minimum=100, maximum=200)
        codes = {item["code"] for item in report["findings"] if item["severity"] == "error"}
        self.assertIn("body_word_count_out_of_range", codes)
        self.assertIn("missing_bibliography", codes)
        self.assertIn("unresolved_marker", codes)

    def test_heading_duplicate_paragraph_sentence_and_empty_section_findings(self):
        text = VALID.replace(
            "# Chapter One\n\nAlpha beta gamma delta epsilon zeta eta theta iota kappa.[^ch1-01]",
            "# Chapter One\n\nA deliberately repeated sentence contains enough separate words to trigger detection.\n\nA paragraph repeated exactly for mechanical detection.\n\nA paragraph repeated exactly for mechanical detection.\n\n## Empty section\n\n## Deep section\n\n### Skipped child\n\n# Chapter One\n\nA deliberately repeated sentence contains enough separate words to trigger detection."
        )
        report = self._check(text)
        codes = {item["code"] for item in report["findings"]}
        self.assertIn("duplicate_heading", codes)
        self.assertIn("duplicate_paragraph", codes)
        self.assertIn("repeated_sentence", codes)
        self.assertIn("empty_section", codes)

    def test_footnote_integrity_notes_chapter_links_html_and_metadata(self):
        text = VALID.replace("[^ch1-01]", "[^missing]", 1)
        text += "\n# Notes\n\nDuplicated notes.\n\n[Bad](#not-a-real-heading)\n\n<div>raw</div>\n"
        text = text.replace('lang: "en-US"', 'lang: "not a language tag"')
        report = self._check(text)
        errors = {item["code"] for item in report["findings"] if item["severity"] == "error"}
        warnings = {item["code"] for item in report["findings"] if item["severity"] == "warning"}
        self.assertIn("footnote_reference_missing_definition", errors)
        self.assertIn("footnote_definition_without_reference", errors)
        self.assertIn("manual_notes_chapter", errors)
        self.assertIn("invalid_internal_link", errors)
        self.assertIn("invalid_metadata", errors)
        self.assertIn("raw_html", warnings)

    def test_report_has_stable_json_shape(self):
        report = self._check(VALID)
        self.assertEqual(report["schema_version"], 1)
        self.assertIn("summary", report)
        self.assertIn("errors", report["summary"])
        self.assertIn("warnings", report["summary"])
        self.assertIsInstance(report["findings"], list)

    def test_external_metadata_heading_attributes_and_autolinks_are_supported(self):
        text = VALID.split("---\n", 2)[2]
        text = text.replace(
            "# Bibliography and Further Reading",
            "# Selected Bibliography {.unnumbered}",
        ).replace("A useful source.", "A useful source, <https://example.com/source>.")
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            manuscript = root / "manuscript.md"
            manuscript.write_text(text, encoding="utf-8")
            metadata = root / "metadata.yaml"
            metadata.write_text(
                'title: "External Title"\nlang: "en-US"\nidentifier: "urn:test"\n',
                encoding="utf-8",
            )
            report = self.checks.check_manuscript(
                manuscript,
                target_min=1,
                target_max=1000,
                metadata_path=metadata,
            )
        self.assertTrue(report["ok"], report)
        self.assertEqual(report["title"], "External Title")
        self.assertNotIn("raw_html", {item["code"] for item in report["findings"]})


if __name__ == "__main__":
    unittest.main()
