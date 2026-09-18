import pathlib
import subprocess
import sys
import tempfile
import unittest

GUARD = pathlib.Path(__file__).resolve().parents[1] / "scripts/guard.py"


class GuardTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = pathlib.Path(self.temp.name)
        self.git("init", "-q")
        self.git("config", "user.name", "Fixture")
        self.git("config", "user.email", "fixture@example.invalid")

    def git(self, *args):
        return subprocess.run(["git", "-C", str(self.repo), *args], check=True, capture_output=True)

    def run_guard(self, *args):
        return subprocess.run([sys.executable, str(GUARD), *args, "--repo", str(self.repo)], text=True, capture_output=True)

    def test_staged_and_history_redact_value(self):
        token = "ghp_" + "A" * 36
        (self.repo / "key.txt").write_text(token)
        self.git("add", "key.txt")
        staged = self.run_guard("scan", "--scope", "staged")
        self.assertEqual(staged.returncode, 1)
        self.assertIn("github-token", staged.stdout)
        self.assertNotIn(token, staged.stdout + staged.stderr)
        self.git("commit", "-qm", "fixture")
        (self.repo / "key.txt").write_text("safe")
        self.git("add", "key.txt")
        self.git("commit", "-qm", "remove fixture")
        history = self.run_guard("scan", "--scope", "history")
        self.assertEqual(history.returncode, 1)
        self.assertIn("history: key.txt: github-token", history.stdout)

    def test_sensitive_path_and_install_conflicts(self):
        (self.repo / ".env.local").write_text("harmless")
        self.git("add", ".env.local")
        self.assertIn("sensitive-path", self.run_guard("scan", "--scope", "staged").stdout)
        self.git("reset", "-q")
        installed = self.run_guard("install")
        self.assertEqual(installed.returncode, 0, installed.stderr)
        self.assertTrue((self.repo / ".githooks/pre-commit").exists())
        self.assertIn("Never bypass hooks", (self.repo / "AGENTS.md").read_text())
        self.assertEqual(self.git("config", "--local", "--get", "core.hooksPath").stdout.strip(), b".githooks")
        self.assertEqual(self.run_guard("install").returncode, 2)

    def test_ignored_local_env_is_review_notice_not_publication_blob(self):
        (self.repo / ".gitignore").write_text(".env.local\n")
        (self.repo / ".env.local").write_text("private local config")
        result = self.run_guard("scan", "--scope", "worktree")
        self.assertEqual(result.returncode, 0)
        self.assertIn("ignored-local: .env.local: confirm-never-published", result.stdout)

    def test_clean_fixture_and_oversized_fail_closed(self):
        (self.repo / "README.md").write_text("Public sample with no secrets.\n")
        self.git("add", "README.md")
        self.assertEqual(self.run_guard("scan", "--scope", "all").returncode, 0)
        (self.repo / "big.bin").write_bytes(b"x" * (5 * 1024 * 1024 + 1))
        self.git("add", "big.bin")
        self.assertIn("oversized-unreviewed", self.run_guard("scan", "--scope", "staged").stdout)

    def test_install_preserves_existing_agent_instructions(self):
        (self.repo / "AGENTS.md").write_text("# Existing project rule\n")
        self.assertEqual(self.run_guard("install").returncode, 0)
        content = (self.repo / "AGENTS.md").read_text()
        self.assertIn("# Existing project rule", content)
        self.assertIn("## Publication safety", content)

    def test_install_refuses_unrelated_executable_hook(self):
        hooks = pathlib.Path(self.git("rev-parse", "--git-path", "hooks").stdout.decode().strip())
        if not hooks.is_absolute():
            hooks = self.repo / hooks
        hooks.mkdir(parents=True, exist_ok=True)
        existing = hooks / "commit-msg"
        existing.write_text("#!/bin/sh\nexit 0\n")
        existing.chmod(0o755)
        self.assertEqual(self.run_guard("install").returncode, 2)
        self.assertFalse((self.repo / ".githooks").exists())

    def test_installed_pre_commit_blocks_secret(self):
        self.assertEqual(self.run_guard("install").returncode, 0)
        (self.repo / "token.txt").write_text("ghp_" + "B" * 36)
        self.git("add", "token.txt")
        result = subprocess.run(["git", "-C", str(self.repo), "commit", "-m", "must fail"], text=True, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("github-token", result.stdout + result.stderr)
        self.assertNotIn("B" * 36, result.stdout + result.stderr)

    def test_outgoing_detects_unreferenced_commit(self):
        (self.repo / "token.txt").write_text("ghp_" + "C" * 36)
        self.git("add", "token.txt")
        tree = self.git("write-tree").stdout.decode().strip()
        commit = self.git("commit-tree", tree, "-m", "unreferenced secret fixture").stdout.decode().strip()
        self.assertEqual(self.run_guard("scan", "--scope", "history").returncode, 0)
        update = f"refs/heads/temp {commit} refs/heads/temp {'0' * 40}\n"
        result = subprocess.run([sys.executable, str(GUARD), "scan", "--repo", str(self.repo), "--scope", "outgoing"], input=update, text=True, capture_output=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("github-token", result.stdout)


if __name__ == "__main__":
    unittest.main()
