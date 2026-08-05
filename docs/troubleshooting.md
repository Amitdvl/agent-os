# Troubleshooting

## Node is missing or too old

Install Node.js 20 or newer through a reviewed local package manager, then rerun validation. Agent OS does not install Node itself.

## Setup reports a conflict

The destination exists without matching ledger ownership, or a managed file drifted. Do not delete it automatically. Review the file, choose which system should own it, and move or merge it manually before re-running preview.

## An external tool is missing

Core can remain healthy while optional tools are missing. Review the source record in `manifest/sources.json`, verify current upstream documentation and license, install deliberately, then rerun doctor. `manual-unresolved` means installation must not be automated yet.

## Authentication is missing

Binary presence does not prove login. Follow the declared human checkpoint and use the new user's own account or encrypted vault. Never paste secrets into chat or copy Amit's credential directories.

## macOS permission is missing

Grant the narrow permission in System Settings only when the selected tool needs it. Agent OS does not click permission dialogs or modify privacy databases.

## Update or uninstall refuses drift

This is intentional. Compare the current file/block with its backup and ledger entry. Preserve user edits, then explicitly reconcile ownership. Do not delete the state ledger to force removal.

## Focus policy blocks an action

Agent OS contains no unblock mechanism. It may verify, restore, or strengthen the protection.

## Doctor says “not installed”

Repository validation can still pass. Run a setup preview, review it, and apply only when you intend to configure that machine.

