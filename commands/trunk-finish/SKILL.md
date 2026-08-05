---
name: trunk-finish
description: Use when finishing, verifying, committing, merging, pushing, or cleaning up completed trunk-based work.
---

# Trunk Finish

This is recovery-first: repair missing or stale repository-local finish policy before declaring the task blocked.

1. Inspect status, branch, remotes, worktrees, untracked files, and diff summary. Isolate intended changes from unrelated user work.
2. Read repository instructions, workflow/contributor docs, and relevant subsystem docs before any merge or push.
3. Discover verification from policy, package manifests, CI, README, scripts, and conventions. If missing, create or repair repository-local policy using the safest inferred defaults.
4. Infer trunk from upstream default, then `main`, then `master`; use named worktree tooling when available.
5. Run changed-scope checks first, then broader required checks. Treat auth, secrets, crypto, payments, migrations, deletion, permissions, networking, CI/CD, release, and config as sensitive surfaces and run the documented risk review.
6. Stage only intended work and any policy repair, commit clearly, then push/merge only when authorized by both the user and repository policy. Clean branches/worktrees only after successful integration and ownership checks.

If no test command exists, run the narrowest build/static verification and record that limitation. Stop on failed verification, unresolved ownership, incomplete sensitive review, merge conflicts requiring judgment, or missing push authority.

## Report

Return exact verification results; config repair status; sensitive review status; commit hash/message; merge/push action or skip; cleanup; and any blocker with its next action.
