#!/usr/bin/env bash
# block_no_verify.sh — PreToolUse hook for Bash commands
# Blocks git commit/push commands that try to bypass repo hooks with --no-verify.
set -euo pipefail

INPUT=$(cat)

CMD=$(printf '%s' "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:[[:space:]]*"//;s/"$//' || true)
if [ -z "$CMD" ]; then
  CMD=$(printf '%s' "$INPUT" | python3 -c 'import sys,json; print(json.loads(sys.stdin.read()).get("tool_input",{}).get("command",""))' 2>/dev/null || true)
fi

if [ -z "$CMD" ]; then
  echo '{}'
  exit 0
fi

if printf '%s' "$CMD" | grep -qE 'git[[:space:]]+(commit|push)\b.*--no-verify\b' 2>/dev/null; then
  DEFAULT_MESSAGE="Blocked: do not use git commit/push with --no-verify. Run the repository verification command and use the configured hooks instead."
  CONFIG_PATH="${BLOCK_NO_VERIFY_CONFIG_PATH:-${CODEX_HOME:-$HOME/.codex}/hooks/block_no_verify_config.json}"
  MESSAGE="${BLOCK_NO_VERIFY_MESSAGE:-$(python3 - "$CONFIG_PATH" "$DEFAULT_MESSAGE" <<'PY'
import json
import sys

try:
    with open(sys.argv[1], encoding="utf-8") as handle:
        value = json.load(handle).get("message")
        if isinstance(value, str) and value.strip():
            print(value)
        else:
            print(sys.argv[2])
except (FileNotFoundError, json.JSONDecodeError, OSError):
    print(sys.argv[2])
PY
)}"
  MESSAGE="$MESSAGE" python3 -c 'import json, os; print(json.dumps({"permissionDecision":"deny","message":os.environ["MESSAGE"]}))'
  exit 0
fi

echo '{}'
