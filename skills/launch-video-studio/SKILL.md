---
name: launch-video-studio
description: Create or edit launch videos and product demo videos using the registered primary studio, including named video templates or formats such as imessage and iMessage conversation videos.
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

Run `scripts/resolve-studio.mjs` from this skill with Node. It resolves `LAUNCH_VIDEO_STUDIO_ROOT` when supplied, otherwise the active `launch-video-studio` canonical project in the private `~/.agent-os/workspaces.json`, and verifies the repository's package identity and harness. Use the returned directory as the working directory. If neither configuration exists, report that the studio checkout needs to be registered; do not substitute a similarly named scratch directory or create a new studio.

A private registry may declare this studio under `remotePrimaryProjects` with `hostLabel` and `projectLabel`. The resolver then stops with the saved project to open on that machine, even if a retained local copy exists. Respect that routing: do not silently author on the backup, assume a remote shell, or start another studio. Use supported host access within the user's authorization; otherwise direct them to the named project. An explicit `LAUNCH_VIDEO_STUDIO_ROOT` is a deliberate local override. Machine labels and paths stay in the private registry, never in this portable skill.

Read that repository's `AGENTS.md`, then query the live catalog:

```sh
npm --silent run studio -- formats --json
npm --silent run studio -- formats "<requested format or description>" --json
npm --silent run studio -- format imessage --json
```

For an explicitly named format, resolve its canonical entry and read its returned guide before creating anything. For an open request, choose the matching format from catalog evidence. If the requested format is absent, explain the nearest available option or the missing capability; never silently treat an unknown name as the generic starter. Do not maintain another fixed format list in this skill.

## Make and adapt

Create through the harness, for example:

```sh
npm --silent run studio -- create <project-name> --format imessage
```

`--template` is a synonym for `--format`. Follow the format guide for its inputs and shape. Adapt the copied project to the user's product, story, assets, and reading time; sample content is demonstration material, not product truth. Existing videos are editable projects, not templates to overwrite. Native HTML and timelines remain the editable master; use the repository's source ownership, preview, check, snapshot, and render commands rather than inventing another editor or driving the UI for ordinary authoring.

Read the repository README and relevant returned guides for the installed command syntax. Verify the chosen output shape, actual rendered frames, and audio as appropriate, and report the difference between a template's supported profiles and what has actually been checked for this film. Keep source/assets editable and deliver the export in the current thread. This skill does not authorize purchases, deployment, or public publication.

On Windows PowerShell, use `npm.cmd` in place of `npm` when script execution policy blocks the npm shim. Speech setup and singing availability are host-specific; read the repository audio documentation and installed state rather than treating saved song playback as proof of song-generation support.
