# Fresh Mac Walkthrough

This is the intended nontechnical journey. It is a specification until tested on a separate macOS account or machine.

1. Install Git and Node.js 20 or newer. If Homebrew is preferred, install it from its official website and then install Node. Agent OS never asks an agent to run an unreviewed remote shell installer.
2. Clone the private `agent-os` repository into a normal user-owned directory.
3. Open Terminal in the repository and run `./bin/setup --profile amit-strict --safe`. This previews every destination and reports missing external tools. It changes nothing.
4. Review the selected packs. Keep all packs for Amit-equivalent behavior or remove packs that the new user does not want.
5. Run `./bin/setup --profile amit-strict --safe --apply` only after reviewing the plan. This installs Agent OS-owned instructions and skills; it does not install external tools or log into accounts.
6. Run `./bin/doctor`. Follow only the named setup steps for desired integrations.

## Human checkpoints

- Sign into Codex and/or Claude Code through their supported user flows.
- Install desired external CLIs from the pinned/manual sources listed by doctor.
- Create a separate encrypted secret store and populate only the named requirements for selected services.
- Complete Notion, WhatsApp, Discord, X, Reddit, Instagram, Spotify, OpenCLI, OpenCap, or Vox login only for selected packs.
- Grant Reminders, Accessibility, Screen Recording, Automation, or browser-extension permissions in macOS System Settings when a selected tool needs them.
- Review the distraction/focus profile before enabling enforcement on another person's Mac. The profile contains no unblock mechanism.
- Review telecom disclosure, consent, recording, and provider configuration before enabling Vox.

## Verification

Run `./bin/status` and `./bin/doctor --json`. A healthy core means manifests, rendered policy, and managed files are valid. Optional tools may remain “missing” without making core unhealthy. Authenticated channels are never considered configured merely because a binary exists.

## Migration from Amit's Mac

Do not copy `~/.codex`, `~/.claude`, browser profiles, application-support directories, local archives, Agent Vault records, or tool-owned state. Clone Agent OS, apply the profile, install dependencies, and authenticate each account independently.

