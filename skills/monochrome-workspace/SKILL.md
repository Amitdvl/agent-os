---
name: monochrome-workspace
description: Reuse the Monochrome Workspace design kit for clean white-and-black editors, inspectors, dashboards and workspaces. Use when the user asks for this named kit, the launch workspace aesthetic, or its reusable design system across projects. Impeccable is optional.
---

# Monochrome Workspace

Use the bundled [design kit](assets/kit/README.md). The files and code are the system; this skill only makes it discoverable. It has no Impeccable, HyperFrames, framework, network or package-install dependency.

1. Read the target project's instructions and existing design rules. Read [DESIGN.md](assets/kit/DESIGN.md) for this kit's direction; inspect [example.html](assets/kit/example.html) and [workspace.css](assets/kit/workspace.css) for concrete implementation.
2. Use the kit when requested or clearly intended; do not override an unrelated brand merely because this skill is available. Preserve application behavior and authored content.
3. Follow the adoption recipe in the README. Copy the complete kit into a repo-owned design directory; retain its version/provenance. Integrate only the relevant `.mw-*` primitives, or translate them into the host's existing components without importing global resets. No need to build a three-column editor for every product.
4. For Impeccable, merge the six-section native DESIGN.md and `.impeccable/design.json` into the target's design context deliberately, preserving other product guidance. For other agents, the same files, CSS and specimen are sufficient; no skill invocation is required.
5. Verify actual host workflows, focus, pending drafts, errors, contrast, reduced motion and responsive layouts. The sample JS demonstrates selection/tabs/preview only; it is not persistence, history or rendering infrastructure.

The canonical portable source is `skills/monochrome-workspace/assets/kit/` in Agent OS. Adopted projects own versioned snapshots; never silently restyle existing projects when the kit changes.
