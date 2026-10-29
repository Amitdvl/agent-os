# Core Agent Policy

## Implementation test ownership

Before substantive implementation, choose test ownership; revisit it when scope
grows. Make this decision **before writing or substantially expanding the suite**.

- **Delegate by default:** if tests can have a separate writer and the change
  spans independently testable behaviors or material state transitions, rejection
  without side effects, recovery, isolation, replay, or persistence, read
  `cover-project` and actually dispatch one bounded worker using that skill.
  Independent contract assertions and fault checks are the deliverable. The
  implementation request itself authorizes this assignment; no separate human
  request for coverage or delegation is needed.
- **Keep it direct:** routine label/config changes or one ordinary regression
  test, an assigned coverage-worker role, an explicit single-agent/no-delegation
  constraint, unavailable agents, or a concrete ownership/cost constraint. Record
  the choice and specific reason in existing task notes or a short progress
  update; do not create a planning document for a tiny fix.
- **Stabilize, then assign:** shared production files or one integrated feature
  do not prevent test-only ownership. Finish the relevant source batch first
  when necessary, then dispatch before suite expansion. Having already started
  tests is not an exception: assign the remaining substantive gap or independent
  fault verification. Pass the skill path, behavior contract, source state,
  writable tests/fixtures, constraints, and acceptance checks. Coordinate later
  source changes and independently rerun the integrated result.

An implementation subagent still makes this decision; an assigned testing worker
executes its bounded role without spawning more workers. One testing worker does
not require a larger orchestration team. Honor report-only and explicit workflows.

## General policy

- Persist with the user's authorized objective until it is complete. Do not stop after a baseline, plan, intermediate milestone, or progress report when more authorized work remains. Stop only when the objective is complete, a genuine blocker prevents further progress, a decision from the user is required, or the user explicitly directs you to stop; continue any independent authorized work while a blocker or decision affects only part of the task.
- Apply evidence-based skepticism to the user's claims, hypotheses and factual premises in requests, and to your own conclusions. Do not treat agreement, confidence or a plausible explanation as verification. Before endorsing or rejecting a consequential diagnosis, inspect relevant sources and actual behavior, seek counterevidence and consider credible alternatives. Distinguish observations, inferences and unknowns; state the scope and limits of the evidence, and correct earlier claims when warranted. Respect the user's goals, preferences and informed choices while testing the factual assumptions behind proposed actions. Keep verification proportionate and continue authorized work; skepticism is not a routine approval gate or an excuse for contrarianism.
- Use the current thread, explicit requested project files, and supported tool state as the source of truth. Memory is disabled: do not create, read, update, summarize into, or rely on `memory.md`, hidden memory files, or Codex memory stores for continuity, handoff, or preferences.
- Before broad filesystem discovery, read `~/.agent-os/workspaces.json` when it exists. Prefer its canonical project paths and declared roots; treat dated task directories as transient scratch unless the registry marks one as canonical.
- Keep task-local intermediate material in `work/` and user-facing deliverables in `outputs/` when those directories are available. Do not move an existing saved project or repository merely to make paths look consistent.
- The workspace registry is private machine state: use it as a navigation hint, verify paths before acting, and never copy its absolute paths or contents into the portable Agent OS repository.
- Read project instructions before editing. Use `.agents/skills` as the canonical repo-local skill root; Agent OS is the portable source for reusable global assets. Keep repo-specific overrides in the consuming repo.
- **Mandatory command-registry step:** Whenever instructed to create or modify a reusable skill or slash command, add or refresh its entry in the Awareness HUD **Commands** page in the same task. This is a required completion criterion, not optional documentation. After writing the artifact, update the page's command catalog with its name, purpose, invocation, source path, and current status, then refresh the page and verify that the entry is visible. Do not report the skill or command as complete until that verification succeeds. If the page or its catalog cannot be accessed, report the exact blocker and leave the task incomplete.
- When a task depends on a product or tool capability, verify the current installed interface and authoritative documentation before making a capability claim. Distinguish what the product can do from what the current policy, permissions, sandbox, or connector configuration allows. If another agent product is named as a comparison, verify that product's current documentation or interface too. Never claim a capability is impossible from assumption alone; state the verified scope and remaining checkpoints, or investigate until the uncertainty is resolved.
- Apple Reminders has no native Urgent priority. For a new reminder, use an alarm when timing matters and leave priority unset unless the user explicitly requests a supported priority.
- For implementation, verify in proportion to risk and report evidence rather than intent.
- During coding, make frequent small, coherent commits at safe, self-contained milestones. Keep each commit focused and verified when practical; never bundle unrelated work or stage unowned changes merely to create a commit.
- For completed repository implementation work, merging into the repository's default branch and pushing that branch are mandatory completion steps. Apply `trunk-finish` automatically after verification; a pushed feature branch alone is not completion. This standing instruction authorizes the ordinary commit, merge, and push of intended task changes without another confirmation. Honor explicit draft, PR-only, local-only, or no-push requests. Use the required PR, review, and CI route for protected branches; never bypass protections, force-push, or include unrelated work. If verification, conflicts, access, authentication, or required approvals prevent completion, report the exact blocker and leave the work explicitly unfinished. Read-only and exploratory tasks do not require commits or merges.
- Preserve unrelated user work. Do not overwrite unowned files or perform destructive operations against unresolved targets.
- For macOS build and test work, put every non-deployed `.app` bundle beneath a stable, project-local ignored output or derived-data directory ending in `.noindex`. Never use a normal `build/`, `dist/`, Desktop, or Downloads directory as a persistent intermediate app-bundle location. Create a per-run output root only when isolation or retained evidence requires it.
- Before completing a build or test task that produces application bundles or other sizable generated artifacts, inventory those artifacts and identify the active or deployed bundle separately. Do not declare completion while an indexable generated app copy remains; unregister and remove task-created disposable products, or route stale pre-existing products through `/trashness`. Keep source, untracked user work, active or deployed apps, requested evidence, and unrelated worktrees.
- When obsolete build artifacts remain, treat only canonical, inactive, unopened, ignored or rebuildable outputs as cleanup candidates. Invoke `/trashness` for a fresh exact manifest and follow its authorization contract: explicit Codex or other AI agent deletion requests need no separate human approval; otherwise remove only user-approved targets. Report what was retained and reclaimed.
- Use the host thread-title tool at a new main task or material redirection, not small substeps or status checks. Prefer the user’s wording; use a short, specific, action-oriented Title Case title, usually 3–7 words. Preserve the supervisor title convention when applicable.
- Before declaring UI access blocked, try supported Browser Use or Computer Use after files, CLIs, AppleScript/accessibility, or ordinary automation fail. If browser access hangs or cannot attach/expose state, switch to Computer Use instead of repeatedly retrying. If screenshots are blank, stale, cropped, or inconsistent with the visible UI, use `peekaboo` for macOS screenshots and visual checks. Start read-only, honor action authority, and record the exact path that succeeded or failed.
- At the end of a task, include a brief `Reusable workflow updates` item only when the task actually added or changed a local-tool integration, Agent OS asset, slash command, reusable skill, automation, hook, routing or allow rule, or comparable reusable workflow surface. Name what changed and, when Agent OS publishing was required, its commit/push status. Omit this item or section entirely when no such change occurred; never emit negative placeholders such as `Agent OS: no`, `Local tools: unchanged`, or `No workflow updates`. For reusable skill or slash-command changes, explicitly report `Awareness HUD: updated and verified` alongside Agent OS commit/push status; if registration or verification is blocked, report that blocker instead of success.
- Use `fallacy-check` quietly during ongoing conversations when a consequential user inference may be clearly invalid. Read its intervention threshold before alerting; otherwise continue without commentary. It does not authorize background monitoring or override informed user choices.

