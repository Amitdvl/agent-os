# PDF and Markdown delivery

## Runtime and preflight

Use Python 3 with `reportlab` and `pypdf`. Prefer the host's bundled workspace runtime when present; resolve it through `load_workspace_dependencies`, never hardcode another machine's paths. Verify imports before writing. No service credentials or new CLI are needed.

Use the host PDF skill for artifact lifecycle requirements and visual verification. Resolve its artifact marker if that runtime requires one. Render staged PDFs with available Poppler `pdftoppm` or an equivalent local PDF renderer and inspect every page.

The bundled renderer uses ReportLab's Vera font. It fails explicitly on unsupported glyphs rather than substituting unreadable squares. For scripts such as Hebrew, Arabic, or CJK, use a compatible font/shaping renderer and verify text and layout; do not transliterate or silently change the commission's language. If no suitable renderer is available, report the precise missing capability. The default helper is tested for Latin-script publications.

## Manuscript

Start with one `# Title`. Use paragraphs, optional `##`/`###` headings, flat bullet or numbered lists, `*italic*`, `**bold**`, inline code, and `[titled links](https://example.org/path)`. Finish with a compact `## Sources` section (the helper also recognizes `## References`). Sources must remain terminal. No frontmatter, raw HTML, images, tables, fenced code, nested lists, footnote syntax, or indented blocks. Use prose comparisons and inline links instead. URLs containing parentheses need percent-encoding.

The helper counts 300–1,000 body words, including headings and list text, excluding the first title and terminal sources. Its count treats contractions and hyphenated words as single words. Check source content editorially: references cannot contain uncounted explanatory passages.

## Stage, inspect, publish

Resolve `PAMPHLET_SKILL` to the installed skill root and `PAMPHLET_PYTHON` to a Python runtime with the verified dependencies. Create one unique temporary workspace, such as with Python `tempfile.mkdtemp(prefix="codex-pamphlet-")`, and retain its exact path for scoped cleanup. Store a small `run.json` there with the subject, intake answers, chosen units, sources, review status, and output paths; never record private reasoning.

Inspect `scripts/build_pamphlet.py --help`. Stage each revised manuscript:

```sh
"$PAMPHLET_PYTHON" "$PAMPHLET_SKILL/scripts/build_pamphlet.py" "$PAMPHLET_WORK/manuscript.md" --output-dir "$PAMPHLET_WORK/staged" --stem topic-name
```

Use the exact paths returned by the helper; collisions may change the stem. Check PDF text, render every page into the temporary workspace, and visually inspect readability, spacing, headings, links, and glyphs. Do not assume successful text extraction proves good layout. If repaired, repeat the build and inspect the latest pair.

After all units in a series pass review, publish the inspected pair without rerendering:

```sh
"$PAMPHLET_PYTHON" "$PAMPHLET_SKILL/scripts/build_pamphlet.py" "$PAMPHLET_WORK/staged/topic-name.md" --publish --output-dir "$PAMPHLET_DEST"
```

`--publish` requires the same-stem PDF beside the staged Markdown. It copies exact inspected bytes, verifies PDF text against the Markdown, uses a shared available stem for both outputs, checks the delivered pair, and rolls back its own pair on ordinary failures. It never replaces existing files. Abrupt process termination can leave a single member of a pair; inspect that run's known paths on recovery and repair only its own output. A multi-pamphlet commission is complete only when every requested pair is delivered and verified; report partial delivery honestly if a later unit fails.

After final verification, delete only the exact temporary workspace created for this run. Retain no drafts, research ledger, build receipt, or preview images in the final library. On failure, preserve recoverable state. Final publications and project instructions are the only durable project files.

## Maintainer checks

Run `PYTHONDONTWRITEBYTECODE=1 <python> -m unittest discover -s tests -p 'test_*.py' -v` from this skill root using a runtime with the dependencies. Tests cover counting, unsupported input, PDF text/links, existing outputs, exact staged publication, and failure rollback. Agent OS additionally tests complete installation into isolated Codex and Claude homes. Reader-intake behavior requires an independent scenario review, since file assertions cannot establish agent behavior.
