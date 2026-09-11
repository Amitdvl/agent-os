---
name: trunk-finish
description: Use when the user asks to finish, verify, commit, merge, push, or clean up completed work in a trunk-based repository.
---

# Trunk Finish

This command is a project-adapted finish flow for trunk-based repositories.
Invoking it is an instruction to finish the repository work, not a request for
another merge/push decision. After verification, commit intended work, promote
the verified branch to trunk, push trunk, and clean up safe merged branches and
worktrees. Do not pause to ask whether to perform those ordinary finish actions.

It is recovery-first: when expected repo configuration is missing or stale, fix
or bootstrap that configuration from the repository before deciding the task is
blocked.

## Operating Principle

Deliver the finish outcome. Do not stop just because the repository is missing
finish metadata, verification commands, sensitive-surface declarations, or push
policy. First inspect the repository, infer the safest useful defaults, write the
missing repo-local configuration, and continue the finish flow with that
configuration.

Repo-specific finish policy belongs in the repository's normal agent instructions
or workflow docs, not in a duplicate repo-local `trunk-finish` skill. Prefer
updating `AGENTS.md`, `.agents/`, or existing workflow docs when policy is
missing. If a repo already has an established config location, use that location
instead.

## Workflow

1. Inspect status, branch, remotes, worktrees, and diff summary. Include
   untracked files and check all relevant worktrees before deciding ownership.
2. Identify intended changes and exclude unrelated user-owned work. Preserve
   untracked design files, generated artifacts, and unrelated worktrees when
   ownership is clear; report them instead of letting them derail promotion.
3. Load current project policy before merge or push. Read `AGENTS.md` when it
   exists, then the repo's documented workflow or contributor guide, plus any
   subsystem docs relevant to the changed files.
4. Load project verification commands from policy or config. If config is
   missing, create it by inspecting package manifests, CI workflows, README
   instructions, existing scripts, and repo conventions.
5. Infer or repair missing finish policy:
   - Trunk branch: prefer the current upstream default branch, then `main`, then
     `master`.
   - Verification: prefer changed-scope tests and existing package/CI commands;
     if none are declared, use the narrowest available build, test, lint, or
     typecheck command discovered in the repo.
   - Sensitive surfaces: include auth, secrets, crypto, payments, migrations,
     data deletion, permissions, networking, CI/CD, release, and config files
     unless the repo declares a more specific list.
   - Push/merge: prefer the repo's existing documented policy; otherwise commit
     locally and push only when the current branch tracks a remote and pushing is
     consistent with the user's request and repository state.
   - Worktree tooling: if the repo policy names a worktree tool such as
     Worktrunk, use it for branch/worktree lifecycle and cleanup when available.
     Fall back to explicit git only when the tool is unavailable or unsuitable.
6. Run changed-scope verification first, then broader checks required by the
   touched surface.
7. Run risk review when changed files match configured sensitive surfaces. Use
   the repo's named review skill or command when one is documented.
8. Stage only intended files, including any finish config created or repaired as
   part of this run. Never stage preserved user-owned or generated artifacts.
9. If intended changes are uncommitted, commit them with a clear message. Do
   not create an empty commit when the intended work is already committed.
10. Promote the verified work to the inferred trunk branch and push it. Prefer
    fast-forwarding when trunk is an ancestor of the verified branch. If trunk
    and the verified branch diverge, use the repository's documented merge
    workflow; stop only for a real conflict, missing authority, or a policy
    requirement. Do not ask for confirmation for a normal merge or push when
    this command was invoked.
11. After a successful push, delete only merged local branches and remove only
    temporary worktrees created for this finish run. Do not delete the trunk,
    unmerged branches, user-owned worktrees, or preserved untracked files.

## Repair Behavior

- If required finish config is missing, create it and proceed.
- If the worktree is otherwise clean but finish config is missing, the config
  repair is the deliverable: verify it, stage it, and commit it.
- If verification commands are absent, discover and record the best available
  commands before running them.
- If no test command exists, run the best available build or static validation
  and record that no dedicated test command exists.
- If push/merge policy is absent, record a conservative policy and proceed as far
  as safely possible under it.
- If generated config would overlap unrelated user-owned dirty changes, preserve
  the user changes and place the new config in a non-conflicting repo-local path.
- If the intended work is already committed and trunk can be fast-forwarded,
  perform that promotion directly; a clean worktree is not a reason to stop.
- If unrelated untracked files remain after promotion, leave them in place and
  report their paths under Cleanup; do not turn them into a blocking question.

## Stop Conditions

- Verification fails.
- Sensitive-surface review is incomplete after attempting to run it.
- Unrelated dirty changes make ownership unclear and cannot be isolated.
- Merge conflicts require product or architecture judgment.
- The project policy requires approval that has not been granted.
- The repository lacks enough structure to infer any safe verification command or
  finish policy, and no config can be created without guessing.

## Output Contract

- `Verification`: exact commands and results.
- `Config repair`: not needed, created, updated, or blocked.
- `Sensitive review`: not needed, done, or blocked.
- `Commit`: hash and message, if created.
- `Merge/push`: action taken or skipped.
- `Cleanup`: branches or worktrees removed.
- `Blocked`: exact blocker and next action.

When the flow completes, report the finish actions and any preserved user-owned
or generated files. Do not report a speculative product/UI concern as a blocker
unless the repository contains an actual conflict or the user explicitly asks
to change the product scope.
