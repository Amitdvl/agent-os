---
name: trunk-finish
description: Verify and finish completed work in a trunk-based repository using project-owned policy and conservative defaults.
---

# Trunk Finish

1. Inspect branch, status, remotes, worktrees, instructions, and intended diff; preserve unrelated work.
2. Discover verification from project policy, package manifests, CI, and existing scripts. Do not invent passing evidence.
3. Run changed-scope checks, then broader checks required by sensitive surfaces.
4. Stage only intended files and commit clearly.
5. Push or merge only when requested or unambiguously required by project policy and authorized remote state.
6. Clean branches/worktrees only after successful integration and ownership checks.

Stop on failing verification, unresolved user-owned changes, conflicts requiring product judgment, missing remote authority, or incomplete sensitive-surface review.

