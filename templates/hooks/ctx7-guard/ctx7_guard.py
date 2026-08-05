#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import re
import shlex
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


STATE_PATH = Path(
    os.environ.get(
        "CTX7_GUARD_STATE_PATH",
        str(Path(os.environ.get("CODEX_HOME", str(Path.home() / ".codex"))) / "tmp" / "context7_guard_state.json"),
    )
)
CONFIG_PATH = Path(
    os.environ.get(
        "CTX7_GUARD_CONFIG_PATH",
        str(Path(os.environ.get("CODEX_HOME", str(Path.home() / ".codex"))) / "hooks" / "ctx7_guard_config.json"),
    )
)
TTL_SECONDS = int(os.environ.get("CTX7_GUARD_TTL_SECONDS", str(15 * 60)))
SEPARATORS = {"&&", "||", ";", "|"}
FLAGS_WITH_VALUES = {
    "-C",
    "--cache-dir",
    "--config-settings",
    "--cwd",
    "--filter",
    "--project",
    "--python",
    "--registry",
}
DEFAULT_TOPIC_MAPPINGS = {
    "@clerk/clerk-react": {"@clerk/clerk-react", "clerk-react"},
    "@stripe/stripe-js": {"@stripe/stripe-js", "stripe-js"},
    "@tanstack/react-query": {
        "@tanstack/react-query",
        "react-query",
        "tanstack/query",
        "/tanstack/query/latest",
    },
    "anthropic": {"anthropic"},
    "fastapi": {"fastapi"},
    "google-genai": {"google.genai", "google-genai"},
    "httpx": {"httpx"},
    "openai": {"openai", "/openai/openai-python"},
    "pydantic": {"pydantic", "pydantic-settings"},
    "react-hook-form": {"@hookform/resolvers", "react-hook-form"},
    "react-router-dom": {"react-router", "react-router-dom"},
    "sqlalchemy": {"sqlalchemy"},
    "stripe": {"stripe"},
    "zod": {"zod"},
}
JS_IMPORT_RE = re.compile(
    r"""(?:from\s+|import\s*\(|import\s+)["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)"""
)
PY_FROM_IMPORT_RE = re.compile(r"^\s*from\s+([A-Za-z0-9_\.]+)\s+import\b")
PY_IMPORT_RE = re.compile(r"^\s*import\s+([A-Za-z0-9_\.\s,]+)")
PY_STDLIB_MODULES = set(getattr(sys, "stdlib_module_names", ()))


def emit(payload: dict[str, Any]) -> int:
    print(json.dumps(payload))
    return 0


def allow() -> int:
    return emit({})


def deny(message: str) -> int:
    return emit(
        {
            "permissionDecision": "deny",
            "message": f"[ctx7-guard] {message}",
        }
    )


def load_payload() -> dict[str, Any]:
    try:
        return json.loads(sys.stdin.read() or "{}")
    except json.JSONDecodeError:
        return {}


def first_string(*values: Any) -> str:
    for value in values:
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def normalize_topic_alias(value: str) -> str:
    return value.strip().strip("'\"").strip().lower().replace("_", "-")


def topic_variants(value: str) -> set[str]:
    normalized = normalize_topic_alias(value)
    if not normalized:
        return set()

    trimmed = normalized.strip("/")
    variants = {normalized, trimmed}

    if ":" in trimmed and not trimmed.startswith("@"):
        prefix, rest = trimmed.split(":", 1)
        if prefix == "node":
            return {normalized, trimmed}
        if rest:
            trimmed = rest.strip("/")
            variants.update({trimmed, rest})

    if trimmed.startswith("@"):
        parts = trimmed.split("/")
        if len(parts) >= 2:
            variants.add("/".join(parts[:2]))
            variants.add(parts[1])
    elif trimmed:
        segments = [segment for segment in trimmed.split("/") if segment]
        if segments:
            variants.add(segments[0])
            variants.add(segments[-1])
            if len(segments) >= 2:
                variants.add(segments[-2])
                variants.add("/".join(segments[:2]))
                variants.add("/".join(segments[-2:]))

    if "." in trimmed:
        dot_segments = [segment for segment in trimmed.split(".") if segment]
        if dot_segments:
            variants.add(dot_segments[0])
            variants.add(".".join(dot_segments[:2]))
            variants.add("-".join(dot_segments[:2]))

    return {variant for variant in variants if variant}


