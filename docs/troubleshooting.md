# Troubleshooting

## Preview shows a conflict or drift

Do not delete the existing path. An unowned file, changed managed file, or changed symlink target is deliberately protected. Inspect ownership, preserve user work, and rerun the preview after reconciling it.

## Doctor says a CLI is absent

Core setup can still be healthy. Run `agent-os install --tools <id>` to see the reviewed source plan. `manual-unresolved` means Agent OS will not automate that installation.

## Doctor says a vault requirement is missing

Run `agent-os vault init --tools <id>` for a no-write plan. Create a new user vault; do not paste secrets into chat or copy a previous vault. `vault validate --verify-crypto` verifies through SOPS without printing plaintext.

For an existing Agent Vault, use `agent-os vault bind --kind agent-secrets --root <absolute-path>` first without `--apply`. Review the metadata-only plan, then repeat with `--apply`. An inventory or env filename in `status --json` means only `present-unverified`; run the tool's own preflight when authenticated work is actually requested.

If the same unqualified skill name is visible from multiple enabled roots, disable the non-canonical exact `SKILL.md` path with a Codex `[[skills.config]]` entry and run `twin-audit` with `--live-codex-config`. Preserve shared `.agents/skills` packages used by other harnesses; do not delete them just to clean Codex discovery.

## Doctor says a human checkpoint remains

Complete the tool’s supported login, browser extension, account consent, telecom consent, or narrow macOS permission manually. Agent OS never clicks these dialogs or imports sessions.

## `--safe` does not show optional tools

That is intentional. It applies only the portable core and cannot run installers or SOPS/age. Use a normal preview for optional packs after the core is working.

## Uninstall refuses

Uninstall removes only unchanged ledger-owned files and links. It retains backups and non-secret configuration, so a user can recover rather than force removal.
