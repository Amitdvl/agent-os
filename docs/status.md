# Status

The repository provides a portable, preview-first workflow. It has no live deployment dependency: testing uses isolated temporary homes only.

Current coverage includes manifest validation, core-only safe setup, six default core commands, full two-host deployment, central registry rendering, 20 tool templates, host symlink plans, generated allow rules, install dry-runs, fixture-only SOPS/age vault initialization/validation, a separate Codex command-cutover/rollback transaction, status/doctor distinctions, drift/conflict refusal, safe uninstall, and a fixture-backed production-repo baseline helper that safely foundations an empty directory without fabricating application CI.

Run these checks before a release:

```sh
npm run validate
npm test
git diff --check
```

Fresh-machine work still requires a person to install Node/hosts, review optional upstream sources, create their own vault and key, complete service logins, and grant any macOS permissions. Those are deliberate non-parity boundaries, not setup failures.
