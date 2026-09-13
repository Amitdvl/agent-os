#!/usr/bin/env python3
"""Create, inspect, atomically update, and safely clean Codex book workspaces."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCHEMA_VERSION = 1
MARKER = ".codex-book-workspace"
PHASE_SEQUENCE = (
    "preflight", "reconnaissance", "conception", "editorial_gate",
    "deep_research", "evidence_build", "draft", "structural_revision",
    "fact_check", "continuity_qa", "prose_revision",
    "notes_and_bibliography", "final_qa", "epub_build", "epub_validate",
    "deliver", "cleanup", "complete",
)
PHASES = set(PHASE_SEQUENCE) | {"failed"}
REQUIRED_REVISION_PASSES = (
    "structural_revision",
    "factual_verification",
    "chronology_name_terminology",
    "repetition_audit",
    "cross_chapter_continuity",
    "prose_revision",
    "notes_source_audit",
    "mechanical_validation",
    "final_editorial_read",
)
STATE_KEYS = {
    "schema_version", "run_id", "subject", "constraints", "language",
    "working_title", "final_title", "subtitle", "current_phase",
    "approved_conception", "approval_text", "approval_timestamp",
    "target_body_word_count", "actual_body_word_count", "research_cutoff",
    "chapter_plan", "current_chapter", "workspace_path", "destination_dir",
    "final_epub_path", "epubcheck_errors", "epubcheck_warnings",
    "revision_passes", "created_at", "updated_at", "failure",
}
CONTROLLED_STATE_KEYS = {
    "schema_version", "run_id", "workspace_path", "created_at", "updated_at",
    "current_phase", "approved_conception", "approval_text", "approval_timestamp",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=True)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    except Exception:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def _validate_workspace(path: Path) -> Path:
    raw = Path(path).expanduser()
    if raw.is_symlink():
        raise ValueError("workspace path must not be a symlink")
    resolved = raw.resolve(strict=True)
    if not resolved.is_dir() or not resolved.name.startswith("codex-book-"):
        raise ValueError("not a recognized codex-book workspace")
    marker = resolved / MARKER
    state_file = resolved / "run.json"
    if not marker.is_file() or marker.is_symlink() or not state_file.is_file() or state_file.is_symlink():
        raise ValueError("workspace marker or state is missing or unsafe")
    state = json.loads(state_file.read_text(encoding="utf-8"))
    if state.get("schema_version") != SCHEMA_VERSION:
        raise ValueError("unsupported workspace schema")
    if Path(state.get("workspace_path", "")).resolve() != resolved:
        raise ValueError("workspace state path does not match target")
    return resolved


def create_workspace(
    subject: str,
    destination: Path | str,
    *,
    constraints: list[str] | None = None,
    language: str = "en-US",
    temp_root: Path | str | None = None,
) -> dict[str, Any]:
    subject = subject.strip()
    if not subject:
        raise ValueError("subject must not be empty")
    root = Path(temp_root or os.environ.get("TMPDIR") or "/tmp").expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    short_id = uuid.uuid4().hex[:8]
    workspace = Path(tempfile.mkdtemp(prefix=f"codex-book-{stamp}-{short_id}-", dir=root)).resolve()
    run_id = workspace.name.removeprefix("codex-book-")

    for directory in (
        "research/source-notes", "evidence", "chapters", "qa", "build",
    ):
        (workspace / directory).mkdir(parents=True, exist_ok=True)
    for relative in (
        "editorial-brief.md", "metadata.yaml", "continuity.md", "manuscript.md",
        "research/ledger.jsonl", "research/chronology.md",
        "research/open-questions.md", "research/reconnaissance-summary.md",
        "qa/structural.md", "qa/fact-check.md", "qa/continuity.md",
        "qa/prose.md", "qa/notes.md", "qa/final-editorial.md",
        "build/epubcheck.txt", "build/build.json",
    ):
        (workspace / relative).touch()
    (workspace / MARKER).write_text(
        json.dumps({"schema_version": SCHEMA_VERSION, "run_id": run_id}) + "\n",
        encoding="utf-8",
    )

    now = _now()
    state: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "run_id": run_id,
        "subject": subject,
        "constraints": constraints or [],
        "language": language,
        "working_title": None,
        "final_title": None,
        "subtitle": None,
        "current_phase": "preflight",
        "approved_conception": False,
        "approval_text": None,
        "approval_timestamp": None,
        "target_body_word_count": None,
        "actual_body_word_count": None,
        "research_cutoff": None,
        "chapter_plan": [],
        "current_chapter": None,
        "workspace_path": str(workspace),
        "destination_dir": str(Path(destination).expanduser().resolve()),
        "final_epub_path": None,
        "epubcheck_errors": None,
        "epubcheck_warnings": None,
        "revision_passes": {},
        "created_at": now,
        "updated_at": now,
        "failure": None,
    }
    _write_json_atomic(workspace / "run.json", state)
    return state


def status_workspace(workspace: Path | str) -> dict[str, Any]:
    path = _validate_workspace(Path(workspace))
    return json.loads((path / "run.json").read_text(encoding="utf-8"))


def update_workspace(
    workspace: Path | str,
    *,
    phase: str | None = None,
    values: dict[str, Any] | None = None,
    approval_text: str | None = None,
) -> dict[str, Any]:
    path = _validate_workspace(Path(workspace))
    state = status_workspace(path)
    current_phase = state["current_phase"]
    if phase is not None:
        if phase not in PHASES:
            raise ValueError(f"unknown phase: {phase}")
        if current_phase == "failed" and phase != "failed":
            raise ValueError("failed workspaces are preserved and cannot resume by state mutation")
        if phase != "failed" and phase != current_phase:
            if current_phase not in PHASE_SEQUENCE:
                raise ValueError(f"cannot transition from {current_phase}")
            current_index = PHASE_SEQUENCE.index(current_phase)
            next_index = PHASE_SEQUENCE.index(phase)
            forward_one = next_index == current_index + 1
            repair_return = (
                PHASE_SEQUENCE.index("deep_research") <= next_index < current_index
                and current_index < PHASE_SEQUENCE.index("deliver")
            )
            if not (forward_one or repair_return):
                raise ValueError(f"phase transition would skip required work: {current_phase} -> {phase}")
        if current_phase == "editorial_gate" and phase == "deep_research":
            if not (approval_text or state.get("approved_conception")):
                raise ValueError("explicit editorial approval is required before deep research")
        state["current_phase"] = phase
    for key, value in (values or {}).items():
        if key not in STATE_KEYS or key in CONTROLLED_STATE_KEYS:
            raise ValueError(f"state key is not writable: {key}")
        state[key] = value
    if approval_text is not None:
        if current_phase != "editorial_gate" or phase != "deep_research":
            raise ValueError("approval can only record the editorial_gate -> deep_research transition")
        approval_text = approval_text.strip()
        if not approval_text:
            raise ValueError("approval text must not be empty")
        state["approved_conception"] = True
        state["approval_text"] = approval_text
        state["approval_timestamp"] = _now()
    state["updated_at"] = _now()
    _write_json_atomic(path / "run.json", state)
    return state


def cleanup_workspace(
    workspace: Path | str,
    *,
    require_delivered: bool = True,
    force: bool = False,
) -> dict[str, Any]:
    path = _validate_workspace(Path(workspace))
    state = status_workspace(path)
    if require_delivered and not force:
        _verify_delivery_receipt(path, state)
    shutil.rmtree(path)
    return {"ok": True, "removed": True, "workspace_path": str(path)}


def _pass_complete(value: Any) -> bool:
    if value is True:
        return True
    if isinstance(value, str):
        return value.strip().lower() in {"complete", "completed", "passed"}
    if isinstance(value, dict):
        return str(value.get("status", "")).strip().lower() in {"complete", "completed", "passed"}
    return False


def _verify_delivery_receipt(workspace: Path, state: dict[str, Any]) -> None:
    if state.get("current_phase") not in {"deliver", "cleanup", "complete"}:
        raise RuntimeError("workspace is not eligible for cleanup: delivery phase is not recorded")
    if state.get("epubcheck_errors") != 0 or state.get("epubcheck_warnings") != 0:
        raise RuntimeError("workspace is not eligible for cleanup: zero-error, zero-warning validation is required")
    passes = state.get("revision_passes")
    if not isinstance(passes, dict) or any(
        not _pass_complete(passes.get(name)) for name in REQUIRED_REVISION_PASSES
    ):
        raise RuntimeError("workspace is not eligible for cleanup: all nine revision passes are required")

    final_raw = state.get("final_epub_path")
    if not isinstance(final_raw, str):
        raise RuntimeError("workspace is not eligible for cleanup: final EPUB path is absent")
    final = Path(final_raw).expanduser().resolve()
    destination = Path(state.get("destination_dir", "")).expanduser().resolve()
    if final.parent != destination or final.suffix.lower() != ".epub" or not final.is_file():
        raise RuntimeError("workspace is not eligible for cleanup: final EPUB is outside the recorded destination")
    if final.stat().st_size <= 0 or not zipfile.is_zipfile(final):
        raise RuntimeError("workspace is not eligible for cleanup: final EPUB package is unreadable")
    try:
        with zipfile.ZipFile(final) as archive:
            if archive.read("mimetype") != b"application/epub+zip":
                raise RuntimeError("workspace is not eligible for cleanup: EPUB mimetype is invalid")
            if "META-INF/container.xml" not in archive.namelist():
                raise RuntimeError("workspace is not eligible for cleanup: EPUB container is missing")
    except (KeyError, zipfile.BadZipFile) as exc:
        raise RuntimeError("workspace is not eligible for cleanup: EPUB package verification failed") from exc

    receipt_path = workspace / "build" / "build.json"
    if not receipt_path.is_file() or receipt_path.is_symlink():
        raise RuntimeError("workspace is not eligible for cleanup: signed build receipt is missing")
    try:
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError("workspace is not eligible for cleanup: build receipt is unreadable") from exc
    digest = hashlib.sha256(final.read_bytes()).hexdigest()
    receipt_matches = (
        receipt.get("ok") is True
        and receipt.get("final_path") == str(final)
        and receipt.get("bytes") == final.stat().st_size
        and receipt.get("sha256") == digest
        and receipt.get("epubcheck_errors") == 0
        and receipt.get("epubcheck_warnings") == 0
    )
    if not receipt_matches:
        raise RuntimeError("workspace is not eligible for cleanup: build receipt does not match the final EPUB")
    _verify_final_epub_package(final)


def _verify_final_epub_package(final: Path) -> None:
    try:
        with zipfile.ZipFile(final) as archive:
            names = set(archive.namelist())
            container = archive.read("META-INF/container.xml").decode("utf-8", errors="strict")
            match = re.search(r"full-path=[\"']([^\"']+)[\"']", container)
            if not match or match.group(1) not in names:
                raise RuntimeError("EPUB container does not resolve to a package document")
            package_path = match.group(1)
            package = archive.read(package_path).decode("utf-8", errors="strict")
            package_dir = Path(package_path).parent
            nav_match = re.search(
                r"<item\b(?=[^>]*\bproperties=[\"'][^\"']*\bnav\b[^\"']*[\"'])[^>]*\bhref=[\"']([^\"']+)[\"']",
                package,
                re.I,
            )
            if not nav_match:
                nav_match = re.search(
                    r"<item\b(?=[^>]*\bhref=[\"']([^\"']+)[\"'])[^>]*\bproperties=[\"'][^\"']*\bnav\b[^\"']*[\"']",
                    package,
                    re.I,
                )
            nav_path = (package_dir / nav_match.group(1)).as_posix() if nav_match else None
            required_metadata = (
                "<dc:title", "<dc:language", "<dc:identifier", "dcterms:modified",
            )
            if not nav_path or nav_path not in names or any(item not in package for item in required_metadata):
                raise RuntimeError("EPUB package metadata or navigation is incomplete")
            nav = archive.read(nav_path).decode("utf-8", errors="strict")
            if "<nav" not in nav or "<a" not in nav:
                raise RuntimeError("EPUB navigation document has no entries")
    except (KeyError, UnicodeDecodeError, zipfile.BadZipFile) as exc:
        raise RuntimeError("EPUB package reopen verification failed") from exc

    executable = shutil.which("epubcheck")
    if executable:
        command = [executable, str(final)]
    else:
        jar_raw = os.environ.get("EPUBCHECK_JAR")
        java = shutil.which("java")
        jar = Path(jar_raw).expanduser().resolve() if jar_raw else None
        if not (java and jar and jar.is_file()):
            raise RuntimeError("EPUBCheck is unavailable for final cleanup verification")
        command = [java, "-jar", str(jar), str(final)]
    checked = subprocess.run(command, text=True, capture_output=True, timeout=120, check=False)
    output = ((checked.stdout or "") + (checked.stderr or "")).strip()
    recognizable = bool(re.search(
        r"No errors or warnings detected|EPUB(?:Check)?[^\n]*(?:valid|completed)|\d+\s+errors?\s*/\s*\d+\s+warnings?",
        output,
        re.I,
    ))
    if checked.returncode != 0 or not output or not recognizable:
        raise RuntimeError("final EPUB failed independent EPUBCheck verification during cleanup")


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    create = subparsers.add_parser("create", help="create and initialize a workspace")
    create.add_argument("--subject", required=True)
    create.add_argument("--destination", required=True)
    create.add_argument("--language", default="en-US")
    create.add_argument("--constraint", action="append", default=[])
    create.add_argument("--temp-root")
    create.add_argument("--json", action="store_true")
    status = subparsers.add_parser("status", help="read workspace state")
    status.add_argument("--workspace", required=True)
    status.add_argument("--json", action="store_true")
    update = subparsers.add_parser("update", help="atomically update workspace state")
    update.add_argument("--workspace", required=True)
    update.add_argument("--phase", choices=sorted(PHASES))
    update.add_argument("--set-json", default="{}", help="JSON object of state values")
    update.add_argument("--approval-text")
    update.add_argument("--json", action="store_true")
    cleanup = subparsers.add_parser("cleanup", help="safely remove a recognized workspace")
    cleanup.add_argument("--workspace", required=True)
    cleanup.add_argument("--require-delivered", action="store_true", default=True)
    cleanup.add_argument("--force", action="store_true")
    cleanup.add_argument("--json", action="store_true")
    return parser


def main() -> int:
    args = _parser().parse_args()
    try:
        if args.command == "create":
            result = create_workspace(
                args.subject, args.destination, constraints=args.constraint,
                language=args.language, temp_root=args.temp_root,
            )
        elif args.command == "status":
            result = status_workspace(args.workspace)
        elif args.command == "update":
            values = json.loads(args.set_json)
            if not isinstance(values, dict):
                raise ValueError("--set-json must contain an object")
            result = update_workspace(
                args.workspace, phase=args.phase, values=values,
                approval_text=args.approval_text,
            )
        else:
            result = cleanup_workspace(
                args.workspace, require_delivered=args.require_delivered,
                force=args.force,
            )
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False, indent=2))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
