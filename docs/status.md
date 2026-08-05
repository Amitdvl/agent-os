# Status

## Scope

Agent OS is being built and verified entirely inside this repository. No setup, update, uninstall, package installation, authentication, symlink, hook/rule change, or generated file has been applied to the current Mac's live agent configuration.

## Completed

- Effective workflow inventory and disposition map.
- Architecture, capability matrix, fresh-Mac walkthrough, and private-state boundary.
- Declarative manifests for profiles, packs, policies, tools, sources, commands, skills, compatibility, secrets, and inventory dispositions.
- Default `amit-strict` policy/profile.
- Portable first-party command and skill contracts.
- Preview-first setup/status/doctor/update/safe-uninstall implementation.
- Nontechnical quickstart, advanced, migration, and troubleshooting documentation.

## Known source-state findings

- The live 19-tool registry and skill links were healthy at audit time.
- The old live doctor used a stale hand-maintained tool list.
- The existing `agent-system` source mirror had 14 of 19 live tools and unrelated dirty work; Agent OS did not modify it.
- `/teach` existed in source but was not installed globally; Agent OS keeps it disabled by default.
- The commit/push popup hook was disabled and unloaded; Agent OS does not enable it.
- Several install sources remain `manual-unresolved`; automation stays disabled until provenance, exact version, and license are confirmed.

## Verification evidence

- `node bootstrap/cli.mjs validate --json` — passed with `ok: true`, zero errors, and zero warnings.
- `node --test tests/*.test.mjs` — 10/10 tests passed.
- The integration suite proved repository-sandbox-only dry run, apply, status, doctor, update preview, uninstall preview/apply, pre-existing instruction preservation, and fail-closed unowned-file conflicts.
- The manifest suite proved the default profile selects all five packs, all 19 audited tools and 89 installed skill entries have dispositions, all external tools have a source pin or explicit unresolved marker, portable assets contain no Amit-specific absolute path or embedded secret-looking value, and documentation links resolve.
- `git diff --check`, Node syntax validation, shell syntax validation, and final clean-worktree checks are part of the completion audit.

Local implementation commits:

- `b6281ea` — verified blueprint and inventory.
- `1befc3f` — portable manifests, policies, commands, skills, and templates.
- `16c8252` — guarded lifecycle CLI, guides, and sandbox tests.

## Future deployment checklist

1. Review the private repository diff and source/licensing records.
2. Test on a disposable macOS user account or separate Mac.
3. Run safe setup preview and inspect every destination.
4. Apply only the portable core/profile files.
5. Install desired external tools from newly verified upstream sources.
6. Create the new user's encrypted vault records and authenticate desired accounts.
7. Grant selected macOS permissions manually.
8. Run status/doctor and compare actual behavior in Codex and Claude Code.
9. Enable optional hooks only through a separate explicit deployment decision.

## Remaining limitations

- Fresh-Mac behavior has not been proven on another account or machine.
- External account authentication and macOS permission flows are intentionally not automated.
- Exact parity depends on host features and external tool availability.
- Unresolved or third-party skills/tools are declared rather than vendored.
