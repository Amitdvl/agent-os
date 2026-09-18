---
name: publication-safety
description: Audit a Git repository before making it public, install repository-owned secret guards, and verify the release boundary. Use for public-source preparation, not ordinary private commits.
---

# Publication Safety

This is the audit and hardening engine for `/pre-publication`. A clean automated scan is necessary but never proof that a repository contains no private information. Do not print matched values, copy credentials into reports, or claim an absolute future guarantee.

## Audit

1. Resolve one repository, read its instructions, identify its Git common directory, all worktrees, remotes, default branch, reachable refs, submodules, Git LFS use, untracked/ignored paths, and public-facing artifacts (README, docs, screenshots, fixtures, metadata, licenses, workflows, release assets, packages, Actions logs, deployed endpoints). Reject ambiguous project names. Inventory private dependencies, personal identifiers, internal URLs, customer data, telemetry keys, license/IP rights, third-party assets, and product-specific information requiring the owner's decision. A `.gitignore` change does not remove data from Git history.
2. Run the bundled deterministic guard on the staged index, working tree, and all reachable local history. It reports only paths and reason categories. Review flagged material without echoing secret values. Also use a mature independent, history-capable secret scanner across all refs and the publication candidate; inspect its installed interface before use. If absent, obtain a reviewed project-scoped scanner through an appropriate supported installation path, or stop with the audit incomplete. Do not publish based on this bundled floor alone. Review GitHub remote refs and repository settings before treating a local scan as complete.
3. Inspect every proposed public surface, not just source code: GitHub description/topics, issues/discussions/wiki, Pages, release attachments, Actions logs/artifacts, Git LFS objects, submodules, package registries, CI variables and example configuration. Keep private credentials in the user's encrypted vault, never in the repository or scan output. If a real secret has appeared anywhere, revoke/rotate it first. History rewriting and changing collaborators' clones require a separate exact plan and authorization; a local deletion is not remediation for an already exposed secret.
4. Make safe local fixes: remove private material from the publication candidate while preserving a private backup outside the public repo when needed, replace real credentials with placeholders, tighten ignores, sanitize examples/fixtures/screenshots/docs, and document required configuration. Do not silently strip authored content, rewrite history, change licensing, publish a different sanitized repository, or declare an unknown owner-approved disclosure.

## Future-commit guards

Run `python3 <skill-root>/scripts/guard.py install --repo <absolute-repo-path>` after reviewing existing hooks and CI. It copies the guard into `.agents/publication-safety/guard.py`, adds a root `AGENTS.md` instruction, installs local pre-commit and pre-push checks plus a PR CI check, and configures `core.hooksPath` locally. The installer refuses conflicts and never replaces existing hooks, CI, or a configured hook path. Integrate with an existing hook framework explicitly, preserving its checks, then verify both stages. Every agent must run the audit before commit/push, never bypass hooks with `--no-verify`, and stop on an incomplete or flagged scan. GitHub branch rules and push protection should be enabled and verified where the account permits them; PR CI alone runs after a push and cannot prevent exposure on its own.

The bundled guard is a conservative floor, not a complete detector. It flags high-confidence credentials and sensitive filenames, scans reachable history, fails closed on oversized candidate blobs, and never displays matching content. Review false positives individually; never add a broad bypass just to obtain a green result.

## Release gate

Do not publicize until the candidate, all refs that will be exposed, and all other public surfaces are reviewed; real secrets are rotated; independent scanner and repository guard pass; verification/tests pass; target GitHub owner/name and visibility are unambiguous; existing remote settings and rules are checked; and the exact candidate SHA is frozen. Re-scan after any changes. The command owns the external publication decision; this skill never publishes on its own.
