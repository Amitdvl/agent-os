from __future__ import annotations

import json
import hashlib
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest import mock

from tests.support import load_script


class WorkspaceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workspace = load_script("workspace")

    def test_create_initializes_unique_safe_workspace_and_state(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            first = self.workspace.create_workspace("History of Computing", root / "books", temp_root=root)
            second = self.workspace.create_workspace("History of Computing", root / "books", temp_root=root)

            self.assertNotEqual(first["workspace_path"], second["workspace_path"])
            created = Path(first["workspace_path"])
            self.assertTrue((created / ".codex-book-workspace").is_file())
            for relative in (
                "research/source-notes", "evidence", "chapters", "qa", "build",
                "run.json", "editorial-brief.md", "metadata.yaml", "continuity.md",
                "research/ledger.jsonl", "research/chronology.md",
                "research/open-questions.md", "research/reconnaissance-summary.md",
            ):
                self.assertTrue((created / relative).exists(), relative)
            state = json.loads((created / "run.json").read_text(encoding="utf-8"))
            self.assertEqual(state["schema_version"], 1)
            self.assertEqual(state["subject"], "History of Computing")
            self.assertEqual(state["current_phase"], "preflight")
            self.assertFalse(state["approved_conception"])
            self.assertEqual(state["workspace_path"], str(created.resolve()))
            self.assertEqual(state["destination_dir"], str((root / "books").resolve()))

    def test_update_is_atomic_and_records_gate_approval(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            state = self.workspace.create_workspace("Entropy", root / "books", temp_root=root)
            path = Path(state["workspace_path"])
            self.workspace.update_workspace(path, phase="reconnaissance")
            self.workspace.update_workspace(path, phase="conception")
            self.workspace.update_workspace(
                path, phase="editorial_gate",
                values={"working_title": "The Arrow and the Ledger"},
            )
            updated = self.workspace.update_workspace(
                path, phase="deep_research", approval_text="Proceed."
            )
            self.assertEqual(updated["current_phase"], "deep_research")
            self.assertTrue(updated["approved_conception"])
            self.assertEqual(updated["approval_text"], "Proceed.")
            self.assertIsNotNone(updated["approval_timestamp"])
            self.assertFalse((path / "run.json.tmp").exists())

    def test_phase_machine_rejects_skips_and_gate_bypass(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            state = self.workspace.create_workspace("Entropy", root / "books", temp_root=root)
            path = Path(state["workspace_path"])
            with self.assertRaises(ValueError):
                self.workspace.update_workspace(path, phase="deliver")
            with self.assertRaises(ValueError):
                self.workspace.update_workspace(path, approval_text="Proceed.")
            self.workspace.update_workspace(path, phase="reconnaissance")
            self.workspace.update_workspace(path, phase="conception")
            self.workspace.update_workspace(path, phase="editorial_gate")
            with self.assertRaises(ValueError):
                self.workspace.update_workspace(path, phase="deep_research")
            with self.assertRaises(ValueError):
                self.workspace.update_workspace(
                    path,
                    values={"current_phase": "deliver", "approved_conception": True},
                )

    def test_phase_machine_allows_validation_repair_loop(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            state = self.workspace.create_workspace("Repairs", root / "books", temp_root=root)
            path = Path(state["workspace_path"])
            for phase in self.workspace.PHASE_SEQUENCE[1:self.workspace.PHASE_SEQUENCE.index("epub_validate") + 1]:
                kwargs = {"approval_text": "Proceed."} if phase == "deep_research" else {}
                self.workspace.update_workspace(path, phase=phase, **kwargs)
            repaired = self.workspace.update_workspace(path, phase="epub_build")
            self.assertEqual(repaired["current_phase"], "epub_build")

    def test_update_rejects_unknown_phase_and_private_reasoning_keys(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            state = self.workspace.create_workspace("Entropy", root / "books", temp_root=root)
            path = Path(state["workspace_path"])
            with self.assertRaises(ValueError):
                self.workspace.update_workspace(path, phase="make_it_pop")
            with self.assertRaises(ValueError):
                self.workspace.update_workspace(path, values={"chain_of_thought": "private"})

    def test_cleanup_rejects_unrecognized_or_symlinked_paths(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            ordinary = root / "ordinary"
            ordinary.mkdir()
            with self.assertRaises(ValueError):
                self.workspace.cleanup_workspace(ordinary, require_delivered=False, force=True)

            state = self.workspace.create_workspace("A subject", root / "books", temp_root=root)
            real = Path(state["workspace_path"])
            link = root / "workspace-link"
            link.symlink_to(real, target_is_directory=True)
            with self.assertRaises(ValueError):
                self.workspace.cleanup_workspace(link, require_delivered=False, force=True)

    def test_cleanup_preserves_failed_and_requires_verified_delivery(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            state = self.workspace.create_workspace("A subject", root / "books", temp_root=root)
            path = Path(state["workspace_path"])
            self.workspace.update_workspace(path, phase="failed", values={"failure": {"message": "boom"}})
            with self.assertRaises(RuntimeError):
                self.workspace.cleanup_workspace(path, require_delivered=True)
            self.assertTrue(path.exists())

            delivered_state = self.workspace.create_workspace("Delivered", root / "books", temp_root=root)
            delivered_path = Path(delivered_state["workspace_path"])
            for phase in self.workspace.PHASE_SEQUENCE[1:self.workspace.PHASE_SEQUENCE.index("deliver") + 1]:
                kwargs = {"approval_text": "Proceed."} if phase == "deep_research" else {}
                self.workspace.update_workspace(delivered_path, phase=phase, **kwargs)

            final = root / "books" / "finished.epub"
            final.parent.mkdir(exist_ok=True)
            with zipfile.ZipFile(final, "w") as archive:
                archive.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)
                archive.writestr("META-INF/container.xml", '''<?xml version="1.0"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
<rootfiles><rootfile full-path="EPUB/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>''')
                archive.writestr("EPUB/content.opf", '''<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Finished</dc:title><dc:language>en-US</dc:language><dc:identifier>urn:test</dc:identifier><meta property="dcterms:modified">2026-08-24T00:00:00Z</meta></metadata>
<manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/></spine></package>''')
                archive.writestr("EPUB/nav.xhtml", '<html xmlns="http://www.w3.org/1999/xhtml"><body><nav><a href="c1.xhtml">Chapter</a></nav></body></html>')
                archive.writestr("EPUB/c1.xhtml", '<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Chapter</h1></body></html>')
            digest = hashlib.sha256(final.read_bytes()).hexdigest()
            revision_passes = {name: True for name in self.workspace.REQUIRED_REVISION_PASSES}
            (delivered_path / "build" / "build.json").write_text(json.dumps({
                "ok": True,
                "final_path": str(final.resolve()),
                "bytes": final.stat().st_size,
                "sha256": digest,
                "epubcheck_errors": 0,
                "epubcheck_warnings": 0,
            }), encoding="utf-8")
            self.workspace.update_workspace(
                delivered_path,
                phase="deliver",
                values={
                    "final_epub_path": str(final.resolve()),
                    "epubcheck_errors": 0,
                    "epubcheck_warnings": 0,
                    "revision_passes": revision_passes,
                },
            )
            completed = self.workspace.subprocess.CompletedProcess(
                ["epubcheck"], 0, stdout="No errors or warnings detected. EPUB is valid!", stderr=""
            )
            with mock.patch.object(self.workspace.shutil, "which", return_value="/fake/epubcheck"), mock.patch.object(
                self.workspace.subprocess, "run", return_value=completed
            ):
                result = self.workspace.cleanup_workspace(delivered_path, require_delivered=True)
            self.assertTrue(result["removed"])
            self.assertFalse(delivered_path.exists())

    def test_cleanup_rejects_forged_delivery_receipt(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            state = self.workspace.create_workspace("Forged", root / "books", temp_root=root)
            path = Path(state["workspace_path"])
            final = root / "books" / "forged.epub"
            final.parent.mkdir(exist_ok=True)
            with zipfile.ZipFile(final, "w") as archive:
                archive.writestr("mimetype", "application/epub+zip")
                archive.writestr("META-INF/container.xml", "<container/>")
            current = json.loads((path / "run.json").read_text(encoding="utf-8"))
            current.update({
                "current_phase": "deliver",
                "final_epub_path": str(final),
                "epubcheck_errors": 0,
                "epubcheck_warnings": 0,
                "revision_passes": {name: True for name in self.workspace.REQUIRED_REVISION_PASSES},
            })
            (path / "run.json").write_text(json.dumps(current), encoding="utf-8")
            digest = hashlib.sha256(final.read_bytes()).hexdigest()
            (path / "build" / "build.json").write_text(json.dumps({
                "ok": True, "final_path": str(final.resolve()),
                "bytes": final.stat().st_size, "sha256": digest,
                "epubcheck_errors": 0, "epubcheck_warnings": 0,
            }), encoding="utf-8")
            with self.assertRaises(RuntimeError):
                self.workspace.cleanup_workspace(path, require_delivered=True)
            self.assertTrue(path.exists())


if __name__ == "__main__":
    unittest.main()
