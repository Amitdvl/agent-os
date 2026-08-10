---
name: trashness
description: Scan a Mac for high-confidence disposable files, present one exact approval manifest grouped under Trashness by parent folder, permanently delete only the approved targets, and verify the result. Use for /trashness, periodic Mac cleanup, cache cleanup, stale installers and archives, obsolete IDE extensions, or generated project artifacts when the user wants real deletion after review.
---

# Trashness

Use `/trashness` to reclaim disk space through an approval-gated cleanup. A run
must not stop after reporting once the user approves: delete the approved set,
verify every outcome, and report reclaimed space.

## Usage

```text
/trashness
/trashness <optional roots or category hints>
```

No argument means scan the current user's normal local cleanup surfaces. Treat
extra arguments as narrower scope, never as permission to weaken protection.

## Operating Principle

Use two phases in one task:

1. Read-only discovery and an exact approval manifest.
2. Permanent deletion of only the approved manifest, followed by verification.

Approval is mandatory. Do not infer approval from invoking the command, a
scheduled automation, earlier cleanup consent, or approval in another task.
Do not auto-approve, fabricate a reply, or delete while waiting.

## Eligible Categories

Include only candidates whose purpose is rebuildable or whose file type and
location make disposal highly confident:

- contents of well-known user and application cache directories;
- package-manager download caches and stale package versions that can be
  recreated without losing project or account state;
- browser `Cache`, `Code Cache`, `GPUCache`, and shader-cache contents only;
- logs, crash reports, temporary downloads, and incomplete-download fragments
  that are stale and not open;
- installers such as `.dmg`, `.pkg`, `.mpkg`, `.xip`, and `.iso` in Downloads
  or Desktop, normally at least 14 days old;
- archives such as `.zip`, `.tar`, `.tar.gz`, `.tgz`, `.7z`, and `.rar` in
  Downloads or Desktop, normally at least 30 days old, only when their name and
  surrounding folder do not suggest backup, export, recovery, source, or
  personal content;
- IDE extensions explicitly marked obsolete by their editor, or superseded
  versions when the currently active version is independently proven;
- canonical generated project artifacts such as `node_modules`, `.next`,
  `DerivedData`, build caches, and language build outputs when they are stale,
  ignored or reproducible, and no related build or editor process is using
  them;
- dangling container images identified by immutable ID. Never include volumes,
  container writable layers, databases, or VM disks.

Age is supporting evidence, not deletion authority. Omit uncertain items even
if they are large.

## Absolute Exclusions

Never include:

- any basename listed in the optional machine-local
  `~/.config/trashness/protected-names` file, matched case-insensitively at any
  path. Treat blank lines and lines beginning with `#` as comments;
- personal media, documents, source files, notes, databases, archives described
  as backups/exports/recovery, or files inside personal knowledge stores;
- `.git`, untracked source, credentials, keys, tokens, auth state, browser
  history, cookies, profiles, service workers, site storage, or extension data;
- iCloud or other cloud-synced content, Time Machine data, mail stores,
  messaging archives, application databases, Docker volumes, or virtual disks;
- active downloads, open files, paths used by a running process, or targets
  modified after discovery;
- `/`, account home roots, `/System`, `/Library`, `/Applications`, `/Users`,
  `/private`, `/var`, mounted volumes, or any system/root cleanup requiring
  `sudo`;
- symlinked candidates or candidates whose parent chain resolves outside the
  approved local root;
- existing Trash contents unless each item is separately scanned, listed, and
  approved. Never empty Trash wholesale.

Do not use Mole, CleanMyMac, or another broad cleaner as the deletion engine.

## Discovery Workflow

1. Resolve the invoking user's real home and the exact requested roots. Refuse
   a root that is `/`, a home root, a system root, or an unresolved variable.
2. Load the machine-local protected-name list when present. Fail closed rather
   than delete a matching basename when the list cannot be read reliably.
3. Search read-only with bounded paths. Prefer `rg`, `find`, package-manager
   dry-runs, editor metadata, `lsof`, and process checks. Do not grant Full Disk
   Access or request `sudo`.
4. Canonicalize each candidate and reject symlinks, path traversal, protected
   roots, hard-linked protected files, and parent/child duplicates.
5. Record for every candidate: category, absolute path or immutable object ID,
   type, byte size, modification time, device/inode identity when applicable,
   reason, and proposed deletion method.
6. Deduplicate nested targets so approving a directory never also lists its
   children as separate removals.
7. Calculate exact totals from the final manifest.

## Approval Contract

Present one compact tree headed `Trashness`, grouped by parent folder and then
category. Show every absolute target, size, age, reason, and deletion method.
Also show:

- total targets and bytes;
- protected/skipped highlights, including every protected-name match;
- any incomplete scan or permission gap;
- a statement that approval causes permanent deletion and disk-space recovery.

Ask the user to approve all, approve a named subset, or cancel. Preserve the
exact manifest while waiting. If the candidate list changes materially, show a
new manifest and ask again.

## Deletion Workflow

After explicit approval in the current task:

1. Reduce the manifest to exactly the approved targets.
2. Immediately re-resolve and re-stat every filesystem target. Require the
   same absolute path, type, device/inode identity, and modification time. Skip
   any target that changed, disappeared, became a symlink, became open, or
   crossed a protection boundary.
3. Close no applications and kill no processes automatically. Skip active
   targets and explain them.
4. Permanently remove each exact, quoted target without globs, unresolved
   variables, recursive parent sweeps, privilege escalation, or a fallback to
   a broader directory. For an immutable package/container ID, remove only the
   approved ID.
5. Continue past individual failures without widening scope.
6. Verify each approved target is absent or the approved object ID no longer
   exists. Measure free space before and after as supporting evidence.
7. Keep a concise local operation record containing timestamp, approved
   manifest, outcome, and bytes reclaimed, but never secrets or file contents.

Approval authorizes the exact set once. It does not authorize newly discovered
items or future monthly runs.

## Monthly Automation Behavior

A monthly automation must invoke this complete workflow in a user-visible
Codex task. It performs discovery, presents the manifest, and pauses for the
user's approval. When the user approves in that task, it resumes and performs
the deletion and verification steps. If approval never arrives, it deletes
nothing. Every month requires fresh approval.

## Stop Conditions

Stop before deletion when:

- the user has not explicitly approved the exact current manifest;
- the scan is too broad to enumerate exact targets;
- identity or modification-time checks are unavailable for a target;
- a target contains mixed user data and cache/build data;
- permissions, open files, or path resolution make the result uncertain;
- safe permanent removal would require `sudo` or disabling a protection.

## Output Contract

Before approval: the `Trashness` manifest, totals, exclusions, and one approval
question.

After approval: deleted, skipped, and failed targets; verified bytes reclaimed;
the operation-record location; and any safe follow-up. Never claim completion
from the preview alone.
