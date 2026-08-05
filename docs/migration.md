# Migration Guide

Migrate only the repository checkout. On the new Mac, run the safe preview, apply the core, then add optional packs/tools deliberately.

Never migrate encrypted vault records, age identities, API keys, OAuth material, cookies, browser profiles, host sessions, archives, databases, recordings, account identifiers, or absolute paths. Create a fresh vault, install tools from reviewed sources, and authenticate each chosen account independently.

Existing host instruction text is preserved outside the Agent OS block. Existing command, skill, tool-link, or rule paths are conflicts until their owner is clear; do not delete a state ledger to bypass that protection.

Portable parity means equivalent safety decisions, commands, templates, freshness, and lifecycle behavior. It does not mean copied account authority or byte-identical host behavior.

For a controlled owner-machine transition from legacy command links, use the
separate `live-cutover` preview/apply flow with an explicit legacy root. It
manages only Codex `add`, `commands`, `teach`, and `trunk-finish` command links
plus the Agent OS local launcher and one exact global-guidance sentence. Its independent rollback flow restores
only the recorded, undrifted transaction; it never adopts unrelated tool links.
