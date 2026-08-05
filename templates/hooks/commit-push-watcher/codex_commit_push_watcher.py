#!/usr/bin/env python3

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, Optional, Set, Tuple


CODEX_HOME = Path(os.environ.get("CODEX_HOME", str(Path.home() / ".codex")))
SESSIONS_ROOT = CODEX_HOME / "sessions"
STATE_PATH = CODEX_HOME / "tmp" / "commit_push_watcher_state.json"
LOG_PATH = CODEX_HOME / "log" / "commit_push_watcher.log"
POLL_INTERVAL_SECONDS = 2.0
DEFAULT_TITLE = "Codex Git Hook"


def log(message: str) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(f"[{timestamp}] {message}\n")


def run(
    args: list[str],
    cwd: Optional[Path] = None,
    timeout: int = 30,
    check: bool = False,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env.setdefault("PATH", "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin")
    env.setdefault("LANG", "en_US.UTF-8")
    env.setdefault("LC_ALL", "en_US.UTF-8")
    env.setdefault("GIT_TERMINAL_PROMPT", "0")
    return subprocess.run(
        args,
        cwd=str(cwd) if cwd else None,
        env=env,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=check,
    )


def run_osascript(script: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["osascript", "-"],
        input=script,
        text=True,
        capture_output=True,
        timeout=60,
        check=False,
    )


def applescript_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def show_notification(title: str, message: str) -> None:
    script = f'''
display notification "{applescript_text(message)}" with title "{applescript_text(title)}"
'''
    result = run_osascript(script)
    if result.returncode != 0:
        log(f"notification failed: {result.stderr.strip()}")


def show_dialog(title: str, message: str, buttons: list[str], default_button: str) -> Optional[str]:
    button_list = ", ".join(f'"{applescript_text(button)}"' for button in buttons)
    script = f'''
tell application "System Events"
    activate
    display dialog "{applescript_text(message)}" buttons {{{button_list}}} default button "{applescript_text(default_button)}" with title "{applescript_text(title)}"
end tell
'''
    result = run_osascript(script)
    if result.returncode != 0:
        stderr = result.stderr.strip()
        if "User canceled" in stderr:
            return None
        log(f"dialog failed: {stderr}")
        return None
    stdout = result.stdout.strip()
    marker = "button returned:"
    return stdout.split(marker, 1)[1].strip() if marker in stdout else None


def prompt_for_commit_message(default_message: str) -> Optional[str]:
    script = f'''
tell application "System Events"
    activate
    display dialog "Commit message:" default answer "{applescript_text(default_message)}" buttons {{"Cancel", "Continue"}} default button "Continue" with title "{DEFAULT_TITLE}"
end tell
'''
    result = run_osascript(script)
    if result.returncode != 0:
        stderr = result.stderr.strip()
        if "User canceled" in stderr:
            return None
        log(f"commit message dialog failed: {stderr}")
        return None
    stdout = result.stdout.strip()
    marker = "text returned:"
    if marker not in stdout:
        return None
    message = stdout.split(marker, 1)[1].strip()
    if ", button returned:" in message:
        message = message.split(", button returned:", 1)[0].strip()
    return message or None


def git_repo_root(path: Path) -> Optional[Path]:
    result = run(["git", "-C", str(path), "rev-parse", "--show-toplevel"], timeout=15)
    if result.returncode != 0:
        return None
    return Path(result.stdout.strip())


def git_status_lines(repo: Path) -> list[str]:
    result = run(["git", "-C", str(repo), "status", "--short"], timeout=20)
    if result.returncode != 0:
        log(f"git status failed in {repo}: {result.stderr.strip()}")
        return []
    return [line for line in result.stdout.splitlines() if line.strip()]


def summarize_status(lines: list[str], limit: int = 8) -> str:
    visible = lines[:limit]
    summary = "\n".join(visible)
    remaining = len(lines) - len(visible)
    if remaining > 0:
        summary += f"\n... and {remaining} more"
    return summary


def build_default_commit_message(last_agent_message: str) -> str:
    for raw_line in last_agent_message.splitlines():
        line = raw_line.strip().replace("`", "")
        if line:
            collapsed = " ".join(line.split())
            return collapsed[:72]
    return "Codex changes"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
    tmp_path.replace(path)


def load_state() -> dict:
    if not STATE_PATH.exists():
        return {"initialized": False, "offsets": {}, "processed_turns": []}
    payload = load_json(STATE_PATH)
    payload.setdefault("initialized", False)
    payload.setdefault("offsets", {})
    payload.setdefault("processed_turns", [])
    return payload


def save_state(state: dict) -> None:
    save_json(STATE_PATH, state)


def iter_session_files() -> list[Path]:
    if not SESSIONS_ROOT.exists():
        return []
    return sorted(SESSIONS_ROOT.glob("*/*/*/*.jsonl"))


def parse_session_meta(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        first_line = handle.readline()
    payload = json.loads(first_line)
    if payload.get("type") != "session_meta":
        raise ValueError(f"{path} does not start with session_meta")
    return payload["payload"]


def handle_git_action(repo: Path, commit_message: str, push: bool) -> Tuple[bool, str]:
    add_result = run(["git", "-C", str(repo), "add", "-A"], timeout=60)
    if add_result.returncode != 0:
        return False, add_result.stderr.strip() or add_result.stdout.strip()

    commit_result = run(["git", "-C", str(repo), "commit", "-m", commit_message], timeout=120)
    commit_output = (commit_result.stdout + "\n" + commit_result.stderr).strip()
    if commit_result.returncode != 0:
        return False, commit_output

    if not push:
        return True, commit_output

    upstream_result = run(
        ["git", "-C", str(repo), "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
        timeout=30,
    )
    if upstream_result.returncode == 0:
        push_cmd = ["git", "-C", str(repo), "push"]
    else:
        push_cmd = ["git", "-C", str(repo), "push", "-u", "origin", "HEAD"]

    push_result = run(push_cmd, timeout=180)
    push_output = (push_result.stdout + "\n" + push_result.stderr).strip()
    if push_result.returncode != 0:
        return False, push_output
    return True, "\n\n".join(part for part in [commit_output, push_output] if part)


def maybe_prompt_for_repo(repo: Path, last_agent_message: str, dry_run: bool = False) -> None:
    status_lines = git_status_lines(repo)
    if not status_lines:
        log(f"skip {repo}: no uncommitted changes")
        return

    summary = summarize_status(status_lines)
    default_message = build_default_commit_message(last_agent_message)
    if dry_run:
        print(f"repo={repo}")
        print(f"default_commit_message={default_message}")
        print("status:")
        print(summary)
        return

    prompt = (
        f"Codex finished in:\n{repo}\n\n"
        f"Uncommitted changes detected:\n{summary}\n\n"
        "What do you want to do with all current changes in this repo?"
    )
    choice = show_dialog(
        DEFAULT_TITLE,
        prompt,
        ["Skip", "Commit Only", "Commit & Push"],
        "Commit & Push",
    )
    if choice in (None, "Skip"):
        log(f"user skipped action for {repo}")
        return

    commit_message = prompt_for_commit_message(default_message)
    if not commit_message:
        log(f"user canceled commit message for {repo}")
        return

    should_push = choice == "Commit & Push"
    ok, output = handle_git_action(repo, commit_message, push=should_push)
    if ok:
        action = "Committed and pushed" if should_push else "Committed"
        show_notification(DEFAULT_TITLE, f"{action} changes in {repo.name}")
        log(f"{action.lower()} changes in {repo}")
        return

    trimmed = "\n".join(output.splitlines()[-12:]) if output else "Unknown git failure"
    show_dialog(DEFAULT_TITLE, f"Git action failed in {repo}:\n\n{trimmed}", ["OK"], "OK")
    log(f"git action failed in {repo}: {trimmed}")


def process_event(path: Path, event: dict, processed_turns: Set[str], dry_run: bool = False) -> None:
    if event.get("type") != "event_msg":
        return
    payload = event.get("payload") or {}
    if payload.get("type") != "task_complete":
        return

    turn_id = payload.get("turn_id")
    if not turn_id:
        return

    turn_key = f"{path}:{turn_id}"
    if turn_key in processed_turns:
        return
    processed_turns.add(turn_key)

    try:
        session_meta = parse_session_meta(path)
    except Exception as exc:
        log(f"failed to parse session meta for {path}: {exc}")
        return

    cwd = session_meta.get("cwd")
    if not cwd:
        log(f"skip {path}: no cwd in session meta")
        return

    repo = git_repo_root(Path(cwd))
    if repo is None:
        log(f"skip {path}: cwd is not a git repo ({cwd})")
        return

    last_agent_message = payload.get("last_agent_message", "")
    maybe_prompt_for_repo(repo, last_agent_message, dry_run=dry_run)


def seed_initial_offsets(state: dict) -> None:
    offsets: Dict[str, int] = state.setdefault("offsets", {})
    for session_file in iter_session_files():
        offsets[str(session_file)] = session_file.stat().st_size
    state["initialized"] = True
    save_state(state)
    log("initialized watcher baseline without prompting for historical sessions")


def scan_once(state: dict, dry_run: bool = False) -> bool:
    changed = False
    offsets: Dict[str, int] = state.setdefault("offsets", {})
    processed_turns = set(state.setdefault("processed_turns", []))

    for session_file in iter_session_files():
        path_key = str(session_file)
        current_size = session_file.stat().st_size
        last_offset = offsets.get(path_key, 0)

        if current_size < last_offset:
            last_offset = 0

        if current_size == last_offset:
            continue

        with session_file.open("r", encoding="utf-8") as handle:
            handle.seek(last_offset)
            for raw_line in handle:
                line = raw_line.strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue
                process_event(session_file, event, processed_turns, dry_run=dry_run)

        offsets[path_key] = current_size
        changed = True

    if changed:
        state["processed_turns"] = sorted(processed_turns)[-5000:]
        save_state(state)
    return changed


def test_session(path: Path) -> int:
    session_meta = parse_session_meta(path)
    cwd = session_meta.get("cwd")
    print(f"session={path}")
    print(f"cwd={cwd}")
    repo = git_repo_root(Path(cwd)) if cwd else None
    print(f"repo={repo}")
    if repo is None:
        return 0

    last_complete = None
    with path.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            try:
                event = json.loads(raw_line)
            except json.JSONDecodeError:
                continue
            payload = event.get("payload") or {}
            if event.get("type") == "event_msg" and payload.get("type") == "task_complete":
                last_complete = payload

    if last_complete is None:
        print("task_complete=none")
        return 0

    maybe_prompt_for_repo(repo, last_complete.get("last_agent_message", ""), dry_run=True)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Scan once and exit.")
    parser.add_argument("--test-session", type=Path, help="Inspect one session file without prompting.")
    args = parser.parse_args()

    if args.test_session:
        return test_session(args.test_session)

    state = load_state()
    if not state.get("initialized"):
        seed_initial_offsets(state)

    if args.once:
        scan_once(state, dry_run=False)
        return 0

    log("watcher started")
    while True:
        try:
            scan_once(state, dry_run=False)
        except Exception as exc:
            log(f"watch loop error: {exc}")
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    sys.exit(main())
