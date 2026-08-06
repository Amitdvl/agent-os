# Twin Synchronization

Treat the Agent OS source checkout as the privacy-preserving twin of reusable
local workflow behavior. When an agent changes a portable local tool, slash
command, reusable skill, policy, routing rule, allow rule, install/setup
contract, or tool inventory, it must update the matching Agent OS manifests,
templates, generated behavior, documentation, and tests in the same task.

Before completion, run Agent OS validation, its full tests, `git diff --check`,
and the configured twin audit against the owner machine's declared live sources.
Commit the intended Agent OS mirror change locally, then push it to the
configured Agent OS `origin` before completion. Never force-push or push
unrelated project work. If `origin`, authentication, or the push is unavailable,
report the exact blocker rather than claiming the change is published. A
machine-only item must be an explicit inventory exclusion with a reason, never
an undocumented omission.

Mirror only portable contracts. Never copy credentials, secret values, sessions,
private archives, recordings, identities, account data, or machine-specific
absolute paths. This is one-way synchronization from local workflow behavior to
portable source; it does not authorize deployment onto the owner machine.
