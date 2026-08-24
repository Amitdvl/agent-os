#!/usr/bin/env python3
"""Validate the local prerequisites for a Codex nonfiction book run."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


MIN_FREE_BYTES = 250 * 1024 * 1024
REQUIRED_SKILL_FILES = (
    "SKILL.md", "README.md", "agents/openai.yaml",
    "references/editorial-standard.md", "references/research-standard.md",
    "references/prose-style.md", "references/revision-and-qa.md",
    "references/epub-standard.md", "scripts/preflight.py", "scripts/workspace.py",
    "scripts/manuscript_checks.py", "scripts/build_epub.py", "assets/epub.css",
)


def _version(command: list[str], path_env: str) -> str | None:
    try:
        completed = subprocess.run(
            command,
            text=True,
            capture_output=True,
            timeout=15,
            env={**os.environ, "PATH": path_env},
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if completed.returncode != 0:
        return None
    text = (completed.stdout or completed.stderr).strip()
    return text.splitlines()[0] if text else None


def _probe_writable(directory: Path) -> bool:
    try:
        fd, probe = tempfile.mkstemp(prefix=".codex-book-write-probe-", dir=directory)
        os.close(fd)
        os.unlink(probe)
        return True
    except OSError:
        return False


def run_preflight(
    destination: Path | str,
    *,
    skill_root: Path | str,
    path_env: str | None = None,
    temp_dir: Path | str | None = None,
    epubcheck_jar: Path | str | None = None,
    create_destination: bool = True,
    min_free_bytes: int = MIN_FREE_BYTES,
) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    active_path = path_env if path_env is not None else os.environ.get("PATH", "")
    skill = Path(skill_root).expanduser().resolve()
    destination_path = Path(destination).expanduser().resolve()
    temporary = Path(temp_dir or os.environ.get("TMPDIR") or "/tmp").expanduser().resolve()

    python_ok = sys.version_info >= (3, 11)
    if not python_ok:
        errors.append("Python 3.11 or newer is required")

    try:
        if destination_path.exists() and not destination_path.is_dir():
            raise NotADirectoryError(str(destination_path))
        if not destination_path.exists():
            if not create_destination:
                raise FileNotFoundError(str(destination_path))
            destination_path.mkdir(parents=True, exist_ok=True)
        destination_writable = _probe_writable(destination_path)
        if not destination_writable:
            errors.append(f"Destination is not writable: {destination_path}")
    except OSError as exc:
        destination_writable = False
        errors.append(f"Cannot prepare destination {destination_path}: {exc}")

    pandoc_path = shutil.which("pandoc", path=active_path)
    pandoc: dict[str, Any] | None = None
    if pandoc_path:
        pandoc = {
            "path": str(Path(pandoc_path).resolve()),
            "version": _version([pandoc_path, "--version"], active_path),
        }
        if not pandoc["version"]:
            errors.append(f"Pandoc version could not be read from {pandoc_path}")
    else:
        errors.append("Pandoc was not found on PATH")

    epubcheck: dict[str, Any] | None = None
    epubcheck_path = shutil.which("epubcheck", path=active_path)
    if epubcheck_path:
        version = _version([epubcheck_path, "--version"], active_path)
        epubcheck = {
            "mode": "executable",
            "path": str(Path(epubcheck_path).resolve()),
            "version": version,
        }
        if not version:
            epubcheck = None
            errors.append(f"EPUBCheck version probe failed for {epubcheck_path}")
    elif epubcheck_jar:
        jar = Path(epubcheck_jar).expanduser().resolve()
        java_path = shutil.which("java", path=active_path)
        if jar.is_file() and java_path:
            version = _version([java_path, "-jar", str(jar), "--version"], active_path)
            if version:
                epubcheck = {
                    "mode": "jar",
                    "path": str(jar),
                    "java_path": str(Path(java_path).resolve()),
                    "version": version,
                }
            else:
                errors.append("Configured EPUBCheck JAR invocation failed its version probe")
        else:
            errors.append("Configured EPUBCheck JAR or Java executable is unavailable")
    else:
        errors.append("EPUBCheck was not found on PATH and no JAR was configured")

    try:
        temporary.mkdir(parents=True, exist_ok=True)
        temp_writable = _probe_writable(temporary)
        if not temp_writable:
            errors.append(f"Temporary directory is not writable: {temporary}")
        free_bytes = shutil.disk_usage(temporary).free
        if free_bytes < min_free_bytes:
            errors.append(
                f"Temporary filesystem has {free_bytes} free bytes; at least {min_free_bytes} are required"
            )
    except OSError as exc:
        temp_writable = False
        free_bytes = None
        errors.append(f"Cannot use temporary directory {temporary}: {exc}")

    missing = [relative for relative in REQUIRED_SKILL_FILES if not (skill / relative).is_file()]
    errors.extend(f"Required skill file is missing: {relative}" for relative in missing)

    return {
        "ok": not errors,
        "python": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "python_supported": python_ok,
        "pandoc": pandoc,
        "epubcheck": epubcheck,
        "destination": str(destination_path),
        "destination_writable": destination_writable,
        "temp_dir": str(temporary),
        "temp_writable": temp_writable,
        "free_bytes": free_bytes,
        "skill_root": str(skill),
        "missing_skill_files": missing,
        "errors": errors,
        "warnings": warnings,
    }


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--destination", required=True)
    parser.add_argument("--skill-root", default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument("--epubcheck-jar", default=os.environ.get("EPUBCHECK_JAR"))
    parser.add_argument("--no-create-destination", action="store_true")
    parser.add_argument("--min-free-bytes", type=int, default=MIN_FREE_BYTES)
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    return parser


def main() -> int:
    args = _parser().parse_args()
    result = run_preflight(
        args.destination,
        skill_root=args.skill_root,
        epubcheck_jar=args.epubcheck_jar,
        create_destination=not args.no_create_destination,
        min_free_bytes=args.min_free_bytes,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
