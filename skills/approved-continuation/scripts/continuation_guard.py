#!/usr/bin/env python3
"""Cooperative gates for approved native Codex goals. No prompt sender or daemon.

Human authorization comes from the native input tool, not this local ledger.
The CLI accepts one bounded JSON object on stdin and emits one JSON result.
"""
import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import json
import math
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import time
import uuid

VERSION = 1
TERMINAL = {"complete", "stopped", "denied"}
MAX_BYTES = 131072


class Refused(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise Refused(message)


def text(value, name, limit=4000):
    require(isinstance(value, str) and bool(value.strip()) and len(value) <= limit,
            f"invalid {name}")
    return value


def positive(value, name, maximum):
    require(type(value) is int and 0 < value <= maximum, f"invalid {name}")
    return value


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"),
                                     ensure_ascii=False).encode()).hexdigest()


def runtime_identity():
    """Nearest Codex executable ancestor, without command arguments/environment."""
    pid = os.getppid()
    for _ in range(32):
        result = subprocess.run(["ps", "-p", str(pid), "-o", "ppid=,comm="],
                                capture_output=True, text=True, check=True)
        fields = result.stdout.strip().split(None, 1)
        require(len(fields) == 2, "cannot identify native runtime")
        parent, executable = fields
        if Path(executable).name in {"codex", "codex.exe"}:
            started = subprocess.run(["ps", "-p", str(pid), "-o", "lstart="],
                                     capture_output=True, text=True, check=True).stdout.strip()
            require(bool(started), "cannot identify runtime start")
            return {"pid": pid, "started": started, "executable": executable}
        pid = int(parent)
        if pid <= 1:
            break
    raise Refused("native Codex ancestor unavailable; cannot activate")


def native_objective(proposal):
    goal = (f"{proposal['objective']}\n\nDone when: {proposal['done']}\n"
            f"Scope: {proposal['scope']}\n\n"
            f"Use $approved-continuation. Run {proposal['run_id']}; "
            f"state: {proposal['state']}. Read the skill and guard this run before work. "
            f"Approved limits: {proposal['max_cycles']} work cycles, {proposal['max_seconds']} seconds. "
            "The human conditionally instructs native pause on denial/revocation, interruption, "
            "runtime/scope changes, blockers, exhausted budgets or no useful progress. "
            "Never resume this run automatically or mark unfinished work complete. "
            "Complete only after verifying the done criteria; report evidence and limitations.")
    require(len(goal) <= 4000, "native objective exceeds 4000 characters; shorten proposal")
    return goal


def proposal_question(p):
    tokens = f" Native token cap: {p['token_budget']}." if p['token_budget'] else " No token cap requested."
    return (f"Approve native continuation in thread {p['thread_id']}? "
            f"Objective: {p['objective']} Done: {p['done']} Scope: {p['scope']} "
            f"Limits: {p['max_cycles']} work cycles and {p['max_seconds']} seconds.{tokens} "
            "Time/cycle gates are cooperative and cannot cancel an in-flight tool call. "
            "Approval conditionally instructs native pause on a stop, interruption, runtime/scope "
            "change, budget exhaustion, blocker or no useful progress. Stop/pause/revoke anytime; "
            "extensions and restarts need fresh approval. "
            f"Proposal {p['run_id']} / {digest(p)}. Choose exactly Approve or Decline.")


def no_symlink_path(path):
    for component in [path, *path.parents]:
        require(not component.is_symlink(), "symlink state paths are refused")


