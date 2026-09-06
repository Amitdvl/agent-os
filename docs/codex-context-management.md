# Optional Codex Full Access and context management

The portable settings are in `templates/codex-full-access-context.toml`.
Merge them only when the owner requests Full Access and the context experiment;
this template is not automatically installed. Preserve all unrelated configuration.

`approval_policy = "never"` and `sandbox_mode = "danger-full-access"`
already select unrestricted command execution. There is no stronger normal
filesystem setting. Live web search supplies current retrieval. These settings
do not override higher-priority policies, explicit action scope, focus protections,
connector approvals, or operating-system permissions.

The context-management experiment retains notes and searchable history within
the same task. It does not require enabling persistent cross-task memories.
Keep the separate memory settings disabled; do not create or inspect memory stores.

Before changing shared configuration, run each installed client's version check
and `-c 'features.context_management.experimental_mode=true' features list`.
Codex 0.153.4 was verified to accept this setting. Codex 0.151.0 rejects the
nested feature table and fails to load configuration; upgrade incompatible clients
before adding the setting. A quoted dotted key is not a substitute for the real
nested setting. Back up the local config privately, merge only the requested
settings, and verify both terminal and desktop clients report context management
enabled and memories disabled. Start a new task afterward. Account eligibility
and workspace requirements still apply; parsing alone does not prove activation.

Keep only settings the installed client recognizes. In Codex 0.153.4,
`terminal_resize_reflow` and `js_repl` are retired feature flags, so remove
them from an existing `[features]` table rather than carrying them forward.

Source: [OpenAI configuration reference](https://developers.openai.com/codex/config-reference/),
checked 2026-09-06, plus local compatibility probes against the versions above.
Full live configuration, backups, account details, paths, and client-owned state
are intentionally excluded from the portable twin.
