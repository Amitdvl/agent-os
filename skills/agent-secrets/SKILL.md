---
name: agent-secrets
description: Apply the portable SOPS plus age encrypted-vault contract when credentials, API keys, tokens, cookies, backup codes, or agent-accessible secrets are required.
---

# Agent Secrets Contract

Check the configured user's existing vault and matching `tools/*.sops.yaml`
inventory / `tools/*.sops.env` process records before asking for access or
creating replacement credentials. Use the user's configured helper and
process-scoped injection; never copy another machine's vault.

Only for a new independent vault, start with `agent-os vault init --tools <id>`
to preview SOPS + age setup. Apply with a new user-owned age recipient or
`--generate-age-key`; initialization creates encrypted inventory and env
placeholders, never copied values. Use `agent-os vault validate --verify-crypto`
to decrypt only to `/dev/null` and verify cleanup.

Whenever adding, integrating, installing, authenticating or standardizing an
external service or machine-local tool, update its structured
`tools/*.sops.yaml` inventory in the same task; add `tools/*.sops.env` or
project-specific SOPS env files for process credentials when appropriate.
Record variable names, scopes, source paths, account/project names, ownership
and agent-vs-human access classification. Store agent-accessible API keys and
integration tokens during creation or first use through the existing authorized
safe mechanism; use placeholders when actual values cannot be captured safely.

Never ask for secrets in chat, print decrypted values or credential files,
inspect browser credential/session stores, or commit plaintext env files,
temporary exports or private keys. Keep human-only access separate unless
explicitly granted. Prefer scoped API keys, app passwords and service accounts.
Preserve existing values unless replacement is explicitly requested. Verify the
vault temporary directory is empty after every secret operation. Agent OS holds
only portable requirement metadata, never the user's inventory or values.
