# Consolidated Development Skills

Three canonical packages replace overlapping discovery entries:

| Skill | Scope | Distribution |
| --- | --- | --- |
| systematic-debugging | Evidence-led investigation, explicit edit scope, hypothesis tests and fix verification | core |
| react-best-practices | React/Next.js rule references and a concise review checklist | core |
| frontend-design | Creation, UX review and polish with focused references and optional helpers | creator |

Each package includes source metadata and a command catalog entry with invocation,
purpose, installed status and source path. Bundled references/helpers travel with
the package; runtime project state and account data do not.

Gstack is retired, including its root entry and linked skills. No installer or
portable package depends on it. This removal does not weaken standing safety or
focus policy. Debugging scope is declared honestly as an edit boundary, with no claim
that a removed hook enforces it.

On the owner host, use namespaced `name` selectors for duplicate plugin skill
entry points and file `path` selectors for local skills. The desktop configuration
API uses that distinction. A plugin path override alone can leave its namespaced
entry enabled. Verify `skills/config/write` effective state and force-reload
`skills/list`; do not infer desktop discovery from a filesystem scan alone. A
standalone app-server may omit the desktop's remote plugin catalog: label
configuration-state verification separately from visual catalog verification.
Keep vendor caches intact for retained plugins. Exact versions and absolute paths
are private host configuration. After plugin updates, recheck discovery and
collisions. Audit parsing must accept valid TOML key order, including `enabled`
before `name` or `path`. Retired standalone copies stay outside discovery roots;
retire only their own stale installer records and dependent host symlinks so
shared targets do not leave dangling aliases.

## Additional retirement and retention

| Retired entry | Canonical destination |
| --- | --- |
| Superpowers workflow pack | Debugging package plus orchestration planning/delegation/review and cover-project regression/assertion references, with MIT attribution |
| Build Web Apps Supabase/Postgres duplicate | Installed Supabase plugin, whose newer rule set supersedes the older copy |
| Standalone Sentry | Installed Sentry plugin |
| Standalone Remotion | Official Remotion plugin; useful unique concepts summarized in launch-video-studio's explicit Remotion supplement |
| Standalone and pack subagent-driven-development | Orchestration's focused delegation reference |

Superpowers contains useful material. Retirement removes overlapping activation,
mandatory phase approval and completion menus; it preserves useful reasoning and
verification guidance without a pack runtime dependency. The Remotion supplement
retains map determinism, text reveal/emphasis, caption normalization and trim-unit
checks; it defers API details to the installed official plugin and avoids stale
example code. An explicitly selected Remotion project never silently becomes a
registered-studio project. Studio requests retain the existing remote-primary
resolver contract.

Do not deploy Agent OS back to an owner host merely to synchronize the twin. Apply
the explicitly authorized local changes directly, then verify the source twin.
The frontend package resolves helper paths from its own skill root while preserving
existing .impeccable project data formats. Upstream automatic update instructions
must not overwrite the combined package.