def normalize_topic_mappings(raw_topics: Any) -> dict[str, set[str]]:
    if not isinstance(raw_topics, dict):
        return dict(DEFAULT_TOPIC_MAPPINGS)

    normalized: dict[str, set[str]] = {}
    for canonical, aliases in raw_topics.items():
        if not isinstance(canonical, str):
            continue
        normalized_canonical = normalize_topic_alias(canonical).strip("/")
        if not normalized_canonical:
            continue

        values: set[str] = {canonical}
        if isinstance(aliases, list):
            values.update(alias for alias in aliases if isinstance(alias, str) and alias.strip())
        elif isinstance(aliases, str) and aliases.strip():
            values.add(aliases)

        normalized[normalized_canonical] = values

    return normalized or dict(DEFAULT_TOPIC_MAPPINGS)


def load_topic_mappings() -> dict[str, set[str]]:
    try:
        payload = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return dict(DEFAULT_TOPIC_MAPPINGS)
    except json.JSONDecodeError:
        return dict(DEFAULT_TOPIC_MAPPINGS)

    return normalize_topic_mappings(
        payload.get("topicMappings") or payload.get("guardedTopics")
    )


TOPIC_MAPPINGS = load_topic_mappings()


def alias_keys(value: str) -> set[str]:
    normalized = normalize_topic_alias(value)
    if not normalized:
        return set()
    trimmed = normalized.strip("/")
    return {key for key in {normalized, trimmed} if key}


def build_alias_index(topic_mappings: dict[str, set[str]]) -> dict[str, str]:
    alias_index: dict[str, str] = {}
    for canonical, aliases in topic_mappings.items():
        raw_values = set(aliases)
        raw_values.add(canonical)
        for alias in raw_values:
            for key in alias_keys(alias):
                alias_index[key] = canonical
    return alias_index


TOPIC_ALIAS_TO_CANONICAL = build_alias_index(TOPIC_MAPPINGS)


def mapped_topic(value: str) -> str:
    for key in alias_keys(value):
        canonical = TOPIC_ALIAS_TO_CANONICAL.get(key)
        if canonical:
            return canonical
    return ""


def root_external_topic(value: str) -> str:
    normalized = normalize_topic_alias(value).strip("/")
    if not normalized:
        return ""

    if ":" in normalized and not normalized.startswith("@"):
        prefix, rest = normalized.split(":", 1)
        if prefix == "node":
            return ""
        if prefix in {"npm", "jsr"} and rest:
            normalized = rest.strip("/")

    if normalized.startswith("@"):
        parts = normalized.split("/")
        return "/".join(parts[:2]) if len(parts) >= 2 else normalized
    if "/" in normalized:
        return normalized.split("/", 1)[0]
    if "." in normalized:
        return normalized.split(".", 1)[0]
    return normalized


def canonical_topic_for_lookup(value: str) -> str:
    root_topic = root_external_topic(value)
    return mapped_topic(value) or mapped_topic(root_topic) or root_topic


def canonical_topic_for_dependency(value: str) -> str:
    root_topic = root_external_topic(value)
    return mapped_topic(value) or mapped_topic(root_topic) or root_topic


def canonical_topic_for_js_import(specifier: str) -> str:
    normalized = normalize_topic_alias(specifier).strip("/")
    if not normalized:
        return ""
    if normalized.startswith((".", "/")) or normalized.startswith("@/"):
        return ""
    if normalized.startswith("node:"):
        return ""
    root_topic = root_external_topic(specifier)
    return mapped_topic(specifier) or mapped_topic(root_topic) or root_topic


def canonical_topic_for_python_import(module_name: str) -> str:
    root_topic = root_external_topic(module_name)
    if not root_topic:
        return ""
    if root_topic in PY_STDLIB_MODULES:
        return ""
    return mapped_topic(module_name) or mapped_topic(root_topic) or root_topic


def tool_input_dict(payload: dict[str, Any]) -> dict[str, Any]:
    tool_input = payload.get("tool_input")
    if isinstance(tool_input, dict):
        return tool_input
    tool_input = payload.get("toolInput")
    if isinstance(tool_input, dict):
        return tool_input
    return {}


def extract_command(payload: dict[str, Any]) -> str:
    tool_input = tool_input_dict(payload)
    return first_string(
        payload.get("command"),
        tool_input.get("command"),
    )


def extract_cwd(payload: dict[str, Any]) -> str:
    tool_input = tool_input_dict(payload)
    return first_string(
        payload.get("cwd"),
        payload.get("workdir"),
        payload.get("working_directory"),
        tool_input.get("cwd"),
        tool_input.get("workdir"),
        tool_input.get("working_directory"),
        os.getcwd(),
    )


