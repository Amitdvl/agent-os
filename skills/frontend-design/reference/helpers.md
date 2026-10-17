# Bundled Helper Capabilities

Resolve `<SKILL_ROOT>` to this package's absolute directory and run helpers from
the target project's working directory. Do not assume `.agents/skills` exists in
the consuming project or invoke an upstream CLI to repair this combined package.

- `context.mjs` and `context-signals.mjs` read existing project context/signals.
  `critique-storage.mjs` reads or writes project-local critique records only when
  the requested review calls for it. These use Node built-ins.
- `detect.mjs` can scan local sources, but HTML parsing uses optional `htmlparser2`,
  `css-select`, `css-tree` and `domutils`. Without them, inherited detection can
  fall back to regex and miss structural/CSS issues. Report that limited scope.
- URL detection requires optional `puppeteer`. It is not included or installed by
  this package. Prefer the host's supported browser automation for live evidence.
- Live variants use the bundled live helpers and project-local `.impeccable`
  configuration/state. Read the live reference only for explicit live iteration;
  honor actual browser permissions and inspect the supported interface first.

No helper capability requires installing the upstream Impeccable CLI. Missing
optional dependencies are a reason to use an available inspection path or report
the evidence limit. Do not silently download a tool or change CSP/security settings.
