---
name: add
description: Use when /add authorizes onboarding a named local tool into Agent OS, including its reviewed local installation/configuration flow.
---

# Add

Use `/add <tool-or-url>` to authorize onboarding a named local tool. In an Agent OS deployment, that means its selected, reviewed install/configuration flow; in the source checkout, it also means maintaining the portable contract.

1. Inspect authoritative upstream documentation, installed help when available, versioning, license, binary names, authentication, data roots, read/write surfaces, and destructive operations.
2. For a known resolved tool, show `agent-os install --tools <id>` and the corresponding setup preview. Execute only the separately reviewed install mode after the user has explicitly authorized the named tool.
3. Add or update the tool, source, pack, secret-requirement, registry, per-tool template, host-symlink plan, allow-rule generation, and generated-skill metadata when the capability is new or changes.
4. Keep credentials, account IDs, sessions, archives, and absolute personal paths out of the repository.
5. Interactive OAuth/login, browser extensions, account consent, macOS permissions, and remote mutations remain human checkpoints even after `/add` authorizes local installation/configuration.
6. Validate manifests and tests, then document the future human setup checkpoint.

Stop when upstream identity/license is unresolved, safe authentication cannot be separated, or the requested integration would weaken the focus policy.