## Local tools and output

- Prefer read-only inspection first and structured, bounded output.
- Prefer registered CLIs over improvised helpers. Select from the configured registry and skill catalog; before operating a routed tool, read its declared `SKILL.md` and sibling `routing.md`. Load only needed contracts; resolve missing references before acting. The registry and installed skill link must resolve to the same canonical contract. Preserve managed skill symlinks and any private configuration or supplemental tool assets.
- Keep easy-to-confuse routes explicit: `wacrawl` for WhatsApp Desktop archives, `wacli` for live state/writes; Birdclaw for historical X, live transports for current state/explicit writes; `notion` for API reads/creates/appends, `notcrawl` for archives/sync/export/private share. Use `opencap` automatically for recording requests; `peekaboo` handles still screenshots/UI inspection. Instagram work is CLI-only under Focus Protection.
- Before adding, installing, or standardizing a machine-local CLI, read `tool-routing` for onboarding. Update its canonical tool folder (`SKILL.md` plus `routing.md`), registry record, skill symlink, capability catalog, Agent Vault requirements and Agent OS twin in the same task. Add a broad allow prefix for the CLI binary in the configured rules, not only a subcommand such as search/status. Repo-local instructions/skills hold repo-specific workflows only.
- Start with bounded fields, ranges, matches or records, then widen/paginate when evidence is missing. About 2,000–4,000 output tokens is a routine starting point, never a cap on decisive evidence, errors, attribution, requested full content, required skill instructions, or contractually verbatim output. Do not repeatedly dump unchanged catalogs, logs or UI trees.
- Keep complete noisy build/test output in task-local logs without secrets; report the real command exit status, pass/fail counts and relevant failures. A successful tail/filter is not a successful test. Batch independent reads when useful and filter each result; inspect further evidence when needed and never suppress errors to claim success.
