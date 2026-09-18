---
name: archive
description: Use for /archive or a request to move a named local project or stale work into the user's ArchivedProjects folder without deleting its contents.
---

# Archive

Move an identified project folder into the current user's `Documents/ArchivedProjects` folder. Preserve the complete folder, including Git history, uncommitted files, and untracked work. This is organization, not disk cleanup.

## Usage

```text
/archive <project name or path>
/archive <several named projects>
/archive old projects
```

With no input, ask which project or work to archive. A named, unambiguous project authorizes its move; do not ask again merely because the move is local. A broad request such as “old projects” needs a concrete candidate list and the user's classification of uncertain items before moving them. A prior approval of that list authorizes the selected moves.

## Resolve the target

1. Search the user's local project locations, including outside the current Codex workspace. Prefer an exact path when supplied. For a name, find matching folders and inspect enough README, project markers, and Git metadata to identify the intended project.
2. Distinguish the main project from duplicate clones, linked Git worktrees, dependency checkouts, backups, installed tools, and generated build folders. Age or an old commit alone does not establish that a project is stale.
3. If several plausible folders match, show their exact paths and ask which to archive. Do not silently broaden one named project into its duplicates or related data.
4. If the folder is already in `ArchivedProjects`, report its location and stop.

## Move safely

- Resolve the signed-in user's home directory and use its `Documents/ArchivedProjects` child unless the user has specified another archive destination. Create that folder when needed. Do not embed a machine-specific home path in this command.
- Before moving, resolve the exact source and destination. Refuse a source that is a symlink, a filesystem root, the home directory, a system/application directory, the archive root, or an ancestor of the archive root. Check for a destination collision and active processes or services that depend on the source path. Ask only when the target or impact cannot be resolved from the request and current evidence.
- Preserve the source as a whole. Do not reset Git, prune worktrees, delete build artifacts, remove backups, or alter project contents as part of archiving.
- Prefer a same-filesystem rename. If the source is a linked Git worktree, use `git worktree move`. If moving the main repository changes the common Git directory's path, run `git worktree repair` and verify every known linked worktree, including those that stay outside the archive. For a cross-filesystem or cloud-synced move, verify the destination's complete contents before removing the original; pause if that cannot be done reliably.
- Give same-named projects distinct, descriptive destination names. Never overwrite or merge an existing archive folder.

## Verify and report

Confirm each original path is absent, each archived path exists, and Git opens in moved repositories and linked worktrees. Report the archive path, any retained related copies, and any unresolved path dependency. Do not claim disk space was reclaimed by a move.
