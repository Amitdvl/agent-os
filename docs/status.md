# Status

The repository provides a portable, preview-first workflow. It has no live deployment dependency: testing uses isolated temporary homes only.

Current coverage includes manifest validation, core-only safe setup, six default core commands, full two-host deployment, an explicit-only book skill whose complete fixture-backed test suite installs to both hosts, central registry rendering, 24 tool templates including a pinned read-only Telgo channel-digest contract, guarded Silicon code-image generation, Pandoc conversion, and EPUBCheck validation contracts, host symlink plans, generated allow rules, install dry-runs, fixture-only SOPS/age vault initialization/validation, a separate Codex command-cutover/rollback transaction, status/doctor distinctions, drift/conflict refusal, safe uninstall, and a fixture-backed production-repo baseline helper that safely foundations an empty directory without fabricating application CI.

Run these checks before a release:

```sh
npm run validate
npm test
git diff --check
```

Fresh-machine work still requires a person to install Node/hosts, review optional upstream sources, create their own vault and key, complete service logins, and grant any macOS permissions. Those are deliberate non-parity boundaries, not setup failures.
