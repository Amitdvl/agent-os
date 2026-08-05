# Agent OS

Agent OS is an opinionated portable workflow for Codex and Claude Code. It packages policy, commands, skills, capability manifests, and a guarded installer without packaging credentials, sessions, archives, identity, or machine-specific state.

This repository is currently built and tested as an installable artifact only. It has not been deployed onto this Mac.

## The easy path: ask Codex

You do not need to understand local tools, registries, vaults, or shell commands.

1. Install Codex (or Claude Code) and sign in with your own account.
2. Clone this private repository, or give Codex its repository URL and ask it to clone it into a normal user-owned folder.
3. Open the cloned repository in Codex and paste this:

```text
I want you to onboard this Mac into Agent OS from the repository currently open.
I am nontechnical. First inspect the repository and prerequisites, then explain
the setup plan in plain English. Set up the safe core, verify it, and then set
up the default Agent OS capability packs and their shared tool instructions.
Use preview mode before each change and verify every completed step. Install a
local tool only through Agent OS's reviewed install flow and only after I have
explicitly confirmed that named tool. Create only my own independent vault
placeholders when a service needs them. Never copy another person's credentials,
browser data, sessions, archives, vault, identity, or personal files. Stop only
when I must sign in, approve a permission, choose an account, or decide whether
to install a specific optional tool. Finish by showing what is ready, what needs
my action, and the next simplest step.
```

Codex can then validate the repository, preview and install the safe core,
deploy the selected workflow instructions, check system readiness, and explain
missing tools in plain language. It does not need your secrets to do that.

## The few things only you can do

Agent OS deliberately pauses for personal actions that cannot be shared safely:

- sign in to Codex/Claude Code and any service you choose to use;
- approve OAuth, browser-extension, or macOS privacy prompts;
- decide whether to install an optional local tool;
- create your own encrypted-vault key and enter your own service credentials.

Those steps give you the same workflow structure and tool guidance without
copying another person's accounts, messages, browsing state, recordings, local
archives, or secrets.

## Manual path

If you prefer commands, use [the quickstart](docs/quickstart.md). The
[fresh-Mac walkthrough](docs/fresh-mac-walkthrough.md) explains every step;
[architecture](docs/architecture.md) and [inventory](docs/inventory.md) record
the underlying design and audit evidence.

## Maintainers: keep the twin current

Agent OS is the privacy-preserving twin of its owner's reusable local workflow.
When changing a portable local tool, slash command, policy, routing rule, or
setup contract, mirror that behavior into this repository in the same task and
run validation, tests, `git diff --check`, and the configured twin audit.
Machine-only items need an explicit exclusion; credentials, sessions, archives,
identities, and machine-specific paths must never enter this repository.
