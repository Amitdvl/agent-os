---
name: launch-video-studio
description: Create or edit launch videos and product demo videos using the registered managed local studio, including named video templates or formats such as imessage and iMessage conversation videos.
---

# Launch Video Studio

Use the installed studio's format catalog to discover reusable video starting points. A request for an “iMessage video,” “imessage template,” or “imessage format” selects the same canonical format; the current catalog owns aliases, capabilities, defaults, and verification limits. Do not require the user to invoke this skill explicitly or remember a repository path.

## Explicit Remotion projects

When the user explicitly selects an existing Remotion project or asks for Remotion,
use the installed Remotion plugin and that project's instructions. Consult the
optional [Remotion supplement](references/remotion-supplement/index.md) for retained
map, text, caption and trim concepts. This branch does not resolve or create a
studio, change the chosen stack, or authorize an installation. General studio
requests continue through the registered-primary route below.

## Locate and discover

Run this skill's `scripts/resolve-studio.mjs --json` with Node. Discovery is read-only. It returns the registered package location plus either `mode: "managed"` or `mode: "development"`. It honors an explicit `LAUNCH_VIDEO_STUDIO_ROOT` first. Otherwise it reads the active `launch-video-studio` record in the private `~/.agent-os/workspaces.json`.

A managed record declares `managedRoot`, an absolute host-local installation folder, and `controller`, the absolute trusted bootstrap controller file (or the canonical project's `scripts/managed-studio.mjs`). The resolver validates the installation and active software ownership markers and returns `root`, `managedRoot`, `controller`, `libraryRoot`, and `revision`. A registered managed installation supersedes obsolete remote-primary routing. An invalid managed installation fails closed; repair it through its registered controller, rather than silently authoring in another checkout. A registered controller ancestor alias resolves to its canonical file before being returned. Paths and ownership state remain private machine configuration. Read the resolved repository’s `AGENTS.md` before controller or editing operations.

For a new routine installation, use durable host-local storage outside development checkouts, scratch folders and software-version directories. The controller's default is `.launch-video-studio` inside the current user's home folder on either host. Preserve explicitly chosen existing installation roots; repair does not authorize moving films or silently switching libraries. Development `work/` acceptance fixtures are not the routine installation. Register the actual owned installation only after its active software is verified and available.

For managed routine work, run Node on the returned `controller` with `open --root <managedRoot>`. This built-in-only controller checks the verified release, prepares project-local dependencies, checks health, and returns the local server's port/revision. After `open`, run discovery again: startup may update or fall back. Require the new discovery `revision` to match `open`’s daemon revision, and use that current `root` for the client and guides; report a mismatch instead of executing the previously discovered software. Run that software's `workspace/client.mjs` with `--url http://127.0.0.1:<port>` for ordinary create/open/edit/drafts/assets/preview state/export operations. Use `catalog` for current formats and films; use the live harness only for format guides, checks and inspection. Film data lives under `libraryRoot/projects`; never create or edit films in the installed software's checkout. Use the same local server as the user so CLI and UI share serialization and durable state.

Client commands include `sync <film> --operation status|enable|now|continue|recover|diagnostics`, `open <film> --takeover true` for an explicitly requested handoff, and `managed status|update|retry|restart`. Enable sharing once per chosen film, then saves upload automatically. `recover` retains divergent versions as separate films; inspect its structured `recoveredName`. Read state/capabilities and current source versions before commands. Preserve browser drafts and valid history; do not bypass ownership guards or fix conflict state with raw Git resets/force pushes. A pending/offline result is durable local work, not proof it reached another computer.

If startup or dependencies fail, use the registered controller's `doctor`, `update --retry` and `open` with the same root. These operate within the owned installation and retain prior working software; no global tools or system settings are authorized by this workflow. If access, storage or creative conflicts need a human decision, report the exact code and next step. Never create a verified-release marker or claim another host passed from assumption.

Development records retain the canonical-project behavior. A private `remotePrimaryProjects` record without a managed local installation names the saved destination host/project and refuses silent backup authoring. Explicit environment overrides deliberately select a development checkout; do not use them to bypass ordinary managed routing. If no registration exists, report that setup/registration is needed; do not choose a similarly named scratch folder or bulk-migrate films.

Read that repository's `AGENTS.md`, then query the live catalog:

```sh
npm --silent run studio -- formats --json
npm --silent run studio -- formats "<requested format or description>" --json
npm --silent run studio -- format imessage --json
```

For an explicitly named format, resolve its canonical entry and read its returned guide before creating anything. For an open request, choose the matching format from catalog evidence. If the requested format is absent, explain the nearest available option or the missing capability; never silently treat an unknown name as the generic starter. Do not maintain another fixed format list in this skill.

## Make and adapt

In a managed installation, create through the running workspace client with `create <project-name> --format <canonical-id> --url <returned-local-url>`. In an explicitly selected development checkout, create through the harness, for example:

```sh
npm --silent run studio -- create <project-name> --format imessage
```

`--template` is a synonym for `--format`. Follow the format guide for its inputs and shape. Adapt the copied project to the user's product, story, assets, and reading time; sample content is demonstration material, not product truth. Existing videos are editable projects, not templates to overwrite. Native HTML and timelines remain the editable master. In managed installations, use the shared workspace for mutations, previews and exports; use read-only harness checks/snapshots against the absolute library film path. In development checkouts, use the repository’s source ownership, preview, check, snapshot and render commands. Do not invent another editor or drive the UI for ordinary authoring.

Read the repository README and relevant returned guides for the installed command syntax. Verify the chosen output shape, actual rendered frames, and audio as appropriate, and report the difference between a template's supported profiles and what has actually been checked for this film. Keep source/assets editable and deliver the export in the current thread. This skill does not authorize purchases, deployment, or public publication.

On Windows PowerShell, use `npm.cmd` in place of `npm` when script execution policy blocks the npm shim. Speech setup and singing availability are host-specific; read the repository audio documentation and installed state rather than treating saved song playback as proof of song-generation support.
