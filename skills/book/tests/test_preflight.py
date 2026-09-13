from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from tests.support import SKILL_ROOT, clean_path, load_script, make_executable


class PreflightTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.preflight = load_script("preflight")

    def _fake_tools(self, root: Path) -> Path:
        bin_dir = root / "fake bin"
        bin_dir.mkdir()
        make_executable(bin_dir / "pandoc", "echo 'pandoc 3.7.0'")
        make_executable(bin_dir / "epubcheck", "echo 'EPUBCheck v5.2.1'")
        return bin_dir

    def _fake_skill(self, root: Path) -> Path:
        skill = root / "skill"
        for relative in (
            "SKILL.md", "README.md", "agents/openai.yaml",
            "references/editorial-standard.md", "references/research-standard.md",
            "references/prose-style.md", "references/revision-and-qa.md",
            "references/epub-standard.md", "scripts/preflight.py",
            "scripts/workspace.py", "scripts/manuscript_checks.py",
            "scripts/build_epub.py", "assets/epub.css",
        ):
            path = skill / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("fixture\n", encoding="utf-8")
        return skill

    def test_detects_executables_and_creates_destination_with_spaces(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = self._fake_tools(root)
            skill_root = self._fake_skill(root)
            destination = root / "Books With Spaces"
            result = self.preflight.run_preflight(
                destination,
                skill_root=skill_root,
                path_env=clean_path(bin_dir),
                temp_dir=root,
            )
            self.assertTrue(result["ok"], result)
            self.assertTrue(destination.is_dir())
            self.assertEqual(result["pandoc"]["version"], "pandoc 3.7.0")
            self.assertEqual(result["epubcheck"]["mode"], "executable")
            self.assertTrue(result["destination_writable"])

    def test_missing_tools_are_blocking_errors(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = root / "empty-bin"
            bin_dir.mkdir()
            skill_root = self._fake_skill(root)
            result = self.preflight.run_preflight(
                root / "books",
                skill_root=skill_root,
                path_env=str(bin_dir),
                temp_dir=root,
            )
            self.assertFalse(result["ok"])
            self.assertIsNone(result["pandoc"])
            self.assertIsNone(result["epubcheck"])
            self.assertTrue(any("Pandoc" in item for item in result["errors"]))
            self.assertTrue(any("EPUBCheck" in item for item in result["errors"]))

    def test_detects_configured_epubcheck_jar_mode(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = root / "bin"
            bin_dir.mkdir()
            make_executable(bin_dir / "pandoc", "echo 'pandoc 3.7.0'")
            make_executable(bin_dir / "java", "echo 'EPUBCheck v5.3.0'")
            jar = root / "epubcheck.jar"
            jar.write_bytes(b"placeholder")
            skill_root = self._fake_skill(root)
            result = self.preflight.run_preflight(
                root / "books",
                skill_root=skill_root,
                path_env=str(bin_dir),
                temp_dir=root,
                epubcheck_jar=jar,
            )
            self.assertTrue(result["ok"], result)
            self.assertEqual(result["epubcheck"]["mode"], "jar")
            self.assertEqual(result["epubcheck"]["path"], str(jar.resolve()))
            self.assertEqual(result["epubcheck"]["version"], "EPUBCheck v5.3.0")

    def test_rejects_unusable_epubcheck_jar_invocation(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = root / "bin"
            bin_dir.mkdir()
            make_executable(bin_dir / "pandoc", "echo 'pandoc 3.7.0'")
            make_executable(bin_dir / "java", "echo 'Invalid or corrupt jarfile' >&2; exit 1")
            jar = root / "epubcheck.jar"
            jar.write_bytes(b"not a jar")
            result = self.preflight.run_preflight(
                root / "books",
                skill_root=self._fake_skill(root),
                path_env=str(bin_dir),
                temp_dir=root,
                epubcheck_jar=jar,
            )
            self.assertFalse(result["ok"])
            self.assertIsNone(result["epubcheck"])
            self.assertTrue(any("JAR invocation" in item for item in result["errors"]))

    def test_rejects_silent_epubcheck_executable(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = root / "bin"
            bin_dir.mkdir()
            make_executable(bin_dir / "pandoc", "echo 'pandoc 3.7.0'")
            make_executable(bin_dir / "epubcheck", "exit 0")
            result = self.preflight.run_preflight(
                root / "books",
                skill_root=self._fake_skill(root),
                path_env=str(bin_dir),
                temp_dir=root,
            )
            self.assertFalse(result["ok"])
            self.assertIsNone(result["epubcheck"])
            self.assertTrue(any("version probe failed" in item for item in result["errors"]))

    def test_unwritable_or_invalid_destination_is_blocking(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = self._fake_tools(root)
            skill_root = self._fake_skill(root)
            parent_file = root / "not-a-directory"
            parent_file.write_text("x", encoding="utf-8")
            result = self.preflight.run_preflight(
                parent_file / "books",
                skill_root=skill_root,
                path_env=clean_path(bin_dir),
                temp_dir=root,
            )
            self.assertFalse(result["ok"])
            self.assertFalse(result["destination_writable"])
            self.assertTrue(any("destination" in item.lower() for item in result["errors"]))

    def test_cli_emits_json_and_useful_exit_codes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = self._fake_tools(root)
            skill_root = self._fake_skill(root)
            command = [
                sys.executable,
                str(SKILL_ROOT / "scripts" / "preflight.py"),
                "--destination", str(root / "books"),
                "--skill-root", str(skill_root),
                "--json",
            ]
            env = {"PATH": clean_path(bin_dir), "TMPDIR": str(root)}
            completed = subprocess.run(command, text=True, capture_output=True, env=env, check=False)
            self.assertEqual(completed.returncode, 0, completed.stderr)
            payload = json.loads(completed.stdout)
            self.assertTrue(payload["ok"])

    def test_missing_required_skill_file_is_blocking(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = self._fake_tools(root)
            skill_root = self._fake_skill(root)
            (skill_root / "references" / "research-standard.md").unlink()
            result = self.preflight.run_preflight(
                root / "books",
                skill_root=skill_root,
                path_env=clean_path(bin_dir),
                temp_dir=root,
            )
            self.assertFalse(result["ok"])
            self.assertTrue(any("research-standard.md" in item for item in result["errors"]))


if __name__ == "__main__":
    unittest.main()
