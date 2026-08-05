---
name: agent-secrets
description: Apply the portable SOPS plus age encrypted-vault contract when credentials, API keys, tokens, cookies, backup codes, or agent-accessible secrets are required.
---

# Agent Secrets Contract

Start with `agent-os vault init --tools <id>` to preview a new independent SOPS + age vault. Apply only with a new user-owned age recipient or `--generate-age-key`; initialization creates encrypted inventory and env placeholders, never copied values. Use `agent-os vault validate --verify-crypto` to decrypt only to `/dev/null` and verify cleanup. Never ask for secrets in chat, print decrypted values, inspect browser credential stores, or copy another machine's vault. Record requirement names, scopes, ownership, and agent-vs-human access classification in the user's encrypted inventory. Preserve existing values unless replacement is explicitly requested and verify the vault temporary directory is empty after provider operations.
