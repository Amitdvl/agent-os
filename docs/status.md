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

Pending final repository test run and completion audit. Exact commands and results will be recorded here after verification.

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

