#!/usr/bin/env python3
"""Scoped stdlib line measurement and assertion-checked faults in disposable copies.

Run from the repository root: python3 -B skills/approved-continuation/tests/run_evidence.py
This does not exercise the native human-question or goal APIs.
"""
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import trace
import unittest

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "skills/approved-continuation/scripts/continuation_guard.py"
TESTS = Path(__file__).with_name("test_continuation_guard.py")


def main():
    tracer = trace.Trace(count=True, trace=False)

    def measured_suite():
        spec = importlib.util.spec_from_file_location("continuation_contracts", TESTS)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        output = io.StringIO()
        result = unittest.TextTestRunner(stream=output).run(unittest.defaultTestLoader.loadTestsFromModule(module))
        if not result.wasSuccessful():
            sys.stderr.write(output.getvalue())
        return result

    result = tracer.runfunc(measured_suite)
    lines = {line: value for line, value in trace._find_executable_linenos(str(SOURCE)).items()
             if isinstance(line, int) and line > 0}
    hits = {line for (filename, line), count in tracer.results().counts.items()
            if Path(filename).resolve() == SOURCE and count > 0}
    source = SOURCE.read_text()
    faults = [
        ("ignore_native_reply_origin", 'request.get("source") == "native_user_input" and request.get("role") == "user"', "True",
         "test_bound_question_and_exact_fresh_human_reply_required"),
        ("accept_expiry_boundary", 'wall < p["expires"]', 'wall <= p["expires"]',
         "test_approval_expires_at_boundary_and_cannot_be_replayed"),
        ("allow_deadline_boundary", 'wall >= state["deadline"] or monotonic >= state["mono_deadline"]',
         'wall > state["deadline"] or monotonic > state["mono_deadline"]',
         "test_wall_and_monotonic_deadlines_are_independent_inclusive_boundaries"),
        ("allow_second_inflight_cycle", 'require(state["inflight"] is None, "cycle already in flight")',
         'require(True, "cycle already in flight")', "test_cycle_persists_and_duplicate_begin_or_finish_cannot_charge_twice"),
        ("allow_extra_cycle_after_last_progress", 'elif state["cycles"] >= p["max_cycles"]:',
         'elif state["cycles"] > p["max_cycles"]:', "test_cycle_limit_stops_after_last_progress_but_allows_verified_done"),
        ("reuse_approval_after_restart", 'same_runtime = identity() == state["runtime"]', 'same_runtime = True',
         "test_restart_between_approval_and_activation_requires_new_consent"),
        ("repeat_without_new_evidence", 'if fingerprint in state.get("attempts", []):', 'if False:',
         "test_repetition_requires_changed_input_evidence"),
    ]
    observed = []
    with tempfile.TemporaryDirectory(prefix="continuation-faults-") as temporary:
        for name, old, replacement, test_name in faults:
            if old not in source:
                observed.append({"fault": name, "result": "inconclusive_source_changed"})
                continue
            mutant = Path(temporary).resolve() / f"{name}.py"
            mutant.write_text(source.replace(old, replacement))
            run = subprocess.run([sys.executable, "-B", str(TESTS), f"GuardContract.{test_name}"],
                                 env=os.environ | {"CONTINUATION_GUARD_SOURCE": str(mutant), "PYTHONDONTWRITEBYTECODE": "1"},
                                 capture_output=True, text=True)
            failure = run.stderr + run.stdout
            detected = run.returncode == 1 and "FAIL:" in failure and "AssertionError:" in failure
            observed.append({"fault": name, "test": test_name, "exit": run.returncode,
                             "result": "assertion_detected" if detected else "survived_or_inconclusive",
                             "assertion": next((line.strip() for line in failure.splitlines() if line.startswith("AssertionError:")), None)})
    report = {"source": str(SOURCE.relative_to(ROOT)), "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              "tests_run": result.testsRun, "failures": len(result.failures), "errors": len(result.errors),
              "lines": {"executed": len(hits & lines.keys()), "executable": len(lines),
                        "uncovered": sorted(lines.keys() - hits)},
              "branch_coverage": "unavailable: stdlib trace measures lines only", "faults": observed,
              "native_wiring": "not exercised; fixtures are not human approval"}
    print(json.dumps(report, indent=2))
    return 0 if result.wasSuccessful() and all(f["result"] == "assertion_detected" for f in observed) else 1


if __name__ == "__main__":
    sys.exit(main())
