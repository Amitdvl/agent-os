"""Contract tests. Native human/goal events here are fixtures, never live consent."""
import importlib.util
import io
import json
import multiprocessing
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

SOURCE = Path(os.environ.get("CONTINUATION_GUARD_SOURCE", Path(__file__).parents[1] / "scripts/continuation_guard.py"))
spec = importlib.util.spec_from_file_location("continuation_guard", SOURCE)
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)
RUNTIME = {"pid": 123, "started": "fixture-start", "executable": "/fixture/codex"}


def contender(path, request, barrier, queue):
    barrier.wait()
    try:
        result = guard.execute("begin", path, request, wall=1004, monotonic=504,
                               identity=lambda: dict(RUNTIME))
        queue.put(("ok", result))
    except guard.Refused as error:
        queue.put(("refused", str(error)))


class GuardContract(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="continuation-contract-")
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name).resolve() / "work" / "approved-continuation" / "run.json"
        self.request = {"thread_id": "fixture-thread", "objective": "Verify disposable fixture",
                        "scope": "Only the disposable fixture", "done": "Fixture has verified result"}
        self.wall, self.mono = 1000, 500
        self.identity = lambda: dict(RUNTIME)

    def run_guard(self, command, request=None, **clocks):
        return guard.execute(command, self.path, request or {},
                             wall=clocks.get("wall", self.wall),
                             monotonic=clocks.get("monotonic", self.mono), identity=self.identity)

    def propose(self, **limits):
        self.proposal = self.run_guard("propose", self.request | limits)
        self.reply = {"source": "native_user_input", "role": "user", "question_id": "fixture-question",
                      "thread_id": self.request["thread_id"],
                      "proposal_hash": self.proposal["proposal_hash"], "answer": "Approve"}
        self.native = {"objective": self.proposal["native_objective"], "status": "active", "tokenBudget": limits.get("token_budget")}
        self.gate = {"thread_id": self.request["thread_id"], "proposal_hash": self.proposal["proposal_hash"], "native_goal": self.native}
        return self.proposal

    def approved(self, **limits):
        self.propose(**limits)
        self.run_guard("bind", {"question_id": self.reply["question_id"]})
        self.run_guard("authorize", self.reply)

    def active(self, **limits):
        self.approved(**limits)
        self.run_guard("activate", {"thread_id": self.request["thread_id"], "native_goal": self.native})

    def begin(self, action="Inspect fixture", evidence="initial"):
        return self.run_guard("begin", self.gate | {"action": action, "input_evidence": evidence})

    def finish(self, cycle, outcome="progress"):
        return self.run_guard("finish", self.gate | {"cycle_id": cycle, "outcome": outcome, "evidence": "Disposable result checked"})

    def state(self):
        return json.loads(self.path.read_text())

    def assert_refused_unchanged(self, command, request, message, **clocks):
        before = self.path.read_bytes()
        with self.assertRaisesRegex(guard.Refused, message):
            self.run_guard(command, request, **clocks)
        self.assertEqual(self.path.read_bytes(), before, "Rejected input changed durable authorization/accounting")

    def test_default_proposal_is_not_authorization(self):
        p = self.propose()
        self.assertEqual((p["proposal"]["max_cycles"], p["proposal"]["max_seconds"], p["proposal"]["token_budget"]), (5, 1200, None))
        self.assertEqual(p["proposal"]["expires"], 1600)
        self.assertIn("fixture-thread", p["question"])
        self.assertIn("cannot cancel an in-flight tool call", p["question"])
        self.assertLessEqual(len(p["native_objective"]), 4000)
        self.assert_refused_unchanged("activate", {"thread_id": "fixture-thread", "native_goal": self.native}, "explicit approval")
        self.assert_refused_unchanged("begin", self.gate | {"action": "work"}, "not active")

    def test_missing_state_fails_closed(self):
        with self.assertRaisesRegex(guard.Refused, "no proposal"):
            self.run_guard("begin", {})
        self.assertFalse(self.path.exists())

    def test_bound_question_and_exact_fresh_human_reply_required(self):
        self.propose()
        self.assert_refused_unchanged("authorize", self.reply, "question mismatch")
        self.run_guard("bind", {"question_id": "fixture-question"})
        for field, value, error in [("source", "file", "trusted native"), ("role", "assistant", "trusted native"),
                                    ("question_id", "old-question", "question mismatch"),
                                    ("thread_id", "other-thread", "scope/proposal"),
                                    ("proposal_hash", "old-hash", "scope/proposal"),
                                    ("answer", "", "explicit affirmative"), ("answer", "Approve with 99 cycles", "explicit affirmative")]:
            with self.subTest(field=field, value=value):
                self.assert_refused_unchanged("authorize", self.reply | {field: value}, error)
        self.assertEqual(self.run_guard("authorize", self.reply)["status"], "authorized")

    def test_decline_is_terminal_and_does_not_grant_work(self):
        self.propose()
        self.run_guard("bind", {"question_id": "fixture-question"})
        result = self.run_guard("authorize", self.reply | {"answer": "Decline"})
        self.assertEqual((result["status"], result["native_action"]), ("denied", None))
        self.assert_refused_unchanged("authorize", self.reply, "consumed")
        self.assert_refused_unchanged("activate", {"thread_id": "fixture-thread", "native_goal": self.native}, "explicit approval")

    def test_approval_expires_at_boundary_and_cannot_be_replayed(self):
        self.propose()
        self.run_guard("bind", {"question_id": "fixture-question"})
        self.assert_refused_unchanged("authorize", self.reply, "expired", wall=1600)
        self.run_guard("authorize", self.reply, wall=1599)
        self.assert_refused_unchanged("authorize", self.reply, "consumed", wall=1599)
        self.assert_refused_unchanged("activate", {"thread_id": "fixture-thread", "native_goal": self.native}, "expired", wall=1600)

    def test_question_cannot_rebind_or_bind_after_expiry(self):
        self.propose()
        self.assert_refused_unchanged("bind", {"question_id": "fixture-question"}, "expired", wall=1600)
        self.run_guard("bind", {"question_id": "fixture-question"})
        self.assert_refused_unchanged("bind", {"question_id": "new-question"}, "already bound")

    def test_native_activation_readback_includes_thread_text_status_and_cap(self):
        self.approved(token_budget=2000)
        for field, value in [("objective", "wrong objective"), ("status", "paused"), ("tokenBudget", None), ("tokenBudget", 3000)]:
            self.assert_refused_unchanged("activate", {"thread_id": "fixture-thread", "native_goal": self.native | {field: value}}, "read-back mismatch")
        self.assert_refused_unchanged("activate", {"thread_id": "other", "native_goal": self.native}, "read-back mismatch")
        result = self.run_guard("activate", {"thread_id": "fixture-thread", "native_goal": self.native})
        self.assertEqual(result["status"], "active")
        self.assertEqual(self.state()["deadline"], 2200)
        self.assertEqual(self.state()["runtime"], RUNTIME)

    def test_restart_between_approval_and_activation_requires_new_consent(self):
        self.approved()
        self.identity = lambda: RUNTIME | {"pid": 456}
        try:
            result = self.run_guard("activate", {"thread_id": "fixture-thread", "native_goal": self.native})
        except guard.Refused:
            return
        self.assertNotEqual(result["status"], "active", "Approval from the previous runtime activated without fresh human input")

    def test_restart_before_binding_or_reply_permanently_invalidates_proposal(self):
        for stage in ["bind", "authorize"]:
            with self.subTest(stage=stage):
                self.path = self.path.with_name(f"restart-{stage}.json")
                self.identity = lambda: dict(RUNTIME)
                self.propose()
                if stage == "authorize":
                    self.run_guard("bind", {"question_id": "fixture-question"})
                self.identity = lambda: RUNTIME | {"pid": 456}
                result = self.run_guard(stage, {"question_id": "fixture-question"} if stage == "bind" else self.reply)
                self.assertEqual((result["status"], result["native_action"]), ("stopped", None))
                self.assertNotIn("consent", self.state())

    def test_status_and_goal_inspection_never_activate_or_charge_work(self):
        self.propose(token_budget=800)
        before = self.path.read_bytes()
        self.assertEqual(self.run_guard("goal"), {"objective": self.native["objective"], "token_budget": 800})
        self.assertEqual(self.run_guard("status")["cycles"], 0)
        self.assertEqual(self.path.read_bytes(), before)

    def test_cycle_persists_and_duplicate_begin_or_finish_cannot_charge_twice(self):
        self.active()
        begun = self.begin()
        cycle = begun["inflight"]["id"]
        self.assertEqual(begun["cycles"], 1)
        self.assert_refused_unchanged("begin", self.gate | {"action": "other"}, "in flight")
        self.assert_refused_unchanged("finish", self.gate | {"cycle_id": "old", "outcome": "progress", "evidence": "checked"}, "cycle mismatch")
        self.assertEqual(self.finish(cycle)["status"], "active")
        self.assert_refused_unchanged("finish", self.gate | {"cycle_id": cycle, "outcome": "progress", "evidence": "checked"}, "cycle mismatch")
        self.assertEqual(self.state()["cycles"], 1)

    def test_cycle_limit_stops_after_last_progress_but_allows_verified_done(self):
        self.active(max_cycles=1)
        cycle = self.begin()["inflight"]["id"]
        result = self.finish(cycle)
        self.assertEqual((result["status"], result["reason"], result["native_action"]), ("stopped", "cycle_budget", "pause"))
        self.assert_refused_unchanged("begin", self.gate | {"action": "new"}, "fresh approval")
        self.path = self.path.with_name("successful-run.json")
        self.active(max_cycles=1)
        result = self.finish(self.begin()["inflight"]["id"], "done")
        self.assertEqual((result["status"], result["native_action"]), ("complete", "complete_after_verification"))

    def test_wall_and_monotonic_deadlines_are_independent_inclusive_boundaries(self):
        for wall, mono in [(2200, 501), (1001, 1700)]:
            with self.subTest(wall=wall, mono=mono):
                self.path = self.path.with_name(f"deadline-{wall}-{mono}.json")
                self.active()
                cycle = self.begin()["inflight"]["id"]
                result = self.run_guard("checkpoint", self.gate | {"cycle_id": cycle}, wall=wall, monotonic=mono)
                self.assertEqual((result["status"], result["reason"], result["inflight"]), ("stopped", "time_budget", None))

    def test_backwards_clocks_stop_and_cannot_recover(self):
        self.active()
        result = self.run_guard("begin", self.gate | {"action": "work"}, wall=999)
        self.assertEqual(result["reason"], "clock_changed")
        self.assert_refused_unchanged("begin", self.gate | {"action": "retry"}, "fresh approval")

    def test_runtime_change_is_persistent_terminal_stop(self):
        self.active()
        self.identity = lambda: RUNTIME | {"started": "new-process-start"}
        self.assertEqual(self.begin()["reason"], "runtime_changed")
        self.identity = lambda: dict(RUNTIME)
        self.assert_refused_unchanged("begin", self.gate | {"action": "retry"}, "fresh approval")

    def test_runtime_lookup_failure_stops_inflight_work(self):
        self.active()
        cycle = self.begin()["inflight"]["id"]
        self.identity = lambda: (_ for _ in ()).throw(OSError("process unavailable"))
        result = self.run_guard("checkpoint", self.gate | {"cycle_id": cycle})
        self.assertEqual((result["reason"], result["inflight"]), ("runtime_unavailable", None))

    def test_thread_hash_or_native_goal_drift_stops_without_another_cycle(self):
        variants = [{"thread_id": "other"}, {"proposal_hash": "other"},
                    {"native_goal": {"objective": "other", "status": "active", "tokenBudget": None}},
                    {"native_goal": {"status": "paused"}}]
        for index, variant in enumerate(variants):
            with self.subTest(variant=variant):
                self.path = self.path.with_name(f"drift-{index}.json")
                self.active()
                result = self.run_guard("begin", self.gate | variant | {"action": "work"})
                self.assertEqual(result["status"], "stopped")
                self.assertEqual(result["cycles"], 0)

    def test_no_value_blockers_revocation_and_interruption_stop_immediately(self):
        for outcome in ["no_value", "blocked", "revoked", "interrupted"]:
            with self.subTest(outcome=outcome):
                self.path = self.path.with_name(f"outcome-{outcome}.json")
                self.active()
                result = self.finish(self.begin()["inflight"]["id"], outcome)
                self.assertEqual((result["status"], result["reason"], result["native_action"]), ("stopped", outcome, "pause"))
                self.assert_refused_unchanged("activate", {"thread_id": "fixture-thread", "native_goal": self.native}, "explicit approval")

    def test_repetition_requires_changed_input_evidence(self):
        self.active()
        self.finish(self.begin()["inflight"]["id"])
        self.finish(self.begin(evidence="new observed result")["inflight"]["id"])
        result = self.begin()
        self.assertEqual((result["status"], result["reason"], result["cycles"]), ("stopped", "repeated_attempt", 2))

    def test_explicit_stop_is_terminal_and_preserves_reason(self):
        self.active()
        self.begin()
        result = self.run_guard("stop", {"reason": "human revoked approval"})
        self.assertEqual((result["status"], result["reason"], result["inflight"]), ("stopped", "human revoked approval", None))
        self.assert_refused_unchanged("stop", {"reason": "replace reason"}, "already terminal")
        self.assert_refused_unchanged("propose", self.request, "already exists")

    def test_invalid_limits_and_empty_objective_leave_no_state(self):
        variants = [{"max_cycles": 0}, {"max_cycles": True}, {"max_cycles": 101}, {"max_seconds": -1},
                    {"token_budget": 0}, {"token_budget": True}, {"objective": " "}, {"done": ""}]
        for variant in variants:
            with self.subTest(variant=variant), self.assertRaisesRegex(guard.Refused, "invalid"):
                self.run_guard("propose", self.request | variant)
            self.assertFalse(self.path.exists())

    def test_proposal_tamper_and_copied_path_are_rejected(self):
        self.propose()
        original = self.path.read_bytes()
        state = self.state()
        state["proposal"]["max_cycles"] = 99
        self.path.write_text(json.dumps(state))
        with self.assertRaisesRegex(guard.Refused, "proposal drift"):
            self.run_guard("status")
        self.path.write_bytes(original)
        copied = self.path.with_name("copied.json")
        copied.write_bytes(original)
        with self.assertRaisesRegex(guard.Refused, "proposal drift"):
            guard.execute("status", copied, {})

    def test_private_creation_modes_and_symlink_hardlink_refusal(self):
        self.propose()
        self.assertEqual(self.path.stat().st_mode & 0o777, 0o600)
        self.assertEqual(self.path.parent.stat().st_mode & 0o777, 0o700)
        alias = self.path.with_name("alias.json")
        alias.symlink_to(self.path)
        with self.assertRaisesRegex(guard.Refused, "symlink"):
            guard.execute("status", alias, {})
        alias.unlink()
        os.link(self.path, alias)
        with self.assertRaisesRegex(guard.Refused, "invalid state file"):
            self.run_guard("status")

    def test_atomic_replace_failure_preserves_previous_state_and_cleans_temporary(self):
        self.active()
        original = self.path.read_bytes()
        with mock.patch.object(guard.os, "replace", side_effect=OSError("injected replace failure")):
            with self.assertRaisesRegex(OSError, "injected replace failure"):
                self.begin()
        self.assertEqual(self.path.read_bytes(), original)
        self.assertEqual(list(self.path.parent.glob(".continuation-*")), [])

    def test_concurrent_begin_has_one_winner_and_one_durable_charge(self):
        self.active()
        ctx = multiprocessing.get_context("fork")
        barrier, queue = ctx.Barrier(3), ctx.Queue()
        request = self.gate | {"action": "inspect fixture", "input_evidence": "same input"}
        processes = [ctx.Process(target=contender, args=(str(self.path), request, barrier, queue)) for _ in range(2)]
        for process in processes:
            process.start()
        barrier.wait(timeout=10)
        results = [queue.get(timeout=10) for _ in processes]
        for process in processes:
            process.join(timeout=10)
            self.assertEqual(process.exitcode, 0)
        self.assertEqual(sorted(item[0] for item in results), ["ok", "refused"])
        self.assertIn("in flight", next(item[1] for item in results if item[0] == "refused"))
        self.assertEqual(self.state()["cycles"], 1)
        self.assertEqual(sum(event["event"] == "begin" for event in self.state()["events"]), 1)

    def test_cli_bounded_invalid_input_returns_structured_refusal(self):
        for payload in [b"{broken", b"[]", b"x" * (guard.MAX_BYTES + 1)]:
            result = subprocess.run([sys.executable, str(SOURCE), "propose", "--state", str(self.path)],
                                    input=payload, capture_output=True)
            self.assertEqual(result.returncode, 2)
            self.assertEqual(json.loads(result.stdout)["status"], "refused")
            self.assertFalse(self.path.exists())

    def test_malformed_native_snapshot_is_clean_refusal_not_exception_crash(self):
        for index, native in enumerate([None, [], "active"]):
            with self.subTest(native=native):
                self.path = self.path.with_name(f"malformed-{index}.json")
                self.active()
                try:
                    result = self.run_guard("begin", self.gate | {"native_goal": native, "action": "work"})
                except guard.Refused:
                    continue
                self.assertEqual(result["status"], "stopped")
                self.assertEqual(result["cycles"], 0)

    def test_cli_corrupt_state_returns_json_refusal_without_traceback(self):
        self.propose()
        state = self.state()
        state["events"] = None
        self.path.write_text(json.dumps(state))
        before = self.path.read_bytes()
        result = subprocess.run([sys.executable, str(SOURCE), "stop", "--state", str(self.path)],
                                input=b'{"reason":"corrupt fixture"}', capture_output=True)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(json.loads(result.stdout)["status"], "refused")
        self.assertNotIn(b"Traceback", result.stderr)
        self.assertEqual(self.path.read_bytes(), before)

    def test_runtime_identity_uses_ancestor_executable_and_start_without_arguments(self):
        responses = [subprocess.CompletedProcess([], 0, "20 /fixture/python\n"),
                     subprocess.CompletedProcess([], 0, "1 /fixture/codex\n"),
                     subprocess.CompletedProcess([], 0, "fixture-start\n")]
        with mock.patch.object(guard.os, "getppid", return_value=30), mock.patch.object(guard.subprocess, "run", side_effect=responses) as run:
            self.assertEqual(guard.runtime_identity(), {"pid": 20, "started": "fixture-start", "executable": "/fixture/codex"})
            self.assertEqual([call.args[0] for call in run.call_args_list],
                             [["ps", "-p", "30", "-o", "ppid=,comm="], ["ps", "-p", "20", "-o", "ppid=,comm="], ["ps", "-p", "20", "-o", "lstart="]])

    def test_missing_native_runtime_fails_closed_before_state_creation(self):
        self.identity = lambda: (_ for _ in ()).throw(guard.Refused("native Codex ancestor unavailable"))
        with self.assertRaisesRegex(guard.Refused, "native Codex ancestor unavailable"):
            self.propose()
        self.assertFalse(self.path.exists())

    def test_nonfinite_clocks_and_oversized_state_fail_closed(self):
        for clock in [float("nan"), float("inf")]:
            with self.assertRaisesRegex(guard.Refused, "invalid clock"):
                self.run_guard("propose", self.request, wall=clock)
        self.propose()
        self.path.write_bytes(b"x" * (guard.MAX_BYTES + 1))
        with self.assertRaisesRegex(guard.Refused, "invalid state file"):
            self.run_guard("status")

    def test_native_ancestor_lookup_without_codex_is_explicit_refusal(self):
        with mock.patch.object(guard.os, "getppid", return_value=30), mock.patch.object(guard.subprocess, "run", return_value=subprocess.CompletedProcess([], 0, "1 /fixture/python\n")):
            with self.assertRaisesRegex(guard.Refused, "native Codex ancestor unavailable"):
                guard.runtime_identity()

    def test_runtime_disappearing_before_human_reply_ends_proposal(self):
        self.propose()
        self.run_guard("bind", {"question_id": "fixture-question"})
        self.identity = lambda: (_ for _ in ()).throw(OSError("process unavailable"))
        result = self.run_guard("authorize", self.reply)
        self.assertEqual((result["status"], result["native_action"]), ("stopped", None))
        self.assertNotIn("consent", self.state())

    def test_unknown_command_preserves_state(self):
        self.propose()
        self.assert_refused_unchanged("unsupported", {}, "unknown command")

    def test_main_parses_and_emits_machine_readable_status_and_refusals(self):
        self.propose()
        for payload, command, expected_exit, expected_status in [(b"{}", "status", 0, "proposed"),
                                                                  (b"{broken", "status", 2, "refused"),
                                                                  (b"x" * (guard.MAX_BYTES + 1), "status", 2, "refused")]:
            output = io.StringIO()
            with self.subTest(payload_size=len(payload)), mock.patch.object(guard.sys, "argv", ["guard", command, "--state", str(self.path)]), mock.patch.object(guard.sys, "stdin", type("Input", (), {"buffer": io.BytesIO(payload)})()), mock.patch.object(guard.sys, "stdout", output):
                self.assertEqual(guard.main(), expected_exit)
            self.assertEqual(json.loads(output.getvalue())["status"], expected_status)


if __name__ == "__main__":
    unittest.main()