def repo_key(cwd: str) -> str:
    try:
        result = subprocess.run(
            ["git", "-C", cwd, "rev-parse", "--show-toplevel"],
            check=False,
            capture_output=True,
            text=True,
            timeout=5,
        )
    except Exception:
        return str(Path(cwd).resolve())
    if result.returncode == 0:
        resolved = result.stdout.strip()
        if resolved:
            return resolved
    return str(Path(cwd).resolve())


def load_state() -> dict[str, Any]:
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}


def save_state(state: dict[str, Any]) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")


def tokenize(command: str) -> list[str]:
    try:
        return shlex.split(command, posix=True)
    except ValueError:
        return command.split()


def has_non_flag_arg(tokens: list[str], start_idx: int) -> bool:
    idx = start_idx
    while idx < len(tokens):
        token = tokens[idx]
        if token in SEPARATORS:
            return False
        if not token.startswith("-"):
            return True
        idx += 1
    return False


def classify_ctx7(tokens: list[str]) -> str | None:
    for idx, token in enumerate(tokens):
        if token == "context7":
            return "legacy-context7"
        if token == "ctx7" and idx + 1 < len(tokens):
            if tokens[idx + 1] == "library":
                return "ctx7-library"
            if tokens[idx + 1] == "docs":
                return "ctx7-docs"
        if token in {"npx", "bunx"} and idx + 2 < len(tokens) and tokens[idx + 1] == "ctx7":
            if tokens[idx + 2] == "library":
                return "ctx7-library"
            if tokens[idx + 2] == "docs":
                return "ctx7-docs"
    return None


def subcommand_start(tokens: list[str], executable: str, subcommand: str) -> int | None:
    for idx, token in enumerate(tokens):
        if token == executable and idx + 1 < len(tokens) and tokens[idx + 1] == subcommand:
            return idx + 2
        if token in {"npx", "bunx"} and idx + 2 < len(tokens) and tokens[idx + 1] == executable:
            if tokens[idx + 2] == subcommand:
                return idx + 3
    return None


def first_non_flag_token(tokens: list[str], start_idx: int) -> str:
    idx = start_idx
    while idx < len(tokens):
        token = tokens[idx]
        if token in SEPARATORS:
            return ""
        if not token.startswith("-"):
            return token
        idx += 1
    return ""


def parse_ctx7_library_topic(tokens: list[str]) -> str:
    start_idx = subcommand_start(tokens, "ctx7", "library")
    if start_idx is None:
        return ""
    return first_non_flag_token(tokens, start_idx)


def parse_ctx7_docs_library_id(tokens: list[str]) -> str:
    start_idx = subcommand_start(tokens, "ctx7", "docs")
    if start_idx is None:
        return ""
    return first_non_flag_token(tokens, start_idx)


def dependency_add_command(tokens: list[str]) -> str | None:
    for idx, token in enumerate(tokens):
        next_token = tokens[idx + 1] if idx + 1 < len(tokens) else ""
        if token == "bun" and next_token == "add" and has_non_flag_arg(tokens, idx + 2):
            return "bun add"
        if token == "npm" and next_token in {"install", "i"} and has_non_flag_arg(tokens, idx + 2):
            return f"npm {next_token}"
        if token == "pnpm" and next_token == "add" and has_non_flag_arg(tokens, idx + 2):
            return "pnpm add"
        if token == "yarn" and next_token == "add" and has_non_flag_arg(tokens, idx + 2):
            return "yarn add"
        if token == "uv" and next_token == "add" and has_non_flag_arg(tokens, idx + 2):
            return "uv add"
        if token in {"pip", "pip3"} and next_token == "install" and has_non_flag_arg(tokens, idx + 2):
            return f"{token} install"
        if token.startswith("python") and idx + 3 < len(tokens):
            if tokens[idx + 1] == "-m" and tokens[idx + 2] in {"pip", "pip3"} and tokens[idx + 3] == "install":
                if has_non_flag_arg(tokens, idx + 4):
                    return f"{tokens[idx + 2]} install"
        if token == "poetry" and next_token == "add" and has_non_flag_arg(tokens, idx + 2):
            return "poetry add"
        if token == "cargo" and next_token == "add" and has_non_flag_arg(tokens, idx + 2):
            return "cargo add"
        if token == "go" and next_token == "get" and has_non_flag_arg(tokens, idx + 2):
            return "go get"
        if token == "gem" and next_token == "install" and has_non_flag_arg(tokens, idx + 2):
            return "gem install"
        if token == "composer" and next_token == "require" and has_non_flag_arg(tokens, idx + 2):
            return "composer require"
    return None