@contextmanager
def locked(path):
    path = Path(path).absolute()
    no_symlink_path(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    lock = path.with_name(path.name + ".lock")
    fd = os.open(lock, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
    try:
        require(stat.S_ISREG(os.fstat(fd).st_mode) and os.fstat(fd).st_nlink == 1,
                "invalid lock file")
        fcntl.flock(fd, fcntl.LOCK_EX)
        no_symlink_path(path)
        state = None
        if path.exists():
            read_fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
            try:
                info = os.fstat(read_fd)
                require(stat.S_ISREG(info.st_mode) and info.st_nlink == 1 and info.st_size <= MAX_BYTES,
                        "invalid state file")
                with os.fdopen(read_fd, "r", encoding="utf-8", closefd=False) as stream:
                    state = json.load(stream)
            finally:
                os.close(read_fd)
        box = {"state": state, "dirty": False}
        yield path, box
        if box["dirty"]:
            payload = json.dumps(box["state"], ensure_ascii=False, indent=2) + "\n"
            require(len(payload.encode()) <= MAX_BYTES, "state size limit exceeded")
            temp_fd, temporary = tempfile.mkstemp(prefix=".continuation-", dir=path.parent)
            try:
                with os.fdopen(temp_fd, "w", encoding="utf-8") as stream:
                    stream.write(payload)
                    stream.flush()
                    os.fsync(stream.fileno())
                os.replace(temporary, path)
                dir_fd = os.open(path.parent, os.O_RDONLY)
                try:
                    os.fsync(dir_fd)
                finally:
                    os.close(dir_fd)
            finally:
                if os.path.exists(temporary):
                    os.unlink(temporary)
    finally:
        os.close(fd)


def audit(state, event, wall, **details):
    state["events"].append({"event": event, "at": wall, **details})


def stop(state, reason, wall):
    if state["status"] not in TERMINAL:
        state.update(status="stopped", reason=reason, inflight=None)
        audit(state, "stop", wall, reason=reason)


def validate_state(state, path):
    require(isinstance(state, dict) and state.get("version") == VERSION, "invalid state version")
    p = state["proposal"]
    require(p["state"] == str(path) and digest(p) == state["proposal_hash"], "proposal drift")
    native_objective(p)


def live_gate(state, request, wall, monotonic, identity):
    """Persistent terminal refusal on elapsed limits, scope or executor changes."""
    require(state["status"] == "active", "run is not active; fresh approval required")
    p = state["proposal"]
    reason = None
    if request.get("thread_id") != p["thread_id"] or request.get("proposal_hash") != state["proposal_hash"]:
        reason = "scope_changed"
    elif identity() != state["runtime"]:
        reason = "runtime_changed"
    elif wall < state["last_wall"] or monotonic < state["last_monotonic"]:
        reason = "clock_changed"
    elif wall >= state["deadline"] or monotonic >= state["mono_deadline"]:
        reason = "time_budget"
    native = request.get("native_goal", {})
    if not reason and (native.get("objective") != native_objective(p) or native.get("status") != "active"
                       or native.get("tokenBudget") != p["token_budget"]):
        reason = "native_goal_changed"
    if reason:
        stop(state, reason, wall)
        return False
    state.update(last_wall=wall, last_monotonic=monotonic)
    return True


def execute(command, state_path, request, *, wall=None, monotonic=None, identity=runtime_identity):
    wall = time.time() if wall is None else wall
    monotonic = time.monotonic() if monotonic is None else monotonic
    require(all(type(n) in (int, float) and math.isfinite(n) for n in (wall, monotonic)), "invalid clock")
    require(isinstance(request, dict), "request must be an object")
    with locked(state_path) as (path, box):
        state = box["state"]
        if command == "propose":
            require(state is None, "state already exists; never overwrite or reuse approval")
            p = {"run_id": str(uuid.uuid4()), "state": str(path),
                 "thread_id": text(request.get("thread_id"), "thread_id", 128),
                 "objective": text(request.get("objective"), "objective", 1500),
                 "scope": text(request.get("scope"), "scope", 700),
                 "done": text(request.get("done"), "done", 700),
                 "max_cycles": positive(request.get("max_cycles", 5), "max_cycles", 100),
                 "max_seconds": positive(request.get("max_seconds", 1200), "max_seconds", 86400),
                 "token_budget": request.get("token_budget"), "created": wall, "expires": wall + 600}
            if p["token_budget"] is not None:
                positive(p["token_budget"], "token_budget", 10000000)
            goal = native_objective(p)
            state = {"version": VERSION, "proposal": p, "proposal_hash": digest(p), "runtime": identity(),
                     "status": "proposed", "events": [], "cycles": 0, "inflight": None}
            audit(state, "proposed", wall)
            box.update(state=state, dirty=True)
            return {"status": "proposed", "proposal": p, "proposal_hash": digest(p),
                    "question": proposal_question(p), "native_objective": goal}
        require(state is not None, "no proposal")
        validate_state(state, path)
        p = state["proposal"]
        if command in {"status", "goal"}:
            return state if command == "status" else {"objective": native_objective(p), "token_budget": p["token_budget"]}
        if command in {"bind", "authorize", "activate"} and state["status"] not in TERMINAL:
            try:
                same_runtime = identity() == state["runtime"]
            except (OSError, subprocess.SubprocessError, Refused):
                same_runtime = False
            if not same_runtime:
                stop(state, "runtime_changed", wall)
                box["dirty"] = True
                return {"status": "stopped", "reason": "runtime_changed", "native_action": None}
        if command == "bind":
            require(state["status"] == "proposed" and "question_id" not in state, "question already bound")
            require(p["created"] <= wall < p["expires"], "proposal expired")
            state["question_id"] = text(request.get("question_id"), "question_id", 512)
            audit(state, "question_bound", wall)
        elif command == "authorize":
            require(state["status"] == "proposed", "consent already consumed")
            require(p["created"] <= wall < p["expires"], "proposal expired")
            require(request.get("source") == "native_user_input" and request.get("role") == "user",
                    "reply must come from trusted native human input")
            require(request.get("question_id") == state.get("question_id") and state.get("question_id"),
                    "reply question mismatch")
            require(request.get("thread_id") == p["thread_id"] and request.get("proposal_hash") == state["proposal_hash"],
                    "reply scope/proposal mismatch")
            require(request.get("answer") in {"Approve", "Decline"}, "no explicit affirmative/negative reply")
            state["status"] = "authorized" if request["answer"] == "Approve" else "denied"
            state["consent"] = dict(request)
            audit(state, state["status"], wall)
        elif command == "activate":
            require(state["status"] == "authorized", "explicit approval required")
            require(p["created"] <= wall < p["expires"], "approval expired")
            runtime = identity()
            native = request.get("native_goal", {})
            require(request.get("thread_id") == p["thread_id"] and native.get("objective") == native_objective(p)
                    and native.get("status") == "active" and native.get("tokenBudget") == p["token_budget"],
                    "native goal read-back mismatch")
            state.update(status="active", runtime=runtime, deadline=wall + p["max_seconds"],
                         mono_deadline=monotonic + p["max_seconds"], last_wall=wall, last_monotonic=monotonic)
            audit(state, "activated", wall)
        elif command == "stop":
            require(state["status"] not in TERMINAL, "run already terminal")
            reason = text(request.get("reason"), "reason", 100)
            stop(state, reason, wall)
        elif command in {"begin", "checkpoint", "finish"}:
            # Identity discovery failures are terminal too; never silently recover.
            try:
                allowed = live_gate(state, request, wall, monotonic, identity)
            except (OSError, subprocess.SubprocessError, Refused) as error:
                if state["status"] != "active":
                    raise
                stop(state, "runtime_unavailable", wall)
                allowed = False
            if allowed:
                if command == "begin":
                    require(state["inflight"] is None, "cycle already in flight")
                    if state["cycles"] >= p["max_cycles"]:
                        stop(state, "cycle_budget", wall)
                    else:
                        action = text(request.get("action"), "action", 1000)
                        # An identical next action without a changed input is not progress.
                        fingerprint = digest({"action": action, "input": request.get("input_evidence")})
                        if fingerprint in state.get("attempts", []):
                            stop(state, "repeated_attempt", wall)
                        else:
                            state.setdefault("attempts", []).append(fingerprint)
                            state["cycles"] += 1
                            state["inflight"] = {"id": str(uuid.uuid4()), "action": action}
                            audit(state, "begin", wall, cycle=state["cycles"], **state["inflight"])
                else:
                    require(state["inflight"] is not None and request.get("cycle_id") == state["inflight"]["id"],
                            "cycle mismatch or already finished")
                    if command == "finish":
                        outcome = request.get("outcome")
                        require(outcome in {"progress", "done", "blocked", "no_value", "interrupted", "revoked"},
                                "invalid outcome")
                        evidence = text(request.get("evidence"), "evidence", 2000)
                        audit(state, "finish", wall, cycle_id=state["inflight"]["id"], outcome=outcome, evidence=evidence)
                        state["inflight"] = None
                        if outcome == "done":
                            state.update(status="complete", reason="verified_done")
                        elif outcome != "progress":
                            stop(state, outcome, wall)
                        elif state["cycles"] >= p["max_cycles"]:
                            stop(state, "cycle_budget", wall)
            box["dirty"] = True
        else:
            raise Refused("unknown command")
        box["dirty"] = True
        return {"status": state["status"], "reason": state.get("reason"), "cycles": state["cycles"],
                "inflight": state["inflight"], "native_action":
                "complete_after_verification" if state["status"] == "complete" else
                "pause" if state["status"] == "stopped" and "deadline" in state else None}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["propose", "bind", "authorize", "activate", "begin", "checkpoint", "finish", "stop", "status", "goal"])
    parser.add_argument("--state", required=True, help="explicit project-local JSON state path")
    args = parser.parse_args()
    try:
        raw = sys.stdin.buffer.read(MAX_BYTES + 1)
        require(len(raw) <= MAX_BYTES, "request too large")
        request = json.loads(raw) if raw.strip() else {}
        result = execute(args.command, args.state, request)
        print(json.dumps(result, ensure_ascii=False))
    except (Refused, KeyError, TypeError, OSError, json.JSONDecodeError, subprocess.SubprocessError) as error:
        print(json.dumps({"status": "refused", "error": str(error)}))
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
