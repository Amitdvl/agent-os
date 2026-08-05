# ctx7 Guard

`ctx7_guard.py` is a Codex PreToolUse-style guard that blocks new dependency installs or external imports until the agent has fetched fresh documentation with the `ctx7` CLI.

## Files

- `ctx7_guard.py` - guard implementation.
- `ctx7_guard_config.example.json` - topic alias example.
- `tests/test_ctx7_guard.py` - focused behavior tests.

## Configuration

The guard is portable through environment variables:

```bash
export CTX7_GUARD_STATE_PATH="$TMPDIR/context7_guard_state.json"
export CTX7_GUARD_CONFIG_PATH="/path/to/ctx7_guard_config.json"
export CTX7_GUARD_TTL_SECONDS=900
```

If unset, paths default under `${CODEX_HOME:-$HOME/.codex}` so the same file can be used as a Codex-home hook.

Projects own their topic mappings. Keep package aliases in config rather than hardcoding project dependencies into the guard.