def extract_package_token(token: str) -> str:
    candidate = token.strip().strip(",")
    if not candidate or candidate.startswith("-"):
        return ""
    if "/" in candidate and not candidate.startswith("@"):
        return ""
    if candidate.startswith("@"):
        match = re.match(r"^@[^/]+/[^@/<>=!~\s]+", candidate)
        return match.group(0) if match else ""
    match = re.match(r"^[A-Za-z0-9_.-]+", candidate)
    return match.group(0) if match else ""


def collect_dependency_targets(tokens: list[str], start_idx: int) -> list[str]:
    targets: list[str] = []
    skip_next = False
    idx = start_idx
    while idx < len(tokens):
        token = tokens[idx]
        if token in SEPARATORS:
            break
        if skip_next:
            skip_next = False
            idx += 1
            continue
        if token in FLAGS_WITH_VALUES:
            skip_next = True
            idx += 1
            continue
        package = extract_package_token(token)
        if package:
            targets.append(package)
        idx += 1
    return targets


def dependency_targets(tokens: list[str]) -> list[str]:
    for idx, token in enumerate(tokens):
        next_token = tokens[idx + 1] if idx + 1 < len(tokens) else ""
        if token == "bun" and next_token == "add":
            return collect_dependency_targets(tokens, idx + 2)
        if token == "npm" and next_token in {"install", "i"}:
            return collect_dependency_targets(tokens, idx + 2)
        if token == "pnpm" and next_token == "add":
            return collect_dependency_targets(tokens, idx + 2)
        if token == "yarn" and next_token == "add":
            return collect_dependency_targets(tokens, idx + 2)
        if token == "uv" and next_token == "add":
            return collect_dependency_targets(tokens, idx + 2)
        if token in {"pip", "pip3"} and next_token == "install":
            return collect_dependency_targets(tokens, idx + 2)
        if token.startswith("python") and idx + 3 < len(tokens):
            if tokens[idx + 1] == "-m" and tokens[idx + 2] in {"pip", "pip3"} and tokens[idx + 3] == "install":
                return collect_dependency_targets(tokens, idx + 4)
        if token == "poetry" and next_token == "add":
            return collect_dependency_targets(tokens, idx + 2)
        if token == "cargo" and next_token == "add":
            return collect_dependency_targets(tokens, idx + 2)
        if token == "go" and next_token == "get":
            return collect_dependency_targets(tokens, idx + 2)
        if token == "gem" and next_token == "install":
            return collect_dependency_targets(tokens, idx + 2)
        if token == "composer" and next_token == "require":
            return collect_dependency_targets(tokens, idx + 2)
    return []


def topic_docs_recent(record: dict[str, Any], topic: str, now: float) -> bool:
    proofs = record.get("docs_proofs")
    if not isinstance(proofs, dict):
        return False
    proof = proofs.get(topic)
    if not isinstance(proof, dict):
        return False
    proof_at = float(proof.get("at", 0) or 0)
    return proof_at > 0 and now - proof_at <= TTL_SECONDS


def record_docs_proofs(record: dict[str, Any], topics: set[str], now: float, command: str) -> None:
    proofs = record.setdefault("docs_proofs", {})
    if not isinstance(proofs, dict):
        proofs = {}
        record["docs_proofs"] = proofs
    for topic in topics:
        proofs[topic] = {"at": now, "command": command}


def extract_patch_text(payload: dict[str, Any]) -> str:
    tool_input = tool_input_dict(payload)
    raw_tool_input = payload.get("tool_input")
    if isinstance(raw_tool_input, str):
        return raw_tool_input
    return first_string(
        payload.get("input"),
        payload.get("patch"),
        tool_input.get("input"),
        tool_input.get("patch"),
        tool_input.get("new_string"),
        tool_input.get("content"),
    )


def patch_added_lines(text: str) -> list[str]:
    if "*** Begin Patch" not in text:
        return text.splitlines()
    lines: list[str] = []
    for line in text.splitlines():
        if line.startswith("+") and not line.startswith("+++"):
            lines.append(line[1:])
    return lines


def js_import_topics(line: str) -> set[str]:
    topics: set[str] = set()
    for match in JS_IMPORT_RE.finditer(line):
        specifier = match.group(1) or match.group(2) or ""
        topic = canonical_topic_for_js_import(specifier)
        if topic:
            topics.add(topic)
    return topics


