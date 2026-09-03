import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "ctx7_guard.py"
REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_FILE = "src/demo.tsx"


def run_hook(payload: dict, state_path: Path, config_path: Path | None = None) -> dict:
    env = os.environ.copy()
    env["CTX7_GUARD_STATE_PATH"] = str(state_path)
    if config_path is not None:
        env["CTX7_GUARD_CONFIG_PATH"] = str(config_path)
    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH)],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        env=env,
        check=False,
    )
    if result.returncode != 0:
        raise AssertionError(result.stderr or f"hook exited with {result.returncode}")
    return json.loads(result.stdout or "{}")


def command_payload(command: str) -> dict:
    return {"tool_input": {"command": command, "cwd": str(REPO_ROOT)}}


def patch_payload(*added_lines: str) -> dict:
    return {
        "tool_name": "apply_patch",
        "tool_input": {
            "input": "\n".join(
                [
                    "*** Begin Patch",
                    f"*** Update File: {DEMO_FILE}",
                    "@@",
                    *[f"+{line}" for line in added_lines],
                    "*** End Patch",
                ]
            )
        },
    }


class Ctx7GuardTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.state_path = Path(self.temp_dir.name) / "ctx7-guard-state.json"

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def write_config(self, config: dict) -> Path:
        config_path = Path(self.temp_dir.name) / "ctx7-guard-config.json"
        config_path.write_text(json.dumps(config), encoding="utf-8")
        return config_path

    def test_matching_docs_unlock_configured_dependency(self) -> None:
        self.assertEqual(run_hook(command_payload("ctx7 library react-query tanstack"), self.state_path), {})
        self.assertEqual(
            run_hook(command_payload("ctx7 docs /tanstack/query/latest queryclient"), self.state_path),
            {},
        )
        self.assertEqual(run_hook(command_payload("bun add @tanstack/react-query"), self.state_path), {})

    def test_mismatched_docs_do_not_unlock_pending_topic(self) -> None:
        self.assertEqual(run_hook(command_payload("ctx7 library react-query tanstack"), self.state_path), {})
        self.assertEqual(
            run_hook(command_payload("ctx7 docs /openai/openai-python responses api"), self.state_path),
            {},
        )

        response = run_hook(command_payload("bun add @tanstack/react-query"), self.state_path)

        self.assertEqual(response.get("permissionDecision"), "deny")
        self.assertIn("@tanstack/react-query", response.get("message", ""))

    def test_mismatched_docs_clear_stale_pending_state(self) -> None:
        self.assertEqual(run_hook(command_payload("ctx7 library react-query tanstack"), self.state_path), {})
        self.assertEqual(
            run_hook(command_payload("ctx7 docs /openai/openai-python responses api"), self.state_path),
            {},
        )
        self.assertEqual(
            run_hook(command_payload("ctx7 docs /acme/widgets/latest install"), self.state_path),
            {},
        )

        response = run_hook(command_payload("bun add @tanstack/react-query"), self.state_path)

        self.assertEqual(response.get("permissionDecision"), "deny")
        self.assertIn("@tanstack/react-query", response.get("message", ""))

    def test_unconfigured_dependency_install_requires_docs(self) -> None:
        response = run_hook(command_payload("bun add left-pad"), self.state_path)

        self.assertEqual(response.get("permissionDecision"), "deny")
        self.assertIn("left-pad", response.get("message", ""))

    def test_unconfigured_dependency_install_unlocks_after_lookup_chain(self) -> None:
        self.assertEqual(run_hook(command_payload("ctx7 library left-pad formatting"), self.state_path), {})
        self.assertEqual(
            run_hook(command_payload("ctx7 docs /left-pad/left-pad/latest usage"), self.state_path),
            {},
        )
        self.assertEqual(run_hook(command_payload("bun add left-pad"), self.state_path), {})

    def test_multi_package_install_requires_docs_for_each_target(self) -> None:
        self.assertEqual(run_hook(command_payload("ctx7 library left-pad formatting"), self.state_path), {})
        self.assertEqual(
            run_hook(command_payload("ctx7 docs /left-pad/left-pad/latest usage"), self.state_path),
            {},
        )

        response = run_hook(command_payload("bun add left-pad openai"), self.state_path)

        self.assertEqual(response.get("permissionDecision"), "deny")
        self.assertIn("openai", response.get("message", ""))

    def test_blocks_apply_patch_that_adds_unconfigured_external_import_without_docs(self) -> None:
        response = run_hook(
            patch_payload('import { format } from "date-fns";'),
            self.state_path,
        )

        self.assertEqual(response.get("permissionDecision"), "deny")
        self.assertIn("date-fns", response.get("message", ""))

    def test_matching_docs_unlock_unconfigured_external_import_patch(self) -> None:
        self.assertEqual(run_hook(command_payload("ctx7 library date-fns formatting"), self.state_path), {})
        self.assertEqual(
            run_hook(command_payload("ctx7 docs /date-fns/date-fns/latest format"), self.state_path),
            {},
        )
        self.assertEqual(
            run_hook(
                patch_payload('import { format } from "date-fns";'),
                self.state_path,
            ),
            {},
        )

    def test_local_import_patch_stays_allowed(self) -> None:
        self.assertEqual(run_hook(patch_payload('import { cn } from "@/lib/utils";'), self.state_path), {})

    def test_python_stdlib_import_patch_stays_allowed(self) -> None:
        self.assertEqual(run_hook(patch_payload("import json"), self.state_path), {})
        self.assertEqual(run_hook(patch_payload("from pathlib import Path"), self.state_path), {})

    def test_node_builtin_import_patch_stays_allowed(self) -> None:
        self.assertEqual(run_hook(patch_payload('import path from "node:path";'), self.state_path), {})

    def test_topic_mappings_key_supports_alias_matching(self) -> None:
        config_path = self.write_config(
            {
                "topicMappings": {
                    "@tanstack/react-query": [
                        "@tanstack/react-query",
                        "react-query",
                        "/tanstack/query/latest",
                    ]
                }
            }
        )

        self.assertEqual(
            run_hook(command_payload("ctx7 library react-query tanstack"), self.state_path, config_path),
            {},
        )
        self.assertEqual(
            run_hook(
                command_payload("ctx7 docs /tanstack/query/latest queryclient"),
                self.state_path,
                config_path,
            ),
            {},
        )
        self.assertEqual(
            run_hook(command_payload("bun add @tanstack/react-query"), self.state_path, config_path),
            {},
        )

    def test_legacy_guarded_topics_key_still_supported(self) -> None:
        config_path = self.write_config({"guardedTopics": {"date-fns": ["date-fns"]}})

        self.assertEqual(
            run_hook(command_payload("ctx7 library date-fns formatting"), self.state_path, config_path),
            {},
        )
        self.assertEqual(
            run_hook(
                command_payload("ctx7 docs /date-fns/date-fns/latest format"),
                self.state_path,
                config_path,
            ),
            {},
        )
        self.assertEqual(
            run_hook(
                patch_payload('import { format } from "date-fns";'),
                self.state_path,
                config_path,
            ),
            {},
        )


if __name__ == "__main__":
    unittest.main()
