---
name: add
description: Use when /add onboards a machine-local CLI or service for future Agent OS use.
---

# Add

Use `/add <tool-name-or-url>`. With no argument, ask for the tool, package, repository, or documentation URL.

## Workflow

1. Inspect the Agent OS worktree and installed portable registry/host links; preserve unrelated changes. Check an existing binary only when it is already known.
2. Discover the upstream from primary documentation, release/package metadata, and installed help. Identify binary, supported install/version/help commands, setup/config and data-root placeholders, auth model, structured output, safe reads, guarded writes, destructive/account mutations, limitations, and license/provenance.
3. `/add` authorizes the named local installation/configuration flow. First show `agent-os install --tools <id>` and a setup preview. Execute only `install --apply --reviewed-install` after source review. Never silently log in, grant OAuth/permissions, add extensions, or mutate a remote service.
4. Update the Agent OS source mirror: tool/source/pack/secret manifests; canonical tool template; central registry rendering; host symlink plan; broad binary allow rule; portable global routing policy; and vault requirement metadata. Keep generated host copies equivalent through the central template.
5. For secrets, create only a new independent encrypted-vault requirement/placeholder. Never copy, inspect, print, or request values in chat. Interactive login, browser extensions, consent, macOS permissions, and remote changes remain human checkpoints.
6. Verify `command -v`, version/help where installed; manifest validation; tests; rendered registry; tool folder; host symlink; and allow-rule plan.

## Stop conditions

Stop for an unidentified tool, unsafe/conflicting upstream identity, unresolved ownership, unavailable required credentials, or an unrequested interactive/paid/remote action.

## Report

Return Tool (binary/version/source); Integration (template/registry/routing/symlink/rule/vault); Verification (commands/results); and Blocked (exact condition/next action).
