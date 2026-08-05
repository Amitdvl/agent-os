# Troubleshooting

## Preview shows a conflict or drift

Do not delete the existing path. An unowned file, changed managed file, or changed symlink target is deliberately protected. Inspect ownership, preserve user work, and rerun the preview after reconciling it.

## Doctor says a CLI is absent

Core setup can still be healthy. Run `agent-os install --tools <id>` to see the reviewed source plan. `manual-unresolved` means Agent OS will not automate that installation.

## Doctor says a vault requirement is missing

Run `agent-os vault init --tools <id>` for a no-write plan. Create a new user vault; do not paste secrets into chat or copy a previous vault. `vault validate --verify-crypto` verifies through SOPS without printing plaintext.

## Doctor says a human checkpoint remains

Complete the tool’s supported login, browser extension, account consent, telecom consent, or narrow macOS permission manually. Agent OS never clicks these dialogs or imports sessions.

## `--safe` does not show optional tools

That is intentional. It applies only the portable core and cannot run installers or SOPS/age. Use a normal preview for optional packs after the core is working.

## Uninstall refuses

Uninstall removes only unchanged ledger-owned files and links. It retains backups and non-secret configuration, so a user can recover rather than force removal.