def python_import_topics(line: str) -> set[str]:
    topics: set[str] = set()
    if '"' in line or "'" in line:
        return topics
    from_match = PY_FROM_IMPORT_RE.match(line)
    if from_match:
        topic = canonical_topic_for_python_import(from_match.group(1))
        if topic:
            topics.add(topic)
    import_match = PY_IMPORT_RE.match(line)
    if import_match:
        imported = import_match.group(1)
        for entry in imported.split(","):
            raw_topic = entry.strip().split()[0] if entry.strip() else ""
            topic = canonical_topic_for_python_import(raw_topic)
            if topic:
                topics.add(topic)
    return topics


def external_topics_from_patch(text: str) -> set[str]:
    topics: set[str] = set()
    for line in patch_added_lines(text):
        topics.update(js_import_topics(line))
        topics.update(python_import_topics(line))
    return topics


def format_topics(topics: set[str]) -> str:
    return ", ".join(f"`{topic}`" for topic in sorted(topics))


def docs_library_matches_topic(library_id: str, topic: str) -> bool:
    return topic in topic_variants(library_id)


def library_recent(record: dict[str, Any], now: float) -> bool:
    looked_up_at = float(record.get("last_library_at", 0) or 0)
    return looked_up_at > 0 and now - looked_up_at <= TTL_SECONDS


def main() -> int:
    payload = load_payload()
    command = extract_command(payload)
    patch_text = extract_patch_text(payload)

    cwd = extract_cwd(payload)
    key = repo_key(cwd)
    tokens = tokenize(command) if command else []
    state = load_state()
    record = state.get(key, {})
    now = time.time()

    ctx7_kind = classify_ctx7(tokens)
    if ctx7_kind == "legacy-context7":
        return deny(
            "Blocked legacy `context7` command. Use the official Upstash CLI instead: "
            "`ctx7 library <name> [query]` then `ctx7 docs <libraryId> <query>`."
        )

    if ctx7_kind == "ctx7-library":
        library_topic = canonical_topic_for_lookup(parse_ctx7_library_topic(tokens))
        record["last_library_at"] = now
        record["last_library_command"] = command
        if library_topic:
            record["pending_topic"] = library_topic
        else:
            record.pop("pending_topic", None)
        state[key] = record
        save_state(state)
        return allow()

    if ctx7_kind == "ctx7-docs":
        docs_library_id = parse_ctx7_docs_library_id(tokens)
        pending_topic = first_string(record.get("pending_topic"))
        docs_topic = mapped_topic(docs_library_id)
        if not docs_topic and pending_topic and docs_library_matches_topic(docs_library_id, pending_topic):
            docs_topic = pending_topic

        record["last_docs_at"] = now
        record["last_docs_command"] = command
        if docs_topic:
            record_docs_proofs(record, {docs_topic}, now, command)
        record.pop("pending_topic", None)
        state[key] = record
        save_state(state)
        return allow()

    if patch_text:
        touched_topics = external_topics_from_patch(patch_text)
        missing_topics = {topic for topic in touched_topics if not topic_docs_recent(record, topic, now)}
        if missing_topics:
            return deny(
                "Blocked edit touching "
                f"{format_topics(missing_topics)} without recent matching `ctx7` docs. "
                "Run `ctx7 library <name> [query]` and `ctx7 docs <libraryId> <query>`, then retry."
            )

    dependency_command = dependency_add_command(tokens)
    if not dependency_command:
        return allow()

    requested_topics = {
        canonical_topic_for_dependency(target)
        for target in dependency_targets(tokens)
        if canonical_topic_for_dependency(target)
    }
    if not requested_topics:
        return allow()

    missing_requested_topics = {
        topic for topic in requested_topics if not topic_docs_recent(record, topic, now)
    }
    if not missing_requested_topics:
        return allow()

    pending_topic = first_string(record.get("pending_topic"))
    if (
        len(missing_requested_topics) == 1
        and pending_topic in missing_requested_topics
        and library_recent(record, now)
    ):
        return deny(
            "Blocked dependency add after only resolving the library. Run "
            "`ctx7 docs <libraryId> <query>` first, then retry the install command."
        )

    return deny(
        "Blocked dependency add touching "
        f"{format_topics(missing_requested_topics)} without recent matching `ctx7` docs. "
        "Run `ctx7 library <name> [query]` and `ctx7 docs <libraryId> <query>`, then retry."
    )


if __name__ == "__main__":
    raise SystemExit(main())
