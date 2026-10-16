# Monochrome Workspace · 1.0.0

A reusable design kit extracted from the approved Launch Video Studio workspace. White surfaces, near-black controls and selection, compact system typography, fine neutral dividers. The interface gives the content room. This is a design system, not a video engine or format template.

## Use directly, without Impeccable or a skill

Copy this entire directory into your project, for example `design/monochrome-workspace/`. Open `example.html` in a browser (a file URL works), or serve it using your normal development server. It uses only local HTML/CSS/JavaScript: no packages, fonts, network requests or build step.

Tell any agent: “Use the Monochrome Workspace kit in `design/monochrome-workspace/`. Read DESIGN.md and reuse workspace.css and the example's component patterns. Preserve our product's behavior.” Link the kit from the target repo's AGENTS.md and keep it in version control.

Load `workspace.css`. Put the `mw` class on your application root, and use the `.mw-*` classes shown in the specimen. The stylesheet is scoped under that root or through prefixed classes. It has no unscoped body, button, input or typography reset. Include the `.mw` class when embedding a component in another surface. The source CSS custom properties are the runtime tokens; native DESIGN.md frontmatter is their agent-readable counterpart. Change them together when deliberately creating a derivative.

## Optional Impeccable integration

DESIGN.md follows the installed native six-section document profile with token frontmatter. `.impeccable/design.json` is its schemaVersion 2 sidecar, with scoped component snippets and motion/breakpoint metadata. Merge them into the target repo's root design context if appropriate. Keep product intent in PRODUCT.md. Impeccable can critique, distill or polish within these rules; it is not required to render or implement them.

## Contents and boundaries

- DESIGN.md: normative visual direction, tokens, components and interaction requirements.
- workspace.css: reusable scoped primitives and responsive shell.
- example.html / example.js: working, generic reference for rows, fields, tabs, disclosure, validation, selection and preview updates. Drafts survive tab changes. Persistence and application commands must come from the host.
- .impeccable/design.json: optional native metadata and representative snippets.
- kit.json: version, provenance, dependency and distribution contract.
- reference.svg: generic reference screenshot (embedded pixels in a text SVG for portable package installers).

The three-column layout is one composition. Use the same primitives in other arrangements. The sample content's typography is not a new control style. There are no film assets, company identities, private content or machine paths in this package. Authored media can use its own art direction.

## Adoption checks

Check 1440px desktop, 768px tablet and 390px mobile; no unintended horizontal overflow. Test visible keyboard focus, tab Arrow/Home/End behavior, touch targets, long text, errors and reduced motion. Check real host save/undo/history/export separately. Confirm application styles outside `.mw` are unchanged. Preserve existing workflows when simplifying controls.

Updates are explicit: record the adopted kit version, inspect changes, run host workflow checks and keep project-specific deviations documented. No auto-sync or runtime dependency on Agent OS is introduced.
