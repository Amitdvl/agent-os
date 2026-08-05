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
  MESSAGE="${BLOCK_NO_VERIFY_MESSAGE:-Blocked: do not use git commit/push with --no-verify. Run the repository verification command and use the configured hooks instead.}"
  MESSAGE="$MESSAGE" python3 -c 'import json, os; print(json.dumps({"permissionDecision":"deny","message":os.environ["MESSAGE"]}))'
  exit 0
fi

echo '{}'
