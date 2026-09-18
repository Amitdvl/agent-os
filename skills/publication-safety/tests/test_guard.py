import os
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
        self.assertIn("history: path-sha256=", history.stdout)
        self.assertIn("github-token", history.stdout)
        self.assertNotIn("key.txt", history.stdout)

    def test_sensitive_path_and_install_conflicts(self):
        (self.repo / ".env.local").write_text("harmless")
        self.git("add", ".env.local")
        self.assertIn("sensitive-path", self.run_guard("scan", "--scope", "staged").stdout)
        self.git("reset", "-q")
        installed = self.run_guard("install")
        self.assertEqual(installed.returncode, 0, installed.stderr)
        self.assertTrue((self.repo / ".githooks/pre-commit").exists())
        self.assertTrue((self.repo / ".githooks/commit-msg").exists())
        self.assertIn("Never bypass hooks", (self.repo / "AGENTS.md").read_text())
        self.assertEqual(self.git("config", "--local", "--get", "core.hooksPath").stdout.strip(), b".githooks")
        self.assertEqual(self.run_guard("install").returncode, 2)

    def test_ignored_local_env_is_review_notice_not_publication_blob(self):
        (self.repo / ".gitignore").write_text(".env.local\n")
        (self.repo / ".env.local").write_text("private local config")
        result = self.run_guard("scan", "--scope", "worktree")
        self.assertEqual(result.returncode, 0)
        self.assertIn("ignored-local: path-sha256=", result.stdout)
        self.assertIn("confirm-never-published", result.stdout)
        self.assertNotIn(".env.local", result.stdout)

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

    def test_installed_commit_message_hook_blocks_secret(self):
        self.assertEqual(self.run_guard("install").returncode, 0)
        (self.repo / "README.md").write_text("harmless\n")
        self.git("add", "README.md")
        token = "ghp_" + "F" * 36
        result = subprocess.run(["git", "-C", str(self.repo), "commit", "-m", token], text=True, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("commit-message", result.stdout + result.stderr)
        self.assertNotIn(token, result.stdout + result.stderr)

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

    def test_metadata_and_historical_aliases_are_scanned(self):
        token = "ghp_" + "D" * 36
        (self.repo / "safe.txt").write_text("harmless")
        self.git("add", "safe.txt")
        self.git("commit", "-qm", "fixture")
        self.git("commit", "--allow-empty", "-qm", token)
        self.git("tag", "-a", "review-tag", "-m", token)
        (self.repo / ".env.local").write_text("harmless")
        self.git("add", ".env.local")
        self.git("commit", "-qm", "historical name")
        self.git("rm", "-q", ".env.local")
        self.git("commit", "-qm", "remove alias")
        result = self.run_guard("scan", "--scope", "history")
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertIn("history-metadata", result.stdout)
        self.assertIn("history-path", result.stdout)
        self.assertIn("sensitive-path", result.stdout)
        self.assertNotIn(token, result.stdout + result.stderr)
        self.assertNotIn(".env.local", result.stdout)

    def test_annotated_tag_message_is_scanned(self):
        (self.repo / "README.md").write_text("harmless\n")
        self.git("add", "README.md")
        self.git("commit", "-qm", "fixture")
        token = "ghp_" + "G" * 36
        self.git("tag", "-a", "review-tag", "-m", token)
        result = self.run_guard("scan", "--scope", "history")
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertIn("history-metadata", result.stdout)
        self.assertIn("github-token", result.stdout)
        self.assertNotIn(token, result.stdout + result.stderr)

    def test_lfs_pointer_and_sensitive_filename_block_without_echo(self):
        pointer = "version https://git-lfs.github.com/spec/v1\noid sha256:" + "a" * 64 + "\nsize 5\n"
        (self.repo / "artifact.bin").write_text(pointer)
        token = "ghp_" + "E" * 36
        (self.repo / token).write_text("harmless")
        self.git("add", ".")
        result = self.run_guard("scan", "--scope", "staged")
        self.assertEqual(result.returncode, 1)
        self.assertIn("lfs-payload-unreviewed", result.stdout)
        self.assertIn("sensitive-filename", result.stdout)
        self.assertNotIn(token, result.stdout + result.stderr)

    def test_staged_symlink_requires_review(self):
        (self.repo / "linked").symlink_to("private-target")
        self.git("add", "linked")
        result = self.run_guard("scan", "--scope", "staged")
        self.assertEqual(result.returncode, 1)
        self.assertIn("symlink-review", result.stdout)
        self.assertNotIn("private-target", result.stdout)

    def test_common_connection_assignment_blocks(self):
        (self.repo / "settings.example").write_text("DATABASE_URL=postgres://fixture:secret@example.invalid/db\n")
        self.git("add", "settings.example")
        result = self.run_guard("scan", "--scope", "staged")
        self.assertEqual(result.returncode, 1)
        self.assertIn("credential-assignment", result.stdout)
        self.assertNotIn("postgres://", result.stdout)

    def test_shallow_history_fails_closed(self):
        (self.repo / "README.md").write_text("first\n")
        self.git("add", "README.md")
        self.git("commit", "-qm", "first")
        (self.repo / "README.md").write_text("second\n")
        self.git("commit", "-qam", "second")
        clone = self.repo / "shallow-clone"
        subprocess.run(["git", "clone", "-q", "--depth=1", self.repo.as_uri(), str(clone)], check=True)
        result = subprocess.run([sys.executable, str(GUARD), "scan", "--repo", str(clone), "--scope", "history"], text=True, capture_output=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn("publication guard incomplete", result.stderr)

    def test_install_refuses_inherited_hook_path(self):
        config = self.repo / "global.gitconfig"
        config.write_text("[core]\n\thooksPath = /tmp/existing-hooks\n")
        environment = os.environ.copy()
        environment["GIT_CONFIG_GLOBAL"] = str(config)
        result = subprocess.run([sys.executable, str(GUARD), "install", "--repo", str(self.repo)], text=True, capture_output=True, env=environment)
        self.assertEqual(result.returncode, 2)
        self.assertFalse((self.repo / ".githooks").exists())


if __name__ == "__main__":
    unittest.main()
